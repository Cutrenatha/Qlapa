import React, { useEffect, useState } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const STATUS_LABEL = {
  belum_bayar: "Belum Bayar",
  dikemas: "Dikemas",
  dikirim: "Dalam Pengiriman",
  selesai: "Selesai",
  pengembalian: "Pengembalian",
  dibatalkan: "Dibatalkan",
};

const STATUS_COLOR = {
  belum_bayar: "badge-outline",
  dikemas: "badge",
  dikirim: "badge-brown",
  selesai: "badge",
  pengembalian: "badge-outline",
  dibatalkan: "badge-outline",
};

export default function Orders() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("semua");

  const tabs = [
    { key: "semua", label: "Semua" },
    { key: "belum_bayar", label: "Belum Bayar" },
    { key: "dikemas", label: "Dikemas" },
    { key: "dikirim", label: "Dikirim" },
    { key: "selesai", label: "Selesai" },
    { key: "pengembalian", label: "Pengembalian" },
    { key: "dibatalkan", label: "Dibatalkan" },
  ];

  const load = () => {
    api.get("/orders?as=buyer")
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    load();
  }, []);

  const confirmReceived = async (id) => {
    try {
      await api.put(`/orders/${id}/status`, { status: "selesai" });
      showToast("Pesanan selesai! Dana escrow dicairkan ke penjual.");
      load();
    } catch (e) {
      showToast("Gagal memperbarui status pesanan.", "error");
    }
  };

  const handleStatusChange = async (id, newStatus, successMsg) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      showToast(successMsg);
      load();
    } catch (e) {
      showToast(e.response?.data?.error || "Gagal memperbarui status pesanan.", "error");
    }
  };

  const filteredOrders = filter === "semua"
    ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <div className="section container" style={{ minHeight: '80vh', maxWidth: 800 }}>
      <h1 style={{ fontSize: "2.2rem", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 20, color: "var(--ink)" }}>
        Riwayat Pesanan Belanja
      </h1>

      {/* Categories Tabs */}
      <div 
        style={{ 
          display: "flex", 
          gap: 8, 
          overflowX: "auto", 
          paddingBottom: 12, 
          marginBottom: 28, 
          borderBottom: "1px solid var(--line)",
          scrollbarWidth: "none"
        }}
      >
        {tabs.map((t) => {
          const count = t.key === "semua"
            ? orders.length
            : orders.filter((o) => o.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                background: filter === t.key ? "var(--ink)" : "rgba(0,0,0,0.03)",
                color: filter === t.key ? "#fff" : "var(--ink-soft)",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {t.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: "1.1rem" }}>Belum ada pesanan dengan kategori ini.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredOrders.map((o) => (
            <div key={o.id} className="card" style={{ padding: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)" }}>
              <div className="row between" style={{ marginBottom: 12, alignItems: "center" }}>
                <div className="row gap-8" style={{ alignItems: "center" }}>
                  <strong style={{ fontSize: "1.05rem", color: "var(--ink)" }}>#ORD-{String(o.id).padStart(6, "0")}</strong>
                  <span
                    className="badge"
                    style={{
                      background: o.payment_status === "paid" ? "rgba(52, 199, 89, 0.12)" : (o.midtrans_tx_id && o.midtrans_tx_id.startsWith("COD") ? "rgba(245, 158, 11, 0.12)" : "rgba(255, 59, 48, 0.12)"),
                      color: o.payment_status === "paid" ? "#248a3d" : (o.midtrans_tx_id && o.midtrans_tx_id.startsWith("COD") ? "#d97706" : "#ff3b30"),
                      border: "none",
                      fontSize: "0.78rem",
                      fontWeight: 600
                    }}
                  >
                    {o.payment_status === "paid" ? "Sudah Dibayar" : (o.midtrans_tx_id && o.midtrans_tx_id.startsWith("COD") ? "COD (Bayar di Tempat)" : "Belum Dibayar")}
                  </span>
                </div>
                <span className={`badge ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status] || o.status}</span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", marginBottom: 6 }}>
                Penjual: {o.seller_store}
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: 16 }}>
                📍 {o.shipping_address}
              </p>
              
              <div style={{ background: "rgba(0,0,0,0.01)", padding: 16, borderRadius: 12, border: "1px solid rgba(0,0,0,0.03)" }}>
                {o.items.map((it) => (
                  <div key={it.id} className="row between" style={{ fontSize: "0.88rem", marginTop: 8 }}>
                    <span style={{ color: "var(--ink)" }}>{it.product_name} <span style={{ color: "var(--ink-soft)" }}>× {it.qty}</span></span>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>Rp{it.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)", display: "grid", gap: "6px" }}>
                <div className="row between" style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  <span>Subtotal Produk</span>
                  <span>Rp{(o.total - (o.admin_fee || 0) - (o.shipping_cost || 0)).toLocaleString("id-ID")}</span>
                </div>
                <div className="row between" style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  <span>Biaya Admin (10%)</span>
                  <span>Rp{(o.admin_fee || 0).toLocaleString("id-ID")}</span>
                </div>
                <div className="row between" style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  <span>Ongkos Kirim</span>
                  <span>{o.shipping_cost > 0 ? `Rp${o.shipping_cost.toLocaleString("id-ID")}` : "Gratis (Pick Up)"}</span>
                </div>
                <div className="row between" style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--line)", fontWeight: 700, fontSize: "1.1rem", color: "var(--ink)" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--brand)" }}>Rp{o.total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                {o.status === "dikirim" && (
                  <button className="btn btn-primary" style={{ flex: 1, padding: "10px 20px" }} onClick={() => confirmReceived(o.id)}>
                    ✅ Konfirmasi Barang Diterima
                  </button>
                )}
                {o.status === "belum_bayar" && (
                  <button className="btn" style={{ flex: 1, padding: "10px 20px", color: "var(--danger)", border: "1px solid var(--danger)", background: "transparent", borderRadius: 8, cursor: "pointer", fontWeight: 600 }} onClick={() => handleStatusChange(o.id, "dibatalkan", "Pesanan berhasil dibatalkan.")}>
                    ✕ Batalkan Pesanan
                  </button>
                )}
                {(o.status === "dikemas" || o.status === "dikirim") && (
                  <button className="btn" style={{ padding: "10px 20px", color: "var(--danger)", background: "transparent", border: "none", cursor: "pointer", fontWeight: 600 }} onClick={() => handleStatusChange(o.id, "pengembalian", "Pengajuan pengembalian dikirim.")}>
                    ↩ Ajukan Pengembalian
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
