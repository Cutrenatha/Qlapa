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

export default function SellerDashboard() {
  const { user } = useAuth();

  if (!user?.is_seller) return <OpenStorePrompt />;
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
    <div className="container" style={{ paddingBottom: 90 }}>
      <HubHeader />

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

/* ---- Shared header: "Qlapa Hub" + bell + search --------------------- */
function HubHeader() {
  return (
    <div style={styles.header}>
      <div className="row between">
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <span style={styles.logo}>Qlapa</span>
          <span style={styles.hubBadge}>Hub</span>
        </div>
        <div style={{ position: "relative" }}>
          <BellIcon />
          <span style={styles.bellDot} />
        </div>
      </div>
      <p style={styles.subtitle}>Kelola produk, pesanan, dan toko Anda</p>
      <div style={styles.searchBar}>
        <SearchIcon />
        <input placeholder="Cari Produk.." style={styles.searchInput} />
      </div>
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

      <div style={styles.summaryBox}>
        <SummaryItem
          icon={<BoxIcon />}
          value={summary.pesanan_baru}
          label="Pesanan Baru"
        />
        <SummaryItem
          icon={<BagIcon />}
          value={summary.produk_terjual}
          label="Produk Terjual"
        />
        <SummaryItem
          icon={<WalletIcon />}
          value={formatRb(summary.pendapatan)}
          label="Pendapatan"
        />
        <SummaryItem
          icon={<CheckIcon />}
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

function SummaryItem({ icon, value, label }) {
  return (
    <div style={styles.summaryItem}>
      <div style={styles.summaryIcon}>{icon}</div>
      <div style={styles.summaryValue}>{value}</div>
      <div style={styles.summaryLabel}>{label}</div>
    </div>
  );
}

function formatRb(n) {
  if (n >= 1000) return `${Math.round(n / 1000)} rb`;
  return `${n}`;
}

/* ---- Tab: Produk (full product management) ---------------------------- */
function ProdukTab({ products, onDelete }) {
  return (
    <div style={styles.body}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: "1.1rem" }}>Produk Saya</h3>
        <Link to="/dashboard/tambah-produk" className="btn btn-primary btn-sm">
          + Tambah
        </Link>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        {products.length === 0 && (
          <div className="empty-state">
            Belum ada produk. Tambahkan produk pertamamu!
          </div>
        )}
        {products.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              padding: 12,
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--cream-2)",
                flexShrink: 0,
              }}
            >
              {p.image_url && (
                <img
                  src={p.image_url}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                {p.name}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                {p.category} · Rp{p.price.toLocaleString("id-ID")}/{p.unit} ·
                Stok {p.stock} {p.unit}
              </div>
            </div>
            <span
              className={`badge ${p.status === "active" ? "" : "badge-outline"}`}
            >
              {p.status === "active" ? "Aktif" : "Nonaktif"}
            </span>
            <Link
              to={`/dashboard/produk/${p.id}/edit`}
              className="btn btn-outline btn-sm"
            >
              Edit
            </Link>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(p.id)}
            >
              Hapus
            </button>
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
      <h3 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Pesanan Masuk</h3>
      <div className="grid" style={{ gap: 10 }}>
        {orders.length === 0 && (
          <div className="empty-state">Belum ada pesanan masuk.</div>
        )}
        {orders.map((o) => {
          const meta = STATUS_META[o.status] || STATUS_META.menunggu_konfirmasi;
          return (
            <div key={o.id} className="card" style={{ padding: 14 }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: "0.88rem" }}>{orderCode(o)}</strong>
                <span
                  style={{
                    ...styles.statusPill,
                    background: meta.bg,
                    color: meta.fg,
                  }}
                >
                  {meta.label}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem" }}>Pembeli: {o.buyer_name}</p>
              {o.items.map((it) => (
                <div
                  key={it.id}
                  className="row between"
                  style={{ fontSize: "0.85rem", marginTop: 4 }}
                >
                  <span>
                    {it.product_name} × {it.qty}
                  </span>
                  <span>Rp{it.subtotal.toLocaleString("id-ID")}</span>
                </div>
              ))}
              <div
                className="row between"
                style={{ marginTop: 10, fontWeight: 700 }}
              >
                <span>Total</span>
                <span>Rp{o.total.toLocaleString("id-ID")}</span>
              </div>
              <div className="row gap-8" style={{ marginTop: 12 }}>
                {o.status === "menunggu_konfirmasi" && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onUpdateStatus(o.id, "diproses")}
                    >
                      Terima
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onUpdateStatus(o.id, "ditolak")}
                    >
                      Tolak
                    </button>
                  </>
                )}
                {o.status === "diproses" && (
                  <button
                    className="btn btn-primary btn-sm"
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
function BoxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="var(--cream)"
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
function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="var(--cream)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="var(--cream)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1" fill="var(--cream)" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="var(--cream)"
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
