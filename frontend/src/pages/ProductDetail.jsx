import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  MapPin, Package, Clock, ShoppingCart, MessageSquare, ArrowRight, Star
} from "lucide-react";

/* ─── Static demo data (fallback/matching ids starting with "s") ─── */
const STATIC_PRODUCTS = [
  {
    id: "s1",
    name: "Sabut Kelapa Segar",
    price: 8000,
    unit: "karung",
    stock: 40,
    condition: "Segar",
    category: "Segar",
    location: "Aceh Besar, Aceh",
    uploaded: "2026-07-07",
    weight: "15 kg / karung",
    length: "25 – 35 cm",
    moisture: "65%",
    description:
      "Sabut kelapa segar belum diproses, cocok untuk media tanam, kerajinan tangan, atau bahan baku cocofiber. Kualitas terjaga, langsung dari petani.",
    staticImg: "/assets/sabut_segar.jpg",
    seller: { store_location: "Aceh Besar, Aceh", store_name: "Toko Hijau Nusantara" },
  },
  {
    id: "s2",
    name: "Ampas Kelapa Segar",
    price: 3000,
    unit: "kg",
    stock: 120,
    condition: "Segar",
    category: "Segar",
    location: "Makassar, Sulawesi Selatan",
    uploaded: "2026-07-06",
    weight: "1 kg",
    length: "-",
    moisture: "70%",
    description:
      "Ampas kelapa segar hasil pemerasan santan, masih mengandung lemak dan serat tinggi. Ideal untuk pakan ternak, biogas, atau fermentasi pupuk organik.",
    staticImg: "/assets/ampas_segar.jpg",
    seller: { store_location: "Makassar, Sulawesi Selatan", store_name: "CV Kelapa Makmur" },
  },
  {
    id: "s3",
    name: "Tempurung Kelapa",
    price: 5500,
    unit: "kg",
    stock: 200,
    condition: "Kering",
    category: "Kering",
    location: "Padang, Sumatera Barat",
    uploaded: "2026-07-05",
    weight: "1 kg",
    length: "8 – 12 cm",
    moisture: "12%",
    description:
      "Tempurung kelapa kering berkualitas tinggi, siap untuk produksi arang aktif, kerajinan ukir, atau bahan bakar alternatif. Dipilih manual dan bebas lumut.",
    staticImg: "/assets/tempurung.jpg",
    seller: { store_location: "Padang, Sumatera Barat", store_name: "Usaha Batok Minang" },
  },
  {
    id: "s4",
    name: "Daun Kelapa Kering",
    price: 5000,
    unit: "ikat",
    stock: 13,
    condition: "Kering",
    category: "Kering",
    location: "Aceh Besar, Aceh",
    uploaded: "2026-07-04",
    weight: "5 kg / ikat",
    length: "30 – 60 cm",
    moisture: "15%",
    description:
      "Daun kelapa kering berkualitas baik, bersih, dan siap digunakan untuk berbagai kebutuhan seperti anyaman, kerajinan, kompos, dan bahan bakar alami.",
    staticImg: "/assets/daun_kering.jpg",
    seller: { store_location: "Aceh Besar, Aceh", store_name: "Toko Hijau Nusantara" },
  },
  {
    id: "s5",
    name: "Sabut Kelapa Kering",
    price: 6500,
    unit: "karung",
    stock: 55,
    condition: "Kering",
    category: "Kering",
    location: "Manado, Sulawesi Utara",
    uploaded: "2026-07-03",
    weight: "12 kg / karung",
    length: "20 – 30 cm",
    moisture: "10%",
    description:
      "Sabut kelapa kering sudah dikeringkan alami di bawah sinar matahari. Ringan, serabut padat, dan siap diolah menjadi keset, matras, atau media tanam hidroponik.",
    staticImg: "/assets/sabut_kering.jpg",
    seller: { store_location: "Manado, Sulawesi Utara", store_name: "UD Sabut Utara" },
  },
  {
    id: "s6",
    name: "Arang Batok Kelapa",
    price: 12000,
    unit: "kg",
    stock: 80,
    condition: "Kering",
    category: "Kering",
    location: "Lombok, Nusa Tenggara Barat",
    uploaded: "2026-07-02",
    weight: "1 kg",
    length: "2 – 5 cm",
    moisture: "5%",
    description:
      "Arang batok kelapa berkualitas ekspor dengan kadar karbon tinggi. Cocok untuk barbeque, shisha, pemurnian air, dan bahan baku karbon aktif industri.",
    staticImg: "/assets/arang_batok.jpg",
    seller: { store_location: "Lombok, NTB", store_name: "Lombok Charcoal Co." },
  },
];

