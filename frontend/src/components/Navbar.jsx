import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import api from "../api.js";
import {
  MessageSquare, ShoppingCart, User, Store, Menu, X, LogOut,
  ChevronRight, Bell, ArrowLeft
} from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [menuOpen, setMenuOpen] = useState(false); // Profile dropdown (desktop)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu panel
  const [searchParams] = useSearchParams();
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const path = location.pathname;
  const isSellerMode = path.startsWith("/dashboard");
  
  const currentTab = searchParams.get("tab") || "toko";

  const isBerandaActive = isSellerMode
    ? (currentTab === "toko")
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
          setNewOrdersCount(res.data?.summary?.pesanan_baru || 0);
        })
        .catch(() => {});
    }
  }, [user, isSellerMode, path]);

  const closeAllMenus = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
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
          <Link to="/chat" className="navbar-icon-link desktop-only" title="Obrolan" onClick={closeAllMenus}>
            <MessageSquare size={20} />
          </Link>

          {isSellerMode ? (
            /* Icon Notifikasi Pesanan Masuk (Seller Mode) */
            <Link to="/dashboard?tab=pesanan" className="navbar-icon-link bell-icon-link" title="Pesanan Masuk" onClick={closeAllMenus}>
              <Bell size={20} />
              {newOrdersCount > 0 && <span className="navbar-cart-badge">{newOrdersCount}</span>}
            </Link>
          ) : (
            /* Icon Keranjang (Buyer Mode) */
            <Link to="/keranjang" className="navbar-icon-link cart-icon-link" title="Keranjang" onClick={closeAllMenus}>
              <ShoppingCart size={20} />
              {count > 0 && <span className="navbar-cart-badge">{count}</span>}
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
                  <Link
                    to={isSellerMode ? "/dashboard?tab=pesanan" : "/pesanan"}
                    className="navbar-dropdown-item"
                    onClick={closeAllMenus}
                  >
                    {isSellerMode ? "Pesanan Masuk" : "Riwayat Pesanan"}
                  </Link>
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
    </header>
  );
}