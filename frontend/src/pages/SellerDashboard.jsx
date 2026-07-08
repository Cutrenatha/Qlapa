import React, { useEffect, useState } from "react";
import { Link, useSearchParams, Navigate } from "react-router-dom";
import {
  Store, Package, ShoppingBag, TrendingUp, Bell, Plus,
  Edit2, Trash2, Check, X, Truck, Clock, CheckCircle2,
  XCircle, MapPin, Calendar, ArrowRight, ChevronRight,
  BarChart2, Star, AlertCircle, Tag, Layers
} from "lucide-react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

/* ── Constants ── */
const STATUS_META = {
  menunggu_konfirmasi: {
    label: "Menunggu",
    bg: "#FEF3C7",
    fg: "#92400E",
    Icon: Clock,
  },
  diproses: { label: "Dikemas", bg: "#D1FAE5", fg: "#065F46", Icon: Package },
  dikirim: { label: "Dikirim", bg: "#EDE9FE", fg: "#4C1D95", Icon: Truck },
  selesai: { label: "Selesai", bg: "#D1FAE5", fg: "#065F46", Icon: CheckCircle2 },
  ditolak: { label: "Ditolak", bg: "#FEE2E2", fg: "#991B1B", Icon: XCircle },
};

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function formatJoined(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatOrderDate(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function orderCode(o) {
  const d = new Date(o.created_at);
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = String(d.getFullYear()).slice(2);
  return `ORD-${dd}${mm}${yy}-${String(o.id).padStart(3,"0")}`;
}
function formatRp(val) {
  if (!val) return "Rp 0";
  if (val >= 1_000_000) return `Rp ${(val/1_000_000).toFixed(1)} jt`;
  if (val >= 1_000) return `Rp ${Math.round(val/1_000)} rb`;
  return `Rp ${val}`;
}

/* ── Root ── */
export default function SellerDashboard() {
  return <DashboardShell />;
}

/* ── Shell ── */
/* ── Template/mock data for empty state ── */
const MOCK_DATA = {
  store: {
    name: "Toko Saya",
    location: "Banda Aceh, Aceh",
    description: "Supplier limbah kelapa berkualitas — tempurung, sabut, dan ampas kelapa siap kirim.",
    joined_at: new Date().toISOString(),
    rating: 4.8,
    review_count: 12,
  },
  summary: {
    pesanan_baru: 3,
    produk_terjual: 48,
    pendapatan: 2_450_000,
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
      status: "dikirim",
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
      buyer_name: "Ahmad Fauzi",
      shipping_address: "Jl. Merdeka No. 7, Sabang",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      total: 480000,
      admin_fee: 48000,
      shipping_cost: 30000,
      items: [
        { id: 4, product_name: "Tempurung Kelapa Kering", qty: 25, subtotal: 375000 },
        { id: 5, product_name: "Sabut Kelapa Olahan", qty: 3, subtotal: 24000 },
      ],
    },
  ],
};

function DashboardShell() {
  const [params] = useSearchParams();
  const tab = params.get("tab") || "beranda";
  const { showToast } = useToast();
  const { user } = useAuth();

  const mergeWithMock = (apiData) => ({
    store: {
      ...MOCK_DATA.store,
      ...(apiData?.store || {}),
      name: apiData?.store?.name || user?.store_name || MOCK_DATA.store.name,
      location: apiData?.store?.location || user?.store_location || MOCK_DATA.store.location,
      description: apiData?.store?.description || user?.store_description || MOCK_DATA.store.description,
    },
    summary: { ...MOCK_DATA.summary, ...(apiData?.summary || {}) },
    products: (apiData?.products?.length > 0) ? apiData.products : MOCK_DATA.products,
    orders:   (apiData?.orders?.length   > 0) ? apiData.orders   : MOCK_DATA.orders,
  });

  /* Force static mock data so Beranda is never empty */
  const [data, setData] = useState(MOCK_DATA);

  const load = () => {
    // Statis: always use mock data directly
    setData(MOCK_DATA);
  };

  useEffect(() => { load(); }, []);

  const deleteProduct = async (id) => {
    if (!window.confirm("Hapus produk ini?")) return;
    await api.delete(`/products/${id}`);
    showToast("Produk dihapus.");
    load();
  };

  const updateOrderStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    showToast("Status pesanan diperbarui.");
    load();
  };

  return (
    <div style={s.shell}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.topBarTitle}>
            {(tab === "beranda" || tab === "toko") && (data.store.name)}
            {tab === "produk"  && "Produk Saya"}
            {tab === "pesanan" && "Pemesanan"}
          </h1>
          <p style={s.topBarSub}>
            {(tab === "beranda" || tab === "toko") && `Bergabung ${formatJoined(data.store.joined_at)} · Toko Aktif`}
            {tab === "produk"  && `${data.products.length} produk terdaftar`}
            {tab === "pesanan" && `${data.orders.length} total pesanan`}
          </p>
        </div>

        {/* Action button (produk tab only) */}
        {tab === "produk" && (
          <Link to="/dashboard/tambah-produk" style={s.actionBtn}>
            <Plus size={16} strokeWidth={2} />
            Tambah Produk
          </Link>
        )}
      </div>

      {/* Content — always rendered, data is never null */}
      <div style={s.content}>
        {(tab === "beranda" || tab === "toko") && <BerandaTab data={data} onUpdateStatus={updateOrderStatus} />}
        {tab === "produk"  && <ProdukTab  products={data.products} onDelete={deleteProduct} />}
        {tab === "pesanan" && <PesananTab orders={data.orders}    onUpdateStatus={updateOrderStatus} />}
      </div>
    </div>
  );
}

