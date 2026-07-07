"""Jalankan sekali untuk mengisi data contoh: python seed.py"""
from app import app
from models import db, User, Product, Review
from ai_engine import generate_ai_description

DEMO_PRODUCTS = [
    dict(
        name="Sabut Kelapa Segar",
        category="Segar",
        price=8000,
        stock=40,
        unit="karung",
        condition="Segar",
        quality="Serabut panjang segar, langsung dipisahkan dari kelapa baru",
        image_url="/assets/sabut_segar.jpg",
        weight="15 kg / karung",
        length="25 – 35 cm",
        moisture="65%",
        description="Sabut kelapa segar belum diproses, cocok untuk media tanam, kerajinan tangan, atau bahan baku cocofiber. Kualitas terjaga, langsung dari petani."
    ),
    dict(
        name="Ampas Kelapa Segar",
        category="Segar",
        price=3000,
        stock=120,
        unit="kg",
        condition="Segar",
        quality="Moist, putih bersih, baru diperas sekali",
        image_url="/assets/ampas_segar.jpg",
        weight="1 kg",
        length="-",
        moisture="70%",
        description="Ampas kelapa segar hasil pemerasan santan, masih mengandung lemak dan serat tinggi. Ideal untuk pakan ternak, biogas, atau fermentasi pupuk organik."
    ),
    dict(
        name="Tempurung Kelapa",
        category="Kering",
        price=5500,
        stock=200,
        unit="kg",
        condition="Kering",
        quality="Kering matahari, bersih dari sabut sisa",
        image_url="/assets/tempurung.jpg",
        weight="1 kg",
        length="8 – 12 cm",
        moisture="12%",
        description="Tempurung kelapa kering berkualitas tinggi, siap untuk produksi arang aktif, kerajinan ukir, atau bahan bakar alternatif. Dipilih manual dan bebas lumut."
    ),
    dict(
        name="Daun Kelapa Kering",
        category="Kering",
        price=5000,
        stock=13,
        unit="ikat",
        condition="Kering",
        quality="Kering alami, bebas jamur, cocok untuk anyaman",
        image_url="/assets/daun_kering.jpg",
        weight="5 kg / ikat",
        length="30 – 60 cm",
        moisture="15%",
        description="Daun kelapa kering berkualitas baik, bersih, dan siap digunakan untuk berbagai kebutuhan seperti anyaman, kerajinan, kompos, dan bahan bakar alami."
    ),
    dict(
        name="Sabut Kelapa Kering",
        category="Kering",
        price=6500,
        stock=55,
        unit="karung",
        condition="Kering",
        quality="Kering maksimal, berserat rapat",
        image_url="/assets/sabut_kering.jpg",
        weight="12 kg / karung",
        length="20 – 30 cm",
        moisture="10%",
        description="Sabut kelapa kering sudah dikeringkan alami di bawah sinar matahari. Ringan, serabut padat, dan siap diolah menjadi keset, matras, atau media tanam hidroponik."
    ),
    dict(
        name="Arang Batok Kelapa",
        category="Kering",
        price=12000,
        stock=80,
        unit="kg",
        condition="Kering",
        quality="Matang merata, minim abu, kalori tinggi",
        image_url="/assets/arang_batok.jpg",
        weight="1 kg",
        length="2 – 5 cm",
        moisture="5%",
        description="Arang batok kelapa berkualitas ekspor dengan kadar karbon tinggi. Cocok untuk barbeque, shisha, pemurnian air, dan bahan baku karbon aktif industri."
    ),
]

with app.app_context():
    db.drop_all()
    db.create_all()

    seller = User(name="Siti Nurhaliza", email="seller@qlapa.test", role="buyer", is_seller=True,
                  phone="081200000001", store_name="Toko Hijau Nusantara",
                  store_location="Aceh Besar, Aceh",
                  store_description="Menyediakan limbah kelapa berkualitas dari petani lokal Aceh.")
    seller.set_password("password123")

    seller2 = User(name="Ahmad Fauzi", email="seller2@qlapa.test", role="buyer", is_seller=True,
                    phone="081200000002", store_name="Kelapa Barokah",
                    store_location="Pidie, Aceh",
                    store_description="UMKM pengumpul limbah kelapa dari beberapa desa.")
    seller2.set_password("password123")

    buyer = User(name="Dewi Sartika", email="buyer@qlapa.test", role="buyer", is_seller=False,
                 phone="081300000001")
    buyer.set_password("password123")

    # Contoh akun HYBRID: satu login, bisa belanja sekaligus punya toko sendiri.
    hybrid = User(name="Rina Wulandari", email="hybrid@qlapa.test", role="buyer", is_seller=True,
                  phone="081300000002", store_name="Rina Kelapa Craft",
                  store_location="Banda Aceh, Aceh",
                  store_description="Belanja limbah kelapa sekaligus jualan hasil olahan sendiri, dari 1 akun yang sama.")
    hybrid.set_password("password123")

    admin = User(name="Admin Qlapa", email="Qlapa@gmail.com", role="buyer",
                 is_seller=False, is_admin=True)
    admin.set_password("qlapa123")

    db.session.add_all([seller, seller2, buyer, hybrid, admin])
    db.session.commit()

    sellers_cycle = [seller, seller, seller2, seller2, seller, seller2]
    for i, p in enumerate(DEMO_PRODUCTS):
        prod = Product(
            seller_id=sellers_cycle[i % len(sellers_cycle)].id,
            name=p["name"], category=p["category"], price=p["price"],
            stock=p["stock"], unit=p["unit"], image_url=p["image_url"],
            ai_description=p["description"], condition=p["condition"], quality=p["quality"],
            weight=p["weight"], moisture=p["moisture"], length=p["length"]
        )
        db.session.add(prod)
    db.session.commit()

    first_product = Product.query.first()
    db.session.add(Review(product_id=first_product.id, buyer_id=buyer.id,
                           rating=5, comment="Kualitas bagus, pengiriman cepat!"))
    db.session.commit()

    print("Seed selesai!")
    print("Akun Seller 1: seller@qlapa.test / password123")
    print("Akun Seller 2: seller2@qlapa.test / password123")
    print("Akun Buyer  : buyer@qlapa.test / password123")
    print("Akun Admin  : Qlapa@gmail.com / qlapa123  (buka di /admin/login)")
