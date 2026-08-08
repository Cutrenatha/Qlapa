"""Jalankan sekali untuk mengisi data contoh: python seed.py"""
from app import app
from models import db, User, Product, Review

DEMO_PRODUCTS = [
    dict(
        name="Tempurung Kelapa Kering",
        category="Tempurung Kelapa",
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
        name="Sabut Kelapa Segar",
        category="Sabut Kelapa",
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
        name="Sabut Kelapa Kering",
        category="Sabut Kelapa",
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
        name="Ampas Kelapa Segar",
        category="Ampas Kelapa",
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
        name="Daun Kelapa Kering",
        category="Daun Kelapa",
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
        name="Air Kelapa Murni",
        category="Air Kelapa (limbah/sisa produksi)",
        price=3000,
        stock=150,
        unit="liter",
        condition="Segar",
        quality="Cairan bening, murni tanpa pengawet",
        image_url="/assets/catalog/air_kelapa.jpg",
        weight="1 liter",
        length="-",
        moisture="100%",
        description="Air kelapa murni sisa pemerasan produksi kopra, kaya mineral elektrolit alami, ideal untuk pembuatan nata de coco."
    ),
    dict(
        name="Briket Arang Batok Kelapa",
        category="Briket Tempurung",
        price=18000,
        stock=100,
        unit="kg",
        condition="Kering",
        quality="Kalori tinggi, tanpa asap berlebih, padat",
        image_url="/assets/catalog/briket_arang.jpg",
        weight="1 kg",
        length="2 – 5 cm",
        moisture="5%",
        description="Briket arang dari tempurung batok kelapa pilihan, tahan lama, abu sedikit, dan panas merata, sangat diminati pasar ekspor."
    ),
    dict(
        name="Arang Aktif Kelapa",
        category="Arang Aktif",
        price=35000,
        stock=60,
        unit="kg",
        condition="Kering",
        quality="Kualitas karbon aktif tinggi, mesh halus",
        image_url="/assets/catalog/arang_aktif.jpg",
        weight="1 kg",
        length="-",
        moisture="5%",
        description="Arang aktif premium berbahan tempurung kelapa tua dengan luas permukaan pori tinggi, sangat baik untuk penyaringan air dan zat beracun."
    ),
    dict(
        name="Cocopeat Blok Premium",
        category="Cocopeat",
        price=12000,
        stock=250,
        unit="kg",
        condition="Kering",
        quality="Rendah tanin, sudah dicuci, siap pakai",
        image_url="/assets/catalog/cocopeat.jpg",
        weight="1 kg",
        length="-",
        moisture="10%",
        description="Media tanam cocopeat murni yang diolah dari sabut kelapa tua. Mampu mengikat air dengan sangat baik untuk pertumbuhan persemaian tanaman."
    ),
    dict(
        name="Cocofiber Serat Bersih",
        category="Cocofiber",
        price=9500,
        stock=180,
        unit="kg",
        condition="Kering",
        quality="Serat panjang kering merata, bebas debu",
        image_url="/assets/catalog/cocofiber.jpg",
        weight="1 kg",
        length="15 – 25 cm",
        moisture="12%",
        description="Serat kelapa (cocofiber) kering dan bersih, sangat baik untuk bahan pengisi jok mobil, matras tempat tidur, atau penahan erosi geotekstil."
    ),
    dict(
        name="Pot Sabut Kelapa",
        category="Pot Sabut",
        price=15000,
        stock=50,
        unit="buah",
        condition="Kering",
        quality="Bentuk presisi, anyaman serat kuat",
        image_url="/assets/pot_sabut.jpg",
        weight="200 gram",
        length="15 cm",
        moisture="10%",
        description="Pot sabut kelapa alami (cocopot) ramah lingkungan sebagai alternatif pot plastik, dapat ditanam langsung ke tanah bersama dengan tanamannya."
    ),
    dict(
        name="Keset Sabut Kelapa Polos",
        category="Keset Sabut",
        price=20000,
        stock=35,
        unit="buah",
        condition="Kering",
        quality="Serat padat kasar, jahitan rapi",
        image_url="/assets/keset_sabut.jpg",
        weight="1.5 kg",
        length="40 x 60 cm",
        moisture="8%",
        description="Keset kaki berbahan 100% serat sabut kelapa alami yang tebal dan kasap, efektif membersihkan alas kaki secara optimal."
    ),
    dict(
        name="Tali Sabut Kelapa",
        category="Tali Sabut",
        price=8000,
        stock=500,
        unit="meter",
        condition="Kering",
        quality="Pilinan ganda rapi, tidak mudah putus",
        image_url="/assets/tali_sabut.jpg",
        weight="50 gram / meter",
        length="1 meter",
        moisture="10%",
        description="Tali tambang alami dari serat kelapa pilin ganda, tahan terhadap air dan cuaca ekstrem, sangat kuat untuk kebutuhan pertanian dan kerajinan."
    ),
    dict(
        name="Hiasan Kerajinan Tempurung",
        category="Kerajinan Tempurung",
        price=45000,
        stock=15,
        unit="buah",
        condition="Kering",
        quality="Ukiran manual detail, finishing halus bersih",
        image_url="/assets/kerajinan_tempurung.jpg",
        weight="500 gram",
        length="12 cm",
        moisture="5%",
        description="Produk dekorasi interior berupa lampu hias dan kerajinan ukir yang dikerjakan secara handmade dari batok kelapa tua berkualitas tinggi."
    ),
    dict(
        name="Mangkuk Tempurung Alami",
        category="Mangkuk Tempurung",
        price=15000,
        stock=80,
        unit="buah",
        condition="Kering",
        quality="Dipoles halus menggunakan minyak kelapa alami, food grade",
        image_url="/assets/mangkuk_tempurung.jpg",
        weight="150 gram",
        length="10 – 12 cm",
        moisture="5%",
        description="Mangkuk makan ramah lingkungan berbahan batok kelapa yang dipoles halus menggunakan minyak alami, aman digunakan untuk menyajikan makanan dingin maupun hangat."
    ),
    dict(
        name="Sendok Tempurung Kelapa",
        category="Sendok Tempurung",
        price=5000,
        stock=150,
        unit="buah",
        condition="Kering",
        quality="Kombinasi gagang kayu jati dan kepala tempurung kuat",
        image_url="/assets/sendok_tempurung.jpg",
        weight="50 gram",
        length="18 cm",
        moisture="5%",
        description="Sendok makan tradisional bernuansa etnik ramah lingkungan, cocok disandingkan dengan mangkuk tempurung kelapa untuk dekorasi saji estetik."
    ),
    dict(
        name="Pupuk Organik Ampas Kelapa",
        category="Pupuk Organik",
        price=12000,
        stock=100,
        unit="kg",
        condition="Segar",
        quality="Fermentasi matang sempurna, tidak berbau busuk",
        image_url="/assets/pupuk_organik.jpg",
        weight="1 kg",
        length="-",
        moisture="35%",
        description="Pupuk kompos organik hasil fermentasi ampas kelapa menggunakan mikroorganisme baik, kaya kandungan unsur hara untuk menyuburkan tanah pertanian."
    ),
    dict(
        name="Pakan Ternak Ampas Kelapa",
        category="Pakan Ternak",
        price=7500,
        stock=200,
        unit="kg",
        condition="Kering",
        quality="Gilingan halus kering rata, bebas kutu",
        image_url="/assets/pakan_ternak.jpg",
        weight="1 kg",
        length="-",
        moisture="10%",
        description="Pakan ternak bergizi tinggi hasil pengeringan dan penggilingan ampas kelapa sisa santan, kaya serat kasar dan lemak sisa untuk pertumbuhan ternak."
    )
]

