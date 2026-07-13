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
          }}>
            {item.type}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            <Clock size={11} />
            <span>Kondisi: {item.condition}</span>
          </div>

          <h3 style={{
            fontFamily: "var(--font-display)", fontSize: "1.1rem",
            color: "var(--ink)", marginBottom: 4, lineHeight: 1.3,
            fontWeight: 600
          }}>
            {item.name}
          </h3>

          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
            Rp{Number(item.price).toLocaleString("id-ID")}
            <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--ink-soft)", marginLeft: 4 }}>
              / {item.unit}
            </span>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px",
            background: "var(--cream)", borderRadius: 10, padding: "10px 12px",
            marginBottom: 14, fontSize: "0.78rem",
          }}>
            <SpecRow label="Jenis" value={item.type} />
            <SpecRow label="Kondisi" value={item.condition} />
            <SpecRow label="Asal" value={location} />
            <SpecRow label="Stok" value={`${item.stock} ${item.unit}`} />
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              <MapPin size={12} />
              <span>{location}</span>
            </div>
            <span style={{
              padding: "7px 16px", background: "var(--ink)", color: "#fff",
              borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
            }}>
              Lihat Detail
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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
            .why-layout-container { grid-template-columns: 1fr; gap: 40px; }
            .why-center-image-wrapper { order: -1; max-width: 280px; margin: 0 auto; }
          }
        `}</style>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: "80px 0", background: "var(--cream)", borderTop: "1px solid var(--line)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }} className="stats-grid">
            {[
              { num: "30+", label: "Produk & Bahan Baku" },
              { num: "450+", label: "Mitra Penjual" },
              { num: "15.000+ kg", label: "Limbah Terolah" },
              { num: "Qlapa AI", label: "Asisten Cerdas" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: "16px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "3.2rem", fontWeight: 800, color: "var(--green-900)", marginBottom: 8, letterSpacing: "-0.02em" }}>{stat.num}</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 992px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 40px !important; } }
          @media (max-width: 576px) { .stats-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      {/* ── QLAPA AI ── */}
      <QlapaAISection />

    </div>
  );
}
