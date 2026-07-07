import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api.js";
import {
  MapPin, Package, Search, SlidersHorizontal, X, ChevronDown, Clock
} from "lucide-react";

/* ─── Static demo data (used when no backend products exist) ─── */
const STATIC_PRODUCTS = [
  {
    id: "s1",
    name: "Sabut Kelapa Segar",
    price: 8000,
    unit: "karung",
    stock: 40,
    condition: "Segar",
    category: "Sabut",
    location: "Aceh Besar, Aceh",
    uploaded: "2026-07-07",
    weight: "15 kg / karung",
    length: "25 – 35 cm",
    moisture: "65%",
    description:
      "Sabut kelapa segar belum diproses, cocok untuk media tanam, kerajinan tangan, atau bahan baku cocofiber. Kualitas terjaga, langsung dari petani.",
    staticImg: "/assets/sabut_segar.jpg",
    seller: { store_location: "Aceh Besar, Aceh", name: "Toko Hijau Nusantara" },
  },
  {
    id: "s2",
    name: "Ampas Kelapa Segar",
    price: 3000,
    unit: "kg",
    stock: 120,
    condition: "Segar",
    category: "Ampas",
    location: "Makassar, Sulawesi Selatan",
    uploaded: "2026-07-06",
    weight: "1 kg",
    length: "-",
    moisture: "70%",
    description:
      "Ampas kelapa segar hasil pemerasan santan, masih mengandung lemak dan serat tinggi. Ideal untuk pakan ternak, biogas, atau fermentasi pupuk organik.",
    staticImg: "/assets/ampas_segar.jpg",
    seller: { store_location: "Makassar, Sulawesi Selatan", name: "CV Kelapa Makmur" },
  },
  {
    id: "s3",
    name: "Tempurung Kelapa",
    price: 5500,
    unit: "kg",
    stock: 200,
    condition: "Kering",
    category: "Tempurung",
    location: "Padang, Sumatera Barat",
    uploaded: "2026-07-05",
    weight: "1 kg",
    length: "8 – 12 cm",
    moisture: "12%",
    description:
      "Tempurung kelapa kering berkualitas tinggi, siap untuk produksi arang aktif, kerajinan ukir, atau bahan bakar alternatif. Dipilih manual dan bebas lumut.",
    staticImg: "/assets/tempurung.jpg",
    seller: { store_location: "Padang, Sumatera Barat", name: "Usaha Batok Minang" },
  },
  {
    id: "s4",
    name: "Daun Kelapa Kering",
    price: 5000,
    unit: "ikat",
    stock: 13,
    condition: "Kering",
    category: "Daun",
    location: "Aceh Besar, Aceh",
    uploaded: "2026-07-04",
    weight: "5 kg / ikat",
    length: "30 – 60 cm",
    moisture: "15%",
    description:
      "Daun kelapa kering berkualitas baik, bersih, dan siap digunakan untuk berbagai kebutuhan seperti anyaman, kerajinan, kompos, dan bahan bakar alami.",
    staticImg: "/assets/daun_kering.jpg",
    seller: { store_location: "Aceh Besar, Aceh", name: "Toko Hijau Nusantara" },
  },
  {
    id: "s5",
    name: "Sabut Kelapa Kering",
    price: 6500,
    unit: "karung",
    stock: 55,
    condition: "Kering",
    category: "Sabut",
    location: "Manado, Sulawesi Utara",
    uploaded: "2026-07-03",
    weight: "12 kg / karung",
    length: "20 – 30 cm",
    moisture: "10%",
    description:
      "Sabut kelapa kering sudah dikeringkan alami di bawah sinar matahari. Ringan, serabut padat, dan siap diolah menjadi keset, matras, atau media tanam hidroponik.",
    staticImg: "/assets/sabut_kering.jpg",
    seller: { store_location: "Manado, Sulawesi Utara", name: "UD Sabut Utara" },
  },
  {
    id: "s6",
    name: "Arang Batok Kelapa",
    price: 12000,
    unit: "kg",
    stock: 80,
    condition: "Kering",
    category: "Tempurung",
    location: "Lombok, Nusa Tenggara Barat",
    uploaded: "2026-07-02",
    weight: "1 kg",
    length: "2 – 5 cm",
    moisture: "5%",
    description:
      "Arang batok kelapa berkualitas ekspor dengan kadar karbon tinggi. Cocok untuk barbeque, shisha, pemurnian air, dan bahan baku karbon aktif industri.",
    staticImg: "/assets/arang_batok.jpg",
    seller: { store_location: "Lombok, NTB", name: "Lombok Charcoal Co." },
  },
];

