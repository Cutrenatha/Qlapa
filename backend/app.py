import os
from datetime import timedelta
from tempfile import NamedTemporaryFile

from functools import wraps
import csv
import io

from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

import midtransclient
import hashlib

print("Midtrans Server Key Loaded:", "Yes" if os.environ.get("MIDTRANS_SERVER_KEY") else "No")
print("Midtrans Client Key Loaded:", "Yes" if os.environ.get("MIDTRANS_CLIENT_KEY") else "No")

# Initialize Midtrans Snap client
midtrans_snap = midtransclient.Snap(
    is_production=False,
    server_key=os.environ.get("MIDTRANS_SERVER_KEY"),
    client_key=os.environ.get("MIDTRANS_CLIENT_KEY")
)

from models import db, User, Product, Order, OrderItem, ChatMessage, Review, CartItem, AIChatSession
from ai_client import (
    ai_suggest_product_fields,
    analyze_product_image,
    generate_ai_description,
    get_recommendation,
    chat_with_ai,
)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

# Support DATABASE_URL from Railway/Render (PostgreSQL) or fallback to local SQLite
db_url = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'qlapa.db')}")
# Fix Railway's postgres:// → postgresql:// (SQLAlchemy 1.4+)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "qlapa-dev-secret-change-me")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

CORS(app, resources={r"/api/*": {"origins": "*"}})
db.init_app(app)
jwt = JWTManager(app)

