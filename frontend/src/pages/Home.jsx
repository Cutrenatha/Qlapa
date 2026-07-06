import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import AIChatWidget from "../components/AIChatWidget.jsx";

const CATEGORIES = [
  { name: "Ampas" },
  { name: "Tempurung" },
  { name: "Sabut" },
  { name: "Daun" },
];

const FRESH_CONDITIONS = ["Basah", "Segar"];

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const carouselRef = useRef(null);
  const [slide, setSlide] = useState(0);

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

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(
      `/produk${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`,
    );
  };

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || el.children.length === 0) return;
    const cardWidth = el.children[0].getBoundingClientRect().width + 16;
    setSlide(Math.round(el.scrollLeft / cardWidth));
  };

  return (
    <div>
      {/* SEARCH BAR */}
      <div style={styles.searchContainer}>
        <div className="container">
          <form onSubmit={submitSearch}>
            <input
              type="text"
              placeholder="Cari Produk.."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </form>
        </div>
      </div>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroBg}></div>
        <div className="container" style={styles.heroContent}>
          <div style={{ maxWidth: 400, position: "relative", zIndex: 2 }}>
            <h1 style={styles.heroTitle}>
              Sisa kelapa,
              <br />
              bernilai lebih.
            </h1>
            <p style={styles.heroDesc}>
              Jual, beli, dan eksplorasi potensi limbah kelapa dalam satu
              platform
            </p>
            <Link
              to="/produk"
              className="btn btn-primary"
              style={{ marginTop: 24 }}
            >
              Jelajahi
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="container">
          <div className="row between" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "1.2rem" }}>Kategori</h3>
            <Link to="/produk" style={styles.lainnyaLink}>
              Lainnya &gt;
            </Link>
          </div>
          <div style={styles.categoriesPills}>
            {CATEGORIES.map((c) => (
              <Link
                key={c.name}
                to={`/produk?category=${encodeURIComponent(c.name)}`}
                style={styles.pill}
              >
                <span style={{ fontSize: "1.15rem", marginRight: 8 }}>
                  {c.icon}
                </span>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* QLAPA AI */}
      <section className="section" style={{ padding: "0" }}>
        <div
          style={styles.qlapaAiSection}
          onClick={() => setAiOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setAiOpen(true)}
        >
          <div className="container" style={styles.qlapaAiInner}>
            <div style={{ maxWidth: 300 }}>
              <h3 style={styles.qlapaAiTitle}>Qlapa AI</h3>
              <p style={styles.qlapaAiText}>
                Bingung limbah kelapa cocok untuk apa? Dapatkan rekomendasi
                pemanfaatan di halaman produk
              </p>
            </div>
            <img
              src="/assets/coconut.png"
              alt="Coconut"
              style={styles.qlapaAiImage}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section">
        <div className="container">
          <h3 style={{ fontSize: "1.2rem", marginBottom: 20 }}>
            Produk Terbaru
          </h3>
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : latestProducts.length === 0 ? (
            <div className="empty-state">
              Belum ada produk. Jadilah penjual pertama!
            </div>
          ) : (
            <>
              <div style={styles.productsGrid}>
                {latestProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div style={{ textAlign: "right", marginTop: 20 }}>
                <Link to="/produk" style={styles.lainnyaLink}>
                  Lainnya &gt;
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <AIChatWidget open={aiOpen} setOpen={setAiOpen} />
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
    background: "rgba(255, 255, 255, 0.6)",
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
