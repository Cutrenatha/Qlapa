import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/orders", {
        items: items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
        shipping_address: address,
      });
      clearCart();
      showToast("Pesanan berhasil dibuat! Dana ditahan aman via escrow.");
      navigate("/pesanan");
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal membuat pesanan", "error");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/keranjang");
    return null;
  }

  return (
    <div className="section container" style={{ maxWidth: 640, minHeight: '80vh' }}>
      <h1 style={{ fontSize: "2.2rem", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 28, color: "var(--ink)" }}>Checkout</h1>

      <div className="card" style={{ padding: 24, marginBottom: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, color: "var(--ink)" }}>Ringkasan Pesanan</h3>
        {items.map(({ product, qty }) => (
          <div key={product.id} className="row between" style={{ marginBottom: 10, fontSize: "0.92rem", color: "var(--ink-soft)" }}>
            <span>{product.name} × {qty}</span>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>Rp{(product.price * qty).toLocaleString("id-ID")}</span>
          </div>
        ))}
        <div className="row between" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)", fontWeight: 700, fontSize: "1.1rem", color: "var(--ink)" }}>
          <span>Total Bayar</span>
          <span>Rp{total.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 28, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)" }}>
        <div className="field">
          <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>Alamat Pengiriman</label>
          <textarea
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Tuliskan nama jalan, RT/RW, kelurahan/desa, kecamatan, kota/kabupaten, dan provinsi secara lengkap"
            style={{ padding: '14px 16px', borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '0.92rem' }}
          />
        </div>

        <div className="card" style={{ padding: 18, background: "rgba(52, 199, 89, 0.05)", marginBottom: 24, border: "1px solid rgba(52, 199, 89, 0.18)", borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.25rem' }}>🔒</span>
          <div>
            <strong style={{ display: 'block', color: 'var(--green-900)', fontSize: '0.88rem', marginBottom: 4 }}>Pembayaran Escrow Qlapa</strong>
            <p style={{ color: 'var(--green-800)', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Dana Anda ditahan aman oleh pihak ketiga (Qlapa) hingga barang sampai dan Anda konfirmasi. Dana baru akan dicairkan ke penjual setelahnya.
            </p>
          </div>
        </div>

        <button className="btn btn-primary btn-block" style={{ padding: "14px 24px" }} type="submit" disabled={loading}>
          {loading ? "Memproses…" : "Bayar & Buat Pesanan"}
        </button>
      </form>
    </div>
  );
}
