import { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes auth-fadeIn   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes auth-slideIn  { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes auth-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes auth-orbFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(14px,-14px)} }
  @keyframes auth-ring     { 0%{transform:scale(0.7);opacity:0.8} 100%{transform:scale(2);opacity:0} }
  @keyframes auth-glow     { 0%,100%{box-shadow:0 0 30px rgba(34,197,94,0.2),0 0 60px rgba(34,197,94,0.08)} 50%{box-shadow:0 0 50px rgba(34,197,94,0.4),0 0 100px rgba(34,197,94,0.15)} }
  @keyframes auth-pulse    { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes auth-gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes auth-spinner  { to{transform:rotate(360deg)} }
  @keyframes auth-leafDrift{
    0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0}
    8%{opacity:0.6}
    92%{opacity:0.6}
    100%{transform:translateY(-100vh) translateX(40px) rotate(360deg);opacity:0}
  }

  .auth-root { font-family:'Poppins',sans-serif; }
  .auth-root * { box-sizing:border-box; }

  .auth-input-field {
    background: rgba(255,255,255,0.06) !important;
    border: 1.5px solid rgba(255,255,255,0.12) !important;
    color: #fff !important;
    font-family: 'Inter', sans-serif !important;
    transition: all 0.25s ease !important;
  }
  .auth-input-field::placeholder { color: rgba(255,255,255,0.3) !important; }
  .auth-input-field:focus {
    border-color: rgba(34,197,94,0.6) !important;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.12), 0 4px 20px rgba(34,197,94,0.1) !important;
    background: rgba(34,197,94,0.06) !important;
    outline: none !important;
  }

  .auth-submit-btn {
    background: linear-gradient(135deg, #22c55e, #16a34a) !important;
    border: none !important;
    color: #fff !important;
    font-family: 'Poppins', sans-serif !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    position: relative !important;
    overflow: hidden !important;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1) !important;
  }
  .auth-submit-btn::before {
    content:'';
    position:absolute; inset:0;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  .auth-submit-btn:hover:not(:disabled)::before { transform:translateX(100%); }
  .auth-submit-btn:hover:not(:disabled) {
    transform: translateY(-3px) !important;
    box-shadow: 0 16px 40px rgba(34,197,94,0.45) !important;
  }
  .auth-submit-btn:disabled { opacity:0.5 !important; cursor:not-allowed !important; }

  .auth-toggle-btn { transition: all 0.2s ease !important; }
  .auth-toggle-btn:hover { color: #22c55e !important; }

  .auth-back-btn { transition: all 0.2s ease !important; }
  .auth-back-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.2) !important; }

  .auth-social-btn { transition: all 0.25s ease !important; }
  .auth-social-btn:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.25) !important; transform: translateY(-2px) !important; }

  .auth-feat-card { transition: transform 0.3s ease !important; }
  .auth-feat-card:hover { transform: translateY(-4px) !important; }

  @media (max-width: 1024px) {
    .auth-left-panel { display:none !important; }
    .auth-right-panel { max-width:100% !important; }
  }
