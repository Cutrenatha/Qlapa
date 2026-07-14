import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Send, MessageSquare, User } from "lucide-react";
import "./Chat.css";

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
    <div className="chat-page">
      {/* Header */}
      <div className="chat-page-header">
        <h1 className="chat-page-title">Obrolan</h1>
        <p className="chat-page-subtitle">Percakapan dengan penjual atau pembeli di Qlapa.</p>
      </div>

      {/* Main layout */}
      <div className="chat-shell">
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
                  onClick={() => { setActiveId(t.user_id); setActiveName(t.name); }}
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
                <div className="chat-main-avatar"><User size={20} /></div>
                <div className="chat-main-name">{activeName || "Percakapan"}</div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-messages-empty">Belum ada pesan. Mulai percakapan sekarang!</div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-bubble-wrap ${m.sender_id === user.id ? "sent" : "received"}`}
                  >
                    <div className={`chat-bubble ${m.sender_id === user.id ? "bubble-sent" : "bubble-received"}`}>
                      {m.message}
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
