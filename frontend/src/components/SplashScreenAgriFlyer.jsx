import { useState, useEffect } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
  
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(25px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes shine { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  @keyframes bounceIn { 0%{opacity:0;transform:scale(0.3)} 50%{transform:scale(1.05)} 70%{transform:scale(0.95)} 100%{opacity:1;transform:scale(1)} }
  @keyframes gradientMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes leafFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 25%{transform:translateY(-6px) rotate(1deg)} 75%{transform:translateY(4px) rotate(-1deg)} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 25px rgba(34,197,94,0.25)} 50%{box-shadow:0 0 50px rgba(34,197,94,0.4)} }
  
  .agriflyer-splash {
    position: fixed;
    inset: 0;
    z-index: 10000;
    font-family: 'Poppins', sans-serif;
    overflow: hidden;
  }
  
  .agriflyer-splash .stat-card {
    backdrop-filter: blur(16px);
    animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    opacity: 0;
  }
  
  .agriflyer-splash .feature-icon {
    animation: leafFloat 4s ease-in-out infinite;
  }
  
  .agriflyer-splash .logo-circle {
    animation: glowPulse 2.5s ease-in-out infinite;
  }
  
  @media (max-width: 768px) {
    .agriflyer-splash .features-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .agriflyer-splash .stats-row {
      gap: 8px !important;
    }
  }
