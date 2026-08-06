import { useEffect, useState } from "react";
import { useLanguage } from "../LanguageContext";

const HERO_IMAGES = {
  main: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80",
  rice: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80",
  farm: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
  harvest: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80",
  tech: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
};

const CSS = `
  @keyframes wFadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes wPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.3)} 70%{box-shadow:0 0 0 12px rgba(22,163,74,0)} }
  @keyframes wShimmer{ 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes wGlow   { 0%,100%{box-shadow:0 8px 32px rgba(22,163,74,0.15)} 50%{box-shadow:0 8px 48px rgba(22,163,74,0.35)} }
  @keyframes wCount  { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }

  .w-stat-card { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1) !important; }
  .w-stat-card:hover { transform: translateY(-6px) scale(1.04) !important; box-shadow: 0 20px 48px rgba(22,163,74,0.20) !important; }
  .w-feature-card { transition: all 0.3s ease !important; cursor: default; }
  .w-feature-card:hover { transform: translateY(-8px) !important; box-shadow: 0 24px 56px rgba(22,163,74,0.18) !important; border-color: #86efac !important; }
  .w-step-btn { transition: all 0.2s ease !important; }
  .w-step-btn:hover { background: #dcfce7 !important; border-color: #86efac !important; transform: translateY(-2px); }
  .w-img-card { transition: transform 0.5s ease, box-shadow 0.3s ease !important; overflow: hidden; border-radius: 20px; }
  .w-img-card:hover { transform: scale(1.03) !important; box-shadow: 0 24px 60px rgba(0,0,0,0.25) !important; }
  .w-img-card img { transition: transform 0.5s ease !important; }
  .w-img-card:hover img { transform: scale(1.08) !important; }
  .w-cta-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important; }
  .w-cta-btn:hover { transform: translateY(-3px) scale(1.04) !important; box-shadow: 0 16px 48px rgba(22,163,74,0.45) !important; }
`;

function injectCSS(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

const STATS = [
  { value: "140K+", label: "ERA5 Records", icon: "📡", color: "#16a34a", bg: "#f0fdf4" },
  { value: "88.3%", label: "ML Accuracy", icon: "🎯", color: "#0ea5e9", bg: "#eff6ff" },
  { value: "13",    label: "ML Models",   icon: "🧠", color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "SHAP",  label: "Explainable AI", icon: "🔍", color: "#f59e0b", bg: "#fffbeb" },
];

const FEATURES = [
  {
    icon: "📊", title: "DSS Analysis", color: "#16a34a", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
    desc: "AI-powered crop stress predictions with 8-model ensemble, SHAP explanations, and 7-day forecasts.",
  },
  {
    icon: "🧠", title: "Advanced AI Models", color: "#8b5cf6", bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)",
    desc: "Research-backed ML analysis with LSTM, Transformer, XGBoost, and 10+ models from ERA5 climate data.",
  },
  {
    icon: "🌾", title: "Crop Intelligence", color: "#f59e0b", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)",
    desc: "AI crop disease detection and growth-stage-aware recommendations with treatment guidance.",
  },
  {
    icon: "🗺️", title: "Interactive Maps", color: "#0ea5e9", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)",
    desc: "Taluk-level stress heatmaps, weather overlays and crop distribution for all of Palakkad.",
  },
  {
    icon: "💬", title: "AgriBot Assistant", color: "#10b981", bg: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
    desc: "24/7 conversational AI for agriculture questions, pest alerts, and real-time crop advice.",
  },
  {
    icon: "🎓", title: "Research Insights", color: "#ec4899", bg: "linear-gradient(135deg,#fdf4ff,#fae8ff)",
    desc: "Mann-Kendall trend analysis, CCSI projections, and MTech-level research findings.",
  },
];

