import React, { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, X, User, Plus, MessageSquare, Trash2, ChevronLeft, PanelLeftOpen } from "lucide-react";
import "./QlapaAI.css";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api.js";

const LOGO_FILTER = "sepia(1) saturate(2) hue-rotate(340deg) brightness(0.5)";

const INITIAL_MESSAGE = {
  id: 1,
  role: "ai",
  text: "Halo! Saya Qlapa AI. Ada yang bisa saya bantu terkait pemanfaatan atau pengolahan limbah kelapa hari ini?",
};

function generateId() {
  return Date.now() + Math.random();
}

export default function QlapaAI() {
  const { user } = useAuth();
  
  // State awalan kosong (atau default) sebelum diload dari DB/localStorage
  const [sessions, setSessions] = useState([{ id: 1, title: "Sesi Baru", messages: [INITIAL_MESSAGE] }]);
  const [activeId, setActiveId] = useState(1);
  
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Cegah sync ke backend sebelum data load selesai agar riwayat akun lain tidak ter-overwrite
  const [isLoaded, setIsLoaded] = useState(false);

  const activeSession = sessions.find((s) => String(s.id) === String(activeId)) || sessions[0];
  const messages = activeSession?.messages || [];

  // Load sessions from database or user-specific localStorage
  useEffect(() => {
    if (!user) return;
    
    // Coba load dari localStorage spesifik user sementara menunggu backend
    try {
      const localSaved = localStorage.getItem(`qlapa_ai_sessions_${user.id}`);
      if (localSaved) {
        setSessions(JSON.parse(localSaved));
        const savedActiveId = localStorage.getItem(`qlapa_ai_active_id_${user.id}`);
        if (savedActiveId) setActiveId(JSON.parse(savedActiveId));
      }
    } catch {}

    // Ambil data terbaru dari backend
    api.get("/ai/chat/sessions")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setSessions(res.data);
          setActiveId(res.data[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch AI chat sessions from backend:", err);
      })
      .finally(() => {
        setIsLoaded(true); // Tandai bahwa inisialisasi selesai
      });
  }, [user]);

  // Persist sessions to user-specific localStorage and backend
  useEffect(() => {
    if (!user || !isLoaded) return;

    try {
      localStorage.setItem(`qlapa_ai_sessions_${user.id}`, JSON.stringify(sessions));
      localStorage.setItem(`qlapa_ai_active_id_${user.id}`, JSON.stringify(activeId));
    } catch {}

    const token = localStorage.getItem("qlapa_token");
    if (token) {
      api.post("/ai/chat/sessions", { sessions })
        .catch((err) => console.error("Failed to sync AI sessions with backend:", err));
    }
  }, [sessions, activeId, user, isLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only scroll to bottom when a new message is added (not on initial load)
  const prevMsgCount = useRef(messages.length);
  useEffect(() => {
    // Scroll auto dihilangkan agar pengguna tidak terlempar ke bawah 
    // jika sedang membaca pesan lama
    // if (messages.length > prevMsgCount.current || isTyping) {
    //   scrollToBottom();
    // }
    prevMsgCount.current = messages.length;
  }, [messages, isTyping]);

  const handleNewChat = () => {
    const newSession = {
      id: generateId(),
      title: "Sesi Baru",
      messages: [{ ...INITIAL_MESSAGE, id: generateId() }],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveId(newSession.id);
    setInput("");
    setSelectedImage(null);
  };

  const handleDeleteSession = (e, id) => {
    e.stopPropagation();
    setSessions((prev) => {
      const remaining = prev.filter((s) => String(s.id) !== String(id));
      if (remaining.length === 0) {
        const fresh = {
          id: generateId(),
          title: "Sesi Baru",
          messages: [{ ...INITIAL_MESSAGE, id: generateId() }],
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (String(id) === String(activeId)) setActiveId(remaining[0].id);
      return remaining;
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedImage(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeImage = () => setSelectedImage(null);

  const autoResizeTextarea = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
    setInput(e.target.value);
  };

  const getMockAIResponse = (hasImage) =>
    new Promise((resolve) => {
      setTimeout(() => {
        if (hasImage) {
          resolve({
            text: "Dari gambar yang Anda unggah, sepertinya itu adalah batok kelapa kering. Anda bisa mengolahnya menjadi briket arang berkualitas tinggi yang laku di pasar ekspor!",
            image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=400&h=300",
          });
        } else {
          resolve({
            text: "Saran yang bagus! Untuk sabut kelapa, Anda dapat mengolahnya menjadi cocopeat (media tanam hidroponik) atau cocofiber (bahan jok/keset) yang sangat diminati oleh pasar modern.",
          });
        }
      }, 1500);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMsg = {
      id: generateId(),
      role: "user",
      text: input.trim(),
      image: selectedImage,
    };

    // Update title from first user message
    setSessions((prev) =>
      prev.map((s) => {
        if (String(s.id) !== String(activeId)) return s;
        const isFirstUserMsg = s.messages.filter((m) => m.role === "user").length === 0;
        return {
          ...s,
          title: isFirstUserMsg && userMsg.text ? userMsg.text.slice(0, 36) + (userMsg.text.length > 36 ? "…" : "") : s.title,
          messages: [...s.messages, userMsg],
        };
      })
    );

    setInput("");
    setSelectedImage(null);
    setIsTyping(true);

    let aiResponseText = "";
    let aiResponseImg = null;

    try {
      const token = localStorage.getItem("qlapa_token");
      if (token) {
        const response = await api.post("/ai/chat", { message: userMsg.text });
        aiResponseText = response.data.reply;
      } else {
        const fallback = await getMockAIResponse(!!userMsg.image);
        aiResponseText = fallback.text;
        aiResponseImg = fallback.image;
      }
    } catch (err) {
      console.error("Backend AI Chat failed, using mock fallback:", err);
      const fallback = await getMockAIResponse(!!userMsg.image);
      aiResponseText = fallback.text;
      aiResponseImg = fallback.image;
    }

    const aiMsg = {
      id: generateId(),
      role: "ai",
      text: aiResponseText,
      image: aiResponseImg
    };

    setSessions((prev) =>
      prev.map((s) =>
        String(s.id) === String(activeId) ? { ...s, messages: [...s.messages, aiMsg] } : s
      )
    );
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="ai-page">
      {/* Mobile overlay – tap to close sidebar */}
      {sidebarOpen && (
        <div className="ai-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`ai-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="ai-sidebar-header">
          <img src="/assets/qlapa-logo.png" alt="Qlapa" style={{ height: 26, filter: LOGO_FILTER, flexShrink: 0 }} />
          <span className="ai-sidebar-brand">Qlapa AI</span>
          {/* collapse button (visible inside sidebar) */}
          <button
            className="ai-sidebar-toggle inside"
            onClick={() => setSidebarOpen(false)}
            title="Tutup sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <button className="ai-new-chat-btn" onClick={handleNewChat}>
          <Plus size={16} />
          Chat Baru
        </button>

        <div className="ai-sidebar-label">Riwayat</div>

        <ul className="ai-history-list">
          {sessions.map((s) => (
            <li
              key={s.id}
              className={`ai-history-item ${String(s.id) === String(activeId) ? "active" : ""}`}
              onClick={() => {
                setActiveId(s.id);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
            >
              <MessageSquare size={14} className="ai-history-icon" />
              <span className="ai-history-title">{s.title}</span>
              <button
                className="ai-history-del"
                onClick={(e) => handleDeleteSession(e, s.id)}
                title="Hapus"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Main chat area ── */}
      <div className="ai-chat-container">
        {/* Top bar with open-sidebar button */}
        <div className="ai-chat-topbar">
          {!sidebarOpen && (
            <button
              className="ai-sidebar-toggle outside"
              onClick={() => setSidebarOpen(true)}
              title="Buka sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}
        </div>
        <div className="ai-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-message ${msg.role}`}>
              <div className={`ai-avatar ${msg.role}`}>
                {msg.role === "ai" ? (
                  <img src="/assets/qlapa-logo.png" alt="Qlapa" style={{ width: 22, height: "auto", filter: LOGO_FILTER }} />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div>
                <div className="ai-bubble">
                  {msg.image && <img src={msg.image} alt="Attached" className="ai-bubble-image" />}
                  {msg.text && <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="ai-message ai">
              <div className="ai-avatar ai">
                <img src="/assets/qlapa-logo.png" alt="Qlapa" style={{ width: 22, height: "auto", filter: LOGO_FILTER }} />
              </div>
              <div>
                <div className="ai-bubble">
                  <div className="ai-typing">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-input-area">
          {selectedImage && (
            <div className="ai-preview-container">
              <img src={selectedImage} alt="Preview" className="ai-preview-img" />
              <button type="button" className="ai-preview-remove" onClick={removeImage} title="Hapus gambar">
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="ai-input-wrapper">
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageSelect} />
            <button type="button" className="ai-action-btn" title="Unggah Gambar" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={20} />
            </button>
            <textarea
              className="ai-textarea"
              placeholder="Tanya Qlapa AI tentang limbah kelapa..."
              value={input}
              onChange={autoResizeTextarea}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button type="submit" className="ai-send-btn" disabled={(!input.trim() && !selectedImage) || isTyping} title="Kirim Pesan">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
