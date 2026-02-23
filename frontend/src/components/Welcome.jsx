import { useLanguage } from "../LanguageContext";

const CSS = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  
  .welcome-card { transition: all 0.3s ease !important; }
  .welcome-card:hover { transform: translateY(-4px) !important; box-shadow: 0 20px 50px rgba(34, 197, 94, 0.2) !important; }
  
  .feature-icon { transition: all 0.3s ease !important; }
  .feature-icon:hover { transform: scale(1.15) rotate(5deg) !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export default function Welcome({ user, onGetStarted }) {
  inject("welcome-component", CSS);
  const { t } = useLanguage();

  const features = [
    {
      icon: "📊",
      title: "Decision Support System",
      description: "AI-powered recommendations for your crops based on real-time data and ML models",
      color: "rgba(34, 197, 94, 0.15)"
    },
    {
      icon: "🧠",
      title: "Advanced DSS",
      description: "Research-backed ML analysis with 88.3% accuracy ensemble predictions and SHAP explanations",
      color: "rgba(139, 92, 246, 0.15)"
    },
    {
      icon: "🌾",
      title: "Crop Classifier",
      description: "Identify crop diseases and get instant treatment recommendations with AI",
      color: "rgba(251, 191, 36, 0.15)"
    },
    {
      icon: "🗺️",
      title: "Enhanced Map",
      description: "Interactive maps with stress heatmaps, weather overlays, and crop distribution",
      color: "rgba(59, 130, 246, 0.15)"
    },
    {
      icon: "💬",
      title: "AgriBot Assistant",
      description: "24/7 AI chatbot for instant answers to your agricultural questions",
      color: "rgba(16, 185, 129, 0.15)"
    },
    {
      icon: "🎓",
      title: "Research Insights",
      description: "Access M.Tech level research findings and climate projections for your region",
      color: "rgba(236, 72, 153, 0.15)"
    }
  ];

  return (
    <div style={styles.container}>
      <style>{CSS}</style>
      
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroIcon}>🌾</div>
        <h1 style={styles.heroTitle}>
          Welcome, <span style={styles.userName}>{user?.name || user?.username || "Farmer"}</span>! 👋
        </h1>
        <p style={styles.heroSubtitle}>
          Your intelligent agricultural companion powered by cutting-edge AI and ML research
        </p>
        <div style={styles.heroStats}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>140k+</div>
            <div style={styles.statLabel}>Data Points</div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <div style={styles.statNumber}>88.3%</div>
            <div style={styles.statLabel}>ML Accuracy</div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <div style={styles.statNumber}>10</div>
            <div style={styles.statLabel}>AI Models</div>
          </div>
        </div>
      </div>

      {/* Quick Start Section */}
      <div style={styles.quickStart}>
        <h2 style={styles.sectionTitle}>🚀 Quick Start Guide</h2>
        <div style={styles.steps}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Complete Your Profile</h3>
              <p style={styles.stepText}>Add your crops, land size, and location for personalized recommendations</p>
              <button style={styles.stepButton} onClick={() => onGetStarted('profile')}>
                Set Up Profile
              </button>
            </div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Run DSS Analysis</h3>
              <p style={styles.stepText}>Get AI-powered insights on crop health, irrigation, and fertilizer needs</p>
              <button style={styles.stepButton} onClick={() => onGetStarted('dss')}>
                Start Analysis
              </button>
            </div>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Explore Features</h3>
              <p style={styles.stepText}>Discover map, chatbot, and research tools to maximize your farm's potential</p>
              <button style={styles.stepButton} onClick={() => onGetStarted('explore')}>
                Explore Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={styles.features}>
        <h2 style={styles.sectionTitle}>✨ Platform Features</h2>
        <div style={styles.featureGrid}>
          {features.map((feature, i) => (
            <div key={i} className="welcome-card" style={{
              ...styles.featureCard,
              background: feature.color,
              animationDelay: `${i * 0.1}s`
            }}>
              <div className="feature-icon" style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div style={styles.cta}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Transform Your Farming? 🌱</h2>
          <p style={styles.ctaText}>
            Start making data-driven decisions with our AI-powered platform
          </p>
          <button style={styles.ctaButton} onClick={() => onGetStarted('dss')}>
            Get Started with DSS
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "40px 24px",
    animation: "fadeIn 0.5s ease-out"
  },
  
  // Hero
  hero: {
    textAlign: "center",
    marginBottom: "60px",
    padding: "60px 40px",
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(240, 253, 244, 0.8))",
    borderRadius: "28px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    boxShadow: "0 20px 60px rgba(34, 197, 94, 0.15)",
    animation: "slideUp 0.6s ease-out"
  },
  heroIcon: {
    fontSize: "80px",
    animation: "float 3s ease-in-out infinite",
    marginBottom: "20px"
  },
  heroTitle: {
    fontSize: "3rem",
    fontWeight: 800,
    color: "#1f2937",
    margin: "0 0 16px",
    fontFamily: "'Poppins', sans-serif"
  },
  userName: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  heroSubtitle: {
    fontSize: "1.25rem",
    color: "#64748b",
    margin: "0 0 40px",
    fontFamily: "'Inter', sans-serif",
    maxWidth: "700px",
    marginLeft: "auto",
    marginRight: "auto"
  },
  heroStats: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "32px",
    flexWrap: "wrap"
  },
  statItem: {
    textAlign: "center"
  },
  statNumber: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "#22c55e",
    fontFamily: "'Poppins', sans-serif"
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  statDivider: {
    width: "1px",
    height: "60px",
    background: "linear-gradient(180deg, transparent, rgba(34, 197, 94, 0.3), transparent)"
  },
  
  // Quick Start
  quickStart: {
    marginBottom: "60px"
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1f2937",
    textAlign: "center",
    marginBottom: "40px",
    fontFamily: "'Poppins', sans-serif"
  },
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px"
  },
  step: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    padding: "32px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    animation: "slideUp 0.6s ease-out"
  },
  stepNumber: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    fontSize: "1.5rem",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Poppins', sans-serif",
    boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)"
  },
  stepContent: {
    flex: 1
  },
  stepTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 12px",
    fontFamily: "'Poppins', sans-serif"
  },
  stepText: {
    fontSize: "0.95rem",
    color: "#64748b",
    lineHeight: 1.7,
    margin: "0 0 20px",
    fontFamily: "'Inter', sans-serif"
  },
  stepButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "12px",
    color: "#16a34a",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "'Poppins', sans-serif"
  },
  
  // Features
  features: {
    marginBottom: "60px"
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px"
  },
  featureCard: {
    padding: "32px",
    borderRadius: "20px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    animation: "slideUp 0.6s ease-out"
  },
  featureIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    display: "block"
  },
  featureTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 12px",
    fontFamily: "'Poppins', sans-serif"
  },
  featureDescription: {
    fontSize: "0.9rem",
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
    fontFamily: "'Inter', sans-serif"
  },
  
  // CTA
  cta: {
    textAlign: "center",
    padding: "60px 40px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    borderRadius: "28px",
    boxShadow: "0 20px 60px rgba(34, 197, 94, 0.3)",
    animation: "slideUp 0.6s ease-out"
  },
  ctaContent: {
    maxWidth: "600px",
    margin: "0 auto"
  },
  ctaTitle: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 16px",
    fontFamily: "'Poppins', sans-serif"
  },
  ctaText: {
    fontSize: "1.1rem",
    color: "rgba(255, 255, 255, 0.9)",
    margin: "0 0 32px",
    fontFamily: "'Inter', sans-serif"
  },
  ctaButton: {
    padding: "18px 48px",
    background: "#fff",
    border: "none",
    borderRadius: "14px",
    color: "#16a34a",
    fontSize: "1.1rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    transition: "all 0.3s ease",
    fontFamily: "'Poppins', sans-serif"
  }
};
