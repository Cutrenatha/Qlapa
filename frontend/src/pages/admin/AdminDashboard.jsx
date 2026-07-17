import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminApi } from "../../context/AdminAuthContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import {
  BarChart2, Store, Package, ClipboardList, Users,
  TrendingUp, ShoppingCart, DollarSign, Menu, Download,
  Loader2, User
} from "lucide-react";
import "./Admin.css";

const STATUS_LABEL = {
  menunggu_konfirmasi: "Menunggu",
  diproses: "Dikemas",
  dikirim: "Dikirim",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

const STATUS_COLOR = {
  menunggu_konfirmasi: { bg: "#FEF3C7", fg: "#B45309" },
  diproses: { bg: "#E0E7FF", fg: "#4338CA" },
  dikirim: { bg: "#EDE9FE", fg: "#6D28D9" },
  selesai: { bg: "#D1FAE5", fg: "#065F46" },
  ditolak: { bg: "#FEE2E2", fg: "#991B1B" },
};

function formatRp(n) {
  const v = Math.round(n || 0);
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)} jt`;
  if (v >= 1_000) return `Rp ${Math.round(v / 1_000)} rb`;
  return `Rp${v.toLocaleString("id-ID")}`;
}
function formatRpFull(n) {
  return `Rp${Math.round(n || 0).toLocaleString("id-ID")}`;
}
function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function downloadCsv(kind) {
  const res = await adminApi.get(`/admin/export/${kind}.csv`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `qlapa-${kind}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

const TABS = [
  { key: "ringkasan", label: "Ringkasan",     Icon: BarChart2 },
  { key: "penjual",   label: "Penjual & Toko", Icon: Store },
  { key: "produk",    label: "Produk",         Icon: Package },
  { key: "pesanan",   label: "Pesanan",        Icon: ClipboardList },
  { key: "pengguna",  label: "Pengguna",       Icon: Users },
];

export default function AdminDashboard() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "ringkasan";
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-shell">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="admin-sidebar-head">
          <img
            src="/assets/qlapa-logo.png"
            alt="Qlapa"
            className="admin-sidebar-logo-img"
          />
          <div className="admin-sidebar-brand-sub">Admin Panel</div>
        </div>

        <nav className="admin-sidebar-nav">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`admin-nav-item${tab === t.key ? " active" : ""}`}
              onClick={() => {
                setParams({ tab: t.key });
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon"><t.Icon size={16} strokeWidth={1.8} /></span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-sidebar-user-label">Masuk sebagai</div>
          <div className="admin-sidebar-user-name">{admin?.name}</div>
          <button
            className="admin-logout-btn"
            onClick={() => {
              logout();
              navigate("/admin/login", { replace: true });
            }}
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main-wrap">
        {/* Top bar (mobile) */}
        <div className="admin-topbar">
          <button
            className="admin-hamburger"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="admin-topbar-title">
            {TABS.find((t) => t.key === tab)?.label || "Admin"}
          </div>
          <img
            src="/assets/qlapa-logo.png"
            alt="Qlapa"
            className="admin-topbar-logo-img"
          />
        </div>

        <main className="admin-main">
          {tab === "ringkasan" && <Ringkasan />}
          {tab === "penjual" && <PenjualTab />}
          {tab === "produk" && <ProdukTab />}
          {tab === "pesanan" && <PesananTab />}
          {tab === "pengguna" && <PenggunaTab />}
        </main>
      </div>
    </div>
  );
}

/* ── Shared ── */
function Loading() {
  return (
    <div className="admin-loading">
      <div className="admin-spinner" />
      <p className="admin-loading-text">Memuat data...</p>
    </div>
  );
}

