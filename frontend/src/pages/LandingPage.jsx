import { useState, useEffect, useRef } from "react";

/* ─── CSS injected once ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes lp-fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes lp-slideUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lp-slideDown{ from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lp-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes lp-orbFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-20px,15px) scale(0.97)} }
  @keyframes lp-gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes lp-shimmer  { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
  @keyframes lp-pulse    { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.02)} }
  @keyframes lp-countUp  { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
  @keyframes lp-barFill  { from{width:0} to{width:var(--target-w)} }
  @keyframes lp-bounceIn { 0%{opacity:0;transform:translateY(20px)} 60%{transform:translateY(-4px)} 100%{opacity:1;transform:translateY(0)} }

  .lp-page *{box-sizing:border-box;margin:0;padding:0}
  .lp-page{font-family:'Poppins',sans-serif;background:#030a0f;color:#fff;overflow-x:hidden}

  .lp-nav-link{transition:color 0.2s ease}
  .lp-nav-link:hover{color:#4ade80 !important}

  .lp-cta-primary{transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1) !important}
  .lp-cta-primary:hover{transform:translateY(-4px) scale(1.03) !important;box-shadow:0 20px 60px rgba(34,197,94,0.45) !important}

  .lp-cta-ghost{transition:all 0.25s ease !important}
  .lp-cta-ghost:hover{background:rgba(255,255,255,0.08) !important;border-color:rgba(255,255,255,0.4) !important}

  .lp-feat-card{transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1) !important}
  .lp-feat-card:hover{transform:translateY(-10px) !important;box-shadow:0 30px 60px rgba(0,0,0,0.4) !important}

  .lp-step-card{transition:all 0.3s ease !important}
  .lp-step-card:hover{background:rgba(34,197,94,0.06) !important;border-color:rgba(34,197,94,0.25) !important}

  .lp-acc-row{transition:all 0.2s ease !important}
  .lp-acc-row:hover{background:rgba(255,255,255,0.04) !important}

  .lp-stat-card{transition:all 0.3s ease !important}
  .lp-stat-card:hover{transform:translateY(-6px) !important;background:rgba(255,255,255,0.06) !important}

  @media(max-width:768px){
    .lp-hero-stats{flex-wrap:wrap !important;gap:10px !important}
    .lp-feat-grid{grid-template-columns:1fr 1fr !important}
    .lp-steps-grid{grid-template-columns:1fr 1fr !important}
    .lp-acc-grid{grid-template-columns:1fr !important}
    .lp-preview-grid{grid-template-columns:1fr !important}
    .lp-hero-title{font-size:2.2rem !important}
  }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/* ─── Data ─── */
const FEATURES = [
  { icon: "🎯", title: "86.4% Stacking Ensemble", desc: "Stacking meta-learner over 6 models (LightGBM, BiLSTM, GRU, RF, XGBoost, PatchTST) predicts crop stress class on a 42-year ERA5 dataset. CCSI tercile labels, balanced 33/33/33.", color: "#22c55e", border: "#22c55e30", bg: "rgba(34,197,94,0.05)" },
  { icon: "🔮", title: "Live 7-Day Forecast", desc: "Seq2Seq LSTM forecasts Tmax/Tmin/Rain for the next 7 days with MAE 1.20°C at d+1 — beats climatology baseline by 2.7×. Combined with Open-Meteo ECMWF data for real-time inference.", color: "#6366f1", border: "#6366f130", bg: "rgba(99,102,241,0.05)" },
  { icon: "🌦️", title: "42-Year ERA5 Record", desc: "1984–2026 ECMWF reanalysis at daily resolution. Temperature, 4-layer soil moisture, precipitation, wind, radiation — 77,360 rows × 52 features across 5 taluks.", color: "#06b6d4", border: "#06b6d430", bg: "rgba(6,182,212,0.05)" },
  { icon: "🔬", title: "SHAP + Attention Explainability", desc: "Every prediction is explained. SHAP on XGBoost shows precipitation drives 18.6% of variance. BiLSTM temporal attention reveals which of the 30 input days matter most.", color: "#f59e0b", border: "#f59e0b30", bg: "rgba(245,158,11,0.05)" },
  { icon: "🌾", title: "Stage-Aware Crop Advisory", desc: "Rice growth stage tracking for Virippu (Jun) and Mundakan (Oct) seasons. Flowering + Tmax>35°C triggers high-priority alerts. KAU Package-of-Practices integrated.", color: "#10b981", border: "#10b98130", bg: "rgba(16,185,129,0.05)" },
  { icon: "🗺️", title: "Per-Taluk Forecast Coverage", desc: "All 5 master-taluks (Chittur, Kollengode, Kuzhalmannam, Mannarkkad, Nenmara) with live Open-Meteo data, soil composition, elevation, and crop distribution.", color: "#ec4899", border: "#ec489930", bg: "rgba(236,72,153,0.05)" },
];