`;

// Premium agriculture images
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=85",
};

function injectCSS(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export default function SplashScreenAgriFlyer({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    injectCSS("agriflyer-splash-css", CSS);
    
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = IMAGES.hero;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 55);

    setTimeout(() => setPhase(1), 200);
    setTimeout(() => setShowContent(true), 400);
    setTimeout(() => setPhase(2), 1200);
    setTimeout(() => setPhase(3), 1800);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 3500);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  const features = [
    { icon: "🌾", title: "Crop Intelligence", desc: "AI analysis" },
    { icon: "🌤️", title: "Weather Insights", desc: "Forecasting" },
    { icon: "📊", title: "Smart Analytics", desc: "Data-driven" },
    { icon: "🌱", title: "Growth Tracking", desc: "Monitoring" },
  ];

  const stats = [
    { value: "13", label: "Taluks", icon: "📍" },
    { value: "7+", label: "Crops", icon: "🌿" },
    { value: "AI", label: "Powered", icon: "🤖" },
    { value: "24/7", label: "Active", icon: "⏰" },
  ];

  const loadingMessages = [
    "Initializing systems...",
    "Loading crop database...",
    "Preparing AI models...",
    "Almost ready..."
  ];

  const currentMessage = loadingMessages[Math.min(Math.floor(progress / 25), 3)];

  const styles = {
    container: {
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: "linear-gradient(145deg, #071018 0%, #0d1f12 50%, #0a1520 100%)",
    },
    
    bgImage: {
      position: "absolute",
      inset: 0,
      backgroundImage: `url(${IMAGES.hero})`,
      backgroundSize: "cover",
      backgroundPosition: "center 40%",
      opacity: imageLoaded ? 0.3 : 0,
      transition: "opacity 1.5s ease",
      filter: "saturate(1.3) brightness(0.9)",
    },
    
    overlay: {
      position: "absolute",
      inset: 0,
      background: `linear-gradient(180deg, 
        rgba(7, 16, 24, 0.9) 0%, 
        rgba(13, 31, 18, 0.8) 40%,
        rgba(10, 21, 32, 0.85) 70%,
        rgba(7, 16, 24, 0.95) 100%
      )`,
    },
    
    topGlow: {
      position: "absolute",
      top: "-20%",
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      height: "50%",
      background: "radial-gradient(ellipse at center, rgba(34,197,94,0.1) 0%, transparent 65%)",
      pointerEvents: "none",
    },

    content: {
      position: "relative",
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      maxWidth: "850px",
      width: "100%",
      opacity: showContent ? 1 : 0,
      transform: showContent ? "translateY(0)" : "translateY(15px)",
      transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
    },

    logoSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "28px",
    },
    
    logoCircle: {
      width: "90px",
      height: "90px",
      borderRadius: "50%",
      background: "linear-gradient(145deg, #22c55e 0%, #16a34a 70%, #15803d 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "2.5rem",
      boxShadow: "0 12px 40px rgba(34, 197, 94, 0.35), inset 0 -3px 12px rgba(0,0,0,0.15)",
      marginBottom: "18px",
      animation: phase >= 1 ? "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
      opacity: phase >= 1 ? 1 : 0,
    },
    
    brandName: {
      fontSize: "2.2rem",
      fontWeight: "700",
      color: "#fff",
      letterSpacing: "-0.3px",
      marginBottom: "6px",
      textAlign: "center",
      animation: phase >= 1 ? "slideUp 0.4s ease 0.1s forwards" : "none",
      opacity: phase >= 1 ? 1 : 0,
      textShadow: "0 2px 15px rgba(0,0,0,0.25)",
    },
    
    brandNameGreen: {
      background: "linear-gradient(135deg, #4ade80 0%, #22c55e 60%, #16a34a 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    
    tagline: {
      fontSize: "0.95rem",
      color: "rgba(255,255,255,0.6)",
      fontWeight: "400",
      letterSpacing: "0.2px",
      textAlign: "center",
      animation: phase >= 1 ? "slideUp 0.4s ease 0.2s forwards" : "none",
      opacity: phase >= 1 ? 1 : 0,
    },

    statsRow: {
      display: "flex",
      gap: "10px",
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: "24px",
    },
    
    statCard: {
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "12px",
      padding: "12px 18px",
      textAlign: "center",
      minWidth: "75px",
    },
    
    statIcon: {
      fontSize: "1.1rem",
      marginBottom: "4px",
    },
    
    statValue: {
      fontSize: "1.3rem",
      fontWeight: "700",
      color: "#4ade80",
      marginBottom: "1px",
    },
    
    statLabel: {
      fontSize: "0.6rem",
      color: "rgba(255,255,255,0.5)",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
      fontWeight: "500",
    },

    featuresGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "10px",
      width: "100%",
      maxWidth: "650px",
      marginBottom: "30px",
      opacity: phase >= 2 ? 1 : 0,
      transform: phase >= 2 ? "translateY(0)" : "translateY(12px)",
      transition: "all 0.5s ease",
    },
    
    featureCard: {
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: "12px",
      padding: "16px 10px",
      textAlign: "center",
    },
    
    featureIcon: {
      fontSize: "1.4rem",
      marginBottom: "6px",
      display: "block",
    },
    
    featureTitle: {
      fontSize: "0.72rem",
      fontWeight: "600",
      color: "#fff",
      marginBottom: "2px",
    },
    
    featureDesc: {
      fontSize: "0.62rem",
      color: "rgba(255,255,255,0.45)",
    },

    progressSection: {
      width: "100%",
      maxWidth: "420px",
      opacity: phase >= 3 ? 1 : 0,
      transform: phase >= 3 ? "translateY(0)" : "translateY(10px)",
      transition: "all 0.4s ease",
    },
    
    progressHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    },
    
    progressLabel: {
      fontSize: "0.75rem",
      color: "rgba(255,255,255,0.6)",
      fontWeight: "500",
    },
    
    progressPercent: {
      fontWeight: "600",
      color: "#4ade80",
      fontSize: "0.85rem",
    },
    
    progressTrack: {
      height: "6px",
      background: "rgba(255,255,255,0.08)",
      borderRadius: "100px",
      overflow: "hidden",
    },
    
    progressBar: {
      height: "100%",
      background: "linear-gradient(90deg, #16a34a, #22c55e, #4ade80)",
      backgroundSize: "200% 100%",
      animation: "gradientMove 1.5s ease infinite",
      borderRadius: "100px",
      width: `${progress}%`,
      transition: "width 0.2s ease",
      position: "relative",
      overflow: "hidden",
    },
    
    progressShine: {
      position: "absolute",
      top: 0,
      width: "50%",
      height: "100%",
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
      animation: "shine 1.2s ease infinite",
    },
    
    loadingText: {
      marginTop: "12px",
      fontSize: "0.75rem",
      color: "rgba(255,255,255,0.45)",
      textAlign: "center",
      fontWeight: "400",
      marginBottom: "60px", // Space for bottom badge
    },

    bottomBrand: {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 15,
    },
    
    palakkadBadge: {
      background: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.2)",
      padding: "8px 16px",
      borderRadius: "100px",
      fontSize: "0.7rem",
      fontWeight: "500",
      color: "rgba(74,222,128,0.85)",
      letterSpacing: "0.3px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },

    decorativeCircle1: {
      position: "absolute",
      top: "8%",
      right: "8%",
      width: "200px",
      height: "200px",
      border: "1px solid rgba(34,197,94,0.06)",
      borderRadius: "50%",
      opacity: 0.4,
    },
    
    decorativeCircle2: {
      position: "absolute",
      bottom: "12%",
      left: "5%",
      width: "150px",
      height: "150px",
      border: "1px solid rgba(34,197,94,0.05)",
      borderRadius: "50%",
      opacity: 0.4,
    },
  };

  return (
    <div className="agriflyer-splash" style={styles.container}>
      <div style={styles.bgImage} />
      <div style={styles.overlay} />
      <div style={styles.topGlow} />
      <div style={styles.decorativeCircle1} />
      <div style={styles.decorativeCircle2} />

      <div style={styles.content}>
        <div style={styles.logoSection}>
          <div className="logo-circle" style={styles.logoCircle}>🌾</div>
          <h1 style={styles.brandName}>
            <span style={styles.brandNameGreen}>AgriDSS</span>
            <span> Intelligence</span>
          </h1>
          <p style={styles.tagline}>
            Smart Agriculture Decision Support System
          </p>
        </div>

        <div className="stats-row" style={styles.statsRow}>
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ ...styles.statCard, animationDelay: `${0.6 + i * 0.1}s` }}
            >
              <div style={styles.statIcon}>{stat.icon}</div>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="features-grid" style={styles.featuresGrid}>
          {features.map((feat, i) => (
            <div key={i} style={styles.featureCard}>
              <span className="feature-icon" style={{ ...styles.featureIcon, animationDelay: `${i * 0.15}s` }}>
                {feat.icon}
              </span>
              <div style={styles.featureTitle}>{feat.title}</div>
              <div style={styles.featureDesc}>{feat.desc}</div>
            </div>
          ))}
        </div>

        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Loading Application</span>
            <span style={styles.progressPercent}>{progress}%</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={styles.progressBar}>
              <div style={styles.progressShine} />
            </div>
          </div>
          <div style={styles.loadingText}>{currentMessage}</div>
        </div>
      </div>

      <div style={styles.bottomBrand}>
        <span style={styles.palakkadBadge}>
          <span>�</span>
          <span>ERA5 Climate Intelligence • M.Tech Research</span>
        </span>
      </div>
    </div>
  );
}
