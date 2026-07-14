import React, { useEffect, useState } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { ShoppingBag, Truck, CheckCircle, Clock, X, AlertTriangle, Package, PackageOpen, Undo2 } from "lucide-react";
import "./SellerDashboard.css"; // Reuse seller dashboard css for identical design

const STATUS_META = {
  belum_bayar: { label: "Belum Bayar", bg: "#F3F4F6", fg: "#6B7280", Icon: Clock },
  menunggu_konfirmasi: { label: "Menunggu Konfirmasi", bg: "#FEF3C7", fg: "#D97706", Icon: Clock },
  diproses: { label: "Diproses", bg: "#DBEAFE", fg: "#2563EB", Icon: Package },
  dikemas: { label: "Dikemas", bg: "#E0E7FF", fg: "#4F46E5", Icon: PackageOpen },
  dikirim: { label: "Dikirim", bg: "#FEF08A", fg: "#CA8A04", Icon: Truck },
  selesai: { label: "Selesai", bg: "#D1FAE5", fg: "#059669", Icon: CheckCircle },
  pengembalian: { label: "Pengembalian", bg: "#FEE2E2", fg: "#DC2626", Icon: AlertTriangle },
  dibatalkan: { label: "Dibatalkan", bg: "#F3F4F6", fg: "#4B5563", Icon: X },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatOrderDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function orderCode(o) {
  if (!o.created_at) return `ORD-${String(o.id).padStart(3, "0")}`;
  const d = new Date(o.created_at);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `ORD-${dd}${mm}${yy}-${String(o.id).padStart(3, "0")}`;
}

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
    <div className="dashboard-shell" style={{ minHeight: '80vh' }}>
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-title">Riwayat Pesanan Belanja</h1>
          <p className="dashboard-subtitle">
            Daftar seluruh transaksi pembelian limbah kelapa Anda di Qlapa.
          </p>
        </div>
      </div>

      <div className="dashboard-filter-row">
        {tabs.map((t) => {
          const count = t.key === "semua"
            ? orders.length
            : orders.filter((o) => o.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`dashboard-filter-tab ${filter === t.key ? "active" : ""}`}
            >
              {t.label}
              {count > 0 && (
                <span className="dashboard-filter-count">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="dashboard-empty-state">
          <ShoppingBag size={36} color="#D1D5DB" strokeWidth={1.2} />
          <h3 className="dashboard-empty-title">Tidak ada pesanan</h3>
          <p className="dashboard-empty-sub">Belum ada pesanan dengan kategori ini.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredOrders.map((o) => {
            const meta = STATUS_META[o.status] || STATUS_META.belum_bayar;
            const { Icon: StatusIcon } = meta;
            return (
              <div key={o.id} className="dashboard-order-card">
                {/* Header */}
                <div className="dashboard-order-card-head">
                  <div className="dashboard-order-card-title-block">
                    <div className="dashboard-order-card-icon-wrap" style={{ background: meta.bg }}>
                      <StatusIcon size={16} color={meta.fg} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="dashboard-order-card-code">{orderCode(o)}</p>
                      <p className="dashboard-order-card-date">{formatOrderDate(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="dashboard-order-card-badges">
                    <span className="status-pill-badge" style={{
                      background: o.payment_status === "paid" ? "var(--green-100)" : (o.midtrans_tx_id && o.midtrans_tx_id.startsWith("COD") ? "#FEF3C7" : "#FEE2E2"),
                      color: o.payment_status === "paid" ? "var(--green-900)" : (o.midtrans_tx_id && o.midtrans_tx_id.startsWith("COD") ? "#92400E" : "#991B1B"),
                    }}>
                      {o.payment_status === "paid" ? "Lunas" : (o.midtrans_tx_id && o.midtrans_tx_id.startsWith("COD") ? "COD (Bayar di Tempat)" : "Belum Lunas")}
                    </span>
                    <span className="status-pill-badge" style={{ background: meta.bg, color: meta.fg }}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="dashboard-order-card-body">
                  {/* Seller info */}
                  <div className="dashboard-order-section">
                    <p className="dashboard-order-section-label">Penjual</p>
                    <p className="dashboard-order-buyer-name">{o.seller_store}</p>
                    {o.shipping_address && (
                      <p className="dashboard-order-address">{o.shipping_address}</p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="dashboard-order-section">
                    <p className="dashboard-order-section-label">Produk ({(o.items || []).length})</p>
                    <div className="dashboard-order-items-list">
                      {(o.items || []).map((it) => (
                        <div key={it.id} className="dashboard-order-item-row">
                          <span className="dashboard-order-item-name">
                            {it.product_name}
                            <span className="dashboard-order-item-qty">x{it.qty}</span>
                          </span>
                          <span className="dashboard-order-item-subtotal">
                            Rp {(it.subtotal || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total breakdown */}
                  <div className="dashboard-order-section">
                    <p className="dashboard-order-section-label">Rincian Biaya</p>
                    <div className="dashboard-cost-list">
                      <div className="dashboard-cost-row">
                        <span>Subtotal Produk</span>
                        <span>Rp {(o.total - (o.admin_fee || 0) - (o.shipping_cost || 0)).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="dashboard-cost-row">
                        <span>Biaya Admin (10%)</span>
                        <span>Rp {(o.admin_fee || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="dashboard-cost-row">
                        <span>Ongkos Kirim</span>
                        <span>{o.shipping_cost > 0 ? `Rp ${o.shipping_cost.toLocaleString("id-ID")}` : "Gratis (Pick Up)"}</span>
                      </div>
                      <div className="dashboard-cost-row dashboard-cost-total-row">
                        <span>Total Transaksi</span>
                        <span>Rp {(o.total || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="dashboard-order-card-foot" style={{ justifyContent: "flex-end", borderTop: "1px solid var(--line)", padding: "16px 20px", background: "#F9FAFB" }}>
                  {o.status === "dikirim" && (
                    <button
                      className="dashboard-btn-action-primary"
                      onClick={() => confirmReceived(o.id)}
                    >
                      <CheckCircle size={14} strokeWidth={2} />
                      Konfirmasi Barang Diterima
                    </button>
                  )}
                  {o.status === "belum_bayar" && (
                    <button
                      className="dashboard-btn-action-danger"
                      onClick={() => handleStatusChange(o.id, "dibatalkan", "Pesanan berhasil dibatalkan.")}
                    >
                      <X size={14} strokeWidth={2.5} />
                      Batalkan Pesanan
                    </button>
                  )}
                  {(o.status === "dikemas" || o.status === "dikirim") && (
                    <button
                      style={{ border: "1px solid var(--danger)", color: "var(--danger)", background: "transparent", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                      onClick={() => handleStatusChange(o.id, "pengembalian", "Pengajuan pengembalian dikirim.")}
                    >
                      <Undo2 size={14} strokeWidth={2} />
                      Ajukan Pengembalian
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
