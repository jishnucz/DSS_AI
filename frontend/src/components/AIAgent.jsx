/**
 * 🤖 AI Advisory Agent Component
 * Multi-Agent RAG System with Chain-of-Thought Reasoning
 * 
 * Features:
 * - Natural language query interface
 * - Real-time reasoning visualization
 * - Citation tracking for transparency
 * - ML model integration display
 * - Follow-up suggestions
 */

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../LanguageContext";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes typing { from { width: 0 } to { width: 100% } }
  @keyframes blink { 50% { border-color: transparent } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes thinking { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.3); } 50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); } }
  
  .ai-input:focus { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15) !important; outline: none; }
  .ai-message { animation: fadeIn 0.3s ease-out; }
  .ai-step { animation: slideIn 0.3s ease-out; }
  .ai-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3); }
  .ai-follow:hover { background: rgba(34, 197, 94, 0.15) !important; border-color: #22c55e !important; }
  .ai-agent-badge { animation: glow 2s ease-in-out infinite; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// Agent type icons and colors
const AGENT_CONFIG = {
  crop_health: { icon: "🌱", name: "Crop Health Agent", color: "#22c55e" },
  irrigation: { icon: "💧", name: "Irrigation Agent", color: "#3b82f6" },
  weather: { icon: "🌤️", name: "Weather Agent", color: "#f59e0b" },
  market: { icon: "💰", name: "Market Agent", color: "#a855f7" },
  general: { icon: "🤖", name: "General Agent", color: "#64748b" },
  error: { icon: "⚠️", name: "System", color: "#ef4444" },
};

// Example queries
const EXAMPLE_QUERIES = [
  "What is the health status of my rice crop at vegetative stage with 35°C temperature?",
  "When should I irrigate my rice field? Soil moisture is 25%",
  "What weather alerts should I be aware of?",
  "My banana plants are showing yellowing leaves. What should I do?",
];

export default function AIAgent() {
  inject("ai-agent", CSS);
  const { t } = useLanguage();
  
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({
    crop: "rice",
    location: "Palakkad"
  });
  const [showContext, setShowContext] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const sendQuery = async (queryText = null) => {
    const q = queryText || query;
    if (!q.trim() || loading) return;
    
    // Add user message
    const userMsg = {
      id: Date.now(),
      type: "user",
      content: q,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/api/ai-agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, context })
      });
      
      const data = await response.json();
      
      // Add AI response
      const aiMsg = {
        id: Date.now() + 1,
        type: "ai",
        content: data.answer,
        agentType: data.agent_type || "general",
        confidence: data.confidence || 0,
        reasoningSteps: data.reasoning_steps || [],
        citations: data.citations || [],
        mlPrediction: data.ml_prediction,
        recommendations: data.recommendations || [],
        followUpQuestions: data.follow_up_questions || [],
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
      
    } catch (error) {
      // Error message
      const errorMsg = {
        id: Date.now() + 1,
        type: "ai",
        content: "I'm having trouble connecting to the AI agent. Please ensure the backend server is running.",
        agentType: "error",
        confidence: 0,
        reasoningSteps: [],
        citations: [],
        recommendations: [],
        followUpQuestions: ["Check server status", "Try again later"],
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
    
    setLoading(false);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };
  
  const toggleSteps = (msgId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };
  
  const renderMessage = (msg) => {
    if (msg.type === "user") {
      return (
        <div key={msg.id} className="ai-message" style={styles.userMessage}>
          <div style={styles.userBubble}>
            <p style={styles.messageText}>{msg.content}</p>
          </div>
          <div style={styles.userAvatar}>👤</div>
        </div>
      );
    }
    
    // AI message
    const agentConfig = AGENT_CONFIG[msg.agentType] || AGENT_CONFIG.general;
    
    return (
      <div key={msg.id} className="ai-message" style={styles.aiMessage}>
        <div style={styles.aiAvatar} className="ai-agent-badge">
          {agentConfig.icon}
        </div>
        
        <div style={styles.aiContent}>
          {/* Agent badge and confidence */}
          <div style={styles.aiHeader}>
            <span style={{
              ...styles.agentBadge,
              background: `${agentConfig.color}15`,
              borderColor: `${agentConfig.color}40`,
              color: agentConfig.color
            }}>
              {agentConfig.icon} {agentConfig.name}
            </span>
            {msg.confidence > 0 && (
              <span style={styles.confidenceBadge}>
                🎯 {(msg.confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
          
          {/* Main response */}
          <div style={styles.aiBubble}>
            <div style={styles.messageContent} 
                 dangerouslySetInnerHTML={{ 
                   __html: formatResponse(msg.content) 
                 }} 
            />
          </div>
          
          {/* Reasoning chain (collapsible) */}
          {msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
            <div style={styles.reasoningSection}>
              <button 
                onClick={() => toggleSteps(msg.id)}
                style={styles.reasoningToggle}
              >
                <span>🧠 Chain of Thought ({msg.reasoningSteps.length} steps)</span>
                <span style={{ transform: expandedSteps[msg.id] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  ▼
                </span>
              </button>
              
              {expandedSteps[msg.id] && (
                <div style={styles.reasoningChain}>
                  {msg.reasoningSteps.map((step, i) => (
                    <div key={i} className="ai-step" style={{ ...styles.reasoningStep, animationDelay: `${i * 0.1}s` }}>
                      <div style={styles.stepNumber}>{step.step_number}</div>
                      <div style={styles.stepContent}>
                        <div style={styles.stepThought}>
                          <strong>💭 Thought:</strong> {step.thought}
                        </div>
                        <div style={styles.stepAction}>
                          <strong>⚡ Action:</strong> {step.action}
                        </div>
                        <div style={styles.stepObservation}>
                          <strong>👁️ Observation:</strong> {step.observation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* ML Prediction (if available) */}
          {msg.mlPrediction && (
            <div style={styles.mlSection}>
              <div style={styles.mlHeader}>
                <span>🤖 ML Ensemble Prediction</span>
                <span style={styles.mlAccuracy}>88.3% accuracy</span>
              </div>
              <div style={styles.mlContent}>
                <span style={{
                  ...styles.mlResult,
                  background: msg.mlPrediction.consensus === "NORMAL" ? "rgba(34, 197, 94, 0.15)" :
                             msg.mlPrediction.consensus === "LOW STRESS" ? "rgba(245, 158, 11, 0.15)" :
                             "rgba(239, 68, 68, 0.15)",
                  color: msg.mlPrediction.consensus === "NORMAL" ? "#22c55e" :
                        msg.mlPrediction.consensus === "LOW STRESS" ? "#f59e0b" : "#ef4444"
                }}>
                  {msg.mlPrediction.consensus || "N/A"}
                </span>
                <span style={styles.mlModels}>
                  {msg.mlPrediction.model_count || 8} models agreed
                </span>
              </div>
            </div>
          )}
          
          {/* Citations */}
          {msg.citations && msg.citations.length > 0 && (
            <div style={styles.citationsSection}>
              <div style={styles.citationsHeader}>📚 Sources</div>
              <div style={styles.citationsList}>
                {msg.citations.slice(0, 3).map((cite, i) => (
                  <div key={i} style={styles.citation}>
                    <span style={styles.citationSource}>{cite.source || cite.record_type}</span>
                    <span style={styles.citationExcerpt}>{cite.excerpt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Follow-up questions */}
          {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
            <div style={styles.followUpSection}>
              <div style={styles.followUpHeader}>💡 Related Questions</div>
              <div style={styles.followUpList}>
                {msg.followUpQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="ai-follow"
                    style={styles.followUpButton}
                    onClick={() => sendQuery(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const formatResponse = (text) => {
    if (!text) return "";
    
    // Convert markdown-like formatting to HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/- (.*?)(<br\/>|$)/g, '<li style="margin-left: 20px;">$1</li>')
      .replace(/<li/g, '<li style="list-style-type: disc; margin-left: 20px;"');
  };
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerIcon}>🤖</div>
          <div>
            <h2 style={styles.title}>AI Advisory Agent</h2>
            <p style={styles.subtitle}>
              Multi-Agent RAG System • Chain-of-Thought Reasoning • ML Integration
            </p>
          </div>
        </div>
        
        <div style={styles.headerBadges}>
          <span style={styles.badge}>🧠 LangChain Architecture</span>
          <span style={styles.badge}>📚 Knowledge Base: {context.location}</span>
          <button 
            onClick={() => setShowContext(!showContext)}
            style={styles.contextToggle}
          >
            ⚙️ Context
          </button>
        </div>
      </div>
      
      {/* Context panel */}
      {showContext && (
        <div style={styles.contextPanel}>
          <div style={styles.contextField}>
            <label style={styles.contextLabel}>Current Crop</label>
            <select
              value={context.crop}
              onChange={(e) => setContext(prev => ({ ...prev, crop: e.target.value }))}
              style={styles.contextSelect}
            >
              <option value="rice">🌾 Rice</option>
              <option value="banana">🍌 Banana</option>
              <option value="coconut">🥥 Coconut</option>
              <option value="sugarcane">🎋 Sugarcane</option>
              <option value="groundnut">🥜 Groundnut</option>
            </select>
          </div>
          <div style={styles.contextField}>
            <label style={styles.contextLabel}>Location</label>
            <select
              value={context.location}
              onChange={(e) => setContext(prev => ({ ...prev, location: e.target.value }))}
              style={styles.contextSelect}
            >
              <option value="Palakkad">Palakkad</option>
              <option value="Chittur">Chittur</option>
              <option value="Alathur">Alathur</option>
              <option value="Ottapalam">Ottapalam</option>
              <option value="Mannarkkad">Mannarkkad</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Messages area */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🤖</div>
            <h3 style={styles.emptyTitle}>AI Agricultural Advisor</h3>
            <p style={styles.emptySubtitle}>
              Ask me anything about crops, irrigation, weather, or farming practices
            </p>
            
            <div style={styles.examplesSection}>
              <p style={styles.examplesTitle}>Try asking:</p>
              <div style={styles.examplesList}>
                {EXAMPLE_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    className="ai-follow"
                    style={styles.exampleButton}
                    onClick={() => sendQuery(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={styles.agentsGrid}>
              {Object.entries(AGENT_CONFIG).filter(([k]) => k !== "error").map(([key, config]) => (
                <div key={key} style={styles.agentCard}>
                  <span style={styles.agentCardIcon}>{config.icon}</span>
                  <span style={styles.agentCardName}>{config.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            
            {loading && (
              <div className="ai-message" style={styles.aiMessage}>
                <div style={styles.aiAvatar}>🤖</div>
                <div style={styles.loadingBubble}>
                  <div style={styles.thinkingAnimation}>
                    <span style={styles.thinkingDot}>•</span>
                    <span style={{ ...styles.thinkingDot, animationDelay: "0.2s" }}>•</span>
                    <span style={{ ...styles.thinkingDot, animationDelay: "0.4s" }}>•</span>
                  </div>
                  <span style={styles.thinkingText}>Analyzing with multi-agent system...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <input
            ref={inputRef}
            className="ai-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about crops, irrigation, weather..."
            style={styles.input}
            disabled={loading}
          />
          <button
            className="ai-send"
            onClick={() => sendQuery()}
            disabled={loading || !query.trim()}
            style={{
              ...styles.sendButton,
              opacity: loading || !query.trim() ? 0.5 : 1,
              cursor: loading || !query.trim() ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "⏳" : "🚀"}
          </button>
        </div>
        <p style={styles.inputHint}>
          Press Enter to send • Powered by Multi-Agent RAG Architecture
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 300px)",
    minHeight: "600px",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 244, 0.95))",
    borderRadius: "24px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    overflow: "hidden",
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(34, 197, 94, 0.15)",
    background: "rgba(255, 255, 255, 0.9)",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerIcon: {
    fontSize: "40px",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "0.85rem",
    color: "#64748b",
  },
  headerBadges: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  badge: {
    padding: "6px 12px",
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "20px",
    fontSize: "0.75rem",
    color: "#16a34a",
    fontWeight: 500,
  },
  contextToggle: {
    padding: "6px 12px",
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "20px",
    fontSize: "0.8rem",
    color: "#16a34a",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  contextPanel: {
    display: "flex",
    gap: "20px",
    padding: "16px 24px",
    background: "rgba(34, 197, 94, 0.05)",
    borderBottom: "1px solid rgba(34, 197, 94, 0.1)",
  },
  contextField: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  contextLabel: {
    fontSize: "0.85rem",
    color: "#64748b",
    fontWeight: 500,
  },
  contextSelect: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    background: "#fff",
    fontSize: "0.9rem",
    color: "#1f2937",
    cursor: "pointer",
  },
  messagesContainer: {
    flex: 1,
    overflow: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  userMessage: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    gap: "12px",
  },
  userBubble: {
    maxWidth: "70%",
    padding: "14px 18px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    borderRadius: "18px 18px 4px 18px",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.2)",
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  aiMessage: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  aiAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    border: "2px solid rgba(34, 197, 94, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  aiContent: {
    flex: 1,
    maxWidth: "85%",
  },
  aiHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  agentBadge: {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    border: "1px solid",
  },
  confidenceBadge: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  aiBubble: {
    padding: "16px 20px",
    background: "#fff",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "4px 18px 18px 18px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
  },
  messageText: {
    margin: 0,
    fontSize: "0.95rem",
    lineHeight: 1.6,
  },
  messageContent: {
    fontSize: "0.95rem",
    lineHeight: 1.7,
    color: "#374151",
  },
  reasoningSection: {
    marginTop: "12px",
  },
  reasoningToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 14px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "10px",
    fontSize: "0.85rem",
    color: "#16a34a",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  reasoningChain: {
    marginTop: "10px",
    padding: "14px",
    background: "rgba(0, 0, 0, 0.02)",
    borderRadius: "10px",
    border: "1px solid rgba(34, 197, 94, 0.1)",
  },
  reasoningStep: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    padding: "12px",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid rgba(34, 197, 94, 0.1)",
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: 700,
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepThought: {
    fontSize: "0.85rem",
    color: "#374151",
    marginBottom: "6px",
  },
  stepAction: {
    fontSize: "0.8rem",
    color: "#3b82f6",
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: "6px",
  },
  stepObservation: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  mlSection: {
    marginTop: "12px",
    padding: "12px 16px",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(34, 197, 94, 0.08))",
    borderRadius: "10px",
    border: "1px solid rgba(139, 92, 246, 0.2)",
  },
  mlHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#7c3aed",
  },
  mlAccuracy: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  mlContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  mlResult: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  mlModels: {
    fontSize: "0.8rem",
    color: "#64748b",
  },
  citationsSection: {
    marginTop: "12px",
  },
  citationsHeader: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "8px",
  },
  citationsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  citation: {
    padding: "10px 14px",
    background: "rgba(0, 0, 0, 0.02)",
    borderRadius: "8px",
    borderLeft: "3px solid #22c55e",
  },
  citationSource: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#16a34a",
    marginBottom: "4px",
  },
  citationExcerpt: {
    fontSize: "0.8rem",
    color: "#64748b",
    lineHeight: 1.4,
  },
  followUpSection: {
    marginTop: "14px",
  },
  followUpHeader: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "10px",
  },
  followUpList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  followUpButton: {
    padding: "8px 14px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "20px",
    fontSize: "0.8rem",
    color: "#16a34a",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  loadingBubble: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 20px",
    background: "#fff",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "4px 18px 18px 18px",
  },
  thinkingAnimation: {
    display: "flex",
    gap: "4px",
  },
  thinkingDot: {
    fontSize: "1.5rem",
    color: "#22c55e",
    animation: "pulse 1s infinite",
  },
  thinkingText: {
    fontSize: "0.9rem",
    color: "#64748b",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  emptySubtitle: {
    margin: 0,
    fontSize: "1rem",
    color: "#64748b",
    maxWidth: "400px",
  },
  examplesSection: {
    marginTop: "32px",
    width: "100%",
    maxWidth: "600px",
  },
  examplesTitle: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "12px",
  },
  examplesList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  exampleButton: {
    padding: "12px 16px",
    background: "rgba(34, 197, 94, 0.06)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "12px",
    fontSize: "0.9rem",
    color: "#374151",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  agentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginTop: "32px",
    width: "100%",
    maxWidth: "500px",
  },
  agentCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "16px 12px",
    background: "#fff",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "12px",
  },
  agentCardIcon: {
    fontSize: "28px",
  },
  agentCardName: {
    fontSize: "0.7rem",
    color: "#64748b",
    textAlign: "center",
  },
  inputContainer: {
    padding: "16px 24px 20px",
    borderTop: "1px solid rgba(34, 197, 94, 0.15)",
    background: "rgba(255, 255, 255, 0.9)",
  },
  inputWrapper: {
    display: "flex",
    gap: "12px",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    fontSize: "1rem",
    border: "2px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "14px",
    background: "#fff",
    color: "#1f2937",
    transition: "all 0.2s ease",
  },
  sendButton: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    fontSize: "1.3rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  inputHint: {
    margin: "10px 0 0 0",
    fontSize: "0.75rem",
    color: "#94a3b8",
    textAlign: "center",
  },
};
