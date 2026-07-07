import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { MapPin, Truck, Store, ShieldCheck, Info, Plus, Minus, Trash2 } from "lucide-react";

export default function Checkout() {
  const { items, total, updateQty, removeItem, clearCart } = useCart();
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [shippingMethod, setShippingMethod] = useState("kirim"); // "kirim" | "pickup"
  const [loading, setLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      showToast("Silakan masuk terlebih dahulu untuk melakukan checkout", "warning");
      navigate("/masuk");
    }
  }, [authLoading, user, navigate]);

  // Load Midtrans Snap JS dynamically
  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "Mid-client-xM7xOz3e4SZ3wfuV";

    let script = document.querySelector(`script[src="${snapScript}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = snapScript;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Memuat sesi...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="section container" style={{ maxWidth: 640, minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', borderRadius: 20 }}>
          <span style={{ fontSize: '3rem' }}>🛒</span>
          <h2 style={{ marginTop: 16, marginBottom: 8, color: 'var(--ink)' }}>Keranjang Checkout Kosong</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 24, fontSize: '0.92rem' }}>Anda tidak memiliki item untuk dibayar.</p>
          <Link to="/produk" className="btn btn-primary">
            Lihat Katalog Produk
          </Link>
        </div>
      </div>
    );
  }

  // Cost Breakdown
  const subtotal = total;
  const adminFee = Math.round(subtotal * 0.10);
  
  // Calculate unique sellers
  const uniqueSellerIds = new Set(items.map(item => item.product.seller_id));
  const numSellers = uniqueSellerIds.size;
  const shippingCost = shippingMethod === "kirim" ? 10000 * numSellers : 0;
  const grandTotal = subtotal + adminFee + shippingCost;

  const hasAddress = !!user?.address;
  const isAddressRequired = shippingMethod === "kirim";
  const canCheckout = !isAddressRequired || hasAddress;

  const handleIncrease = (item) => {
    if (item.qty >= item.product.stock) {
      showToast(`Stok tidak mencukupi (maksimal ${item.product.stock})`, "error");
      return;
    }
    updateQty(item.product.id, item.qty + 1);
  };

  const handleDecrease = (item) => {
    if (item.qty <= 1) {
      removeItem(item.product.id);
    } else {
      updateQty(item.product.id, item.qty - 1);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canCheckout) {
      showToast("Alamat pengiriman wajib diisi di profil Anda", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Post to backend to create orders and get snap_token
      const res = await api.post("/orders", {
        items: items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
        shipping_address: shippingMethod === "kirim" ? user.address : "Ambil Sendiri (Pick Up)",
        shipping_method: shippingMethod,
      });

      const { snap_token } = res.data;

      if (!snap_token) {
        throw new Error("Gagal memperoleh Snap Token dari Midtrans");
      }

      // 2. Trigger Midtrans Snap Popup
      if (window.snap) {
        window.snap.pay(snap_token, {
          onSuccess: async function (result) {
            try {
              await api.post("/orders/pay-success", { snap_token });
            } catch (err) {
              console.error("Fallback pay-success error:", err);
            }
            clearCart();
            showToast("Pembayaran berhasil! Dana escrow ditahan aman.");
            navigate("/pesanan");
          },
          onPending: async function (result) {
            try {
              await api.post("/orders/pay-success", { snap_token });
            } catch (err) {
              console.error("Fallback pay-success error:", err);
            }
            clearCart();
            showToast("Pembayaran pending. Selesaikan proses pembayaran Anda.");
            navigate("/pesanan");
          },
          onError: function (result) {
            showToast("Pembayaran gagal. Silakan coba lagi.", "error");
          },
          onClose: function () {
            showToast("Anda menutup popup pembayaran sebelum selesai.", "warning");
          }
        });
      } else {
        showToast("Midtrans SDK belum termuat. Coba beberapa saat lagi.", "error");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      showToast(err.response?.data?.error || "Gagal membuat pesanan", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section container" style={{ maxWidth: 1040, minHeight: '80vh', paddingBottom: 60 }}>
      <h1 style={{ fontSize: "2.4rem", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 28, color: "var(--ink)" }}>Checkout</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "32px" }} className="checkout-layout">
        {/* Kiri: Daftar Produk, Pengiriman, Alamat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* List Produk */}
          <div className="card" style={{ padding: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)", borderRadius: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, color: "var(--ink)" }}>Produk yang Dicheckout</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div 
                  key={item.product.id} 
                  style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    paddingBottom: '16px', 
                    borderBottom: '1px solid var(--line)', 
                    alignItems: 'center' 
                  }}
                >
                  {/* Foto Produk */}
                  <img 
                    src={item.product.image_url || "/assets/placeholder.jpg"} 
                    alt={item.product.name} 
                    style={{ 
                      width: '76px', 
                      height: '76px', 
                      borderRadius: '12px', 
                      objectFit: 'cover',
                      background: 'var(--cream-2)' 
                    }} 
                  />
                  
                  {/* Detail Produk */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px 0' }}>
                      {item.product.name}
                    </h4>
                    
                    {/* Specs tags */}
                    <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                      <span className="badge badge-sm" style={{ fontSize: '0.72rem', background: item.product.condition === 'Segar' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(92, 61, 46, 0.1)', color: item.product.condition === 'Segar' ? '#248a3d' : 'var(--brand)' }}>
                        {item.product.condition}
                      </span>
                      {item.product.weight && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                          ⚖️ {item.product.weight}
                        </span>
                      )}
                      {item.product.moisture && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                          💧 {item.product.moisture}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)' }}>
                      Rp{item.product.price.toLocaleString("id-ID")} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--ink-soft)' }}>/ {item.product.unit || 'kg'}</span>
                    </div>
                  </div>

                  {/* Quantity Editor */}
                  <div className="row gap-8" style={{ alignItems: 'center', background: 'var(--cream-2)', padding: '4px 8px', borderRadius: '20px' }}>
                    <button 
                      type="button" 
                      onClick={() => handleDecrease(item)} 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <Minus size={14} color="var(--ink)" />
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                      {item.qty}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleIncrease(item)} 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <Plus size={14} color="var(--ink)" />
                    </button>
                  </div>

                  {/* Subtotal Item */}
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ink)' }}>
                      Rp{(item.product.price * item.qty).toLocaleString("id-ID")}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeItem(item.product.id)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ff3b30', marginTop: 4, padding: 0 }}
                      title="Hapus produk"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opsi Pengiriman */}
          <div className="card" style={{ padding: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)", borderRadius: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, color: "var(--ink)" }}>Metode Pengiriman</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              
              {/* Opsi Kirim */}
              <div
                onClick={() => setShippingMethod("kirim")}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: `2px solid ${shippingMethod === "kirim" ? "var(--brand)" : "rgba(0,0,0,0.06)"}`,
                  background: shippingMethod === "kirim" ? "rgba(92, 61, 46, 0.04)" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div className="row gap-8" style={{ alignItems: "center", marginBottom: 6 }}>
                  <Truck size={18} color={shippingMethod === "kirim" ? "var(--brand)" : "var(--ink-soft)"} />
                  <strong style={{ fontSize: "0.92rem", color: "var(--ink)" }}>Kirim ke Alamat</strong>
                </div>
                <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Tarif flat Rp10.000{numSellers > 1 ? ` x ${numSellers} toko` : ""}
                </span>
              </div>

              {/* Opsi Pick Up */}
              <div
                onClick={() => setShippingMethod("pickup")}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: `2px solid ${shippingMethod === "pickup" ? "var(--brand)" : "rgba(0,0,0,0.06)"}`,
                  background: shippingMethod === "pickup" ? "rgba(92, 61, 46, 0.04)" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div className="row gap-8" style={{ alignItems: "center", marginBottom: 6 }}>
                  <Store size={18} color={shippingMethod === "pickup" ? "var(--brand)" : "var(--ink-soft)"} />
                  <strong style={{ fontSize: "0.92rem", color: "var(--ink)" }}>Ambil Sendiri</strong>
                </div>
                <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                  Gratis / Tanpa Ongkir
                </span>
              </div>
            </div>
          </div>

          {/* Alamat Pengiriman (Read-only & Autocomplete di Profil) */}
          {shippingMethod === "kirim" ? (
            <div className="card" style={{ padding: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)", borderRadius: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, color: "var(--ink)" }}>Alamat Pengiriman</h3>
              
              {hasAddress ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(92, 61, 46, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(92, 61, 46, 0.1)' }}>
                  <MapPin size={20} color="var(--brand)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.92rem', color: 'var(--ink)', lineHeight: 1.5, display: 'block' }}>
                      {user.address}
                    </span>
                    <Link 
                      to="/profil" 
                      style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--brand)', 
                        fontWeight: 600, 
                        textDecoration: 'none', 
                        display: 'inline-block', 
                        marginTop: 10 
                      }}
                    >
                      Ubah Alamat di Profil &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(255, 59, 48, 0.04)', padding: '20px', borderRadius: '12px', border: '1.5px solid #ff3b30' }}>
                  <Info size={22} color="#ff3b30" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', color: '#ff3b30', fontSize: '0.95rem', marginBottom: 4 }}>Alamat Pengiriman Belum Diisi!</strong>
                    <p style={{ color: 'rgba(255, 59, 48, 0.9)', fontSize: '0.86rem', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                      Anda harus menyimpan alamat utama terlebih dahulu di halaman Profil Anda sebelum melanjutkan checkout dengan pengiriman kurir.
                    </p>
                    <Link 
                      to="/profil" 
                      className="btn" 
                      style={{ 
                        background: '#ff3b30', 
                        color: '#fff', 
                        fontSize: '0.84rem', 
                        padding: '10px 18px', 
                        borderRadius: '8px', 
                        textDecoration: 'none',
                        display: 'inline-block',
                        fontWeight: 600
                      }}
                    >
                      Isi Alamat Sekarang di Profil
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)", borderRadius: "16px", background: "rgba(0,0,0,0.02)" }}>
              <div className="row gap-12" style={{ alignItems: "flex-start" }}>
                <Info size={20} color="var(--brand)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong style={{ display: "block", color: "var(--ink)", fontSize: "0.95rem", marginBottom: 4 }}>Ambil di Lokasi Penjual</strong>
                  <p style={{ color: "var(--ink-soft)", fontSize: "0.86rem", lineHeight: 1.5, margin: 0 }}>
                    Anda dapat mengambil produk secara langsung di lokasi fisik masing-masing penjual setelah pesanan dikonfirmasi. Alamat dan kontak penjual akan tersedia di halaman detail pesanan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Banner Escrow */}
          <div className="card" style={{ padding: 18, background: "rgba(52, 199, 89, 0.05)", border: "1px solid rgba(52, 199, 89, 0.18)", borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <ShieldCheck size={20} color="#34C759" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', color: 'var(--green-900)', fontSize: '0.88rem', marginBottom: 4 }}>Pembayaran Aman Escrow Qlapa</strong>
              <p style={{ color: 'var(--green-800)', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                Dana Anda ditahan aman oleh pihak ketiga (Qlapa) hingga barang sampai dan Anda konfirmasi. Dana baru akan dicairkan ke penjual setelahnya.
              </p>
            </div>
          </div>

        </div>

        {/* Kanan: Ringkasan Tagihan */}
        <div>
          <div className="card" style={{ padding: 24, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "var(--shadow-sm)", borderRadius: "16px", position: "sticky", top: "100px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, color: "var(--ink)" }}>Ringkasan Tagihan</h3>
            
            <div style={{ display: "grid", gap: "12px", marginBottom: 24 }}>
              <div className="row between" style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                <span>Subtotal Produk</span>
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>Rp{subtotal.toLocaleString("id-ID")}</span>
              </div>
              
              <div className="row between" style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                <span>Admin Aplikasi (10%)</span>
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>Rp{adminFee.toLocaleString("id-ID")}</span>
              </div>

              <div className="row between" style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                <span>Ongkos Kirim</span>
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>
                  {shippingCost > 0 ? `Rp${shippingCost.toLocaleString("id-ID")}` : "Gratis"}
                </span>
              </div>

              <div className="row between" style={{ marginTop: 12, paddingTop: 14, borderTop: "1px dashed var(--line)", fontWeight: 700, fontSize: "1.2rem", color: "var(--ink)" }}>
                <span>Total Bayar</span>
                <span style={{ color: "var(--brand)" }}>Rp{grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {canCheckout ? (
              <button 
                className="btn btn-primary btn-block" 
                style={{ padding: "14px 24px", borderRadius: "12px" }} 
                onClick={submit}
                disabled={loading}
              >
                {loading ? "Memproses…" : "Bayar Sekarang"}
              </button>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                <button 
                  className="btn btn-block" 
                  style={{ padding: "14px 24px", borderRadius: "12px", background: '#ccc', color: '#666', cursor: 'not-allowed', border: 'none' }} 
                  disabled
                >
                  Alamat Belum Diisi
                </button>
                <Link 
                  to="/profil" 
                  className="btn btn-outline btn-block" 
                  style={{ padding: "12px 24px", borderRadius: "12px", textAlign: 'center', textDecoration: 'none', fontSize: '0.88rem' }}
                >
                  Lengkapi Alamat di Profil
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