`;

function inject(id, css) {
  if (typeof document !== "undefined" && !document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

/* ─── Left panel canvas ─── */
function LeftCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: Math.random() + 0.4,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(74,222,128,0.4)"; ctx.fill();
        pts.forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx*dx+dy*dy);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(74,222,128,${0.12 * (1 - d/120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
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

const FEATS = [
  { icon: "🎯", value: "86.4%", label: "Stacking Ensemble Accuracy", color: "#22c55e" },
  { icon: "🔮", value: "1.2°C", label: "Tmax MAE at day+1",         color: "#818cf8" },
  { icon: "🧬", value: "25",    label: "ML Features Engineered",     color: "#06b6d4" },
  { icon: "📡", value: "42 Yrs",label: "ERA5 Climate Record",         color: "#f59e0b" },
];

const LEAVES = ["🌿", "🍃", "🌱", "☘️", "🌾"];

export default function Auth({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [visible, setVisible] = useState(false);

  inject("auth-css-v3", CSS);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields"); setLoading(false); return;
    }
    if (mode === "register") {
      if (!formData.name) { setError("Please enter your name"); setLoading(false); return; }
      if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
      if (formData.password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
    }

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");

      if (mode === "register") {
        setSuccess("Account created! Please sign in.");
        setMode("login");
        setFormData({ ...formData, password: "", confirmPassword: "" });
      } else {
        onLogin?.(data.user, data.token);
      }
    } catch (err) {
      if (err.name === "AbortError") setError("Request timed out. Check if the server is running.");
      else if (err.message === "Failed to fetch") setError("Cannot connect to server. Ensure backend is running on port 8000.");
      else setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => m === "login" ? "register" : "login");
    setError(""); setSuccess("");
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const pwdStrength = (() => {
    const p = formData.password;
    if (!p) return null;
    if (p.length < 6) return { level: 1, label: "Weak", color: "#ef4444" };
    if (p.length < 10 || !/[A-Z]/.test(p)) return { level: 2, label: "Fair", color: "#f59e0b" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { level: 3, label: "Strong", color: "#22c55e" };
    return { level: 2, label: "Fair", color: "#f59e0b" };
  })();

  return (
    <div className="auth-root" style={S.root}>

      {/* ── LEFT PANEL ── */}
      <div className="auth-left-panel" style={S.left}>
        {/* Canvas */}
        <LeftCanvas />

        {/* BG image */}
        <div style={S.leftBgImg} />
        <div style={S.leftOverlay} />

        {/* Ambient orbs */}
        <div style={{ ...S.orb, top: "8%", right: "10%", width: 200, height: 200, background: "radial-gradient(circle,rgba(34,197,94,0.15),transparent 70%)", animation: "auth-orbFloat 10s ease-in-out infinite" }} />
        <div style={{ ...S.orb, bottom: "15%", left: "6%", width: 140, height: 140, background: "radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)", animation: "auth-orbFloat 14s ease-in-out infinite 3s" }} />

        {/* Grid */}
        <div style={S.leftGrid} />

        {/* Floating leaves */}
        {LEAVES.map((leaf, i) => (
          <div key={i} style={{
            position: "absolute", fontSize: `${18 + i * 4}px`,
            left: `${8 + i * 18}%`, top: "100%",
            animation: `auth-leafDrift ${16 + i * 4}s linear infinite`,
            animationDelay: `${i * 2.5}s`, zIndex: 2, pointerEvents: "none",
          }}>{leaf}</div>
        ))}

        {/* Content */}
        <div style={{ ...S.leftContent, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "all 0.7s ease" }}>
          {/* Logo */}
          <div style={S.leftLogo}>
            <div style={{ position: "relative", width: 72, height: 72 }}>
              <div style={{ ...S.ring, animation: "auth-ring 2.5s ease-out infinite" }} />
              <div style={{ ...S.ring, animation: "auth-ring 2.5s ease-out infinite 0.5s" }} />
              <div style={{ ...S.logoCircle, animation: "auth-glow 3s ease-in-out infinite" }}>
                <span style={{ fontSize: 28, filter: "drop-shadow(0 0 12px rgba(34,197,94,0.8))" }}>🌾</span>
              </div>
            </div>
            <div>
              <div style={S.leftLogoName}><span style={{ color: "#4ade80" }}>AgriDSS</span> Intelligence</div>
              <div style={S.leftLogoSub}>AI-Powered Crop Stress Forecasting</div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={S.leftTitle}>
            Smart Farming<br />
            <span style={S.leftTitleGrad}>Starts Here</span>
          </h1>
          <p style={S.leftSub}>
            42 years of ERA5 climate data, 6-model stacking ensemble, SHAP explainability, and live Open-Meteo forecasts — built for Palakkad farmers.
          </p>

          {/* Feature stats */}
          <div style={S.leftFeats}>
            {FEATS.map((f, i) => (
              <div key={i} className="auth-feat-card" style={{ ...S.leftFeatCard, animationDelay: `${0.2 + i * 0.1}s` }}>
                <span style={{ fontSize: "1.5rem" }}>{f.icon}</span>
                <div>
                  <div style={{ ...S.featValue, color: f.color }}>{f.value}</div>
                  <div style={S.featLabel}>{f.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div style={S.trustBadge}>
            <span style={{ fontSize: "1.1rem" }}>🎓</span>
            <span style={S.trustText}>M.Tech Research · ERA5 Climate Intelligence · Verified 2026</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right-panel" style={S.right}>
        {/* BG */}
        <div style={S.rightBg} />
        <div style={S.rightGrid} />

        {/* Back button */}
        {onBack && (
          <button onClick={onBack} className="auth-back-btn" style={S.backBtn}>
            ← Back to Home
          </button>
        )}

        {/* Form card */}
        <div style={{ ...S.formCard, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.7s ease 0.1s" }}>

          {/* Mobile logo */}
          <div style={S.mobileLogo}>
            <span style={{ fontSize: "2rem" }}>🌾</span>
            <span style={S.mobileLogoText}><span style={{ color: "#4ade80" }}>AgriDSS</span> Intelligence</span>
          </div>

          {/* Header */}
          <div style={S.formHead}>
            <h2 style={S.formTitle}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p style={S.formSub}>
              {mode === "login"
                ? "Sign in to your AgriDSS dashboard"
                : "Join the precision agriculture revolution"}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div style={S.errorBox} role="alert">
              <span style={{ fontSize: "1rem" }}>⚠</span>
              <span style={{ fontSize: "0.88rem" }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={S.successBox} role="status">
              <span style={{ fontSize: "1rem" }}>✓</span>
              <span style={{ fontSize: "0.88rem" }}>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={S.form}>
            {mode === "register" && (
              <div style={S.inputGroup}>
                <label style={S.label}>Full Name</label>
                <input
                  className="auth-input-field"
                  type="text" name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  style={S.input}
                  autoComplete="name"
                />
              </div>
            )}

            <div style={S.inputGroup}>
              <label style={S.label}>Email Address</label>
              <input
                className="auth-input-field"
                type="email" name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                style={S.input}
                autoComplete="email"
              />
            </div>

            <div style={S.inputGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={S.label}>Password</label>
                {mode === "login" && (
                  <a href="#" style={S.forgotLink}>Forgot password?</a>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input-field"
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={mode === "login" ? "Your password" : "Create a strong password"}
                  style={{ ...S.input, paddingRight: 48 }}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={S.eyeBtn}
                >
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
              {/* Password strength */}
              {mode === "register" && formData.password && pwdStrength && (
                <div style={S.pwdStrength}>
                  <div style={S.pwdBars}>
                    {[1, 2, 3].map(l => (
                      <div key={l} style={{ ...S.pwdBar, background: l <= pwdStrength.level ? pwdStrength.color : "rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: pwdStrength.color, fontWeight: 600 }}>{pwdStrength.label}</span>
                </div>
              )}
            </div>

            {mode === "register" && (
              <div style={S.inputGroup}>
                <label style={S.label}>Confirm Password</label>
                <input
                  className="auth-input-field"
                  type="password" name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  style={S.input}
                  autoComplete="new-password"
                />
                {formData.confirmPassword && (
                  <div style={{ marginTop: 6, fontSize: "0.72rem", color: formData.password === formData.confirmPassword ? "#22c55e" : "#ef4444" }}>
                    {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}
              </div>
            )}

            {mode === "login" && (
              <label style={S.rememberLabel}>
                <input type="checkbox" style={S.checkbox} />
                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Remember me</span>
              </label>
            )}

            <button type="submit" className="auth-submit-btn" style={S.submitBtn} disabled={loading}>
              {loading ? (
                <span style={S.spinner} />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                  <span style={{ fontSize: "1.1rem" }}>→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={S.divider}>
            <span style={S.divLine} />
            <span style={S.divText}>or continue with</span>
            <span style={S.divLine} />
          </div>

          {/* Social */}
          <div style={S.socialRow}>
            {[
              { icon: "🌐", label: "Google" },
              { icon: "📱", label: "Phone" },
            ].map(s => (
              <button key={s.label} className="auth-social-btn" style={S.socialBtn}>
                <span style={{ fontSize: "1.1rem" }}>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Toggle */}
          <div style={S.toggleRow}>
            <span style={S.toggleText}>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button type="button" className="auth-toggle-btn" onClick={toggleMode} style={S.toggleBtn}>
              {mode === "login" ? "Sign Up Free" : "Sign In"}
            </button>
          </div>

          <p style={S.tos}>
            By continuing, you agree to our{" "}
            <a href="#" style={S.tosLink}>Terms</a> and{" "}
            <a href="#" style={S.tosLink}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  root: {
    minHeight: "100vh", display: "flex",
    background: "#030a0f", overflow: "hidden",
  },

  // Left panel
  left: {
    flex: "1.25", position: "relative",
    display: "flex", flexDirection: "column",
    justifyContent: "center", padding: "60px 56px",
    overflow: "hidden",
  },
  leftBgImg: {
    position: "absolute", inset: 0,
    backgroundImage: "url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=70)",
    backgroundSize: "cover", backgroundPosition: "center 30%",
    opacity: 0.15, filter: "saturate(1.2)",
  },
  leftOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg,rgba(3,10,15,0.88) 0%,rgba(5,46,22,0.80) 60%,rgba(3,10,15,0.9) 100%)",
  },
  leftGrid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)",
    backgroundSize: "60px 60px",
  },
  orb: { position: "absolute", borderRadius: "50%", pointerEvents: "none" },

  leftContent: { position: "relative", zIndex: 3, maxWidth: 500 },

  // Logo row
  leftLogo: { display: "flex", alignItems: "center", gap: 16, marginBottom: 44 },
  ring: { position: "absolute", inset: 0, border: "1.5px solid rgba(34,197,94,0.4)", borderRadius: "50%", animation: "auth-ring 2.5s ease-out infinite" },
  logoCircle: {
    position: "absolute", inset: 14, borderRadius: "50%",
    background: "linear-gradient(135deg,rgba(34,197,94,0.2),rgba(3,10,15,0.9))",
    border: "2px solid rgba(34,197,94,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  leftLogoName: { fontSize: "1.2rem", fontWeight: 800, color: "#fff" },
  leftLogoSub: { fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginTop: 2 },

  leftTitle: { fontSize: "3rem", fontWeight: 900, lineHeight: 1.1, marginBottom: 18, letterSpacing: "-1px" },
  leftTitleGrad: { background: "linear-gradient(135deg,#4ade80,#22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  leftSub: { fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 36 },

  leftFeats: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 },
  leftFeatCard: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 18px", borderRadius: 14,
    background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "default",
  },
  featValue: { fontSize: "1.1rem", fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" },
  featLabel: { fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", marginTop: 1 },

  trustBadge: {
    display: "inline-flex", alignItems: "center", gap: 10,
    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)",
    padding: "10px 18px", borderRadius: 100,
  },
  trustText: { fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 },

  // Right panel
  right: {
    flex: "1", position: "relative",
    display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center",
    padding: "50px 40px", minWidth: 0,
    borderLeft: "1px solid rgba(255,255,255,0.06)",
  },
  rightBg: {
    position: "absolute", inset: 0,
    background: "linear-gradient(160deg,rgba(34,197,94,0.04) 0%,rgba(3,10,15,0) 50%,rgba(99,102,241,0.04) 100%)",
  },
  rightGrid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)",
    backgroundSize: "50px 50px",
  },

  backBtn: {
    position: "absolute", top: 28, left: 28,
    display: "flex", alignItems: "center", gap: 6,
    padding: "9px 16px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", fontWeight: 500,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif",
  },

  formCard: { width: "100%", maxWidth: 420, position: "relative", zIndex: 2 },

  mobileLogo: {
    display: "none", alignItems: "center", justifyContent: "center", gap: 10,
    marginBottom: 28, fontSize: "1.2rem", fontWeight: 800,
  },
  mobileLogoText: { fontSize: "1.2rem", fontWeight: 800 },

  formHead: { marginBottom: 28 },
  formTitle: { fontSize: "2rem", fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.5px" },
  formSub: { fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 },

  errorBox: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px", borderRadius: 12, marginBottom: 18,
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#fca5a5", animation: "auth-slideIn 0.3s ease",
  },
  successBox: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px", borderRadius: 12, marginBottom: 18,
    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
    color: "#86efac", animation: "auth-slideIn 0.3s ease",
  },

  form: { display: "flex", flexDirection: "column", gap: 18 },
  inputGroup: { display: "flex", flexDirection: "column" },
  label: { fontSize: "0.82rem", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: 7, fontFamily: "'Poppins',sans-serif" },
  input: {
    padding: "14px 18px", borderRadius: 12, fontSize: "0.95rem",
    fontWeight: 500, width: "100%",
  },
  eyeBtn: {
    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem",
    lineHeight: 1,
  },
  pwdStrength: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },
  pwdBars: { display: "flex", gap: 4 },
  pwdBar: { width: 32, height: 3, borderRadius: 3, transition: "background 0.3s ease" },

  forgotLink: { fontSize: "0.8rem", color: "#4ade80", textDecoration: "none", fontWeight: 500 },
  rememberLabel: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
  checkbox: { width: 16, height: 16, accentColor: "#22c55e", cursor: "pointer" },

  submitBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    padding: "15px", borderRadius: 13, fontSize: "1rem",
    boxShadow: "0 8px 30px rgba(34,197,94,0.3)",
    marginTop: 2,
  },
  spinner: {
    width: 20, height: 20, border: "2.5px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "auth-spinner 0.8s linear infinite",
    display: "inline-block",
  },

  divider: { display: "flex", alignItems: "center", gap: 12, margin: "24px 0" },
  divLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.08)" },
  divText: { fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontWeight: 500, whiteSpace: "nowrap" },

  socialRow: { display: "flex", gap: 10, marginBottom: 24 },
  socialBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "12px 16px", borderRadius: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif",
  },

  toggleRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 16 },
  toggleText: { fontSize: "0.88rem", color: "rgba(255,255,255,0.4)" },
  toggleBtn: {
    background: "none", border: "none",
    color: "#22c55e", fontSize: "0.88rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif",
  },

  tos: { fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.6 },
  tosLink: { color: "rgba(34,197,94,0.7)", textDecoration: "none" },
};
