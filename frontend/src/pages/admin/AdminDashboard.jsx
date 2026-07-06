import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminApi } from "../../context/AdminAuthContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const STATUS_LABEL = {
  menunggu_konfirmasi: "Menunggu Diproses",
  diproses: "Dikemas",
  dikirim: "Dikirim",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

function formatRp(n) {
  return `Rp${Math.round(n || 0).toLocaleString("id-ID")}`;
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

async function downloadCsv(kind) {
  const res = await adminApi.get(`/admin/export/${kind}.csv`, { responseType: "blob" });
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
  { key: "ringkasan", label: "Ringkasan", icon: "📊" },
  { key: "penjual", label: "Penjual & Toko", icon: "🏪" },
  { key: "produk", label: "Produk", icon: "📦" },
  { key: "pesanan", label: "Pesanan", icon: "🧾" },
  { key: "pengguna", label: "Pengguna", icon: "👥" },
];

export default function AdminDashboard() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "ringkasan";
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sideHead}>
          <span style={styles.logoDot}>Q</span>
          <div>
            <div style={styles.brand}>Qlapa</div>
            <div style={styles.brandSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={{ marginTop: 24, flex: 1 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setParams({ tab: t.key })}
              style={{
                ...styles.navItem,
                ...(tab === t.key ? styles.navItemActive : null),
              }}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div style={styles.sideFoot}>
          <div style={{ fontSize: "0.8rem", color: "rgba(251,247,239,0.7)" }}>
            Masuk sebagai
          </div>
          <div style={{ fontWeight: 700, color: "var(--cream)" }}>{admin?.name}</div>
          <button
            style={styles.logoutBtn}
            onClick={() => {
              logout();
              navigate("/admin/login", { replace: true });
            }}
          >
            Keluar
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        {tab === "ringkasan" && <Ringkasan />}
        {tab === "penjual" && <PenjualTab />}
        {tab === "produk" && <ProdukTab />}
        {tab === "pesanan" && <PesananTab />}
        {tab === "pengguna" && <PenggunaTab />}
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="empty-state">
      <div className="spinner" style={{ margin: "0 auto" }} />
    </div>
  );
}

function ExportButton({ kind, label }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn-outline btn-sm"
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
      {busy ? "Menyiapkan…" : `⬇ ${label}`}
    </button>
  );
}

