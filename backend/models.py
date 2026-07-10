from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="buyer")  # legacy field, kept for compat
    phone = db.Column(db.String(30))
    address = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Every account is a buyer by default. Opening a store (is_seller=True)
    # unlocks selling features on the SAME account/login — no separate role/login needed.
    is_seller = db.Column(db.Boolean, nullable=False, default=False)

    # Marks a special admin account (separate admin panel, not a "seller/buyer" role).
    is_admin = db.Column(db.Boolean, nullable=False, default=False)

    # Profile photo of the account itself
    avatar_url = db.Column(db.String(500))

    # Store info (filled in once the user opens a store)
    store_name = db.Column(db.String(150))
    store_location = db.Column(db.String(150))
    store_description = db.Column(db.Text)
    store_image_url = db.Column(db.String(500))

    products = db.relationship("Product", backref="seller", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_seller": self.is_seller,
            "is_admin": self.is_admin,
            "phone": self.phone,
            "address": self.address,
            "avatar_url": self.avatar_url,
            "store_name": self.store_name,
            "store_location": self.store_location,
            "store_description": self.store_description,
            "store_image_url": self.store_image_url,
            "created_at": self.created_at.isoformat(),
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Segar, Kering
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Float, nullable=False, default=0)
    unit = db.Column(db.String(20), default="kg")
    image_url = db.Column(db.String(500))
    ai_description = db.Column(db.Text)
    manual_note = db.Column(db.Text)
    condition = db.Column(db.String(50))  # Segar, Kering
    quality = db.Column(db.String(100))
    status = db.Column(db.String(20), default="active")  # active / nonactive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Specification fields
    weight = db.Column(db.String(50))
    moisture = db.Column(db.String(50))
    length = db.Column(db.String(50))

    reviews = db.relationship("Review", backref="product", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_seller=True):
        avg_rating = None
        if self.reviews:
            avg_rating = round(sum(r.rating for r in self.reviews) / len(self.reviews), 1)
        data = {
            "id": self.id,
            "seller_id": self.seller_id,
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "stock": self.stock,
            "unit": self.unit,
            "image_url": self.image_url,
            "ai_description": self.ai_description,
            "manual_note": self.manual_note,
            "condition": self.condition,
            "quality": self.quality,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "avg_rating": avg_rating,
            "review_count": len(self.reviews),
            "weight": self.weight,
            "moisture": self.moisture,
            "length": self.length,
        }
        if include_seller and self.seller:
            data["seller"] = {
                "id": self.seller.id,
                "store_name": self.seller.store_name or self.seller.name,
                "store_location": self.seller.store_location,
                "store_image_url": self.seller.store_image_url,
                "avatar_url": self.seller.avatar_url,
            }
        return data


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    total = db.Column(db.Float, nullable=False)
    admin_fee = db.Column(db.Float, default=0.0)
    shipping_cost = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(30), default="menunggu_konfirmasi")
    # status flow: menunggu_konfirmasi -> diproses -> dikirim -> selesai (escrow released) / ditolak
    shipping_address = db.Column(db.String(300))
    payment_status = db.Column(db.String(20), default="pending")  # pending, paid, failed
    snap_token = db.Column(db.String(100), nullable=True)
    midtrans_tx_id = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")
    buyer = db.relationship("User", foreign_keys=[buyer_id])
    seller = db.relationship("User", foreign_keys=[seller_id])

    def to_dict():
        pass

    def serialize(self):
        return {
            "id": self.id,
            "buyer_id": self.buyer_id,
            "buyer_name": self.buyer.name if self.buyer else None,
            "seller_id": self.seller_id,
            "seller_store": (self.seller.store_name or self.seller.name) if self.seller else None,
            "total": self.total,
            "admin_fee": self.admin_fee,
            "shipping_cost": self.shipping_cost,
            "status": self.status,
            "shipping_address": self.shipping_address,
            "payment_status": self.payment_status,
            "snap_token": self.snap_token,
            "midtrans_tx_id": self.midtrans_tx_id,
            "created_at": self.created_at.isoformat(),
            "items": [i.serialize() for i in self.items],
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    product_name = db.Column(db.String(150))
    qty = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "qty": self.qty,
            "price": self.price,
            "subtotal": self.qty * self.price,
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    message = db.Column(db.Text, nullable=False)
    is_ai = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "product_id": self.product_id,
            "message": self.message,
            "is_ai": self.is_ai,
            "created_at": self.created_at.isoformat(),
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    buyer = db.relationship("User")

    def serialize(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "buyer_id": self.buyer_id,
            "buyer_name": self.buyer.name if self.buyer else "Anonim",
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    qty = db.Column(db.Float, nullable=False, default=1.0)
    selected = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref=db.backref("cart_items", lazy=True, cascade="all, delete-orphan"))
    product = db.relationship("Product", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "qty": self.qty,
            "selected": self.selected,
            "product": self.product.to_dict(include_seller=True) if self.product else None
        }


class AIChatSession(db.Model):
    __tablename__ = "ai_chat_sessions"

    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(255), nullable=False, default="Sesi Baru")
    messages = db.Column(db.Text, nullable=False, default="[]")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("ai_chat_sessions", lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        import json
        try:
            msgs = json.loads(self.messages)
        except:
            msgs = []
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "messages": msgs,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
