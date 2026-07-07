import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  Store, MapPin, FileText, ArrowRight, ArrowLeft, Check,
  Sparkles, Lock, User, Phone, Package
} from "lucide-react";

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
    ? user.phone.slice(0, 4) + " " + "●".repeat(user.phone.length - 4)
    : "Belum diisi";

  return (
    <div style={styles.page}>
      {/* Header Khusus Buka Toko */}
      <header style={styles.openStoreHeader}>
        <Link to="/" style={{ display: "flex", alignItems: "center" }}>
          <img src="/assets/qlapa-logo.png" alt="Qlapa" style={{ height: 32, width: "auto" }} />
        </Link>
        <Link
          to={step === 3 ? "/" : step === 2 ? "#" : "/"}
          onClick={step === 2 ? (e) => { e.preventDefault(); setStep(1); setError(""); } : undefined}
          style={styles.glassBackLink}
        >
          <ArrowLeft size={16} />
          <span>{step === 3 ? "Beranda" : "Kembali"}</span>
        </Link>
      </header>

      {/* Stepper */}
      <div style={styles.stepperWrap}>
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div style={styles.stepItem}>
                <div
                  style={{
                    ...styles.stepCircle,
                    background: isDone ? "#1D1D1F" : isActive ? "#1D1D1F" : "transparent",
                    border: isDone || isActive ? "none" : "1.5px solid #C7C7CC",
                    color: isDone || isActive ? "#fff" : "#C7C7CC",
                  }}
                >
                  {isDone ? <Check size={13} strokeWidth={2.5} /> : s.id}
                </div>
                <span
                  style={{
                    ...styles.stepLabel,
                    color: isActive ? "#1D1D1F" : isDone ? "#5C381D" : "#AEAEB2",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    ...styles.stepLine,
                    background: step > s.id ? "#1D1D1F" : "#E5E5EA",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ─── STEP 1: Form Informasi Toko ─── */}
      {step === 1 && (
        <div style={styles.content}>
          <div style={styles.card}>
            {/* Hero banner */}
            <div style={styles.heroBanner}>
              <div style={styles.heroIcon}>
                <Sparkles size={22} color="#5C381D" />
              </div>
              <div>
                <p style={{ fontSize: "0.86rem", color: "#5C381D", fontWeight: 500, margin: 0 }}>
                  Setelah toko dibuat, Qlapa AI akan membantu Anda menyusun
                  informasi produk dari foto yang diunggah.
                </p>
              </div>
            </div>

            <h1 style={styles.heading}>
              Buka tokomu<br />di Qlapa
            </h1>
            <p style={{ color: "#6E6E73", fontSize: "0.92rem", marginBottom: 28, lineHeight: 1.6 }}>
              Mulai jualan limbah kelapa dengan akun yang sudah Anda miliki.
            </p>

            <form onSubmit={goNext}>
              {/* Nama Toko */}
              <div style={styles.field}>
                <label style={styles.label}>Nama Toko</label>
                <div style={styles.inputWrap}>
                  <Store size={16} color="#AEAEB2" style={styles.inputIcon} />
                  <input
                    required
                    value={form.store_name}
                    onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                    placeholder="Contoh: LimbahKita Store"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Lokasi Toko */}
              <div style={styles.field}>
                <label style={styles.label}>Lokasi Toko</label>
                <div style={styles.inputWrap}>
                  <MapPin size={16} color="#AEAEB2" style={styles.inputIcon} />
                  <input
                    required
                    value={form.store_location}
                    onChange={(e) => setForm({ ...form, store_location: e.target.value })}
                    placeholder="Contoh: Banda Aceh, Aceh"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Tentang Toko <span style={{ color: "#AEAEB2", fontWeight: 400 }}>(Opsional)</span>
                </label>
                <textarea
                  value={form.store_description}
                  onChange={(e) => setForm({ ...form, store_description: e.target.value })}
                  placeholder="Ceritakan sedikit tentang toko Anda, produk yang dijual, atau keunggulan toko Anda."
                  maxLength={200}
                  style={{ ...styles.input, height: 100, resize: "none", paddingLeft: 14, paddingTop: 12 }}
                />
                <span style={{ fontSize: "0.78rem", color: "#AEAEB2", display: "block", textAlign: "right", marginTop: 4 }}>
                  {form.store_description.length}/200
                </span>
              </div>

              {error && <p style={styles.errorMsg}>{error}</p>}

              <button type="submit" style={styles.btnPrimary}>
                Lanjutkan <ArrowRight size={16} />
              </button>
            </form>

            <div style={styles.securityNote}>
              <Lock size={13} color="#AEAEB2" />
              <span>Informasi yang Anda berikan aman dan hanya digunakan untuk keperluan toko Anda.</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Tinjau ─── */}
      {step === 2 && (
        <div style={styles.content}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, maxWidth: 780, width: "100%" }}>
            {/* Kiri */}
            <div>
              <h1 style={{ ...styles.heading, fontSize: "2rem", marginBottom: 8 }}>
                Tinjau informasi<br />toko Anda
              </h1>
              <p style={{ color: "#6E6E73", fontSize: "0.9rem", marginBottom: 28, lineHeight: 1.6 }}>
                Pastikan semua informasi sudah benar sebelum toko dibuat.
              </p>

              {/* Info Akun */}
              <div style={styles.reviewCard}>
                <p style={styles.reviewSection}>Informasi Akun</p>
                <div style={styles.reviewRow}>
                  <User size={15} color="#AEAEB2" style={{ flexShrink: 0 }} />
                  <span style={styles.reviewVal}>{user?.email}</span>
                </div>
                <div style={styles.reviewRow}>
                  <Phone size={15} color="#AEAEB2" style={{ flexShrink: 0 }} />
                  <span style={styles.reviewVal}>{maskedPhone}</span>
                  <Link to="/profil" style={styles.reviewEditLink}>Ubah</Link>
                </div>
                <div style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ accentColor: "#1D1D1F", width: 16, height: 16, cursor: "pointer", flexShrink: 0 }}
                  />
                  <label htmlFor="agree" style={{ fontSize: "0.85rem", color: "#1D1D1F", cursor: "pointer", lineHeight: 1.5 }}>
                    Saya menyetujui{" "}
                    <span style={{ fontWeight: 600, textDecoration: "underline" }}>Syarat & Ketentuan Qlapa</span>{" "}
                    sebagai penjual.
                  </label>
                </div>
              </div>

              {error && <p style={{ ...styles.errorMsg, marginTop: 12 }}>{error}</p>}

              {/* Navigasi */}
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button onClick={() => { setStep(1); setError(""); }} style={styles.btnOutline}>
                  <ArrowLeft size={15} /> Kembali
                </button>
                <button onClick={submit} disabled={loading} style={{ ...styles.btnPrimary, flex: 1 }}>
                  {loading ? "Membuat Toko…" : "Buat Toko"} {!loading && <ArrowRight size={16} />}
                </button>
              </div>
            </div>

            {/* Kanan: Ringkasan Toko */}
            <div style={styles.summaryCard}>
              <p style={styles.reviewSection}>Informasi Toko</p>

              <div style={styles.summaryRow}>
                <div style={styles.summaryIcon}><Store size={15} color="#5C381D" /></div>
                <div>
                  <p style={styles.summaryRowLabel}>Nama Toko</p>
                  <p style={styles.summaryRowVal}>{form.store_name}</p>
                </div>
              </div>

              <div style={styles.summaryRow}>
                <div style={styles.summaryIcon}><MapPin size={15} color="#5C381D" /></div>
                <div>
                  <p style={styles.summaryRowLabel}>Lokasi Toko</p>
                  <p style={styles.summaryRowVal}>{form.store_location}</p>
                </div>
              </div>

              {form.store_description && (
                <div style={styles.summaryRow}>
                  <div style={styles.summaryIcon}><FileText size={15} color="#5C381D" /></div>
                  <div>
                    <p style={styles.summaryRowLabel}>Tentang Toko</p>
                    <p style={{ ...styles.summaryRowVal, fontWeight: 400, fontSize: "0.82rem", lineHeight: 1.55 }}>
                      {form.store_description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Selesai ─── */}
      {step === 3 && (
        <div style={{ ...styles.content, flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 40 }}>
          {/* Confetti dots decoration */}
          <div style={styles.successDots}>
            {["#F7EFE4", "#B38250", "#E5E5EA", "#5C381D", "#F0F6EF", "#85532E"].map((c, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: i % 2 === 0 ? 8 : 5,
                  height: i % 2 === 0 ? 8 : 5,
                  borderRadius: "50%",
                  background: c,
                  top: `${15 + i * 12}%`,
                  left: `${8 + i * 14}%`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>

          {/* Success circle */}
          <div style={styles.successCircle}>
            <Check size={32} color="#1D1D1F" strokeWidth={2.5} />
          </div>

          <h1 style={{ ...styles.heading, fontSize: "2rem", marginTop: 24, marginBottom: 8 }}>
            Tokomu berhasil dibuat!
          </h1>
          <p style={{ color: "#6E6E73", fontSize: "0.92rem", lineHeight: 1.7, maxWidth: 340, marginBottom: 36 }}>
            Sekarang kamu sudah bisa menambahkan produk dan mulai jualan di Qlapa.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340 }}>
            <button
              onClick={() => navigate("/dashboard/tambah-produk")}
              style={styles.btnPrimary}
            >
              <Package size={16} />
              Tambah Produk Pertama
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              style={styles.btnOutline}
            >
              Ke Dashboard Toko
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
    WebkitFontSmoothing: "antialiased",
    width: "100%",
  },
  openStoreHeader: {
    width: "100%",
    maxWidth: 1000,
    padding: "24px 24px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
  },
  glassBackLink: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    borderRadius: 999,
    background: "rgba(0, 0, 0, 0.04)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    color: "#1D1D1F",
    fontSize: "0.85rem",
    fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
  stepperWrap: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    padding: "28px 0 20px",
    width: "100%",
    maxWidth: 400,
    justifyContent: "center",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    fontSize: "0.78rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s",
  },
  stepLabel: {
    fontSize: "0.74rem",
    letterSpacing: "0.01em",
    transition: "color 0.3s",
    whiteSpace: "nowrap",
  },
  stepLine: {
    height: 1.5,
    width: 80,
    marginBottom: 24,
    transition: "background 0.3s",
  },
  content: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "8px 20px 60px",
    width: "100%",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: 420,
  },
  heroBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "#FAF4ED",
    border: "1px solid #F0E0CB",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 28,
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#F7EFE4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heading: {
    fontSize: "2.4rem",
    fontFamily: "'DM Serif Display', serif",
    fontWeight: 600,
    color: "#1D1D1F",
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    margin: "0 0 8px",
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    fontSize: "0.86rem",
    fontWeight: 600,
    color: "#1D1D1F",
    marginBottom: 8,
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    pointerEvents: "none",
    flexShrink: 0,
  },
  input: {
    width: "100%",
    padding: "12px 14px 12px 40px",
    borderRadius: 10,
    border: "1.5px solid #E5E5EA",
    fontSize: "0.92rem",
    color: "#1D1D1F",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "14px 24px",
    borderRadius: 999,
    background: "#1D1D1F",
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    marginTop: 4,
    transition: "background 0.2s",
    fontFamily: "inherit",
  },
  btnOutline: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "13px 24px",
    borderRadius: 999,
    background: "transparent",
    color: "#1D1D1F",
    fontSize: "0.9rem",
    fontWeight: 600,
    border: "1.5px solid #1D1D1F",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  securityNote: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    color: "#AEAEB2",
    fontSize: "0.78rem",
  },
  errorMsg: {
    fontSize: "0.84rem",
    color: "#FF3B30",
    marginBottom: 12,
    lineHeight: 1.5,
    margin: 0,
  },

  // Review card
  reviewCard: {
    background: "#FAFAFA",
    border: "1px solid #F2F2F7",
    borderRadius: 14,
    padding: "20px 20px 16px",
  },
  reviewSection: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#AEAEB2",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 14,
  },
  reviewRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  reviewVal: {
    fontSize: "0.9rem",
    color: "#1D1D1F",
    flex: 1,
  },
  reviewEditLink: {
    fontSize: "0.82rem",
    color: "#5C381D",
    fontWeight: 600,
    textDecoration: "none",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid #F2F2F7",
  },

  // Summary card (right side in step 2)
  summaryCard: {
    background: "#FAFAFA",
    border: "1px solid #F2F2F7",
    borderRadius: 14,
    padding: "20px",
    height: "fit-content",
    alignSelf: "flex-start",
    marginTop: 8,
  },
  summaryRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#F7EFE4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  summaryRowLabel: {
    fontSize: "0.74rem",
    color: "#AEAEB2",
    fontWeight: 600,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  summaryRowVal: {
    fontSize: "0.9rem",
    color: "#1D1D1F",
    fontWeight: 600,
    margin: 0,
  },

  // Success
  successDots: {
    position: "relative",
    width: 200,
    height: 100,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#F2EFE8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
};
