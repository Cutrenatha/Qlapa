import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const STATUS_META = {
  menunggu_konfirmasi: {
    label: "Menunggu Diproses",
    bg: "#F6E4BB",
    fg: "#8A5A17",
  },
  diproses: { label: "Dikemas", bg: "#D9E8D6", fg: "#2F5233" },
  dikirim: { label: "Dikirim", bg: "#E1DCF0", fg: "#4B3A8A" },
  selesai: { label: "Selesai", bg: "#D9E8D6", fg: "#2F5233" },
  ditolak: { label: "Ditolak", bg: "#F3D6D0", fg: "#9A3A24" },
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
function formatJoined(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatOrderDate(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}
function orderCode(o) {
  const d = new Date(o.created_at);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `#ORD-${dd}${mm}${yy}-${String(o.id).padStart(3, "0")}`;
}

import { Navigate } from "react-router-dom";

export default function SellerDashboard() {
  const { user } = useAuth();

  if (!user?.is_seller) return <Navigate to="/toko/buka" replace />;
  return <DashboardContent />;
}

/* ---------------------------------------------------------------------- */
/* Onboarding — shown on the SAME /dashboard route until the account opens
   a store. One login, one dashboard, store is just an extra capability.   */
/* ---------------------------------------------------------------------- */
function OpenStorePrompt() {
  const { user, openStore } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    store_name: "",
    store_location: "",
    store_description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = {
        store_name: form.store_name,
        store_location: form.store_location,
        store_description: form.store_description,
      };

      await openStore(data);
      showToast("Toko berhasil dibuka! Selamat datang di dashboard tokomu 🎉");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal membuka toko");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section container" style={{ paddingBottom: 100 }}>
      <div style={styles.onboardHero}>
        <div style={styles.onboardHeroBg} />
        <div style={styles.onboardHeroInner}>
          <span className="eyebrow" style={{ color: "var(--brown-300)" }}>
            Satu akun, dua peran
          </span>
          <h1
            style={{
              color: "var(--cream)",
              fontSize: "1.9rem",
              marginTop: 8,
              maxWidth: 480,
            }}
          >
            Halo {user?.name?.split(" ")[0]}, buka toko dari akun ini juga.
          </h1>
          <p
            style={{
              color: "rgba(251,247,239,0.82)",
              marginTop: 10,
              maxWidth: 480,
            }}
          >
            Tidak perlu daftar akun baru atau login terpisah — dengan akun{" "}
            {user?.email} ini kamu bisa tetap berbelanja sekaligus buka toko dan
            jualan limbah kelapamu sendiri.
          </p>
        </div>
      </div>

      <div
        className="card"
        style={{
          maxWidth: 480,
          padding: 28,
          marginTop: -40,
          position: "relative",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: 4 }}>Buka Toko</h2>
        <p style={{ marginBottom: 18, fontSize: "0.88rem" }}>
          Isi info toko untuk mulai berjualan.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Nama Toko</label>
            <input
              required
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              placeholder="mis. LimbahKita Store"
            />
          </div>
          <div className="field">
            <label>Lokasi Toko</label>
            <input
              required
              value={form.store_location}
              onChange={(e) =>
                setForm({ ...form, store_location: e.target.value })
              }
              placeholder="mis. Banda Aceh, Aceh"
            />
          </div>
          <div className="field">
            <label>Deskripsi Usaha (opsional)</label>
            <textarea
              value={form.store_description}
              onChange={(e) =>
                setForm({ ...form, store_description: e.target.value })
              }
            />
          </div>
          {error && (
            <p className="field-error" style={{ marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Membuka toko…" : "Buka Toko Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Qlapa Hub — seller dashboard shell, driven by ?tab=toko|produk|pesanan  */
/* ---------------------------------------------------------------------- */
function DashboardContent() {
  const [params] = useSearchParams();
  const tab = params.get("tab") || "toko";
  const [data, setData] = useState(null);
  const { showToast } = useToast();

  const load = () =>
    api.get("/seller/dashboard").then((res) => setData(res.data));
  useEffect(() => {
    load();
  }, []);

  const deleteProduct = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    await api.delete(`/products/${id}`);
    showToast("Produk dihapus");
    load();
  };

  const updateOrderStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    showToast(`Status pesanan diperbarui`);
    load();
  };

  if (!data) {
    return (
      <div className="container" style={{ paddingBottom: 90 }}>
        <div className="empty-state">
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 90, marginTop: 24 }}>
      <HubHeader tab={tab} storeName={data.store.name} />

      {tab === "toko" && <StoreOverview data={data} />}
      {tab === "produk" && (
        <ProdukTab products={data.products} onDelete={deleteProduct} />
      )}
      {tab === "pesanan" && (
        <PesananTab orders={data.orders} onUpdateStatus={updateOrderStatus} />
      )}
    </div>
  );
}

/* ---- Shared header: Clean dynamic header matching the tab --------------------- */
function HubHeader({ tab, storeName }) {
  return (
    <div style={styles.header}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
        {tab === "toko" && storeName}
        {tab === "produk" && "Produk Saya"}
        {tab === "pesanan" && "Pemesanan Toko"}
      </h1>
      <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", marginTop: 4 }}>
        {tab === "toko" && "Pantau performa penjualan dan statistik tokomu hari ini"}
        {tab === "produk" && "Kelola dan tambah produk limbah kelapa yang Anda pasarkan"}
        {tab === "pesanan" && "Kelola status pemesanan pembeli dan detail pengiriman"}
      </p>
    </div>
  );
}

/* ---- Tab: Toko (overview) — must match design exactly ---------------- */
function StoreOverview({ data }) {
  const { store, summary, orders } = data;
  return (
    <div style={styles.body}>
      <div style={styles.storeCard}>
        <div style={styles.storeLogo}>🥥</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "1.02rem" }}>
            {store.name}
          </div>
          <div
            className="row gap-4"
            style={{
              fontSize: "0.85rem",
              color: "var(--ink-soft)",
              marginTop: 2,
            }}
          >
            {store.rating ? (
              <span>
                ★ {store.rating.toFixed(1)} ({store.review_count} ulasan)
              </span>
            ) : (
              <span>Belum ada ulasan</span>
            )}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--ink-soft)",
              marginTop: 2,
            }}
          >
            Bergabung sejak {formatJoined(store.joined_at)}
          </div>
        </div>
        <div style={styles.activeStatus}>
          <span style={styles.activeDot} /> Toko Aktif
        </div>
      </div>

      <div className="row between" style={{ margin: "22px 0 12px" }}>
        <h3 style={{ fontSize: "1.05rem" }}>Ringkasan Hari Ini</h3>
        <span style={styles.linkSmall}>Lihat laporan &gt;</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <SummaryItem
          bg="linear-gradient(135deg, #FFF9E6 0%, #FFF2CC 100%)"
          color="#8A5A17"
          icon={<BoxIcon color="#8A5A17" />}
          value={summary.pesanan_baru}
          label="Pesanan Baru"
        />
        <SummaryItem
          bg="linear-gradient(135deg, #EAF6EC 0%, #D1EED7 100%)"
          color="#1E5C2D"
          icon={<BagIcon color="#1E5C2D" />}
          value={summary.produk_terjual}
          label="Produk Terjual"
        />
        <SummaryItem
          bg="linear-gradient(135deg, #EEF2F6 0%, #D5E1ED 100%)"
          color="#1F4E79"
          icon={<WalletIcon color="#1F4E79" />}
          value={formatRp(summary.pendapatan)}
          label="Pendapatan"
        />
        <SummaryItem
          bg="linear-gradient(135deg, #F5F0F6 0%, #E2D1F0 100%)"
          color="#673AB7"
          icon={<CheckIcon color="#673AB7" />}
          value={`${summary.tingkat_respons}%`}
          label="Tingkat Respons"
        />
      </div>

      <h3 style={{ fontSize: "1.05rem", margin: "22px 0 12px" }}>
        Pesanan Terbaru
      </h3>
      <div style={styles.ordersCard}>
        {orders.length === 0 && (
          <div className="empty-state" style={{ padding: 24 }}>
            Belum ada pesanan.
          </div>
        )}
        {orders.slice(0, 3).map((o, i) => (
          <OrderRow
            key={o.id}
            order={o}
            last={i === Math.min(orders.length, 3) - 1}
          />
        ))}
        {orders.length > 0 && (
          <div style={{ textAlign: "right", padding: "12px 16px 4px" }}>
            <Link to="/dashboard?tab=pesanan" style={styles.linkSmall}>
              Lihat semua &gt;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order, last }) {
  const meta = STATUS_META[order.status] || STATUS_META.menunggu_konfirmasi;
  return (
    <div
      style={{
        ...styles.orderRow,
        borderBottom: last ? "none" : "1px solid var(--line)",
      }}
    >
      <div style={styles.orderThumb}>🥥</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
          {orderCode(order)}
        </div>
        <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
          {order.buyer_name}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          {order.items.length} produk - Rp{order.total.toLocaleString("id-ID")}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
          {formatOrderDate(order.created_at)} - Transfer Bank
        </div>
      </div>
      <span
        style={{ ...styles.statusPill, background: meta.bg, color: meta.fg }}
      >
        {meta.label}
      </span>
    </div>
  );
}

function SummaryItem({ icon, value, label, bg, color }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 6,
        background: bg,
        borderRadius: 14,
        padding: "20px 14px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        border: "1px solid rgba(0,0,0,0.02)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
        {icon}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, color: color }}>
        {value}
      </div>
      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: color, opacity: 0.8 }}>
        {label}
      </div>
    </div>
  );
}

