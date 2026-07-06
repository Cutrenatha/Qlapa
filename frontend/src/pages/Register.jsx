import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="section" style={{ display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ width: 440, padding: 32 }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 6 }}>Daftar di Qlapa</h1>
        <p style={{ marginBottom: 20 }}>
          Satu akun untuk semuanya — belanja limbah kelapa, dan buka toko sendiri kapan saja
          setelah mendaftar, tanpa perlu akun terpisah.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Nama Lengkap</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>No. Telepon</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Memproses…" : "Buat Akun"}
          </button>
        </form>

        <p style={{ marginTop: 18, textAlign: "center", fontSize: "0.85rem" }}>
          Sudah punya akun? <Link to="/masuk" style={{ color: "var(--green-700)", fontWeight: 700 }}>Masuk</Link>
        </p>
      </div>
    </div>
  );
}