/* ── Beranda Tab ── */
function BerandaTab({ data, onUpdateStatus }) {
  const { store, summary, orders } = data;
  const pendingOrders = orders.filter((o) => o.status === "menunggu_konfirmasi");
  const products = data.products || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Alert pesanan pending ── */}
      {pendingOrders.length > 0 && (
        <div style={s.alertCard}>
          <AlertCircle size={18} color="#92400E" strokeWidth={1.8} />
          <div style={{ flex: 1 }}>
            <p style={s.alertTitle}>
              {pendingOrders.length} pesanan menunggu konfirmasi Anda
            </p>
            <p style={s.alertSub}>
              Pembeli sedang menunggu. Segera proses agar reputasi toko terjaga.
            </p>
          </div>
          <Link to="/dashboard?tab=pesanan" style={s.alertLink}>
            Proses Sekarang <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── 4 Stat cards ── */}
      <div style={s.statsGrid}>
        {[
          {
            Icon: ShoppingBag,
            label: "Pesanan Baru",
            value: summary.pesanan_baru,
            sub: "butuh konfirmasi",
            color: "#92400E", bg: "#FEF3C7", accent: "#F59E0B",
          },
          {
            Icon: Package,
            label: "Produk Terjual",
            value: summary.produk_terjual,
            sub: "total unit terjual",
            color: "#065F46", bg: "#D1FAE5", accent: "#10B981",
          },
          {
            Icon: TrendingUp,
            label: "Pendapatan",
            value: formatRp(summary.pendapatan),
            sub: "estimasi bersih",
            color: "#1E3A5F", bg: "#DBEAFE", accent: "#3B82F6",
          },
          {
            Icon: BarChart2,
            label: "Tingkat Respons",
            value: `${summary.tingkat_respons}%`,
            sub: "dari total pesanan",
            color: "#4C1D95", bg: "#EDE9FE", accent: "#8B5CF6",
          },
        ].map(({ Icon, label, value, sub, color, bg, accent }) => (
          <div key={label} style={{ ...s.statCard, background: bg }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ ...s.statIconWrap, background: accent }}>
                <Icon size={17} color="#fff" strokeWidth={1.8} />
              </div>
            </div>
            <p style={{ ...s.statValue, color }}>{value}</p>
            <p style={{ ...s.statLabel, color }}>{label}</p>
            <p style={{ fontSize: "0.72rem", color, opacity: 0.55, margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Store info + Recent orders ── */}
      <div style={s.twoCol}>
        
        {/* Left column: Profil Toko + Sebaran Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={s.card}>
            <p style={s.cardLabel}>Profil Toko</p>
            <div style={s.storeInfo}>
              <div style={s.storeAvatarWrap}>
                <Store size={24} color="#5C381D" strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={s.storeName}>{store.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  {store.rating ? (
                    <>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <span style={s.storeRating}>
                        {store.rating.toFixed(1)} ({store.review_count} ulasan)
                      </span>
                    </>
                  ) : (
                    <span style={s.storeRating}>Belum ada ulasan</span>
                  )}
                </div>
              </div>
              <div style={s.statusPillGreen}>
                <span style={s.statusDot} />
                Aktif
              </div>
            </div>

            <div style={s.storeMetaGrid}>
              <div style={s.storeMeta}>
                <MapPin size={13} color="#9CA3AF" />
                <span>{store.location || "Lokasi belum diisi"}</span>
              </div>
              <div style={s.storeMeta}>
                <Calendar size={13} color="#9CA3AF" />
                <span>Bergabung {formatJoined(store.joined_at)}</span>
              </div>
              <div style={s.storeMeta}>
                <Layers size={13} color="#9CA3AF" />
                <span>{products.length} produk terdaftar</span>
              </div>
            </div>

            {store.description && (
              <p style={s.storeDesc}>{store.description}</p>
            )}
          </div>

          <div style={s.card}>
            <p style={s.cardLabel}>Status Pesanan</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const count = orders.filter((o) => o.status === key).length;
                const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                const { Icon: StatusIcon } = meta;
                return (
                  <div key={key}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <StatusIcon size={12} color={meta.fg} strokeWidth={2} />
                        <span style={{ fontSize: "0.78rem", color: "#374151", fontWeight: 500 }}>{meta.label}</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 700 }}>{count} pesanan</span>
                    </div>
                    <div style={{ height: 5, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: meta.fg, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Recent orders + Active products */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Recent orders */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={s.cardLabel}>Pesanan Terbaru</p>
              <Link to="/dashboard?tab=pesanan" style={s.seeAllLink}>
                Lihat semua <ChevronRight size={13} />
              </Link>
            </div>

            {orders.length === 0 ? (
              <div style={s.emptySmall}>
                <ShoppingBag size={24} color="#D1D5DB" />
                <p style={{ color: "#9CA3AF", fontSize: "0.82rem", margin: "8px 0 0" }}>
                  Belum ada pesanan masuk.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {orders.slice(0, 5).map((o, i) => {
                  const meta = STATUS_META[o.status] || STATUS_META.menunggu_konfirmasi;
                  const { Icon: StatusIcon } = meta;
                  return (
                    <div
                      key={o.id}
                      style={{
                        ...s.orderRowSmall,
                        borderBottom: i < Math.min(orders.length, 5) - 1 ? "1px solid #F3F4F6" : "none",
                      }}
                    >
                      <div style={{ ...s.orderStatusDot, background: meta.bg }}>
                        <StatusIcon size={13} color={meta.fg} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={s.orderCodeSmall}>{orderCode(o)}</p>
                        <p style={s.orderBuyerSmall}>{o.buyer_name}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={s.orderAmtSmall}>{formatRp(o.total)}</p>
                        <span style={{ ...s.statusTag, background: meta.bg, color: meta.fg }}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active products overview */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={s.cardLabel}>Ringkasan Produk Aktif</p>
              <Link to="/dashboard?tab=produk" style={s.seeAllLink}>
                Kelola <ChevronRight size={13} />
              </Link>
            </div>

            {products.length === 0 ? (
              <div style={s.emptySmall}>
                <Package size={24} color="#D1D5DB" />
                <p style={{ color: "#9CA3AF", fontSize: "0.82rem", margin: "8px 0 0" }}>
                  Belum ada produk aktif.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {products.slice(0, 4).map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Package size={16} color="#AEAEB2" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "#1D1D1F", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize: "0.74rem", color: "#6B7280", margin: "2px 0 0" }}>
                        Stok: {p.stock} {p.unit} · Rp {p.price.toLocaleString("id-ID")}/{p.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        <div style={s.emptyState}>
          <Package size={36} color="#D1D5DB" strokeWidth={1.2} />
          <p style={s.emptyTitle}>Belum ada produk</p>
          <p style={s.emptySub}>Tambahkan produk limbah kelapa pertama Anda untuk mulai berjualan.</p>
          <Link to="/dashboard/tambah-produk" style={s.actionBtn}>
            <Plus size={15} /> Tambah Produk Pertama
          </Link>
        </div>
      ) : (
        <>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Produk</th>
                  <th style={s.th}>Kategori</th>
                  <th style={s.th}>Harga</th>
                  <th style={s.th}>Stok</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      background: i % 2 === 0 ? "#fff" : "#FAFAFA",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Produk info */}
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={s.productThumb}>
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
                          <p style={s.productName}>{p.name}</p>
                          <p style={s.productUnit}>per {p.unit}</p>
                        </div>
                      </div>
                    </td>
                    {/* Kategori */}
                    <td style={s.td}>
                      <span style={s.categoryTag}>
                        <Tag size={11} /> {p.category}
                      </span>
                    </td>
                    {/* Harga */}
                    <td style={s.td}>
                      <p style={s.priceText}>Rp {p.price.toLocaleString("id-ID")}</p>
                    </td>
                    {/* Stok */}
                    <td style={s.td}>
                      <p style={{
                        ...s.stockText,
                        color: p.stock <= 5 ? "#DC2626" : "#374151",
                      }}>
                        {p.stock} {p.unit}
                      </p>
                    </td>
                    {/* Status */}
                    <td style={s.td}>
                      <span style={{
                        ...s.statusTag,
                        background: p.status === "active" ? "#D1FAE5" : "#F3F4F6",
                        color: p.status === "active" ? "#065F46" : "#6B7280",
                      }}>
                        {p.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ ...s.td, textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                        <Link
                          to={`/dashboard/produk/${p.id}/edit`}
                          style={s.iconBtn}
                          title="Edit produk"
                        >
                          <Edit2 size={15} strokeWidth={1.8} />
                        </Link>
                        <button
                          style={{ ...s.iconBtn, color: "#DC2626" }}
                          onClick={() => onDelete(p.id)}
                          title="Hapus produk"
                        >
                          <Trash2 size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
      <div style={s.filterRow}>
        {tabs.map((t) => {
          const count = t.key === "semua"
            ? orders.length
            : orders.filter((o) => o.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                ...s.filterTab,
                background: filter === t.key ? "#1D1D1F" : "transparent",
                color: filter === t.key ? "#fff" : "#6B7280",
                borderColor: filter === t.key ? "#1D1D1F" : "#E5E7EB",
              }}
            >
              {t.label}
              {count > 0 && (
                <span style={{
                  ...s.filterCount,
                  background: filter === t.key ? "rgba(255,255,255,0.2)" : "#F3F4F6",
                  color: filter === t.key ? "#fff" : "#374151",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      {filtered.length === 0 ? (
        <div style={s.emptyState}>
          <ShoppingBag size={36} color="#D1D5DB" strokeWidth={1.2} />
          <p style={s.emptyTitle}>Tidak ada pesanan</p>
          <p style={s.emptySub}>Belum ada pesanan dengan status ini.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((o) => {
            const meta = STATUS_META[o.status] || STATUS_META.menunggu_konfirmasi;
            const { Icon: StatusIcon } = meta;
            return (
              <div key={o.id} style={s.orderCard}>
                {/* Header */}
                <div style={s.orderCardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ ...s.orderStatusIcon, background: meta.bg }}>
                      <StatusIcon size={15} color={meta.fg} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={s.orderCardCode}>{orderCode(o)}</p>
                      <p style={s.orderCardDate}>{formatOrderDate(o.created_at)}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      ...s.statusTag,
                      background: o.payment_status === "paid" ? "#D1FAE5" : "#FEE2E2",
                      color: o.payment_status === "paid" ? "#065F46" : "#991B1B",
                    }}>
                      {o.payment_status === "paid" ? "Lunas" : "Belum Lunas"}
                    </span>
                    <span style={{ ...s.statusTag, background: meta.bg, color: meta.fg }}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div style={s.orderCardBody}>
                  {/* Buyer info */}
                  <div style={s.orderSection}>
                    <p style={s.orderSectionLabel}>Pembeli</p>
                    <p style={s.orderBuyerName}>{o.buyer_name}</p>
                    {o.shipping_address && (
                      <p style={s.orderAddress}>{o.shipping_address}</p>
                    )}
                  </div>

                  {/* Items */}
                  <div style={s.orderSection}>
                    <p style={s.orderSectionLabel}>Produk ({o.items.length})</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {o.items.map((it) => (
                        <div key={it.id} style={s.orderItemRow}>
                          <span style={{ flex: 1, color: "#374151", fontSize: "0.88rem" }}>
                            {it.product_name}
                            <span style={{ color: "#9CA3AF", marginLeft: 6 }}>x{it.qty}</span>
                          </span>
                          <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1D1D1F" }}>
                            Rp {it.subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total breakdown */}
                  <div style={s.orderSection}>
                    <p style={s.orderSectionLabel}>Rincian Biaya</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={s.costRow}>
                        <span>Subtotal Produk</span>
                        <span>Rp {(o.total - (o.admin_fee || 0) - (o.shipping_cost || 0)).toLocaleString("id-ID")}</span>
                      </div>
                      <div style={s.costRow}>
                        <span>Biaya Admin (10%)</span>
                        <span>Rp {(o.admin_fee || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div style={s.costRow}>
                        <span>Ongkos Kirim</span>
                        <span>{o.shipping_cost > 0 ? `Rp ${o.shipping_cost.toLocaleString("id-ID")}` : "Pick Up"}</span>
                      </div>
                      <div style={{ ...s.costRow, ...s.costTotal }}>
                        <span>Total Transaksi</span>
                        <span>Rp {o.total.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(o.status === "menunggu_konfirmasi" || o.status === "diproses") && (
                  <div style={s.orderCardFoot}>
                    {o.status === "menunggu_konfirmasi" && (
                      <>
                        <button
                          style={s.btnPrimary}
                          onClick={() => onUpdateStatus(o.id, "diproses")}
                        >
                          <Check size={15} strokeWidth={2.5} />
                          Terima Pesanan
                        </button>
                        <button
                          style={s.btnDanger}
                          onClick={() => onUpdateStatus(o.id, "ditolak")}
                        >
                          <X size={15} strokeWidth={2.5} />
                          Tolak
                        </button>
                      </>
                    )}
                    {o.status === "diproses" && (
                      <button
                        style={s.btnPrimary}
                        onClick={() => onUpdateStatus(o.id, "dikirim")}
                      >
                        <Truck size={15} strokeWidth={1.8} />
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

/* ── Styles ── */
const s = {
  /* Shell */
  shell: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 32px 80px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    WebkitFontSmoothing: "antialiased",
    boxSizing: "border-box",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 400,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "2.5px solid #E5E7EB",
    borderTopColor: "#1D1D1F",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  /* Top bar */
  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 16,
  },
  topBarTitle: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#1D1D1F",
    letterSpacing: "-0.02em",
    margin: 0,
    lineHeight: 1.2,
  },
  topBarSub: {
    fontSize: "0.84rem",
    color: "#6B7280",
    margin: "5px 0 0",
  },
  /* Notification */
  notifBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    border: "1.5px solid #E5E7EB",
    borderRadius: 10,
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
  },
  notifBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 99,
    background: "#EF4444",
    color: "#fff",
    fontSize: "0.66rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    border: "2px solid #fff",
  },
  notifDropdown: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: 360,
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    zIndex: 200,
    overflow: "hidden",
  },
  notifHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #F3F4F6",
  },
  notifHeaderTitle: {
    fontSize: "0.84rem",
    fontWeight: 700,
    color: "#1D1D1F",
  },
  notifClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9CA3AF",
    display: "flex",
    alignItems: "center",
    padding: 4,
  },
  notifEmpty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "28px 16px",
  },
  notifItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderBottom: "1px solid #F3F4F6",
    transition: "background 0.15s",
  },
  notifItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "#FAF4ED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifItemTitle: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#1D1D1F",
    margin: 0,
  },
  notifItemSub: {
    fontSize: "0.76rem",
    color: "#6B7280",
    margin: "2px 0 0",
  },
  notifActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#1D1D1F",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "6px 10px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  notifFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "12px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#5C381D",
    textDecoration: "none",
    borderTop: "1px solid #F3F4F6",
  },
  /* Action button */
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#1D1D1F",
    color: "#fff",
    textDecoration: "none",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  content: { width: "100%" },
  /* Alert card */
  alertCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#FEF3C7",
    border: "1px solid #FDE68A",
    borderRadius: 12,
    padding: "14px 18px",
  },
  alertTitle: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#92400E",
    margin: 0,
  },
  alertSub: {
    fontSize: "0.8rem",
    color: "#78350F",
    margin: "2px 0 0",
  },
  alertLink: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#92400E",
    textDecoration: "none",
    background: "rgba(255,255,255,0.6)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 8,
    padding: "7px 12px",
  },
  /* Stats grid */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  statCard: {
    borderRadius: 14,
    padding: "20px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    margin: 0,
  },
  statLabel: {
    fontSize: "0.78rem",
    fontWeight: 600,
    margin: 0,
    opacity: 0.75,
  },
  /* Two-col layout */
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1.6fr",
    gap: 16,
    alignItems: "start",
  },
  card: {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: "20px",
  },
  cardLabel: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "0 0 14px 0",
  },
  /* Store info */
  storeInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  storeAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: "#FAF4ED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  storeName: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1D1D1F",
    margin: 0,
    lineHeight: 1.3,
  },
  storeRating: {
    fontSize: "0.78rem",
    color: "#6B7280",
  },
  statusPillGreen: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#065F46",
    background: "#D1FAE5",
    borderRadius: 99,
    padding: "4px 10px",
    whiteSpace: "nowrap",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10B981",
    display: "inline-block",
  },
  storeMetaGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    paddingTop: 12,
    borderTop: "1px solid #F3F4F6",
  },
  storeMeta: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: "0.8rem",
    color: "#6B7280",
  },
  storeDesc: {
    fontSize: "0.82rem",
    color: "#6B7280",
    lineHeight: 1.6,
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #F3F4F6",
  },
  /* Sidebar recent orders */
  seeAllLink: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#5C381D",
    textDecoration: "none",
  },
  emptySmall: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 0",
  },
  orderRowSmall: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
  },
  orderStatusDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderCodeSmall: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#1D1D1F",
    margin: 0,
    lineHeight: 1.3,
  },
  orderBuyerSmall: {
    fontSize: "0.75rem",
    color: "#6B7280",
    margin: "2px 0 0",
  },
  orderAmtSmall: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#1D1D1F",
    margin: 0,
  },
  /* Table (Produk Tab) */
  tableWrap: {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.88rem",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #F3F4F6",
    background: "#FAFAFA",
  },
  td: {
    padding: "14px 16px",
    color: "#374151",
    verticalAlign: "middle",
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "#F3F4F6",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  productName: {
    fontWeight: 600,
    color: "#1D1D1F",
    margin: 0,
    fontSize: "0.9rem",
  },
  productUnit: {
    fontSize: "0.75rem",
    color: "#9CA3AF",
    margin: "2px 0 0",
  },
  categoryTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#F3F4F6",
    color: "#374151",
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: "0.78rem",
    fontWeight: 500,
  },
  priceText: {
    fontWeight: 700,
    color: "#1D1D1F",
    margin: 0,
  },
  stockText: {
    fontWeight: 600,
    margin: 0,
  },
  statusTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: "0.75rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    background: "#fff",
    color: "#374151",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  /* Filter tabs (Pesanan) */
  filterRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  filterTab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1.5px solid",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterCount: {
    borderRadius: 99,
    padding: "1px 6px",
    fontSize: "0.72rem",
    fontWeight: 700,
  },
  /* Order card */
  orderCard: {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
  },
  orderCardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #F3F4F6",
    background: "#FAFAFA",
  },
  orderStatusIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderCardCode: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#1D1D1F",
    margin: 0,
  },
  orderCardDate: {
    fontSize: "0.76rem",
    color: "#9CA3AF",
    margin: "2px 0 0",
  },
  orderCardBody: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr 1fr",
    gap: 0,
    padding: 0,
  },
  orderSection: {
    padding: "16px 20px",
    borderRight: "1px solid #F3F4F6",
  },
  orderSectionLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "0 0 8px 0",
  },
  orderBuyerName: {
    fontSize: "0.92rem",
    fontWeight: 700,
    color: "#1D1D1F",
    margin: 0,
  },
  orderAddress: {
    fontSize: "0.78rem",
    color: "#6B7280",
    margin: "4px 0 0",
    lineHeight: 1.5,
  },
  orderItemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "5px 8px",
    background: "#F9FAFB",
    borderRadius: 6,
  },
  costRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.82rem",
    color: "#6B7280",
  },
  costTotal: {
    marginTop: 6,
    paddingTop: 8,
    borderTop: "1px dashed #E5E7EB",
    fontWeight: 700,
    fontSize: "0.92rem",
    color: "#1D1D1F",
  },
  orderCardFoot: {
    display: "flex",
    gap: 10,
    padding: "14px 20px",
    borderTop: "1px solid #F3F4F6",
    background: "#FAFAFA",
  },
  /* Buttons */
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "#1D1D1F",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    padding: "10px 18px",
    fontSize: "0.86rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "#FEE2E2",
    color: "#991B1B",
    border: "none",
    borderRadius: 9,
    padding: "10px 18px",
    fontSize: "0.86rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  /* Empty states */
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "60px 24px",
    background: "#fff",
    border: "1px dashed #E5E7EB",
    borderRadius: 14,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#374151",
    margin: "8px 0 0",
  },
  emptySub: {
    fontSize: "0.84rem",
    color: "#9CA3AF",
    margin: "4px 0 12px",
    maxWidth: 320,
    lineHeight: 1.5,
  },
};
