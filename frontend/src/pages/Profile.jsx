import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { User, Store, Shield, Image as ImageIcon, CheckCircle, Camera } from "lucide-react";
import "./Profile.css";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">Pengaturan Akun</h1>
        <p className="profile-subtitle">Kelola profil, pengaturan toko, dan keamanan akun Anda.</p>
      </div>

      <div className="profile-layout">
        {/* Sidebar Nav */}
        <aside className="profile-sidebar">
          <nav className="profile-nav">
            <button
              className={`profile-nav-item ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              <User size={18} />
              Profil Umum
            </button>
            {user.is_seller && (
              <button
                className={`profile-nav-item ${activeTab === "store" ? "active" : ""}`}
                onClick={() => setActiveTab("store")}
              >
                <Store size={18} />
                Informasi Toko
              </button>
            )}
            <button
              className={`profile-nav-item ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <Shield size={18} />
              Keamanan
            </button>
          </nav>
          
          {!user.is_seller && (
            <div className="profile-promo-card">
              <Store size={24} className="profile-promo-icon" />
              <strong>Belum punya toko?</strong>
              <p>Mulai jual limbah kelapa Anda sendiri di Qlapa sekarang juga.</p>
              <Link to="/toko/buka" className="btn btn-primary btn-sm profile-promo-btn">
                Buka Toko
              </Link>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <div className="profile-content">
          {activeTab === "general" && <GeneralSettings user={user} refreshUser={refreshUser} />}
          {activeTab === "store" && user.is_seller && <StoreSettings user={user} refreshUser={refreshUser} />}
          {activeTab === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* General Settings                                                   */
/* ------------------------------------------------------------------ */
function GeneralSettings({ user, refreshUser }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || "",
    address: user.address || "",
  });
  
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleAddressChange = (val) => {
    setForm((prev) => ({ ...prev, address: val }));
    if (typingTimeout) clearTimeout(typingTimeout);
    if (val.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    setTypingTimeout(
      setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=id&limit=5`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
          }
        } catch (err) {
          console.error("OSM autocomplete error:", err);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 500)
    );
  };

  const selectSuggestion = (item) => {
    setForm((prev) => ({ ...prev, address: item.display_name }));
    setSuggestions([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/me", form);
      await refreshUser();
      showToast("Profil umum berhasil diperbarui");
    } catch (err) {
      console.error(err);
      showToast("Gagal memperbarui profil", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-panel">
      <div className="profile-panel-header">
        <h2 className="profile-panel-title">Profil Umum</h2>
        <p className="profile-panel-desc">Info dasar tentang akun Anda yang digunakan di seluruh Qlapa.</p>
      </div>

      <div className="profile-panel-body">
        <div className="profile-avatar-section">
          <AvatarUploader endpoint="/auth/me/avatar" label="Foto Profil" currentPhoto={user.avatar_url} defaultIcon={<User size={32} />} />
          <div className="profile-user-badge">
            <span className="profile-email">{user.email}</span>
            <span className="badge">Pembeli</span>
            {user.is_seller && <span className="badge badge-brown">Penjual</span>}
          </div>
        </div>

        <form onSubmit={submit} className="profile-form">
          <div className="profile-form-row">
            <div className="profile-field">
              <label>Nama Lengkap</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap kamu" />
            </div>
            <div className="profile-field">
              <label>No. Telepon</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Nomor HP aktif" />
            </div>
          </div>

          <div className="profile-field profile-address-field">
            <label>Alamat Utama (untuk Pengiriman)</label>
            <textarea
              value={form.address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Ketik nama jalan, RT/RW, kelurahan/desa, kecamatan, kota/kabupaten..."
            />
            {loadingSuggestions && <div className="profile-address-loading">Mencari lokasi...</div>}
            {suggestions.length > 0 && (
              <ul className="profile-address-suggestions">
                {suggestions.map((item, idx) => (
                  <li key={idx} onClick={() => selectSuggestion(item)}>📍 {item.display_name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : (
                <>
                  <CheckCircle size={18} style={{ marginRight: 8 }} /> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Store Settings                                                     */
/* ------------------------------------------------------------------ */
function StoreSettings({ user, refreshUser }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    store_name: user.store_name || "",
    store_location: user.store_location || "",
    store_description: user.store_description || "",
  });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/me", form);
      await refreshUser();
      showToast("Informasi toko berhasil diperbarui");
    } catch (err) {
      console.error(err);
      showToast("Gagal memperbarui toko", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-panel">
      <div className="profile-panel-header">
        <h2 className="profile-panel-title">Informasi Toko</h2>
        <p className="profile-panel-desc">Kelola profil publik toko Anda di Qlapa Hub.</p>
      </div>

      <div className="profile-panel-body">
        <div className="profile-avatar-section">
          <AvatarUploader endpoint="/store/photo" label="Logo Toko" currentPhoto={user.store_image_url} defaultIcon={<Store size={32} />} />
        </div>

        <form onSubmit={submit} className="profile-form">
          <div className="profile-form-row">
            <div className="profile-field">
              <label>Nama Toko</label>
              <input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} placeholder="Nama toko kelapa Anda" />
            </div>
            <div className="profile-field">
              <label>Lokasi Toko</label>
              <input value={form.store_location} onChange={(e) => setForm({ ...form, store_location: e.target.value })} placeholder="Kota atau kabupaten" />
            </div>
          </div>

          <div className="profile-field">
            <label>Deskripsi Usaha</label>
            <textarea
              value={form.store_description}
              onChange={(e) => setForm({ ...form, store_description: e.target.value })}
              placeholder="Jelaskan mengenai jenis limbah kelapa yang Anda sediakan..."
              style={{ minHeight: 120 }}
            />
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : (
                <>
                  <CheckCircle size={18} style={{ marginRight: 8 }} /> Simpan Info Toko
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Security Settings                                                  */
/* ------------------------------------------------------------------ */
function SecuritySettings() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.new_password.length < 6) {
      setError("Password baru minimal 6 karakter");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }

    setSaving(true);
    try {
      await api.put("/auth/me/password", { current_password: form.current_password, new_password: form.new_password });
      showToast("Password berhasil diubah");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-panel">
      <div className="profile-panel-header">
        <h2 className="profile-panel-title">Keamanan Akun</h2>
        <p className="profile-panel-desc">Ganti password dan lindungi akun Anda.</p>
      </div>

      <div className="profile-panel-body">
        <form onSubmit={submit} className="profile-form">
          <div className="profile-field">
            <label>Password Saat Ini</label>
            <input type="password" required value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} />
          </div>
          <div className="profile-field">
            <label>Password Baru</label>
            <input type="password" required value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} />
          </div>
          <div className="profile-field">
            <label>Konfirmasi Password Baru</label>
            <input type="password" required value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} />
          </div>

          {error && <div className="profile-error-alert"><Shield size={16} /> {error}</div>}

          <div className="profile-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared Avatar Uploader Component                                   */
/* ------------------------------------------------------------------ */
function AvatarUploader({ endpoint, label, currentPhoto, defaultIcon }) {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");

  const pickFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("File harus berupa gambar (JPG, PNG)", "error");
    if (file.size > 8 * 1024 * 1024) return showToast("Ukuran maksimal 8MB", "error");
    
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });
      await refreshUser();
      setPreview("");
      showToast(`${label} berhasil diperbarui`);
    } catch (err) {
      console.error(err);
      showToast(`Gagal mengunggah ${label.toLowerCase()}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const photo = preview || currentPhoto;

  return (
    <div className="profile-avatar-uploader">
      <div className="profile-avatar-circle">
        {photo ? <img src={photo} alt={label} /> : <div className="profile-avatar-placeholder">{defaultIcon}</div>}
        <button className="profile-avatar-edit-btn" onClick={() => fileInputRef.current?.click()} type="button" title="Ganti foto">
          <Camera size={14} />
        </button>
      </div>
      <div className="profile-avatar-info">
        <strong>{label}</strong>
        <span>JPG, PNG, atau WEBP. Maks 8MB.</span>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickFile(e.target.files?.[0])} />
        {uploading && <span className="profile-uploading-text">Mengunggah...</span>}
      </div>
    </div>
  );
}
