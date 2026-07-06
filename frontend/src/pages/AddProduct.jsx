import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useToast } from "../context/ToastContext.jsx";

const CATEGORIES = ["Ampas", "Tempurung", "Sabut", "Daun", "Air Kelapa"];
const CONDITIONS = ["Kering", "Basah", "Segar"];

export default function AddProduct() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    category: "Tempurung",
    price: "",
    stock: "",
    unit: "kg",
    image_url: "",
    condition: "Kering",
    quality: "",
    manual_note: "",
  });
  const [aiDesc, setAiDesc] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [saving, setSaving] = useState(false);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const pickFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar (JPG, PNG, WEBP)", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("Ukuran gambar maksimal 8MB", "error");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalyzed(false);
    setForm((f) => ({ ...f, image_url: "" }));
  };

  const onFileChange = (e) => pickFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    pickFile(e.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setAnalyzed(false);
    setField("image_url", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeImage = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      const res = await api.post("/products/analyze-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const r = res.data;
      // Map backend category labels to frontend options
      const mapCategory = (cat) => {
        if (!cat) return "Tempurung";
        const normalized = cat.toLowerCase();
        if (normalized.includes("tempurung")) return "Tempurung";
        if (normalized.includes("sabut")) return "Sabut";
        if (normalized.includes("ampas")) return "Ampas";
        if (normalized.includes("daun")) return "Daun";
        if (normalized.includes("air")) return "Air Kelapa";
        return "Tempurung";
      };

      setForm((f) => ({
        ...f,
        name: r.name || f.name,
        image_url: r.image_url || f.image_url,
        category: mapCategory(r.category) || f.category,
        condition: r.condition || f.condition,
        stock: r.stock_estimate != null ? String(r.stock_estimate) : f.stock,
      }));
      setAiDesc(r.ai_description || "");
      setAnalyzed(true);
      const conf = r.confidence
        ? ` (confidence: ${Math.round(r.confidence * 100)}%)`
        : "";
      showToast(
        `Foto berhasil dianalisis!${conf} Cek & sesuaikan datanya di bawah.`,
      );
    } catch (err) {
      showToast(
        err.response?.data?.error || "Gagal menganalisis gambar",
        "error",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const generateDesc = async () => {
    if (!form.name || !form.category) {
      showToast("Isi nama & kategori produk dulu ya", "error");
      return;
    }
    try {
      const res = await api.post("/products/generate-description", form);
      setForm((f) => ({
        ...f,
        name: res.data.name || f.name,
      }));
      setAiDesc(res.data.ai_description);
      showToast("AI berhasil menyarankan data produk.");
    } catch {
      showToast("Gagal membuat saran AI", "error");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.image_url) {
      showToast("Unggah dan analisis foto produk terlebih dahulu", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/products", {
        ...form,
        ai_description: aiDesc || undefined,
      });
      showToast("Produk berhasil dipublikasikan!");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.response?.data?.error || "Gagal menambah produk", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section container" style={{ maxWidth: 640 }}>
      <span className="eyebrow">Toko Saya</span>
      <h1 style={{ fontSize: "1.8rem", marginTop: 6, marginBottom: 24 }}>
        Tambah Produk Baru
      </h1>

      <form onSubmit={submit}>
        {/* ---------- STEP 1: FOTO PRODUK ---------- */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="row gap-8" style={{ marginBottom: 14 }}>
            <span className="badge">Langkah 1</span>
            <strong style={{ fontSize: "1.02rem" }}>Unggah Foto Produk</strong>
          </div>

          {!imagePreview ? (
            <label
              htmlFor="product-image-input"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: "2px dashed var(--line)",
                borderRadius: "var(--radius-md)",
                padding: "40px 16px",
                cursor: "pointer",
                background: "var(--cream-2)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem" }}>📷</div>
              <strong style={{ color: "var(--green-800)" }}>
                Klik untuk pilih foto
              </strong>
              <span className="field-hint">
                atau tarik & lepas file ke sini &middot; JPG, PNG, WEBP, maks
                8MB
              </span>
            </label>
          ) : (
            <div>
              <div
                style={{
                  width: "100%",
                  maxHeight: 260,
                  overflow: "hidden",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--line)",
                  background: "var(--cream-2)",
                }}
              >
                <img
                  src={imagePreview}
                  alt="Preview produk"
                  style={{
                    width: "100%",
                    maxHeight: 260,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>

              <div
                className="row between wrap gap-12"
                style={{ marginTop: 14 }}
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={removeImage}
                  disabled={analyzing}
                >
                  ✕ Ganti Foto
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={analyzeImage}
                  disabled={analyzing}
                >
                  {analyzing
                    ? "Menganalisis foto…"
                    : analyzed
                      ? "🔁 Analisis Ulang"
                      : "✨ Analisis Foto dengan Qlapa AI"}
                </button>
              </div>

              {analyzed && (
                <div
                  className="row gap-8"
                  style={{
                    marginTop: 14,
                    padding: "10px 14px",
                    background: "var(--green-100)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    color: "var(--green-900)",
                  }}
                >
                  ✅ Selesai dianalisis! Data di bawah sudah terisi otomatis —
                  silakan cek &amp; sesuaikan.
                </div>
              )}
            </div>
          )}
          <input
            id="product-image-input"
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={onFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* ---------- STEP 2: DETAIL PRODUK ---------- */}
        <div
          className="card"
          style={{ padding: 24, opacity: imageFile ? 1 : 0.55 }}
        >
          <fieldset
            disabled={false}
            style={{ border: "none", padding: 0, margin: 0 }}
          >
            <div className="row gap-8" style={{ marginBottom: 14 }}>
              <span className="badge">Langkah 2</span>
              <strong style={{ fontSize: "1.02rem" }}>Detail Produk</strong>
              {!imageFile && (
                <span className="field-hint">
                  — unggah foto dulu untuk mengisi bagian ini
                </span>
              )}
            </div>

            <div className="field">
              <label>Nama Produk</label>
              <input
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="mis. Tempurung Kelapa Kering"
              />
            </div>

            <div className="row gap-16 wrap">
              <div className="field" style={{ flex: "1 1 160px" }}>
                <label>Kategori Limbah</label>
                <select
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: "1 1 160px" }}>
                <label>Kondisi</label>
                <select
                  value={form.condition}
                  onChange={(e) => setField("condition", e.target.value)}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row gap-16 wrap">
              <div className="field" style={{ flex: "1 1 140px" }}>
                <label>Harga (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                />
              </div>
              <div className="field" style={{ flex: "1 1 140px" }}>
                <label>Stok / Estimasi Berat</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                />
              </div>
              <div className="field" style={{ flex: "1 1 100px" }}>
                <label>Satuan</label>
                <input
                  value={form.unit}
                  onChange={(e) => setField("unit", e.target.value)}
                  placeholder="kg / liter / ikat"
                />
              </div>
            </div>

            <div className="field">
              <label>Kualitas / Catatan Tambahan</label>
              <input
                value={form.quality}
                onChange={(e) => setField("quality", e.target.value)}
                placeholder="mis. bersih, siap kirim"
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Catatan untuk Pembeli (opsional)</label>
              <textarea
                value={form.manual_note}
                onChange={(e) => setField("manual_note", e.target.value)}
              />
            </div>
          </fieldset>
        </div>

        {/* ---------- STEP 3: DESKRIPSI AI ---------- */}
        <div
          className="card"
          style={{
            padding: 16,
            background: "var(--green-100)",
            border: "1px solid var(--green-500)",
            margin: "20px 0",
            opacity: imageFile ? 1 : 0.55,
          }}
        >
          <fieldset
            disabled={false}
            style={{ border: "none", padding: 0, margin: 0 }}
          >
            <div className="row between wrap gap-8" style={{ marginBottom: 8 }}>
              <strong>🤖 Deskripsi Otomatis Qlapa AI</strong>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={generateDesc}
              >
                Gunakan AI untuk Sarankan Semua Field
              </button>
            </div>
            <textarea
              value={aiDesc}
              onChange={(e) => setAiDesc(e.target.value)}
              placeholder="Analisis foto akan mengisi deskripsi ini secara otomatis, lalu edit sesuai kebutuhan."
              style={{ minHeight: 120, width: "100%" }}
            />
          </fieldset>
        </div>

        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={saving || !imageFile}
        >
          {saving ? "Mempublikasikan…" : "Publikasikan Produk"}
        </button>
      </form>
    </div>
  );
}