export default function Welcome({ user, onGetStarted }) {
  injectCSS("welcome-v2", CSS);
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const name = user?.name || user?.username || "Farmer";

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <div style={S.hero}>
        <div style={{ ...S.heroBg, backgroundImage: `url(${HERO_IMAGES.main})` }} />
        <div style={S.heroMask} />
        <div style={{ ...S.heroBody, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.7s ease" }}>
          <div style={S.heroFloatIcon}>🌾</div>
          <h1 style={S.heroTitle}>
            Welcome back,{" "}
            <span style={S.heroName}>{name}</span>!
          </h1>
          <p style={S.heroSub}>
            Your intelligent agricultural companion powered by ERA5 climate data, 13 AI models, and SHAP explainability.
          </p>

          {/* Stats row inside hero */}
          <div style={S.heroStats}>
            {STATS.map((s, i) => (
              <div key={i} className="w-stat-card" style={S.heroStatCard}>
                <div style={S.heroStatIcon}>{s.icon}</div>
                <div style={{ ...S.heroStatValue, color: s.color }}>{s.value}</div>
                <div style={S.heroStatLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <section style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.pill}>🚀 Quick Start</span>
          <h2 style={S.sectionTitle}>Jump right in</h2>
        </div>
        <div style={S.steps}>
          {[
            { num: "1", title: "Run DSS Analysis", desc: "Get AI-powered crop stress predictions and irrigation advice", tab: "dss", icon: "📊" },
            { num: "2", title: "Complete Profile",  desc: "Add your crops and location for personalised recommendations", tab: "profile", icon: "👤" },
            { num: "3", title: "Explore the Map",   desc: "View Palakkad taluk-level stress heatmaps and weather data", tab: "map", icon: "🗺️" },
          ].map((step, i) => (
            <div key={i} style={S.stepCard}>
              <div style={S.stepNum}>{step.num}</div>
              <div style={S.stepIconWrap}>{step.icon}</div>
              <h3 style={S.stepTitle}>{step.title}</h3>
              <p style={S.stepDesc}>{step.desc}</p>
              <button className="w-step-btn" style={S.stepBtn} onClick={() => onGetStarted?.(step.tab)}>
                {step.title === "Run DSS Analysis" ? "Start Analysis →" : step.title === "Complete Profile" ? "Set Up Profile →" : "Open Map →"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Palakkad Gallery ── */}
      <section style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.pill}>🏞️ Palakkad</span>
          <h2 style={S.sectionTitle}>Where AI Meets Agriculture</h2>
        </div>
        <div style={S.gallery}>
          <div className="w-img-card" style={{ ...S.imgCard, gridColumn: "span 2", gridRow: "span 2" }}>
            <img src={HERO_IMAGES.rice} alt="Rice paddy" style={S.img} />
            <div style={S.imgLabel}><span>🌾 Rice Paddy Fields</span></div>
          </div>
          <div className="w-img-card" style={S.imgCard}>
            <img src={HERO_IMAGES.farm} alt="Farm" style={S.img} />
            <div style={S.imgLabel}><span>🚜 Modern Farming</span></div>
          </div>
          <div className="w-img-card" style={S.imgCard}>
            <img src={HERO_IMAGES.harvest} alt="Harvest" style={S.img} />
            <div style={S.imgLabel}><span>🌾 Harvest Season</span></div>
          </div>
          <div className="w-img-card" style={S.imgCard}>
            <img src={HERO_IMAGES.tech} alt="Technology" style={S.img} />
            <div style={S.imgLabel}><span>🤖 AI Technology</span></div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.pill}>✨ Platform Features</span>
          <h2 style={S.sectionTitle}>Everything you need to farm smarter</h2>
        </div>
        <div style={S.featureGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className="w-feature-card" style={{ ...S.featureCard, background: f.bg, animationDelay: `${i * 0.08}s` }}>
              <div style={{ ...S.featureIconWrap, border: `1.5px solid ${f.color}30` }}>
                <span style={S.featureIcon}>{f.icon}</span>
              </div>
              <h3 style={{ ...S.featureTitle, color: f.color }}>{f.title}</h3>
              <p style={S.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={S.cta}>
        <div style={S.ctaInner}>
          <div style={S.ctaLeft}>
            <div style={S.ctaBadge}>🌱 Ready to start?</div>
            <h2 style={S.ctaTitle}>Transform your farming with AI</h2>
            <p style={S.ctaSub}>Make data-driven decisions backed by 20 years of Palakkad climate data and state-of-the-art ML models.</p>
          </div>
          <div style={S.ctaRight}>
            <button className="w-cta-btn" style={S.ctaBtn} onClick={() => onGetStarted?.("dss")}>
              Run DSS Analysis →
            </button>
            <button className="w-cta-btn" style={S.ctaBtnGhost} onClick={() => onGetStarted?.("advisor")}>
              Ask AgriBot
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const S = {
  page: { maxWidth: 1400, margin: "0 auto", padding: "0 24px 56px" },

  // Hero
  hero: { position: "relative", minHeight: 480, borderRadius: 28, overflow: "hidden", marginBottom: 56, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 24px 72px rgba(0,0,0,0.22)" },
  heroBg: { position: "absolute", inset: 0, backgroundSize: "cover", backgroundPosition: "center" },
  heroMask: { position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(5,46,22,0.82) 0%,rgba(22,163,74,0.55) 60%,rgba(5,46,22,0.75) 100%)" },
  heroBody: { position: "relative", zIndex: 2, textAlign: "center", padding: "56px 32px" },
  heroFloatIcon: { fontSize: 72, animation: "wFloat 3s ease-in-out infinite", marginBottom: 16, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" },
  heroTitle: { fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px", fontFamily: "'Manrope','Inter',sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.4)" },
  heroName: { background: "linear-gradient(90deg,#86efac,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroSub: { fontSize: "1.05rem", color: "rgba(255,255,255,0.88)", maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.65, textShadow: "0 1px 4px rgba(0,0,0,0.3)" },
  heroStats: { display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" },
  heroStatCard: { background: "rgba(255,255,255,0.14)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 16, padding: "16px 24px", textAlign: "center", minWidth: 110 },
  heroStatIcon: { fontSize: "1.4rem", marginBottom: 4 },
  heroStatValue: { fontSize: "1.5rem", fontWeight: 800, fontFamily: "'Manrope',sans-serif" },
  heroStatLabel: { fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 },

  // Sections
  section: { marginBottom: 56 },
  sectionHead: { textAlign: "center", marginBottom: 32 },
  sectionTitle: { fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: "#0f172a", margin: "8px 0 0", fontFamily: "'Manrope',sans-serif" },
  pill: { display: "inline-block", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", padding: "5px 14px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.03em" },

  // Quick start steps
  steps: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 },
  stepCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.05)", position: "relative" },
  stepNum: { position: "absolute", top: -12, left: 24, width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", fontSize: "0.82rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(22,163,74,0.35)" },
  stepIconWrap: { fontSize: "2rem", marginTop: 8 },
  stepTitle: { fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 },
  stepDesc: { fontSize: "0.87rem", color: "#64748b", lineHeight: 1.6, margin: 0, flex: 1 },
  stepBtn: { display: "inline-block", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, color: "#15803d", fontSize: "0.87rem", fontWeight: 700, padding: "10px 18px", cursor: "pointer", alignSelf: "flex-start" },

  // Gallery
  gallery: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gridAutoRows: 200, gap: 14 },
  imgCard: { position: "relative", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.14)" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  imgLabel: { position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.65),transparent)", display: "flex", alignItems: "flex-end", padding: 14, color: "#fff", fontSize: "0.9rem", fontWeight: 600 },

  // Features
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 },
  featureCard: { border: "1.5px solid #e2e8f0", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 12 },
  featureIconWrap: { width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" },
  featureIcon: { fontSize: "1.7rem" },
  featureTitle: { fontSize: "1rem", fontWeight: 700, margin: 0 },
  featureDesc: { fontSize: "0.85rem", color: "#475569", lineHeight: 1.6, margin: 0 },

  // CTA
  cta: { background: "linear-gradient(135deg,#052e16,#15803d,#052e16)", borderRadius: 24, padding: "48px 40px", boxShadow: "0 20px 64px rgba(22,163,74,0.3)" },
  ctaInner: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" },
  ctaLeft: { flex: 1, minWidth: 260 },
  ctaRight: { display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" },
  ctaBadge: { display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 20, padding: "5px 14px", color: "#86efac", fontSize: "0.78rem", fontWeight: 700, marginBottom: 10 },
  ctaTitle: { fontSize: "clamp(1.3rem,2.5vw,1.9rem)", fontWeight: 800, color: "#fff", margin: "0 0 10px", fontFamily: "'Manrope',sans-serif" },
  ctaSub: { fontSize: "0.9rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.65, margin: 0, maxWidth: 500 },
  ctaBtn: { background: "#fff", border: "none", borderRadius: 12, color: "#15803d", fontSize: "0.95rem", fontWeight: 700, padding: "14px 28px", cursor: "pointer", boxShadow: "0 8px 28px rgba(0,0,0,0.18)", whiteSpace: "nowrap" },
  ctaBtnGhost: { background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.28)", borderRadius: 12, color: "#fff", fontSize: "0.95rem", fontWeight: 600, padding: "14px 28px", cursor: "pointer", whiteSpace: "nowrap" },
};
