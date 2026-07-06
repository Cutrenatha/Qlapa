import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useToast } from "../context/ToastContext.jsx";

const CATEGORIES = ["Ampas", "Tempurung", "Sabut", "Daun", "Air Kelapa"];

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setForm(res.data));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/products/${id}`, form);
      showToast("Produk berhasil diperbarui");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal memperbarui produk", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>;

  return (
    <div className="section container" style={{ maxWidth: 640 }}>
      <span className="eyebrow">Toko Saya</span>
      <h1 style={{ fontSize: "1.8rem", marginTop: 6, marginBottom: 24 }}>Edit Produk</h1>

      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <div className="field">
          <label>Nama Produk</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="row gap-16">
          <div className="field" style={{ flex: 1 }}>
            <label>Kategori</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Aktif</option>
              <option value="nonactive">Nonaktif</option>
            </select>
          </div>
        </div>
        <div className="row gap-16">
          <div className="field" style={{ flex: 1 }}>
            <label>Harga (Rp)</label>
            <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Stok</label>
            <input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Satuan</label>
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>URL Foto Produk</label>
          <input value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </div>
        <div className="field">
          <label>Deskripsi AI (dapat diedit)</label>
          <textarea value={form.ai_description || ""} onChange={(e) => setForm({ ...form, ai_description: e.target.value })} style={{ minHeight: 120 }} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}
