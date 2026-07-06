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
    <div className="section">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="pd-grid">
          <div>
            <div className="card" style={{ aspectRatio: "4/3", overflow: "hidden" }}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="empty-state">🥥</div>
              )}
            </div>
          </div>

          <div>
            <span className="badge">{product.category}</span>
            <h1 style={{ fontSize: "2rem", marginTop: 12 }}>{product.name}</h1>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", color: "var(--green-800)", fontWeight: 700, marginTop: 10 }}>
              Rp{Number(product.price).toLocaleString("id-ID")} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink-soft)" }}>/ {product.unit}</span>
            </div>
            <p style={{ marginTop: 6, fontSize: "0.85rem" }}>
              Stok: {product.stock} {product.unit} · 📍 {product.seller?.store_location || "-"}
              {product.avg_rating && <> · ⭐ {product.avg_rating} ({product.review_count} ulasan)</>}
            </p>

            <div className="card" style={{ padding: 16, marginTop: 20, background: "var(--green-100)", border: "1px solid var(--green-500)" }}>
              <div style={{ fontWeight: 700, color: "var(--green-800)", marginBottom: 6 }}>🤖 Deskripsi oleh Qlapa AI</div>
              <p style={{ color: "var(--ink)" }}>{product.ai_description}</p>
            </div>

            <div className="row gap-12" style={{ marginTop: 24, alignItems: "center" }}>
              <div className="row" style={{ border: "1.5px solid var(--line)", borderRadius: 999, overflow: "hidden" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span style={{ padding: "0 14px", fontWeight: 600 }}>{qty}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button className="btn btn-primary" onClick={handleAddToCart} disabled={product.stock <= 0}>
                {product.stock <= 0 ? "Stok habis" : "🛒 Tambah ke Keranjang"}
              </button>
              <button className="btn btn-outline" onClick={handleChat}>💬 Chat Penjual</button>
            </div>

            <div className="card" style={{ padding: 16, marginTop: 24 }}>
              <div className="row between">
                <div style={{ fontWeight: 700 }}>💡 Tanya potensi pemanfaatan limbah ini</div>
                <button className="btn btn-secondary btn-sm" onClick={askAI} disabled={aiLoading}>
                  {aiLoading ? "Menganalisis…" : "Tanya Qlapa AI"}
                </button>
              </div>
              {aiReply && <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{aiReply}</p>}
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