const ACCURACY_DATA = [
  { label: "LightGBM (best individual)", value: 86.4, color: "#22c55e", task: "Classification" },
  { label: "Stacking Ensemble (final)",  value: 86.4, color: "#16a34a", task: "Ensemble" },
  { label: "Soft-voting Ensemble",       value: 85.9, color: "#86efac", task: "Ensemble" },
  { label: "BiLSTM + attention",         value: 84.9, color: "#6366f1", task: "Deep Learning" },
  { label: "GRU",                        value: 84.4, color: "#818cf8", task: "Deep Learning" },
  { label: "PatchTST (Transformer)",     value: 81.5, color: "#a78bfa", task: "Deep Learning" },
];

const STATS = [
  { value: "86.4%", label: "Stacking Ensemble", icon: "🎯", color: "#22c55e" },
  { value: "1.2°C", label: "Tmax MAE d+1",      icon: "🔮", color: "#6366f1" },
  { value: "25",    label: "ML Features",       icon: "🧬", color: "#06b6d4" },
  { value: "42 Yrs",label: "ERA5 Record",       icon: "📡", color: "#f59e0b" },
  { value: "6",     label: "Models",            icon: "🗺️", color: "#ec4899" },
];

const STEPS = [
  { n: "01", icon: "📍", title: "Select Your Taluk", desc: "Pick your location in Palakkad district for hyper-local climate and crop data." },
  { n: "02", icon: "🌱", title: "Enter Crop Details", desc: "Specify your crop type and sowing date for phenology-aware recommendations." },
  { n: "03", icon: "🤖", title: "Get AI Analysis", desc: "CCSI-based stress prediction with SHAP explanations and 7-day forecast." },
  { n: "04", icon: "✅", title: "Act Precisely", desc: "Tailored irrigation, fertilizer, and protection actions — right day, right dose." },
];

