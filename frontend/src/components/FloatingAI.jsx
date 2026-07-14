import React, { useState, useEffect, useRef } from "react";
import { X, Send, ShoppingBag, Lightbulb, MessageCircle } from "lucide-react";
import api from "../api.js";

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "intro",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    // Add user message
    const newMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", { message: userMessage });
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: response.data.reply,
          products: response.data.products || [],
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Maaf, terjadi kendala koneksi dengan Qlapa AI. Silakan coba sesaat lagi 🌱.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="floating-ai-container">
      {/* Chat Popup */}
      {isOpen && (
        <div style={styles.chatPopup} className="floating-ai-popup">
          <div style={styles.chatHeader}>
            <div style={styles.headerLeft}>
              <div style={styles.headerAvatarWrap}>
                <img
                  src="/assets/qlapa_ai_icon.jpg"
                  alt="Qlapa AI"
                  style={styles.headerAvatar}
                  onError={(e) => { e.target.src = "/assets/coconut.png"; }}
                />
              </div>
              <div>
                <h4 style={styles.headerTitle}>Qlapa AI</h4>
                <p style={styles.headerStatus}>Asisten Produk</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={styles.closeBtn}
              aria-label="Tutup Chat"
            >
              <X size={22} strokeWidth={1.5} color="#1d1d1f" />
            </button>
          </div>

          <div style={styles.chatBody}>
            {messages.map((msg, idx) => {
              if (msg.role === "intro") {
                return (
                  <div key={idx} style={{ ...styles.messageWrapper, justifyContent: "flex-start", alignItems: "flex-end" }}>
                    <img
                      src="/assets/qlapa_ai_icon.jpg"
                      alt="AI"
                      style={styles.msgAvatar}
                      onError={(e) => { e.target.src = "/assets/coconut.png"; }}
                    />
                    <div style={{ ...styles.messageBubble, ...styles.introBubble }}>
                      <p style={styles.introText}>
                        Halo!<br /><br />
                        Saya Qlapa AI, asisten Anda untuk menemukan produk kelapa yang tepat dan bermanfaat.
                      </p>
                      
                      <div style={styles.divider} />
                      
                      <div style={styles.featureRow}>
                        <div style={styles.featureIconWrap}>
                          <ShoppingBag size={18} color="#4a4a4a" strokeWidth={2} />
                        </div>
                        <div>
                          <h5 style={styles.featureTitle}>Rekomendasi produk</h5>
                          <p style={styles.featureDesc}>Temukan produk kelapa terbaik sesuai kebutuhan Anda.</p>
                        </div>
                      </div>

                      <div style={styles.featureRow}>
                        <div style={styles.featureIconWrap}>
                          <Lightbulb size={18} color="#4a4a4a" strokeWidth={2} />
                        </div>
                        <div>
                          <h5 style={styles.featureTitle}>Ide & pemanfaatan</h5>
                          <p style={styles.featureDesc}>Dapatkan ide kreatif untuk mengolah limbah kelapa.</p>
                        </div>
                      </div>

                      <div style={styles.featureRow}>
                        <div style={styles.featureIconWrap}>
                          <MessageCircle size={18} color="#4a4a4a" strokeWidth={2} />
                        </div>
                        <div>
                          <h5 style={styles.featureTitle}>Bantuan seputar Qlapa</h5>
                          <p style={styles.featureDesc}>Tanya apa saja tentang produk, pengiriman, dan fitur Qlapa.</p>
                        </div>
                      </div>

                      <div style={styles.divider} />
                      
                      <p style={styles.introFooterText}>Ada yang bisa saya bantu hari ini?</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    ...styles.messageWrapper,
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                  }}
                >
                  {msg.role === "ai" && (
                    <img
                      src="/assets/qlapa_ai_icon.jpg"
                      alt="AI"
                      style={styles.msgAvatar}
                      onError={(e) => { e.target.src = "/assets/coconut.png"; }}
                    />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "80%", width: "100%", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        ...styles.messageBubble,
                        background: msg.role === "user" ? "#d5c3a5" : "#fff",
                        color: msg.role === "user" ? "#fff" : "var(--ink)",
                        border: msg.role === "ai" ? "1px solid #f0f0f0" : "none",
                        borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                        borderBottomLeftRadius: msg.role === "ai" ? 4 : 16,
                        maxWidth: "100%",
                      }}
                    >
                      <p style={styles.messageText}>{msg.text}</p>
                    </div>
                    
                    {msg.products && msg.products.length > 0 && (
                      <div style={{
                        display: "flex", gap: 10, overflowX: "auto", padding: "8px 0 2px",
                        width: "100%", scrollbarWidth: "none", alignSelf: "flex-start"
                      }}>
                        {msg.products.map((prod) => (
                          <a
                            key={prod.id}
                            href={`/produk/${prod.id}`}
                            style={{
                              flex: "0 0 120px", background: "#fff", border: "1px solid #e5e5ea",
                              borderRadius: 12, overflow: "hidden", textDecoration: "none",
                              color: "inherit", display: "block"
                            }}
                          >
                            <div style={{ width: "100%", height: 70, background: "#f5f5f7" }}>
                              <img
                                src={prod.image_url || "/assets/coconut.png"}
                                alt={prod.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { e.target.src = "/assets/coconut.png"; }}
                              />
                            </div>
                            <div style={{ padding: 6 }}>
                              <div style={{ fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {prod.name}
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "var(--ink-soft)", marginTop: 2 }}>
                                Rp{prod.price.toLocaleString("id-ID")}
                              </div>
                              <div style={{ fontSize: "0.62rem", color: "#8e8e93", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {prod.seller?.store_location || "Indonesia"}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div style={{ ...styles.messageWrapper, justifyContent: "flex-start", alignItems: "flex-end" }}>
                <img
                  src="/assets/qlapa_ai_icon.jpg"
                  alt="AI"
                  style={styles.msgAvatar}
                  onError={(e) => { e.target.src = "/assets/coconut.png"; }}
                />
                <div
                  style={{
                    ...styles.messageBubble,
                    background: "#f1f1f1",
                    color: "var(--ink)",
                    border: "1px solid #f0f0f0",
                    borderBottomLeftRadius: 4,
                    display: "flex",
                    gap: 4,
                    padding: "10px 14px",
                    alignItems: "center"
                  }}
                >
                  <span className="dot" style={{ width: 6, height: 6, background: "var(--ink-soft)", borderRadius: "50%", animation: "blink 1.4s infinite both" }}></span>
                  <span className="dot" style={{ width: 6, height: 6, background: "var(--ink-soft)", borderRadius: "50%", animation: "blink 1.4s infinite both 0.2s" }}></span>
                  <span className="dot" style={{ width: 6, height: 6, background: "var(--ink-soft)", borderRadius: "50%", animation: "blink 1.4s infinite both 0.4s" }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={styles.chatFooter}>
            <input
              type="text"
              placeholder="Ketik pesan Anda..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={styles.input}
            />
            <button
              type="submit"
              style={{
                ...styles.sendBtn,
                background: input.trim() ? "#cbb696" : "#e0d3c1",
                cursor: input.trim() ? "pointer" : "not-allowed",
              }}
              disabled={!input.trim()}
            >
              <Send size={18} color="#fff" style={{ transform: "translateX(-1px) translateY(1px)" }} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <div
          style={styles.floatingBtnWrapper}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
        <span
          style={{
            ...styles.tooltip,
            opacity: isHovered && !isOpen ? 1 : 0,
            transform: isHovered && !isOpen ? "translateX(0) scale(1)" : "translateX(10px) scale(0.95)",
            pointerEvents: isHovered && !isOpen ? "auto" : "none",
          }}
        >
          Qlapa AI
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            ...styles.floatingBtn,
            background: isOpen ? "var(--ink)" : "transparent",
            boxShadow: isOpen ? "0 6px 20px rgba(0,0,0,0.15)" : "none",
            filter: isOpen ? "none" : "drop-shadow(0 6px 12px rgba(0,0,0,0.25))",
            animation: isOpen ? "none" : "floating 3s ease-in-out infinite",
          }}
          aria-label="Toggle Qlapa AI"
        >
          {isOpen ? (
            <X size={28} color="#fff" />
          ) : (
            <img
              src="/assets/qlapa_ai_icon.jpg"
              alt="Qlapa AI"
              style={styles.btnIcon}
              onError={(e) => { e.target.src = "/assets/coconut.png"; }}
            />
          )}
        </button>
      </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  floatingBtnWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  tooltip: {
    background: "#fff",
    color: "var(--ink)",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: "0.85rem",
    fontWeight: 600,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    border: "1px solid var(--line)",
    transition: "opacity 0.25s, transform 0.25s",
    whiteSpace: "nowrap",
  },
  floatingBtn: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 0,
    transition: "background 0.2s, box-shadow 0.2s",
  },
  btnIcon: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    mixBlendMode: "normal",
  },
  chatPopup: {
    width: 380,
    height: 520,
    maxHeight: "calc(100vh - 100px)",
    background: "#fff",
    borderRadius: 24,
    boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #e8e8e8",
    transformOrigin: "bottom right",
    animation: "popupOpen 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  chatHeader: {
    padding: "16px 20px",
    background: "#fdfbf9",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  headerAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#f2efe9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerAvatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.1rem",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    color: "#1d1d1f",
  },
  headerStatus: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#6b6b6b",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transition: "opacity 0.2s",
  },
  chatBody: {
    flex: 1,
    padding: "20px 16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "#fff",
  },
  messageWrapper: {
    display: "flex",
    gap: 10,
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    borderRadius: 16,
  },
  messageText: {
    margin: 0,
    fontSize: "0.95rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  introBubble: {
    background: "#fff",
    border: "1px solid #f0f0f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    maxWidth: "88%",
    borderBottomLeftRadius: 4,
  },
  introText: {
    margin: 0,
    fontSize: "0.95rem",
    lineHeight: 1.5,
    color: "#333",
  },
  divider: {
    height: 1,
    background: "#f0f0f0",
    margin: "16px 0",
  },
  featureRow: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#f2efe9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    margin: "0 0 4px 0",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#1d1d1f",
  },
  featureDesc: {
    margin: 0,
    fontSize: "0.85rem",
    lineHeight: 1.4,
    color: "#6b6b6b",
  },
  introFooterText: {
    margin: 0,
    fontSize: "0.95rem",
    color: "#333",
  },
  chatFooter: {
    padding: "16px",
    background: "#fff",
    borderTop: "1px solid #eee",
    display: "flex",
    gap: 12,
  },
  input: {
    flex: 1,
    padding: "12px 18px",
    borderRadius: 999,
    border: "1px solid #f0f0f0",
    fontSize: "0.95rem",
    outline: "none",
    background: "#fbfbfb",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s, transform 0.1s",
  },
};

// Add keyframes to document for popup animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes popupOpen {
      from { opacity: 0; transform: scale(0.9) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes floating {
      0% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
      100% { transform: translateY(0); }
    }
    @keyframes blink {
      0% { opacity: 0.2; }
      20% { opacity: 1; }
      100% { opacity: 0.2; }
    }
  `;
  document.head.appendChild(style);
}