function formatRp(val) {
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} jt`;
  if (val >= 1000) return `Rp ${Math.round(val / 1000)} rb`;
  return `Rp ${val}`;
}

/* ---- Tab: Produk (full product management) ---------------------------- */
function ProdukTab({ products, onDelete }) {
  return (
    <div style={styles.body}>
      <div className="row between" style={{ marginBottom: 20, alignItems: "center" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Daftar Produk ({products.length})</h3>
        <Link to="/dashboard/tambah-produk" className="btn btn-primary" style={{ padding: "10px 20px", borderRadius: 999 }}>
          + Tambah Produk
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {products.length === 0 && (
          <div className="empty-state" style={{ padding: 40, textAlign: "center", background: "#fdfdfb", border: "1px dashed var(--line)", borderRadius: 16 }}>
            <p style={{ color: "var(--ink-soft)" }}>Belum ada produk. Tambahkan produk pertama Anda untuk mulai jualan!</p>
          </div>
        )}
        {products.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 18px",
              gap: 16,
              borderRadius: 16,
              border: "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              background: "#ffffff",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--cream-2)",
                flexShrink: 0,
                border: "1px solid rgba(0,0,0,0.04)"
              }}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  alt={p.name}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "1.4rem" }}>🥥</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--ink)", marginBottom: 4 }}>
                {p.name}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                <span style={{ background: "rgba(0,0,0,0.04)", padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>{p.category}</span>
                <strong style={{ color: "var(--brown-500)" }}>Rp{p.price.toLocaleString("id-ID")}</strong> / {p.unit}
                <span style={{ margin: "0 8px" }}>·</span>
                Stok: {p.stock} {p.unit}
              </div>
            </div>
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <span
                className="badge"
                style={{
                  background: p.status === "active" ? "rgba(52, 199, 89, 0.12)" : "rgba(142, 142, 147, 0.12)",
                  color: p.status === "active" ? "#248a3d" : "#555",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.76rem"
                }}
              >
                {p.status === "active" ? "Aktif" : "Nonaktif"}
              </span>
              <Link
                to={`/dashboard/produk/${p.id}/edit`}
                className="btn btn-outline"
                style={{ padding: "8px 16px", fontSize: "0.82rem", borderRadius: 999 }}
              >
                Edit
              </Link>
              <button
                className="btn btn-danger"
                style={{ padding: "8px 16px", fontSize: "0.82rem", borderRadius: 999, background: "rgba(255, 59, 48, 0.08)", color: "var(--danger)", border: "none" }}
                onClick={() => onDelete(p.id)}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Tab: Pesanan (full order management) ------------------------------ */
function PesananTab({ orders, onUpdateStatus }) {
  return (
    <div style={styles.body}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 20 }}>Daftar Pesanan Masuk ({orders.length})</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {orders.length === 0 && (
          <div className="empty-state" style={{ padding: 40, textAlign: "center", background: "#fdfdfb", border: "1px dashed var(--line)", borderRadius: 16 }}>
            <p style={{ color: "var(--ink-soft)" }}>Belum ada pesanan masuk.</p>
          </div>
        )}
        {orders.map((o) => {
          const meta = STATUS_META[o.status] || STATUS_META.menunggu_konfirmasi;
          return (
            <div key={o.id} className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)", background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div className="row between" style={{ marginBottom: 12, alignItems: "center" }}>
                <div className="row gap-8" style={{ alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem", color: "var(--ink)" }}>{orderCode(o)}</strong>
                  <span
                    className="badge"
                    style={{
                      background: o.payment_status === "paid" ? "rgba(52, 199, 89, 0.12)" : "rgba(255, 59, 48, 0.12)",
                      color: o.payment_status === "paid" ? "#248a3d" : "#ff3b30",
                      border: "none",
                      fontSize: "0.72rem",
                      padding: "3px 8px",
                      fontWeight: 600,
                      borderRadius: 6
                    }}
                  >
                    {o.payment_status === "paid" ? "Lunas (Escrow)" : "Belum Lunas"}
                  </span>
                </div>
                <span
                  style={{
                    ...styles.statusPill,
                    background: meta.bg,
                    color: meta.fg,
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontWeight: 600
                  }}
                >
                  {meta.label}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: 14 }}>
                Pembeli: <strong style={{ color: "var(--ink)" }}>{o.buyer_name}</strong>
              </p>
              
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                {o.items.map((it) => (
                  <div
                    key={it.id}
                    className="row between"
                    style={{ fontSize: "0.88rem", color: "var(--ink)", background: "rgba(0,0,0,0.02)", padding: "8px 12px", borderRadius: 8 }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {it.product_name} <span style={{ color: "var(--ink-soft)", marginLeft: 4 }}>× {it.qty}</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>Rp{it.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", display: "grid", gap: "6px" }}>
                <div className="row between" style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                  <span>Subtotal Produk</span>
                  <span>Rp{(o.total - (o.admin_fee || 0) - (o.shipping_cost || 0)).toLocaleString("id-ID")}</span>
                </div>
                <div className="row between" style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                  <span>Admin Aplikasi (10%)</span>
                  <span>Rp{(o.admin_fee || 0).toLocaleString("id-ID")}</span>
                </div>
                <div className="row between" style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                  <span>Ongkos Kirim</span>
                  <span>{o.shipping_cost > 0 ? `Rp${o.shipping_cost.toLocaleString("id-ID")}` : "Pick Up"}</span>
                </div>
                <div
                  className="row between"
                  style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--line)", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  <span>Total Transaksi</span>
                  <span style={{ color: "var(--brown-500)" }}>Rp{o.total.toLocaleString("id-ID")}</span>
                </div>
              </div>
              
              <div className="row gap-8" style={{ marginTop: 16 }}>
                {o.status === "menunggu_konfirmasi" && (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "10px 24px", borderRadius: 999 }}
                      onClick={() => onUpdateStatus(o.id, "diproses")}
                    >
                      Terima Pesanan
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "10px 24px", borderRadius: 999, background: "rgba(255,59,48,0.08)", color: "var(--danger)", border: "none" }}
                      onClick={() => onUpdateStatus(o.id, "ditolak")}
                    >
                      Tolak
                    </button>
                  </>
                )}
                {o.status === "diproses" && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: "10px 24px", borderRadius: 999 }}
                    onClick={() => onUpdateStatus(o.id, "dikirim")}
                  >
                    Tandai Dikirim
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Tiny inline icons -------------------------------------------------- */
function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="var(--ink-soft)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function BoxIcon({ color = "var(--cream)" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}
function BagIcon({ color = "var(--cream)" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function WalletIcon({ color = "var(--cream)" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1" fill={color} />
    </svg>
  );
}
function CheckIcon({ color = "var(--cream)" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3L15.5 9.5" />
    </svg>
  );
}

const styles = {
  shell: { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 },
  header: { padding: "20px 20px 14px" },
  logo: {
    fontFamily: "var(--font-display)",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--brown-800)",
  },
  hubBadge: {
    background: "var(--brown-300)",
    color: "var(--brown-800)",
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 999,
  },
  bellDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--danger)",
    border: "1.5px solid var(--paper)",
  },
  subtitle: { fontSize: "0.85rem", marginTop: 4 },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 999,
    padding: "11px 16px",
    marginTop: 14,
  },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    background: "transparent",
    fontSize: "0.88rem",
  },
  body: { padding: "4px 20px 20px" },
  storeCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius-md)",
    padding: 16,
    boxShadow: "var(--shadow-sm)",
  },
  storeLogo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: "var(--brown-100)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    flexShrink: 0,
  },
  activeStatus: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "var(--success)",
    whiteSpace: "nowrap",
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--success)",
  },
  linkSmall: { fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 600 },
  summaryBox: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 4,
    background: "var(--brown-800)",
    borderRadius: "var(--radius-md)",
    padding: "18px 8px",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 4,
  },
  summaryIcon: { marginBottom: 2 },
  summaryValue: {
    fontFamily: "var(--font-display)",
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "var(--cream)",
  },
  summaryLabel: { fontSize: "0.66rem", color: "rgba(251,247,239,0.75)" },
  ordersCard: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  },
  orderRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
  },
  orderThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    background: "var(--cream-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    flexShrink: 0,
  },
  statusPill: {
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "5px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
  onboardHero: {
    position: "relative",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    padding: "48px 40px",
    background: "var(--green-900)",
  },
  onboardHeroBg: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 85% 20%, rgba(200,159,108,0.35), transparent 55%)",
  },
  onboardHeroInner: { position: "relative" },
};
