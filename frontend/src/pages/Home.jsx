import React from "react";
import { Link } from "react-router-dom";
import HomeHero from "../components/HomeHero.jsx";
import QlapaAISection from "../components/QlapaAISection.jsx";
import {
  ArrowRight, ChevronRight, CheckCircle2,
  MapPin, Package, Sprout, Clock,
  Leaf, Sparkles, Boxes, PackageSearch, BadgeCheck, RefreshCcw,
  FlaskConical, Wheat
} from "lucide-react";

import api from "../api.js";

function SpecRow({ label, value }) {
  return (
    <div>
      <div style={{ color: "var(--ink-soft)", fontSize: "0.72rem", marginBottom: 1 }}>{label}</div>
      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

function CatalogCard({ item }) {
  const imageUrl = item.image_url || "/assets/coconut.png";
  const location = item.seller?.store_location || "Indonesia";

  return (
    <Link
      to={`/produk/${item.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid var(--line)",
        transition: "box-shadow 0.25s, transform 0.25s",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
        className="catalog-card"
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)";
          e.currentTarget.style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: 200, overflow: "hidden", flexShrink: 0 }}>
          <img
            src={imageUrl}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            onError={(e) => { e.target.src = "/assets/coconut.png"; }}
          />
          <span style={{
            position: "absolute", top: 12, left: 12,
            padding: "4px 11px", borderRadius: 999,
            fontSize: "0.72rem", fontWeight: 700,
            background: "rgba(92, 61, 46, 0.88)",
            color: "#fff",
            backdropFilter: "blur(4px)",
          }} className="catalog-badge">
            {item.type}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, fontSize: "0.73rem", color: "var(--ink-soft)" }} className="catalog-condition-row">
            <Clock size={11} />
            <span>Kondisi: {item.condition}</span>
          </div>

          <h3 style={{
            fontFamily: "var(--font-display)", fontSize: "1rem",
            color: "var(--ink)", marginBottom: 4, lineHeight: 1.3,
            fontWeight: 600, flexGrow: 1
          }}>
            {item.name}
          </h3>

          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
            Rp{Number(item.price).toLocaleString("id-ID")}
            <span style={{ fontSize: "0.80rem", fontWeight: 500, color: "var(--ink-soft)", marginLeft: 4 }}>
              / {item.unit}
            </span>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px",
            background: "var(--cream)", borderRadius: 10, padding: "10px 12px",
            marginBottom: 14, fontSize: "0.78rem",
          }} className="catalog-specs-grid">
            <SpecRow label="Kategori" value={item.category} />
            <SpecRow label="Kondisi" value={item.condition} />
            <SpecRow label="Lokasi" value={location} />
            <SpecRow label="Stok" value={`${item.stock} ${item.unit}`} />
          </div>

          {/* Footer */}
          <div style={{ marginTop: "auto" }} className="catalog-footer-btn">
            <span style={{
              display: "block", textAlign: "center",
              padding: "9px 0", background: "var(--ink)", color: "#fff",
              borderRadius: 10, fontSize: "0.82rem", fontWeight: 600,
              letterSpacing: "0.01em"
            }}>
              Lihat Detail
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AnimatedCounter({ value }) {
  const [displayValue, setDisplayValue] = React.useState("0");
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isIntersecting) return;

    const numMatch = value.replace(/\./g, "").match(/^(\d+)(.*)$/);
    if (!numMatch) {
      setDisplayValue(value);
      return;
    }

    const end = parseInt(numMatch[1], 10);
    const suffix = numMatch[2] || "";
    const duration = 1500; // 1.5s
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // Ease out quad
      const current = Math.floor(easeProgress * end);
      
      setDisplayValue(current.toLocaleString("id-ID") + suffix);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end.toLocaleString("id-ID") + suffix);
      }
    }

    requestAnimationFrame(update);
  }, [value, isIntersecting]);

  return <span ref={ref}>{displayValue}</span>;
}

export default function Home() {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [whyIndex, setWhyIndex] = React.useState(0);

  const whyFeatures = [
    { icon: <Boxes size={18} strokeWidth={1.5} color="#5C381D" />, title: "Produk Terkurasi", desc: "Bahan baku dan produk hasil olahan kelapa tersusun dalam kategori yang lebih mudah dijelajahi." },
    { icon: <BadgeCheck size={18} strokeWidth={1.5} color="#5C381D" />, title: "Penjual Terverifikasi", desc: "Informasi toko yang lengkap membantu pembeli bertransaksi dengan lebih percaya." },
    { icon: <Sparkles size={18} strokeWidth={1.5} color="#5C381D" />, title: "Didukung Qlapa AI", desc: "Membantu menemukan produk, memahami pemanfaatannya, dan memberikan rekomendasi sesuai kebutuhan Anda." },
    { icon: <RefreshCcw size={18} strokeWidth={1.5} color="#5C381D" />, title: "Ekosistem Terhubung", desc: "Menghubungkan bahan baku, produk hasil olahan, serta pelaku usaha dalam satu platform." },
    { icon: <PackageSearch size={18} strokeWidth={1.5} color="#5C381D" />, title: "Bahan Baku & Produk Olahan", desc: "Jelajahi bahan baku dan produk hasil olahan kelapa dalam satu ekosistem yang saling terhubung." },
    { icon: <Leaf size={18} strokeWidth={1.5} color="#5C381D" />, title: "Ekonomi Sirkular", desc: "Mendorong pemanfaatan limbah kelapa menjadi produk yang memiliki nilai ekonomi lebih tinggi." },
  ];

  React.useEffect(() => {
    api.get("/products")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => {
        console.error("Gagal load produk dari database:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setWhyIndex((prev) => (prev + 1) % whyFeatures.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [whyFeatures.length]);

  const bahanBaku = products.filter(p => p.category === "Bahan Baku").slice(0, 4);
  const produkOlahan = products.filter(p => p.category === "Produk Olahan").slice(0, 4);

  return (
    <div className="home-root">

      {/* ── HERO ── */}
      <HomeHero />

      {/* ── INTRO TEXT ── */}
      <section className="home-intro-text">
        <h3>
          <strong>Setiap bagian kelapa memiliki potensi.</strong><br />
          Temukan produk yang siap dimanfaatkan, mulai dari bahan baku hingga produk olahan.
        </h3>
        <div className="home-intro-bar" />
      </section>

      {/* ── BAHAN BAKU ── */}
      <section className="home-catalog-section">
        <div className="home-catalog-header">
          <div className="home-catalog-header-left">
            <h2 className="home-catalog-title">Bahan Baku Kelapa</h2>
            <p className="home-catalog-subtitle">
              Tempurung, sabut, ampas, hingga air kelapa — langsung dari petani dan pengolah lokal
            </p>
          </div>
          <Link to="/produk?category=Bahan+Baku" className="home-catalog-see-all">
            Lihat Semua <ChevronRight size={15} />
          </Link>
        </div>

        <div className="home-catalog-grid">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, width: "100%" }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : bahanBaku.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--ink-soft)", width: "100%" }}>
              Belum ada produk bahan baku yang diunggah.
            </div>
          ) : (
            bahanBaku.map((item, i) => (
              <CatalogCard key={i} item={item} />
            ))
          )}
          {/* Info panel */}
          <div className="home-catalog-info-card">
            <div className="home-catalog-info-icon">
              <Sprout size={22} color="#e8c99a" />
            </div>
            <h3 className="home-catalog-info-title">Fondasi setiap produk kelapa</h3>
            <div className="home-catalog-info-divider" />
            <p className="home-catalog-info-desc">
              Tempurung, sabut, ampas, daun, hingga air kelapa siap diolah menjadi produk bernilai tambah.
            </p>
            <ul className="home-catalog-info-list">
              <li><CheckCircle2 size={14} /> Kualitas bahan terjaga</li>
              <li><CheckCircle2 size={14} /> Siap diolah lebih lanjut</li>
              <li><CheckCircle2 size={14} /> Sumber utama produk olahan</li>
            </ul>
            <Link to="/produk?category=Bahan+Baku" className="home-catalog-info-cta">
              Lihat semua bahan baku <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUK OLAHAN ── */}
      <section className="home-catalog-section home-catalog-section--alt">
        <div className="home-catalog-header">
          <div className="home-catalog-header-left">
            <h2 className="home-catalog-title">Produk Olahan Kelapa</h2>
            <p className="home-catalog-subtitle">
              Briket arang, cocopeat, cocofiber, hingga arang aktif siap kirim ke seluruh Indonesia
            </p>
          </div>
          <Link to="/produk?category=Produk+Olahan" className="home-catalog-see-all">
            Lihat Semua <ChevronRight size={15} />
          </Link>
        </div>

        <div className="home-catalog-grid">
          {/* Info panel on left for this section */}
          <div className="home-catalog-info-card home-catalog-info-card--green">
            <div className="home-catalog-info-icon">
              <FlaskConical size={22} color="#a8d5a2" />
            </div>
            <h3 className="home-catalog-info-title">Nilai tambah dari olahan</h3>
            <div className="home-catalog-info-divider" />
            <p className="home-catalog-info-desc">
              Briket, cocopeat, cocofiber, minyak, dan arang aktif dari bahan baku kelapa berkualitas.
            </p>
            <ul className="home-catalog-info-list">
              <li><CheckCircle2 size={14} /> Sudah melewati proses pengolahan</li>
              <li><CheckCircle2 size={14} /> Siap ekspor dan distribusi</li>
              <li><CheckCircle2 size={14} /> Nilai ekonomi lebih tinggi</li>
            </ul>
            <Link to="/produk?category=Produk+Olahan" className="home-catalog-info-cta">
              Lihat semua produk olahan <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, width: "100%" }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : produkOlahan.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--ink-soft)", width: "100%" }}>
              Belum ada produk olahan yang diunggah.
            </div>
          ) : (
            produkOlahan.map((item, i) => (
              <CatalogCard key={i} item={item} />
            ))
          )}
        </div>
      </section>

      {/* ── WHY QLAPA ── */}
      <section className="why-section-custom">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="why-main-title">
              Mengapa memilih{" "}
              <img
                src="/assets/qlapa-logo.png"
                alt="Qlapa"
                style={{ height: "1.7em", verticalAlign: "middle", display: "inline", marginTop: "-0.1em", objectFit: "contain" }}
              />
              ?
            </h2>
            <p className="why-main-subtitle">
              Dirancang untuk mempermudah pemanfaatan limbah kelapa, dari bahan baku hingga produk hasil olahan.
            </p>
          </div>

          <div className="why-layout-container">
            <div className="why-column why-column-left">
              <div className="why-feature-item why-item-l1">
                <div className="why-icon-circle"><Boxes size={18} strokeWidth={1.5} color="#1D1D1F" /></div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Produk Terkurasi</h3>
                  <p className="why-feature-desc">Bahan baku dan produk hasil olahan kelapa tersusun dalam kategori yang lebih mudah dijelajahi.</p>
                </div>
              </div>
              <div className="why-feature-item why-item-l2">
                <div className="why-icon-circle"><Sparkles size={18} strokeWidth={1.5} color="#1D1D1F" /></div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Didukung Qlapa AI</h3>
                  <p className="why-feature-desc">Membantu menemukan produk, memahami pemanfaatannya, dan memberikan rekomendasi sesuai kebutuhan Anda.</p>
                </div>
              </div>
              <div className="why-feature-item why-item-l3">
                <div className="why-icon-circle"><PackageSearch size={18} strokeWidth={1.5} color="#1D1D1F" /></div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Bahan Baku &amp; Produk Olahan</h3>
                  <p className="why-feature-desc">Jelajahi bahan baku dan produk hasil olahan kelapa dalam satu ekosistem yang saling terhubung.</p>
                </div>
              </div>
            </div>

            <div className="why-center-image-wrapper">
              <img src="/assets/kelapaa.png" alt="Kelapa" className="why-center-img" style={{ maxWidth: "150%", width: "150%" }} />
            </div>

            <div className="why-column why-column-right">
              <div className="why-feature-item why-item-r1">
                <div className="why-icon-circle"><BadgeCheck size={18} strokeWidth={1.5} color="#1D1D1F" /></div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Penjual Terverifikasi</h3>
                  <p className="why-feature-desc">Informasi toko yang lengkap membantu pembeli bertransaksi dengan lebih percaya.</p>
                </div>
              </div>
              <div className="why-feature-item why-item-r2">
                <div className="why-icon-circle"><RefreshCcw size={18} strokeWidth={1.5} color="#1D1D1F" /></div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Ekosistem Terhubung</h3>
                  <p className="why-feature-desc">Menghubungkan bahan baku, produk hasil olahan, serta pelaku usaha dalam satu platform.</p>
                </div>
              </div>
              <div className="why-feature-item why-item-r3">
                <div className="why-icon-circle"><Leaf size={18} strokeWidth={1.5} color="#1D1D1F" /></div>
                <div className="why-text-group">
                  <h3 className="why-feature-title">Ekonomi Sirkular</h3>
                  <p className="why-feature-desc">Mendorong pemanfaatan limbah kelapa menjadi produk yang memiliki nilai ekonomi lebih tinggi.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Only Rotating Panel */}
          <div className="why-mobile-rotator">
            <div className="why-mobile-coconut-side">
              <div className="why-mobile-wheel" style={{ transform: `translate(-50%, -50%) rotate(${-whyIndex * 60}deg)` }}>
                {whyFeatures.map((feat, idx) => {
                  const angle = idx * 60;
                  const rad = (angle * Math.PI) / 180;
                  const R = 90; 
                  const x = R * Math.cos(rad);
                  const y = R * Math.sin(rad);
                  return (
                    <div
                      key={idx}
                      className={`why-mobile-wheel-item ${whyIndex === idx ? "active" : ""}`}
                      style={{
                        left: `calc(50% + ${x}px - 17px)`,
                        top: `calc(50% + ${y}px - 17px)`,
                        transform: `rotate(${whyIndex * 60}deg) scale(${whyIndex === idx ? 1.18 : 1})`,
                      }}
                    >
                      {feat.icon}
                    </div>
                  );
                })}
              </div>
              <div className="why-mobile-coconut-center">
                <img src="/assets/kelapaa.png" alt="Kelapa" className="why-mobile-coconut-img" />
              </div>
            </div>
            
            <div className="why-mobile-info-side">
              <div className="why-mobile-info-header">
                {/* Clean placeholder to match space layout without double icons */}
                <div style={{ width: 32 }} />
                <div className="why-mobile-counter">
                  {whyIndex + 1} / {whyFeatures.length}
                </div>
              </div>
              
              <div className="why-mobile-body-wrapper" key={whyIndex}>
                <h3 className="why-mobile-title">{whyFeatures[whyIndex].title}</h3>
                <p className="why-mobile-desc">{whyFeatures[whyIndex].desc}</p>
                <div className="why-mobile-accent-line"></div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          /* ── Mobile Rotator Styles ── */
          .why-mobile-rotator {
            display: none;
            width: 100%;
            height: 230px;
            background: #FAF8F5;
            border: 1px solid rgba(45, 106, 79, 0.08);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.01);
            margin-top: 24px;
          }

          .why-mobile-coconut-side {
            width: 32%;
            position: relative;
            overflow: hidden;
            background: #FAF8F5;
            height: 100%;
          }

          /* Ferris Wheel (Biang Lala) */
          .why-mobile-wheel {
            position: absolute;
            width: 220px;
            height: 220px;
            left: 0;
            top: 50%;
            border-radius: 50%;
            border: 1px dashed rgba(213, 194, 177, 0.45);
            transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            transform-style: preserve-3d;
            z-index: 1;
          }

          .why-mobile-wheel-item {
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #ffffff;
            border: 1px solid rgba(29, 29, 31, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
            opacity: 0.45;
            transform-origin: center;
            transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s, opacity 0.3s, border-color 0.3s, box-shadow 0.3s;
          }

          .why-mobile-wheel-item.active {
            opacity: 1;
            background: #F2ECE4;
            border-color: rgba(92, 56, 29, 0.35);
            box-shadow: 0 4px 10px rgba(92, 56, 29, 0.12);
          }

          /* Stationary Coconut Center Mask on top of Wheel */
          .why-mobile-coconut-center {
            position: absolute;
            width: 110px;
            height: 110px;
            left: 0;
            top: 50%;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            overflow: hidden;
            border: 1.5px solid rgba(213, 194, 177, 0.6);
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            z-index: 2;
          }

          .why-mobile-coconut-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: 80% center;
            transform: scale(1.26);
          }

          .why-mobile-info-side {
            width: 68%;
            padding: 16px 18px 16px 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            box-sizing: border-box;
            perspective: 800px; /* Enable 3D perspective */
          }

          .why-mobile-info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .why-mobile-icon-box {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #F2ECE4;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .why-mobile-counter {
            font-size: 0.78rem;
            font-weight: 700;
            color: #5C381D;
            letter-spacing: 0.04em;
          }

          .why-mobile-body-wrapper {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            animation: whyFerrisWheel 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes whyFerrisWheel {
            0% {
              opacity: 0;
              transform: translateY(28px) rotate(4deg);
              transform-origin: bottom left;
            }
            100% {
              opacity: 1;
              transform: translateY(0) rotate(0deg);
              transform-origin: bottom left;
            }
          }

          .why-mobile-title {
            font-family: Georgia, serif;
            font-size: 1.15rem;
            font-weight: 600;
            color: var(--ink);
            margin: 0 0 2px 0;
            line-height: 1.3;
          }

          .why-mobile-desc {
            font-size: 0.73rem;
            color: var(--ink-soft);
            line-height: 1.4;
            margin: 0;
          }

          .why-mobile-accent-line {
            width: 30px;
            height: 3px;
            background: #D5C2B1;
            border-radius: 99px;
            margin-top: 8px;
            flex-shrink: 0;
          }

          .why-section-custom {
            padding: 80px 0;
            background: #ffffff;
            border-top: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
            position: relative;
            overflow: hidden;
          }
          @media (max-width: 768px) {
            .why-section-custom { padding: 16px 0 !important; }
            .why-layout-container { display: none !important; }
            .why-mobile-rotator { display: flex !important; }
          }
          .why-section-custom .container { max-width: 1280px; padding: 0 40px !important; }
          .why-main-title { font-family: Georgia, serif; font-size: clamp(2.4rem, 5vw, 3.4rem); font-weight: 500; color: #1D1D1F; margin-bottom: 12px; letter-spacing: -0.01em; }
          .why-main-subtitle { color: #6E6E73; font-size: 0.95rem; max-width: 580px; margin: 0 auto; line-height: 1.6; }
          .why-layout-container { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 20px; align-items: center; margin-top: 56px; }
          .why-column { display: flex; flex-direction: column; gap: 40px; }
          .why-feature-item { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; transition: all 0.3s ease; }
          @media (min-width: 993px) {
            .why-item-l1 { transform: translateX(20px); }
            .why-item-l2 { transform: translateX(-20px); }
            .why-item-l3 { transform: translateX(10px); }
            .why-item-r1 { transform: translateX(-20px); }
            .why-item-r2 { transform: translateX(20px); }
            .why-item-r3 { transform: translateX(-10px); }
          }
          .why-icon-circle { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(29,29,31,0.15); background: transparent; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s; }
          .why-feature-item:hover .why-icon-circle { border-color: rgba(29,29,31,0.45); transform: scale(1.15); }
          .why-text-group { display: flex; flex-direction: column; gap: 6px; max-width: 260px; }
          .why-feature-title { font-family: var(--font-body); font-weight: 700; text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.08em; color: #1D1D1F; margin: 0; }
          .why-feature-desc { font-size: 0.83rem; color: #6E6E73; line-height: 1.5; margin: 0; }
          .why-center-image-wrapper { display: flex; justify-content: center; align-items: center; }
          .why-center-img { max-width: 110%; height: auto; object-fit: contain; transition: transform 0.6s; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.06)); }
          .why-layout-container:hover .why-center-img { transform: scale(1.05); }
          @media (max-width: 992px) {
            .why-layout-container {
              grid-template-columns: 1fr 1.2fr 1fr !important;
              gap: 8px !important;
              margin-top: 24px !important;
            }
            .why-column {
              gap: 16px !important;
            }
            .why-center-image-wrapper {
              max-width: 100% !important;
              width: 100% !important;
            }
            .why-center-img {
              max-width: 100% !important;
              width: 100% !important;
            }
            .why-icon-circle {
              width: 28px !important;
              height: 28px !important;
            }
            .why-icon-circle svg {
              width: 12px !important;
              height: 12px !important;
            }
            .why-text-group {
              max-width: 100% !important;
              gap: 2px !important;
            }
            .why-feature-title {
              font-size: 0.65rem !important;
            }
            .why-feature-desc {
              font-size: 0.58rem !important;
              line-height: 1.35 !important;
            }
          }
          @media (max-width: 480px) {
            .why-layout-container {
              gap: 4px !important;
            }
            .why-column {
              gap: 12px !important;
            }
            .why-icon-circle {
              width: 22px !important;
              height: 22px !important;
            }
            .why-icon-circle svg {
              width: 10px !important;
              height: 10px !important;
            }
            .why-feature-title {
              font-size: 0.55rem !important;
            }
            .why-feature-desc {
              font-size: 0.5rem !important;
            }
          }
        `}</style>
      </section>

      {/* ── STATS ── */}
      <section className="home-stats-section" style={{ background: "var(--cream)", borderTop: "1px solid var(--line)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }} className="stats-grid">
            {[
              { num: "30+", label: "Produk & Bahan Baku" },
              { num: "450+", label: "Mitra Penjual" },
              { num: "15.000+ kg", label: "Limbah Terolah" },
              { num: "Qlapa AI", label: "Asisten Cerdas" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: "16px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "3.2rem", fontWeight: 800, color: "var(--green-900)", marginBottom: 8, letterSpacing: "-0.02em" }}>
                  <AnimatedCounter value={stat.num} />
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 992px) {
            .stats-grid {
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 12px !important;
            }
            .stats-grid div {
              padding: 8px 4px !important;
            }
            .stats-grid div div:first-child {
              font-size: 1.5rem !important;
              margin-bottom: 4px !important;
            }
            .stats-grid div div:last-child {
              font-size: 0.72rem !important;
            }
          }
          @media (max-width: 576px) {
            .stats-grid {
              gap: 8px !important;
            }
            .stats-grid div {
              padding: 6px 2px !important;
            }
            .stats-grid div div:first-child {
              font-size: 1.5rem !important;
              margin-bottom: 2px !important;
              white-space: nowrap;
            }
            .stats-grid div div:last-child {
              font-size: 0.78rem !important;
              line-height: 1.25 !important;
            }
          }
        `}</style>
      </section>

      {/* ── QLAPA AI ── */}
      <QlapaAISection />

    </div>
  );
}
