import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      showToast(`Selamat datang kembali, ${user.name.split(" ")[0]}!`);
      navigate(user.is_seller ? "/dashboard" : "/");
    } catch (err) {
      setError(err.response?.data?.error || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle(response.credential);
      showToast(`Selamat datang kembali, ${user.name.split(" ")[0]}!`);
      navigate(user.is_seller ? "/dashboard" : "/");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal masuk dengan Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Gagal melakukan Google Sign-In");
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
            <h2>Kelapa menyimpan banyak potensi.</h2>
            <p>
              Temukan limbah kelapa berkualitas dari petani lokal dan ciptakan
              nilai bersama.
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
            <p className="auth-form-eyebrow">Selamat datang kembali</p>
            <h1 className="auth-form-title">Masuk ke Qlapa</h1>
            <p className="auth-form-sub">
              Belum punya akun?{" "}
              <Link to="/daftar" className="auth-link">
                Daftar sekarang
              </Link>
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className="auth-input"
                type="email"
                required
                placeholder="nama@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
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
                  <span>Masuk</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div
            className="auth-divider"
            style={{
              display: "flex",
              alignItems: "center",
              textTransform: "uppercase",
              fontSize: "0.72rem",
              fontWeight: "700",
              color: "var(--ink-soft)",
              margin: "8px 0",
            }}
          >
            <div
              style={{ flex: 1, height: "1px", background: "var(--line)" }}
            />
            <span style={{ padding: "0 16px", letterSpacing: "0.05em" }}>
              atau
            </span>
            <div
              style={{ flex: 1, height: "1px", background: "var(--line)" }}
            />
          </div>

          {/* Google Sign-In Button */}
          <div
            className="auth-google-container"
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              overflow: "hidden",
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="360"
              shape="pill"
              text="signin_with"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
