import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import QlapaAISection from "../components/QlapaAISection.jsx";
import { Sprout, Play, ShieldCheck, MapPin, Leaf, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, Clock, Package, Sparkles, FileText, BarChart3, Award, Truck, Store, Users } from "lucide-react";

const FALLBACK_FRESH = [
  { name: 'Ampas Kelapa Basah', price: 10000, unit: 'karung', stock: 10, staticImg: '/assets/coconut.png', location: 'Aceh Besar' },
  { name: 'Sabut Kelapa Segar', price: 7500, unit: 'karung', stock: 15, staticImg: '/assets/klapa.png', location: 'Aceh Besar' },
  { name: 'Air Kelapa Segar', price: 3000, unit: 'liter', stock: 20, staticImg: '/assets/bg.png', location: 'Aceh Besar' },
];

const FRESH_CONDITIONS = ["Basah", "Segar"];

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const carouselRef = useRef(null);
  const [slide, setSlide] = useState(0);
  const [activeDemo, setActiveDemo] = useState(0);

  const demoItems = [
    {
      name: "Ampas",
      icon: "🥥",
      aiText: "Ampas kelapa basah kaya serat dan nutrisi. Cocok sebagai bahan pakan ternak atau diolah jadi pupuk organik cair.",
      tags: ["Pakan Ternak", "Pupuk Organik", "Zero Waste"]
    },
    {
      name: "Sabut",
      icon: "🌴",
      aiText: "Sabut kelapa segar memiliki kandungan serat tinggi. Cocok untuk bahan cocopeat, cocofiber, pot tanaman, atau kerajinan.",
      tags: ["Cocopeat", "Cocofiber", "Media Tanam"]
    },
    {
      name: "Tempurung",
      icon: "🐚",
      aiText: "Tempurung kelapa kering mengandung karbon aktif tinggi. Cocok diproses menjadi arang briket atau bahan karbon aktif.",
      tags: ["Arang Briket", "Karbon Aktif", "Bahan Bakar"]
    }
  ];

  useEffect(() => {
    api.get("/products").then((res) => {
      setProducts(res.data);
      setLoading(false);
    });
  }, []);

  const freshProducts = useMemo(
    () =>
      products
        .filter((p) => FRESH_CONDITIONS.includes(p.condition))
        .slice(0, 4),
    [products],
  );
  const latestProducts = products.slice(0, 4);
  const showCards = freshProducts.length > 0 ? freshProducts : (!loading ? FALLBACK_FRESH : []);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || el.children.length === 0) return;
    const cardWidth = el.children[0].getBoundingClientRect().width + 16;
    setSlide(Math.round(el.scrollLeft / cardWidth));
  };

  const prevSlide = () => {
    const el = carouselRef.current;
    if (!el || !el.children.length) return;
    const w = el.children[0].getBoundingClientRect().width + 16;
    el.scrollBy({ left: -w, behavior: 'smooth' });
  };

  const nextSlide = () => {
    const el = carouselRef.current;
    if (!el || !el.children.length) return;
    const w = el.children[0].getBoundingClientRect().width + 16;
    el.scrollBy({ left: w, behavior: 'smooth' });
  };

  return (
    <div>

      {/* HERO */}
      <section className="hero-section">
        <div className="container" style={{ width: "100%" }}>
          <div className="hero-content-wrapper">
            {/* Pill Badge */}
            <div className="hero-badge">
              <Leaf size={14} />
              <span>Dari limbah, jadi manfaat</span>
            </div>

            {/* Headline */}
            <h1 className="hero-headline">
              Kelapa menyimpan<br />
              banyak potensi.<br />
              Kami menghubungkannya.
            </h1>

            {/* Subheadline */}
            <p className="hero-description">
              Qlapa adalah ruang bertemunya penjual dan pembeli limbah kelapa untuk menciptakan nilai, bersama.
            </p>

            {/* CTAs */}
            <div className="hero-ctas">
              <Link to="/produk" className="hero-btn-primary">
                <span>Jelajahi Produk</span>
                <ArrowRight size={16} />
              </Link>
              <button className="hero-btn-secondary" onClick={() => navigate("/produk")}>
                <div className="hero-play-icon">
                  <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />
                </div>
                <span>Lihat Cara Kerja</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TEXT TEMUKAN PRODUK */}
      <section style={{ padding: "80px 20px 40px", textAlign: "center", background: "var(--cream)" }}>
        <div style={{ animation: "fadeInUpText 1s cubic-bezier(0.16, 1, 0.3, 1) forwards", opacity: 0 }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: "400", color: "#1D1D1F", margin: "0 auto", maxWidth: "650px", lineHeight: "1.6" }}>
            <strong>Setiap limbah memiliki potensi.</strong><br />
            Temukan produk yang siap dimanfaatkan, mulai dari limbah segar hingga limbah kering.
          </h3>
          <div style={{ width: "60px", height: "3px", background: "var(--green-900)", margin: "24px auto 0", borderRadius: "2px" }} />
        </div>
        <style>{`
          @keyframes fadeInUpText {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* LIMBAH SEGAR */}
      <section className="fw-section">
        <div className="container">
          <div className="fw-header">
            <div>
              <h2 className="fw-title">Limbah Segar</h2>
              <p className="fw-subtitle">Limbah kelapa segar pilihan untuk hasil terbaik</p>
            </div>
            <Link to="/produk?condition=Basah" className="fw-lihat-semua">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>

          <div className="fw-content">
            {/* Carousel */}
            <div className="fw-carousel-wrapper">
              <button className="fw-arrow fw-arrow-left" onClick={prevSlide}>
                <ChevronLeft size={20} />
              </button>
              <div className="fw-carousel" ref={carouselRef} onScroll={handleCarouselScroll}>
                {showCards.map((item, i) => (
                  <div key={item.id || i} className="fw-card">
                    <div className="fw-card-img-wrapper">
                      <img
                        src={item.image ? `/uploads/${item.image}` : (item.staticImg || '/assets/coconut.png')}
                        alt={item.name}
                        className="fw-card-img"
                      />
                      <div className="fw-badge">
                        <Clock size={11} /> Fresh waste
                      </div>
                    </div>
                    <div className="fw-card-body">
                      <h4 className="fw-card-name">{item.name}</h4>
                      <p className="fw-card-price">Rp{Number(item.price).toLocaleString('id-ID')} / {item.unit || 'karung'}</p>
                      <p className="fw-card-location"><MapPin size={12} /> {item.city || item.location || 'Indonesia'}</p>
                      <div className="fw-card-footer">
                        <span className="fw-stock">
                          <Package size={11} /> {item.stock} {item.unit || 'karung'} tersedia
                        </span>
                        <Link to={item.id ? `/produk/${item.id}` : '/produk'} className="fw-detail-btn">
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="fw-arrow fw-arrow-right" onClick={nextSlide}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Info Panel */}
            <div className="fw-info-panel">
              <div className="fw-info-icon"><Leaf size={22} /></div>
              <h3 className="fw-info-title">Manfaatkan selagi fresh</h3>
              <div className="fw-info-divider" />
              <p className="fw-info-desc">
                Beberapa limbah kelapa perlu segera diproses untuk hasil terbaik.
              </p>
              <ul className="fw-info-list">
                <li><CheckCircle2 size={15} /> Kualitas lebih terjaga</li>
                <li><CheckCircle2 size={15} /> Nilai jual lebih tinggi</li>
                <li><CheckCircle2 size={15} /> Proses olah lebih optimal</li>
              </ul>
            </div>
          </div>

          {showCards.length > 1 && (
            <div style={styles.dots}>
              {showCards.slice(0, 4).map((_, i) => (
                <span key={i} style={{ ...styles.dot, ...(slide === i ? styles.dotActive : {}) }} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LIMBAH KERING */}
      <section className="fw-section">
        <div className="container">
          <div className="fw-header">
            <div>
              <h2 className="fw-title">Limbah Kering</h2>
              <p className="fw-subtitle">Limbah kelapa baru ditambahkan oleh penjual</p>
            </div>
            <Link to="/produk" className="fw-lihat-semua">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : latestProducts.length === 0 ? (
            <div className="empty-state">
              Belum ada produk. Jadilah penjual pertama!
            </div>
          ) : (
            <div className="fw-grid">
              {latestProducts.map((p) => (
                <Link key={p.id} to={`/produk/${p.id}`} className="fw-card" style={{ textDecoration: 'none' }}>
                  <div className="fw-card-img-wrapper">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="fw-card-img" />
                    ) : (
                      <div className="fw-card-img fw-card-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                        <Package size={24} />
                      </div>
                    )}
                    <div className="fw-badge">
                      {p.category}
                    </div>
                  </div>
                  <div className="fw-card-body">
                    <h4 className="fw-card-name">{p.name}</h4>
                    <p className="fw-card-price">Rp{Number(p.price).toLocaleString('id-ID')} / {p.unit}</p>
                    <p className="fw-card-location"><MapPin size={12} /> {p.seller?.store_location || 'Indonesia'}</p>
                    <div className="fw-card-footer">
                      <span className="fw-stock">
                        <Package size={11} /> {p.stock} {p.unit} tersedia
                      </span>
                      <span className="fw-detail-btn">Lihat Detail</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE QLAPA */}
      <section className="why-section-custom">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="why-main-title">
              Mengapa memilih Qlapa?
            </h2>
            <p className="why-main-subtitle">
              Membuat jual beli limbah kelapa menjadi lebih mudah, terpercaya, dan bernilai.
            </p>
          </div>

          <div className="why-layout-container">
            {/* Left Column */}
            <div className="why-column why-column-left">
              <div className="why-feature-item why-item-l1">
                <div className="why-icon-circle">
                  <Store size={18} strokeWidth={1.5} color="#1D1D1F" />
                </div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Marketplace Khusus</h3>
                  <p className="why-feature-desc">
                    Fokus pada jual beli limbah kelapa sehingga lebih mudah menemukan produk maupun pembeli yang tepat.
                  </p>
                </div>
              </div>

              <div className="why-feature-item why-item-l2">
                <div className="why-icon-circle">
                  <Sparkles size={18} strokeWidth={1.5} color="#1D1D1F" />
                </div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Didukung Qlapa AI</h3>
                  <p className="why-feature-desc">
                    Bantu memahami potensi pemanfaatan setiap produk secara instan langsung dari halaman produk.
                  </p>
                </div>
              </div>

              <div className="why-feature-item why-item-l3">
                <div className="why-icon-circle">
                  <MapPin size={18} strokeWidth={1.5} color="#1D1D1F" />
                </div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Lebih Dekat</h3>
                  <p className="why-feature-desc">
                    Temukan produk dari penjual di sekitar untuk mengurangi biaya pengiriman.
                  </p>
                </div>
              </div>
            </div>

            {/* Center Column: Image */}
            <div className="why-center-image-wrapper">
              <img src="/assets/kelapaa.png" alt="Kelapa" className="why-center-img" />
            </div>

            {/* Right Column */}
            <div className="why-column why-column-right">
              <div className="why-feature-item why-item-r1">
                <div className="why-icon-circle">
                  <ShieldCheck size={18} strokeWidth={1.5} color="#1D1D1F" />
                </div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Transaksi Aman</h3>
                  <p className="why-feature-desc">
                    Sistem pembayaran bersama menjaga transaksi lebih terpercaya.
                  </p>
                </div>
              </div>

              <div className="why-feature-item why-item-r2">
                <div className="why-icon-circle">
                  <Users size={18} strokeWidth={1.5} color="#1D1D1F" />
                </div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Satu Akun, Dua Peran</h3>
                  <p className="why-feature-desc">
                    Jual maupun beli limbah kelapa dalam satu platform yang sama.
                  </p>
                </div>
              </div>

              <div className="why-feature-item why-item-r3">
                <div className="why-icon-circle">
                  <Leaf size={18} strokeWidth={1.5} color="#1D1D1F" />
                </div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Mendukung Ekonomi Sirkular</h3>
                  <p className="why-feature-desc">
                    Mendorong pemanfaatan limbah agar memiliki nilai ekonomi yang lebih tinggi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .why-section-custom {
            padding: 80px 0;
            background: #ffffff;
            border-top: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
            position: relative;
            overflow: hidden;
          }
          .why-section-custom .container {
            max-width: 1280px;
            padding: 0 30px !important;
          }
          .why-main-title {
            font-family: Georgia, serif;
            font-size: clamp(2rem, 4vw, 2.6rem);
            font-weight: 500;
            color: #1D1D1F;
            margin-bottom: 12px;
            letter-spacing: -0.01em;
          }
          .why-main-subtitle {
            color: #6E6E73;
            font-size: 0.95rem;
            max-width: 580px;
            margin: 0 auto;
            line-height: 1.6;
          }
          .why-layout-container {
            display: grid;
            grid-template-columns: 1fr 1.5fr 1fr;
            gap: 20px;
            align-items: center;
            margin-top: 56px;
            position: relative;
          }
          .why-column {
            display: flex;
            flex-direction: column;
            gap: 40px;
            position: relative;
            z-index: 2;
          }
          .why-feature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 14px;
            transition: all 0.3s ease;
          }
          
          /* Staggered organic layout on desktop */
          @media (min-width: 993px) {
            .why-item-l1 { transform: translateX(20px); }
            .why-item-l2 { transform: translateX(-20px); }
            .why-item-l3 { transform: translateX(10px); }
            
            .why-item-r1 { transform: translateX(-20px); }
            .why-item-r2 { transform: translateX(20px); }
            .why-item-r3 { transform: translateX(-10px); }
          }

          .why-icon-circle {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 1px solid rgba(29, 29, 31, 0.15);
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .why-icon-circle svg {
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .why-feature-item:hover .why-icon-circle {
            border-color: rgba(29, 29, 31, 0.45);
            transform: scale(1.15);
          }
          .why-feature-item:hover .why-icon-circle svg {
            transform: scale(1.12);
          }
          .why-text-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-width: 260px;
          }
          .why-feature-title {
            font-family: var(--font-body);
            font-weight: 700;
            text-transform: uppercase;
            font-size: 0.78rem;
            letter-spacing: 0.08em;
            color: #1D1D1F;
            margin: 0;
          }
          .why-feature-desc {
            font-size: 0.83rem;
            color: #6E6E73;
            line-height: 1.5;
            margin: 0;
            font-weight: 400;
          }
          .why-center-image-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            z-index: 1;
          }
          .why-center-img {
            max-width: 110%;
            height: auto;
            object-fit: contain;
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            filter: drop-shadow(0 8px 24px rgba(0,0,0,0.06));
          }
          .why-layout-container:hover .why-center-img {
            transform: scale(1.05);
          }
          @media (max-width: 992px) {
            .why-layout-container {
              grid-template-columns: 1fr;
              gap: 40px;
            }
            .why-center-image-wrapper {
              order: -1;
              max-width: 280px;
              margin: 0 auto;
            }
            .why-column {
              gap: 32px;
            }
          }
        `}</style>
      </section>

      {/* DAMPAK YANG DICIPTAKAN */}
      <section style={{ padding: "80px 0", background: "var(--cream)", borderTop: "1px solid var(--line)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }} className="stats-grid">
            {[
              { num: "6+", label: "Jenis Limbah Kelapa" },
              { num: "2", label: "Kondisi Produk (Segar & Kering)" },
              { num: "1", label: "Marketplace Khusus Limbah Kelapa" },
              { num: "AI", label: "Pendamping Produk" }
            ].map((stat, i) => (
              <div key={i} style={{ padding: "16px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "3.2rem", fontWeight: 800, color: "var(--green-900)", marginBottom: 8, letterSpacing: "-0.02em" }}>{stat.num}</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 992px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 40px !important; }
          }
          @media (max-width: 576px) {
            .stats-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* QLAPA AI SECTION */}
      <QlapaAISection />

    </div>
  );
}

const styles = {
  searchContainer: {
    background: "var(--cream)",
    padding: "16px 0",
    borderBottom: "1px solid var(--line)",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "1rem",
    border: "1px solid var(--line)",
    borderRadius: "24px",
    fontFamily: "inherit",
    background: "transparent",
    color: "var(--ink)",
  },
  hero: {
    position: "relative",
    height: 360,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, var(--cream) 0%, var(--cream-2) 100%)",
  },
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage:
      "url(/assets/bg.png), linear-gradient(135deg, var(--brown-100) 0%, var(--cream-2) 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    padding: "40px 20px",
    width: "100%",
  },
  heroTitle: {
    fontSize: "2.2rem",
    fontWeight: 700,
    color: "var(--ink)",
    lineHeight: 1.2,
  },
  heroDesc: {
    fontSize: "1rem",
    color: "var(--ink-soft)",
    marginTop: 16,
    lineHeight: 1.4,
  },
  categoriesPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 16px",
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: "20px",
    textDecoration: "none",
    color: "var(--ink)",
    fontWeight: 500,
    fontSize: "0.95rem",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  lainnyaLink: {
    display: "inline-block",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--ink)",
    textDecoration: "none",
  },
  carousel: {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    paddingBottom: 4,
  },
  carouselItem: {
    flex: "0 0 auto",
    width: "min(78vw, 260px)",
    scrollSnapAlign: "start",
  },
  freshInfoCard: {
    height: "100%",
    minHeight: 220,
    background:
      "linear-gradient(160deg, var(--brown-800) 0%, var(--brown-700) 100%)",
    borderRadius: "var(--radius-md)",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    color: "#fff",
  },
  freshInfoTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.3rem",
    color: "#fff",
    marginBottom: 12,
  },
  freshInfoText: {
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.5,
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--line)",
    transition: "background 0.2s, width 0.2s",
  },
  dotActive: {
    background: "var(--brown-700)",
    width: 18,
  },
  qlapaAiSection: {
    background: "linear-gradient(135deg, #c9a876 0%, #a08060 100%)",
    borderRadius: 20,
    padding: "32px",
    margin: "0 20px",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  qlapaAiInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
  },
  qlapaAiTitle: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#fff",
    marginBottom: 12,
  },
  qlapaAiText: {
    fontSize: "0.95rem",
    color: "#fff",
    lineHeight: 1.4,
  },
  qlapaAiImage: {
    width: 120,
    height: 120,
    objectFit: "contain",
  },
  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
  },
};
