import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Cart() {
  const { items, updateQty, removeItem, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goCheckout = () => {
    if (!user) return navigate("/masuk");
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="section container">
        <div className="empty-state">
          <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>🛒</div>
          <h3>Keranjangmu masih kosong</h3>
          <p style={{ marginTop: 8 }}>Yuk jelajahi limbah kelapa yang bisa kamu manfaatkan.</p>
          <Link to="/produk" className="btn btn-primary" style={{ marginTop: 18 }}>Jelajahi Produk</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section container" style={{ minHeight: '80vh' }}>
      <h1 style={{ fontSize: "2.2rem", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 28, color: "var(--ink)" }}>Keranjang Belanja</h1>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }} className="cart-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map(({ product, qty }) => (
            <div key={product.id} className="card" style={{ display: "flex", padding: 18, gap: 18, alignItems: "center", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ width: 84, height: 84, borderRadius: 12, overflow: "hidden", background: "var(--cream-2)", flexShrink: 0 }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🥥</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)", marginBottom: 4 }}>{product.name}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  Rp{Number(product.price).toLocaleString("id-ID")} / {product.unit}
                </div>
              </div>
              <div className="row" style={{ background: "rgba(0,0,0,0.04)", borderRadius: 999, padding: "2px 6px" }}>
                <button className="btn btn-ghost" style={{ padding: "6px 10px", minWidth: 28 }} onClick={() => updateQty(product.id, qty - 1)}>−</button>
                <span style={{ padding: "0 10px", fontWeight: 700, color: "var(--ink)", fontSize: "0.9rem" }}>{qty}</span>
                <button className="btn btn-ghost" style={{ padding: "6px 10px", minWidth: 28 }} onClick={() => updateQty(product.id, qty + 1)}>+</button>
              </div>
              <div style={{ fontWeight: 700, width: 120, textAlign: "right", fontSize: "1.05rem", color: "var(--ink)" }}>
                Rp{(product.price * qty).toLocaleString("id-ID")}
              </div>
              <button className="btn btn-ghost" style={{ color: "var(--danger)", padding: 8, borderRadius: "50%" }} onClick={() => removeItem(product.id)}>✕</button>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ padding: 24, height: "fit-content", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 20, color: "var(--ink)" }}>Ringkasan</h3>
            <div className="row between" style={{ marginBottom: 12, fontSize: "0.95rem" }}>
              <span style={{ color: "var(--ink-soft)" }}>Subtotal</span>
              <strong style={{ fontSize: "1.1rem", color: "var(--ink)" }}>Rp{total.toLocaleString("id-ID")}</strong>
            </div>
            <p className="field-hint" style={{ marginBottom: 20, lineHeight: 1.5 }}>
              Ongkos kirim dihitung & dinegosiasikan langsung dengan penjual via obrolan.
            </p>
            <button className="btn btn-primary btn-block" style={{ padding: "14px 24px" }} onClick={goCheckout}>Checkout</button>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 800px) { .cart-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