function ExportButton({ kind, label }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="admin-export-btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadCsv(kind);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 size={14} className="admin-spin-icon" /> : <Download size={14} />}
      {busy ? "Menyiapkan..." : label}
    </button>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">{title}</h1>
        <p className="admin-page-subtitle">{subtitle}</p>
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_COLOR[status] || { bg: "#F3F4F6", fg: "#6B7280" };
  return (
    <span
      className="admin-status-badge"
      style={{ background: meta.bg, color: meta.fg }}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function AdminTable({ cols, rows, emptyMsg }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} className="admin-th">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="admin-td admin-td-empty" colSpan={cols.length}>
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="admin-tr">
                {row.map((cell, j) => (
                  <td key={j} className="admin-td">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AvatarCell({ src, name, isUser }) {
  return (
    <div className="admin-avatar-cell">
      <div className="admin-avatar-sm">
        {src ? (
          <img src={src} alt={name} className="admin-avatar-img" />
        ) : isUser ? (
          <User size={15} color="#78716C" strokeWidth={1.8} />
        ) : (
          <Store size={15} color="#78716C" strokeWidth={1.8} />
        )}
      </div>
      <span className="admin-avatar-name">{name}</span>
    </div>
  );
}

/* ── Ringkasan ── */
function Ringkasan() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi
      .get("/admin/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  if (!data) return <Loading />;
  const { summary, status_counts, top_sellers, recent_orders } = data;

  const statCards = [
    { label: "Total Pengguna",     value: summary.total_users,              Icon: Users,         color: "#4F46E5" },
    { label: "Total Penjual",      value: summary.total_sellers,            Icon: Store,         color: "#059669" },
    { label: "Total Pembeli",      value: summary.total_buyers,             Icon: ShoppingCart,  color: "#0284C7" },
    { label: "Total Produk",       value: summary.total_products,           Icon: Package,       color: "#D97706" },
    { label: "Total Pesanan",      value: summary.total_orders,             Icon: ClipboardList, color: "#7C3AED" },
    { label: "Pendapatan Selesai", value: formatRp(summary.total_revenue),  Icon: DollarSign,   color: "#059669" },
  ];

  return (
    <div>
      <PageHeader
        title="Ringkasan Platform"
        subtitle="Ikhtisar penjualan, toko, dan aktivitas Qlapa secara keseluruhan"
      />

      {/* Stat cards */}
      <div className="admin-stat-grid">
        {statCards.map((c) => (
          <div key={c.label} className="admin-stat-card">
            <div
              className="admin-stat-icon"
              style={{ background: c.color + "18", color: c.color }}
            >
              <c.Icon size={20} strokeWidth={1.8} />
            </div>
            <div>
              <div className="admin-stat-value">{c.value}</div>
              <div className="admin-stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-col widgets */}
      <div className="admin-two-col">
        {/* Status counts */}
        <div className="admin-widget">
          <h3 className="admin-widget-title">Status Pesanan</h3>
          {Object.keys(status_counts).length === 0 ? (
            <p className="admin-empty-inline">Belum ada pesanan.</p>
          ) : (
            Object.entries(status_counts).map(([status, count]) => (
              <div key={status} className="admin-widget-row">
                <div className="admin-widget-row-left">
                  <StatusBadge status={status} />
                </div>
                <strong className="admin-widget-row-val">{count}</strong>
              </div>
            ))
          )}
        </div>

        {/* Top sellers */}
        <div className="admin-widget">
          <h3 className="admin-widget-title">Top Penjual (Pendapatan)</h3>
          {top_sellers.length === 0 ? (
            <p className="admin-empty-inline">Belum ada data penjual.</p>
          ) : (
            top_sellers.map((s, i) => (
              <div key={s.id} className="admin-widget-row">
                <div className="admin-widget-row-left">
                  <span className="admin-rank-num">{i + 1}</span>
                  <span className="admin-widget-store-name">
                    {s.store_name}
                  </span>
                  <span className="admin-widget-meta">
                    {s.product_count} produk
                  </span>
                </div>
                <strong className="admin-widget-row-val">
                  {formatRp(s.revenue)}
                </strong>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent orders table */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-widget-title" style={{ margin: 0 }}>
            Pesanan Terbaru
          </h3>
        </div>
        <AdminTable
          cols={["ID", "Pembeli", "Toko Penjual", "Total", "Status", "Tanggal"]}
          emptyMsg="Belum ada pesanan."
          rows={recent_orders.map((o) => [
            <span className="admin-order-id">#{o.id}</span>,
            o.buyer_name,
            o.seller_store,
            formatRpFull(o.total),
            <StatusBadge status={o.status} />,
            formatDate(o.created_at),
          ])}
        />
      </div>
    </div>
  );
}

/* ── Penjual ── */
function PenjualTab() {
  const [sellers, setSellers] = useState(null);

  useEffect(() => {
    adminApi
      .get("/admin/sellers")
      .then((res) => setSellers(res.data))
      .catch(() => {});
  }, []);

  if (!sellers) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Penjual & Toko"
        subtitle="Semua toko yang aktif di Qlapa"
        actions={<ExportButton kind="sellers" label="Export CSV" />}
      />
      <AdminTable
        cols={[
          "Toko",
          "Pemilik",
          "Email",
          "Lokasi",
          "Produk",
          "Pesanan",
          "Pendapatan",
        ]}
        emptyMsg="Belum ada toko."
        rows={sellers.map((s) => [
          <AvatarCell
            src={s.store_image_url}
            name={s.store_name || s.name}
          />,
          s.name,
          <span className="admin-email">{s.email}</span>,
          s.store_location || <span className="admin-empty-cell">—</span>,
          <span className="admin-number">{s.product_count}</span>,
          <span className="admin-number">{s.order_count}</span>,
          <span className="admin-revenue">{formatRp(s.revenue)}</span>,
        ])}
      />
    </div>
  );
}

/* ── Produk ── */
function ProdukTab() {
  const [products, setProducts] = useState(null);
  const { showToast } = useToast();

  const loadProducts = () => {
    adminApi
      .get("/admin/products")
      .then((res) => setProducts(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus produk ini secara permanen sebagai Admin?")) return;
    try {
      await api.delete(`/products/${id}`);
      showToast("Produk berhasil dihapus.");
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal menghapus produk.", "error");
    }
  };

  if (!products) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Semua Produk"
        subtitle="Produk dari seluruh toko di platform"
        actions={<ExportButton kind="products" label="Export CSV" />}
      />
      <AdminTable
        cols={["Produk", "Kategori", "Harga", "Stok", "Penjual", "Status", "Aksi"]}
        emptyMsg="Belum ada produk."
        rows={products.map((p) => [
          <AvatarCell src={p.image_url} name={p.name} />,
          <span className="admin-category-badge">{p.category}</span>,
          formatRpFull(p.price) + `/${p.unit}`,
          <span className={`admin-stock${p.stock <= 5 ? " low" : ""}`}>
            {p.stock} {p.unit}
          </span>,
          p.seller?.store_name || <span className="admin-empty-cell">—</span>,
          <span
            className={`admin-status-pill ${p.status === "active" ? "active" : "inactive"}`}
          >
            {p.status === "active" ? "Aktif" : "Nonaktif"}
          </span>,
          <button
            key={p.id}
            onClick={() => handleDelete(p.id)}
            style={{
              background: "#FEE2E2",
              color: "#DC2626",
              border: "none",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Hapus
          </button>,
        ])}
      />
    </div>
  );
}

/* ── Pesanan ── */
function PesananTab() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    adminApi
      .get("/admin/orders")
      .then((res) => setOrders(res.data))
      .catch(() => {});
  }, []);

  if (!orders) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Semua Pesanan"
        subtitle="Riwayat transaksi seluruh toko"
        actions={<ExportButton kind="orders" label="Export CSV" />}
      />
      <AdminTable
        cols={[
          "ID",
          "Pembeli",
          "Toko Penjual",
          "Item",
          "Total",
          "Status",
          "Tanggal",
        ]}
        emptyMsg="Belum ada pesanan."
        rows={orders.map((o) => [
          <span className="admin-order-id">#{o.id}</span>,
          o.buyer_name,
          o.seller_store,
          <span className="admin-number">{(o.items || []).length} produk</span>,
          <span className="admin-revenue">{formatRpFull(o.total)}</span>,
          <StatusBadge status={o.status} />,
          formatDate(o.created_at),
        ])}
      />
    </div>
  );
}

/* ── Pengguna ── */
function PenggunaTab() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    adminApi
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, []);

  if (!users) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Semua Pengguna"
        subtitle="Seluruh akun yang terdaftar di Qlapa"
        actions={<ExportButton kind="users" label="Export CSV" />}
      />
      <AdminTable
        cols={["Nama", "Email", "Telepon", "Peran", "Bergabung"]}
        emptyMsg="Belum ada pengguna."
        rows={users.map((u) => [
          <AvatarCell src={u.avatar_url} name={u.name} isUser />,
          <span className="admin-email">{u.email}</span>,
          u.phone || <span className="admin-empty-cell">—</span>,
          u.is_admin ? (
            <span className="admin-role-badge admin">Admin</span>
          ) : u.is_seller ? (
            <span className="admin-role-badge seller">Penjual</span>
          ) : (
            <span className="admin-role-badge buyer">Pembeli</span>
          ),
          formatDate(u.created_at),
        ])}
      />
    </div>
  );
}
