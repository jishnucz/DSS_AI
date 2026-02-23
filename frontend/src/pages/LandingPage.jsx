import { useState, useEffect } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
  
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  
  .landing-page { font-family: 'Poppins', sans-serif; }
  .landing-page * { box-sizing: border-box; }
  
  .hero-cta:hover { transform: translateY(-3px) !important; box-shadow: 0 20px 50px rgba(34,197,94,0.4) !important; }
  .feature-card:hover { transform: translateY(-8px) !important; border-color: rgba(34,197,94,0.4) !important; }
  .step-card:hover { background: rgba(34,197,94,0.08) !important; }
  
  .scroll-indicator { animation: float 2s ease-in-out infinite; }
`;

// Premium agriculture images
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=85",
  paddy: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
  farmer: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=80",
  kerala: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
  weather: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80",
};

function injectCSS(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export default function LandingPage({ onGetStarted }) {
  const [scrollY, setScrollY] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    injectCSS("landing-css", CSS);
    
    // Preload hero image
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = IMAGES.hero;

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: "🌾",
      title: "Crop Intelligence",
      desc: "AI-powered crop disease detection and growth stage analysis with 88.3% accuracy",
      color: "#22c55e",
    },
    {
      icon: "🌤️",
      title: "Weather Forecasting",
      desc: "7-day accurate weather predictions using ERA5 climate data for your region",
      color: "#3b82f6",
    },
    {
      icon: "💧",
      title: "Irrigation Guidance",
      desc: "Smart irrigation recommendations based on soil moisture and crop water needs",
      color: "#06b6d4",
    },
    {
      icon: "🚨",
      title: "Stress Alerts",
      desc: "Real-time alerts for heat stress, drought risk, and pest outbreak conditions",
      color: "#f59e0b",
    },
    {
      icon: "📊",
      title: "Yield Predictions",
      desc: "Machine learning models to predict crop yield and optimize farming decisions",
      color: "#8b5cf6",
    },
    {
      icon: "🗺️",
      title: "Taluk-wise Data",
      desc: "Detailed analysis for all taluks in your region with local climate patterns",
      color: "#ec4899",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      icon: "📍",
      title: "Select Your Location",
      desc: "Choose your taluk to get localized recommendations",
    },
    {
      step: "02",
      icon: "🌱",
      title: "Enter Crop Details",
      desc: "Select your crop type and enter sowing date for accurate growth tracking",
    },
    {
      step: "03",
      icon: "🤖",
      title: "Get AI Recommendations",
      desc: "Receive smart irrigation, fertilizer, and protection recommendations",
    },
    {
      step: "04",
      icon: "📈",
      title: "Track & Optimize",
      desc: "Monitor crop health, weather forecasts, and adjust your farming practices",
    },
  ];

  const stats = [
    { value: "13", label: "Taluks Covered" },
    { value: "88.3%", label: "AI Accuracy" },
    { value: "7+", label: "Crop Types" },
    { value: "24/7", label: "Support" },
  ];

  return (
    <div className="landing-page" style={styles.page}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        {/* Background Image with Parallax */}
        <div style={{
          ...styles.heroBgImage,
          backgroundImage: `url(${IMAGES.hero})`,
          opacity: imageLoaded ? 1 : 0,
          transform: `translateY(${scrollY * 0.3}px)`,
        }} />
        
        {/* Gradient Overlay */}
        <div style={styles.heroOverlay} />
        
        {/* Ambient Glow */}
        <div style={styles.heroGlow} />

        {/* Navigation */}
        <nav style={{
          ...styles.nav,
          background: scrollY > 50 ? "rgba(7, 16, 24, 0.95)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
        }}>
          <div style={styles.navContent}>
            <div style={styles.logo}>
              <span style={styles.logoIcon}>🌾</span>
              <span style={styles.logoText}><span style={styles.logoGreen}>AgriDSS</span> Intelligence</span>
            </div>
            <div style={styles.navLinks}>
              <a href="#features" style={styles.navLink}>Features</a>
              <a href="#how-it-works" style={styles.navLink}>How It Works</a>
              <button onClick={onGetStarted} style={styles.navCta}>Get Started</button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span>�</span>
            <span>Next-Gen Agricultural Intelligence</span>
          </div>
          
          <h1 style={styles.heroTitle}>
            Smart Farming for{" "}
            <span style={styles.heroTitleGreen}>Better Harvests</span>
          </h1>
          
          <p style={styles.heroSubtitle}>
            AI-powered Decision Support System helping farmers make 
            data-driven decisions for irrigation, crop protection, and yield optimization.
          </p>

          <div style={styles.heroActions}>
            <button onClick={onGetStarted} className="hero-cta" style={styles.heroCta}>
              <span>Start Free</span>
              <span style={styles.heroCtaArrow}>→</span>
            </button>
            <a href="#how-it-works" style={styles.heroSecondary}>
              <span>Learn How It Works</span>
            </a>
          </div>

          {/* Stats Row */}
          <div style={styles.heroStats}>
            {stats.map((stat, i) => (
              <div key={i} style={styles.heroStat}>
                <div style={styles.heroStatValue}>{stat.value}</div>
                <div style={styles.heroStatLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator" style={styles.scrollIndicator}>
          <span>Scroll to explore</span>
          <div style={styles.scrollArrow}>↓</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionBadge}>🚀 Features</span>
            <h2 style={styles.sectionTitle}>Everything You Need for Smart Farming</h2>
            <p style={styles.sectionSubtitle}>
              Powered by advanced AI and real-time weather data to help you make better farming decisions
            </p>
          </div>

          <div style={styles.featuresGrid}>
            {features.map((feature, i) => (
              <div key={i} className="feature-card" style={styles.featureCard}>
                <div style={{ ...styles.featureIconWrap, background: `${feature.color}15`, borderColor: `${feature.color}30` }}>
                  <span style={styles.featureIcon}>{feature.icon}</span>
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={styles.howSection}>
        <div style={styles.sectionContainer}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionBadge}>📋 How It Works</span>
            <h2 style={styles.sectionTitle}>Get Started in 4 Simple Steps</h2>
            <p style={styles.sectionSubtitle}>
              Our system is designed to be simple and easy to use for all farmers
            </p>
          </div>

          <div style={styles.stepsGrid}>
            {howItWorks.map((item, i) => (
              <div key={i} className="step-card" style={styles.stepCard}>
                <div style={styles.stepNumber}>{item.step}</div>
                <div style={styles.stepIconWrap}>
                  <span style={styles.stepIcon}>{item.icon}</span>
                </div>
                <h3 style={styles.stepTitle}>{item.title}</h3>
                <p style={styles.stepDesc}>{item.desc}</p>
                {i < howItWorks.length - 1 && (
                  <div style={styles.stepConnector}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section style={styles.previewSection}>
        <div style={styles.sectionContainer}>
          <div style={styles.previewContent}>
            <div style={styles.previewText}>
              <span style={styles.sectionBadge}>✨ See It In Action</span>
              <h2 style={styles.sectionTitle}>Powerful Dashboard for Farmers</h2>
              <p style={styles.sectionSubtitle}>
                Get real-time insights, weather forecasts, and AI recommendations 
                all in one easy-to-use dashboard designed for farmers.
              </p>
              <ul style={styles.previewList}>
                <li style={styles.previewItem}>
                  <span style={styles.previewCheck}>✓</span>
                  <span>Interactive maps with taluk-wise data</span>
                </li>
                <li style={styles.previewItem}>
                  <span style={styles.previewCheck}>✓</span>
                  <span>7-day weather forecast with crop impact analysis</span>
                </li>
                <li style={styles.previewItem}>
                  <span style={styles.previewCheck}>✓</span>
                  <span>AI chatbot for instant farming advice</span>
                </li>
                <li style={styles.previewItem}>
                  <span style={styles.previewCheck}>✓</span>
                  <span>Crop image classifier for disease detection</span>
                </li>
              </ul>
              <button onClick={onGetStarted} className="hero-cta" style={styles.heroCta}>
                <span>Try It Now - Free</span>
                <span style={styles.heroCtaArrow}>→</span>
              </button>
            </div>
            <div style={styles.previewImage}>
              <img 
                src={IMAGES.paddy} 
                alt="Rice paddy field" 
                style={styles.previewImg}
              />
              <div style={styles.previewOverlay}>
                <div style={styles.previewCard}>
                  <div style={styles.previewCardIcon}>🌤️</div>
                  <div>
                    <div style={styles.previewCardTitle}>Today's Forecast</div>
                    <div style={styles.previewCardValue}>28°C, Light Rain</div>
                  </div>
                </div>
                <div style={{ ...styles.previewCard, marginTop: "12px" }}>
                  <div style={styles.previewCardIcon}>💧</div>
                  <div>
                    <div style={styles.previewCardTitle}>Irrigation</div>
                    <div style={styles.previewCardValue}>Delay by 2 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Transform Your Farming?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of farmers using AI-powered insights for better harvests
          </p>
          <button onClick={onGetStarted} className="hero-cta" style={{ ...styles.heroCta, fontSize: "1.1rem", padding: "18px 40px" }}>
            <span>Get Started Free</span>
            <span style={styles.heroCtaArrow}>→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <span style={styles.logoIcon}>🌾</span>
            <span style={styles.logoText}><span style={styles.logoGreen}>AgriDSS</span> Intelligence</span>
          </div>
          <p style={styles.footerText}>
            M.Tech Research Project • Agricultural Decision Support System
          </p>
          <p style={styles.footerCopy}>
            © 2026 AgriDSS. Made with 💚 for farmers.
          </p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#071018",
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
  },

  // Hero Section
  heroSection: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroBgImage: {
    position: "absolute",
    inset: "-50px",
    backgroundSize: "cover",
    backgroundPosition: "center 30%",
    transition: "opacity 1.5s ease",
    filter: "saturate(1.2)",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(180deg, 
      rgba(7, 16, 24, 0.7) 0%, 
      rgba(7, 16, 24, 0.5) 40%,
      rgba(7, 16, 24, 0.7) 70%,
      rgba(7, 16, 24, 0.95) 100%
    )`,
  },
  heroGlow: {
    position: "absolute",
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    height: "60%",
    background: "radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, transparent 60%)",
    pointerEvents: "none",
  },

  // Navigation
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "16px 0",
    transition: "all 0.3s ease",
  },
  navContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "1.8rem",
  },
  logoText: {
    fontSize: "1.3rem",
    fontWeight: "700",
    color: "#fff",
  },
  logoGreen: {
    color: "#4ade80",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
  },
  navLink: {
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: "500",
    transition: "color 0.2s ease",
  },
  navCta: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    padding: "10px 24px",
    borderRadius: "100px",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  // Hero Content
  heroContent: {
    position: "relative",
    zIndex: 10,
    textAlign: "center",
    maxWidth: "900px",
    padding: "0 24px",
    paddingTop: "80px",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.2)",
    padding: "8px 20px",
    borderRadius: "100px",
    fontSize: "0.85rem",
    color: "#4ade80",
    marginBottom: "24px",
    animation: "slideDown 0.6s ease",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: "800",
    lineHeight: 1.1,
    margin: "0 0 20px",
    color: "#fff",
    animation: "slideUp 0.6s ease 0.1s both",
  },
  heroTitleGreen: {
    background: "linear-gradient(135deg, #4ade80, #22c55e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    fontSize: "1.15rem",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.7,
    maxWidth: "700px",
    margin: "0 auto 32px",
    animation: "slideUp 0.6s ease 0.2s both",
  },
  heroActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "48px",
    animation: "slideUp 0.6s ease 0.3s both",
  },
  heroCta: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    padding: "16px 32px",
    borderRadius: "100px",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 10px 40px rgba(34,197,94,0.3)",
    transition: "all 0.3s ease",
  },
  heroCtaArrow: {
    fontSize: "1.2rem",
    transition: "transform 0.3s ease",
  },
  heroSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: "500",
    padding: "16px 24px",
    borderRadius: "100px",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "all 0.3s ease",
  },

  // Hero Stats
  heroStats: {
    display: "flex",
    justifyContent: "center",
    gap: "48px",
    animation: "slideUp 0.6s ease 0.4s both",
  },
  heroStat: {
    textAlign: "center",
  },
  heroStatValue: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#4ade80",
    marginBottom: "4px",
  },
  heroStatLabel: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  // Scroll Indicator
  scrollIndicator: {
    position: "absolute",
    bottom: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.75rem",
  },
  scrollArrow: {
    fontSize: "1.2rem",
    color: "#4ade80",
  },

  // Section Styles
  sectionContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: "60px",
  },
  sectionBadge: {
    display: "inline-block",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.2)",
    padding: "6px 16px",
    borderRadius: "100px",
    fontSize: "0.8rem",
    color: "#4ade80",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 16px",
  },
  sectionSubtitle: {
    fontSize: "1.05rem",
    color: "rgba(255,255,255,0.6)",
    maxWidth: "600px",
    margin: "0 auto",
    lineHeight: 1.6,
  },

  // Features Section
  featuresSection: {
    padding: "100px 0",
    background: "linear-gradient(180deg, #071018 0%, #0a1520 100%)",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
  },
  featureCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "32px",
    transition: "all 0.3s ease",
    cursor: "default",
  },
  featureIconWrap: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  featureIcon: {
    fontSize: "1.8rem",
  },
  featureTitle: {
    fontSize: "1.15rem",
    fontWeight: "600",
    color: "#fff",
    margin: "0 0 10px",
  },
  featureDesc: {
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.6,
    margin: 0,
  },

  // How It Works Section
  howSection: {
    padding: "100px 0",
    background: "#0a1520",
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "24px",
    position: "relative",
  },
  stepCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "32px 24px",
    textAlign: "center",
    position: "relative",
    transition: "all 0.3s ease",
  },
  stepNumber: {
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    padding: "4px 12px",
    borderRadius: "100px",
    fontSize: "0.7rem",
    fontWeight: "700",
    color: "#fff",
  },
  stepIconWrap: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  stepIcon: {
    fontSize: "2rem",
  },
  stepTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#fff",
    margin: "0 0 8px",
  },
  stepDesc: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.5,
    margin: 0,
  },
  stepConnector: {
    position: "absolute",
    right: "-20px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#4ade80",
    fontSize: "1.2rem",
    opacity: 0.5,
  },

  // Preview Section
  previewSection: {
    padding: "100px 0",
    background: "linear-gradient(180deg, #0a1520 0%, #071018 100%)",
  },
  previewContent: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "60px",
    alignItems: "center",
  },
  previewText: {
    textAlign: "left",
  },
  previewList: {
    listStyle: "none",
    padding: 0,
    margin: "24px 0 32px",
  },
  previewItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    fontSize: "0.95rem",
    color: "rgba(255,255,255,0.7)",
  },
  previewCheck: {
    color: "#4ade80",
    fontWeight: "700",
  },
  previewImage: {
    position: "relative",
    borderRadius: "24px",
    overflow: "hidden",
  },
  previewImg: {
    width: "100%",
    height: "400px",
    objectFit: "cover",
    borderRadius: "24px",
  },
  previewOverlay: {
    position: "absolute",
    bottom: "24px",
    right: "24px",
  },
  previewCard: {
    background: "rgba(7,16,24,0.9)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: "200px",
  },
  previewCardIcon: {
    fontSize: "1.5rem",
  },
  previewCardTitle: {
    fontSize: "0.7rem",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "2px",
  },
  previewCardValue: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#fff",
  },

  // CTA Section
  ctaSection: {
    padding: "80px 0",
    background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,163,74,0.05))",
    borderTop: "1px solid rgba(34,197,94,0.1)",
    borderBottom: "1px solid rgba(34,197,94,0.1)",
  },
  ctaContent: {
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto",
    padding: "0 24px",
  },
  ctaTitle: {
    fontSize: "2.2rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 16px",
  },
  ctaSubtitle: {
    fontSize: "1.05rem",
    color: "rgba(255,255,255,0.6)",
    margin: "0 0 32px",
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    padding: "48px 0",
    background: "#071018",
  },
  footerContent: {
    textAlign: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
  },
  footerBrand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "16px",
  },
  footerText: {
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.5)",
    margin: "0 0 8px",
  },
  footerCopy: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.3)",
    margin: 0,
  },
};
