import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Camera, X, RefreshCcw, Sparkles } from "lucide-react";

const KATEGORI_OPTIONS = ["Bahan Baku", "Produk Olahan"];

const JENIS_BY_KATEGORI = {
  "Bahan Baku": ["Tempurung", "Sabut", "Ampas", "Daun", "Air Kelapa", "Lainnya"],
  "Produk Olahan": [
    "Briket",
    "Cocopeat",
    "Cocofiber",
    "Arang Aktif",
    "Kerajinan",
    "Pot Sabut",
    "Keset Sabut",
    "Tali Sabut",
    "Pupuk Organik",
    "Pakan Ternak",
    "Lainnya",
  ],
};

const CONDITIONS = ["Kering", "Basah", "Segar"];
const UNITS = ["kg", "ons", "gram", "liter", "ikat", "karung", "pcs"];

export default function AddProduct() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    category: "Bahan Baku",
    type: "Tempurung",
    customType: "",
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
  const [progress, setProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState(false);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [saving, setSaving] = useState(false);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onKategoriChange = (val) => {
    const firstJenis = JENIS_BY_KATEGORI[val]?.[0] || "";
    setForm((f) => ({ ...f, category: val, type: firstJenis, customType: "" }));
  };

  const onJenisChange = (val) => {
    setForm((f) => ({ ...f, type: val, customType: "" }));
  };

  const effectiveType = form.type === "Lainnya" ? form.customType : form.type;

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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalyzed(false);
    setLowConfidence(false);
    setForm((f) => ({ ...f, image_url: "" }));
    await analyzeImageFile(file);
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

  const mapAiType = (aiType) => {
    if (!aiType) return null;
    const lower = aiType.toLowerCase();
    const allJenis = [...JENIS_BY_KATEGORI["Bahan Baku"], ...JENIS_BY_KATEGORI["Produk Olahan"]];
    for (const j of allJenis) {
      if (j === "Lainnya") continue;
      if (lower.includes(j.toLowerCase())) return j;
    }
    return null;
  };

  const analyzeImageFile = async (file) => {
    if (!file) return;
    setAnalyzing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.floor(Math.random() * 4) + 2;
      });
    }, 150);

    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/products/analyze-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const r = res.data;

      const mappedType = mapAiType(r.type || r.category || "");
      const aiCategory =
        r.category === "Produk Olahan" || r.category === "Bahan Baku"
          ? r.category
          : mappedType
          ? JENIS_BY_KATEGORI["Bahan Baku"].includes(mappedType)
            ? "Bahan Baku"
            : "Produk Olahan"
          : form.category;

      const mapCondition = (cond) => {
        if (!cond) return "Kering";
        const c = cond.toLowerCase();
        if (c.includes("basah")) return "Basah";
        if (c.includes("segar")) return "Segar";
        return "Kering";
      };

      setForm((f) => ({
        ...f,
        name: r.name || f.name,
        image_url: r.image_url || f.image_url,
        category: aiCategory,
        type: mappedType || f.type,
        customType: "",
        condition: mapCondition(r.condition),
        quality: r.quality || f.quality,
        stock: f.stock,
        price: r.price_estimate != null ? String(r.price_estimate) : f.price,
        unit: r.unit || f.unit,
      }));

      setAiDesc(r.ai_description || r.description || "");
      
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setAnalyzing(false);
        setAnalyzed(true);
      }, 300);

      setLowConfidence(!!r.low_confidence);
      const confText = r.confidence != null ? ` · Keyakinan AI: ${r.confidence}/5` : "";
      if (r.low_confidence) {
        showToast(`Foto dianalisis${confText}. Keyakinan AI rendah — mohon cek & koreksi data.`, "warning");
      } else {
        showToast(`Foto berhasil dianalisis${confText}! Cek & sesuaikan data di bawah.`);
      }
    } catch (err) {
      clearInterval(interval);
      setAnalyzing(false);
      showToast(
        err.response?.data?.detail || err.response?.data?.error || "Gagal menganalisis gambar",
        "error",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeImage = () => analyzeImageFile(imageFile);

  const generateDesc = async () => {
    if (!form.name || !form.category) {
      showToast("Isi nama & kategori produk dulu ya", "error");
      return;
    }
    try {
      const res = await api.post("/products/generate-description", {
        name: form.name,
        category: form.category,
        type: effectiveType,
        condition: form.condition,
        notes: form.manual_note,
      });
      setForm((f) => ({ ...f, name: res.data.name || f.name }));
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
    if (form.type === "Lainnya" && !form.customType.trim()) {
      showToast("Isi jenis produk pada kolom 'Jenis Lainnya'", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/products", {
        name: form.name,
        category: form.category,
        type: effectiveType,
        price: form.price,
        stock: form.stock,
        unit: form.unit,
        image_url: form.image_url,
        condition: form.condition,
        quality: form.quality,
        manual_note: form.manual_note,
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

  const jenisOptions = JENIS_BY_KATEGORI[form.category] || [];

  return (
    <div className="section" style={{ padding: "40px 40px", width: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 600, fontFamily: "var(--font-display)", marginBottom: 6 }}>
        Tambah Produk Baru
      </h1>
      <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", marginBottom: 24 }}>
        Unggah foto limbah kelapa Anda dan gunakan Qlapa AI untuk mengisi data produk secara otomatis.
      </p>

      <form onSubmit={submit}>
        <div className="add-product-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'stretch' }}>
        {/* --- KOLOM KIRI --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* ---------- STEP 1: FOTO PRODUK ---------- */}
        <div className="card" style={{ padding: 24, borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", flex: 1 }}>
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
                minHeight: 280,
                cursor: "pointer",
                background: "rgba(0, 0, 0, 0.01)",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ marginBottom: 8, color: "var(--ink-soft)" }}><Camera size={48} strokeWidth={1.5} /></div>
              <strong style={{ color: "var(--brown-500)", fontSize: "0.95rem" }}>Klik untuk pilih foto</strong>
              <span className="field-hint" style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                atau tarik &amp; lepas file ke sini &middot; JPG, PNG, WEBP, maks 8MB
              </span>
            </label>
          ) : (
            <div>
              <div style={{ width: "100%", maxHeight: 340, overflow: "hidden", borderRadius: "var(--radius-md)", border: "1px solid var(--line)", background: "var(--cream-2)" }}>
                <img src={imagePreview} alt="Preview produk" style={{ width: "100%", maxHeight: 340, objectFit: "cover", display: "block" }} />
              </div>
              <div className="row between wrap gap-12" style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={removeImage} disabled={analyzing} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={14} /> Ganti Foto
                </button>
                 <button type="button" className="btn btn-primary btn-sm" onClick={analyzeImage} disabled={analyzing} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {analyzing
                    ? `Menganalisis foto... ${progress}%`
                    : analyzed
                    ? <><RefreshCcw size={14} /> Analisis Ulang</>
                    : <><Sparkles size={14} /> Analisis Foto dengan Qlapa AI</>}
                </button>
              </div>

              {analyzed && !lowConfidence && (
                <div className="row gap-8" style={{ marginTop: 14, padding: "10px 14px", background: "var(--green-100)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--green-900)" }}>
                  ✅ Selesai dianalisis! Nama, Kategori &amp; Jenis sudah terisi otomatis — silakan cek &amp; sesuaikan.
                </div>
              )}
              {analyzed && lowConfidence && (
                <div className="row gap-8" style={{ marginTop: 14, padding: "10px 14px", background: "#FEF9C3", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "#92400E", border: "1px solid #FDE68A" }}>
                  ⚠️ AI kurang yakin pada foto ini — mohon periksa dan koreksi Nama, Kategori &amp; Jenis secara manual.
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

        {/* ---------- STEP 3: DESKRIPSI AI ---------- */}
        <div className="card" style={{ padding: 20, background: "var(--cream-100)", border: "1px solid var(--brown-300)", borderRadius: 16, opacity: imageFile ? 1 : 0.55 }}>
          <fieldset disabled={false} style={{ border: "none", padding: 0, margin: 0 }}>
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
               style={{ minHeight: 200, width: "100%", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", padding: 12, fontSize: "0.88rem", outline: "none", resize: "vertical", fontFamily: "inherit" }}
             />
           </fieldset>
        </div>
        </div>

        {/* --- KOLOM KANAN --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* ---------- STEP 2: DETAIL PRODUK ---------- */}
        <div className="card" style={{ padding: 24, opacity: imageFile ? 1 : 0.55, borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "#ffffff", display: "flex", flexDirection: "column", flex: 1 }}>
          <fieldset disabled={false} style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", flex: 1 }}>
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

            {/* Kategori & Jenis */}
            <div className="row gap-16 wrap">
              <div className="field" style={{ flex: "1 1 160px" }}>
                <label>Kategori</label>
                <select value={form.category} onChange={(e) => onKategoriChange(e.target.value)}>
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: "1 1 160px" }}>
                <label>Jenis Produk</label>
                <select value={form.type} onChange={(e) => onJenisChange(e.target.value)}>
                  {jenisOptions.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input manual jika pilih Lainnya */}
            {form.type === "Lainnya" && (
              <div className="field">
                <label>
                  Jenis Lainnya
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginLeft: 6 }}>
                    (harus berkaitan dengan limbah kelapa)
                  </span>
                </label>
                <input
                  required
                  value={form.customType}
                  onChange={(e) => setField("customType", e.target.value)}
                  placeholder="mis. Sabut Kelapa Olahan, Tempurung Bubuk..."
                />
              </div>
            )}

            <div className="row gap-16 wrap">
              <div className="field" style={{ flex: "1 1 160px" }}>
                <label>Kondisi</label>
                <select value={form.condition} onChange={(e) => setField("condition", e.target.value)}>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                <select value={form.unit} onChange={(e) => setField("unit", e.target.value)}>
                  {(UNITS.includes(form.unit) ? UNITS : [...UNITS, form.unit]).map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
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

        </div>
        </div>

        {/* --- TOMBOL PUBLIKASIKAN --- */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button
            className="btn btn-primary"
            style={{ padding: "14px 40px", borderRadius: 999, fontSize: "1rem", fontWeight: 600, minWidth: 300 }}
            type="submit"
            disabled={saving || !imageFile}
          >
            {saving ? "Mempublikasikan…" : "Publikasikan Produk"}
          </button>
        </div>
      </form>
      <style>{`
        @media (max-width: 800px) {
          .add-product-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .section { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
}
