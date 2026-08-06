import { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes sp-fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes sp-slideUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sp-scaleIn  { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes sp-glow     { 0%,100%{box-shadow:0 0 30px rgba(34,197,94,0.3),0 0 60px rgba(34,197,94,0.1)} 50%{box-shadow:0 0 50px rgba(34,197,94,0.5),0 0 100px rgba(34,197,94,0.2)} }
  @keyframes sp-ring     { 0%{transform:scale(0.6);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }
  @keyframes sp-shimmer  { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
  @keyframes sp-blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes sp-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes sp-fadeOut  { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.03)} }
  @keyframes sp-popIn    { 0%{opacity:0;transform:scale(0.5) translateY(10px)} 70%{transform:scale(1.05) translateY(-2px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes sp-gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes sp-orbFloat { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-20px) translateX(10px)} 66%{transform:translateY(10px) translateX(-10px)} }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

const ACCURACY_LINES = [
  { label: "LightGBM (best individual)", value: 86.4, color: "#22c55e", delay: 800 },
  { label: "Stacking Ensemble (final)",  value: 86.4, color: "#6366f1", delay: 1100 },
  { label: "BiLSTM (best DL)",           value: 84.9, color: "#a78bfa", delay: 1400 },
];

const LOAD_STEPS = [
  { text: "Initializing ERA5 climate engine…", at: 0 },
  { text: "Loading 25-feature ensemble pipeline…", at: 22 },
  { text: "Calibrating CCSI stress thresholds…", at: 45 },
  { text: "Syncing 5-taluk geographic data…", at: 68 },
  { text: "Activating SHAP explainability…", at: 85 },
  { text: "System ready.", at: 98 },
];

export default function SplashScreenAgriFlyer({ onComplete }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [accuracyShown, setAccuracyShown] = useState([false, false, false]);

  inject("sp-css", CSS);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgLoaded(true);
    img.src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=70";

    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1300);

    ACCURACY_LINES.forEach((_, i) => {
      setTimeout(() => setAccuracyShown(p => { const n=[...p]; n[i]=true; return n; }), ACCURACY_LINES[i].delay);
    });

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progressInterval); return 100; }
        const bump = p < 40 ? 3 : p < 75 ? 2 : p < 92 ? 1.2 : 0.5;
        return Math.min(100, p + bump + Math.random() * 0.8);
      });
    }, 55);

    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onComplete?.(), 700);
    }, 3600);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(exitTimer); clearInterval(progressInterval);
    };
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,197,94,0.45)";
        ctx.fill();

        pts.forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(34,197,94,${0.12 * (1 - d / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const loadMsg = LOAD_STEPS.slice().reverse().find(s => progress >= s.at)?.text ?? LOAD_STEPS[0].text;

  return (
    <div style={{ ...S.root, animation: exiting ? "sp-fadeOut 0.7s ease forwards" : undefined }}>
      {/* Neural net canvas */}
      <canvas ref={canvasRef} style={S.canvas} />

      {/* Background image */}
      <div style={{ ...S.bgImg, backgroundImage: "url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=70)", opacity: imgLoaded ? 0.18 : 0 }} />

      {/* Gradient overlays */}
      <div style={S.overlay} />
      <div style={S.radialGlow} />

      {/* Decorative orbs */}
      <div style={{ ...S.orb, top: "10%", right: "12%", width: 180, height: 180, background: "radial-gradient(circle,rgba(34,197,94,0.12),transparent 70%)", animation: "sp-orbFloat 8s ease-in-out infinite" }} />
      <div style={{ ...S.orb, bottom: "15%", left: "8%", width: 120, height: 120, background: "radial-gradient(circle,rgba(99,102,241,0.1),transparent 70%)", animation: "sp-orbFloat 10s ease-in-out infinite 2s" }} />

      {/* Grid */}
      <div style={S.grid} />

      <div style={{ ...S.content, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "none" : "translateY(16px)", transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Logo */}
        <div style={S.logoWrap}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ ...S.ring, animationDelay: `${i * 0.5}s`, animation: phase >= 1 ? `sp-ring 2.5s ease-out infinite ${i * 0.5}s` : "none" }} />
          ))}
          <div style={{ ...S.logoCircle, animation: phase >= 1 ? "sp-glow 2.5s ease-in-out infinite" : "none" }}>
            <span style={S.logoEmoji}>🌾</span>
          </div>
        </div>

        {/* Brand */}
        <div style={{ ...S.brand, animation: phase >= 1 ? "sp-slideUp 0.6s ease 0.15s both" : "none" }}>
          <span style={S.brandGreen}>AgriDSS</span>
          <span style={S.brandWhite}> Intelligence</span>
        </div>
        <div style={{ ...S.tagline, animation: phase >= 1 ? "sp-slideUp 0.6s ease 0.25s both" : "none" }}>
          AI-Powered Crop Stress Forecasting • Palakkad, Kerala
        </div>

        {/* Accuracy panel */}
        <div style={{ ...S.accPanel, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "none" : "translateY(14px)", transition: "all 0.5s ease 0.1s" }}>
          <div style={S.accHeader}>
            <span style={S.accHeaderDot} />
            <span style={S.accHeaderText}>VERIFIED RESEARCH RESULTS</span>
            <span style={S.accHeaderDot} />
          </div>
          {ACCURACY_LINES.map((l, i) => (
            <div key={i} style={{ ...S.accRow, animation: accuracyShown[i] ? "sp-slideUp 0.4s ease both" : "none", opacity: accuracyShown[i] ? 1 : 0 }}>
              <span style={S.accLabel}>{l.label}</span>
              <div style={S.accBarWrap}>
                <div style={{ ...S.accBar, width: accuracyShown[i] ? `${l.value}%` : "0%", background: `linear-gradient(90deg,${l.color},${l.color}cc)`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1) 0.1s" }} />
              </div>
              <span style={{ ...S.accValue, color: l.color }}>{l.value}%</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ ...S.progressWrap, opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.4s ease" }}>
          <div style={S.progressMeta}>
            <span style={S.loadMsg}>{loadMsg}</span>
            <span style={S.loadPct}>{Math.round(Math.min(100, progress))}%</span>
          </div>
          <div style={S.track}>
            <div style={{ ...S.fill, width: `${Math.min(100, progress)}%` }}>
              <div style={S.fillShine} />
            </div>
          </div>
        </div>

        {/* Bottom badge */}
        <div style={{ ...S.badge, animation: phase >= 2 ? "sp-fadeIn 0.5s ease 0.6s both" : "none", opacity: phase >= 2 ? 1 : 0 }}>
          <span>🎓 M.Tech Research 2026</span>
          <span style={S.badgeDivider}>·</span>
          <span>ERA5 • 2005–2026</span>
          <span style={S.badgeDivider}>·</span>
          <span>21 Years Climate Data</span>
        </div>
      </div>
    </div>
  );
}

const S = {
  root: {
    position: "fixed", inset: 0, zIndex: 10000, overflow: "hidden",
    background: "#030a0f",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Poppins', sans-serif",
  },
  canvas: { position: "absolute", inset: 0, opacity: 0.6 },
  bgImg: {
    position: "absolute", inset: 0,
    backgroundSize: "cover", backgroundPosition: "center 30%",
    transition: "opacity 2s ease", filter: "saturate(0.8)",
  },
  overlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(180deg,rgba(3,10,15,0.85) 0%,rgba(3,10,15,0.7) 50%,rgba(3,10,15,0.92) 100%)",
  },
  radialGlow: {
    position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
    width: "70%", height: "60%",
    background: "radial-gradient(ellipse at center,rgba(34,197,94,0.06) 0%,transparent 70%)",
    pointerEvents: "none",
  },
  grid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(34,197,94,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.025) 1px,transparent 1px)",
    backgroundSize: "60px 60px",
  },
  orb: { position: "absolute", borderRadius: "50%", pointerEvents: "none" },

  content: {
    position: "relative", zIndex: 10,
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 0, padding: "24px 20px", maxWidth: 560, width: "100%",
    transition: "all 0.7s ease",
  },

  // Logo
  logoWrap: { position: "relative", width: 120, height: 120, marginBottom: 24 },
  ring: {
    position: "absolute", inset: 0,
    border: "2px solid rgba(34,197,94,0.4)", borderRadius: "50%",
  },
  logoCircle: {
    position: "absolute", inset: 18,
    borderRadius: "50%",
    background: "linear-gradient(135deg,rgba(34,197,94,0.25),rgba(3,10,15,0.9))",
    border: "2px solid rgba(34,197,94,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoEmoji: { fontSize: 40, filter: "drop-shadow(0 0 16px rgba(34,197,94,0.8))" },

  brand: { fontSize: "2rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" },
  brandGreen: { background: "linear-gradient(135deg,#4ade80,#22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  brandWhite: { color: "#fff" },
  tagline: { fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", marginBottom: 28, textAlign: "center" },

  // Accuracy panel
  accPanel: {
    width: "100%", marginBottom: 24,
    background: "rgba(255,255,255,0.025)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(34,197,94,0.12)", borderRadius: 16,
    padding: "18px 22px",
  },
  accHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, justifyContent: "center" },
  accHeaderDot: { flex: 1, height: 1, background: "rgba(34,197,94,0.2)" },
  accHeaderText: { fontSize: "0.62rem", color: "#4ade80", fontWeight: 600, letterSpacing: "0.12em", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" },
  accRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  accLabel: { fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", width: 180, flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" },
  accBarWrap: { flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" },
  accBar: { height: "100%", borderRadius: 4, boxShadow: "0 0 8px currentColor" },
  accValue: { fontSize: "0.78rem", fontWeight: 700, width: 40, textAlign: "right", fontFamily: "'JetBrains Mono',monospace" },

  // Progress
  progressWrap: { width: "100%", marginBottom: 20 },
  progressMeta: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  loadMsg: { fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontFamily: "'JetBrains Mono',monospace" },
  loadPct: { fontSize: "0.8rem", fontWeight: 700, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace" },
  track: { height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 5, overflow: "hidden" },
  fill: {
    height: "100%", borderRadius: 5,
    background: "linear-gradient(90deg,#16a34a,#22c55e,#4ade80)",
    backgroundSize: "200% 100%",
    animation: "sp-gradMove 1.5s ease infinite",
    boxShadow: "0 0 12px rgba(34,197,94,0.5)",
    position: "relative", transition: "width 0.15s ease",
  },
  fillShine: {
    position: "absolute", inset: 0,
    background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)",
    animation: "sp-shimmer 1.5s linear infinite",
  },

  badge: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)",
    borderRadius: 100, padding: "8px 18px",
    fontSize: "0.68rem", color: "rgba(255,255,255,0.55)", fontWeight: 500,
  },
  badgeDivider: { color: "rgba(34,197,94,0.4)" },
};
