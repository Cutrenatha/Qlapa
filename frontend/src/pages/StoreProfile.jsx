import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useToast } from "../context/ToastContext.jsx";
import {
  MapPin, Star, MessageSquare, Share2, Package, Store,
  CheckCircle2, Clock, Calendar, ArrowLeft, Search, Filter, ShieldCheck,
  Truck, ThumbsUp, Zap
} from "lucide-react";

export default function StoreProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const loadStore = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stores/${id}`);
      setData(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal memuat profil toko", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStore();
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link profil toko berhasil disalin!");
    } else {
      showToast("Link toko: " + window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="section" style={{ background: "#FAF7F2", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!data || !data.seller) {
    return (
      <div className="section" style={{ background: "#FAF7F2", minHeight: "80vh" }}>
        <div className="container" style={{ textAlign: "center", paddingTop: 80 }}>
          <Store size={56} color="var(--ink-soft)" strokeWidth={1.2} />
          <h2 style={{ marginTop: 16, fontFamily: "var(--font-display)" }}>Toko Tidak Ditemukan</h2>
          <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>Toko yang Anda cari tidak tersedia atau telah nonaktif.</p>
          <Link to="/produk" className="btn btn-primary">Kembali ke Katalog</Link>
        </div>
      </div>
    );
  }

  const { seller, products = [] } = data;

  // Filter products by category & search query
  const filteredProducts = products.filter((p) => {
    const matchCategory = activeCategory === "Semua" || p.category === activeCategory;
    const matchSearch = searchQuery.trim() === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const memberYear = seller.created_at ? new Date(seller.created_at).getFullYear() : 2026;

  return (
    <div style={{ background: "#FAF7F2", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header Navigation */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none", border: "none", cursor: "pointer", display: "inline-flex",
              alignItems: "center", gap: 6, color: "var(--ink)", fontWeight: 600, fontSize: "0.88rem"
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <span style={{ color: "var(--line)" }}>|</span>
          <span style={{ fontSize: "0.88rem", color: "var(--ink-soft)", fontWeight: 500 }}>
            Profil Toko Penjual
          </span>
        </div>
      </div>

      <div className="container" style={{ marginTop: 24 }}>
        {/* Modern Store Hero Banner & Header Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            border: "1px solid var(--line)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          {/* Aesthetic Cover Banner */}
          <div
            style={{
              height: 180,
              background: "linear-gradient(135deg, #1F2E24 0%, #3D5A45 50%, #5C3D2E 100%)",
              position: "relative",
              padding: "20px 28px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-start",
            }}
          >
            {/* Ambient pattern overlay */}
            <div
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.1,
                backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />

            <span
              style={{
                position: "relative",
                zIndex: 2,
                background: "rgba(255, 255, 255, 0.18)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "6px 16px",
                borderRadius: 999,
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShieldCheck size={15} color="#A7F3D0" /> Terverifikasi Qlapa
            </span>
          </div>

          {/* Profile Header Content Section */}
          <div style={{ padding: "0 32px 32px", position: "relative" }}>
            {/* Avatar positioned neatly overlapping cover without blocking text */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Store Avatar */}
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 24,
                    border: "4px solid #fff",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "2.4rem",
                    color: "var(--green-900)",
                    overflow: "hidden",
                    marginTop: -50,
                  }}
                >
                  {seller.store_image_url || seller.avatar_url ? (
                    <img
                      src={seller.store_image_url || seller.avatar_url}
                      alt={seller.store_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--green-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {seller.store_name?.charAt(0) || "T"}
                    </div>
                  )}
                </div>

                {/* Store Title & Location */}
                <div style={{ marginTop: 4 }}>
                  <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", margin: 0, letterSpacing: "-0.02em" }}>
                    {seller.store_name}
                  </h1>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 8, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--ink)" }}>
                      <MapPin size={15} color="var(--brown-500)" /> {seller.store_location}
                    </span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={15} /> Bergabung sejak {memberYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  className="btn btn-secondary"
                  style={{ borderRadius: 12, padding: "10px 18px", fontSize: "0.88rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={handleShare}
                >
                  <Share2 size={16} /> Bagikan
                </button>
                <button
                  className="btn btn-primary"
                  style={{ borderRadius: 12, padding: "10px 22px", fontSize: "0.88rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={() => navigate(`/chat?to=${seller.id}`)}
                >
                  <MessageSquare size={16} /> Chat Penjual
                </button>
              </div>
            </div>

            {/* Description / About Store */}
            {seller.store_description && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", lineHeight: 1.6, margin: 0, maxWidth: 840 }}>
                  {seller.store_description}
                </p>
              </div>
            )}

            {/* Premium Store Stats Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px solid var(--line)",
              }}
            >
              <div style={{ background: "#FAF7F2", padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-soft)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <Package size={15} color="var(--brown-500)" /> Total Produk
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>
                  {seller.product_count} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--ink-soft)" }}>Produk</span>
                </div>
              </div>

              <div style={{ background: "#FAF7F2", padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-soft)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <Star size={15} color="#F59E0B" fill="#F59E0B" /> Rating Toko
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  {seller.avg_rating || "5.0"}
                  <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-soft)" }}>({seller.review_count} ulasan)</span>
                </div>
              </div>

              <div style={{ background: "#FAF7F2", padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-soft)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <Zap size={15} color="var(--green-700)" /> Performa Chat
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>
                  100% <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--green-900)" }}>Responsif</span>
                </div>
              </div>

              <div style={{ background: "#FAF7F2", padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-soft)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <Truck size={15} color="var(--ink)" /> Pengiriman
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>
                  1 - 2 <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--ink-soft)" }}>Hari Kerja</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Section Header & Filters */}
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>
                Katalog Produk Toko ({filteredProducts.length})
              </h2>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", margin: "4px 0 0 0" }}>
                Daftar limbah dan hasil olahan kelapa resmi dari {seller.store_name}
              </p>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", minWidth: 280 }}>
              <Search size={16} color="var(--ink-soft)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Cari produk di toko ini..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 42px",
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  fontSize: "0.88rem",
                  background: "#fff",
                  outline: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {["Semua", "Bahan Baku", "Produk Olahan"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 999,
                  border: "1px solid " + (activeCategory === cat ? "var(--ink)" : "var(--line)"),
                  background: activeCategory === cat ? "var(--ink)" : "#fff",
                  color: activeCategory === cat ? "#fff" : "var(--ink)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: activeCategory === cat ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="card" style={{ padding: 56, textAlign: "center", background: "#fff", borderRadius: 20, border: "1px solid var(--line)" }}>
              <Package size={48} color="var(--ink-soft)" strokeWidth={1.2} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>Tidak Ada Produk</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", margin: 0 }}>
                {searchQuery ? `Tidak ada hasil pencarian untuk "${searchQuery}"` : "Toko ini belum memiliki produk pada kategori ini."}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                gap: 22,
              }}
            >
              {filteredProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/produk/${p.id}`}
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <div
                    style={{
                      borderRadius: 18,
                      border: "1px solid var(--line)",
                      background: "#fff",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.03)";
                    }}
                  >
                    {/* Image Container */}
                    <div style={{ position: "relative", height: 170, overflow: "hidden", background: "#F5F5F7" }}>
                      <img
                        src={p.image_url || "/assets/coconut.png"}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.src = "/assets/coconut.png"; }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          padding: "4px 12px",
                          borderRadius: 999,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          background: "rgba(31, 46, 36, 0.85)",
                          color: "#fff",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {p.category}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      <div style={{ fontSize: "0.74rem", color: "var(--ink-soft)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                        Kondisi: <strong style={{ color: "var(--ink)" }}>{p.condition || "Kering"}</strong>
                      </div>

                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.98rem",
                          fontWeight: 700,
                          color: "var(--ink)",
                          lineHeight: 1.4,
                          marginBottom: 10,
                          flexGrow: 1,
                        }}
                      >
                        {p.name}
                      </h3>

                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", marginBottom: 12 }}>
                        Rp{Number(p.price).toLocaleString("id-ID")}
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--ink-soft)", marginLeft: 4 }}>
                          / {p.unit}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--line)", fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color: "var(--ink)" }}>
                          <Star size={13} fill="#F59E0B" color="#F59E0B" /> {p.avg_rating || "5.0"}
                        </span>
                        <span style={{ fontWeight: 500 }}>Stok {p.stock} {p.unit}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
