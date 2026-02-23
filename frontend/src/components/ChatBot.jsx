import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../LanguageContext";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
  @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
  @keyframes msgIn        { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bounce       { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1.15);opacity:1} }
  @keyframes pulse        { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{opacity:0.6;box-shadow:0 0 0 8px rgba(34,197,94,0)} }
  @keyframes glow         { 0%,100%{box-shadow:0 8px 30px rgba(34,197,94,0.35)} 50%{box-shadow:0 8px 40px rgba(34,197,94,0.55)} }
  .agri-toggle { animation: glow 3s ease-in-out infinite; transition: transform 0.2s ease !important; }
  .agri-toggle:hover { transform: scale(1.1) !important; }
  .agri-toggle:active { transform: scale(0.95) !important; }
  .agri-send { transition: all 0.2s ease !important; }
  .agri-send:hover:not(:disabled) { transform: scale(1.1) !important; box-shadow: 0 6px 25px rgba(34,197,94,0.5) !important; }
  .agri-input:focus { border-color: rgba(34,197,94,0.5) !important; box-shadow: 0 0 0 4px rgba(34,197,94,0.1) !important; outline: none !important; }
  .agri-input { transition: all 0.25s ease !important; }
  .chat-scroll::-webkit-scrollbar { width: 5px; }
  .chat-scroll::-webkit-scrollbar-track { background: transparent; }
  .chat-scroll::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.25); border-radius: 3px; }
  .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.45); }
  .quick-chip:hover { background: rgba(34,197,94,0.15) !important; border-color: rgba(34,197,94,0.45) !important; color: #16a34a !important; transform: translateY(-2px); }
  .quick-chip { transition: all 0.2s ease !important; cursor: pointer; }
  .close-btn:hover { background: rgba(255,255,255,0.3) !important; }
  .close-btn { transition: background 0.15s ease !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function renderText(text) {
  // bold **text** and line breaks
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : p
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

const QUICK = ["Crop disease symptoms", "Best fertilizer for Rice", "Market prices today", "Irrigation schedule", "Pest control tips"];

export default function ChatBot({ mode = "floating" }) {
  inject("agri-chat", CSS);
  const { t } = useLanguage();

  const [messages, setMessages] = useState([
    { type: "bot", text: `${t("chatbotGreeting")}\n\n${t("chatbotWelcome")}` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(mode === "tab");
  const [unread, setUnread] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 200); }
  }, [open]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setMessages(p => [...p, { type: "user", text: msg }]);
    setInput(""); setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let botText = "";
      if (data.type === "price") {
        if (!data.data?.length) botText = "No price data available at the moment.";
        else botText = data.data.map(item =>
          item.message ? item.message :
          item.commodity ? `**${item.commodity}** — Market: ${item.market}, ${item.state} | Price: ${item.price_range}` : ""
        ).filter(Boolean).join("\n\n");
      } else {
        botText = data.response || "No response provided.";
      }

      let audioUrl = null;
      if (botText.includes("<audio")) {
        const m = botText.match(/src="([^"]+)"/);
        if (m) { audioUrl = m[1]; botText = botText.replace(/<audio[^>]*>.*?<\/audio>/g, "").trim(); }
      }

      setMessages(p => [...p, { type: "bot", text: botText || "Audio response", audioUrl }]);
      if (!open) setUnread(u => u + 1);
    } catch (e) {
      setMessages(p => [...p, { type: "bot", text: `❌ Connection error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, open]);

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey && !loading) { e.preventDefault(); send(); } };

  // Tab mode - render as full page component
  if (mode === "tab") {
    return (
      <div style={sTab.container}>
        <div style={sTab.window}>
          {/* Header */}
          <div style={s.header}>
            <div style={s.headerInner}>
              <div style={s.botAvatar}>🌿</div>
              <div>
                <div style={s.botName}>AgriBot</div>
                <div style={s.botStatus}>
                  <span style={s.onlineDot} />
                  {t("online")}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-scroll" ref={boxRef} style={sTab.chatBox}>
            {messages.map((msg, i) => (
              <div key={i} style={{ ...s.msgWrap, justifyContent: msg.type === "user" ? "flex-end" : "flex-start", animation: "msgIn 0.3s ease-out" }}>
                {msg.type === "bot" && (
                  <div style={s.avatar}>🌿</div>
                )}
                <div style={msg.type === "user" ? s.userBubble : s.botBubble}>
                  <p style={s.msgText}>{renderText(msg.text)}</p>
                  {msg.audioUrl && (
                    <audio controls src={msg.audioUrl} style={s.audio} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...s.msgWrap, justifyContent: "flex-start" }}>
                <div style={s.avatar}>🌿</div>
                <div style={s.botBubble}>
                  <div style={{ display: "flex", gap: "5px", alignItems: "center", padding: "2px 4px" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ ...s.dot, animationDelay: `${i * 0.18}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Chips */}
          {messages.length <= 1 && (
            <div style={s.chipsWrap}>
              <p style={s.chipsLabel}>Quick questions</p>
              <div style={s.chips}>
                {QUICK.map(q => (
                  <button key={q} className="quick-chip" style={s.chip} onClick={() => send(q)} disabled={loading}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={s.inputRow}>
            <input
              className="agri-input"
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t("askAnything")}
              disabled={loading}
              style={s.input}
            />
            <button
              className="agri-send"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{ ...s.sendBtn, opacity: (!input.trim() || loading) ? 0.5 : 1, cursor: (!input.trim() || loading) ? "not-allowed" : "pointer" }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Floating mode - original behavior
  return (
    <div style={s.root}>
      {/* Toggle Button */}
      <button className="agri-toggle" onClick={() => setOpen(o => !o)} style={s.toggle}>
        <span style={s.toggleIcon}>{open ? "✕" : "💬"}</span>
        {!open && unread > 0 && (
          <span style={s.badge}>{unread}</span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={s.window}>
          {/* Header */}
          <div style={s.header}>
            <div style={s.headerInner}>
              <div style={s.botAvatar}>🌿</div>
              <div>
                <div style={s.botName}>AgriBot</div>
                <div style={s.botStatus}>
                  <span style={s.onlineDot} />
                  {t("online")}
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={() => setOpen(false)} style={s.closeBtn}>✕</button>
          </div>

          {/* Messages */}
          <div className="chat-scroll" ref={boxRef} style={s.chatBox}>
            {messages.map((msg, i) => (
              <div key={i} style={{ ...s.msgWrap, justifyContent: msg.type === "user" ? "flex-end" : "flex-start", animation: "msgIn 0.3s ease-out" }}>
                {msg.type === "bot" && (
                  <div style={s.avatar}>🌿</div>
                )}
                <div style={msg.type === "user" ? s.userBubble : s.botBubble}>
                  <p style={s.msgText}>{renderText(msg.text)}</p>
                  {msg.audioUrl && (
                    <audio controls src={msg.audioUrl} style={s.audio} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...s.msgWrap, justifyContent: "flex-start" }}>
                <div style={s.avatar}>🌿</div>
                <div style={s.botBubble}>
                  <div style={{ display: "flex", gap: "5px", alignItems: "center", padding: "2px 4px" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ ...s.dot, animationDelay: `${i * 0.18}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Chips */}
          {messages.length <= 1 && (
            <div style={s.chipsWrap}>
              <p style={s.chipsLabel}>Quick questions</p>
              <div style={s.chips}>
                {QUICK.map(q => (
                  <button key={q} className="quick-chip" style={s.chip} onClick={() => send(q)} disabled={loading}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={s.inputRow}>
            <input
              className="agri-input"
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t("askAnything")}
              disabled={loading}
              style={s.input}
            />
            <button
              className="agri-send"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{ ...s.sendBtn, opacity: (!input.trim() || loading) ? 0.5 : 1, cursor: (!input.trim() || loading) ? "not-allowed" : "pointer" }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const sTab = {
  container: {
    width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center",
    fontFamily: "'Inter',sans-serif", padding: "24px",
  },
  window: {
    width: "100%", maxWidth: "920px", height: "85vh",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,253,244,0.95))",
    borderRadius: "28px",
    border: "1px solid rgba(34,197,94,0.2)",
    boxShadow: "0 25px 70px rgba(34,197,94,0.1), 0 0 0 1px rgba(34,197,94,0.05)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    animation: "fadeSlideUp 0.35s ease-out",
    backdropFilter: "blur(20px)",
  },
  chatBox: {
    flex: 1, overflowY: "auto", padding: "24px",
    display: "flex", flexDirection: "column", gap: "14px",
    background: "rgba(255,255,255,0.5)",
  },
};

const s = {
  root: { position: "fixed", bottom: "28px", right: "28px", zIndex: 1000, fontFamily: "'Inter',sans-serif" },

  toggle: {
    position: "relative", width: "64px", height: "64px", borderRadius: "50%",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#FFF", border: "none", fontSize: "28px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
  toggleIcon: { lineHeight: 1 },
  badge: {
    position: "absolute", top: "-4px", right: "-4px",
    width: "22px", height: "22px", borderRadius: "50%",
    background: "#FFB74D", color: "#000", fontSize: "0.68rem", fontWeight: "800",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid #111827",
  },

  window: {
    position: "absolute", bottom: "76px", right: 0,
    width: "420px", maxHeight: "640px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,253,244,0.95))",
    borderRadius: "24px",
    border: "1px solid rgba(34,197,94,0.2)",
    boxShadow: "0 25px 70px rgba(34,197,94,0.12), 0 0 0 1px rgba(34,197,94,0.05)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    animation: "fadeSlideUp 0.35s ease-out",
    backdropFilter: "blur(20px)",
  },

  header: {
    padding: "18px 22px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
  },
  headerInner: { display: "flex", alignItems: "center", gap: "14px" },
  botAvatar: {
    width: "44px", height: "44px", borderRadius: "12px",
    background: "rgba(255,255,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
  },
  botName: { color: "#FFF", fontWeight: "800", fontSize: "1.05rem", letterSpacing: "0.3px", fontFamily: "'Inter',sans-serif" },
  botStatus: { display: "flex", alignItems: "center", gap: "7px", color: "rgba(255,255,255,0.85)", fontSize: "0.78rem", marginTop: "3px", fontFamily: "'Inter',sans-serif" },
  onlineDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#86efac", display: "inline-block", animation: "pulse 2s infinite" },
  closeBtn: {
    width: "32px", height: "32px", borderRadius: "10px", border: "none",
    background: "rgba(255,255,255,0.2)", color: "#111827", fontSize: "15px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },

  chatBox: {
    flex: 1, overflowY: "auto", padding: "18px",
    display: "flex", flexDirection: "column", gap: "12px",
    background: "rgba(255,255,255,0.5)",
  },
  msgWrap: { display: "flex", alignItems: "flex-end", gap: "10px" },
  avatar: {
    width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
    background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(74,222,128,0.08))", border: "1px solid rgba(34,197,94,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px",
  },
  userBubble: {
    maxWidth: "78%", padding: "13px 17px", borderRadius: "16px 16px 4px 16px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#FFF", boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
  },
  botBubble: {
    maxWidth: "82%", padding: "13px 17px", borderRadius: "16px 16px 16px 4px",
    background: "rgba(255,255,255,0.95)", color: "#1e293b",
    border: "1px solid rgba(34,197,94,0.2)",
    boxShadow: "0 4px 15px rgba(34,197,94,0.08)",
  },
  msgText: { margin: 0, fontSize: "0.9rem", lineHeight: "1.6", fontWeight: "500", fontFamily: "'Inter',sans-serif", color: "inherit" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "bounce 1.4s infinite" },
  audio: { marginTop: "12px", width: "100%", height: "32px", borderRadius: "8px" },

  chipsWrap: { padding: "14px 18px", borderTop: "1px solid rgba(34,197,94,0.15)" },
  chipsLabel: { margin: "0 0 10px", fontSize: "0.7rem", color: "#64748b", fontFamily: "'Inter',sans-serif", letterSpacing: "1px", textTransform: "uppercase" },
  chips: { display: "flex", flexWrap: "wrap", gap: "8px" },
  chip: {
    padding: "7px 14px", borderRadius: "10px", fontSize: "0.78rem",
    background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.2)",
    color: "#475569", fontFamily: "'Inter',sans-serif", fontWeight: "500",
    boxShadow: "0 2px 8px rgba(34,197,94,0.08)",
  },

  inputRow: {
    display: "flex", gap: "12px", padding: "16px",
    borderTop: "1px solid rgba(34,197,94,0.15)",
    background: "rgba(240,253,244,0.8)",
  },
  input: {
    flex: 1, padding: "13px 18px", borderRadius: "14px",
    border: "1px solid rgba(34,197,94,0.25)", background: "rgba(255,255,255,0.95)",
    color: "#1e293b", fontSize: "0.9rem", fontFamily: "'Inter',sans-serif",
    fontWeight: "500",
  },
  sendBtn: {
    width: "46px", height: "46px", borderRadius: "12px", flexShrink: 0,
    background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#FFF",
    border: "none", fontSize: "17px", cursor: "pointer",
    boxShadow: "0 6px 18px rgba(34,197,94,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};