def seed_data(drop_first=False):
    if drop_first:
        db.drop_all()
        db.create_all()
    else:
        db.create_all()

    if User.query.first() is not None:
        print("Database sudah berisi data. Seeding dilewati.")
        return

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

    sellers_cycle = [seller, seller2, hybrid]
    type_map = {
        "Tempurung Kelapa": "Tempurung",
        "Sabut Kelapa": "Sabut",
        "Ampas Kelapa": "Ampas",
        "Daun Kelapa": "Daun",
        "Air Kelapa (limbah/sisa produksi)": "Air Kelapa",
        "Briket Tempurung": "Briket",
        "Arang Aktif": "Arang Aktif",
        "Cocopeat": "Cocopeat",
        "Cocofiber": "Cocofiber",
        "Pot Sabut": "Pot Sabut",
        "Keset Sabut": "Keset Sabut",
        "Tali Sabut": "Tali Sabut",
        "Kerajinan Tempurung": "Kerajinan",
        "Mangkuk Tempurung": "Kerajinan",
        "Sendok Tempurung": "Kerajinan",
        "Pupuk Organik": "Pupuk Organik",
        "Pakan Ternak": "Pakan Ternak"
    }
    for i, p in enumerate(DEMO_PRODUCTS):
        prod_category = "Bahan Baku" if p["category"] in ["Tempurung Kelapa", "Sabut Kelapa", "Ampas Kelapa", "Daun Kelapa", "Air Kelapa (limbah/sisa produksi)"] else "Produk Olahan"
        prod_type = type_map.get(p["category"], "Lainnya")
        
        prod = Product(
            seller_id=sellers_cycle[i % len(sellers_cycle)].id,
            name=p["name"], category=prod_category, type=prod_type, price=p["price"],
            stock=p["stock"], unit=p["unit"], image_url=p["image_url"],
            ai_description=p["description"], condition=p["condition"], quality=p["quality"],
            weight=p["weight"], moisture=p["moisture"], length=p["length"]
        )
        db.session.add(prod)
    db.session.commit()

    first_product = Product.query.first()
    if first_product:
        db.session.add(Review(product_id=first_product.id, buyer_id=buyer.id,
                               rating=5, comment="Kualitas bagus, pengiriman cepat!"))
        db.session.commit()

    print("Seed selesai!")
    print("Akun Seller 1: seller@qlapa.test / password123")
    print("Akun Seller 2: seller2@qlapa.test / password123")
    print("Akun Buyer  : buyer@qlapa.test / password123")
    print("Akun Admin  : Qlapa@gmail.com / qlapa123  (buka di /admin/login)")


if __name__ == "__main__":
    with app.app_context():
        seed_data(drop_first=True)
