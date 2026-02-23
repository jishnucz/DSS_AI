import { useState } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

  @keyframes authFadeIn {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes authSlideIn {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes authGlow {
    0%, 100% { box-shadow: 0 20px 60px rgba(34, 197, 94, 0.15); }
    50% { box-shadow: 0 25px 70px rgba(34, 197, 94, 0.25); }
  }

  @keyframes authFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(5deg); }
  }

  @keyframes authPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes leafDrift {
    0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.7; }
    90% { opacity: 0.7; }
    100% { transform: translateY(-100vh) translateX(50px) rotate(180deg); opacity: 0; }
  }

  @keyframes cloudDrift {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100vw); }
  }

  .auth-input {
    transition: all 0.3s ease !important;
  }

  .auth-input:focus {
    border-color: #22c55e !important;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15), 0 4px 20px rgba(34, 197, 94, 0.1) !important;
    outline: none !important;
    transform: translateY(-1px);
  }

  .auth-input::placeholder {
    color: #94a3b8;
  }

  .auth-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease !important;
  }

  .auth-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  .auth-btn:hover:not(:disabled)::before {
    transform: translateX(100%);
  }

  .auth-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(34, 197, 94, 0.35) !important;
  }

  .auth-btn:active:not(:disabled) {
    transform: translateY(-1px);
  }

  .auth-toggle:hover {
    color: #16a34a !important;
    text-decoration: underline;
  }

  .auth-feature-card:hover {
    transform: translateY(-5px) !important;
    box-shadow: 0 20px 40px rgba(34, 197, 94, 0.15) !important;
  }

  .social-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
  }

  @media (max-width: 1024px) {
    .auth-split-container {
      flex-direction: column !important;
    }
    .auth-image-section {
      display: none !important;
    }
    .auth-form-section {
      max-width: 100% !important;
      padding: 40px 24px !important;
    }
    .auth-mobile-logo {
      display: flex !important;
    }
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

export default function Auth({ onLogin, onBack }) {
  const [mode, setMode] = useState("login"); // login or register
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  inject("auth-styles", CSS);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (mode === "register") {
      if (!formData.name) {
        setError("Please enter your name");
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      // Add timeout to prevent infinite loading
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

      if (!res.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      if (mode === "register") {
        setSuccess("Registration successful! Please login.");
        setMode("login");
        setFormData({ ...formData, password: "", confirmPassword: "" });
      } else {
        // Pass user and token to parent component
        onLogin?.(data.user, data.token);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError("Request timed out. Please check if the server is running.");
      } else if (err.message === 'Failed to fetch') {
        setError("Cannot connect to server. Please ensure the backend is running on port 8000.");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setSuccess("");
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <div style={styles.container}>
      <div className="auth-split-container" style={styles.splitContainer}>
        {/* Left Side - Image Section */}
        <div className="auth-image-section" style={styles.imageSection}>
          {/* Background Image */}
          <div style={styles.bgImage} />
          
          {/* Gradient Overlay */}
          <div style={styles.imageOverlay} />
          
          {/* Floating Leaves */}
          {['🌿', '🍃', '🌱', '☘️', '🌾', '🍂'].map((leaf, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                fontSize: `${20 + i * 4}px`,
                left: `${10 + i * 15}%`,
                top: '100%',
                animation: `leafDrift ${15 + i * 5}s linear infinite`,
                animationDelay: `${i * 2}s`,
                zIndex: 2,
              }}
            >
              {leaf}
            </div>
          ))}
          
          {/* Content */}
          <div style={styles.imageContent}>
            {/* Logo */}
            <div style={styles.imageLogo}>
              <span style={styles.imageLogoIcon}>🌾</span>
              <span style={styles.imageLogoText}>AgriDSS</span>
            </div>
            
            {/* Main Headline */}
            <h1 style={styles.imageTitle}>
              Smart Farming
              <br />
              <span style={styles.imageTitleHighlight}>Starts Here</span>
            </h1>
            
            <p style={styles.imageSubtitle}>
              AI-powered agricultural decision support system for farmers.
              Get real-time insights, weather forecasts, and crop recommendations.
            </p>
            
            {/* Feature Cards */}
            <div style={styles.featureGrid}>
              {[
                { icon: '🤖', title: '88.3% Accuracy', desc: 'ML Ensemble Model' },
                { icon: '🌤️', title: 'Weather Insights', desc: 'ERA5 Data Analysis' },
                { icon: '🌱', title: 'Crop Guidance', desc: 'Stage-wise Tips' },
              ].map((f, i) => (
                <div key={i} className="auth-feature-card" style={styles.featureCard}>
                  <span style={styles.featureIcon}>{f.icon}</span>
                  <div>
                    <div style={styles.featureTitle}>{f.title}</div>
                    <div style={styles.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Trust Badge */}
            <div style={styles.trustBadge}>
              <span style={styles.trustIcon}>🎓</span>
              <span style={styles.trustText}>M.Tech Research Project • ERA5 Climate Intelligence</span>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form Section */}
        <div className="auth-form-section" style={styles.formSection}>
          {/* Back Button */}
          {onBack && (
            <button onClick={onBack} style={styles.backBtn}>
              <span>←</span>
              <span>Back to Home</span>
            </button>
          )}
          
          {/* Form Card */}
          <div style={styles.formCard}>
            {/* Mobile Logo */}
            <div className="auth-mobile-logo" style={styles.mobileLogo}>
              <span style={styles.mobileLogoIcon}>🌾</span>
              <span style={styles.mobileLogoText}>AgriDSS</span>
            </div>
            
            {/* Form Header */}
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>
                {mode === "login" ? "Welcome Back! 👋" : "Join AgriDSS 🌱"}
              </h2>
              <p style={styles.formSubtitle}>
                {mode === "login"
                  ? "Sign in to access your personalized dashboard"
                  : "Create your account and start exploring"}
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div style={styles.successBox}>
                <span style={styles.successIcon}>✅</span>
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              {mode === "register" && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>
                    <span style={styles.labelIcon}>👤</span>
                    Full Name
                  </label>
                  <input
                    className="auth-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    style={styles.input}
                  />
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>✉️</span>
                  Email Address
                </label>
                <input
                  className="auth-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>🔒</span>
                  Password
                </label>
                <input
                  className="auth-input"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={mode === "login" ? "Enter your password" : "Create a strong password"}
                  style={styles.input}
                />
              </div>

              {mode === "register" && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>
                    <span style={styles.labelIcon}>🔐</span>
                    Confirm Password
                  </label>
                  <input
                    className="auth-input"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    style={styles.input}
                  />
                </div>
              )}

              {mode === "login" && (
                <div style={styles.rememberRow}>
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" style={styles.checkbox} />
                    <span>Remember me</span>
                  </label>
                  <a href="#" style={styles.forgotLink}>Forgot password?</a>
                </div>
              )}

              <button
                type="submit"
                className="auth-btn"
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? (
                  <span style={styles.spinner}>⟳</span>
                ) : mode === "login" ? (
                  <>
                    <span>Sign In</span>
                    <span style={styles.btnArrow}>→</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span style={styles.btnArrow}>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>or continue with</span>
              <span style={styles.dividerLine} />
            </div>

            {/* Social Buttons */}
            <div style={styles.socialButtons}>
              <button className="social-btn" style={styles.socialBtn}>
                <span style={styles.socialIcon}>🌐</span>
                <span>Google</span>
              </button>
              <button className="social-btn" style={styles.socialBtn}>
                <span style={styles.socialIcon}>📱</span>
                <span>Phone</span>
              </button>
            </div>

            {/* Toggle Mode */}
            <div style={styles.toggleSection}>
              <span style={styles.toggleText}>
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                type="button"
                className="auth-toggle"
                onClick={toggleMode}
                style={styles.toggleBtn}
              >
                {mode === "login" ? "Sign Up Free" : "Sign In"}
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              By continuing, you agree to our <a href="#" style={styles.footerLink}>Terms of Service</a> and <a href="#" style={styles.footerLink}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "stretch",
    background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #ecfdf5 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: "hidden",
  },
  splitContainer: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
  },
  
  // Left Side - Image Section
  imageSection: {
    flex: "1.2",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    overflow: "hidden",
  },
  bgImage: {
    position: "absolute",
    inset: 0,
    backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
  imageOverlay: {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(
      135deg,
      rgba(5, 46, 22, 0.92) 0%,
      rgba(20, 83, 45, 0.88) 50%,
      rgba(22, 101, 52, 0.85) 100%
    )`,
  },
  imageContent: {
    position: "relative",
    zIndex: 3,
    maxWidth: "500px",
  },
  imageLogo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "40px",
  },
  imageLogoIcon: {
    fontSize: "42px",
    animation: "authFloat 4s ease-in-out infinite",
  },
  imageLogoText: {
    fontSize: "1.6rem",
    fontWeight: 800,
    fontFamily: "'Poppins', sans-serif",
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  imageTitle: {
    fontSize: "3.2rem",
    fontWeight: 800,
    fontFamily: "'Poppins', sans-serif",
    color: "#fff",
    lineHeight: 1.1,
    margin: "0 0 24px 0",
    letterSpacing: "-1px",
  },
  imageTitleHighlight: {
    background: "linear-gradient(90deg, #4ade80, #86efac)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  imageSubtitle: {
    fontSize: "1.1rem",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 1.6,
    marginBottom: "40px",
  },
  featureGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "40px",
  },
  featureCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "18px 22px",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    transition: "all 0.3s ease",
    cursor: "default",
  },
  featureIcon: {
    fontSize: "28px",
  },
  featureTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
  },
  featureDesc: {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.7)",
  },
  trustBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 20px",
    background: "rgba(74, 222, 128, 0.15)",
    border: "1px solid rgba(74, 222, 128, 0.3)",
    borderRadius: "30px",
  },
  trustIcon: {
    fontSize: "18px",
  },
  trustText: {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: 500,
  },
  
  // Right Side - Form Section
  formSection: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "50px",
    background: "#fff",
    position: "relative",
    maxWidth: "560px",
  },
  backBtn: {
    position: "absolute",
    top: "28px",
    left: "28px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "12px",
    color: "#16a34a",
    fontSize: "0.9rem",
    fontWeight: 500,
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  formCard: {
    width: "100%",
    maxWidth: "400px",
    animation: "authFadeIn 0.6s ease-out",
  },
  mobileLogo: {
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "32px",
  },
  mobileLogoIcon: {
    fontSize: "36px",
  },
  mobileLogoText: {
    fontSize: "1.4rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontFamily: "'Poppins', sans-serif",
  },
  formHeader: {
    marginBottom: "32px",
  },
  formTitle: {
    margin: "0 0 8px",
    fontSize: "1.9rem",
    fontWeight: 700,
    fontFamily: "'Poppins', sans-serif",
    color: "#1f2937",
    letterSpacing: "-0.5px",
  },
  formSubtitle: {
    margin: 0,
    fontSize: "1rem",
    color: "#64748b",
    lineHeight: 1.5,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 18px",
    borderRadius: "14px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#dc2626",
    fontSize: "0.9rem",
    marginBottom: "20px",
    animation: "authSlideIn 0.3s ease-out",
  },
  errorIcon: {
    fontSize: "16px",
  },
  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 18px",
    borderRadius: "14px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    color: "#16a34a",
    fontSize: "0.9rem",
    marginBottom: "20px",
    animation: "authSlideIn 0.3s ease-out",
  },
  successIcon: {
    fontSize: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
    color: "#374151",
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
  },
  labelIcon: {
    fontSize: "14px",
  },
  input: {
    padding: "16px 20px",
    borderRadius: "14px",
    border: "2px solid #e5e7eb",
    background: "#fafafa",
    color: "#1f2937",
    fontSize: "1rem",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    transition: "all 0.2s ease",
  },
  rememberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "-8px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
    color: "#64748b",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    accentColor: "#22c55e",
    cursor: "pointer",
  },
  forgotLink: {
    fontSize: "0.9rem",
    color: "#22c55e",
    fontWeight: 600,
    textDecoration: "none",
    transition: "color 0.2s",
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "8px",
    padding: "18px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#FFFFFF",
    fontSize: "1.05rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.3)",
    transition: "all 0.3s ease",
  },
  btnArrow: {
    fontSize: "1.2rem",
    transition: "transform 0.2s",
  },
  spinner: {
    display: "inline-block",
    fontSize: "1.2rem",
    animation: "spin 0.8s linear infinite",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "28px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e5e7eb",
  },
  dividerText: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  socialButtons: {
    display: "flex",
    gap: "12px",
  },
  socialBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    fontSize: "0.95rem",
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  socialIcon: {
    fontSize: "18px",
  },
  toggleSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "28px",
  },
  toggleText: {
    color: "#64748b",
    fontSize: "0.95rem",
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "#22c55e",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    transition: "color 0.2s ease",
  },
  footer: {
    position: "absolute",
    bottom: "28px",
    left: 0,
    right: 0,
    textAlign: "center",
    padding: "0 28px",
  },
  footerText: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  footerLink: {
    color: "#22c55e",
    textDecoration: "none",
    fontWeight: 500,
  },
};
