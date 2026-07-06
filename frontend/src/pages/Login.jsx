import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      showToast(`Selamat datang kembali, ${user.name.split(" ")[0]}!`);
      navigate(user.is_seller ? "/dashboard" : "/");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section" style={{ display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ width: 400, padding: 32 }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 6 }}>Masuk ke Qlapa</h1>
        <p style={{ marginBottom: 24 }}>Kelola toko atau lanjutkan belanja limbah kelapa favoritmu.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <p style={{ marginTop: 18, textAlign: "center", fontSize: "0.85rem" }}>
          Belum punya akun? <Link to="/daftar" style={{ color: "var(--green-700)", fontWeight: 700 }}>Daftar sekarang</Link>
        </p>

        <div style={{ marginTop: 20, padding: 12, background: "var(--cream-2)", borderRadius: 8, fontSize: "0.78rem" }}>
          <strong>Akun demo:</strong><br />
          Penjual: seller@qlapa.test / password123<br />
          Pembeli: buyer@qlapa.test / password123<br />
          Pembeli + Penjual (1 akun): hybrid@qlapa.test / password123
        </div>
      </div>
    </div>
  );
}
