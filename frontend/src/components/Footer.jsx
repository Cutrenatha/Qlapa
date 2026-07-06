import React from "react";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.inner}>
        <div>
          <img src="/assets/qlapa-logo.png" alt="Qlapa" style={styles.logoImg} />
          <p style={{ maxWidth: 320, marginTop: 12 }}>
            Marketplace berbasis AI untuk pemanfaatan limbah kelapa dalam mendukung ekonomi sirkular Indonesia.
          </p>
        </div>
        <div className="row gap-24" style={{ fontSize: "0.85rem" }}>
          <div>
            <div style={styles.col}>Platform</div>
            <div style={styles.link}>Cari Produk</div>
            <div style={styles.link}>Jadi Penjual</div>
            <div style={styles.link}>Qlapa AI</div>
          </div>
          <div>
            <div style={styles.col}>Tentang</div>
            <div style={styles.link}>Ekonomi Sirkular</div>
            <div style={styles.link}>Dampak Lingkungan</div>
          </div>
        </div>
      </div>
      <div style={styles.bottom}>
        © 2026 Qlapa — Sisa kelapa, bernilai lebih.
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    marginTop: "auto",
    background: "var(--green-900)",
    color: "var(--cream)",
    paddingTop: 48,
  },
  inner: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 32,
    paddingBottom: 32,
  },
  logoImg: { height: 40, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.92 },
  col: { fontWeight: 700, marginBottom: 10, opacity: 0.9 },
  link: { opacity: 0.7, marginBottom: 8, cursor: "pointer" },
  bottom: {
    borderTop: "1px solid rgba(255,255,255,0.12)",
    textAlign: "center",
    padding: "16px 0",
    fontSize: "0.8rem",
    opacity: 0.65,
  },
};
