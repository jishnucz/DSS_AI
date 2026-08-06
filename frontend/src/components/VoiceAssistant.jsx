/**
 * VoiceAssistant Component - AI-powered voice interface for farming advice
 */
import { useState, useEffect, useRef } from "react";

const CSS = `
  @keyframes va-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
  @keyframes va-ripple { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
  @keyframes va-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes va-wave { 0%, 100% { height: 8px; } 50% { height: 26px; } }
  .va-mic-btn { transition: all 0.3s ease !important; }
  .va-mic-btn:hover { transform: scale(1.05) !important; }
  .va-quick-card { transition: all 0.25s ease !important; }
  .va-quick-card:hover { transform: translateY(-4px) !important; box-shadow: 0 10px 28px rgba(124,58,237,0.18) !important; }
  .va-lang-btn:hover { opacity: 0.85 !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

const LANGUAGE_OPTIONS = [
  { code: "en-IN", label: "English", flag: "🇬🇧", key: "en" },
  { code: "ml-IN", label: "Malayalam", flag: "🇮🇳", key: "ml" },
  { code: "ta-IN", label: "Tamil", flag: "🇮🇳", key: "ta" },
  { code: "hi-IN", label: "Hindi", flag: "🇮🇳", key: "hi" },
];

const QUICK_QUESTIONS = {
  "en-IN": [
    { icon: "🌾", text: "Best time to sow rice?" },
    { icon: "💧", text: "How much water does rice need?" },
    { icon: "🌡️", text: "Heat stress symptoms?" },
    { icon: "🐛", text: "Common rice diseases?" },
    { icon: "💰", text: "Current market prices?" },
    { icon: "🌧️", text: "Rainfall forecast today?" },
  ],
  "ml-IN": [
    { icon: "🌾", text: "നെൽകൃഷിക്ക് ഏറ്റവും നല്ല സമയം?" },
    { icon: "💧", text: "നെല്ലിന് എത്ര വെള്ളം വേണം?" },
    { icon: "🌡️", text: "ചൂട് സമ്മർദ്ദത്തിന്റെ ലക്ഷണങ്ങൾ?" },
    { icon: "🐛", text: "സാധാരണ നെൽ രോഗങ്ങൾ?" },
    { icon: "💰", text: "ഇപ്പോഴത്തെ വിലകൾ?" },
    { icon: "🌧️", text: "ഇന്നത്തെ മഴ പ്രവചനം?" },
  ],
  "ta-IN": [
    { icon: "🌾", text: "நெல் விதைக்க சிறந்த நேரம்?" },
    { icon: "💧", text: "நெல்லுக்கு எவ்வளவு தண்ணீர்?" },
    { icon: "🌡️", text: "வெப்ப அழுத்த அறிகுறிகள்?" },
    { icon: "🐛", text: "பொதுவான நெல் நோய்கள்?" },
    { icon: "💰", text: "தற்போதைய சந்தை விலை?" },
    { icon: "🌧️", text: "மழை முன்னறிவிப்பு?" },
  ],
  "hi-IN": [
    { icon: "🌾", text: "धान बोने का सबसे अच्छा समय?" },
    { icon: "💧", text: "धान को कितना पानी चाहिए?" },
    { icon: "🌡️", text: "गर्मी तनाव के लक्षण?" },
    { icon: "🐛", text: "सामान्य धान रोग?" },
    { icon: "💰", text: "वर्तमान बाजार भाव?" },
    { icon: "🌧️", text: "आज का वर्षा पूर्वानुमान?" },
  ],
};

const RESPONSES = {
  "en-IN": {
    default: "Based on current conditions in Palakkad, I recommend checking soil moisture first. Kuruvai rice sowing: June-July, Samba: August-September. Temperature is optimal at 25-30°C. Would you like specific advice for your crop stage?",
    water: "Rice needs 1200-1800mm over its season. Maintain 5cm standing water during tillering, 8cm during flowering. Use Alternate Wetting & Drying (AWD) to save up to 30% water without yield loss.",
    disease: "Common in Palakkad: Rice Blast (spray Tricyclazole 75% WP @ 0.6g/L), Brown Planthopper (Imidacloprid 17.8% SL @ 0.5ml/L), Leaf folder (Chlorpyrifos 20% EC @ 2ml/L). Monitor weekly.",
    price: "Current paddy: Local market ₹2,350/quintal, Ernakulam ₹2,420/quintal, Kerala Supplyco MSP ₹2,820/quintal. Sell through Supplyco for guaranteed MSP price.",
    weather: "Palakkad forecast: 28-32°C, 75-80% humidity. Southwest monsoon active. Expect 40-60mm rainfall this week. Irrigate early morning to reduce evaporation losses.",
  },
  "ml-IN": {
    default: "പാലക്കാട്ടിലെ നിലവിലെ സ്ഥിതി: ആദ്യം മണ്ണ് ഈർപ്പം പരിശോധിക്കുക. കുറുവ: ജൂൺ-ജൂലൈ, സാമ്പ: ഓഗസ്റ്റ്-സെപ്തംബർ. 25-30°C ആണ് ഉത്തമ താപനില.",
    water: "നെല്ലിന് 1200-1800mm വെള്ളം ആവശ്യമാണ്. ഞാറ്റ്‌ടി: 5cm, പൂക്കൾ: 8cm. AWD രീതിയിൽ 30% വെള്ളം ലാഭിക്കാം.",
    disease: "ബ്ലാസ്റ്റ്: ട്രൈസൈക്ലാസോൾ 75% @ 0.6g/L, BPH: ഇമിഡാക്ലോപ്രിഡ് @ 0.5ml/L. ആഴ്ചതോറും നിരീക്ഷിക്കുക.",
    price: "നിലവിലെ വില: ₹2,350/ക്വിന്റൽ (ലോക്കൽ), MSP ₹2,820. സപ്ലൈക്കോ വഴി MSP ഉറപ്പ് ലഭിക്കും.",
    weather: "പ്രവചനം: 28-32°C, 75-80% ഈർപ്പം. ഈ ആഴ്ച 40-60mm മഴ. നേരത്തെ ജലസേചനം ചെയ്യുക.",
  },
  "ta-IN": {
    default: "பாலக்காட்டில் தற்போதைய நிலை: மண்ணின் ஈரப்பதத்தை சரிபார்க்கவும். குறுவை: ஜூன்-ஜூலை, சாம்பா: ஆகஸ்ட்-செப்டம்பர். 25-30°C சிறந்த வெப்பநிலை.",
    water: "நெல்லுக்கு 1200-1800mm தண்ணீர் தேவை. நாற்று: 5cm, பூக்கும்போது: 8cm. AWD முறையில் 30% சேமிக்கலாம்.",
    disease: "ப்ளாஸ்ட்: ட்ரைசைக்ளாசோல் 75% @ 0.6கி/லி. BPH: இமிடாக்ளோப்ரிட் @ 0.5மிலி/லி. வாராந்திர கண்காணிப்பு.",
    price: "தற்போதைய விலை: ₹2,350/குவிண்டால் (உள்ளூர்), MSP ₹2,820. சப்ளைக்கோ மூலம் MSP உறுதிப்படுத்தலாம்.",
    weather: "பாலக்காட் முன்னறிவிப்பு: 28-32°C, 75-80% ஈரப்பதம். இந்த வாரம் 40-60mm மழை.",
  },
  "hi-IN": {
    default: "पालक्काड की वर्तमान स्थिति: पहले मिट्टी की नमी जांचें। कुरुवई: जून-जुलाई, सांबा: अगस्त-सितंबर। 25-30°C इष्टतम तापमान।",
    water: "धान को 1200-1800mm पानी चाहिए। कल्ले: 5cm, फूल: 8cm खड़ा पानी। AWD विधि से 30% बचत।",
    disease: "ब्लास्ट: ट्राइसाइक्लाज़ोल 75% @ 0.6g/L, BPH: इमिडाक्लोप्रिड @ 0.5ml/L। साप्ताहिक निगरानी करें।",
    price: "वर्तमान भाव: ₹2,350/क्विंटल, MSP ₹2,820। सप्लाईको से MSP की गारंटी मिलती है।",
    weather: "पालक्काड पूर्वानुमान: 28-32°C, 75-80% आर्द्रता। इस सप्ताह 40-60mm वर्षा।",
  },
};

export default function VoiceAssistant() {
  inject("voice-assistant", CSS);

  const [language, setLanguage] = useState("en-IN");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [availableVoices, setAvailableVoices] = useState([]);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const loadVoices = () => setAvailableVoices(window.speechSynthesis?.getVoices() || []);
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const getResponse = (text) => {
    const lower = text.toLowerCase();
    const r = RESPONSES[language] || RESPONSES["en-IN"];
    if (lower.includes("water") || lower.includes("irrigat") || lower.includes("rain") || lower.includes("വെള്ള") || lower.includes("தண்ணீர்") || lower.includes("पानी")) return r.water;
    if (lower.includes("disease") || lower.includes("pest") || lower.includes("blast") || lower.includes("രോഗ") || lower.includes("நோய்") || lower.includes("रोग")) return r.disease;
    if (lower.includes("price") || lower.includes("market") || lower.includes("msp") || lower.includes("വില") || lower.includes("விலை") || lower.includes("भाव")) return r.price;
    if (lower.includes("weather") || lower.includes("forecast") || lower.includes("temp") || lower.includes("മഴ") || lower.includes("மழை") || lower.includes("वर्षा")) return r.weather || r.default;
    return r.default;
  };

  const speak = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = language;
    const voice = availableVoices.find(v => v.lang === language || v.lang.startsWith(language.split("-")[0]));
    if (voice) utt.voice = voice;
    utt.rate = 0.9;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utt);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Speech recognition not supported. Please use Chrome."); return; }
    setError(""); setTranscript(""); setResponse("");
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        const reply = getResponse(t);
        setResponse(reply);
        setHistory(h => [{ query: t, reply, time: new Date().toLocaleTimeString() }, ...h.slice(0, 4)]);
        speak(reply);
      }
    };
    recognition.onerror = (e) => { setError(`Recognition error: ${e.error}`); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };
  const stopSpeaking = () => { synthRef.current?.cancel(); setIsSpeaking(false); };

  const handleQuick = (text) => {
    setTranscript(text);
    const reply = getResponse(text);
    setResponse(reply);
    setHistory(h => [{ query: text, reply, time: new Date().toLocaleTimeString() }, ...h.slice(0, 4)]);
    speak(reply);
  };

  const micState = isListening ? "listening" : isSpeaking ? "speaking" : "idle";
  const micBg = micState === "listening" ? "linear-gradient(135deg,#ef4444,#dc2626)"
    : micState === "speaking" ? "linear-gradient(135deg,#3b82f6,#2563eb)"
    : "linear-gradient(135deg,#7c3aed,#5b21b6)";
  const micGlow = micState === "listening" ? "0 8px 30px rgba(239,68,68,0.5)"
    : micState === "speaking" ? "0 8px 30px rgba(59,130,246,0.5)"
    : "0 8px 30px rgba(124,58,237,0.4)";
  const micIcon = micState === "listening" ? "⏹️" : micState === "speaking" ? "🔊" : "🎤";
  const micLabel = micState === "listening" ? "Listening… tap to stop"
    : micState === "speaking" ? "Speaking…"
    : "Tap mic to speak";

  const qs = QUICK_QUESTIONS[language] || QUICK_QUESTIONS["en-IN"];
  const titleText = language === "ml-IN" ? "വോയ്‌സ് അസിസ്റ്റന്റ്"
    : language === "ta-IN" ? "குரல் உதவியாளர்"
    : language === "hi-IN" ? "वॉयस असिस्टेंट" : "Voice Assistant";
  const subtitleText = language === "ml-IN" ? "കൃഷിയെക്കുറിച്ച് ചോദിക്കൂ"
    : language === "ta-IN" ? "பண்ணை பற்றி கேளுங்கள்"
    : language === "hi-IN" ? "खेत के बारे में पूछें"
    : "Ask me anything about your farm";

  return (
    <div style={{ background:"#fff", borderRadius:"20px", overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.09)", border:"1px solid #e2e8f0" }}>

      {/* Gradient Header */}
      <div style={{ background:"linear-gradient(135deg,#1a0533,#7c3aed)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ fontSize:"28px" }}>🗣️</span>
          <div>
            <div style={{ fontWeight:800, fontSize:"1.05rem", color:"#fff", fontFamily:"'Manrope',sans-serif" }}>{titleText}</div>
            <div style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.8)", marginTop:"2px" }}>{subtitleText}</div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", borderRadius:"14px", padding:"8px 14px", fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>
          {availableVoices.length} voices available
        </div>
      </div>

      {/* Language Bar */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"11px 20px", background:"#fafafa", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap" }}>
        <span style={{ fontSize:"0.72rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", flexShrink:0 }}>🌐 Language</span>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {LANGUAGE_OPTIONS.map(lang => {
            const hasVoice = availableVoices.some(v => v.lang === lang.code || v.lang.startsWith(lang.key));
            const active = language === lang.code;
            return (
              <button key={lang.code} className="va-lang-btn" onClick={() => setLanguage(lang.code)}
                style={{ padding:"5px 12px", border:`1.5px solid ${active ? "#7c3aed" : "#e2e8f0"}`, borderRadius:"99px", background: active ? "#f5f3ff" : "#fff", color: active ? "#7c3aed" : "#475569", fontWeight: active ? 700 : 500, fontSize:"0.78rem", cursor:"pointer" }}
                title={hasVoice ? "Voice available" : "Voice not installed"}
              >
                {lang.flag} {lang.label} {hasVoice ? "✓" : "⚠️"}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding:"20px" }}>

        {/* Error */}
        {error && (
          <div style={{ padding:"12px 16px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"10px", color:"#dc2626", marginBottom:"16px", fontSize:"0.85rem", display:"flex", gap:"8px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Mic Interface */}
        <div style={{ background:"#faf5ff", borderRadius:"20px", padding:"32px 20px", marginBottom:"20px", display:"flex", flexDirection:"column", alignItems:"center", border:"1px solid #e9d5ff" }}>
          <div style={{ position:"relative", width:"120px", height:"120px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
            {isListening && (
              <>
                <div style={{ position:"absolute", width:"100%", height:"100%", borderRadius:"50%", border:"3px solid #7c3aed", animation:"va-ripple 1.5s ease-out infinite" }} />
                <div style={{ position:"absolute", width:"100%", height:"100%", borderRadius:"50%", border:"3px solid #7c3aed", animation:"va-ripple 1.5s ease-out infinite", animationDelay:"0.5s" }} />
              </>
            )}
            <button className="va-mic-btn"
              onClick={isListening ? stopListening : isSpeaking ? stopSpeaking : startListening}
              style={{ width:"96px", height:"96px", borderRadius:"50%", border:"none", background:micBg, color:"#fff", fontSize:"36px", cursor:"pointer", boxShadow:micGlow, zIndex:10, animation: isListening ? "va-pulse 1s ease-in-out infinite" : "none" }}
            >
              {micIcon}
            </button>
          </div>

          <div style={{ fontWeight:700, fontSize:"1rem", color:"#5b21b6", marginBottom:"6px" }}>{micLabel}</div>

          {isListening && (
            <div style={{ display:"flex", alignItems:"center", gap:"4px", marginTop:"8px" }}>
              {[0,0.1,0.2,0.15,0.05,0.2,0.1].map((d,i) => (
                <div key={i} style={{ width:"5px", background:"#7c3aed", borderRadius:"3px", animation:`va-wave 0.8s ease-in-out infinite`, animationDelay:`${d}s`, height:"8px" }} />
              ))}
            </div>
          )}

          {transcript && (
            <div style={{ marginTop:"16px", padding:"12px 18px", background:"#f5f3ff", borderRadius:"12px", border:"1px solid #ddd6fe", width:"100%", maxWidth:"480px", textAlign:"center" }}>
              <div style={{ fontSize:"0.7rem", fontWeight:800, color:"#7c3aed", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.08em" }}>You said</div>
              <div style={{ fontSize:"0.95rem", color:"#1e293b", fontStyle:"italic" }}>"{transcript}"</div>
            </div>
          )}

          {response && (
            <div style={{ marginTop:"14px", padding:"16px 20px", background:"linear-gradient(135deg,#eff6ff,#f0f9ff)", borderRadius:"12px", border:"1px solid #bfdbfe", width:"100%", maxWidth:"480px", animation:"va-fade 0.4s ease both" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                <span style={{ fontSize:"18px" }}>🤖</span>
                <span style={{ fontWeight:700, color:"#1e40af", flex:1, fontSize:"0.85rem" }}>AI Response</span>
                {isSpeaking && <button onClick={stopSpeaking} style={{ padding:"4px 10px", border:"none", borderRadius:"6px", background:"#fee2e2", color:"#dc2626", cursor:"pointer", fontSize:"0.75rem", fontWeight:600 }}>Stop ⏹️</button>}
              </div>
              <div style={{ fontSize:"0.9rem", color:"#374151", lineHeight:1.7 }}>{response}</div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div style={{ marginBottom:"20px" }}>
          <div style={{ fontSize:"0.72rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"12px" }}>Quick Questions</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:"10px" }}>
            {qs.map((q,i) => (
              <button key={i} className="va-quick-card" onClick={() => handleQuick(q.text)}
                style={{ padding:"13px 12px", background:"#fff", border:"1.5px solid #e9d5ff", borderRadius:"14px", cursor:"pointer", display:"flex", alignItems:"center", gap:"10px", textAlign:"left", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
                <span style={{ fontSize:"20px", flexShrink:0 }}>{q.icon}</span>
                <span style={{ fontSize:"0.78rem", fontWeight:600, color:"#3730a3", lineHeight:1.3 }}>{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ background:"#fafafa", borderRadius:"16px", padding:"16px", border:"1px solid #e2e8f0", marginBottom:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#1e293b" }}>📋 Recent Conversations</div>
              <button onClick={() => setHistory([])} style={{ padding:"4px 10px", border:"none", borderRadius:"6px", background:"#f1f5f9", color:"#64748b", cursor:"pointer", fontSize:"0.75rem" }}>Clear</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {history.map((item,i) => (
                <div key={i} style={{ padding:"12px 14px", background:"#fff", borderRadius:"10px", border:"1px solid #e2e8f0", animation:"va-fade 0.3s ease both" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"8px", marginBottom:"6px" }}>
                    <span>🧑‍🌾</span>
                    <span style={{ fontSize:"0.85rem", color:"#1e293b", fontWeight:600 }}>{item.query}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"8px" }}>
                    <span>🤖</span>
                    <span style={{ fontSize:"0.8rem", color:"#64748b", lineHeight:1.5 }}>{item.reply.substring(0,120)}…</span>
                  </div>
                  <div style={{ fontSize:"0.68rem", color:"#94a3b8", marginTop:"6px", textAlign:"right" }}>{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div style={{ padding:"13px 16px", background:"#fffbeb", borderRadius:"12px", border:"1px solid #fde68a", fontSize:"0.82rem", color:"#92400e" }}>
          <strong>💡 Tips:</strong> Use Chrome for best voice support · Speak clearly · One question at a time · Works in English, Malayalam, Tamil, Hindi
        </div>

      </div>
    </div>
  );
}
