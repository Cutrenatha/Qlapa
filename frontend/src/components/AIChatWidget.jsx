import React, { useState, useRef, useEffect } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AIChatWidget({
  category,
  open: initialOpen,
  setOpen: externalSetOpen,
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(initialOpen || false);
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Halo! Saya Qlapa AI. Tanyakan apa saja tentang pemanfaatan limbah kelapa, misalnya: 'apa manfaat sabut kelapa?'",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const handleSetOpen = (value) => {
    setOpen(value);
    if (externalSetOpen) externalSetOpen(value);
  };

  useEffect(() => {
    if (initialOpen !== undefined) {
      setOpen(initialOpen);
    }
  }, [initialOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((m) => [...m, { from: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      if (user) {
        const res = await api.post("/ai/chat", { message: question });
        setMessages((m) => [...m, { from: "ai", text: res.data.reply, products: res.data.products || [] }]);
      } else {
        const res = await api.get("/ai/recommendation", {
          params: { category: category || "Ampas" },
        });
        setMessages((m) => [
          ...m,
          { from: "ai", text: res.data.recommendation, products: res.data.products || [] },
        ]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: "Maaf, terjadi kendala. Coba lagi sebentar lagi ya.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      {open && (
        <div style={styles.panel} className="card">
          <div style={styles.header}>
            <span>Qlapa AI</span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "#fff" }}
              onClick={() => handleSetOpen(false)}
            >
              ✕
            </button>
          </div>
          <div style={styles.body}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start", width: "100%", marginBottom: 12 }}>
                <div
                  style={{
                    ...styles.bubble,
                    ...(m.from === "user" ? styles.bubbleUser : styles.bubbleAi),
                    maxWidth: "85%",
                    marginBottom: 0
                  }}
                >
                  {m.text}
                </div>
                {m.products && m.products.length > 0 && (
                  <div style={{
                    display: "flex", gap: 8, overflowX: "auto", padding: "6px 0 2px",
                    width: "100%", maxWidth: "85%", scrollbarWidth: "none", alignSelf: "flex-start"
                  }}>
                    {m.products.map((prod) => (
                      <a
                        key={prod.id}
                        href={`/produk/${prod.id}`}
                        style={{
                          flex: "0 0 110px", background: "#fff", border: "1px solid #e5e5ea",
                          borderRadius: 12, overflow: "hidden", textDecoration: "none",
                          color: "inherit", display: "block"
                        }}
                      >
                        <div style={{ width: "100%", height: 65, background: "#f5f5f7" }}>
                          <img
                            src={prod.image_url || "/assets/coconut.png"}
                            alt={prod.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.target.src = "/assets/coconut.png"; }}
                          />
                        </div>
                        <div style={{ padding: 6 }}>
                          <div style={{ fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {prod.name}
                          </div>
                          <div style={{ fontSize: "0.65rem", color: "var(--ink-soft)", marginTop: 2 }}>
                            Rp{prod.price.toLocaleString("id-ID")}
                          </div>
                          <div style={{ fontSize: "0.6rem", color: "#8e8e93", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {prod.seller?.store_location || "Indonesia"}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.bubble, ...styles.bubbleAi }}>
                Mengetik…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div style={styles.inputRow}>
            <input
              placeholder="Tanyakan Qlapa AI…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              style={styles.input}
            />
            <button className="btn btn-primary btn-sm" onClick={send}>
              Kirim
            </button>
          </div>
        </div>
      )}
      <button style={styles.fab} onClick={() => handleSetOpen(!open)}>
        {open ? "✕" : "AI"}
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "var(--green-700)",
    color: "#fff",
    fontSize: "1.4rem",
    boxShadow: "var(--shadow-lg)",
  },
  panel: {
    width: 320,
    height: 420,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    background: "var(--green-700)",
    color: "#fff",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "var(--cream-2)",
  },
  bubble: {
    padding: "10px 13px",
    borderRadius: 14,
    fontSize: "0.85rem",
    maxWidth: "85%",
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
  },
  bubbleAi: {
    background: "#fff",
    border: "1px solid var(--line)",
    alignSelf: "flex-start",
    color: "var(--ink)",
  },
  bubbleUser: {
    background: "var(--green-700)",
    color: "#fff",
    alignSelf: "flex-end",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: 10,
    borderTop: "1px solid var(--line)",
    background: "#fff",
  },
  input: {
    flex: 1,
    border: "1.5px solid var(--line)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: "0.85rem",
    outline: "none",
  },
};
