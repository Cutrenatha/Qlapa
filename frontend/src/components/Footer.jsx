import React from "react";
import { Link } from "react-router-dom";

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function IconYoutube() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.93 12a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 4 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.1a16 16 0 0 0 6.72 6.72l1.06-1.07a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div className="container" style={s.inner}>

        {/* Column 1 — Brand */}
        <div style={s.brand}>
          <img src="/assets/qlapa-logo.png" alt="Qlapa" style={s.logo} />
          <p style={s.tagline}>
            Pasar limbah kelapa berbasis AI untuk mendukung ekonomi sirkular Indonesia.
            Hemat biaya produksi, bantu selamatkan bumi.
          </p>
          <div style={s.socials}>
            <a href="#" style={s.social} aria-label="Facebook"><IconFacebook /></a>
            <a href="#" style={s.social} aria-label="Instagram"><IconInstagram /></a>
            <a href="#" style={s.social} aria-label="Youtube"><IconYoutube /></a>
          </div>
        </div>

        {/* Column 2 — Platform */}
        <div>
          <div style={s.colTitle}>Platform</div>
          <Link to="/produk" style={s.link}>Cari Produk</Link>
          <Link to="/toko/buka" style={s.link}>Jadi Penjual</Link>
          <Link to="/masuk" style={s.link}>Qlapa AI</Link>
        </div>

        {/* Column 3 — Informasi */}
        <div>
          <div style={s.colTitle}>Informasi</div>
          <Link to="/profil" style={s.link}>Akun Saya</Link>
          <Link to="/keranjang" style={s.link}>Keranjang Anda</Link>
          <Link to="/pesanan" style={s.link}>Pesanan Saya</Link>
          <a href="#faq" style={s.link}>FAQ</a>
        </div>

        {/* Column 4 — Hubungi Kami */}
        <div>
          <div style={s.colTitle}>Hubungi Kami</div>
          <div style={s.contactRow}>
            <span style={s.contactIcon}><IconPhone /></span>
            <span>+62 812 3456 7890</span>
          </div>
          <div style={s.contactRow}>
            <span style={s.contactIcon}><IconMail /></span>
            <span>hello@qlapa.id</span>
          </div>
        </div>

        {/* Mascot
        <div style={s.mascotWrap}>
          <img src="/assets/mascot.jpg" alt="Qlapa Bot" style={s.mascot} />
        </div> */}

      </div>

      {/* Bottom bar */}
      <div style={s.bottom}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span>© 2026 Qlapa — Sisa kelapa, bernilai lebih.</span>
          <span style={{ opacity: 0.5 }}>Made with 🌿 for circular economy</span>
        </div>
      </div>
    </footer>
  );
}

const s = {
  footer: {
    marginTop: "auto",
    background: "#1a2e1e",
    color: "rgba(255,255,255,0.82)",
    paddingTop: 30,
  },
  inner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 20,
    paddingBottom: 20,
  },
  brand: {
    maxWidth: 220,
  },
  logo: {
    height: 32,
    width: "auto",
    filter: "brightness(0) invert(1)",
    opacity: 0.9,
    marginBottom: 8,
  },
  tagline: {
    fontSize: "0.82rem",
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.6)",
    margin: 0,
    marginBottom: 10,
  },
  socials: {
    display: "flex",
    gap: 12,
  },
  social: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.8)",
    textDecoration: "none",
    transition: "background 0.2s",
  },
  colTitle: {
    fontWeight: 700,
    fontSize: "0.85rem",
    color: "#fff",
    marginBottom: 10,
    letterSpacing: "0.02em",
  },
  link: {
    display: "block",
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.6)",
    textDecoration: "none",
    marginBottom: 6,
    transition: "color 0.2s",
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  contactIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    flexShrink: 0,
    color: "rgba(255,255,255,0.7)",
  },
  mascotWrap: {
    display: "flex",
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  mascot: {
    height: 100,
    width: 100,
    objectFit: "cover",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.12)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  bottom: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "12px 0",
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.5)",
  },
};
