import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminLogin() {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Gagal masuk sebagai admin"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.logoDot}>Q</span>
          <div>
            <div style={styles.brandName}>Qlapa Admin</div>
            <div style={styles.brandSub}>Panel administrator</div>
          </div>
        </div>

        <form onSubmit={submit} style={{ marginTop: 24 }}>
          <div className="field">
            <label>Email Admin</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@qlapa.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="field-error" style={{ marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Memeriksa…" : "Masuk sebagai Admin"}
          </button>
        </form>
        <p style={styles.footNote}>
          Halaman ini khusus administrator Qlapa dan terpisah dari akun
          pembeli/penjual.
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--green-900)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "var(--paper)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    padding: 32,
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logoDot: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "var(--green-700)",
    color: "var(--cream)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "1.2rem",
    flexShrink: 0,
  },
  brandName: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "1.15rem",
    color: "var(--ink)",
  },
  brandSub: { fontSize: "0.8rem", color: "var(--ink-soft)" },
  footNote: {
    fontSize: "0.75rem",
    color: "var(--ink-soft)",
    marginTop: 18,
    textAlign: "center",
  },
};
