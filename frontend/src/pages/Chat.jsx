import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Send, MessageSquare, User, X, ChevronLeft, ShoppingCart } from "lucide-react";
import "./Chat.css";

const STATIC_PRODUCTS = [
  { id: "s1", name: "Sabut Kelapa Segar", price: 8000, staticImg: "/assets/sabut_segar.jpg", seller: { store_name: "Toko Hijau Nusantara" } },
  { id: "s2", name: "Ampas Kelapa Segar", price: 3000, staticImg: "/assets/ampas_segar.jpg", seller: { store_name: "CV Kelapa Makmur" } },
  { id: "s3", name: "Tempurung Kelapa", price: 5500, staticImg: "/assets/tempurung.jpg", seller: { store_name: "Usaha Batok Minang" } },
  { id: "s4", name: "Daun Kelapa Kering", price: 5000, staticImg: "/assets/daun_kering.jpg", seller: { store_name: "Toko Hijau Nusantara" } },
  { id: "s5", name: "Sabut Kelapa Kering", price: 6500, staticImg: "/assets/sabut_kering.jpg", seller: { store_name: "UD Sabut Utara" } },
  { id: "s6", name: "Arang Batok Kelapa", price: 12000, staticImg: "/assets/arang_batok.jpg", seller: { store_name: "Lombok Charcoal Co." } },
];

