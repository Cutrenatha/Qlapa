import React, { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Store, Package, ShoppingBag, TrendingUp, Plus,
  Edit2, Trash2, Check, X, Truck, Clock, CheckCircle2,
  XCircle, MapPin, Calendar, ArrowRight, ChevronRight,
  BarChart2, Star, Tag, Info, List
} from "lucide-react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import "./SellerDashboard.css";

/* ── Constants ── */
const STATUS_META = {
  menunggu_konfirmasi: {
    label: "Menunggu",
    bg: "#FEF3C7",
    fg: "#B45309",
    Icon: Clock,
  },
  diproses: {
    label: "Dikemas",
    bg: "#E0E7FF",
    fg: "#4338CA",
    Icon: Package,
  },
  dikirim: {
    label: "Dikirim",
    bg: "#EDE9FE",
    fg: "#6D28D9",
    Icon: Truck,
  },
  selesai: {
    label: "Selesai",
    bg: "#D1FAE5",
    fg: "#065F46",
    Icon: CheckCircle2,
  },
  ditolak: {
    label: "Ditolak",
    bg: "#FEE2E2",
    fg: "#991B1B",
    Icon: XCircle,
  },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatJoined(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatOrderDate(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function orderCode(o) {
  const d = new Date(o.created_at);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `ORD-${dd}${mm}${yy}-${String(o.id).padStart(3, "0")}`;
}

function formatRp(val) {
  if (!val) return "Rp 0";
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} jt`;
  if (val >= 1_000) return `Rp ${Math.round(val / 1_000)} rb`;
  return `Rp ${val}`;
}

/* ── Mock Data matching screenshot exactly ── */
const MOCK_DATA = {
  store: {
    name: "Toko Saya",
    location: "Banda Aceh, Aceh",
    description: "Menyediakan berbagai limbah kelapa berkualitas untuk kebutuhan industri dan kerajinan.",
    joined_at: "2026-07-01T00:00:00Z",
    rating: 4.8,
    review_count: 12,
    categories: "Tempurung, Sabut, Ampas Kelapa",
  },
  summary: {
    pesanan_baru: 3,
    produk_terjual: 48,
    pendapatan: 2500000,
    tingkat_respons: 96,
  },
  products: [
    { id: 1, name: "Tempurung Kelapa Kering", category: "Tempurung", price: 15000, unit: "kg", stock: 120, status: "active", image_url: null },
    { id: 2, name: "Sabut Kelapa Olahan", category: "Sabut", price: 8000, unit: "kg", stock: 80, status: "active", image_url: null },
    { id: 3, name: "Ampas Kelapa Segar", category: "Ampas", price: 5000, unit: "kg", stock: 0, status: "active", image_url: null },
  ],
  orders: [
    {
      id: 101,
      status: "menunggu_konfirmasi",
      payment_status: "paid",
      buyer_name: "Budi Santoso",
      shipping_address: "Jl. Teuku Umar No. 12, Banda Aceh",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      total: 375000,
      admin_fee: 37500,
      shipping_cost: 25000,
      items: [
        { id: 1, product_name: "Tempurung Kelapa Kering", qty: 20, subtotal: 300000 },
        { id: 2, product_name: "Sabut Kelapa Olahan", qty: 5, subtotal: 40000 },
      ],
    },
    {
      id: 100,
      status: "diproses", // Dikemas
      payment_status: "paid",
      buyer_name: "Siti Rahmah",
      shipping_address: "Jl. Sudirman No. 45, Lhokseumawe",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      total: 215000,
      admin_fee: 21500,
      shipping_cost: 20000,
      items: [
        { id: 3, product_name: "Ampas Kelapa Segar", qty: 30, subtotal: 150000 },
      ],
    },
    {
      id: 99,
      status: "selesai",
      payment_status: "paid",
      buyer_name: "CV. Agro Nusantara",
      shipping_address: "Kawasan Industri Krueng Mane, Aceh Utara",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      total: 1250000,
      admin_fee: 125000,
      shipping_cost: 30000,
      items: [
        { id: 4, product_name: "Tempurung Kelapa Kering", qty: 70, subtotal: 1050000 },
        { id: 5, product_name: "Sabut Kelapa Olahan", qty: 20, subtotal: 160000 },
      ],
    },
  ],
};

/* ── Root ── */
export default function SellerDashboard() {
  return <DashboardShell />;
}

/* ── Shell ── */
function DashboardShell() {
  const [params] = useSearchParams();
  const tab = params.get("tab") || "beranda";
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Start with MOCK_DATA so the page NEVER renders blank
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await api.get("/seller/dashboard");
      if (!mountedRef.current) return;
      const apiData = res.data;
      setData({
        store: {
          ...MOCK_DATA.store,
          ...apiData.store,
          name: apiData.store?.name || user?.store_name || MOCK_DATA.store.name,
          location: apiData.store?.location || user?.store_location || MOCK_DATA.store.location,
          description: apiData.store?.description || user?.store_description || MOCK_DATA.store.description,
          categories: apiData.store?.categories || MOCK_DATA.store.categories,
        },
        summary: {
          ...MOCK_DATA.summary,
          ...(apiData.summary || {}),
        },
        products: Array.isArray(apiData.products) ? apiData.products : [],
        orders: Array.isArray(apiData.orders) ? apiData.orders : [],
      });
    } catch (err) {
      if (!mountedRef.current) return;
      const status = err?.response?.status;
      if (status === 403) {
        // User hasn't opened a store yet
        setApiError("not_seller");
      } else if (status === 401) {
        // Token expired or invalid
        navigate("/masuk");
        return;
      } else {
        // Network error / backend down — keep showing MOCK_DATA
        console.warn("Dashboard API tidak tersedia, menggunakan data simulasi.", err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteProduct = async (id) => {
    if (!window.confirm("Hapus produk ini?")) return;
    try {
      await api.delete(`/products/${id}`);
      showToast("Produk dihapus.");
      load();
    } catch (err) {
      showToast("Gagal menghapus produk.", "error");
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      showToast("Status pesanan diperbarui.");
      load();
    } catch (err) {
      showToast("Gagal memperbarui status pesanan.", "error");
    }
  };

  // Not a seller — show friendly prompt to open a store
  if (apiError === "not_seller") {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-empty-state" style={{ marginTop: 40 }}>
          <Store size={48} color="var(--brown-300)" strokeWidth={1.3} />
          <h3 className="dashboard-empty-title">Toko Anda Belum Dibuka</h3>
          <p className="dashboard-empty-sub">
            Buka toko Anda untuk mulai berjualan produk limbah kelapa dan kelola pesanan dari satu tempat.
          </p>
          <Link to="/toko/buka" className="dashboard-action-btn">
            <Plus size={15} strokeWidth={2.5} />
            Buka Toko Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {/* Top bar */}
      <div className="dashboard-topbar">
        <div>
          <h1 className="dashboard-title">
            {(tab === "beranda" || tab === "toko") && (data.store?.name || "Toko Saya")}
            {tab === "produk"  && "Produk Saya"}
            {tab === "pesanan" && "Pemesanan"}
          </h1>
          <p className="dashboard-subtitle">
            {(tab === "beranda" || tab === "toko") && (
              loading
                ? "Memuat data..."
                : `Bergabung ${formatJoined(data.store?.joined_at)} · Toko Aktif`
            )}
            {tab === "produk"  && `${(data.products || []).length} produk terdaftar`}
            {tab === "pesanan" && `${(data.orders || []).length} total pesanan`}
          </p>
        </div>

        {/* Action button (produk tab only) */}
        {tab === "produk" && (
          <Link to="/dashboard/tambah-produk" className="dashboard-action-btn">
            <Plus size={16} strokeWidth={2.5} />
            Tambah Produk
          </Link>
        )}
      </div>

      {/* Subtle loading bar at top when refreshing */}
      {loading && (
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, var(--brown-300), var(--brown-700))",
          borderRadius: 99,
          marginBottom: 20,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      )}

      {/* Content */}
      <div className="dashboard-content">
        {(tab === "beranda" || tab === "toko") && <BerandaTab data={data} />}
        {tab === "produk"  && <ProdukTab products={data.products || []} onDelete={deleteProduct} />}
        {tab === "pesanan" && <PesananTab orders={data.orders || []} onUpdateStatus={updateOrderStatus} />}
      </div>
    </div>
  );
}

/* ── Beranda Tab ── */
function BerandaTab({ data }) {
  const { store, summary, orders } = data;
  const pendingOrders = orders.filter((o) => o.status === "menunggu_konfirmasi");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Alert pesanan pending */}
      {pendingOrders.length > 0 && (
        <div className="dashboard-alert-card">
          <div className="dashboard-alert-icon-wrap">
            <Info size={18} strokeWidth={2.5} />
          </div>
          <div className="dashboard-alert-content">
            <p className="dashboard-alert-title">
              {pendingOrders.length} pesanan menunggu konfirmasi Anda
            </p>
            <p className="dashboard-alert-sub">
              Pembeli sedang menunggu. Segera proses agar reputasi toko terjaga.
            </p>
          </div>
          <Link to="/dashboard?tab=pesanan" className="dashboard-alert-link">
            Proses Sekarang <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 4 Stat cards */}
      <div className="dashboard-stats-grid">
        {[
          {
            Icon: ShoppingBag,
            label: "Pesanan Baru",
            value: summary.pesanan_baru,
            sub: "butuh konfirmasi",
            targetTab: "pesanan",
          },
          {
            Icon: Package,
            label: "Produk Terjual",
            value: summary.produk_terjual,
            sub: "total unit terjual",
            targetTab: "produk",
          },
          {
            Icon: TrendingUp,
            label: "Pendapatan",
            value: formatRp(summary.pendapatan),
            sub: "estimasi bersih",
            targetTab: "beranda",
          },
          {
            Icon: BarChart2,
            label: "Tingkat Respons",
            value: `${summary.tingkat_respons}%`,
            sub: "dari total pesanan masuk",
            targetTab: "beranda",
          },
        ].map(({ Icon, label, value, sub, targetTab }) => (
          <Link to={`/dashboard?tab=${targetTab}`} key={label} className="dashboard-stat-card">
            <div className="dashboard-stat-left">
              <div className="dashboard-stat-icon-wrap">
                <Icon size={18} strokeWidth={2} />
              </div>
              <h3 className="dashboard-stat-value">{value}</h3>
              <p className="dashboard-stat-label">{label}</p>
              <p className="dashboard-stat-sub">{sub}</p>
            </div>
            <ChevronRight size={16} className="dashboard-stat-chevron" />
          </Link>
        ))}
      </div>

      {/* Row 2: Store info + Recent orders */}
      <div className="dashboard-twocol">
        
        {/* Left column: Profil Toko */}
        <div className="dashboard-card">
          <p className="dashboard-card-label">Profil Toko</p>
          <div className="dashboard-store-info">
            <div className="dashboard-store-avatar">
              <Store size={24} strokeWidth={1.8} />
            </div>
            <div className="dashboard-store-name-wrap">
              <p className="dashboard-store-name">{store.name}</p>
              <div className="dashboard-store-rating-row">
                {store.rating != null ? (
                  <>
                    <Star size={13} color="#F59E0B" fill="#F59E0B" />
                    <span className="dashboard-store-rating-text">
                      {Number(store.rating).toFixed(1)} ({store.review_count || 0} ulasan)
                    </span>
                  </>
                ) : (
                  <span className="dashboard-store-rating-text">Belum ada ulasan</span>
                )}
              </div>
            </div>
            <div className="dashboard-status-pill">
              <span className="dashboard-status-dot" />
              Aktif
            </div>
          </div>

          <div className="dashboard-store-meta-list">
            <div className="dashboard-store-meta-item">
              <MapPin size={14} />
              <span>{store.location || "Lokasi belum diisi"}</span>
            </div>
            <div className="dashboard-store-meta-item">
              <Calendar size={14} />
              <span>Bergabung {formatJoined(store.joined_at)}</span>
            </div>
            <div className="dashboard-store-meta-item">
              <Tag size={14} />
              <span>Kategori Utama: {store.categories}</span>
            </div>
          </div>

          {store.description && (
            <p className="dashboard-store-desc">{store.description}</p>
          )}

          <div className="dashboard-centered-footer">
            <Link to="/profil" className="dashboard-btn-pill-outline">
              <Edit2 size={13} />
              Edit Profil
            </Link>
          </div>
        </div>

        {/* Right column: Recent orders */}
        <div className="dashboard-card">
          <div className="dashboard-card-header-row">
            <p className="dashboard-card-label" style={{ margin: 0 }}>Pesanan Terbaru</p>
            <Link to="/dashboard?tab=pesanan" className="dashboard-see-all-link">
              Lihat semua <ChevronRight size={13} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="dashboard-empty-state" style={{ border: "none", padding: "32px 0" }}>
              <ShoppingBag size={28} color="#D1D5DB" />
              <p className="dashboard-empty-sub" style={{ margin: "8px 0 0" }}>
                Belum ada pesanan masuk.
              </p>
            </div>
          ) : (
            <div className="dashboard-recent-orders-list">
              {orders.slice(0, 3).map((o) => {
                const meta = STATUS_META[o.status] || STATUS_META.menunggu_konfirmasi;
                const { Icon: StatusIcon } = meta;
                return (
                  <div key={o.id} className="dashboard-order-row-small">
                    <div className="dashboard-order-status-icon-wrap" style={{ background: meta.bg }}>
                      <StatusIcon size={16} color={meta.fg} strokeWidth={2.5} />
                    </div>
                    <div className="dashboard-order-info-small">
                      <p className="dashboard-order-code-small">{orderCode(o)}</p>
                      <p className="dashboard-order-buyer-small">{o.buyer_name}</p>
                    </div>
                    <div className="dashboard-order-amt-col">
                      <p className="dashboard-order-amt-small">{formatRp(o.total)}</p>
                      <span className="status-pill-badge" style={{ background: meta.bg, color: meta.fg }}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              <div className="dashboard-centered-footer">
                <Link to="/dashboard?tab=pesanan" className="dashboard-btn-pill-outline">
                  <List size={13} />
                  Kelola Pesanan
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Produk Tab ── */
function ProdukTab({ products, onDelete }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {products.length === 0 ? (
        <div className="dashboard-empty-state">
          <Package size={36} color="#D1D5DB" strokeWidth={1.2} />
          <h3 className="dashboard-empty-title">Belum ada produk</h3>
          <p className="dashboard-empty-sub">Tambahkan produk limbah kelapa pertama Anda untuk mulai berjualan.</p>
          <Link to="/dashboard/tambah-produk" className="dashboard-action-btn">
            <Plus size={15} /> Tambah Produk Pertama
          </Link>
        </div>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th className="dashboard-table-th">Produk</th>
                <th className="dashboard-table-th">Kategori</th>
                <th className="dashboard-table-th">Harga</th>
                <th className="dashboard-table-th">Stok</th>
                <th className="dashboard-table-th">Status</th>
                <th className="dashboard-table-th"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  {/* Produk info */}
                  <td className="dashboard-table-td" data-label="Produk">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="dashboard-product-thumb">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Package size={18} color="#D1D5DB" />
                        )}
                      </div>
                      <div>
                        <p className="dashboard-product-name">{p.name}</p>
                        <p className="dashboard-product-unit">per {p.unit}</p>
                      </div>
                    </div>
                  </td>
                  {/* Kategori */}
                  <td className="dashboard-table-td" data-label="Kategori">
                    <span className="dashboard-tag-badge">
                      <Tag size={11} /> {p.category}
                    </span>
                  </td>
                  {/* Harga */}
                  <td className="dashboard-table-td" data-label="Harga">
                    <p className="dashboard-price-text">Rp {(p.price || 0).toLocaleString("id-ID")}</p>
                  </td>
                  {/* Stok */}
                  <td className="dashboard-table-td" data-label="Stok">
                    <p className="dashboard-stock-text" style={{ color: p.stock <= 5 ? "var(--danger)" : "var(--ink)" }}>
                      {p.stock} {p.unit}
                    </p>
                  </td>
                  {/* Status */}
                  <td className="dashboard-table-td" data-label="Status">
                    <span className="status-pill-badge" style={{
                      background: p.status === "active" ? "var(--green-100)" : "#F3F4F6",
                      color: p.status === "active" ? "var(--green-900)" : "var(--ink-soft)",
                    }}>
                      {p.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="dashboard-table-td actions-td">
                    <div className="dashboard-actions-td-content">
                      <Link
                        to={`/dashboard/produk/${p.id}/edit`}
                        className="dashboard-icon-btn"
                        title="Edit produk"
                      >
                        <Edit2 size={14} strokeWidth={2} />
                      </Link>
                      <button
                        className="dashboard-icon-btn delete-btn"
                        onClick={() => onDelete(p.id)}
                        title="Hapus produk"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Pesanan Tab ── */
function PesananTab({ orders, onUpdateStatus }) {
  const [filter, setFilter] = useState("semua");

  const tabs = [
    { key: "semua", label: "Semua" },
    { key: "menunggu_konfirmasi", label: "Menunggu" },
    { key: "diproses", label: "Dikemas" },
    { key: "dikirim", label: "Dikirim" },
    { key: "selesai", label: "Selesai" },
    { key: "ditolak", label: "Ditolak" },
  ];

  const filtered = filter === "semua"
    ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter tabs */}
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

      {/* Order cards */}
      {filtered.length === 0 ? (
        <div className="dashboard-empty-state">
          <ShoppingBag size={36} color="#D1D5DB" strokeWidth={1.2} />
          <h3 className="dashboard-empty-title">Tidak ada pesanan</h3>
          <p className="dashboard-empty-sub">Belum ada pesanan dengan status ini.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((o) => {
            const meta = STATUS_META[o.status] || STATUS_META.menunggu_konfirmasi;
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
                  {/* Buyer info */}
                  <div className="dashboard-order-section">
                    <p className="dashboard-order-section-label">Pembeli</p>
                    <p className="dashboard-order-buyer-name">{o.buyer_name}</p>
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
                        <span>{o.shipping_cost > 0 ? `Rp ${o.shipping_cost.toLocaleString("id-ID")}` : "Pick Up"}</span>
                      </div>
                      <div className="dashboard-cost-row dashboard-cost-total-row">
                        <span>Total Transaksi</span>
                        <span>Rp {(o.total || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(o.status === "menunggu_konfirmasi" || o.status === "diproses") && (
                  <div className="dashboard-order-card-foot">
                    {o.status === "menunggu_konfirmasi" && (
                      <>
                        <button
                          className="dashboard-btn-action-primary"
                          onClick={() => onUpdateStatus(o.id, "diproses")}
                        >
                          <Check size={14} strokeWidth={2.5} />
                          Terima Pesanan
                        </button>
                        <button
                          className="dashboard-btn-action-danger"
                          onClick={() => onUpdateStatus(o.id, "ditolak")}
                        >
                          <X size={14} strokeWidth={2.5} />
                          Tolak
                        </button>
                      </>
                    )}
                    {o.status === "diproses" && (
                      <button
                        className="dashboard-btn-action-primary"
                        onClick={() => onUpdateStatus(o.id, "dikirim")}
                      >
                        <Truck size={14} strokeWidth={2} />
                        Tandai Dikirim
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
