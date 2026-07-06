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
    <div className="section container">
      <h1 style={{ fontSize: "1.8rem", marginBottom: 16 }}>
        {view === "seller" ? "Pesanan Masuk ke Toko" : "Riwayat Pesanan Belanja"}
      </h1>

      {user?.is_seller && (
        <div className="row gap-8" style={{ marginBottom: 24 }}>
          <button className={view === "buyer" ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"} onClick={() => setView("buyer")}>
            Sebagai Pembeli
          </button>
          <button className={view === "seller" ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"} onClick={() => setView("seller")}>
            Sebagai Penjual
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state">Belum ada pesanan.</div>
      ) : (
        <div className="grid" style={{ gap: 14 }}>
          {orders.map((o) => (
            <div key={o.id} className="card" style={{ padding: 18 }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <strong>#ORD-{String(o.id).padStart(6, "0")}</strong>
                <span className={`badge ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              </div>
              <p style={{ fontSize: "0.85rem" }}>
                {view === "seller" ? `Pembeli: ${o.buyer_name}` : `Penjual: ${o.seller_store}`}
              </p>
              <p style={{ fontSize: "0.8rem", marginTop: 4 }}>📍 {o.shipping_address}</p>
              <div style={{ marginTop: 10 }}>
                {o.items.map((it) => (
                  <div key={it.id} className="row between" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    <span>{it.product_name} × {it.qty}</span>
                    <span>Rp{it.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              <div className="row between" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", fontWeight: 700 }}>
                <span>Total</span><span>Rp{o.total.toLocaleString("id-ID")}</span>
              </div>

              {view === "buyer" && o.status === "dikirim" && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => confirmReceived(o.id)}>
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
