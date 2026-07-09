import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Camera, X, RefreshCcw, Sparkles } from "lucide-react";

const CATEGORIES = ["Ampas", "Tempurung", "Sabut", "Daun", "Air Kelapa"];
const CONDITIONS = ["Kering", "Segar"];

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
    <div className="section container" style={{ maxWidth: 640, marginTop: 24 }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: 6 }}>
        Tambah Produk Baru
      </h1>
      <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", marginBottom: 24 }}>
        Unggah foto limbah kelapa Anda dan gunakan Qlapa AI untuk mengisi data produk secara otomatis.
      </p>

      <form onSubmit={submit}>
        {/* ---------- STEP 1: FOTO PRODUK ---------- */}
        <div className="card" style={{ padding: 24, marginBottom: 20, borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="row gap-8" style={{ marginBottom: 16, alignItems: "center" }}>
            <span className="badge" style={{ background: "var(--brown-500)", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, fontWeight: 600, fontSize: "0.72rem" }}>Langkah 1</span>
            <strong style={{ fontSize: "0.95rem" }}>Unggah Foto Produk</strong>
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
                border: "2px dashed rgba(0, 0, 0, 0.08)",
                borderRadius: 14,
                padding: "48px 16px",
                cursor: "pointer",
                background: "rgba(0, 0, 0, 0.01)",
                textAlign: "center",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ marginBottom: 8, color: "var(--ink-soft)" }}><Camera size={48} strokeWidth={1.5} /></div>
              <strong style={{ color: "var(--brown-500)", fontSize: "0.95rem" }}>
                Klik untuk pilih foto
              </strong>
              <span className="field-hint" style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                atau tarik & lepas file ke sini &middot; JPG, PNG, WEBP, maks 8MB
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
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <X size={14} /> Ganti Foto
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={analyzeImage}
                  disabled={analyzing}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {analyzing
                    ? "Menganalisis foto…"
                    : analyzed
                      ? <><RefreshCcw size={14} /> Analisis Ulang</>
                      : <><Sparkles size={14} /> Analisis Foto dengan Qlapa AI</>}
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
          style={{ padding: 24, opacity: imageFile ? 1 : 0.55, borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "#ffffff" }}
        >
          <fieldset
            disabled={false}
            style={{ border: "none", padding: 0, margin: 0 }}
          >
            <div className="row gap-8" style={{ marginBottom: 16, alignItems: "center" }}>
              <span className="badge" style={{ background: "var(--brown-500)", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, fontWeight: 600, fontSize: "0.72rem" }}>Langkah 2</span>
              <strong style={{ fontSize: "0.95rem" }}>Detail Produk</strong>
              {!imageFile && (
                <span className="field-hint" style={{ fontSize: "0.82rem", color: "var(--danger)" }}>
                  (Unggah foto dulu untuk mengisi bagian ini)
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
            padding: 20,
            background: "var(--cream-100)",
            border: "1px solid var(--brown-300)",
            borderRadius: 16,
            margin: "20px 0",
            opacity: imageFile ? 1 : 0.55,
          }}
        >
          <fieldset
            disabled={false}
            style={{ border: "none", padding: 0, margin: 0 }}
          >
            <div className="row between wrap gap-8" style={{ marginBottom: 12, alignItems: "center" }}>
              <span className="row gap-4" style={{ alignItems: "center", fontWeight: 600, fontSize: "0.95rem", color: "var(--brown-800)" }}>
                Deskripsi Otomatis Qlapa AI
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "6px 14px", borderRadius: 999, fontSize: "0.78rem" }}
                onClick={generateDesc}
              >
                Sarankan Data dengan AI
              </button>
            </div>
            <textarea
              value={aiDesc}
              onChange={(e) => setAiDesc(e.target.value)}
              placeholder="Analisis foto akan mengisi deskripsi ini secara otomatis, lalu edit sesuai kebutuhan."
              style={{ minHeight: 100, width: "100%", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", padding: 12, fontSize: "0.88rem", outline: "none", resize: "vertical", fontFamily: "inherit" }}
            />
          </fieldset>
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ padding: "14px 24px", borderRadius: 999, fontSize: "0.92rem", fontWeight: 600 }}
          type="submit"
          disabled={saving || !imageFile}
        >
          {saving ? "Mempublikasikan…" : "Publikasikan Produk"}
        </button>
      </form>
    </div>
  );
}
