"""Jalankan sekali untuk mengisi data contoh: python seed.py"""
from app import app
from models import db, User, Product, Review
from ai_engine import generate_ai_description

DEMO_PRODUCTS = [
    dict(name="Tempurung Kelapa Kering", category="Tempurung", price=3000, stock=250, unit="kg",
         condition="Kering", quality="Bersih, siap bakar",
         image_url="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600"),
    dict(name="Sabut Kelapa Cacah", category="Sabut", price=2500, stock=180, unit="kg",
         condition="Kering", quality="Serat panjang, bebas kotoran",
         image_url="https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"),
    dict(name="Ampas Kelapa Basah", category="Ampas", price=1800, stock=90, unit="kg",
         condition="Basah", quality="Segar, baru diperas",
         image_url="https://images.unsplash.com/photo-1447279506476-3faec8071eee?w=600"),
    dict(name="Daun Kelapa Kering", category="Daun", price=1500, stock=60, unit="ikat",
         condition="Kering", quality="Cocok untuk anyaman",
         image_url="https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600"),
    dict(name="Air Kelapa Muda", category="Air Kelapa", price=4000, stock=120, unit="liter",
         condition="Segar", quality="Tanpa pengawet",
         image_url="https://images.unsplash.com/photo-1571066811602-716837d681de?w=600"),
    dict(name="Cangkang Kelapa Cacah", category="Tempurung", price=2800, stock=140, unit="kg",
         condition="Kering", quality="Ukuran seragam 1-2cm",
         image_url="https://images.unsplash.com/photo-1541599468348-e96984315921?w=600"),
]

with app.app_context():
    db.drop_all()
    db.create_all()

    seller = User(name="Siti Nurhaliza", email="seller@qlapa.test", role="buyer", is_seller=True,
                  phone="081200000001", store_name="LimbahKita Store",
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
        desc = generate_ai_description(p["name"], p["category"], p["condition"], p["quality"])
        prod = Product(
            seller_id=sellers_cycle[i % len(sellers_cycle)].id,
            name=p["name"], category=p["category"], price=p["price"],
            stock=p["stock"], unit=p["unit"], image_url=p["image_url"],
            ai_description=desc, condition=p["condition"], quality=p["quality"],
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
