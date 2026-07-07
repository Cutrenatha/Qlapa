import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { MessageSquare, ShoppingCart, User, Store, Menu, X, LogOut, ChevronRight } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [menuOpen, setMenuOpen] = useState(false); // Profile dropdown (desktop)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu panel

  const path = location.pathname;
  const isBerandaActive = path === "/";
  const isProdukActive = path.startsWith("/produk");
  const isPesananActive = path.startsWith("/pesanan");

  const closeAllMenus = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-inner">
        {/* Left: Logo Qlapa */}
        <Link to="/" className="navbar-logo-link" onClick={closeAllMenus}>
          <img
            src="/assets/qlapa-logo.png"
            alt="Qlapa"
            className="navbar-logo-img"
          />
        </Link>

        {/* Tengah: menu dalam glass capsule (Desktop Only) */}
        <nav className="navbar-capsule desktop-only">
          <Link
            to="/"
            className={`navbar-menu-item ${isBerandaActive ? "active" : ""}`}
          >
            Beranda
          </Link>
          <Link
            to="/produk"
            className={`navbar-menu-item ${isProdukActive ? "active" : ""}`}
          >
            Produk
          </Link>
          <Link
            to="/pesanan"
            className={`navbar-menu-item ${isPesananActive ? "active" : ""}`}
          >
            Pesanan
          </Link>
        </nav>

        {/* Kanan: tombol Toko Saya, lalu icon Chat, Keranjang, dan Profil */}
        <div className="navbar-actions">
          {/* Tombol Toko Saya (Desktop Only) */}
          <Link to="/dashboard" className="toko-saya-btn desktop-only" onClick={closeAllMenus}>
            <Store size={16} />
            <span>Toko Saya</span>
          </Link>

          {/* Icon Chat (Desktop Only) */}
          <Link to="/chat" className="navbar-icon-link desktop-only" title="Obrolan" onClick={closeAllMenus}>
            <MessageSquare size={20} />
          </Link>

          {/* Icon Keranjang (Selalu ada di Mobile & Desktop) */}
          <Link to="/keranjang" className="navbar-icon-link cart-icon-link" title="Keranjang" onClick={closeAllMenus}>
            <ShoppingCart size={20} />
            {count > 0 && <span className="navbar-cart-badge">{count}</span>}
          </Link>

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
                  <Link
                    to="/dashboard"
                    className="navbar-dropdown-item"
                    onClick={closeAllMenus}
                  >
                    {user.is_seller ? "Dashboard Toko" : "Buka Toko"}
                  </Link>
                  <Link
                    to="/pesanan"
                    className="navbar-dropdown-item"
                    onClick={closeAllMenus}
                  >
                    Riwayat Pesanan
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
              to="/"
              className={`navbar-mobile-item ${isBerandaActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              <span>Beranda</span>
              <ChevronRight size={16} />
            </Link>
            <Link
              to="/produk"
              className={`navbar-mobile-item ${isProdukActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              <span>Produk</span>
              <ChevronRight size={16} />
            </Link>
            <Link
              to="/pesanan"
              className={`navbar-mobile-item ${isPesananActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              <span>Pesanan</span>
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
            <Link
              to="/dashboard"
              className="navbar-mobile-item"
              onClick={closeAllMenus}
            >
              <span>Toko Saya</span>
              <ChevronRight size={16} />
            </Link>
            
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
                <Link to="/dashboard" className="navbar-mobile-item" onClick={closeAllMenus}>
                  <span>{user.is_seller ? "Dashboard Toko" : "Buka Toko"}</span>
                  <ChevronRight size={16} />
                </Link>
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