import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      showToast(`Akun berhasil dibuat! Selamat datang, ${user.name.split(" ")[0]}`);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle(response.credential);
      showToast(`Akun berhasil dibuat! Selamat datang, ${user.name.split(" ")[0]}`);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mendaftar dengan Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Gagal melakukan Google Sign-In");
  };

  return (
    <div className="auth-page">
      <div className="auth-panel auth-panel--image" style={{ backgroundImage: "url('/assets/coconut.png')" }}>
        <div className="auth-panel-overlay" />
        <div className="auth-panel-content">
          <div className="auth-panel-logo">
            <img src="/assets/qlapa-logo.png" alt="Qlapa" className="auth-logo-img" />
          </div>
          <div className="auth-panel-tagline">
            <h2>Mulai perjalananmu bersama Qlapa.</h2>
            <p>Satu akun untuk belanja dan berjualan. Bergabunglah dengan komunitas limbah kelapa hari ini.</p>
          </div>
          <div className="auth-panel-dots">
            <span className="auth-dot" />
            <span className="auth-dot auth-dot--active" />
            <span className="auth-dot" />
          </div>
        </div>
      </div>

      <div className="auth-panel auth-panel--form">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <p className="auth-form-eyebrow">Bergabung sekarang</p>
            <h1 className="auth-form-title">Buat Akun Baru</h1>
            <p className="auth-form-sub">
              Sudah punya akun?{" "}
              <Link to="/masuk" className="auth-link">Masuk di sini</Link>
            </p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-name">Nama Lengkap</label>
              <input
                id="reg-name"
                className="auth-input"
                type="text"
                required
                placeholder="Nama kamu"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
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
              <label className="auth-label" htmlFor="reg-phone">
                No. Telepon <span className="auth-optional">(opsional)</span>
              </label>
              <input
                id="reg-phone"
                className="auth-input"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-password">Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="reg-password"
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
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

            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : <><span>Buat Akun</span><ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="auth-divider" style={{ display: "flex", alignItems: "center", textTransform: "uppercase", fontSize: "0.72rem", fontWeight: "700", color: "var(--ink-soft)", margin: "8px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
            <span style={{ padding: "0 16px", letterSpacing: "0.05em" }}>atau</span>
            <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
          </div>

          {/* Google Sign-In Button */}
          <div className="auth-google-container" style={{ display: "flex", justifyContent: "center", width: "100%", overflow: "hidden" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="360"
              shape="pill"
              text="signup_with"
            />
          </div>

          <p className="auth-tos">
            Dengan mendaftar, kamu menyetujui syarat dan ketentuan Qlapa.
          </p>
        </div>
      </div>
    </div>
  );
}
