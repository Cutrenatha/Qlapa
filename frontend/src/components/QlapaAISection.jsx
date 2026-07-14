import React, { useState, useEffect } from "react";

export default function QlapaAISection() {
  const [step, setStep] = useState(0);

  const [hasTriggered, setHasTriggered] = useState(false);
  const sectionRef = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered) {
          setHasTriggered(true);
          // Sequence the chat animation
          const t1 = setTimeout(() => setStep(1), 500); // Show user message
          const t2 = setTimeout(() => setStep(2), 1500); // Show waiting indicator
          const t3 = setTimeout(() => setStep(3), 4000); // Show AI response

          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
          };
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, [hasTriggered]);

  return (
    <section ref={sectionRef} style={styles.section}>
      <div className="container ai-section-container" style={styles.container}>
        {/* Left Column */}
        <div style={styles.leftCol}>
          <div style={styles.label}>Qlapa Ai</div>
          <h2 style={styles.title}>
            Lihat potensi<br />
            di balik setiap<br />
            limbah kelapa.
          </h2>
          <p style={styles.desc}>
            Qlapa AI membantu memberikan rekomendasi pemanfaatan berdasarkan produk yang di pilih.
          </p>
        </div>

        {/* Right Column (Chat UI) */}
        <div style={styles.rightCol}>
          <div style={styles.chatWindow}>
            
            {/* User Message */}
            <div style={{ ...styles.messageRow, justifyContent: "flex-end", opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(10px)", transition: "all 0.4s ease" }}>
              <div style={styles.userBubble}>
                Halo Qlapa Ai, apa potensi dari limbah batok kelapa ini?
              </div>
            </div>

            {/* Waiting Indicator */}
            {step === 2 && (
              <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
                <div style={styles.aiBubble}>
                  <div style={styles.typingIndicator}>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Response */}
            <div style={{ ...styles.messageRow, justifyContent: "flex-start", opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s ease", display: step >= 3 ? "flex" : "none" }}>
              <div style={styles.aiBubble}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "1.05rem", color: "#1D1D1F" }}>Analisis Qlapa AI:</h4>
                <p style={{ margin: "0 0 10px 0", fontSize: "0.95rem", lineHeight: 1.5, color: "#4A4A4A" }}>
                  Batok kelapa adalah limbah bernilai ekonomi tinggi. Berikut potensinya:
                </p>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.95rem", lineHeight: 1.6, color: "#4A4A4A", marginBottom: 12 }}>
                  <li><strong>Briket Arang:</strong> Sangat dicari pasar ekspor dengan harga tinggi.</li>
                  <li><strong>Asap Cair:</strong> Produk sampingan proses pembakaran untuk pengawet alami.</li>
                  <li><strong>Kerajinan:</strong> Bahan baku untuk mangkuk dan peralatan estetik.</li>
                </ul>
                <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5, color: "#4A4A4A" }}>
                  Saya juga dapat merekomendasikan pembeli briket terdekat di sekitar Anda!
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes typing {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #6E6E73;
          margin: 0 2px;
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @media (max-width: 900px) {
          .ai-section-container {
            flex-direction: column !important;
            gap: 40px !important;
            padding: 0 24px !important;
          }
          .ai-section-container > div {
            max-width: 100% !important;
            width: 100% !important;
          }
          .ai-section-container h2 {
            font-size: clamp(2rem, 8vw, 3rem) !important;
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
  section: {
    background: "#FFFFFF",
    padding: "100px 0",
  },
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "60px",
  },
  leftCol: {
    flex: "1",
    maxWidth: "500px",
  },
  label: {
    display: "inline-block",
    background: "#F7F5F2",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#4E342E",
    marginBottom: "20px",
  },
  title: {
    fontSize: "3.6rem",
    fontWeight: "800",
    color: "#1D1D1F",
    lineHeight: "1.05",
    letterSpacing: "-0.02em",
    margin: "0 0 24px 0",
  },
  desc: {
    fontSize: "1.1rem",
    color: "#6E6E73",
    lineHeight: "1.6",
    margin: "0",
  },
  rightCol: {
    flex: "1",
    display: "flex",
    justifyContent: "flex-end",
  },
  chatWindow: {
    width: "100%",
    maxWidth: "560px",
    background: "#F7F5F2",
    borderRadius: "24px",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
  },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  userBubble: {
    background: "#E8E2D9",
    color: "#1D1D1F",
    padding: "14px 20px",
    borderRadius: "20px 20px 4px 20px",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    maxWidth: "80%",
    fontWeight: "500",
  },
  aiBubble: {
    background: "#FFFFFF",
    color: "#1D1D1F",
    padding: "20px",
    borderRadius: "20px 20px 20px 4px",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    maxWidth: "90%",
    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "24px",
    padding: "0 8px",
  },
  dot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#6E6E73",
    margin: "0 2px",
    animation: "typing 1.4s infinite ease-in-out",
  },
};

// Add child styles for dots since React inline styles can't use pseudo-selectors well
// I moved the keyframes and dot styles to the <style> block but React needs classNames.
styles.dot = undefined; // Will use className instead
