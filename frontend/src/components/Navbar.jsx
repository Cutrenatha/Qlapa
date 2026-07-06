import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <img
            src="/assets/qlapa-logo.png"
            alt="Qlapa"
            style={styles.logoImg}
          />
        </Link>

        <div style={styles.actions}>
          <button
            style={styles.iconBtn}
            onClick={() => navigate("/keranjang")}
            title="Keranjang"
          >
            🛒
            {count > 0 && <span style={styles.badge}>{count}</span>}
          </button>

          {!user && (
            <>
              <Link to="/masuk" className="btn btn-outline btn-sm">
                Masuk
              </Link>
              <Link to="/daftar" className="btn btn-primary btn-sm">
                Daftar
              </Link>
            </>
          )}

          {user && (
            <div style={styles.profileMenu}>
              <button
                style={styles.profileBtn}
                onClick={() => setMenuOpen((o) => !o)}
                title="Profil"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Profil" style={styles.avatarImg} />
                ) : (
                  "👤"
                )}
              </button>
              {menuOpen && (
                <div
                  style={styles.dropdown}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    to="/profil"
                    style={styles.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    Profil Saya
                  </Link>
                  <Link
                    to="/dashboard"
                    style={styles.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    {user.is_seller ? "Dashboard Toko" : "Buka Toko"}
                  </Link>
                  <Link
                    to="/pesanan"
                    style={styles.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    Riwayat Pesanan
                  </Link>
                  <button
                    style={{
                      ...styles.dropdownItem,
                      width: "100%",
                      textAlign: "left",
                      color: "#B4472F",
                    }}
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "var(--cream)",
    borderBottom: "1px solid var(--line)",
    paddingTop: "8px",
    paddingBottom: "8px",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "0 24px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  logoImg: {
    height: 32,
    width: "auto",
    display: "block",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  iconBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    position: "relative",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    background: "var(--brown-700)",
    color: "#fff",
    borderRadius: "50%",
    fontSize: "0.65rem",
    width: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  profileMenu: {
    position: "relative",
  },
  profileBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    objectFit: "cover",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius-sm)",
    boxShadow: "var(--shadow-md)",
    minWidth: 190,
    padding: 6,
    display: "flex",
    flexDirection: "column",
  },
  dropdownItem: {
    padding: "10px 12px",
    borderRadius: 6,
    fontSize: "0.88rem",
    background: "transparent",
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
};
