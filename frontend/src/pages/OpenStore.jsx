import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  Store, MapPin, FileText, ArrowRight, ArrowLeft, Check,
  Sparkles, Lock, User, Phone, Package, ShieldCheck, Zap
} from "lucide-react";
import "./Auth.css";

const STEPS = [
  { id: 1, label: "Informasi Toko" },
  { id: 2, label: "Tinjau" },
  { id: 3, label: "Selesai" },
];

export default function OpenStore() {
  const { user, openStore } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    store_name: user?.store_name || "",
    store_location: user?.store_location || "",
    store_description: user?.store_description || "",
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.is_seller) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const goNext = (e) => {
    e.preventDefault();
    if (!form.store_name.trim() || !form.store_location.trim()) {
      setError("Nama toko dan lokasi wajib diisi.");
      return;
    }
    setError("");
    setStep(2);
  };

  const submit = async () => {
    if (!agreed) {
      setError("Anda harus menyetujui Syarat & Ketentuan terlebih dahulu.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await openStore({
        store_name: form.store_name,
        store_location: form.store_location,
        store_description: form.store_description,
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal membuka toko. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = user?.phone
    ? user.phone.slice(0, 4) + " " + "●".repeat(Math.max(0, user.phone.length - 4))
    : "Belum diisi";

  const backLink = (
    <Link
      to={step === 3 ? "/" : step === 2 ? "#" : "/"}
      onClick={
        step === 2
          ? (e) => { e.preventDefault(); setStep(1); setError(""); }
          : undefined
      }
      style={s.glassBack}
    >
      <ArrowLeft size={15} strokeWidth={2.5} />
      <span>{step === 3 ? "Beranda" : "Kembali"}</span>
    </Link>
  );

  const stepper = (
    <div style={s.stepperRow}>
      {STEPS.map((st, i) => {
        const active = step === st.id;
        const done = step > st.id;
        return (
          <React.Fragment key={st.id}>
            <div style={s.stepItem}>
              <div style={{
                ...s.stepCircle,
                background: done || active ? "#1D1D1F" : "transparent",
                border: done || active ? "none" : "1.5px solid #C7C7CC",
                color: done || active ? "#fff" : "#C7C7CC",
              }}>
                {done ? <Check size={12} strokeWidth={3} /> : st.id}
              </div>
              <span style={{
                ...s.stepLabel,
                color: active ? "#1D1D1F" : done ? "#5C381D" : "#AEAEB2",
                fontWeight: active ? 600 : 400,
              }}>
                {st.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                ...s.stepLine,
                background: step > st.id ? "#1D1D1F" : "#E5E5EA",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  /* ---- STEP 1 ---- */
  const step1 = (
    <div style={s.formCard}>
      <div style={s.heroBanner}>
        <Sparkles size={18} color="#5C381D" />
        <p style={{ fontSize: "0.84rem", color: "#5C381D", fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
          Qlapa AI akan membantu menganalisis foto produk Anda secara otomatis setelah toko aktif.
        </p>
      </div>

      <h1 style={s.heading}>Buka toko di Qlapa</h1>
      <p style={s.subheading}>Mulai jualan limbah kelapa menggunakan akun yang sudah Anda miliki.</p>

      <form onSubmit={goNext} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={s.field}>
          <label style={s.label}>Nama Toko</label>
          <div style={s.inputWrap}>
            <Store size={16} color="#AEAEB2" style={{ flexShrink: 0 }} />
            <input
              type="text"
              required
              placeholder="Contoh: LimbahKita Store"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              style={s.input}
            />
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Lokasi Toko</label>
          <div style={s.inputWrap}>
            <MapPin size={16} color="#AEAEB2" style={{ flexShrink: 0 }} />
            <input
              type="text"
              required
              placeholder="Contoh: Banda Aceh, Aceh"
              value={form.store_location}
              onChange={(e) => setForm({ ...form, store_location: e.target.value })}
              style={s.input}
            />
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>
            Tentang Toko <span style={{ color: "#AEAEB2", fontWeight: 400 }}>(Opsional)</span>
          </label>
          <textarea
            placeholder="Ceritakan tentang produk yang Anda jual, kapasitas, atau keunggulan toko..."
            value={form.store_description}
            onChange={(e) => setForm({ ...form, store_description: e.target.value.slice(0, 200) })}
            style={s.textarea}
          />
          <span style={s.charCount}>{form.store_description.length}/200</span>
        </div>

        {error && <p style={s.errorText}>{error}</p>}

        <button type="submit" style={s.btnPrimary}>
          Lanjutkan
          <ArrowRight size={16} />
        </button>
      </form>

      <div style={s.securityNote}>
        <Lock size={12} color="#AEAEB2" />
        <span>Data toko dapat diubah kapan saja setelah pendaftaran.</span>
      </div>
    </div>
  );

  /* ---- STEP 2 ---- */
  const step2 = (
    <div style={s.formCard}>
      <h1 style={{ ...s.heading, marginBottom: 6 }}>Tinjau informasi toko</h1>
      <p style={{ ...s.subheading, marginBottom: 24 }}>
        Pastikan semua informasi sudah benar sebelum toko dibuat.
      </p>

      <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
        {/* Informasi Pemilik */}
        <div style={s.summaryCard}>
          <p style={s.summaryTitle}>Informasi Pemilik</p>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={s.summaryRow}>
              <div style={s.summaryIcon}><User size={14} color="#5C381D" /></div>
              <div>
                <p style={s.summaryRowLabel}>Nama Pemilik</p>
                <p style={s.summaryRowVal}>{user?.name}</p>
              </div>
            </div>
            <div style={s.summaryRow}>
              <div style={s.summaryIcon}><Phone size={14} color="#5C381D" /></div>
              <div>
                <p style={s.summaryRowLabel}>Nomor Handphone</p>
                <p style={s.summaryRowVal}>{maskedPhone}</p>
              </div>
            </div>
          </div>
          <div style={s.summaryFooter}>
            <span>Nomor HP salah?</span>
            <Link to="/profil" style={s.changeLink}>Ubah di Profil</Link>
          </div>
        </div>

        {/* Detail Toko */}
        <div style={{ ...s.summaryCard, borderColor: "#1D1D1F" }}>
          <p style={s.summaryTitle}>Detail Toko Baru</p>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={s.summaryRow}>
              <div style={s.summaryIcon}><Store size={14} color="#5C381D" /></div>
              <div>
                <p style={s.summaryRowLabel}>Nama Toko</p>
                <p style={s.summaryRowVal}>{form.store_name}</p>
              </div>
            </div>
            <div style={s.summaryRow}>
              <div style={s.summaryIcon}><MapPin size={14} color="#5C381D" /></div>
              <div>
                <p style={s.summaryRowLabel}>Lokasi</p>
                <p style={s.summaryRowVal}>{form.store_location}</p>
              </div>
            </div>
            {form.store_description && (
              <div style={s.summaryRow}>
                <div style={s.summaryIcon}><FileText size={14} color="#5C381D" /></div>
                <div>
                  <p style={s.summaryRowLabel}>Tentang Toko</p>
                  <p style={{ ...s.summaryRowVal, fontWeight: 400, fontSize: "0.82rem", lineHeight: 1.55 }}>
                    {form.store_description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={s.agreeRow}>
        <input
          type="checkbox"
          id="agree"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ accentColor: "#1D1D1F", width: 16, height: 16, cursor: "pointer", flexShrink: 0 }}
        />
        <label htmlFor="agree" style={{ fontSize: "0.84rem", color: "#1D1D1F", cursor: "pointer", lineHeight: 1.5 }}>
          Saya menyetujui{" "}
          <a href="#" style={s.changeLink}>Syarat & Ketentuan</a>{" "}
          serta{" "}
          <a href="#" style={s.changeLink}>Kebijakan Privasi</a>{" "}
          Qlapa Hub untuk penjual.
        </label>
      </div>

      {error && <p style={{ ...s.errorText, marginBottom: 14 }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 10 }}>
        <button
          type="button"
          onClick={() => { setStep(1); setError(""); }}
          disabled={loading}
          style={s.btnOutline}
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          style={s.btnPrimary}
        >
          {loading ? "Memproses..." : "Buat Toko Sekarang"}
        </button>
      </div>
    </div>
  );

  /* ---- STEP 3 ---- */
  const step3 = (
    <div style={{ ...s.formCard, alignItems: "center", textAlign: "center", paddingTop: 20 }}>
      <div style={s.successCircle}>
        <Check size={32} color="#1D1D1F" strokeWidth={2.5} />
      </div>
      <h1 style={{ ...s.heading, fontSize: "1.9rem", marginTop: 20, marginBottom: 8 }}>
        Tokomu berhasil dibuat!
      </h1>
      <p style={{ color: "#6E6E73", fontSize: "0.92rem", lineHeight: 1.7, maxWidth: 320, marginBottom: 32 }}>
        Kamu sudah bisa menambahkan produk dan mulai berjualan di Qlapa.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        <button onClick={() => navigate("/dashboard/tambah-produk")} style={s.btnPrimary}>
          <Package size={16} />
          Tambah Produk Pertama
          <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate("/dashboard")} style={s.btnOutline}>
          Ke Dashboard Toko
        </button>
      </div>
    </div>
  );

  const wizard = (
    <>
      {stepper}
      {step === 1 && step1}
      {step === 2 && step2}
      {step === 3 && step3}
    </>
  );

  return (
    <div className="auth-page">
      <style>{`
        @media (max-width: 768px) {
          .open-store-features {
            display: none !important;
          }
        }
      `}</style>

      {/* Left: branding panel with image background */}
      <div
        className="auth-panel auth-panel--image"
        style={{ backgroundImage: "url('/assets/klapa.png')" }}
      >
        <div className="auth-panel-overlay" />
        <div
          className="auth-panel-content"
          style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 40 }}
        >
          <div>
            <Link to="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 40 }}>
              <img src="/assets/qlapa-logo.png" alt="Qlapa" className="auth-logo-img" />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>Hub</span>
            </Link>

            <h2 style={{ fontSize: "2.2rem", fontWeight: 400, lineHeight: 1.05, color: "#fff", marginBottom: 16 }}>
              Buka Toko Limbah Kelapa Anda
            </h2>
            <p style={{ fontSize: "0.92rem", color: "rgba(255, 255, 255, 0.72)", lineHeight: 1.3, maxWidth: 320 }}>
              Bergabunglah dengan ratusan pemasok di Qlapa Hub. Pasarkan tempurung, sabut, ampas, dan daun kelapa secara luas dan digital.
            </p>
          </div>

          {/* Features list inside left panel - hidden on small screen by custom CSS */}
          <div className="open-store-features" style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 24 }}>
            {[
              {
                Icon: Zap,
                title: "Analisis Foto AI Otomatis",
                desc: "Unggah foto limbah kelapa Anda, AI kami akan menganalisis nama, jenis, dan estimasi stok secara instan.",
              },
              {
                Icon: ShieldCheck,
                title: "Sistem Rekening Bersama (Escrow)",
                desc: "Pembayaran dari pembeli disimpan aman oleh platform hingga produk sampai ke alamat tujuan.",
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={s.featureItem}>
                <div style={s.featureIcon}>
                  <Icon size={18} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ ...s.featureTitle, fontFamily: "inherit" }}>{title}</p>
                  <p style={s.featureDesc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="auth-panel auth-panel--form" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            {backLink}
          </div>
          <div style={{ flex: 1 }}>
            {wizard}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─── */
const s = {
  /* Desktop split */
  desktopShell: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
  leftPane: {
    flex: "0 0 42%",
    background: "linear-gradient(150deg, #2F5233 0%, #1A301D 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px 72px",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  leftContent: { maxWidth: 420 },
  leftHeading: {
    fontSize: "2.4rem",
    fontWeight: 700,
    lineHeight: 1.2,
    color: "#fff",
    letterSpacing: "-0.02em",
    marginBottom: 16,
    marginTop: 0,
  },
  leftSub: {
    fontSize: "0.98rem",
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 40,
    marginTop: 0,
  },
  featureItem: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: "0.92rem",
    fontWeight: 600,
    color: "#fff",
    margin: "0 0 3px 0",
  },
  featureDesc: {
    fontSize: "0.8rem",
    lineHeight: 1.3,
    color: "rgba(255,255,255,0.6)",
    margin: 0,
  },
  rightPane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    height: "100vh",
    overflowY: "auto",
  },
  rightPaneTop: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "28px 48px 0",
    flexShrink: 0,
  },
  rightPaneScroll: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 48px 60px",
    boxSizing: "border-box",
  },
  /* Mobile */
  mobilePage: {
    minHeight: "100vh",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    WebkitFontSmoothing: "antialiased",
    width: "100%",
  },
  mobileHeader: {
    width: "100%",
    maxWidth: 520,
    padding: "20px 20px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
  },
  /* Glass back button */
  glassBack: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 16px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.05)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(0,0,0,0.08)",
    color: "#1D1D1F",
    fontSize: "0.84rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  /* Stepper */
  stepperRow: {
    display: "flex",
    alignItems: "center",
    padding: "28px 0 20px",
    width: "100%",
    maxWidth: 400,
    justifyContent: "center",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7,
  },
  stepCircle: {
    width: 27,
    height: 27,
    borderRadius: "50%",
    fontSize: "0.76rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s",
  },
  stepLabel: {
    fontSize: "0.72rem",
    letterSpacing: "0.01em",
    transition: "color 0.3s",
    whiteSpace: "nowrap",
  },
  stepLine: {
    height: 1.5,
    width: 72,
    marginBottom: 24,
    transition: "background 0.3s",
  },
  /* Form card */
  formCard: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
  },
  heroBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "#FAF4ED",
    border: "1px solid #F0E0CB",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 24,
  },
  heading: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: "1.9rem",
    fontWeight: 700,
    color: "#1D1D1F",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    margin: "0 0 8px 0",
  },
  subheading: {
    color: "#6E6E73",
    fontSize: "0.9rem",
    lineHeight: 1.6,
    margin: "0 0 24px 0",
  },
  /* Form fields */
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: "0.84rem",
    fontWeight: 600,
    color: "#1D1D1F",
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1.5px solid #E5E5EA",
    borderRadius: 10,
    padding: "11px 14px",
    background: "#fff",
    transition: "border-color 0.2s",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "0.9rem",
    color: "#1D1D1F",
    background: "transparent",
    minWidth: 0,
  },
  textarea: {
    width: "100%",
    border: "1.5px solid #E5E5EA",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: "0.9rem",
    color: "#1D1D1F",
    resize: "none",
    height: 90,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.5,
  },
  charCount: {
    fontSize: "0.74rem",
    color: "#AEAEB2",
    textAlign: "right",
    marginTop: 3,
  },
  errorText: {
    fontSize: "0.84rem",
    color: "#FF3B30",
    margin: "0 0 4px 0",
    fontWeight: 500,
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#1D1D1F",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "14px 20px",
    fontSize: "0.92rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
    width: "100%",
  },
  btnOutline: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "transparent",
    color: "#1D1D1F",
    border: "1.5px solid #E5E5EA",
    borderRadius: 10,
    padding: "14px 20px",
    fontSize: "0.92rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
  },
  securityNote: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    fontSize: "0.78rem",
    color: "#AEAEB2",
    fontWeight: 400,
  },
  /* Summary cards */
  summaryCard: {
    border: "1px solid #E5E5EA",
    borderRadius: 12,
    padding: "16px 18px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  summaryTitle: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#AEAEB2",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "0 0 12px 0",
  },
  summaryRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: "#FAF4ED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  summaryRowLabel: {
    fontSize: "0.72rem",
    color: "#AEAEB2",
    margin: "0 0 2px 0",
    fontWeight: 500,
  },
  summaryRowVal: {
    fontSize: "0.88rem",
    color: "#1D1D1F",
    fontWeight: 600,
    margin: 0,
  },
  summaryFooter: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTop: "1px solid #F2F2F7",
    fontSize: "0.78rem",
    color: "#AEAEB2",
  },
  changeLink: {
    color: "#5C381D",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: "0.78rem",
  },
  agreeRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  /* Success */
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#F2F2F7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};