export default function Chat() {
  const { user } = useAuth();
  const { addItem, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(params.get("to") ? Number(params.get("to")) : null);
  const [activeName, setActiveName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const productId = params.get("product");

  const [contextProduct, setContextProduct] = useState(null);
  const [showContext, setShowContext] = useState(true);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Silakan masuk terlebih dahulu untuk menambahkan ke keranjang", "error");
      navigate("/masuk");
      return;
    }
    addItem(contextProduct, 1);
    showToast(`${contextProduct.name} ditambahkan ke keranjang`);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Silakan masuk terlebih dahulu untuk membeli", "error");
      navigate("/masuk");
      return;
    }
    clearCart();
    addItem(contextProduct, 1);
    navigate("/checkout");
  };

  const loadThreads = () => api.get("/chat/threads").then((res) => setThreads(res.data));

  const loadMessages = (id) => {
    api.get(`/chat/${id}`).then((res) => {
      setMessages(res.data);
      // Auto-detect product context from message history (persist across sessions)
      if (!productId) {
        const msgWithProduct = [...res.data].reverse().find(m => m.product_id);
        if (msgWithProduct) {
          const pid = msgWithProduct.product_id;
          const pidStr = pid.toString();
          if (pidStr.startsWith("s")) {
            const found = STATIC_PRODUCTS.find(p => p.id === pidStr);
            if (found) { setContextProduct(found); setShowContext(true); }
          } else {
            api.get(`/products/${pid}`)
              .then(r => { setContextProduct(r.data); setShowContext(true); })
              .catch(() => {});
          }
        }
      }
    });
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
  };

  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const interval = setInterval(() => loadMessages(activeId), 3000);
    return () => clearInterval(interval);
  }, [activeId]);

  // Scroll to bottom when thread changes
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId]);

  // Scroll to bottom only when actual messages length increases (prevents scrolling on poll intervals)
  const prevLengthRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Fetch product context details
  useEffect(() => {
    if (productId) {
      if (productId.toString().startsWith("s")) {
        const found = STATIC_PRODUCTS.find((p) => p.id === productId);
        if (found) {
          setContextProduct(found);
          setShowContext(true);
          if (found.seller?.store_name) {
            setActiveName(found.seller.store_name);
          }
        }
      } else {
        api.get(`/products/${productId}`)
          .then((res) => {
            setContextProduct(res.data);
            setShowContext(true);
            if (res.data.seller?.store_name) {
              setActiveName(res.data.seller.store_name);
            }
          })
          .catch((err) => console.error("Gagal memuat produk konteks", err));
      }
    } else {
      setContextProduct(null);
    }
  }, [productId]);

  // Sync activeName with thread list matches
  useEffect(() => {
    if (activeId && threads.length > 0) {
      const match = threads.find((t) => t.user_id === activeId);
      if (match) {
        setActiveName(match.name);
      }
    }
  }, [activeId, threads]);

  const send = async () => {
    if (!input.trim() || !activeId) return;
    const text = input.trim();
    setInput("");
    await api.post(`/chat/${activeId}`, { message: text, product_id: productId });
    loadMessages(activeId);
    loadThreads();
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-page-header">
        <h1 className="chat-page-title">Obrolan</h1>
        <p className="chat-page-subtitle">Percakapan dengan penjual atau pembeli di Qlapa.</p>
      </div>

      {/* Main layout */}
      <div className={`chat-shell ${activeId ? "chat-active" : ""}`}>
        {/* Sidebar: thread list */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <span>Percakapan</span>
          </div>

          <div className="chat-thread-list">
            {threads.length === 0 && !activeId ? (
              <div className="chat-empty-threads">
                <MessageSquare size={28} strokeWidth={1.5} />
                <p>Belum ada percakapan.<br />Chat penjual dari halaman produk untuk memulai.</p>
              </div>
            ) : (
              threads.map((t) => (
                <div
                  key={t.user_id}
                  className={`chat-thread-item ${activeId === t.user_id ? "active" : ""}`}
                  onClick={() => { setActiveId(t.user_id); setActiveName(t.name); setContextProduct(null); setShowContext(true); }}
                >
                  <div className="chat-thread-avatar">
                    <User size={18} />
                  </div>
                  <div className="chat-thread-info">
                    <div className="chat-thread-name">{t.name}</div>
                    <div className="chat-thread-preview">{t.last_message?.slice(0, 45) || "—"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <div className="chat-main">
          {activeId ? (
            <>
              {/* Chat header */}
              <div className="chat-main-header">
                <button type="button" className="chat-back-btn" onClick={() => { setActiveId(null); setContextProduct(null); setShowContext(true); }}>
                  <ChevronLeft size={20} />
                </button>
                <div className="chat-main-avatar"><User size={20} /></div>
                <div className="chat-main-name">{activeName || "Percakapan"}</div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {contextProduct && (
                  <div className="chat-bubble-wrap sent" style={{ marginBottom: 16 }}>
                    <div className="chat-product-msg-card">
                      <div className="chat-product-msg-top">
                        <img
                          src={contextProduct.image_url || contextProduct.staticImg || "/assets/coconut.png"}
                          alt={contextProduct.name}
                          className="chat-product-msg-img"
                          onError={(e) => { e.target.src = "/assets/coconut.png"; }}
                        />
                        <div className="chat-product-msg-info">
                          <div className="chat-product-msg-name">{contextProduct.name}</div>
                          {contextProduct.seller?.store_name && (
                            <div className="chat-product-msg-meta">{contextProduct.seller.store_name}</div>
                          )}
                          <div className="chat-product-msg-price">
                            Rp {(contextProduct.price || 0).toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>
                      <div className="chat-product-msg-actions">
                        <button className="chat-product-msg-cart-btn" onClick={handleAddToCart} aria-label="Tambah Keranjang">
                          <ShoppingCart size={15} />
                        </button>
                        <button className="chat-product-msg-buy-btn" onClick={handleBuyNow}>
                          Beli Sekarang
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {messages.length === 0 && !contextProduct && (
                  <div className="chat-messages-empty">Belum ada pesan. Mulai percakapan sekarang!</div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-bubble-wrap ${m.sender_id === user.id ? "sent" : "received"}`}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: m.sender_id === user.id ? "flex-end" : "flex-start", gap: 2 }}>
                      <div className={`chat-bubble ${m.sender_id === user.id ? "bubble-sent" : "bubble-received"}`}>
                        {m.message}
                      </div>
                      <span style={{ fontSize: "0.65rem", color: "var(--ink-soft)", paddingInline: 4 }}>
                        {formatTime(m.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="chat-input-area">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Tulis pesan…"
                  className="chat-input"
                />
                <button className="chat-send-btn" onClick={send} disabled={!input.trim()}>
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="chat-main-empty">
              <MessageSquare size={40} strokeWidth={1.5} />
              <p>Pilih percakapan di sebelah kiri</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
