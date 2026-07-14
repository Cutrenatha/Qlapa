import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ShoppingCart, Package, Trash2, LogIn } from "lucide-react";

export default function Cart() {
  const { items, updateQty, removeItem, total, toggleSelect, selectAll, clearSelected } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Guard: harus login
  if (!user) {
    return (
      <div className="section container">
        <div className="empty-state">
          <div style={{ color: "var(--ink-soft)", marginBottom: 16 }}><ShoppingCart size={48} strokeWidth={1.5} /></div>
          <h3>Masuk untuk melihat keranjang</h3>
          <p style={{ marginTop: 8, color: "var(--ink-soft)" }}>Silakan masuk atau daftar terlebih dahulu untuk menggunakan keranjang belanja.</p>
          <Link to="/masuk" className="btn btn-primary" style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <LogIn size={18} /> Masuk Sekarang
          </Link>
        </div>
      </div>
    );
  }

  const goCheckout = () => {
    if (!user) return navigate("/masuk");
    const hasSelected = items.some(item => item.selected);
    if (!hasSelected) {
      alert("Silakan pilih minimal satu produk untuk di-checkout.");
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="section container">
        <div className="empty-state">
          <div style={{ color: "var(--ink-soft)", marginBottom: 16 }}><ShoppingCart size={48} strokeWidth={1.5} /></div>
          <h3>Keranjangmu masih kosong</h3>
          <p style={{ marginTop: 8 }}>Yuk jelajahi limbah kelapa yang bisa kamu manfaatkan.</p>
          <Link to="/produk" className="btn btn-primary" style={{ marginTop: 18 }}>Jelajahi Produk</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section container" style={{ minHeight: '80vh', paddingTop: 48, paddingBottom: 80 }}>
      <h1 style={{ fontSize: "2.4rem", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 40, color: "var(--ink)" }}>Keranjang Belanja</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "40px" }} className="cart-grid">
        {/* ─── Kolom Kiri: Daftar Item ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Select All Bar */}
          <div className="card" style={{ display: "flex", padding: "18px 24px", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input
                type="checkbox"
                id="select-all"
                checked={items.length > 0 && items.every((i) => i.selected)}
                onChange={(e) => selectAll(e.target.checked)}
                style={{
                  accentColor: "var(--ink)",
                  width: 18,
                  height: 18,
                  cursor: "pointer",
                }}
              />
              <label htmlFor="select-all" style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--ink)", cursor: "pointer", userSelect: "none" }}>
                Pilih Semua
              </label>
            </div>
            {items.some(i => i.selected) && (
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ color: "var(--danger)", padding: "6px 12px" }}
                onClick={() => {
                  if (window.confirm("Hapus semua produk yang dipilih?")) {
                    clearSelected();
                  }
                }}
              >
                Hapus Terpilih
              </button>
            )}
          </div>

          {/* Item Cards */}
          <div className="card" style={{ padding: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)", borderRadius: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {items.map(({ product, qty, selected }, index) => (
                <div 
                  key={product.id} 
                  style={{ 
                    display: "flex", 
                    padding: "20px 0", 
                    gap: 20, 
                    alignItems: "center",
                    borderBottom: index < items.length - 1 ? "1px solid var(--line, rgba(0,0,0,0.06))" : "none"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleSelect(product.id)}
                    style={{
                      accentColor: "var(--ink)",
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                      flexShrink: 0
                    }}
                  />
                  <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", background: "var(--cream-2)", flexShrink: 0 }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}>
                        <Package size={32} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)", marginBottom: 6 }}>{product.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                      Rp{Number(product.price).toLocaleString("id-ID")} / {product.unit}
                    </div>
                  </div>
                  <div className="row" style={{ background: "rgba(0,0,0,0.04)", borderRadius: 999, padding: "4px 8px", flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", minWidth: 28 }} onClick={() => updateQty(product.id, qty - 1)}>−</button>
                    <span style={{ padding: "0 12px", fontWeight: 700, color: "var(--ink)", fontSize: "0.9rem" }}>{qty}</span>
                    <button className="btn btn-ghost" style={{ padding: "6px 10px", minWidth: 28 }} onClick={() => updateQty(product.id, qty + 1)}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, width: 120, textAlign: "right", fontSize: "1.05rem", color: "var(--ink)", flexShrink: 0 }}>
                    Rp{(product.price * qty).toLocaleString("id-ID")}
                  </div>
                  <button className="btn btn-ghost" style={{ color: "var(--danger)", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} onClick={() => removeItem(product.id)}>
                    <Trash2 size={17} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Kolom Kanan: Ringkasan ─── */}
        <div>
          <div className="card" style={{ padding: "28px 28px 32px", height: "fit-content", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)", borderRadius: 16, position: "sticky", top: 24 }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 24, color: "var(--ink)" }}>Ringkasan</h3>
            <div style={{ borderTop: "1px solid var(--line, rgba(0,0,0,0.06))", paddingTop: 20, marginBottom: 20 }}>
              <div className="row between" style={{ marginBottom: 0, fontSize: "0.95rem" }}>
                <span style={{ color: "var(--ink-soft)" }}>Subtotal</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--ink)" }}>Rp{total.toLocaleString("id-ID")}</strong>
              </div>
            </div>
            <p className="field-hint" style={{ marginBottom: 24, lineHeight: 1.6 }}>
              Ongkos kirim dihitung & dinegosiasikan langsung dengan penjual via obrolan.
            </p>
            <button 
              className="btn btn-primary btn-block" 
              style={{ 
                padding: "15px 24px",
                marginTop: 8,
                opacity: items.some(i => i.selected) ? 1 : 0.6,
                cursor: items.some(i => i.selected) ? "pointer" : "not-allowed"
              }} 
              onClick={goCheckout}
              disabled={!items.some(i => i.selected)}
            >
              Checkout ({items.filter(i => i.selected).length})
            </button>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 800px) { .cart-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
