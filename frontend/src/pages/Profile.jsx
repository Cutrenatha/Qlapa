import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || "",
    address: user.address || "",
    store_name: user.store_name || "",
    store_location: user.store_location || "",
    store_description: user.store_description || "",
  });
  const [saving, setSaving] = useState(false);
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
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=id&limit=5`
          );
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
      const data = {
        name: form.name,
        phone: form.phone,
        address: form.address,
      };

      if (user.is_seller) {
        data.store_name = form.store_name;
        data.store_location = form.store_location;
        data.store_description = form.store_description;
      }

      await api.put("/auth/me", data);
      await refreshUser();
      showToast("Profil berhasil diperbarui");
    } catch (err) {
      console.error(err);
      showToast("Gagal memperbarui profil", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section container" style={{ maxWidth: 580, minHeight: '80vh' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "2.2rem", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 8, color: "var(--ink)" }}>Profil Saya</h1>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>{user.email}</span>
          <span className="badge">Pembeli</span>
          {user.is_seller && <span className="badge badge-brown">Penjual</span>}
        </div>
      </div>

      <AvatarUploader />

      {!user.is_seller && (
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 28,
            background: "rgba(92, 61, 46, 0.04)",
            border: "1px solid rgba(92, 61, 46, 0.12)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 6, fontSize: '1rem', color: 'var(--ink)' }}>
            Belum punya toko?
          </strong>
          <p style={{ marginBottom: 16, fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--ink-soft)' }}>
            Mulai jual limbah kelapa Anda sendiri di Qlapa. Cukup lengkapi data toko Anda dengan akun yang sama ini.
          </p>
          <Link to="/toko/buka" className="btn btn-primary btn-sm" style={{ padding: '10px 20px' }}>
            + Buka Toko
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="card" style={{ padding: 28, marginBottom: 28, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)" }}>
        <div className="field">
          <label>Nama Lengkap</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama lengkap kamu"
          />
        </div>

        <div className="field">
          <label>No. Telepon</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Nomor HP aktif"
          />
        </div>

        <div className="field" style={{ position: "relative" }}>
          <label>Alamat Utama (untuk Pengiriman)</label>
          <textarea
            value={form.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Ketik nama jalan, RT/RW, kelurahan/desa, kecamatan, kota/kabupaten..."
            style={{
              minHeight: "80px",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1.5px solid rgba(0,0,0,0.08)",
              fontSize: "0.92rem",
              width: "100%",
              boxSizing: "border-box"
            }}
          />
          {loadingSuggestions && (
            <div style={{ position: "absolute", right: 12, top: 42, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              Mencari lokasi...
            </div>
          )}
          {suggestions.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1.5px solid rgba(0,0,0,0.08)",
                borderRadius: "8px",
                boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                zIndex: 1000,
                listStyle: "none",
                padding: "4px 0",
                margin: "4px 0 0 0",
                maxHeight: "180px",
                overflowY: "auto"
              }}
            >
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => selectSuggestion(item)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    borderBottom: idx < suggestions.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    color: "var(--ink)",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "rgba(92, 61, 46, 0.05)")}
                  onMouseLeave={(e) => (e.target.style.background = "none")}
                >
                  📍 {item.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {user.is_seller && (
          <>
            <div style={{ margin: "24px 0 16px", height: "1px", background: "var(--line)" }} />
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 16, color: "var(--ink)" }}>Informasi Toko</h3>
            
            <div className="field">
              <label>Nama Toko</label>
              <input
                value={form.store_name}
                onChange={(e) =>
                  setForm({ ...form, store_name: e.target.value })
                }
                placeholder="Nama toko kelapa Anda"
              />
            </div>

            <div className="field">
              <label>Lokasi Toko</label>
              <input
                value={form.store_location}
                onChange={(e) =>
                  setForm({ ...form, store_location: e.target.value })
                }
                placeholder="Kota atau kabupaten"
              />
            </div>

            <div className="field">
              <label>Deskripsi Usaha</label>
              <textarea
                value={form.store_description}
                onChange={(e) =>
                  setForm({ ...form, store_description: e.target.value })
                }
                placeholder="Jelaskan mengenai jenis limbah kelapa yang Anda sediakan..."
              />
            </div>
          </>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ padding: "14px 24px", marginTop: 8 }}
          type="submit"
          disabled={saving}
        >
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </form>

      {user.is_seller && <StorePhotoUploader />}

      <ChangePasswordForm />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Foto profil akun                                                    */
/* ------------------------------------------------------------------ */
function AvatarUploader() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");

  const pickFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar (JPG, PNG, WEBP)", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("Ukuran gambar maksimal 8MB", "error");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await api.post("/auth/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      showToast("Foto profil berhasil diperbarui");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengunggah foto profil", "error");
    } finally {
      setUploading(false);
    }
  };

  const photo = preview || user.avatar_url;

  return (
    <div
      className="card"
      style={{
        padding: 20,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={styles.avatarWrap}>
        {photo ? (
          <img src={photo} alt="Foto profil" style={styles.avatarImg} />
        ) : (
          <span style={{ fontSize: "1.6rem" }}>👤</span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <strong style={{ display: "block", marginBottom: 4 }}>
          Foto Profil
        </strong>
        <p style={{ fontSize: "0.82rem", marginBottom: 10 }}>
          JPG, PNG, atau WEBP. Maksimal 8MB.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Mengunggah…" : "Ganti Foto"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Foto profil toko (khusus penjual)                                   */
/* ------------------------------------------------------------------ */
function StorePhotoUploader() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");

  const pickFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar (JPG, PNG, WEBP)", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("Ukuran gambar maksimal 8MB", "error");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await api.post("/store/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      showToast("Foto toko berhasil diperbarui");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengunggah foto toko", "error");
    } finally {
      setUploading(false);
    }
  };

  const photo = preview || user.store_image_url;

  return (
    <div
      className="card"
      style={{
        padding: 20,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={styles.avatarWrap}>
        {photo ? (
          <img src={photo} alt="Foto toko" style={styles.avatarImg} />
        ) : (
          <span style={{ fontSize: "1.6rem" }}>🥥</span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <strong style={{ display: "block", marginBottom: 4 }}>
          Foto Profil Toko
        </strong>
        <p style={{ fontSize: "0.82rem", marginBottom: 10 }}>
          Ditampilkan sebagai logo toko {user.store_name || "kamu"}.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Mengunggah…" : "Ganti Foto Toko"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ganti password                                                       */
/* ------------------------------------------------------------------ */
function ChangePasswordForm() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
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
      await api.put("/auth/me/password", {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      showToast("Password berhasil diubah");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: 4 }}>Ganti Password</h2>
      <p style={{ fontSize: "0.85rem", marginBottom: 16 }}>
        Gunakan password baru yang kuat dan tidak dipakai di tempat lain.
      </p>

      <div className="field">
        <label>Password Saat Ini</label>
        <input
          type="password"
          required
          value={form.current_password}
          onChange={(e) =>
            setForm({ ...form, current_password: e.target.value })
          }
        />
      </div>

      <div className="field">
        <label>Password Baru</label>
        <input
          type="password"
          required
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
        />
      </div>

      <div className="field">
        <label>Konfirmasi Password Baru</label>
        <input
          type="password"
          required
          value={form.confirm_password}
          onChange={(e) =>
            setForm({ ...form, confirm_password: e.target.value })
          }
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
        disabled={saving}
      >
        {saving ? "Menyimpan…" : "Ubah Password"}
      </button>
    </form>
  );
}

const styles = {
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "var(--cream-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid var(--line)",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
};
