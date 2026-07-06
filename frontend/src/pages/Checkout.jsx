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
    <div className="section container" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: 24 }}>Checkout</h1>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>Ringkasan Pesanan</h3>
        {items.map(({ product, qty }) => (
          <div key={product.id} className="row between" style={{ marginBottom: 8, fontSize: "0.9rem" }}>
            <span>{product.name} × {qty}</span>
            <span>Rp{(product.price * qty).toLocaleString("id-ID")}</span>
          </div>
        ))}
        <div className="row between" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)", fontWeight: 700 }}>
          <span>Total</span>
          <span>Rp{total.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 20 }}>
        <div className="field">
          <label>Alamat Pengiriman</label>
          <textarea required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nama jalan, desa/kelurahan, kecamatan, kabupaten/kota" />
        </div>

        <div className="card" style={{ padding: 14, background: "var(--green-100)", marginBottom: 16, border: "1px solid var(--green-500)" }}>
          🔒 <strong>Pembayaran Escrow</strong> — dana kamu akan ditahan aman oleh Qlapa hingga kamu
          mengonfirmasi barang diterima. Baru setelah itu dana dicairkan ke penjual.
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Memproses…" : "Bayar & Buat Pesanan"}
        </button>
      </form>
    </div>
  );
}
