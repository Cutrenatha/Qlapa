import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api.js";
import { ArrowLeft, Bell, ShoppingBag, Clock } from "lucide-react";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/masuk"); return; }
    api.get("/seller/dashboard")
      .then((res) => {
        const pending = (res.data?.orders || []).filter(
          (o) => o.status === "dikemas" || o.status === "belum_bayar" || o.status === "menunggu_konfirmasi"
        );
        setOrders(pending);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
    });
  };

  const statusLabel = (status) => {
    if (status === "dikemas") return "Pesanan Baru — Perlu Dikemas";
    if (status === "belum_bayar") return "Menunggu Pembayaran";
    return "Menunggu Konfirmasi";
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", fontFamily: "var(--font-body)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--line)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--ink)", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>Notifikasi</h1>
        {orders.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700, background: "var(--green-700)", color: "#fff", borderRadius: 99, padding: "2px 8px" }}>
            {orders.length} baru
          </span>
        )}
      </div>

      <div style={{ padding: "16px 0" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "80px 24px", color: "var(--ink-soft)", textAlign: "center" }}>
            <Bell size={48} strokeWidth={1.2} color="rgba(45,106,79,0.25)" />
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--ink)" }}>Tidak ada notifikasi</p>
            <p style={{ margin: 0, fontSize: "0.82rem" }}>Semua pesanan sudah ditangani.</p>
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} onClick={() => navigate("/dashboard?tab=pesanan")}
              style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", background: "#fff", borderBottom: "1px solid var(--line)", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--cream)"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(45,106,79,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--green-700)" }}>
                <ShoppingBag size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{statusLabel(o.status)}</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-soft)", marginBottom: 6 }}>{o.buyer_name} · {(o.total || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "var(--ink-soft)" }}>
                  <Clock size={11} />{formatDate(o.created_at)}
                </span>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green-700)", marginTop: 6, flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
