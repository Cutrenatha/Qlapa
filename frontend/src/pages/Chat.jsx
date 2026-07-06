import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Chat() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(params.get("to") ? Number(params.get("to")) : null);
  const [activeName, setActiveName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const productId = params.get("product");

  const loadThreads = () => api.get("/chat/threads").then((res) => setThreads(res.data));

  const loadMessages = (id) => {
    api.get(`/chat/${id}`).then((res) => setMessages(res.data));
  };

  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const interval = setInterval(() => loadMessages(activeId), 3000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !activeId) return;
    const text = input.trim();
    setInput("");
    await api.post(`/chat/${activeId}`, { message: text, product_id: productId });
    loadMessages(activeId);
    loadThreads();
  };

  return (
    <div className="section container">
      <h1 style={{ fontSize: "1.8rem", marginBottom: 24 }}>Obrolan</h1>
      <div className="card chat-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: 520, overflow: "hidden" }}>
        <div style={{ borderRight: "1px solid var(--line)", overflowY: "auto" }}>
          {threads.length === 0 && !activeId && (
            <div style={{ padding: 20, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Belum ada percakapan. Chat penjual dari halaman produk untuk memulai.
            </div>
          )}
          {threads.map((t) => (
            <div
              key={t.user_id}
              onClick={() => { setActiveId(t.user_id); setActiveName(t.name); }}
              style={{
                padding: "14px 16px", cursor: "pointer",
                background: activeId === t.user_id ? "var(--cream-2)" : "transparent",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{t.name}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 2 }}>
                {t.last_message?.slice(0, 40)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {activeId ? (
            <>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", fontWeight: 700 }}>
                {activeName || "Percakapan"}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 10, background: "var(--cream-2)" }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.sender_id === user.id ? "flex-end" : "flex-start",
                      background: m.sender_id === user.id ? "var(--green-700)" : "#fff",
                      color: m.sender_id === user.id ? "#fff" : "var(--ink)",
                      padding: "10px 14px", borderRadius: 14, maxWidth: "70%",
                      border: m.sender_id === user.id ? "none" : "1px solid var(--line)",
                    }}
                  >
                    {m.message}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid var(--line)" }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Tulis pesan…"
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 999, border: "1.5px solid var(--line)", outline: "none" }}
                />
                <button className="btn btn-primary btn-sm" onClick={send}>Kirim</button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ margin: "auto" }}>Pilih percakapan di sebelah kiri.</div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 700px) { .chat-grid { grid-template-columns: 1fr !important; height: auto !important; } }`}</style>
    </div>
  );
}
