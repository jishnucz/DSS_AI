/**
 * 🌾 Smart Agricultural Advisor
 * Unified AI Assistant combining:
 * - RAG-based Knowledge Retrieval (AI Agent)
 * - Conversational Interface (ChatBot)
 * - Visual Analysis (Image/Video Upload)
 * - Crop Health Detection
 * - Disease Identification
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../LanguageContext";
import { useToast } from "./Toast";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 8px rgba(34, 197, 94, 0.3); } 50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); } }
  @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
  @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes cropGlow { 0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); } 50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.6); } }
  
  .smart-input:focus { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15) !important; outline: none; }
  .smart-message { animation: fadeIn 0.3s ease-out; }
  .smart-step { animation: slideIn 0.3s ease-out; }
  .smart-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3); }
  .smart-follow:hover { background: rgba(34, 197, 94, 0.15) !important; border-color: #22c55e !important; }
  .smart-mode:hover { background: rgba(255,255,255,0.25) !important; }
  .smart-mode.active { background: rgba(255,255,255,0.95) !important; color: #16a34a !important; font-weight: 700 !important; }
  .smart-upload:hover { border-color: #22c55e !important; background: rgba(34, 197, 94, 0.05) !important; }
  .smart-scroll::-webkit-scrollbar { width: 6px; }
  .smart-scroll::-webkit-scrollbar-thumb { background: rgba(34, 197, 94, 0.3); border-radius: 3px; }
  .smart-dropzone { transition: all 0.2s ease; }
  .smart-dropzone.drag-active { border-color: #22c55e !important; background: rgba(34, 197, 94, 0.1) !important; transform: scale(1.01); }
  .smart-dropzone:hover { border-color: #22c55e !important; }
  .crop-result-card { animation: cropGlow 2s ease-in-out infinite; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// Interaction modes
const MODES = {
  CHAT: { id: "chat", icon: "💬", label: "Chat", desc: "Ask questions" },
  VISION: { id: "vision", icon: "📷", label: "Visual AI", desc: "Analyze images/video" },
  DSS: { id: "dss", icon: "🧠", label: "Advisory", desc: "Get recommendations" },
};

// Quick suggestions by mode
const SUGGESTIONS = {
  chat: [
    "What crops are best for Palakkad climate?",
    "When should I plant rice?",
    "How to control pests in banana?",
    "Best fertilizer schedule for coconut"
  ],
  vision: [
    "Upload an image of your crop",
    "Take a photo to identify disease",
    "Analyze crop health from video"
  ],
  dss: [
    "My rice is at vegetative stage with 35°C temperature",
    "Should I irrigate? Soil moisture is 25%",
    "What are the weather alerts for this week?",
    "Recommend actions for my stressed banana crop"
  ]
};

// Disease database for enhanced detection
const DISEASE_INFO = {
  blast: { name: "Rice Blast", severity: "High", treatment: "Apply Tricyclazole 75 WP @ 0.6g/L" },
  blight: { name: "Bacterial Leaf Blight", severity: "High", treatment: "Spray Streptocycline 500ppm" },
  brown_spot: { name: "Brown Spot", severity: "Medium", treatment: "Apply Mancozeb 75 WP @ 2g/L" },
  sheath_rot: { name: "Sheath Rot", severity: "Medium", treatment: "Spray Carbendazim 50 WP @ 1g/L" },
  tungro: { name: "Tungro Virus", severity: "High", treatment: "Remove infected plants, control vectors" },
  yellowing: { name: "Nutrient Deficiency", severity: "Low", treatment: "Apply balanced NPK fertilizer" },
  wilting: { name: "Wilt Disease", severity: "High", treatment: "Use resistant varieties, soil treatment" },
  rot: { name: "Root/Stem Rot", severity: "High", treatment: "Improve drainage, apply fungicide" },
};

export default function SmartAdvisor({ onDSSAction }) {
  inject("smart-advisor", CSS);
  const { t } = useLanguage();
  const toast = useToast();
  
  const [mode, setMode] = useState("chat");
  const [messages, setMessages] = useState([{
    id: 1,
    type: "ai",
    content: "🌾 **Welcome to Smart Agricultural Advisor!**\n\nI combine AI knowledge, visual analysis, and decision support to help you:\n\n• 💬 **Chat** - Ask any agriculture question\n• 📷 **Visual AI** - Upload images/videos for crop analysis\n• 🧠 **Advisory** - Get personalized recommendations\n\nHow can I help you today?",
    agentType: "general",
    timestamp: new Date().toISOString()
  }]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [context, setContext] = useState({ crop: "rice", location: "Palakkad" });
  const [dragActive, setDragActive] = useState(false);
  const [lastAnalysisResult, setLastAnalysisResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isVideo = file.type.startsWith("video/");
      processFile(file, isVideo ? "video" : "image");
    }
  };
  
  const processFile = (file, type) => {
    setMediaFile(file);
    setMediaType(type);
    if (type === "image") {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(URL.createObjectURL(file));
    }
    // Auto-switch to vision mode when media is added
    setMode("vision");
  };
  
  // Handle file selection (image or video)
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file, type);
  };
  
  // Analyze image for crop health/disease
  const analyzeMedia = async () => {
    if (!mediaFile) return;
    
    setAnalyzing(true);
    
    // Add user message with media
    const userMsg = {
      id: Date.now(),
      type: "user",
      content: mediaType === "video" ? "📹 Analyzing video for crop health..." : "📷 Analyzing image for crop health...",
      media: mediaPreview,
      mediaType,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      const formData = new FormData();
      formData.append("file", mediaFile);
      
      // If video, we'll extract frames and analyze
      const endpoint = mediaType === "video" 
        ? "http://localhost:8000/api/analyze-video"
        : "http://localhost:8000/classify-crop";
      
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store last analysis result for DSS integration
      setLastAnalysisResult(data);
      
      // Create AI response with visual analysis
      const aiMsg = createVisualAnalysisMessage(data, mediaType);
      setMessages(prev => [...prev, aiMsg]);
      toast.success("Image analyzed successfully!");
      
    } catch (error) {
      toast.error("Failed to analyze media", { 
        title: "Connection Error",
        action: { label: "Retry", onClick: () => analyzeMedia() }
      });
      const errorMsg = {
        id: Date.now() + 1,
        type: "ai",
        content: "❌ Unable to analyze media. Please ensure the backend is running at http://localhost:8000",
        agentType: "error",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
    
    setAnalyzing(false);
    clearMedia();
  };
  
  // Create visual analysis response message
  const createVisualAnalysisMessage = (data, type) => {
    // Backend returns health as {status, score, issues} object
    const healthObj = (data.health && typeof data.health === 'object') ? data.health : {};
    const health = typeof data.health === 'string' ? data.health : (healthObj.status || "Unknown");
    // Backend returns confidence as integer (e.g. 95), normalize to 0-1
    const rawConf = data.confidence || 0;
    const confidence = rawConf > 1 ? rawConf / 100 : rawConf;
    const crop = data.crop || "Unknown crop";
    const issues = healthObj.issues || data.health_details?.issues || [];
    const healthScore = healthObj.score ?? data.health_details?.score ?? 0;

    // Detect diseases from issues
    const detectedDiseases = [];
    for (const issue of issues) {
      const issueLower = issue.toLowerCase();
      for (const [key, disease] of Object.entries(DISEASE_INFO)) {
        if (issueLower.includes(key) || issueLower.includes(disease.name.toLowerCase())) {
          detectedDiseases.push(disease);
        }
      }
    }

    // Build response
    let content = `**🔬 Visual Analysis Results**\n\n`;
    content += `**Detected Crop:** ${crop} (${(confidence * 100).toFixed(0)}% confidence)\n`;
    content += `**Growth Stage:** ${data.growth_stage || "Not detected"}\n\n`;

    // Health status with color indicator
    const healthEmoji = health === "Healthy" ? "✅" : health === "Moderate" ? "⚠️" : "🔴";
    content += `**Health Status:** ${healthEmoji} ${health} (Score: ${healthScore}/100)\n\n`;
    
    // Issues found
    if (issues.length > 0) {
      content += `**Issues Detected:**\n`;
      issues.forEach(issue => {
        content += `- ${issue}\n`;
      });
      content += "\n";
    }
    
    // Disease information
    if (detectedDiseases.length > 0) {
      content += `**🦠 Possible Diseases:**\n`;
      detectedDiseases.forEach(d => {
        content += `- **${d.name}** (${d.severity} severity)\n`;
        content += `  Treatment: ${d.treatment}\n`;
      });
      content += "\n";
    }
    
    // Recommendations — specific based on health and issues
    content += `**💡 Recommendations:**\n`;
    if (health === "Healthy" || healthScore >= 80) {
      content += "- Continue current management practices\n";
      content += "- Maintain balanced NPK fertilization schedule\n";
      content += "- Monitor weekly for early signs of pest/disease\n";
    } else if (health === "Moderate" || healthScore >= 50) {
      if (issues.some(i => /yellow|chloro/i.test(i))) {
        content += "- Apply foliar urea (2%) to address yellowing/nitrogen deficiency\n";
      }
      if (issues.some(i => /spot|blight|fungal/i.test(i))) {
        content += "- Apply Mancozeb (2.5 g/L) or Carbendazim (1 g/L) fungicide spray\n";
      }
      if (issues.some(i => /pest|insect|bore/i.test(i))) {
        content += "- Apply Chlorpyrifos 2.5 ml/L or use pheromone traps\n";
      }
      content += "- Re-assess in 5–7 days after treatment\n";
      content += "- Use Advisory mode for crop-specific recommendations\n";
    } else {
      if (issues.some(i => /blight|rot|wilt/i.test(i))) {
        content += "- Remove and destroy infected plant material immediately\n";
        content += "- Apply systemic fungicide (Propiconazole 1 ml/L) within 24 hours\n";
      }
      if (issues.some(i => /pest|stem bore/i.test(i))) {
        content += "- Apply Cartap Hydrochloride 3G or Chlorantraniliprole 0.4 ml/L\n";
      }
      content += "- Ensure adequate drainage to prevent root rot\n";
      content += "- Consult nearest Krishi Vigyan Kendra (KVK) or agricultural officer\n";
      content += "- Use Advisory mode for detailed crop-specific action plan\n";
    }
    
    return {
      id: Date.now() + 1,
      type: "ai",
      content,
      agentType: "vision",
      confidence: confidence,
      visualData: data,
      reasoningSteps: [
        { step_number: 1, thought: "Analyzing image colors and patterns", action: "color_analysis", observation: `Green ratio: ${data.color_analysis?.green_ratio?.toFixed(2) || "N/A"}` },
        { step_number: 2, thought: "Running AI vision model for crop detection", action: "blip_caption", observation: `Caption: ${data.caption || "N/A"}` },
        { step_number: 3, thought: "Evaluating plant health indicators", action: "health_assessment", observation: `Health score: ${healthScore}/100` },
        { step_number: 4, thought: "Cross-referencing with disease database", action: "disease_detection", observation: `Found ${detectedDiseases.length} potential disease matches` }
      ],
      followUpQuestions: [
        "What treatment should I apply?",
        "Is this disease spreading?",
        "Get full DSS recommendation",
        "Upload another image"
      ],
      timestamp: new Date().toISOString()
    };
  };
  
  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };
  
  // Send text query
  const sendQuery = async (queryText = null) => {
    const q = queryText || query;
    if (!q.trim() || loading) return;
    
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
      // Route based on mode
      const endpoint = mode === "chat" 
        ? "http://localhost:8000/api/chat"  // Simple chatbot
        : "http://localhost:8000/api/ai-agent/query";  // RAG agent
      
      let response, data;
      
      if (mode === "chat") {
        // Simple chat endpoint
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: q })
        });
        data = await response.json();
        
        const aiMsg = {
          id: Date.now() + 1,
          type: "ai",
          content: data.response || data.message || "I couldn't process that request.",
          agentType: "chat",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);
        
      } else {
        // AI Agent with RAG - Fetch weather data first
        let enrichedContext = { ...context };
        
        try {
          // Fetch current weather for the location
          const weatherResponse = await fetch(
            `http://localhost:8000/api/weather/current/${context.location || "Palakkad"}`,
            { method: "GET" }
          );
          
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            // Add weather data to context
            enrichedContext = {
              ...enrichedContext,
              temperature: weatherData.temperature,
              soil_moisture: weatherData.soil_moisture,
              rainfall: weatherData.rainfall,
              humidity: weatherData.humidity,
              wind: weatherData.wind,
              weather_timestamp: weatherData.timestamp
            };
          }
        } catch (weatherError) {
          console.log("Weather fetch failed, continuing without weather data:", weatherError);
        }
        
        // Send query with enriched context (includes weather data)
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, context: enrichedContext })
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        data = await response.json();
        
        const aiMsg = {
          id: Date.now() + 1,
          type: "ai",
          content: data.answer || "I couldn't process that request.",
          agentType: data.agent_type || "general",
          confidence: data.confidence || 0,
          reasoningSteps: data.reasoning_steps || [],
          citations: data.citations || [],
          mlPrediction: data.ml_prediction,
          followUpQuestions: data.follow_up_questions || [],
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);
      }
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error("Query error:", error);
      toast.error("Failed to get response. Check server connection.", {
        title: "Connection Error",
        action: retryCount < 3 ? { 
          label: "Retry", 
          onClick: () => {
            setRetryCount(prev => prev + 1);
            sendQuery(q);
          }
        } : undefined
      });
      const errorMsg = {
        id: Date.now() + 1,
        type: "ai",
        content: `❌ Connection error. Please check if the server is running at http://localhost:8000\n\n${retryCount < 3 ? "Click the Retry button or try again later." : "Maximum retries reached. Please restart the backend server."}`,
        agentType: "error",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
    
    setLoading(false);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mediaFile) {
        analyzeMedia();
      } else {
        sendQuery();
      }
    }
  };
  
  const toggleSteps = (msgId) => {
    setExpandedSteps(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };
  
  // Format message content
  const formatContent = (text) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };
  
  // Agent type config
  const getAgentConfig = (type) => {
    const configs = {
      general: { icon: "🤖", name: "AI Assistant", color: "#64748b" },
      chat: { icon: "💬", name: "Chat Assistant", color: "#3b82f6" },
      crop_health: { icon: "🌱", name: "Crop Health Agent", color: "#22c55e" },
      irrigation: { icon: "💧", name: "Irrigation Agent", color: "#0ea5e9" },
      weather: { icon: "🌤️", name: "Weather Agent", color: "#f59e0b" },
      vision: { icon: "📷", name: "Visual AI", color: "#8b5cf6" },
      error: { icon: "⚠️", name: "System", color: "#ef4444" },
    };
    return configs[type] || configs.general;
  };
  
  // Render message
  const renderMessage = (msg) => {
    if (msg.type === "user") {
      return (
        <div key={msg.id} className="smart-message" style={styles.userMessage}>
          <div style={styles.userBubble}>
            {msg.media && (
              <div style={styles.mediaPreviewInMessage}>
                {msg.mediaType === "video" ? (
                  <video src={msg.media} style={styles.previewVideo} controls />
                ) : (
                  <img src={msg.media} alt="Upload" style={styles.previewImage} />
                )}
              </div>
            )}
            <p style={styles.messageText}>{msg.content}</p>
          </div>
          <div style={styles.userAvatar}>👤</div>
        </div>
      );
    }
    
    const config = getAgentConfig(msg.agentType);
    
    return (
      <div key={msg.id} className="smart-message" style={styles.aiMessage}>
        <div style={{ ...styles.aiAvatar, borderColor: `${config.color}40` }}>
          {config.icon}
        </div>
        
        <div style={styles.aiContent}>
          {/* Agent badge */}
          <div style={styles.aiHeader}>
            <span style={{
              ...styles.agentBadge,
              background: `${config.color}15`,
              borderColor: `${config.color}40`,
              color: config.color
            }}>
              {config.icon} {config.name}
            </span>
            {msg.confidence > 0 && (
              <span style={styles.confidenceBadge}>
                🎯 {(msg.confidence <= 1 ? msg.confidence * 100 : msg.confidence).toFixed(0)}%
              </span>
            )}
          </div>
          
          {/* Response content */}
          <div style={styles.aiBubble}>
            <div 
              style={styles.messageContent}
              dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
            />
          </div>
          
          {/* Reasoning steps */}
          {msg.reasoningSteps?.length > 0 && (
            <div style={styles.reasoningSection}>
              <button onClick={() => toggleSteps(msg.id)} style={styles.reasoningToggle}>
                <span>🧠 Chain of Thought ({msg.reasoningSteps.length} steps)</span>
                <span style={{ transform: expandedSteps[msg.id] ? "rotate(180deg)" : "none", transition: "0.2s" }}>▼</span>
              </button>
              
              {expandedSteps[msg.id] && (
                <div style={styles.reasoningChain}>
                  {msg.reasoningSteps.map((step, i) => (
                    <div key={i} className="smart-step" style={styles.reasoningStep}>
                      <div style={styles.stepNumber}>{step.step_number}</div>
                      <div style={styles.stepContent}>
                        <div style={styles.stepThought}>💭 {step.thought}</div>
                        <div style={styles.stepAction}>⚡ {step.action}</div>
                        <div style={styles.stepObs}>👁️ {step.observation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Citations */}
          {msg.citations?.length > 0 && (
            <div style={styles.citationsSection}>
              <div style={styles.citationsHeader}>📚 Knowledge Sources</div>
              {msg.citations.slice(0, 2).map((cite, i) => (
                <div key={i} style={styles.citation}>
                  <span style={styles.citeSource}>{cite.source}</span>
                  <span style={styles.citeExcerpt}>{cite.excerpt}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Follow-up questions */}
          {msg.followUpQuestions?.length > 0 && (
            <div style={styles.followUpSection}>
              {msg.followUpQuestions.map((q, i) => (
                <button 
                  key={i} 
                  className="smart-follow" 
                  style={{
                    ...styles.followUpBtn,
                    ...(q.includes("DSS") && {
                      background: "linear-gradient(135deg, #22c55e 0%, #059669 100%)",
                      color: "#fff",
                      fontWeight: 600
                    })
                  }} 
                  onClick={() => {
                    if (q.includes("DSS") && onDSSAction && msg.visualData) {
                      // Navigate to DSS with detected crop data
                      onDSSAction({
                        crop: msg.visualData.crop_detected || context.crop || 'Rice',
                        confidence: msg.visualData.confidence || 0.85,
                        healthScore: msg.visualData.health_score,
                        source: 'SmartAdvisor',
                        visualAnalysis: msg.visualData
                      });
                    } else {
                      sendQuery(q);
                    }
                  }}
                >
                  {q.includes("DSS") ? "🧠 " + q : q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🌾</span>
          <div>
            <h2 style={styles.title}>Smart Agricultural Advisor</h2>
            <p style={styles.subtitle}>AI Chat • Visual Analysis • Decision Support</p>
          </div>
        </div>
        
        {/* Mode selector */}
        <div style={styles.modeSelector}>
          {Object.values(MODES).map(m => (
            <button
              key={m.id}
              className={`smart-mode ${mode === m.id ? 'active' : ''}`}
              style={styles.modeBtn}
              onClick={() => setMode(m.id)}
              title={m.desc}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Messages area */}
      <div className="smart-scroll" style={styles.messagesContainer}>
        {messages.map(renderMessage)}
        
        {(loading || analyzing) && (
          <div className="smart-message" style={styles.aiMessage}>
            <div style={styles.aiAvatar}>🤖</div>
            <div style={styles.loadingBubble}>
              <span style={styles.loadingDot}>•</span>
              <span style={{ ...styles.loadingDot, animationDelay: "0.2s" }}>•</span>
              <span style={{ ...styles.loadingDot, animationDelay: "0.4s" }}>•</span>
              <span style={styles.loadingText}>
                {analyzing ? "Analyzing visual data..." : "Processing..."}
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Media preview */}
      {mediaPreview && (
        <div style={styles.mediaPreviewBar}>
          <div style={styles.mediaPreviewContent}>
            {mediaType === "video" ? (
              <video src={mediaPreview} style={styles.thumbVideo} />
            ) : (
              <img src={mediaPreview} alt="Preview" style={styles.thumbImage} />
            )}
            <div style={styles.mediaInfo}>
              <span>{mediaFile?.name}</span>
              <span style={styles.mediaSize}>{(mediaFile?.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <button onClick={clearMedia} style={styles.clearMediaBtn}>✕</button>
        </div>
      )}
      
      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={styles.suggestionsContainer}>
          <p style={styles.suggestionsTitle}>Try asking:</p>
          <div style={styles.suggestionsList}>
            {SUGGESTIONS[mode].map((s, i) => (
              <button key={i} className="smart-follow" style={styles.suggestionBtn} onClick={() => sendQuery(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div style={styles.inputContainer}>
        {/* Upload buttons for visual mode */}
        {mode === "vision" && (
          <div style={styles.uploadBar}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "image")}
              style={{ display: "none" }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleFileSelect(e, "video")}
              style={{ display: "none" }}
            />
            <button className="smart-upload" style={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
              📷 Upload Image
            </button>
            <button className="smart-upload" style={styles.uploadBtn} onClick={() => videoInputRef.current?.click()}>
              📹 Upload Video
            </button>
            <input
              ref={(el) => { /* camera input */ }}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileSelect(e, "image")}
              style={{ display: "none" }}
              id="camera-input"
            />
            <button className="smart-upload" style={styles.uploadBtn} onClick={() => document.getElementById("camera-input")?.click()}>
              📸 Take Photo
            </button>
          </div>
        )}
        
        <div style={styles.inputWrapper}>
          <input
            ref={inputRef}
            className="smart-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={mode === "vision" && mediaFile ? "Add description or press Enter to analyze..." : "Ask anything about agriculture..."}
            style={styles.input}
            disabled={loading || analyzing}
          />
          <button
            className="smart-send"
            onClick={() => mediaFile ? analyzeMedia() : sendQuery()}
            disabled={loading || analyzing || (!query.trim() && !mediaFile)}
            style={{
              ...styles.sendButton,
              opacity: (loading || analyzing || (!query.trim() && !mediaFile)) ? 0.5 : 1,
            }}
          >
            {loading || analyzing ? "⏳" : mediaFile ? "🔍" : "🚀"}
          </button>
        </div>
        
        <p style={styles.inputHint}>
          {mode === "chat" && "💬 Quick chat • Simple questions"}
          {mode === "vision" && "📷 Upload image/video for crop health analysis"}
          {mode === "dss" && "🧠 Advisory mode • RAG + ML predictions"}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 280px)",
    minHeight: "650px",
    background: "#fff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    fontFamily: "'Poppins', sans-serif",
    boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    background: "linear-gradient(135deg, #052e16, #16a34a)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  headerIcon: {
    fontSize: "36px",
  },
  title: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#fff",
    fontFamily: "'Manrope', sans-serif",
  },
  subtitle: {
    margin: "2px 0 0 0",
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.8)",
  },
  modeSelector: {
    display: "flex",
    gap: "6px",
    background: "rgba(0,0,0,0.2)",
    padding: "4px",
    borderRadius: "99px",
  },
  modeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    border: "none",
    borderRadius: "99px",
    background: "rgba(255,255,255,0.15)",
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    transition: "all 0.2s",
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
    gap: "10px",
  },
  userBubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    borderRadius: "16px 16px 4px 16px",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#f0fdf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },
  aiMessage: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  aiAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
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
    borderRadius: "10px",
    fontSize: "0.75rem",
    fontWeight: 600,
    border: "1px solid",
  },
  confidenceBadge: {
    fontSize: "0.7rem",
    color: "#64748b",
  },
  aiBubble: {
    padding: "14px 18px",
    background: "#fff",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "4px 16px 16px 16px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
  },
  messageText: {
    margin: 0,
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  messageContent: {
    fontSize: "0.9rem",
    lineHeight: 1.6,
    color: "#374151",
  },
  mediaPreviewInMessage: {
    marginBottom: "10px",
    borderRadius: "10px",
    overflow: "hidden",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "200px",
    borderRadius: "8px",
  },
  previewVideo: {
    maxWidth: "100%",
    maxHeight: "200px",
    borderRadius: "8px",
  },
  reasoningSection: {
    marginTop: "10px",
  },
  reasoningToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 12px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "8px",
    fontSize: "0.8rem",
    color: "#16a34a",
    fontWeight: 500,
    cursor: "pointer",
  },
  reasoningChain: {
    marginTop: "8px",
    padding: "12px",
    background: "rgba(0, 0, 0, 0.02)",
    borderRadius: "8px",
  },
  reasoningStep: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    padding: "10px",
    background: "#fff",
    borderRadius: "6px",
    border: "1px solid rgba(34, 197, 94, 0.1)",
  },
  stepNumber: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  stepContent: {
    flex: 1,
    fontSize: "0.8rem",
  },
  stepThought: {
    color: "#374151",
    marginBottom: "4px",
  },
  stepAction: {
    color: "#3b82f6",
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: "4px",
  },
  stepObs: {
    color: "#64748b",
    fontStyle: "italic",
  },
  citationsSection: {
    marginTop: "10px",
  },
  citationsHeader: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "6px",
  },
  citation: {
    padding: "8px 10px",
    background: "rgba(0, 0, 0, 0.02)",
    borderRadius: "6px",
    borderLeft: "3px solid #22c55e",
    marginBottom: "6px",
  },
  citeSource: {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#16a34a",
  },
  citeExcerpt: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  followUpSection: {
    marginTop: "12px",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  followUpBtn: {
    padding: "6px 12px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "16px",
    fontSize: "0.75rem",
    color: "#16a34a",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  loadingBubble: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 18px",
    background: "#fff",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "4px 16px 16px 16px",
  },
  loadingDot: {
    fontSize: "1.4rem",
    color: "#22c55e",
    animation: "pulse 1s infinite",
  },
  loadingText: {
    fontSize: "0.85rem",
    color: "#64748b",
    marginLeft: "6px",
  },
  mediaPreviewBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 24px",
    background: "rgba(34, 197, 94, 0.08)",
    borderTop: "1px solid rgba(34, 197, 94, 0.15)",
  },
  mediaPreviewContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  thumbImage: {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  thumbVideo: {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  mediaInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.85rem",
    color: "#374151",
  },
  mediaSize: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  clearMediaBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "14px",
  },
  suggestionsContainer: {
    padding: "10px 24px",
    borderTop: "1px solid #f1f5f9",
    background: "#fafafa",
  },
  suggestionsTitle: {
    margin: "0 0 8px 0",
    fontSize: "0.75rem",
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  suggestionsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  suggestionBtn: {
    padding: "6px 12px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "99px",
    fontSize: "0.78rem",
    color: "#16a34a",
    cursor: "pointer",
    transition: "all 0.2s",
    fontWeight: 500,
  },
  inputContainer: {
    padding: "14px 20px",
    borderTop: "1px solid #e2e8f0",
    background: "#fff",
  },
  uploadBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
  },
  uploadBtn: {
    flex: 1,
    padding: "10px 16px",
    border: "2px dashed rgba(34, 197, 94, 0.3)",
    borderRadius: "10px",
    background: "rgba(34, 197, 94, 0.02)",
    fontSize: "0.85rem",
    color: "#16a34a",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  inputWrapper: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    fontSize: "0.95rem",
    border: "2px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "14px",
    background: "#fff",
    color: "#1f2937",
    transition: "all 0.2s",
  },
  sendButton: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  inputHint: {
    margin: "8px 0 0 0",
    fontSize: "0.7rem",
    color: "#94a3b8",
    textAlign: "center",
  },
};