function timeAgo(dateStr) {
  if (!dateStr) return "Baru saja";
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 86400000);
  if (diff <= 0) return "Hari ini";
  if (diff === 1) return "1 hari lalu";
  return `${diff} hari lalu`;
}

const getAiResponse = (productName) => {
  const name = productName.toLowerCase();
  if (name.includes("batok") || name.includes("tempurung")) {
    return `Analisis Qlapa AI:
Batok kelapa adalah limbah bernilai ekonomi tinggi. Berikut potensinya:

Briket Arang: Sangat dicari pasar ekspor dengan harga tinggi.
Asap Cair: Produk sampingan proses pembakaran untuk pengawet alami.
Kerajinan: Bahan baku untuk mangkuk dan peralatan estetik.
Saya juga dapat merekomendasikan pembeli briket terdekat di sekitar Anda!`;
  }
  if (name.includes("sabut")) {
    return `Analisis Qlapa AI:
Sabut kelapa adalah serat alam serbaguna dengan potensi sirkular tinggi. Berikut potensinya:

Cocofiber: Bahan dasar keset, sapu, jok mobil, dan geotekstil penahan erosi.
Cocopeat: Media tanam hidroponik dengan daya ikat air luar biasa.
Pupuk Organik: Mengandung kalium tinggi untuk menyuburkan tanaman.
Saya juga dapat merekomendasikan industri pengolahan serat terdekat untuk Anda!`;
  }
  if (name.includes("ampas")) {
    return `Analisis Qlapa AI:
Ampas kelapa basah masih menyimpan kandungan nutrisi yang melimpah. Berikut potensinya:

Pakan Ternak: Bahan baku pakan ayam atau sapi bernutrisi tinggi melalui fermentasi.
Tepung Kelapa: Dikeringkan dan diayak untuk bahan kue bebas gluten.
Pupuk Kompos: Campuran organik yang mempercepat kegemburan tanah.
Saya juga dapat menghubungkan Anda dengan peternak lokal yang membutuhkan pasokan harian!`;
  }
  if (name.includes("daun")) {
    return `Analisis Qlapa AI:
Daun kelapa kering memiliki struktur serat yang kuat untuk berbagai kerajinan. Berikut potensinya:

Kerajinan Anyaman: Bahan utama sapu lidi, piring lidi, dan keranjang estetik.
Atap Tradisional: Bahan penutup bangunan ramah lingkungan dan sejuk.
Mulsa Organik: Pelindung tanah dari gulma dan menjaga kelembapan perkebunan.
Saya juga dapat merekomendasikan pengrajin anyaman mitra Qlapa di daerah Anda!`;
  }
  return `Analisis Qlapa AI:
Limbah kelapa ini memiliki nilai ekonomi tinggi jika diolah kembali. Hubungi penjual atau tanyakan kepada komunitas Qlapa untuk ide kreasi lokal terdekat.`;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [activeTab, setActiveTab] = useState("info"); // info / pengiriman

  const load = () => {
    if (id.toString().startsWith("s")) {
      const found = STATIC_PRODUCTS.find((p) => p.id === id);
      setProduct(found || null);
    } else {
      api.get(`/products/${id}`)
        .then((res) => {
          setProduct(res.data);
        })
        .catch(() => {
          // fallback to static products based on ID mapping
          const nameMap = {
            1: "s1", 2: "s2", 3: "s3", 4: "s4", 5: "s5", 6: "s6"
          };
          const staticId = nameMap[id] || `s${id}`;
          const found = STATIC_PRODUCTS.find((p) => p.id === staticId);
          setProduct(found || null);
        });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!product) {
    return <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>;
  }

  const askAI = async () => {
    setAiReply("");
    setIsTyping(true);
    setAiLoading(true);

    try {
      const response = await api.get("/ai/recommendation", {
        params: {
          category: product.type || product.category || product.name,
          product_name: product.name,
        },
      });
      setAiReply(response.data.recommendation);
    } catch (err) {
      console.error(err);
      setAiReply("Gagal mendapatkan saran dari Qlapa AI. Silakan coba lagi 🌱.");
    } finally {
      setIsTyping(false);
      setAiLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      showToast("Silakan masuk terlebih dahulu untuk menambahkan ke keranjang", "error");
      navigate("/masuk");
      return;
    }
    addItem(product, 1);
    showToast(`${product.name} ditambahkan ke keranjang`);
  };

  const handleBuyNow = () => {
    if (!user) {
      showToast("Silakan masuk terlebih dahulu untuk membeli", "error");
      navigate("/masuk");
      return;
    }
    clearCart();
    addItem(product, 1);
    navigate("/checkout");
  };

  const handleChat = () => {
    if (!user) return navigate("/masuk");
    navigate(`/chat?to=${product.seller_id || 1}&product=${product.id}`);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      setReviewComment("");
      showToast("Ulasan terkirim, terima kasih!");
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal mengirim ulasan", "error");
    }
  };

  return (
    <div className="section" style={{ background: "var(--cream)", minHeight: "90vh", paddingBottom: 120 }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 48 }} className="pd-grid">
          {/* ── Left Column: Media + Store Details ── */}
          <div>
            <div className="card" style={{ aspectRatio: "4/3", overflow: "hidden", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", position: "relative" }}>
              <img
                src={product.image_url || product.staticImg || "/assets/coconut.png"}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }}></span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }}></span>
              </div>
            </div>

            {/* Informasi Penjual & Pengiriman tabs */}
            <div style={{ display: "flex", gap: 16, marginTop: 24, borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
              <button
                onClick={() => setActiveTab("info")}
                style={{
                  background: "none", border: "none", paddingBottom: 8, fontSize: "0.9rem", fontWeight: 700,
                  color: activeTab === "info" ? "var(--ink)" : "var(--ink-soft)",
                  borderBottom: `2.5px solid ${activeTab === "info" ? "var(--ink)" : "transparent"}`,
                  cursor: "pointer"
                }}
              >
                Informasi Penjual
              </button>
              <button
                onClick={() => setActiveTab("pengiriman")}
                style={{
                  background: "none", border: "none", paddingBottom: 8, fontSize: "0.9rem", fontWeight: 700,
                  color: activeTab === "pengiriman" ? "var(--ink)" : "var(--ink-soft)",
                  borderBottom: `2.5px solid ${activeTab === "pengiriman" ? "var(--ink)" : "transparent"}`,
                  cursor: "pointer"
                }}
              >
                Pengiriman
              </button>
            </div>

            {activeTab === "info" ? (
              <div className="card" style={{ padding: 20, marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--green-100)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--green-900)", fontSize: "1.1rem", overflow: "hidden" }}>
                  {product.seller?.store_image_url || product.seller?.avatar_url ? (
                    <img
                      src={product.seller.store_image_url || product.seller.avatar_url}
                      alt={product.seller.store_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    product.seller?.store_name?.charAt(0) || "T"
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem" }}>
                    {product.seller?.store_name || "Toko Hijau Nusantara"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <MapPin size={12} /> {product.seller?.store_location || product.location || "Aceh Besar, Aceh"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 20, marginTop: 16, color: "var(--ink-soft)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                <div>Metode Pengiriman: <strong>Kargo & Pick-up Sendiri</strong></div>
                <div style={{ marginTop: 6 }}>Lokasi Muat: <strong>{product.seller?.store_location || product.location || "Aceh Besar, Aceh"}</strong></div>
                <div style={{ marginTop: 6 }}>Waktu Proses Kirim: <strong>1 - 2 Hari kerja</strong></div>
              </div>
            )}
          </div>

          {/* ── Right Column: Specs & Actions ── */}
          <div>
            {/* Upload Date Pill */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span className="badge" style={{ background: "rgba(0, 0, 0, 0.05)", color: "var(--ink-soft)", gap: 4 }}>
                <Clock size={12} /> Di upload {timeAgo(product.uploaded || product.created_at)}
              </span>
              <span className="badge badge-brown">{product.condition}</span>
            </div>

            <h1 className="pd-title" style={{ fontSize: "2.1rem", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 8, lineHeight: 1.2 }}>
              {product.name}
            </h1>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
              <span className="pd-price-value" style={{ fontSize: "1.8rem", color: "var(--ink)", fontWeight: 700 }}>
                Rp{Number(product.price).toLocaleString("id-ID")}
              </span>
              <span className="pd-price-unit" style={{ fontSize: "0.95rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                / {product.unit}
              </span>
              <span className="pd-price-stock" style={{ fontSize: "0.88rem", color: "var(--ink-soft)", marginLeft: "auto" }}>
                stok tersedia: <strong>{product.stock} {product.unit}</strong>
              </span>
            </div>

            <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: 24 }}>
              {product.ai_description || product.description}
            </p>

            {/* Qlapa AI Assistant widget */}
            <div className="card" style={{ padding: 20, marginBottom: 24, border: "1.5px solid var(--line)" }}>
              <div className="row between" style={{ gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.92rem", marginBottom: 2 }}>
                    Masih bingung cara memanfaatkannya?
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                    Tanyakan ke Qlapa AI untuk ide penggunaan, pengolahan, atau potensi jualnya.
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={askAI}
                  disabled={aiLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                >
                  Tanya
                  <ArrowRight size={14} />
                </button>
              </div>

              {isTyping && (
                <div style={{ display: "flex", gap: 5, padding: "12px 16px", background: "rgba(0,0,0,0.04)", borderRadius: 14, width: "fit-content", marginTop: 16 }}>
                  <span className="dot" style={{ width: 6, height: 6, background: "var(--ink-soft)", borderRadius: "50%", animation: "blink 1.4s infinite both" }}></span>
                  <span className="dot" style={{ width: 6, height: 6, background: "var(--ink-soft)", borderRadius: "50%", animation: "blink 1.4s infinite both 0.2s" }}></span>
                  <span className="dot" style={{ width: 6, height: 6, background: "var(--ink-soft)", borderRadius: "50%", animation: "blink 1.4s infinite both 0.4s" }}></span>
                </div>
              )}

              {aiReply && (
                <div style={{
                  marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)",
                  color: "var(--ink)", fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap",
                  animation: "fadeInDown 0.3s ease"
                }}>
                  {aiReply}
                </div>
              )}
            </div>

            {/* Specifications Card */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>Spesifikasi</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <tbody>
                  <SpecRow label="Kategori" value={product.category || "-"} />
                  <SpecRow label="Jenis" value={product.type || "-"} />
                  <SpecRow label="Kondisi" value={product.condition || "-"} />
                  {product.quality && <SpecRow label="Kualitas" value={product.quality} />}
                  <SpecRow label="Stok Tersedia" value={`${product.stock} ${product.unit}`} />
                  {product.manual_note && <SpecRow label="Catatan Penjual" value={product.manual_note} />}
                  <SpecRow label="Lokasi Penjual" value={product.seller?.store_location || "-"} />
                </tbody>
              </table>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="pd-action-bar" style={{
              display: "flex", gap: 12, marginTop: 24, alignItems: "center"
            }}>
              {/* Add to Cart (Icon only) */}
              <button
                className="btn btn-outline pd-btn-cart"
                style={{ padding: "14px 16px", borderRadius: "14px" }}
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                <ShoppingCart size={18} />
              </button>

              {/* Chat Penjual */}
              <button
                className="btn btn-outline pd-btn-chat"
                style={{ padding: "14px 24px", borderRadius: "14px", display: "inline-flex", alignItems: "center", gap: 8 }}
                onClick={handleChat}
              >
                <MessageSquare size={16} />
                <span className="pd-btn-chat-text">Chat Penjual</span>
              </button>

              {/* Beli Sekarang (Directly Checkout) */}
              <button
                className="btn btn-primary pd-btn-buy"
                style={{ padding: "14px 28px", borderRadius: "14px", flex: 1, fontWeight: 700 }}
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? "Stok Habis" : `Beli Sekarang (Rp${Number(product.price).toLocaleString("id-ID")})`}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: 56, maxWidth: 640 }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: 16 }}>Ulasan Pembeli</h3>
          {product.reviews?.length === 0 && <p style={{ color: "var(--ink-soft)" }}>Belum ada ulasan untuk produk ini.</p>}
          <div className="grid" style={{ gap: 12 }}>
            {product.reviews?.map((r) => (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div className="row between">
                  <strong>{r.buyer_name}</strong>
                  <span style={{ display: "inline-flex", gap: 2, color: "var(--brown-500)" }}>
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <Star key={idx} size={13} fill="currentColor" />
                    ))}
                  </span>
                </div>
                {r.comment && <p style={{ marginTop: 6, fontSize: "0.88rem", color: "var(--ink-soft)" }}>{r.comment}</p>}
              </div>
            ))}
          </div>

          {user && user.id !== product.seller_id && (
            <form onSubmit={submitReview} className="card" style={{ padding: 16, marginTop: 16 }}>
              <div className="field">
                <label>Rating</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Bintang</option>)}
                </select>
              </div>
              <div className="field">
                <label>Komentar</label>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Bagaimana kualitas produknya?" />
              </div>
              <button className="btn btn-primary btn-sm" type="submit">Kirim Ulasan</button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 800px) {
          .pd-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .pd-title {
            font-size: 1.35rem !important;
            line-height: 1.3 !important;
            margin-bottom: 8px !important;
          }
          .pd-price-value {
            font-size: 1.25rem !important;
          }
          .pd-price-unit {
            font-size: 0.8rem !important;
          }
          .pd-price-stock {
            font-size: 0.76rem !important;
          }
          .pd-grid p {
            font-size: 0.8rem !important;
            line-height: 1.45 !important;
          }
          .pd-grid .badge {
            font-size: 0.72rem !important;
            padding: 4px 10px !important;
          }
        }
        @media (max-width: 576px) {
          .pd-title {
            font-size: 1.15rem !important;
            line-height: 1.25 !important;
            margin-bottom: 6px !important;
          }
          .pd-price-value {
            font-size: 1.15rem !important;
          }
          .pd-price-unit {
            font-size: 0.75rem !important;
          }
          .pd-price-stock {
            font-size: 0.72rem !important;
          }
          .pd-grid .badge {
            font-size: 0.65rem !important;
            padding: 3px 8px !important;
          }
          /* Sticky bottom action bar at the foot of screen */
          .pd-action-bar {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            background: #ffffff !important;
            border-top: 1px solid var(--line) !important;
            padding: 10px 16px !important;
            box-shadow: 0 -6px 20px rgba(0,0,0,0.06) !important;
            z-index: 9999 !important;
            margin-top: 0 !important;
            gap: 10px !important;
            box-sizing: border-box !important;
          }
          .pd-btn-cart {
            padding: 10px !important;
            width: 44px !important;
            height: 44px !important;
            border-radius: 12px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .pd-btn-chat {
            padding: 10px !important;
            width: 44px !important;
            height: 44px !important;
            border-radius: 12px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0 !important;
          }
          .pd-btn-chat-text {
            display: none !important;
          }
          .pd-btn-buy {
            padding: 10px 14px !important;
            height: 44px !important;
            border-radius: 12px !important;
            font-size: 0.82rem !important;
            flex: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: 700 !important;
          }
          /* Hide footer on mobile inside product detail page */
          footer, .footer, .site-footer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SpecRow({ label, value }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--line)" }}>
      <td style={{ padding: "10px 0", color: "var(--ink-soft)", width: "30%" }}>{label}</td>
      <td style={{ padding: "10px 0", fontWeight: 600, color: "var(--ink)", textAlign: "right" }}>{value}</td>
    </tr>
  );
}