/* ─── Hero Canvas ─── */
function HeroCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, r: Math.random() + 0.5,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,197,94,0.5)"; ctx.fill();
        pts.forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx*dx+dy*dy);
          if (d < 160) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(34,197,94,${0.1 * (1 - d/160)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

/* ─── Accuracy Bar ─── */
function AccBar({ item, visible }) {
  return (
    <div className="lp-acc-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4 }}>
      <div style={{ width: 160, flexShrink: 0 }}>
        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{item.label}</div>
        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginTop: 1, fontFamily: "'JetBrains Mono',monospace" }}>{item.task}</div>
      </div>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: visible ? `${item.value}%` : "0%", background: `linear-gradient(90deg,${item.color},${item.color}99)`, borderRadius: 4, transition: "width 1s cubic-bezier(0.4,0,0.2,1) 0.1s", boxShadow: `0 0 8px ${item.color}60` }} />
      </div>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: item.color, width: 44, textAlign: "right", fontFamily: "'JetBrains Mono',monospace" }}>{item.value}%</div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function LandingPage({ onGetStarted }) {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);
  const [accVisible, setAccVisible] = useState(false);
  const accRef = useRef(null);

  useEffect(() => {
    inject("lp-css", CSS);
    const t = setTimeout(() => setVisible(true), 80);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(() => {
    if (!accRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAccVisible(true); }, { threshold: 0.2 });
    obs.observe(accRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="lp-page">

      {/* ── Fixed Nav ── */}
      <nav style={{ ...N.nav, background: scrollY > 60 ? "rgba(3,10,15,0.92)" : "transparent", backdropFilter: scrollY > 60 ? "blur(20px)" : "none", borderBottom: scrollY > 60 ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent" }}>
        <div style={N.navInner}>
          <div style={N.logo}>
            <span style={{ fontSize: "1.6rem", animation: "lp-float 4s ease-in-out infinite" }}>🌾</span>
            <span style={N.logoText}><span style={N.logoGreen}>AgriDSS</span> Intelligence</span>
          </div>
          <div style={N.navLinks}>
            <a href="#features" className="lp-nav-link" style={N.navLink}>Features</a>
            <a href="#research" className="lp-nav-link" style={N.navLink}>Research</a>
            <a href="#how" className="lp-nav-link" style={N.navLink}>How It Works</a>
            <button onClick={onGetStarted} className="lp-cta-primary" style={N.navBtn}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={H.section}>
        {/* Canvas */}
        <HeroCanvas />

        {/* Bg image */}
        <div style={{ ...H.bgImg, transform: `translateY(${scrollY * 0.25}px)` }} />
        <div style={H.overlay} />

        {/* Ambient orbs */}
        <div style={{ ...H.orb, top: "15%", left: "5%", width: 350, height: 350, background: "radial-gradient(circle,rgba(34,197,94,0.07),transparent 70%)", animation: "lp-orbFloat 12s ease-in-out infinite" }} />
        <div style={{ ...H.orb, bottom: "20%", right: "8%", width: 280, height: 280, background: "radial-gradient(circle,rgba(99,102,241,0.07),transparent 70%)", animation: "lp-orbFloat 15s ease-in-out infinite 3s" }} />

        {/* Grid */}
        <div style={H.grid} />

        {/* Content */}
        <div style={{ ...H.content, opacity: visible ? 1 : 0, transition: "opacity 0.8s ease" }}>

          {/* Badge */}
          <div style={{ ...H.badge, animation: visible ? "lp-slideDown 0.6s ease 0.1s both" : "none" }}>
            <span style={H.badgeDot} />
            <span>M.Tech Research 2026 · Verified on ERA5 Climate Data</span>
          </div>

          {/* Title */}
          <h1 className="lp-hero-title" style={{ ...H.title, animation: visible ? "lp-slideUp 0.7s ease 0.2s both" : "none" }}>
            AI-Powered Crop Stress{" "}
            <span style={H.titleGrad}>Intelligence</span>
            <br />
            for Palakkad Farmers
          </h1>

          {/* Subtitle */}
          <p style={{ ...H.subtitle, animation: visible ? "lp-slideUp 0.7s ease 0.3s both" : "none" }}>
            42 years of ERA5 climate data · 6-model stacking ensemble · <strong style={{ color: "#4ade80" }}>86.4%</strong> stress classification · Seq2Seq weather forecast <strong style={{ color: "#818cf8" }}>1.2°C</strong> MAE at day+1
          </p>

          {/* CTAs */}
          <div style={{ ...H.ctaRow, animation: visible ? "lp-slideUp 0.7s ease 0.4s both" : "none" }}>
            <button onClick={onGetStarted} className="lp-cta-primary" style={H.ctaPrimary}>
              Get Started Free
              <span style={{ fontSize: "1.1rem" }}>→</span>
            </button>
            <a href="#research" className="lp-cta-ghost" style={H.ctaGhost}>
              View Research Results
            </a>
          </div>

          {/* Stats */}
          <div className="lp-hero-stats" style={{ ...H.stats, animation: visible ? "lp-slideUp 0.7s ease 0.5s both" : "none" }}>
            {STATS.map((s, i) => (
              <div key={i} className="lp-stat-card" style={{ ...H.statCard, animationDelay: `${0.5 + i * 0.08}s` }}>
                <span style={{ fontSize: "1.4rem", marginBottom: 4 }}>{s.icon}</span>
                <span style={{ ...H.statValue, color: s.color }}>{s.value}</span>
                <span style={H.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={H.scrollHint}>
          <div style={{ animation: "lp-float 2s ease-in-out infinite" }}>
            <div style={H.scrollDot} />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={F.section}>
        <div style={F.inner}>
          <div style={F.head}>
            <span style={F.pill}>⚡ Core Features</span>
            <h2 style={F.title}>Precision Agriculture, Powered by Science</h2>
            <p style={F.sub}>Every feature is backed by 21 years of ERA5 climate data and verified research</p>
          </div>
          <div className="lp-feat-grid" style={F.grid}>
            {FEATURES.map((feat, i) => (
              <div key={i} className="lp-feat-card" style={{ ...F.card, borderColor: feat.border, background: feat.bg }}>
                <div style={{ ...F.iconWrap, background: `${feat.color}15`, border: `1px solid ${feat.color}25` }}>
                  <span style={{ fontSize: "1.7rem" }}>{feat.icon}</span>
                </div>
                <div style={{ ...F.cardTitle, color: feat.color }}>{feat.title}</div>
                <div style={F.cardDesc}>{feat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Research Accuracy ── */}
      <section id="research" style={R.section} ref={accRef}>
        {/* BG decoration */}
        <div style={R.bgGlow} />
        <div style={R.grid} />

        <div style={R.inner}>
          <div style={R.left}>
            <span style={R.pill}>🔬 Verified Results</span>
            <h2 style={R.title}>Real Numbers.<br />Real Research.</h2>
            <p style={R.sub}>
              All models tested on a held-out 2022–2026 dataset — no data leakage.
              Two-contribution framework: C1 (same-day classification) and C2 (1-day forecasting).
            </p>
            <div style={R.pills}>
              {["ERA5-Land Data", "163 Features", "21-Year Analysis", "Mann-Kendall Trend"].map(t => (
                <span key={t} style={R.tag}>{t}</span>
              ))}
            </div>
            <div style={R.researchBadge}>
              <span style={{ fontSize: "1.5rem" }}>🎓</span>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>M.Tech Thesis Research</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Department of Computer Science, 2026</div>
              </div>
            </div>
          </div>

          <div style={R.right}>
            <div style={R.accCard}>
              <div style={R.accCardHeader}>
                <span style={R.accCardTitle}>Model Accuracy Comparison</span>
                <span style={R.accCardSub}>Test Set: 2022–2026</span>
              </div>
              {ACCURACY_DATA.map((item, i) => (
                <AccBar key={i} item={item} visible={accVisible} />
              ))}
              <div style={R.accNote}>
                ✦ C1: same-day features → stress label · C2: 30-day lookback → next-day prediction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how" style={W.section}>
        <div style={W.inner}>
          <div style={W.head}>
            <span style={W.pill}>📋 How It Works</span>
            <h2 style={W.title}>From Field to Forecast in 4 Steps</h2>
            <p style={W.sub}>Designed for farmers — no technical knowledge required</p>
          </div>
          <div className="lp-steps-grid" style={W.grid}>
            {STEPS.map((step, i) => (
              <div key={i} className="lp-step-card" style={W.card}>
                <div style={W.stepNum}>{step.n}</div>
                <div style={W.stepIcon}>{step.icon}</div>
                <div style={W.stepTitle}>{step.title}</div>
                <div style={W.stepDesc}>{step.desc}</div>
                {i < STEPS.length - 1 && <div style={W.connector}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preview Section ── */}
      <section style={PV.section}>
        <div style={PV.inner}>
          <div className="lp-preview-grid" style={PV.grid}>
            <div style={PV.imgWrap}>
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80"
                alt="Rice paddy"
                style={PV.img}
              />
              {/* Floating cards */}
              <div style={PV.floatCard1}>
                <span style={{ fontSize: "1.2rem" }}>🌤️</span>
                <div>
                  <div style={PV.floatLabel}>Stress Index</div>
                  <div style={PV.floatValue}>CCSI: 0.38 — Moderate</div>
                </div>
              </div>
              <div style={PV.floatCard2}>
                <span style={{ fontSize: "1.2rem" }}>🧠</span>
                <div>
                  <div style={PV.floatLabel}>AI Confidence</div>
                  <div style={PV.floatValue}>86.4% Ensemble</div>
                </div>
              </div>
            </div>
            <div style={PV.text}>
              <span style={PV.pill}>✨ Live Dashboard</span>
              <h2 style={PV.title}>Everything in One Intelligent Dashboard</h2>
              <p style={PV.sub}>Real-time crop stress alerts, 7-day forecasts, taluk heatmaps, and AI chatbot — all designed for Palakkad farmers.</p>
              <ul style={PV.list}>
                {[
                  "Interactive taluk-level stress heatmaps",
                  "7-day weather impact forecast per crop stage",
                  "SHAP feature importance explanations",
                  "AI chatbot for instant agronomy advice",
                  "Offline mode + SMS alerts for low connectivity",
                  "Malayalam / Hindi / English multilingual support",
                ].map((item, i) => (
                  <li key={i} style={PV.listItem}>
                    <span style={PV.check}>✓</span>
                    <span style={{ color: "rgba(255,255,255,0.75)" }}>{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="lp-cta-primary" style={PV.cta}>
                Launch Dashboard →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={CT.section}>
        <div style={CT.glow} />
        <div style={CT.inner}>
          <div style={{ ...CT.badge, animation: "lp-pulse 3s ease-in-out infinite" }}>
            🌱 Join the Precision Agriculture Revolution
          </div>
          <h2 style={CT.title}>Ready to Farm Smarter?</h2>
          <p style={CT.sub}>
            Get AI-powered crop stress predictions, 1-day forecasts, and actionable irrigation guidance — completely free.
          </p>
          <div style={CT.ctaRow}>
            <button onClick={onGetStarted} className="lp-cta-primary" style={CT.ctaBtn}>
              Get Started Free
              <span style={{ fontSize: "1.2rem" }}>→</span>
            </button>
          </div>
          <div style={CT.stats}>
            {["42-Year ERA5 Record", "25 ML Features", "5 Taluks Live", "86.4% Stacking Ensemble"].map(t => (
              <span key={t} style={CT.stat}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={FT.footer}>
        <div style={FT.inner}>
          <div style={FT.brand}>
            <span style={{ fontSize: "1.6rem" }}>🌾</span>
            <span style={FT.brandText}><span style={{ color: "#4ade80" }}>AgriDSS</span> Intelligence</span>
          </div>
          <p style={FT.desc}>
            AI-Powered Agricultural Decision Support System for Palakkad, Kerala.
            <br />M.Tech Research Project · ERA5 Climate Intelligence · Verified 2026
          </p>
          <div style={FT.tags}>
            {["Stacking 86.4%", "BiLSTM 84.9%", "25 Features", "CCSI Framework", "SHAP Explainability"].map(t => (
              <span key={t} style={FT.tag}>{t}</span>
            ))}
          </div>
          <div style={FT.divider} />
          <p style={FT.copy}>© 2026 AgriDSS Intelligence · Made with 💚 for Palakkad farmers</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Styles ── */
const cmn = {
  pill: { display: "inline-block", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.22)", padding: "6px 16px", borderRadius: 100, fontSize: "0.78rem", color: "#4ade80", fontWeight: 600, marginBottom: 14 },
};

const N = {
  nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 0", transition: "all 0.35s ease" },
  navInner: { maxWidth: 1200, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoText: { fontSize: "1.2rem", fontWeight: 700, color: "#fff" },
  logoGreen: { color: "#4ade80" },
  navLinks: { display: "flex", alignItems: "center", gap: 32 },
  navLink: { color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 },
  navBtn: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none",
    padding: "10px 22px", borderRadius: 100, color: "#fff",
    fontSize: "0.88rem", fontWeight: 600, cursor: "pointer",
    boxShadow: "0 6px 24px rgba(34,197,94,0.3)",
  },
};

const H = {
  section: { position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  bgImg: {
    position: "absolute", inset: "-60px",
    backgroundImage: "url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=70)",
    backgroundSize: "cover", backgroundPosition: "center 30%",
    opacity: 0.15, filter: "saturate(1.3)",
  },
  overlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(180deg,rgba(3,10,15,0.8) 0%,rgba(3,10,15,0.55) 40%,rgba(3,10,15,0.8) 75%,#030a0f 100%)",
  },
  orb: { position: "absolute", borderRadius: "50%", pointerEvents: "none" },
  grid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(34,197,94,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.02) 1px,transparent 1px)",
    backgroundSize: "80px 80px",
  },
  content: { position: "relative", zIndex: 10, textAlign: "center", maxWidth: 900, padding: "0 24px", paddingTop: 90 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)",
    padding: "8px 22px", borderRadius: 100, fontSize: "0.8rem", color: "#4ade80",
    marginBottom: 26,
  },
  badgeDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", display: "inline-block" },
  title: { fontSize: "3.8rem", fontWeight: 900, lineHeight: 1.08, marginBottom: 22, letterSpacing: "-1.5px" },
  titleGrad: { background: "linear-gradient(135deg,#4ade80,#22c55e,#16a34a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subtitle: { fontSize: "1.1rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.75, maxWidth: 680, margin: "0 auto 34px" },
  ctaRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 52 },
  ctaPrimary: {
    display: "inline-flex", alignItems: "center", gap: 10,
    background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none",
    padding: "16px 34px", borderRadius: 100, color: "#fff",
    fontSize: "1rem", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 12px 40px rgba(34,197,94,0.35)",
  },
  ctaGhost: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)",
    padding: "15px 28px", borderRadius: 100, color: "rgba(255,255,255,0.8)",
    fontSize: "0.95rem", fontWeight: 500, textDecoration: "none",
  },
  stats: { display: "flex", justifyContent: "center", gap: 12 },
  statCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18,
    padding: "16px 22px", minWidth: 90,
  },
  statValue: { fontSize: "1.5rem", fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" },
  statLabel: { fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" },
  scrollHint: { position: "absolute", bottom: 36, display: "flex", justifyContent: "center", width: "100%" },
  scrollDot: { width: 10, height: 10, borderRadius: "50%", background: "rgba(34,197,94,0.6)", boxShadow: "0 0 14px rgba(34,197,94,0.5)" },
};

const F = {
  section: { padding: "110px 0", background: "linear-gradient(180deg,#030a0f 0%,#050e0a 100%)" },
  inner: { maxWidth: 1200, margin: "0 auto", padding: "0 28px" },
  head: { textAlign: "center", marginBottom: 56 },
  pill: { ...cmn.pill },
  title: { fontSize: "2.5rem", fontWeight: 800, color: "#fff", marginBottom: 14, letterSpacing: "-0.5px" },
  sub: { fontSize: "1rem", color: "rgba(255,255,255,0.5)", maxWidth: 580, margin: "0 auto", lineHeight: 1.65 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 },
  card: {
    border: "1px solid", borderRadius: 22, padding: "28px 26px",
    transition: "all 0.3s ease", cursor: "default",
    boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
  },
  iconWrap: { width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  cardTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: 10 },
  cardDesc: { fontSize: "0.87rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 },
};

const R = {
  section: { position: "relative", padding: "110px 0", background: "#040d12", overflow: "hidden" },
  bgGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "80%", height: "80%", background: "radial-gradient(ellipse,rgba(34,197,94,0.04) 0%,transparent 70%)", pointerEvents: "none" },
  grid: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(34,197,94,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.02) 1px,transparent 1px)", backgroundSize: "60px 60px" },
  inner: { maxWidth: 1200, margin: "0 auto", padding: "0 28px", display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 64, alignItems: "center", position: "relative", zIndex: 2 },
  left: {},
  pill: { ...cmn.pill },
  title: { fontSize: "2.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.8px" },
  sub: { fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 },
  pills: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  tag: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "5px 13px", borderRadius: 100, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" },
  researchBadge: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)",
    padding: "14px 18px", borderRadius: 14,
  },
  right: {},
  accCard: {
    background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22,
    padding: "24px 20px",
  },
  accCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" },
  accCardTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#fff" },
  accCardSub: { fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace" },
  accNote: { fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", marginTop: 14, textAlign: "center", lineHeight: 1.5 },
};

const W = {
  section: { padding: "110px 0", background: "#030a0f" },
  inner: { maxWidth: 1200, margin: "0 auto", padding: "0 28px" },
  head: { textAlign: "center", marginBottom: 56 },
  pill: { ...cmn.pill },
  title: { fontSize: "2.4rem", fontWeight: 800, color: "#fff", marginBottom: 14, letterSpacing: "-0.5px" },
  sub: { fontSize: "1rem", color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 },
  grid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, position: "relative" },
  card: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: "32px 22px", textAlign: "center", position: "relative",
  },
  stepNum: {
    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    padding: "4px 12px", borderRadius: 100, fontSize: "0.68rem", fontWeight: 800, color: "#fff",
    boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
  },
  stepIcon: { fontSize: "2rem", marginBottom: 14, marginTop: 6 },
  stepTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 8 },
  stepDesc: { fontSize: "0.83rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 },
  connector: { position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)", color: "#22c55e", fontSize: "1.2rem", opacity: 0.5 },
};

const PV = {
  section: { padding: "110px 0", background: "linear-gradient(180deg,#030a0f 0%,#050e0a 100%)" },
  inner: { maxWidth: 1200, margin: "0 auto", padding: "0 28px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" },
  imgWrap: { position: "relative", borderRadius: 24, overflow: "visible" },
  img: { width: "100%", height: 440, objectFit: "cover", borderRadius: 24, display: "block", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" },
  floatCard1: {
    position: "absolute", bottom: 24, left: -20,
    background: "rgba(3,10,15,0.9)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16,
    padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    animation: "lp-float 4s ease-in-out infinite",
  },
  floatCard2: {
    position: "absolute", top: 24, right: -20,
    background: "rgba(3,10,15,0.9)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16,
    padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    animation: "lp-float 5s ease-in-out infinite 1s",
  },
  floatLabel: { fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", marginBottom: 2 },
  floatValue: { fontSize: "0.82rem", fontWeight: 600, color: "#fff" },
  text: {},
  pill: { ...cmn.pill },
  title: { fontSize: "2.2rem", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-0.5px", lineHeight: 1.2 },
  sub: { fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 },
  list: { listStyle: "none", padding: 0, marginBottom: 32 },
  listItem: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  check: { color: "#22c55e", fontWeight: 700, marginTop: 1 },
  cta: {
    display: "inline-flex", alignItems: "center", gap: 10,
    background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none",
    padding: "14px 28px", borderRadius: 100, color: "#fff",
    fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 10px 30px rgba(34,197,94,0.3)",
  },
};

const CT = {
  section: { position: "relative", padding: "100px 0", background: "linear-gradient(135deg,rgba(34,197,94,0.08),rgba(16,163,74,0.04))", borderTop: "1px solid rgba(34,197,94,0.1)", overflow: "hidden" },
  glow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60%", height: "80%", background: "radial-gradient(ellipse,rgba(34,197,94,0.08) 0%,transparent 70%)", pointerEvents: "none" },
  inner: { maxWidth: 700, margin: "0 auto", padding: "0 28px", textAlign: "center", position: "relative", zIndex: 2 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
    padding: "8px 20px", borderRadius: 100, fontSize: "0.8rem", color: "#4ade80",
    marginBottom: 24,
  },
  title: { fontSize: "2.8rem", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-0.8px" },
  sub: { fontSize: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 },
  ctaRow: { marginBottom: 32 },
  ctaBtn: {
    display: "inline-flex", alignItems: "center", gap: 12,
    background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none",
    padding: "18px 42px", borderRadius: 100, color: "#fff",
    fontSize: "1.05rem", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 12px 40px rgba(34,197,94,0.4)",
  },
  stats: { display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  stat: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
    padding: "6px 16px", borderRadius: 100, fontSize: "0.78rem", color: "rgba(255,255,255,0.55)",
  },
};

const FT = {
  footer: { padding: "56px 0 40px", background: "#020609", borderTop: "1px solid rgba(255,255,255,0.05)" },
  inner: { maxWidth: 1200, margin: "0 auto", padding: "0 28px", textAlign: "center" },
  brand: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 },
  brandText: { fontSize: "1.2rem", fontWeight: 700, color: "#fff" },
  desc: { fontSize: "0.88rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 20 },
  tags: { display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 28 },
  tag: { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", padding: "4px 12px", borderRadius: 100, fontSize: "0.72rem", color: "rgba(74,222,128,0.7)" },
  divider: { height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 22 },
  copy: { fontSize: "0.78rem", color: "rgba(255,255,255,0.25)" },
};