CATEGORIES = [
    "Ampas",
    "Tempurung",
    "Sabut",
    "Daun",
    "Air Kelapa",
    "Cocopeat",
    "Cocofiber",
    "Briket Arang",
    "Arang Aktif",
    "Nata de Coco",
    "Minyak Kelapa",
    "VCO",
    "Tepung Kelapa",
    "Kerajinan Kelapa",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def current_user():
    uid = get_jwt_identity()
    if uid is None:
        return None
    return db.session.get(User, int(uid))


def save_image_file(image_file):
    """Simpan file gambar yang diunggah ke folder uploads dan kembalikan URL-nya."""
    uploads_dir = os.path.join(BASE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    _, ext = os.path.splitext(image_file.filename)
    if ext.lower() not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]:
        ext = ".png"
    with NamedTemporaryFile(delete=False, suffix=ext, dir=uploads_dir) as tmp:
        tmp_path = tmp.name
        image_file.save(tmp_path)
    return f"/uploads/{os.path.basename(tmp_path)}"


def admin_required(fn):
    """Decorator: hanya akun dengan is_admin=True yang boleh mengakses."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user or not user.is_admin:
            return jsonify({"error": "Akses admin diperlukan"}), 403
        return fn(*args, **kwargs)
    return wrapper


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@app.post("/api/auth/register")
def register():
    """Satu jenis akun untuk semua orang. Setiap akun baru otomatis bisa
    berbelanja (buyer). Untuk berjualan, user tinggal 'Buka Toko' kapan saja
    dari akun yang sama — lihat endpoint /api/store/open."""
    data = request.get_json(force=True)
    required = ["name", "email", "password"]
    if not all(data.get(f) for f in required):
        return jsonify({"error": "Nama, email, dan password wajib diisi"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email sudah terdaftar"}), 409

    user = User(
        name=data["name"],
        email=data["email"],
        role="buyer",
        phone=data.get("phone"),
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json(force=True)
    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not user.check_password(data.get("password", "")):
        return jsonify({"error": "Email atau password salah"}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})


@app.post("/api/auth/google")
def google_login():
    import json
    import urllib.request
    import uuid
    data = request.get_json(force=True)
    credential = data.get("credential")
    if not credential:
        return jsonify({"error": "Google ID Token wajib disertakan"}), 400
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            token_info = json.loads(response.read().decode("utf-8"))
        aud = token_info.get("aud")
        expected_aud = "476986015276-805dhprpatpn6o8ij3dejv6efusrcauv.apps.googleusercontent.com"
        if aud != expected_aud:
            return jsonify({"error": "Token tidak valid untuk client ID ini"}), 400
        email = token_info.get("email")
        if not email:
            return jsonify({"error": "Email Google tidak ditemukan"}), 400
        name = token_info.get("name", email.split("@")[0])
        avatar_url = token_info.get("picture")
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                role="buyer",
                avatar_url=avatar_url,
                is_seller=False,
                is_admin=False
            )
            user.set_password(str(uuid.uuid4()))
            db.session.add(user)
            db.session.commit()
        else:
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
                db.session.commit()
        token = create_access_token(identity=str(user.id))
        return jsonify({"token": token, "user": user.to_dict()})
    except Exception as e:
        print("Google Auth Error:", e)
        return jsonify({"error": "Gagal autentikasi via Google"}), 400


@app.get("/api/auth/me")
@jwt_required()
def me():
    user = current_user()
    if not user:
        return jsonify({"error": "User tidak ditemukan"}), 404
    return jsonify(user.to_dict())


@app.put("/api/auth/me")
@jwt_required()
def update_me():
    user = current_user()
    data = request.get_json(force=True)
    for field in ["name", "phone", "address", "store_name", "store_location", "store_description"]:
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return jsonify(user.to_dict())


@app.post("/api/store/open")
@jwt_required()
def open_store():
    """Aktifkan mode penjual pada akun yang sedang login (tanpa akun/login baru).
    Setelah ini user.is_seller = True dan langsung bisa mengakses dashboard toko,
    sambil tetap bisa berbelanja seperti biasa dengan akun yang sama."""
    user = current_user()
    data = request.get_json(force=True)
    required = ["store_name", "store_location"]
    if not all(data.get(f) for f in required):
        return jsonify({"error": "Nama toko dan lokasi wajib diisi"}), 400

    user.is_seller = True
    user.store_name = data["store_name"]
    user.store_location = data["store_location"]
    user.store_description = data.get("store_description", user.store_description)
    db.session.commit()
    return jsonify(user.to_dict())


@app.post("/api/auth/me/avatar")
@jwt_required()
def upload_avatar():
    """Unggah / ganti foto profil akun."""
    user = current_user()
    if "image" not in request.files:
        return jsonify({"error": "File gambar belum diterima"}), 400
    image_file = request.files["image"]
    if not image_file or image_file.filename == "":
        return jsonify({"error": "File gambar tidak valid"}), 400

    user.avatar_url = save_image_file(image_file)
    db.session.commit()
    return jsonify(user.to_dict())


@app.post("/api/store/photo")
@jwt_required()
def upload_store_photo():
    """Unggah / ganti foto profil toko (butuh toko sudah dibuka)."""
    user = current_user()
    if not user.is_seller:
        return jsonify({"error": "Buka toko terlebih dahulu untuk mengubah foto toko"}), 403
    if "image" not in request.files:
        return jsonify({"error": "File gambar belum diterima"}), 400
    image_file = request.files["image"]
    if not image_file or image_file.filename == "":
        return jsonify({"error": "File gambar tidak valid"}), 400

    user.store_image_url = save_image_file(image_file)
    db.session.commit()
    return jsonify(user.to_dict())


@app.put("/api/auth/me/password")
@jwt_required()
def change_password():
    """Ganti password akun. Body: { current_password, new_password }"""
    user = current_user()
    data = request.get_json(force=True)
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not user.check_password(current_password):
        return jsonify({"error": "Password saat ini salah"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "Password baru minimal 6 karakter"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password berhasil diubah"})


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
@app.get("/api/categories")
def categories():
    return jsonify(CATEGORIES)


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
@app.get("/api/products")
def list_products():
    q = request.args.get("q", "").strip()
    category = request.args.get("category")
    location = request.args.get("location")
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    seller_id = request.args.get("seller_id", type=int)

    query = Product.query.filter(Product.status == "active")
    if seller_id:
        query = Product.query.filter(Product.seller_id == seller_id)
    if q:
        query = query.filter(Product.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    products = query.order_by(Product.created_at.desc()).all()
    if location:
        products = [p for p in products if p.seller and p.seller.store_location and
                    location.lower() in p.seller.store_location.lower()]

    return jsonify([p.to_dict() for p in products])


@app.get("/api/products/<int:product_id>")
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Produk tidak ditemukan"}), 404
    data = product.to_dict()
    data["reviews"] = [r.serialize() for r in product.reviews]
    return jsonify(data)


@app.post("/api/products")
@jwt_required()
def create_product():
    user = current_user()
    if not user.is_seller:
        return jsonify({"error": "Buka toko terlebih dahulu untuk dapat menambah produk"}), 403

    data = request.get_json(force=True)
    required = ["name", "category", "price", "stock"]
    if not all(data.get(f) is not None for f in required):
        return jsonify({"error": "Nama, kategori, harga, dan stok wajib diisi"}), 400

    ai_desc = generate_ai_description(
        name=data["name"],
        category=data["category"],
        condition=data.get("condition", ""),
        notes=data.get("manual_note", ""),
    )

    product = Product(
        seller_id=user.id,
        name=data["name"],
        category=data["category"],
        price=float(data["price"]),
        stock=float(data["stock"]),
        unit=data.get("unit", "kg"),
        image_url=data.get("image_url"),
        ai_description=data.get("ai_description") or ai_desc,
        manual_note=data.get("manual_note"),
        condition=data.get("condition"),
        quality=data.get("quality"),
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201


@app.post("/api/products/generate-description")
@jwt_required()
def preview_ai_description():
    """Dipakai form 'Tambah Produk' untuk preview deskripsi AI sebelum submit."""
    data = request.get_json(force=True)
    suggestion = ai_suggest_product_fields(
        name=data.get("name", ""),
        category=data.get("category", ""),
        condition=data.get("condition", ""),
        quality=data.get("quality", ""),
        notes=data.get("manual_note", ""),
    )
    return jsonify({
        "name": suggestion["name"],
        "ai_description": suggestion["description"],
    })


@app.post("/api/products/analyze-image")
@jwt_required()
def analyze_product_image_route():
    user = current_user()
    if not user.is_seller:
        return jsonify({"error": "Buka toko terlebih dahulu untuk menganalisis foto produk"}), 403

    if "image" not in request.files:
        return jsonify({"error": "File gambar belum diterima"}), 400

    image_file = request.files["image"]
    if not image_file or image_file.filename == "":
        return jsonify({"error": "File gambar tidak valid"}), 400

    uploads_dir = os.path.join(BASE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    _, ext = os.path.splitext(image_file.filename)
    if ext.lower() not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]:
        ext = ".png"

    with NamedTemporaryFile(delete=False, suffix=ext, dir=uploads_dir) as tmp:
        tmp_path = tmp.name
        image_file.save(tmp_path)

    try:
        result = analyze_product_image(tmp_path)
        return jsonify({
            "name": result["name"],
            "category": result.get("category"),
            "condition": result.get("condition"),
            "quality": result.get("quality"),
            "notes": result.get("notes", ""),
            "stock_estimate": result.get("stock_estimate"),
            "price_estimate": result.get("price_estimate"),
            "ai_description": result["ai_description"],
            "confidence": result.get("confidence"),
            "low_confidence": result.get("low_confidence", False),
            "image_url": f"/uploads/{os.path.basename(tmp_path)}",
        })
    except Exception as exc:
        return jsonify({"error": f"Gagal menganalisis gambar: {str(exc)}"}), 500


@app.get("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(os.path.join(BASE_DIR, "uploads"), filename)


@app.put("/api/products/<int:product_id>")
@jwt_required()
def update_product(product_id):
    user = current_user()
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Produk tidak ditemukan"}), 404
    if product.seller_id != user.id:
        return jsonify({"error": "Tidak diizinkan"}), 403

    data = request.get_json(force=True)
    for field in ["name", "category", "price", "stock", "unit", "image_url",
                  "ai_description", "manual_note", "condition", "quality", "status"]:
        if field in data:
            setattr(product, field, data[field])
    db.session.commit()
    return jsonify(product.to_dict())


@app.delete("/api/products/<int:product_id>")
@jwt_required()
def delete_product(product_id):
    user = current_user()
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Produk tidak ditemukan"}), 404
    if product.seller_id != user.id:
        return jsonify({"error": "Tidak diizinkan"}), 403
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Produk dihapus"})


# ---------------------------------------------------------------------------
# Seller dashboard
# ---------------------------------------------------------------------------
@app.get("/api/seller/dashboard")
@jwt_required()
def seller_dashboard():
    user = current_user()
    if not user.is_seller:
        return jsonify({"error": "Buka toko terlebih dahulu untuk mengakses dashboard"}), 403

    products = Product.query.filter_by(seller_id=user.id).all()
    orders = Order.query.filter_by(seller_id=user.id).order_by(Order.created_at.desc()).all()

    total_pending = len([o for o in orders if o.status == "menunggu_konfirmasi"])
    total_sold_qty = sum(i.qty for o in orders if o.status == "selesai" for i in o.items)
    total_revenue = sum(o.total for o in orders if o.status == "selesai")

    # Response rate: share of orders the seller has already acted on (anything
    # past the initial "menunggu_konfirmasi" state counts as responded to).
    responded = len([o for o in orders if o.status != "menunggu_konfirmasi"])
    response_rate = round((responded / len(orders)) * 100) if orders else 100

    all_reviews = [r for p in products for r in p.reviews]
    avg_rating = round(sum(r.rating for r in all_reviews) / len(all_reviews), 1) if all_reviews else None

    return jsonify({
        "store": {
            "name": user.store_name or user.name,
            "location": user.store_location,
            "joined_at": user.created_at.isoformat(),
            "rating": avg_rating,
            "review_count": len(all_reviews),
        },
        "summary": {
            "pesanan_baru": total_pending,
            "produk_terjual": total_sold_qty,
            "pendapatan": total_revenue,
            "jumlah_produk": len(products),
            "tingkat_respons": response_rate,
        },
        "products": [p.to_dict(include_seller=False) for p in products],
        "orders": [o.serialize() for o in orders[:20]],
    })


# ---------------------------------------------------------------------------
# Orders / Cart-checkout / Escrow
# ---------------------------------------------------------------------------
@app.post("/api/orders")
@jwt_required()
def create_order():
    """Body: { items: [{product_id, qty}], shipping_address, shipping_method }
    Membuat 1 order per seller, menghitung biaya admin 10%, ongkos kirim, dan membuat transaksi Midtrans Snap."""
    user = current_user()

    data = request.get_json(force=True)
    items = data.get("items", [])
    if not items:
        return jsonify({"error": "Keranjang kosong"}), 400

    shipping_method = data.get("shipping_method", "kirim")
    shipping_address = data.get("shipping_address", "")
    payment_method = data.get("payment_method", "midtrans")

    grouped = {}
    for it in items:
        product = db.session.get(Product, it["product_id"])
        if not product or product.status != "active":
            return jsonify({"error": f"Produk {it.get('product_id')} tidak tersedia"}), 400
        if product.stock < it["qty"]:
            return jsonify({"error": f"Stok {product.name} tidak mencukupi"}), 400
        grouped.setdefault(product.seller_id, []).append((product, it["qty"]))

    import time
    if payment_method == "cod":
        midtrans_tx_id = f"COD-{int(time.time() * 1000)}-{user.id}"
    else:
        midtrans_tx_id = f"QLAPA-TX-{int(time.time() * 1000)}-{user.id}"

    created_orders = []
    combined_total = 0
    midtrans_items = []

    for seller_id, pairs in grouped.items():
        subtotal = sum(p.price * qty for p, qty in pairs)
        admin_fee = round(subtotal * 0.10)
        shipping_cost = 10000.0 if shipping_method == "kirim" else 0.0
        order_total = subtotal + admin_fee + shipping_cost

        order = Order(
            buyer_id=user.id,
            seller_id=seller_id,
            total=order_total,
            admin_fee=admin_fee,
            shipping_cost=shipping_cost,
            shipping_address=shipping_address if shipping_method == "kirim" else "Ambil Sendiri (Pick Up)",
            status="menunggu_konfirmasi",
            payment_status="pending",
            midtrans_tx_id=midtrans_tx_id
        )
        db.session.add(order)
        db.session.flush()

        for p, qty in pairs:
            db.session.add(OrderItem(order_id=order.id, product_id=p.id,
                                      product_name=p.name, qty=qty, price=p.price))
            p.stock -= qty
            
            midtrans_items.append({
                "id": f"prod-{p.id}",
                "price": int(p.price),
                "quantity": int(qty),
                "name": p.name[:50]
            })

        # Biaya admin
        midtrans_items.append({
            "id": f"admin-{order.id}",
            "price": int(admin_fee),
            "quantity": 1,
            "name": f"Biaya Admin 10% (Pesanan #{order.id})"
        })

        # Ongkos kirim
        if shipping_cost > 0:
            midtrans_items.append({
                "id": f"ship-{order.id}",
                "price": int(shipping_cost),
                "quantity": 1,
                "name": f"Ongkos Kirim (Pesanan #{order.id})"
            })

        combined_total += order_total
        created_orders.append(order)

    # Request snap token ke Midtrans
    snap_param = {
        "transaction_details": {
            "order_id": midtrans_tx_id,
            "gross_amount": int(combined_total)
        },
        "item_details": midtrans_items,
        "customer_details": {
            "first_name": user.name,
            "email": user.email,
            "phone": user.phone or ""
        }
    }

    if payment_method == "cod":
        for order in created_orders:
            order.snap_token = "COD"
        db.session.commit()
        return jsonify({
            "snap_token": "COD",
            "orders": [o.serialize() for o in created_orders]
        }), 201

    try:
        transaction = midtrans_snap.create_transaction(snap_param)
        snap_token = transaction.get("token")
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Gagal membuat transaksi Midtrans: {str(e)}"}), 500

    for order in created_orders:
        order.snap_token = snap_token

    db.session.commit()

    return jsonify({
        "snap_token": snap_token,
        "orders": [o.serialize() for o in created_orders]
    }), 201


@app.post("/api/payments/notification")
def midtrans_webhook():
    """Webhook callback dari Midtrans untuk mengupdate status pembayaran secara otomatis."""
    data = request.get_json(force=True)
    
    server_key = os.environ.get("MIDTRANS_SERVER_KEY", "")
    order_id = data.get("order_id", "")
    status_code = data.get("status_code", "")
    gross_amount = data.get("gross_amount", "")
    signature_key = data.get("signature_key", "")
    
    payload = f"{order_id}{status_code}{gross_amount}{server_key}"
    calculated = hashlib.sha512(payload.encode('utf-8')).hexdigest()
    
    if calculated != signature_key:
        return jsonify({"error": "Signature tidak valid"}), 400
        
    transaction_status = data.get("transaction_status")
    fraud_status = data.get("fraud_status")
    
    is_success = False
    if transaction_status == "capture":
        if fraud_status == "accept":
            is_success = True
    elif transaction_status == "settlement":
        is_success = True
        
    if is_success:
        orders = Order.query.filter_by(midtrans_tx_id=order_id).all()
        for o in orders:
            o.payment_status = "paid"
        db.session.commit()
    elif transaction_status in ["deny", "expire", "cancel"]:
        orders = Order.query.filter_by(midtrans_tx_id=order_id).all()
        for o in orders:
            o.payment_status = "failed"
            # Kembalikan stok
            for item in o.items:
                product = db.session.get(Product, item.product_id)
                if product:
                    product.stock += item.qty
        db.session.commit()
        
    return jsonify({"status": "OK"}), 200


@app.post("/api/orders/pay-success")
@jwt_required()
def pay_success():
    """Callback cadangan dari frontend jika webhook tertunda."""
    data = request.get_json(force=True)
    snap_token = data.get("snap_token")
    if not snap_token:
        return jsonify({"error": "Snap token wajib diisi"}), 400
        
    orders = Order.query.filter_by(snap_token=snap_token).all()
    for o in orders:
        o.payment_status = "paid"
    db.session.commit()
    
    return jsonify({"message": "Status pembayaran berhasil diperbarui"}), 200


@app.get("/api/orders")
@jwt_required()
def list_orders():
    """?as=seller mengembalikan pesanan masuk ke toko user (butuh is_seller).
    Default (?as=buyer atau tanpa parameter) mengembalikan riwayat belanja user."""
    user = current_user()
    view = request.args.get("as", "buyer")
    if view == "seller" and user.is_seller:
        orders = Order.query.filter_by(seller_id=user.id).order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.filter_by(buyer_id=user.id).order_by(Order.created_at.desc()).all()
    return jsonify([o.serialize() for o in orders])


@app.put("/api/orders/<int:order_id>/status")
@jwt_required()
def update_order_status(order_id):
    """Escrow flow:
    Seller: menunggu_konfirmasi -> diproses -> dikirim | ditolak
    Buyer:  dikirim -> selesai (konfirmasi terima barang, dana escrow dicairkan)"""
    user = current_user()
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"error": "Pesanan tidak ditemukan"}), 404

    new_status = request.get_json(force=True).get("status")
    seller_moves = {"diproses", "dikirim", "ditolak"}
    buyer_moves = {"selesai"}

    if user.id == order.seller_id and new_status in seller_moves:
        order.status = new_status
    elif user.id == order.buyer_id and new_status in buyer_moves:
        order.status = new_status
    else:
        return jsonify({"error": "Tidak diizinkan mengubah status ini"}), 403

    db.session.commit()
    return jsonify(order.serialize())


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
@app.post("/api/products/<int:product_id>/reviews")
@jwt_required()
def add_review(product_id):
    user = current_user()
    data = request.get_json(force=True)
    rating = int(data.get("rating", 0))
    if not (1 <= rating <= 5):
        return jsonify({"error": "Rating harus 1-5"}), 400

    review = Review(product_id=product_id, buyer_id=user.id,
                     rating=rating, comment=data.get("comment", ""))
    db.session.add(review)
    db.session.commit()
    return jsonify(review.serialize()), 201


# ---------------------------------------------------------------------------
# Chat (obrolan real-time via polling) + Qlapa AI assistant
# ---------------------------------------------------------------------------
@app.get("/api/chat/threads")
@jwt_required()
def chat_threads():
    user = current_user()
    msgs = ChatMessage.query.filter(
        (ChatMessage.sender_id == user.id) | (ChatMessage.receiver_id == user.id)
    ).order_by(ChatMessage.created_at.desc()).all()

    threads = {}
    for m in msgs:
        other_id = m.receiver_id if m.sender_id == user.id else m.sender_id
        if other_id not in threads:
            other = db.session.get(User, other_id)
            threads[other_id] = {
                "user_id": other_id,
                "name": (other.store_name or other.name) if other else "Pengguna",
                "last_message": m.message,
                "last_time": m.created_at.isoformat(),
            }
    return jsonify(list(threads.values()))


@app.get("/api/chat/<int:other_user_id>")
@jwt_required()
def chat_history(other_user_id):
    user = current_user()
    msgs = ChatMessage.query.filter(
        ((ChatMessage.sender_id == user.id) & (ChatMessage.receiver_id == other_user_id)) |
        ((ChatMessage.sender_id == other_user_id) & (ChatMessage.receiver_id == user.id))
    ).order_by(ChatMessage.created_at.asc()).all()
    return jsonify([m.serialize() for m in msgs])


@app.post("/api/chat/<int:other_user_id>")
@jwt_required()
def send_chat(other_user_id):
    user = current_user()
    data = request.get_json(force=True)
    msg = ChatMessage(
        sender_id=user.id,
        receiver_id=other_user_id,
        product_id=data.get("product_id"),
        message=data["message"],
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.serialize()), 201


@app.post("/api/ai/chat")
@jwt_required()
def ai_chat():
    """Widget 'Qlapa AI' — rekomendasi pemanfaatan limbah untuk pembeli."""
    data = request.get_json(force=True)
    reply = chat_with_ai(data.get("message", ""), category=data.get("category"))
    return jsonify({"reply": reply})


@app.get("/api/ai/recommendation")
def ai_recommendation():
    category = request.args.get("category")
    product_name = request.args.get("product_name", "")
    if not category:
        return jsonify({"error": "Parameter category wajib diisi"}), 400
    return jsonify({"recommendation": get_recommendation(category, question=product_name)})


# ---------------------------------------------------------------------------
# Cart Sync Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/cart")
@jwt_required()
def get_cart():
    user = current_user()
    items = CartItem.query.filter_by(user_id=user.id).all()
    valid_items = [i.to_dict() for i in items if i.product is not None]
    return jsonify(valid_items)


@app.post("/api/cart/sync")
@jwt_required()
def sync_cart():
    user = current_user()
    data = request.get_json(force=True)
    items_data = data.get("items", [])
    
    active_product_ids = []
    for item in items_data:
        prod = item.get("product")
        if isinstance(prod, dict):
            pid = int(prod["id"])
        else:
            pid = int(item.get("product_id"))
        qty = float(item.get("qty", 1.0))
        selected = bool(item.get("selected", True))
        
        active_product_ids.append(pid)
        
        existing = CartItem.query.filter_by(user_id=user.id, product_id=pid).first()
        if existing:
            existing.qty = qty
            existing.selected = selected
        else:
            cart_item = CartItem(
                user_id=user.id,
                product_id=pid,
                qty=qty,
                selected=selected
            )
            db.session.add(cart_item)
            
    # Delete cart items that are not in the payload
    CartItem.query.filter(
        CartItem.user_id == user.id,
        ~CartItem.product_id.in_(active_product_ids)
    ).delete(synchronize_session=False)
    
    db.session.commit()
    return jsonify({"status": "success"})


# ---------------------------------------------------------------------------
# AI Chat Sessions Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/ai/chat/sessions")
@jwt_required()
def get_ai_sessions():
    user = current_user()
    sessions = AIChatSession.query.filter_by(user_id=user.id).order_by(AIChatSession.updated_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions])


@app.post("/api/ai/chat/sessions")
@jwt_required()
def sync_ai_sessions():
    user = current_user()
    data = request.get_json(force=True)
    sessions_data = data.get("sessions", [])
    
    active_ids = []
    for s in sessions_data:
        sid = str(s["id"])
        active_ids.append(sid)
        
        existing = AIChatSession.query.filter_by(user_id=user.id, id=sid).first()
        import json
        title = s.get("title", "Sesi Baru")
        messages = json.dumps(s.get("messages", []))
        
        if existing:
            existing.title = title
            existing.messages = messages
        else:
            session = AIChatSession(
                id=sid,
                user_id=user.id,
                title=title,
                messages=messages
            )
            db.session.add(session)
            
    # Delete sessions not in payload
    AIChatSession.query.filter(
        AIChatSession.user_id == user.id,
        ~AIChatSession.id.in_(active_ids)
    ).delete(synchronize_session=False)
    
    db.session.commit()
    return jsonify({"status": "success"})


# ---------------------------------------------------------------------------
# Admin — dashboard, kelola toko/produk/pesanan/pengguna, export CSV
# Login admin memakai endpoint /api/auth/login yang sama; akun harus punya
# is_admin=True (lihat seed.py — akun default: Qlapa@gmail.com / qlapa123).
# ---------------------------------------------------------------------------
@app.get("/api/admin/dashboard")
@admin_required
def admin_dashboard():
    users = User.query.all()
    sellers = [u for u in users if u.is_seller]
    products = Product.query.all()
    orders = Order.query.order_by(Order.created_at.desc()).all()

    total_revenue = sum(o.total for o in orders if o.status == "selesai")
    status_counts = {}
    for o in orders:
        status_counts[o.status] = status_counts.get(o.status, 0) + 1

    def seller_revenue(seller_id):
        return sum(o.total for o in orders if o.seller_id == seller_id and o.status == "selesai")

    top_sellers = sorted(sellers, key=lambda s: seller_revenue(s.id), reverse=True)[:5]
    top_sellers_data = [{
        "id": s.id,
        "store_name": s.store_name or s.name,
        "revenue": seller_revenue(s.id),
        "product_count": len([p for p in products if p.seller_id == s.id]),
    } for s in top_sellers]

    return jsonify({
        "summary": {
            "total_users": len(users),
            "total_sellers": len(sellers),
            "total_buyers": len(users) - len(sellers),
            "total_products": len(products),
            "total_orders": len(orders),
            "total_revenue": total_revenue,
        },
        "status_counts": status_counts,
        "top_sellers": top_sellers_data,
        "recent_orders": [o.serialize() for o in orders[:10]],
    })


@app.get("/api/admin/users")
@admin_required
def admin_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@app.get("/api/admin/sellers")
@admin_required
def admin_sellers():
    sellers = User.query.filter_by(is_seller=True).order_by(User.created_at.desc()).all()
    orders_done = Order.query.filter_by(status="selesai").all()

    data = []
    for s in sellers:
        revenue = sum(o.total for o in orders_done if o.seller_id == s.id)
        d = s.to_dict()
        d["product_count"] = Product.query.filter_by(seller_id=s.id).count()
        d["order_count"] = Order.query.filter_by(seller_id=s.id).count()
        d["revenue"] = revenue
        data.append(d)
    return jsonify(data)


@app.get("/api/admin/products")
@admin_required
def admin_products():
    products = Product.query.order_by(Product.created_at.desc()).all()
    return jsonify([p.to_dict() for p in products])


@app.get("/api/admin/orders")
@admin_required
def admin_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([o.serialize() for o in orders])


@app.get("/api/admin/export/<kind>.csv")
@admin_required
def admin_export(kind):
    output = io.StringIO()
    writer = csv.writer(output)

    if kind == "users":
        writer.writerow(["ID", "Nama", "Email", "Telepon", "Penjual", "Nama Toko",
                          "Lokasi Toko", "Terdaftar"])
        for u in User.query.order_by(User.id).all():
            writer.writerow([u.id, u.name, u.email, u.phone or "",
                              "Ya" if u.is_seller else "Tidak", u.store_name or "",
                              u.store_location or "", u.created_at.isoformat()])
    elif kind == "sellers":
        writer.writerow(["ID", "Nama Toko", "Pemilik", "Email", "Lokasi",
                          "Jumlah Produk", "Jumlah Pesanan", "Pendapatan"])
        orders_done = Order.query.filter_by(status="selesai").all()
        for s in User.query.filter_by(is_seller=True).order_by(User.id).all():
            revenue = sum(o.total for o in orders_done if o.seller_id == s.id)
            writer.writerow([s.id, s.store_name or s.name, s.name, s.email,
                              s.store_location or "",
                              Product.query.filter_by(seller_id=s.id).count(),
                              Order.query.filter_by(seller_id=s.id).count(), revenue])
    elif kind == "products":
        writer.writerow(["ID", "Nama", "Kategori", "Harga", "Stok", "Satuan",
                          "Status", "Penjual"])
        for p in Product.query.order_by(Product.id).all():
            writer.writerow([p.id, p.name, p.category, p.price, p.stock, p.unit,
                              p.status, (p.seller.store_name or p.seller.name) if p.seller else ""])
    elif kind == "orders":
        writer.writerow(["ID", "Pembeli", "Penjual", "Total", "Status", "Tanggal"])
        for o in Order.query.order_by(Order.id).all():
            writer.writerow([o.id, o.buyer.name if o.buyer else "",
                              (o.seller.store_name or o.seller.name) if o.seller else "",
                              o.total, o.status, o.created_at.isoformat()])
    else:
        return jsonify({"error": "Jenis export tidak dikenal"}), 400

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={kind}.csv"},
    )


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)