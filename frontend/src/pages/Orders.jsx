import React, { useEffect, useState } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const STATUS_LABEL = {
  menunggu_konfirmasi: "Menunggu Konfirmasi Penjual",
  diproses: "Diproses",
  dikirim: "Dalam Pengiriman",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

const STATUS_COLOR = {
  menunggu_konfirmasi: "badge-outline",
  diproses: "badge",
  dikirim: "badge-brown",
  selesai: "badge",
  ditolak: "badge-outline",
};

export default function Orders() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState("buyer"); // "buyer" | "seller" — same account, two lenses
  const [orders, setOrders] = useState([]);

  const load = (v) => api.get(`/orders?as=${v}`).then((res) => setOrders(res.data));
  useEffect(() => { load(view); }, [view]);

  const confirmReceived = async (id) => {
    await api.put(`/orders/${id}/status`, { status: "selesai" });
    showToast("Pesanan selesai! Dana escrow dicairkan ke penjual.");
    load(view);
  };

  return (
    <div className="section container" style={{ minHeight: '80vh', maxWidth: 800 }}>
      <h1 style={{ fontSize: "2.2rem", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 20, color: "var(--ink)" }}>
        {view === "seller" ? "Pesanan Masuk Toko" : "Riwayat Pesanan Belanja"}
      </h1>

      {user?.is_seller && (
        <div className="row gap-12" style={{ marginBottom: 28, background: "rgba(0,0,0,0.03)", padding: 4, borderRadius: 999, width: "fit-content" }}>
          <button 
            className="btn" 
            style={{ 
              padding: "8px 20px", 
              fontSize: "0.85rem",
              background: view === "buyer" ? "var(--ink)" : "transparent",
              color: view === "buyer" ? "#fff" : "var(--ink-soft)"
            }} 
            onClick={() => setView("buyer")}
          >
            Sebagai Pembeli
          </button>
          <button 
            className="btn" 
            style={{ 
              padding: "8px 20px", 
              fontSize: "0.85rem",
              background: view === "seller" ? "var(--ink)" : "transparent",
              color: view === "seller" ? "#fff" : "var(--ink-soft)"
            }} 
            onClick={() => setView("seller")}
          >
            Sebagai Penjual
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: "1.1rem" }}>Belum ada pesanan.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map((o) => (
            <div key={o.id} className="card" style={{ padding: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)" }}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: "1.05rem", color: "var(--ink)" }}>#ORD-{String(o.id).padStart(6, "0")}</strong>
                <span className={`badge ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", marginBottom: 6 }}>
                {view === "seller" ? `Pembeli: ${o.buyer_name}` : `Penjual: ${o.seller_store}`}
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: 16 }}>📍 {o.shipping_address}</p>
              
              <div style={{ background: "rgba(0,0,0,0.01)", padding: 16, borderRadius: 12, border: "1px solid rgba(0,0,0,0.03)" }}>
                {o.items.map((it) => (
                  <div key={it.id} className="row between" style={{ fontSize: "0.88rem", marginTop: 8, firstOfType: { marginTop: 0 } }}>
                    <span style={{ color: "var(--ink)" }}>{it.product_name} <span style={{ color: "var(--ink-soft)" }}>× {it.qty}</span></span>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>Rp{it.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              
              <div className="row between" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)", fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)" }}>
                <span>Total</span><span>Rp{o.total.toLocaleString("id-ID")}</span>
              </div>

              {view === "buyer" && o.status === "dikirim" && (
                <button className="btn btn-primary" style={{ marginTop: 16, padding: "10px 20px" }} onClick={() => confirmReceived(o.id)}>
                  ✅ Konfirmasi Barang Diterima
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
