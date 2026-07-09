import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { Eye, EyeOff, Shield } from "lucide-react";
import "./Admin.css";

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
    <div className="admin-login-page">
      {/* Background decorative blobs */}
      <div className="admin-login-blob admin-login-blob--1" />
      <div className="admin-login-blob admin-login-blob--2" />

      <div className="admin-login-box">
        {/* Header */}
        <div className="admin-login-box-header">
          <img
            src="/assets/qlapa-logo.png"
            alt="Qlapa"
            className="admin-login-box-logo"
          />
          <div className="admin-login-box-badge">
            <Shield size={13} strokeWidth={2} />
            Admin Panel
          </div>
          <h1 className="admin-login-box-title">Selamat Datang</h1>
          <p className="admin-login-box-sub">
            Masuk untuk mengelola platform Qlapa
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="admin-login-box-form">
          <div className="admin-field">
            <label className="admin-field-label" htmlFor="admin-email">
              Email Admin
            </label>
            <input
              id="admin-email"
              className="admin-field-input"
              type="email"
              required
              autoFocus
              placeholder="admin@qlapa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="admin-field">
            <label className="admin-field-label" htmlFor="admin-password">
              Password
            </label>
            <div className="admin-input-group">
              <input
                id="admin-password"
                className="admin-field-input"
                type={showPass ? "text" : "password"}
                required
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-input-eye"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-error-banner">
              <Shield size={14} /> {error}
            </div>
          )}

          <button
            className="admin-login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="admin-btn-spinner" />
            ) : (
              "Masuk ke Panel Admin"
            )}
          </button>
        </form>

        <p className="admin-login-box-note">
          Halaman ini hanya untuk administrator Qlapa dan terpisah dari akun pembeli/penjual.
        </p>
      </div>
    </div>
  );
}
