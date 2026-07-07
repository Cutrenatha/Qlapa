import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const load = () => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
  };

  useEffect(() => { load(); }, [id]);

  if (!product) {
    return <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>;
  }

  const askAI = async () => {
    setAiLoading(true);
    try {
      const res = await api.get("/ai/recommendation", { params: { category: product.category } });
      setAiReply(res.data.recommendation);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToCart = () => {
    addItem(product, qty);
    showToast(`${product.name} ditambahkan ke keranjang`);
  };

  const handleChat = () => {
    if (!user) return navigate("/masuk");
    navigate(`/chat?to=${product.seller_id}&product=${product.id}`);
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
    <div className="section" style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56 }} className="pd-grid">
          <div>
            <div className="card" style={{ aspectRatio: "4/3", overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-md)" }}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="empty-state" style={{ fontSize: "4rem" }}>🥥</div>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span className="badge">{product.category}</span>
              {product.condition && <span className="badge badge-brown">{product.condition}</span>}
            </div>
            <h1 style={{ fontSize: "2.4rem", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>{product.name}</h1>
            <div style={{ fontSize: "1.9rem", color: "var(--ink)", fontWeight: 700, marginTop: 10, display: "flex", alignItems: "baseline", gap: 6 }}>
              Rp{Number(product.price).toLocaleString("id-ID")}
              <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink-soft)" }}>/ {product.unit}</span>
            </div>
            <p style={{ marginTop: 8, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
              Stok: <strong>{product.stock} {product.unit}</strong> &nbsp;·&nbsp; 📍 {product.seller?.store_location || "-"}
              {product.avg_rating && <> &nbsp;·&nbsp; ⭐ {product.avg_rating} ({product.review_count} ulasan)</>}
            </p>

            {/* Siri-like Apple Intelligence box for Qlapa AI */}
            <div className="card" style={{ padding: 20, marginTop: 24, background: "rgba(43, 80, 52, 0.03)", border: "1px solid rgba(43, 80, 52, 0.12)" }}>
              <div style={{ fontWeight: 700, color: "var(--green-700)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontSize: "0.92rem" }}>
                <span>✨</span> Deskripsi oleh Qlapa AI
              </div>
              <p style={{ color: "var(--ink)", fontSize: "0.9rem", lineHeight: 1.6 }}>{product.ai_description}</p>
            </div>

            <div className="row gap-16" style={{ marginTop: 28, alignItems: "center", flexWrap: "wrap" }}>
              <div className="row" style={{ background: "rgba(0,0,0,0.04)", borderRadius: 999, padding: "4px 8px", alignItems: "center" }}>
                <button className="btn btn-ghost" style={{ padding: "8px 12px", minWidth: 32 }} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span style={{ padding: "0 12px", fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>{qty}</span>
                <button className="btn btn-ghost" style={{ padding: "8px 12px", minWidth: 32 }} onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button className="btn btn-primary" style={{ padding: "14px 28px" }} onClick={handleAddToCart} disabled={product.stock <= 0}>
                {product.stock <= 0 ? "Stok habis" : "🛒 Tambah ke Keranjang"}
              </button>
              <button className="btn btn-outline" style={{ padding: "13px 26px" }} onClick={handleChat}>💬 Chat Penjual</button>
            </div>

            {/* AI Potential analysis widget */}
            <div className="card" style={{ padding: 20, marginTop: 24, border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="row between" style={{ gap: 12 }}>
                <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.92rem" }}>💡 Tanya potensi pemanfaatan limbah ini</div>
                <button className="btn btn-secondary btn-sm" onClick={askAI} disabled={aiLoading}>
                  {aiLoading ? "Menganalisis…" : "Tanya Qlapa AI"}
                </button>
              </div>
              {aiReply && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)", color: "var(--ink)", fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {aiReply}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: 56, maxWidth: 640 }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: 16 }}>Ulasan Pembeli</h3>
          {product.reviews?.length === 0 && <p>Belum ada ulasan untuk produk ini.</p>}
          <div className="grid" style={{ gap: 12 }}>
            {product.reviews?.map((r) => (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div className="row between">
                  <strong>{r.buyer_name}</strong>
                  <span>{"⭐".repeat(r.rating)}</span>
                </div>
                {r.comment && <p style={{ marginTop: 6 }}>{r.comment}</p>}
              </div>
            ))}
          </div>

          {user && user.id !== product.seller_id && (
            <form onSubmit={submitReview} className="card" style={{ padding: 16, marginTop: 16 }}>
              <div className="field">
                <label>Rating</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"⭐".repeat(n)}</option>)}
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
        @media (max-width: 800px) {
          .pd-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