const CONDITIONS = ["Segar", "Kering"];
const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga: Rendah ke Tinggi" },
  { value: "price_desc", label: "Harga: Tinggi ke Rendah" },
  { value: "stock_asc", label: "Stok Tersedikit" },
];

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "1 hari lalu";
  return `${diff} hari lalu`;
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [inputQ, setInputQ] = useState(searchParams.get("q") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get("/products")
      .then((res) => setApiProducts(res.data))
      .catch(() => setApiProducts([]))
      .finally(() => setLoading(false));
  }, []);

  /* merge: prefer api products, fall back to static */
  const allProducts = apiProducts.length > 0 ? apiProducts : STATIC_PRODUCTS;

  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.category?.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower)
      );
    }
    if (condition) {
      list = list.filter((p) => p.condition === condition);
    }
    if (minPrice) list = list.filter((p) => Number(p.price) >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => Number(p.price) <= Number(maxPrice));

    // Sort
    if (sort === "newest") {
      list.sort((a, b) => new Date(b.uploaded || b.created_at || 0) - new Date(a.uploaded || a.created_at || 0));
    } else if (sort === "price_asc") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price_desc") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "stock_asc") {
      list.sort((a, b) => Number(a.stock) - Number(b.stock));
    }

    return list;
  }, [allProducts, q, condition, minPrice, maxPrice, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQ(inputQ);
  };

  const clearFilter = (key) => {
    if (key === "q") { setQ(""); setInputQ(""); }
    if (key === "condition") setCondition("");
    if (key === "minPrice") setMinPrice("");
    if (key === "maxPrice") setMaxPrice("");
  };

  const activeFiltersCount = [
    condition, minPrice, maxPrice
  ].filter(Boolean).length;

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* ── Page Header ── */}
      <div style={{ borderBottom: "1px solid var(--line)", background: "#fff", padding: "40px 0 0" }}>
        <div className="container">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", color: "var(--ink)", marginBottom: 6 }}>
            Katalog Produk
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", marginBottom: 24 }}>
            Temukan limbah kelapa berkualitas dari seluruh penjuru Indonesia
          </p>

          {/* Search + Sort Bar */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 20, flexWrap: "wrap" }}>
            <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 220, position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-soft)" }} />
              <input
                value={inputQ}
                onChange={(e) => setInputQ(e.target.value)}
                placeholder="Cari produk, kategori, lokasi..."
                style={{
                  width: "100%",
                  padding: "11px 16px 11px 40px",
                  borderRadius: 999,
                  border: "1.5px solid var(--line)",
                  background: "var(--cream)",
                  fontSize: "0.9rem",
                  outline: "none",
                  color: "var(--ink)",
                }}
              />
            </form>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "11px 18px", borderRadius: 999,
                border: `1.5px solid ${showFilters ? "var(--ink)" : "var(--line)"}`,
                background: showFilters ? "var(--ink)" : "#fff",
                color: showFilters ? "#fff" : "var(--ink)",
                fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              <SlidersHorizontal size={15} />
              Filter
              {activeFiltersCount > 0 && (
                <span style={{ background: "var(--green-700)", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: "0.7rem", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div style={{ position: "relative" }}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  appearance: "none", padding: "11px 36px 11px 14px",
                  borderRadius: 999, border: "1.5px solid var(--line)",
                  background: "#fff", fontSize: "0.88rem", fontWeight: 600,
                  color: "var(--ink)", outline: "none", cursor: "pointer",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-soft)" }} />
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {showFilters && (
            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
              padding: "16px 20px", marginBottom: 20,
              background: "var(--cream)", borderRadius: 14,
              border: "1.5px solid var(--line)",
              animation: "fadeInDown 0.2s ease",
            }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-soft)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Harga</span>
              <input
                type="number" placeholder="Min"
                value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                style={{ width: 110, padding: "8px 12px", borderRadius: 10, border: "1.5px solid var(--line)", fontSize: "0.88rem", outline: "none" }}
              />
              <span style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>–</span>
              <input
                type="number" placeholder="Maks"
                value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: 110, padding: "8px 12px", borderRadius: 10, border: "1.5px solid var(--line)", fontSize: "0.88rem", outline: "none" }}
              />
              {(minPrice || maxPrice) && (
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                  style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 4 }}>
                  <X size={13} /> Reset harga
                </button>
              )}
            </div>
          )}

          {/* Condition Tabs */}
          <div style={{ display: "flex", gap: 4, borderTop: "1px solid var(--line)", marginTop: 4 }}>
            <button
              onClick={() => setCondition("")}
              style={{
                padding: "12px 20px", border: "none", background: "none", cursor: "pointer",
                fontSize: "0.88rem", fontWeight: 600,
                color: condition === "" ? "var(--ink)" : "var(--ink-soft)",
                borderBottom: `2.5px solid ${condition === "" ? "var(--ink)" : "transparent"}`,
                transition: "all 0.2s",
              }}
            >
              Semua
            </button>
            {CONDITIONS.map((c) => (
              <button
                key={c}
                onClick={() => setCondition(condition === c ? "" : c)}
                style={{
                  padding: "12px 20px", border: "none", background: "none", cursor: "pointer",
                  fontSize: "0.88rem", fontWeight: 600,
                  color: condition === c ? "var(--ink)" : "var(--ink-soft)",
                  borderBottom: `2.5px solid ${condition === c ? "var(--ink)" : "transparent"}`,
                  transition: "all 0.2s",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Filters Chips ── */}
      <div className="container">
        {(q || condition || minPrice || maxPrice) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 16 }}>
            {q && (
              <Chip label={`Pencarian: "${q}"`} onRemove={() => clearFilter("q")} />
            )}
            {condition && (
              <Chip label={`Kondisi: ${condition}`} onRemove={() => clearFilter("condition")} />
            )}
            {minPrice && (
              <Chip label={`Min: Rp${Number(minPrice).toLocaleString("id-ID")}`} onRemove={() => clearFilter("minPrice")} />
            )}
            {maxPrice && (
              <Chip label={`Maks: Rp${Number(maxPrice).toLocaleString("id-ID")}`} onRemove={() => clearFilter("maxPrice")} />
            )}
          </div>
        )}

        {/* Result count */}
        <div style={{ paddingTop: 20, paddingBottom: 4, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
          {loading ? "Memuat produk..." : `${filtered.length} produk ditemukan`}
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="container" style={{ paddingTop: 16, paddingBottom: 80 }}>
        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>--</div>
            <p style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Produk tidak ditemukan</p>
            <p>Coba ubah kata kunci atau hapus filter aktif</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }} className="catalog-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1024px) { .catalog-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .catalog-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

/* ─── ProductCard Component ─── */
function ProductCard({ product: p }) {
  const imgSrc = p.image_url || p.staticImg || "/assets/coconut.png";
  const loc = p.seller?.store_location || p.location || "Indonesia";
  const uploaded = p.uploaded || p.created_at;

  return (
    <Link
      to={`/produk/${p.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid var(--line)",
        transition: "box-shadow 0.25s, transform 0.25s",
        cursor: "pointer",
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
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          <img
            src={imgSrc}
            alt={p.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          />
          {/* Condition badge */}
          <span style={{
            position: "absolute", top: 12, left: 12,
            padding: "4px 11px", borderRadius: 999,
            fontSize: "0.72rem", fontWeight: 700,
            background: p.condition === "Segar"
              ? "rgba(52, 199, 89, 0.88)"
              : "rgba(78, 72, 57, 0.88)",
            color: "#fff",
            backdropFilter: "blur(4px)",
          }}>
            {p.condition}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px 18px" }}>
          {/* Upload time */}
          {uploaded && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
              <Clock size={11} />
              <span>Diunggah {timeAgo(uploaded)}</span>
            </div>
          )}

          <h3 style={{
            fontFamily: "var(--font-display)", fontSize: "1.1rem",
            color: "var(--ink)", marginBottom: 4, lineHeight: 1.3,
          }}>
            {p.name}
          </h3>

          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
            Rp{Number(p.price).toLocaleString("id-ID")}
            <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--ink-soft)", marginLeft: 4 }}>
              / {p.unit}
            </span>
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginBottom: 12, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {p.description}
          </p>

          {/* Specs row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px",
            background: "var(--cream)", borderRadius: 10, padding: "10px 12px",
            marginBottom: 14, fontSize: "0.78rem",
          }}>
            <SpecRow label="Berat" value={p.weight || "-"} />
            <SpecRow label="Kadar Air" value={p.moisture || "-"} />
            <SpecRow label="Asal" value={loc} />
            <SpecRow label="Stok" value={`${p.stock} ${p.unit}`} />
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              <MapPin size={12} />
              <span>{loc}</span>
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

function SpecRow({ label, value }) {
  return (
    <div>
      <div style={{ color: "var(--ink-soft)", fontSize: "0.72rem", marginBottom: 1 }}>{label}</div>
      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px 5px 12px",
      background: "var(--ink)", color: "#fff",
      borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
    }}>
      {label}
      <button onClick={(e) => { e.preventDefault(); onRemove(); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center" }}>
        <X size={13} />
      </button>
    </div>
  );
}