/* ------------------------------ Ringkasan ------------------------------ */
function Ringkasan() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.get("/admin/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) return <Loading />;
  const { summary, status_counts, top_sellers, recent_orders } = data;

  const cards = [
    { label: "Total Pengguna", value: summary.total_users },
    { label: "Total Penjual", value: summary.total_sellers },
    { label: "Total Pembeli", value: summary.total_buyers },
    { label: "Total Produk", value: summary.total_products },
    { label: "Total Pesanan", value: summary.total_orders },
    { label: "Total Pendapatan (selesai)", value: formatRp(summary.total_revenue) },
  ];

  return (
    <div>
      <PageHeader
        title="Ringkasan Platform"
        subtitle="Ikhtisar penjualan, toko, dan aktivitas Qlapa secara keseluruhan"
      />

      <div style={styles.cardGrid}>
        {cards.map((c) => (
          <div key={c.label} className="card" style={styles.statCard}>
            <div style={styles.statValue}>{c.value}</div>
            <div style={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.twoCol}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={styles.sectionTitle}>Status Pesanan</h3>
          {Object.keys(status_counts).length === 0 && (
            <p style={{ fontSize: "0.85rem" }}>Belum ada pesanan.</p>
          )}
          {Object.entries(status_counts).map(([status, count]) => (
            <div key={status} className="row between" style={styles.statusRow}>
              <span>{STATUS_LABEL[status] || status}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={styles.sectionTitle}>Top Penjual (Pendapatan)</h3>
          {top_sellers.length === 0 && (
            <p style={{ fontSize: "0.85rem" }}>Belum ada data penjual.</p>
          )}
          {top_sellers.map((s, i) => (
            <div key={s.id} className="row between" style={styles.statusRow}>
              <span>
                {i + 1}. {s.store_name}{" "}
                <span style={{ color: "var(--ink-soft)", fontSize: "0.78rem" }}>
                  ({s.product_count} produk)
                </span>
              </span>
              <strong>{formatRp(s.revenue)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="row between" style={{ margin: "24px 0 12px" }}>
        <h3 style={styles.sectionTitle}>Pesanan Terbaru</h3>
      </div>
      <div className="card" style={{ overflow: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Pembeli</th>
              <th style={styles.th}>Penjual</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {recent_orders.map((o) => (
              <tr key={o.id}>
                <td style={styles.td}>#{o.id}</td>
                <td style={styles.td}>{o.buyer_name}</td>
                <td style={styles.td}>{o.seller_store}</td>
                <td style={styles.td}>{formatRp(o.total)}</td>
                <td style={styles.td}>{STATUS_LABEL[o.status] || o.status}</td>
                <td style={styles.td}>{formatDate(o.created_at)}</td>
              </tr>
            ))}
            {recent_orders.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={6}>
                  Belum ada pesanan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------- Penjual -------------------------------- */
function PenjualTab() {
  const [sellers, setSellers] = useState(null);

  useEffect(() => {
    adminApi.get("/admin/sellers").then((res) => setSellers(res.data));
  }, []);

  if (!sellers) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Penjual & Toko"
        subtitle="Semua toko yang aktif di Qlapa"
        actions={<ExportButton kind="sellers" label="Export CSV" />}
      />
      <div className="card" style={{ overflow: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Toko</th>
              <th style={styles.th}>Pemilik</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Lokasi</th>
              <th style={styles.th}>Produk</th>
              <th style={styles.th}>Pesanan</th>
              <th style={styles.th}>Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>
                  <div className="row gap-8" style={{ alignItems: "center" }}>
                    <div style={styles.avatarSm}>
                      {s.store_image_url ? (
                        <img src={s.store_image_url} style={styles.avatarImg} />
                      ) : (
                        "🥥"
                      )}
                    </div>
                    {s.store_name || s.name}
                  </div>
                </td>
                <td style={styles.td}>{s.name}</td>
                <td style={styles.td}>{s.email}</td>
                <td style={styles.td}>{s.store_location || "-"}</td>
                <td style={styles.td}>{s.product_count}</td>
                <td style={styles.td}>{s.order_count}</td>
                <td style={styles.td}>{formatRp(s.revenue)}</td>
              </tr>
            ))}
            {sellers.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={7}>
                  Belum ada toko.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------- Produk --------------------------------- */
function ProdukTab() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    adminApi.get("/admin/products").then((res) => setProducts(res.data));
  }, []);

  if (!products) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Semua Produk"
        subtitle="Produk dari seluruh toko di Qlapa"
        actions={<ExportButton kind="products" label="Export CSV" />}
      />
      <div className="card" style={{ overflow: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Produk</th>
              <th style={styles.th}>Kategori</th>
              <th style={styles.th}>Harga</th>
              <th style={styles.th}>Stok</th>
              <th style={styles.th}>Penjual</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={styles.td}>
                  <div className="row gap-8" style={{ alignItems: "center" }}>
                    <div style={styles.avatarSm}>
                      {p.image_url ? (
                        <img src={p.image_url} style={styles.avatarImg} />
                      ) : (
                        "🥥"
                      )}
                    </div>
                    {p.name}
                  </div>
                </td>
                <td style={styles.td}>{p.category}</td>
                <td style={styles.td}>
                  {formatRp(p.price)}/{p.unit}
                </td>
                <td style={styles.td}>
                  {p.stock} {p.unit}
                </td>
                <td style={styles.td}>{p.seller?.store_name || "-"}</td>
                <td style={styles.td}>
                  <span
                    className={`badge ${p.status === "active" ? "" : "badge-outline"}`}
                  >
                    {p.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={6}>
                  Belum ada produk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------- Pesanan --------------------------------- */
function PesananTab() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    adminApi.get("/admin/orders").then((res) => setOrders(res.data));
  }, []);

  if (!orders) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Semua Pesanan"
        subtitle="Riwayat transaksi seluruh toko"
        actions={<ExportButton kind="orders" label="Export CSV" />}
      />
      <div className="card" style={{ overflow: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Pembeli</th>
              <th style={styles.th}>Penjual</th>
              <th style={styles.th}>Item</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={styles.td}>#{o.id}</td>
                <td style={styles.td}>{o.buyer_name}</td>
                <td style={styles.td}>{o.seller_store}</td>
                <td style={styles.td}>{o.items.length} produk</td>
                <td style={styles.td}>{formatRp(o.total)}</td>
                <td style={styles.td}>{STATUS_LABEL[o.status] || o.status}</td>
                <td style={styles.td}>{formatDate(o.created_at)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={7}>
                  Belum ada pesanan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------- Pengguna --------------------------------- */
function PenggunaTab() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    adminApi.get("/admin/users").then((res) => setUsers(res.data));
  }, []);

  if (!users) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Semua Pengguna"
        subtitle="Seluruh akun yang terdaftar di Qlapa"
        actions={<ExportButton kind="users" label="Export CSV" />}
      />
      <div className="card" style={{ overflow: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nama</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Telepon</th>
              <th style={styles.th}>Peran</th>
              <th style={styles.th}>Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={styles.td}>
                  <div className="row gap-8" style={{ alignItems: "center" }}>
                    <div style={styles.avatarSm}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} style={styles.avatarImg} />
                      ) : (
                        "👤"
                      )}
                    </div>
                    {u.name}
                  </div>
                </td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{u.phone || "-"}</td>
                <td style={styles.td}>
                  {u.is_admin ? (
                    <span className="badge badge-brown">Admin</span>
                  ) : u.is_seller ? (
                    <span className="badge">Penjual</span>
                  ) : (
                    <span className="badge badge-outline">Pembeli</span>
                  )}
                </td>
                <td style={styles.td}>{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={5}>
                  Belum ada pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="row between" style={{ marginBottom: 20, alignItems: "flex-start" }}>
      <div>
        <h1 style={{ fontSize: "1.4rem", marginBottom: 4 }}>{title}</h1>
        <p style={{ fontSize: "0.88rem" }}>{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh", background: "var(--cream)" },
  sidebar: {
    width: 230,
    flexShrink: 0,
    background: "var(--green-900)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  sideHead: { display: "flex", alignItems: "center", gap: 10, padding: "0 6px" },
  logoDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "var(--brown-300)",
    color: "var(--brown-800)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    flexShrink: 0,
  },
  brand: { color: "var(--cream)", fontWeight: 700, fontFamily: "var(--font-display)" },
  brandSub: { color: "rgba(251,247,239,0.7)", fontSize: "0.72rem" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "11px 12px",
    borderRadius: 10,
    background: "transparent",
    border: "none",
    color: "rgba(251,247,239,0.82)",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    marginBottom: 4,
  },
  navItemActive: {
    background: "rgba(251,247,239,0.14)",
    color: "var(--cream)",
  },
  sideFoot: {
    borderTop: "1px solid rgba(251,247,239,0.15)",
    paddingTop: 14,
    marginTop: 14,
  },
  logoutBtn: {
    marginTop: 10,
    width: "100%",
    background: "rgba(251,247,239,0.12)",
    border: "none",
    color: "var(--cream)",
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  main: { flex: 1, padding: "28px 32px", minWidth: 0, overflowX: "auto" },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 22,
  },
  statCard: { padding: 16 },
  statValue: {
    fontFamily: "var(--font-display)",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--green-800)",
  },
  statLabel: { fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 4 },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  sectionTitle: { fontSize: "1rem", marginBottom: 12 },
  statusRow: {
    padding: "8px 0",
    borderBottom: "1px solid var(--line)",
    fontSize: "0.88rem",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 640 },
  th: {
    textAlign: "left",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: "var(--ink-soft)",
    padding: "12px 14px",
    borderBottom: "1px solid var(--line)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 14px",
    fontSize: "0.86rem",
    borderBottom: "1px solid var(--line)",
    whiteSpace: "nowrap",
  },
  avatarSm: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "var(--cream-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    fontSize: "0.9rem",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
};
