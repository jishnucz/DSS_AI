/**
 * 🚀 Futuristic SplashScreen
 * KPRverse-inspired immersive loading experience
 */

import { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500&display=swap');

  @keyframes glitch {
    0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
    10% { transform: translate(-2px, -2px); }
    20% { transform: translate(2px, 2px); filter: hue-rotate(90deg); }
    30% { transform: translate(-2px, 2px); }
    40% { transform: translate(2px, -2px); filter: hue-rotate(-90deg); }
    50% { transform: translate(0); }
  }
  
  @keyframes glitchText {
    0%, 100% { text-shadow: 2px 0 #00ff88, -2px 0 #ff0088; }
    25% { text-shadow: -2px 0 #00ff88, 2px 0 #ff0088; }
    50% { text-shadow: 2px -2px #00ff88, -2px 2px #ff0088; }
    75% { text-shadow: -2px 2px #00ff88, 2px -2px #ff0088; }
  }
  
  @keyframes scanline {
    0% { top: -100%; }
    100% { top: 100%; }
  }
  
  @keyframes flicker {
    0%, 100% { opacity: 1; }
    92% { opacity: 1; }
    93% { opacity: 0.3; }
    94% { opacity: 1; }
    96% { opacity: 0.5; }
    97% { opacity: 1; }
  }
  
  @keyframes terminalType {
    from { width: 0; }
    to { width: 100%; }
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  
  @keyframes dataPulse {
    0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
    50% { opacity: 1; transform: scaleX(1); }
  }
  
  @keyframes hexFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
    50% { transform: translateY(-20px) rotate(180deg); opacity: 0.4; }
  }
  
  @keyframes circuitFlow {
    0% { stroke-dashoffset: 1000; opacity: 0; }
    50% { opacity: 1; }
    100% { stroke-dashoffset: 0; opacity: 0; }
  }
  
  @keyframes ringPulse {
    0% { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  
  @keyframes dataStream {
    0% { transform: translateY(100%); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100%); opacity: 0; }
  }
  
  @keyframes fadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; visibility: hidden; }
  }

  .splash-futuristic .terminal-text {
    font-family: 'JetBrains Mono', monospace;
    animation: flicker 4s infinite;
  }
  
  .splash-futuristic .glitch-active {
    animation: glitch 0.3s infinite;
  }
`;

function SplashScreenFuturistic({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("INITIALIZING SYSTEMS...");
  const [terminalLines, setTerminalLines] = useState([]);
  const [isExiting, setIsExiting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Inject CSS
    if (!document.querySelector('style[data-id="splash-futuristic"]')) {
      const el = document.createElement("style");
      el.setAttribute("data-id", "splash-futuristic");
      el.textContent = CSS;
      document.head.appendChild(el);
    }

    // Start animation after brief delay
    setTimeout(() => setShowContent(true), 100);

    // Terminal simulation
    const lines = [
      { text: "> CONNECTING TO AGRI_DSS_CORE...", delay: 0 },
      { text: "> LOADING ERA5 CLIMATE DATA [140,000+ RECORDS]", delay: 400 },
      { text: "> INITIALIZING ML ENSEMBLE [8 MODELS]", delay: 800 },
      { text: "> CALIBRATING CROP STRESS ALGORITHMS", delay: 1200 },
      { text: "> SYNCING TALUK GEOGRAPHIC DATA", delay: 1600 },
      { text: "> VALIDATING RESEARCH METRICS [88.3% ACC]", delay: 2000 },
      { text: "> SYSTEM READY", delay: 2400 },
    ];

    lines.forEach(({ text, delay }) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, text]);
      }, delay);
    });

    // Progress simulation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 3 + 1;
      });
    }, 50);

    // Status updates
    const statuses = [
      { text: "LOADING NEURAL NETWORKS...", delay: 500 },
      { text: "PROCESSING CLIMATE DATA...", delay: 1000 },
      { text: "CALIBRATING SENSORS...", delay: 1500 },
      { text: "ANALYZING CROP PATTERNS...", delay: 2000 },
      { text: "SYSTEM ONLINE", delay: 2500 },
    ];

    statuses.forEach(({ text, delay }) => {
      setTimeout(() => setStatus(text), delay);
    });

    // Canvas animation
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1,
      }));

      let animationId;
      const animate = () => {
        ctx.fillStyle = "rgba(3, 7, 18, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 197, 94, ${Math.random() * 0.5 + 0.3})`;
          ctx.fill();

          // Draw connections
          particles.forEach(p2 => {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(34, 197, 94, ${(150 - dist) / 500})`;
              ctx.stroke();
            }
          });
        });

        animationId = requestAnimationFrame(animate);
      };
      animate();

      return () => cancelAnimationFrame(animationId);
    }
  }, []);

  useEffect(() => {
    if (progress >= 100 && !isExiting) {
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onComplete && onComplete(), 800);
      }, 500);
    }
  }, [progress, isExiting, onComplete]);

  return (
    <div 
      className="splash-futuristic"
      style={{
        ...styles.container,
        animation: isExiting ? "fadeOut 0.8s ease-out forwards" : undefined
      }}
    >
      {/* Background Canvas */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Scanline Effect */}
      <div style={styles.scanline} />

      {/* Grid Overlay */}
      <div style={styles.grid} />

      {/* Hexagon Pattern */}
      <svg style={styles.hexPattern} viewBox="0 0 100 100">
        {[...Array(10)].map((_, i) => (
          <polygon
            key={i}
            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
            fill="none"
            stroke="rgba(34, 197, 94, 0.1)"
            strokeWidth="0.5"
            style={{
              transform: `scale(${0.2 + i * 0.1})`,
              transformOrigin: "center",
              animation: `hexFloat ${3 + i * 0.5}s ease-in-out infinite ${i * 0.2}s`
            }}
          />
        ))}
      </svg>

      {/* Main Content */}
      {showContent && (
        <div style={styles.content}>
          {/* Logo Section */}
          <div style={styles.logoSection}>
            {/* Pulsing Rings */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.ring,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}

            {/* Main Logo */}
            <div style={styles.logoContainer}>
              <div style={styles.logoInner}>
                <span style={styles.logoEmoji}>🌾</span>
              </div>
              <div style={styles.logoGlow} />
            </div>
          </div>

          {/* Title */}
          <div style={styles.titleSection}>
            <h1 style={styles.title} className="terminal-text">
              AGRIDSS_INTELLIGENCE
            </h1>
            <div style={styles.subtitle}>
              <span style={styles.subtitleBracket}>[</span>
              <span style={styles.subtitleText}>AGRICULTURAL INTELLIGENCE SYSTEM</span>
              <span style={styles.subtitleBracket}>]</span>
            </div>
          </div>

          {/* Terminal Window */}
          <div style={styles.terminal}>
            <div style={styles.terminalHeader}>
              <div style={styles.terminalDots}>
                <span style={{ ...styles.dot, background: "#ff5f57" }} />
                <span style={{ ...styles.dot, background: "#ffbd2e" }} />
                <span style={{ ...styles.dot, background: "#28c840" }} />
              </div>
              <span style={styles.terminalTitle}>// SYSTEM_CONSOLE</span>
            </div>
            <div style={styles.terminalBody}>
              {terminalLines.map((line, i) => (
                <div key={i} style={styles.terminalLine}>
                  <span style={styles.terminalText}>{line}</span>
                  {i === terminalLines.length - 1 && (
                    <span style={styles.cursor}>█</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress Section */}
          <div style={styles.progressSection}>
            <div style={styles.progressInfo}>
              <span style={styles.progressLabel}>
                {status}
              </span>
              <span style={styles.progressPercent}>
                {Math.min(100, Math.round(progress))}%
              </span>
            </div>
            <div style={styles.progressBar}>
              <div 
                style={{ 
                  ...styles.progressFill, 
                  width: `${Math.min(100, progress)}%` 
                }} 
              />
              <div style={styles.progressGlow} />
            </div>
            <div style={styles.progressTicks}>
              {[0, 25, 50, 75, 100].map(tick => (
                <span key={tick} style={styles.tick}>{tick}</span>
              ))}
            </div>
          </div>

          {/* Data Streams */}
          <div style={styles.dataStreams}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.dataStream,
                  left: `${10 + i * 20}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + Math.random()}s`
                }}
              >
                {[...Array(10)].map((_, j) => (
                  <span key={j} style={styles.dataChar}>
                    {Math.random() > 0.5 ? "1" : "0"}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Version Info */}
          <div style={styles.versionInfo}>
            <span>v2.0.0</span>
            <span style={styles.divider}>|</span>
            <span>AI RESEARCH</span>
            <span style={styles.divider}>|</span>
            <span>ERA5 • 2010-2026</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    background: "#030712",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    overflow: "hidden",
    fontFamily: "'Orbitron', sans-serif",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    opacity: 0.5,
  },
  scanline: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.3) 50%)",
    backgroundSize: "100% 4px",
    pointerEvents: "none",
    opacity: 0.1,
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: "50px 50px",
    pointerEvents: "none",
  },
  hexPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.3,
  },
  content: {
    position: "relative",
    zIndex: 10,
    textAlign: "center",
    maxWidth: "600px",
    padding: "20px",
  },
  logoSection: {
    position: "relative",
    width: "160px",
    height: "160px",
    margin: "0 auto 40px",
  },
  ring: {
    position: "absolute",
    inset: 0,
    border: "2px solid rgba(34, 197, 94, 0.5)",
    borderRadius: "50%",
    animation: "ringPulse 2s ease-out infinite",
  },
  logoContainer: {
    position: "absolute",
    inset: "30px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(17, 24, 39, 0.9))",
    border: "2px solid rgba(34, 197, 94, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 60px rgba(34, 197, 94, 0.3), inset 0 0 40px rgba(34, 197, 94, 0.1)",
  },
  logoInner: {
    fontSize: "48px",
    animation: "flicker 4s infinite",
  },
  logoEmoji: {
    filter: "drop-shadow(0 0 20px rgba(34, 197, 94, 0.8))",
  },
  logoGlow: {
    position: "absolute",
    inset: "-10px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34, 197, 94, 0.2), transparent 70%)",
  },
  titleSection: {
    marginBottom: "40px",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "#22c55e",
    textTransform: "uppercase",
    letterSpacing: "8px",
    margin: "0 0 16px 0",
    textShadow: "0 0 40px rgba(34, 197, 94, 0.5), 2px 0 #00ff88, -2px 0 #ff0088",
    animation: "glitchText 3s infinite",
  },
  subtitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "0.9rem",
    color: "#6b7280",
    letterSpacing: "4px",
  },
  subtitleBracket: {
    color: "#22c55e",
    fontWeight: 600,
  },
  subtitleText: {
    color: "#9ca3af",
  },
  terminal: {
    background: "rgba(0, 0, 0, 0.6)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "12px",
    marginBottom: "32px",
    overflow: "hidden",
    textAlign: "left",
    boxShadow: "0 0 40px rgba(0, 0, 0, 0.5)",
  },
  terminalHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "rgba(17, 24, 39, 0.8)",
    borderBottom: "1px solid rgba(34, 197, 94, 0.2)",
  },
  terminalDots: {
    display: "flex",
    gap: "6px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  terminalTitle: {
    fontSize: "0.75rem",
    color: "#6b7280",
    letterSpacing: "2px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  terminalBody: {
    padding: "16px",
    minHeight: "140px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  terminalLine: {
    marginBottom: "8px",
    fontSize: "0.8rem",
    color: "#4ade80",
    display: "flex",
    alignItems: "center",
  },
  terminalText: {
    opacity: 0.9,
  },
  cursor: {
    marginLeft: "4px",
    animation: "blink 1s infinite",
    color: "#22c55e",
  },
  progressSection: {
    marginBottom: "32px",
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "0.75rem",
    letterSpacing: "2px",
  },
  progressLabel: {
    color: "#6b7280",
    fontFamily: "'JetBrains Mono', monospace",
  },
  progressPercent: {
    color: "#22c55e",
    fontWeight: 700,
    fontFamily: "'Orbitron', sans-serif",
  },
  progressBar: {
    position: "relative",
    height: "4px",
    background: "rgba(34, 197, 94, 0.1)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    background: "linear-gradient(90deg, #22c55e, #4ade80)",
    borderRadius: "2px",
    transition: "width 0.1s ease-out",
    boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
  },
  progressGlow: {
    position: "absolute",
    top: "-10px",
    left: 0,
    right: 0,
    height: "24px",
    background: "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)",
    animation: "dataPulse 1.5s infinite",
  },
  progressTicks: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "8px",
    fontSize: "0.6rem",
    color: "#4b5563",
    fontFamily: "'JetBrains Mono', monospace",
  },
  tick: {},
  dataStreams: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  dataStream: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    animation: "dataStream 3s linear infinite",
    opacity: 0.3,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    color: "#22c55e",
  },
  dataChar: {
    textShadow: "0 0 10px rgba(34, 197, 94, 0.5)",
  },
  versionInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    fontSize: "0.7rem",
    color: "#4b5563",
    letterSpacing: "2px",
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: "uppercase",
  },
  divider: {
    color: "#374151",
  },
};

export default SplashScreenFuturistic;
