import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="empty-state" style={{ padding: "100px 24px" }}>
      <div style={{ fontSize: "2.4rem" }}>🥥</div>
      <h2 style={{ marginTop: 12 }}>Halaman tidak ditemukan</h2>
      <p style={{ marginTop: 8 }}>Sepertinya kamu tersesat di kebun kelapa.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 18 }}>Kembali ke Beranda</Link>
    </div>
  );
}
