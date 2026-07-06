import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function OpenStore() {
  const { user, openStore } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    store_name: user?.store_name || "",
    store_location: user?.store_location || "",
    store_description: user?.store_description || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.is_seller) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = {
        store_name: form.store_name,
        store_location: form.store_location,
        store_description: form.store_description,
      };

      await openStore(data);
      showToast(
        "Toko berhasil dibuka! Akun kamu sekarang juga jadi akun penjual.",
      );
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal membuka toko");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="section"
      style={{ display: "flex", justifyContent: "center" }}
    >
      <div className="card" style={{ width: 460, padding: 32 }}>
        <span className="eyebrow">Satu akun, dua peran</span>
        <h1 style={{ fontSize: "1.6rem", marginTop: 6, marginBottom: 6 }}>
          Buka Toko
        </h1>
        <p style={{ marginBottom: 20 }}>
          Kamu tetap login dengan akun <strong>{user?.email}</strong> yang sama
          — tidak perlu daftar akun baru. Setelah toko dibuka, kamu bisa
          berjualan sekaligus tetap bisa berbelanja seperti biasa.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Nama Toko</label>
            <input
              required
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              placeholder="mis. LimbahKita Store"
            />
          </div>
          <div className="field">
            <label>Lokasi Toko (Kabupaten/Kota)</label>
            <input
              required
              value={form.store_location}
              onChange={(e) =>
                setForm({ ...form, store_location: e.target.value })
              }
              placeholder="mis. Banda Aceh, Aceh"
            />
          </div>
          <div className="field">
            <label>Deskripsi Usaha</label>
            <textarea
              value={form.store_description}
              onChange={(e) =>
                setForm({ ...form, store_description: e.target.value })
              }
              placeholder="Ceritakan sedikit tentang tokomu"
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
            {loading ? "Membuka toko…" : "Buka Toko Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
