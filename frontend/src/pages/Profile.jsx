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
    store_name: user.store_name || "",
    store_location: user.store_location || "",
    store_description: user.store_description || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: form.name,
        phone: form.phone,
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
    <div className="section container" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: 6 }}>Profil Saya</h1>
      <div
        className="row gap-8"
        style={{ marginBottom: 24, alignItems: "center" }}
      >
        <span>{user.email}</span>
        <span className="badge">Pembeli</span>
        {user.is_seller && <span className="badge badge-brown">Penjual</span>}
      </div>

      <AvatarUploader />

      {!user.is_seller && (
        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 20,
            background: "var(--brown-100)",
            border: "1px solid var(--brown-300)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>
            Belum punya toko?
          </strong>
          <p style={{ marginBottom: 12 }}>
            Buka toko dengan akun yang sama ini — tidak perlu daftar akun baru —
            dan mulai jual limbah kelapa kamu sendiri.
          </p>
          <Link to="/toko/buka" className="btn btn-primary btn-sm">
            + Buka Toko
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="field">
          <label>Nama</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="field">
          <label>No. Telepon</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {user.is_seller && (
          <>
            <div className="field">
              <label>Nama Toko</label>
              <input
                value={form.store_name}
                onChange={(e) =>
                  setForm({ ...form, store_name: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Lokasi Toko</label>
              <input
                value={form.store_location}
                onChange={(e) =>
                  setForm({ ...form, store_location: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Deskripsi Usaha</label>
              <textarea
                value={form.store_description}
                onChange={(e) =>
                  setForm({ ...form, store_description: e.target.value })
                }
              />
            </div>
          </>
        )}

        <button
          className="btn btn-primary btn-block"
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
