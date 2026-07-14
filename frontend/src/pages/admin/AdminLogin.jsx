import React, { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import "../Auth.css";

export default function AdminLogin() {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal masuk sebagai admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-panel auth-panel--image"
        style={{ backgroundImage: "url('/assets/klapa.png')" }}
      >
        <div className="auth-panel-overlay" />
        <div className="auth-panel-content">
          <div className="auth-panel-logo">
            <img
              src="/assets/qlapa-logo.png"
              alt="Qlapa"
              className="auth-logo-img"
            />
          </div>
          <div className="auth-panel-tagline">
            <h2>Panel Administratif Qlapa.</h2>
            <p>
              Kelola platform, pengguna, dan transaksi dengan aman untuk memastikan ekosistem berjalan lancar.
            </p>
          </div>
          <div className="auth-panel-dots">
            <span className="auth-dot auth-dot--active" />
            <span className="auth-dot" />
            <span className="auth-dot" />
          </div>
        </div>
      </div>

      <div className="auth-panel auth-panel--form">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <p className="auth-form-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} /> Admin Portal
            </p>
            <h1 className="auth-form-title">Masuk ke Qlapa Admin</h1>
            <p className="auth-form-sub">
              Hanya untuk administrator sistem.
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="admin-email">
                Email Admin
              </label>
              <input
                id="admin-email"
                className="auth-input"
                type="email"
                required
                autoFocus
                placeholder="admin@qlapa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="admin-password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="admin-password"
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              className="auth-submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <span>Masuk ke Panel Admin</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          
          <div style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
            <Link to="/masuk" className="auth-link">Kembali ke login pengguna</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
