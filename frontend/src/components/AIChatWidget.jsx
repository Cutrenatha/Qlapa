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
      text: "Halo! Saya Qlapa AI 🌱. Tanyakan apa saja tentang pemanfaatan limbah kelapa, misalnya: 'apa manfaat sabut kelapa?'",
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
        const res = await api.post("/ai/chat", { message: question, category });
        setMessages((m) => [...m, { from: "ai", text: res.data.reply }]);
      } else {
        const res = await api.get("/ai/recommendation", {
          params: { category: category || "Ampas" },
        });
        setMessages((m) => [
          ...m,
          { from: "ai", text: res.data.recommendation },
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
            <span>🌱 Qlapa AI</span>
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
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  ...(m.from === "user" ? styles.bubbleUser : styles.bubbleAi),
                }}
              >
                {m.text}
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
        {open ? "✕" : "🌱"}
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
