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
    <div className="section container">
      <h1 style={{ fontSize: "1.8rem", marginBottom: 24 }}>Keranjang Belanja</h1>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }} className="cart-grid">
        <div className="grid" style={{ gap: 12 }}>
          {items.map(({ product, qty }) => (
            <div key={product.id} className="card" style={{ display: "flex", padding: 14, gap: 14, alignItems: "center" }}>
              <div style={{ width: 76, height: 76, borderRadius: 10, overflow: "hidden", background: "var(--cream-2)", flexShrink: 0 }}>
                {product.image_url && <img src={product.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{product.name}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  Rp{Number(product.price).toLocaleString("id-ID")} / {product.unit}
                </div>
              </div>
              <div className="row" style={{ border: "1.5px solid var(--line)", borderRadius: 999 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => updateQty(product.id, qty - 1)}>−</button>
                <span style={{ padding: "0 10px", fontWeight: 600 }}>{qty}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => updateQty(product.id, qty + 1)}>+</button>
              </div>
              <div style={{ fontWeight: 700, width: 110, textAlign: "right" }}>
                Rp{(product.price * qty).toLocaleString("id-ID")}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => removeItem(product.id)}>✕</button>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 20, height: "fit-content" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>Ringkasan</h3>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span>Subtotal</span>
            <strong>Rp{total.toLocaleString("id-ID")}</strong>
          </div>
          <p className="field-hint" style={{ marginBottom: 16 }}>Ongkos kirim dihitung & dinegosiasikan langsung dengan penjual via obrolan.</p>
          <button className="btn btn-primary btn-block" onClick={goCheckout}>Checkout</button>
        </div>
      </div>
      <style>{`@media (max-width: 800px) { .cart-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
