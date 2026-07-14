import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import api from "../api.js";
import {
  MessageSquare, ShoppingCart, User, Store, Menu, X, LogOut,
  ChevronRight, Bell, ArrowLeft, Check, ShoppingBag, ArrowRight
} from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState([]);

  const path = location.pathname;
  const isSellerMode = path.startsWith("/dashboard");

  const currentTab = searchParams.get("tab") || "beranda";

  const isBerandaActive = isSellerMode
    ? (currentTab === "beranda" || currentTab === "toko")
    : (path === "/");
    
  const isProdukActive = isSellerMode
    ? (currentTab === "produk" || path.startsWith("/dashboard/tambah-produk") || path.includes("/edit"))
    : path.startsWith("/produk");
    
  const isPesananActive = isSellerMode
    ? (currentTab === "pesanan")
    : path.startsWith("/pesanan");

  useEffect(() => {
    if (user && isSellerMode) {
      api.get("/seller/dashboard")
        .then((res) => {
          const pending = (res.data?.orders || []).filter(
            (o) => o.status === "dikemas" || o.status === "belum_bayar" || o.status === "menunggu_konfirmasi"
          );
          setPendingOrders(pending);
          setNewOrdersCount(pending.length);
        })
        .catch(() => {});
    }
  }, [user, isSellerMode, path]);

  useEffect(() => {
    if (notifOpen && isSellerMode) {
      document.body.classList.add("notif-active");
    } else {
      document.body.classList.remove("notif-active");
    }
    return () => {
      document.body.classList.remove("notif-active");
    };
  }, [notifOpen, isSellerMode]);

  useEffect(() => {
    setNotifOpen(false);
  }, [path]);

  const closeAllMenus = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="navbar-header">
      <div className="navbar-inner">
        {/* Left: Logo Qlapa (with Hub badge if in seller mode) */}
        <Link to={isSellerMode ? "/dashboard" : "/"} className="navbar-logo-link" onClick={closeAllMenus}>
          <img
            src="/assets/qlapa-logo.png"
            alt="Qlapa"
            className="navbar-logo-img"
          />
          {isSellerMode && (
            <span className="navbar-hub-badge-inline">Hub</span>
          )}
        </Link>

        {/* Tengah: menu dalam glass capsule (Desktop Only) */}
        <nav className="navbar-capsule desktop-only">
          <Link
            to={isSellerMode ? "/dashboard?tab=toko" : "/"}
            className={`navbar-menu-item ${isBerandaActive ? "active" : ""}`}
            onClick={closeAllMenus}
          >
            Beranda
          </Link>
          <Link
            to={isSellerMode ? "/dashboard?tab=produk" : "/produk"}
            className={`navbar-menu-item ${isProdukActive ? "active" : ""}`}
            onClick={closeAllMenus}
          >
            {isSellerMode ? "Produk Saya" : "Produk"}
          </Link>
          <Link
            to={isSellerMode ? "/dashboard?tab=pesanan" : "/pesanan"}
            className={`navbar-menu-item ${isPesananActive ? "active" : ""}`}
            onClick={closeAllMenus}
          >
            {isSellerMode ? "Pemesanan" : "Pesanan"}
          </Link>
        </nav>

        {/* Kanan: tombol Toko Saya/Ke Pasar, lalu icon Chat, Keranjang/Notifikasi, dan Profil */}
        <div className="navbar-actions">
          {isSellerMode ? (
            /* Button Ke Pasar (Seller Mode) */
            <Link to="/" className="ke-pasar-btn desktop-only" onClick={closeAllMenus}>
              <ArrowLeft size={16} />
              <span>Ke Pasar</span>
            </Link>
          ) : (
            /* Tombol Toko Saya (Buyer Mode) */
            <Link to={user?.is_seller ? "/dashboard" : "/toko/buka"} className="toko-saya-btn desktop-only" onClick={closeAllMenus}>
              <Store size={16} />
              <span>Toko Saya</span>
            </Link>
          )}

          {/* Icon Chat (Desktop Only) */}
          <Link
            to={user ? "/chat" : "/masuk"}
            className="navbar-icon-link desktop-only"
            title="Obrolan"
            onClick={closeAllMenus}
          >
            <MessageSquare size={20} />
          </Link>

          {isSellerMode ? (
            /* Bell notif (Seller Mode) */
            <button
              className="navbar-icon-link bell-icon-link desktop-only"
              title="Notifikasi Pesanan"
              onClick={() => { setNotifOpen((o) => !o); setMenuOpen(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <Bell size={20} />
              {newOrdersCount > 0 && <span className="navbar-cart-badge">{newOrdersCount}</span>}
            </button>
          ) : user ? (
            /* Icon Keranjang (Buyer Mode, hanya jika login) */
            <Link to="/keranjang" className="navbar-icon-link cart-icon-link" title="Keranjang" onClick={closeAllMenus}>
              <ShoppingCart size={20} />
              {count > 0 && <span className="navbar-cart-badge">{count}</span>}
            </Link>
          ) : (
            /* Belum login: klik keranjang → redirect ke login */
            <Link to="/masuk" className="navbar-icon-link cart-icon-link" title="Masuk untuk melihat keranjang" onClick={closeAllMenus}>
              <ShoppingCart size={20} />
            </Link>
          )}

          {/* Profil / Auth (Desktop Only) */}
          {!user && (
            <div className="navbar-auth-buttons desktop-only">
              <Link to="/masuk" className="navbar-auth-btn btn-login" onClick={closeAllMenus}>
                Masuk
              </Link>
            </div>
          )}

          {user && (
            <div className="navbar-profile-menu desktop-only">
              <button
                className="navbar-profile-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                title="Profil"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profil"
                    className="navbar-avatar-img"
                  />
                ) : (
                  <User size={20} />
                )}
              </button>
              {menuOpen && (
                <div
                  className="navbar-dropdown"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    to="/profil"
                    className="navbar-dropdown-item"
                    onClick={closeAllMenus}
                  >
                    Profil Saya
                  </Link>
                  {isSellerMode ? (
                    <Link
                      to="/"
                      className="navbar-dropdown-item"
                      onClick={closeAllMenus}
                    >
                      Mode Pembeli (Ke Pasar)
                    </Link>
                  ) : (
                    <Link
                      to={user.is_seller ? "/dashboard" : "/toko/buka"}
                      className="navbar-dropdown-item"
                      onClick={closeAllMenus}
                    >
                      {user.is_seller ? "Dashboard Toko" : "Buka Toko"}
                    </Link>
                  )}

                  <button
                    className="navbar-dropdown-item logout-btn"
                    onClick={() => {
                      logout();
                      closeAllMenus();
                      navigate("/");
                    }}
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bell notif (Mobile Only — navigasi ke halaman pesanan) */}
          {isSellerMode && (
            <button
              className="navbar-icon-link mobile-only"
              title="Notifikasi Pesanan"
              onClick={() => { navigate("/notifikasi"); setMobileMenuOpen(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative" }}
            >
              <Bell size={22} />
              {newOrdersCount > 0 && <span className="navbar-cart-badge">{newOrdersCount}</span>}
            </button>
          )}

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className="navbar-hamburger-btn mobile-only"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel (Mobile Only) */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-panel">
          <nav className="navbar-mobile-nav">
             <Link
              to={isSellerMode ? "/dashboard?tab=toko" : "/"}
              className={`navbar-mobile-item ${isBerandaActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              <span>Beranda {isSellerMode && "Toko"}</span>
              <ChevronRight size={16} />
            </Link>
            <Link
              to={isSellerMode ? "/dashboard?tab=produk" : "/produk"}
              className={`navbar-mobile-item ${isProdukActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              <span>{isSellerMode ? "Produk Saya" : "Produk"}</span>
              <ChevronRight size={16} />
            </Link>
            <Link
              to={isSellerMode ? "/dashboard?tab=pesanan" : "/pesanan"}
              className={`navbar-mobile-item ${isPesananActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              <span>{isSellerMode ? "Pemesanan" : "Pesanan"}</span>
              <ChevronRight size={16} />
            </Link>
            <Link
              to="/chat"
              className="navbar-mobile-item"
              onClick={closeAllMenus}
            >
              <span>Chat Obrolan</span>
              <ChevronRight size={16} />
            </Link>
            {isSellerMode ? (
              <Link
                to="/"
                className="navbar-mobile-item"
                style={{ color: "var(--brown-500)" }}
                onClick={closeAllMenus}
              >
                <span>Mode Pembeli (Ke Pasar)</span>
                <ArrowLeft size={16} />
              </Link>
            ) : (
              <Link
                to={user?.is_seller ? "/dashboard" : "/toko/buka"}
                className="navbar-mobile-item"
                onClick={closeAllMenus}
              >
                <span>Toko Saya</span>
                <ChevronRight size={16} />
              </Link>
            )}
            
            <div className="navbar-mobile-divider"></div>

            {/* Profile / Auth inside mobile menu */}
            {!user ? (
              <div className="navbar-mobile-auth">
                <Link to="/masuk" className="navbar-auth-btn btn-login" onClick={closeAllMenus}>
                  Masuk
                </Link>
              </div>
            ) : (
              <div className="navbar-mobile-profile">
                <div className="navbar-mobile-userinfo">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Profil" className="navbar-avatar-img" />
                  ) : (
                    <div className="navbar-avatar-placeholder"><User size={18} /></div>
                  )}
                  <span className="navbar-mobile-username">{user.name}</span>
                </div>
                
                <Link to="/profil" className="navbar-mobile-item" onClick={closeAllMenus}>
                  <span>Profil Saya</span>
                  <ChevronRight size={16} />
                </Link>
                {isSellerMode ? (
                  <Link to="/" className="navbar-mobile-item" onClick={closeAllMenus}>
                    <span>Mode Pembeli (Ke Pasar)</span>
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <Link to={user.is_seller ? "/dashboard" : "/toko/buka"} className="navbar-mobile-item" onClick={closeAllMenus}>
                    <span>{user.is_seller ? "Dashboard Toko" : "Buka Toko"}</span>
                    <ChevronRight size={16} />
                  </Link>
                )}
                <button
                  className="navbar-mobile-item logout-btn"
                  onClick={() => {
                    logout();
                    closeAllMenus();
                    navigate("/");
                  }}
                >
                  <span>Keluar</span>
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Slide-in Notifications Overlay */}
      {isSellerMode && (
        <div
          className={`dashboard-notif-overlay ${notifOpen ? "active" : ""}`}
          onClick={() => setNotifOpen(false)}
        />
      )}

      {/* Slide-in Notifications Panel */}
      {isSellerMode && (
        <div className={`dashboard-notif-panel ${notifOpen ? "open" : ""}`}>
          <div className="dashboard-notif-header">
            <h2>Notifikasi</h2>
            <button type="button" className="dashboard-notif-close" onClick={() => setNotifOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="dashboard-notif-body">
            {pendingOrders.length === 0 ? (
              <div className="dashboard-notif-empty" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "80px 24px", color: "var(--ink-soft)", textAlign: "center" }}>
                <Bell size={36} strokeWidth={1.3} color="rgba(45, 106, 79, 0.4)" />
                <p style={{ margin: 0, fontSize: "0.9rem" }}>Tidak ada notifikasi baru.</p>
              </div>
            ) : (
              pendingOrders.map((o) => (
                <div
                  key={o.id}
                  className="dashboard-notif-item"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate("/dashboard?tab=pesanan");
                  }}
                >
                  <div className="dashboard-notif-icon">
                    <ShoppingBag size={16} />
                  </div>
                  <div className="dashboard-notif-content">
                    <div className="dashboard-notif-title">
                      {o.status === "dikemas" ? "Pesanan Baru Masuk" : "Menunggu Pembayaran"}
                    </div>
                    <p className="dashboard-notif-desc">
                      {o.buyer_name} membeli produk senilai <strong>{(o.total || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}</strong>
                    </p>
                    <span className="dashboard-notif-time">
                      {`ORD-${new Date(o.created_at).toLocaleDateString("id-ID", { day:"2-digit", month:"2-digit", year:"2-digit" }).replace(/\//g,"")}-${String(o.id).padStart(3,"0")}`} · {new Date(o.created_at).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ── Notif dropdown styles ── */
const dropdownStyles = {
  wrap: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: 320,
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    zIndex: 500,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "13px 16px",
    borderBottom: "1px solid #F3F4F6",
  },
  title: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#1D1D1F",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9CA3AF",
    display: "flex",
    alignItems: "center",
    padding: 4,
    borderRadius: 6,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 16px",
    borderBottom: "1px solid #F9FAFB",
    transition: "background 0.15s",
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#FAF4ED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemCode: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#1D1D1F",
    margin: 0,
    lineHeight: 1.3,
  },
  itemSub: {
    fontSize: "0.73rem",
    color: "#6B7280",
    margin: "2px 0 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "11px 16px",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#5C381D",
    textDecoration: "none",
    borderTop: "1px solid #F3F4F6",
  },
};