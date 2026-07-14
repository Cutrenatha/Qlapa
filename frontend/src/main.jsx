import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./styles/global.css";

const GOOGLE_CLIENT_ID = "476986015276-805dhprpatpn6o8ij3dejv6efusrcauv.apps.googleusercontent.com";

/* ── Global Error Boundary ── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Render crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif",
          background: "#FBF7EF", color: "#1D1D1F", padding: "40px 20px", textAlign: "center",
        }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 8px" }}>Terjadi Kesalahan</h2>
          <p style={{ color: "#6E6E73", fontSize: "0.9rem", marginBottom: 24, maxWidth: 380 }}>
            Halaman ini mengalami error tak terduga. Coba refresh halaman atau kembali ke beranda.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "#5C381D", color: "#fff", border: "none", borderRadius: 999, padding: "12px 24px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}
            >
              Refresh Halaman
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
              style={{ background: "transparent", color: "#5C381D", border: "1.5px solid #5C381D", borderRadius: 999, padding: "12px 24px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}
            >
              Ke Beranda
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ marginTop: 24, fontSize: "0.72rem", color: "#991B1B", background: "#FEE2E2", padding: "12px 16px", borderRadius: 10, maxWidth: "100%", overflowX: "auto", textAlign: "left" }}>
              {String(this.state.error)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <ToastProvider>
            <AdminAuthProvider>
              <AuthProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </AuthProvider>
            </AdminAuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
