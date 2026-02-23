import { useState, useEffect, useRef } from "react";

export default function SplashScreenNature({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const canvasRef = useRef(null);

  const phrases = [
    "Nurturing Growth",
    "Harmonizing Climate & Crops",
    "Cultivating Intelligence",
    "Agricultural Decision Support",
  ];

  // Floating leaves animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const leaves = [];
    const leafCount = 15;

    // Create leaves with organic shapes
    for (let i = 0; i < leafCount; i++) {
      leaves.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 15 + Math.random() * 25,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: 0.3 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.4,
        type: Math.floor(Math.random() * 3), // Different leaf types
      });
    }

    // Floating particles (pollen/seeds)
    const particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -0.2 - Math.random() * 0.3,
        opacity: 0.2 + Math.random() * 0.3,
      });
    }

    const drawLeaf = (x, y, size, rotation, type, opacity) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;

      if (type === 0) {
        // Simple oval leaf
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.4, size, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(74, 222, 128, 0.6)";
        ctx.fill();
        // Leaf vein
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (type === 1) {
        // Rice grain shape
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.25, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(250, 240, 200, 0.5)";
        ctx.fill();
        ctx.strokeStyle = "rgba(180, 160, 100, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Rounded leaf
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.bezierCurveTo(size * 0.6, -size * 0.5, size * 0.6, size * 0.5, 0, size);
        ctx.bezierCurveTo(-size * 0.6, size * 0.5, -size * 0.6, -size * 0.5, 0, -size);
        ctx.fillStyle = "rgba(134, 239, 172, 0.5)";
        ctx.fill();
      }

      ctx.restore();
    };

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });

      // Draw leaves
      leaves.forEach((leaf) => {
        drawLeaf(leaf.x, leaf.y, leaf.size, leaf.rotation, leaf.type, leaf.opacity);

        leaf.x += leaf.speedX + Math.sin(Date.now() * 0.001 + leaf.y * 0.01) * 0.3;
        leaf.y += leaf.speedY;
        leaf.rotation += leaf.rotationSpeed;

        if (leaf.y > canvas.height + 50) {
          leaf.y = -50;
          leaf.x = Math.random() * canvas.width;
        }
        if (leaf.x < -50) leaf.x = canvas.width + 50;
        if (leaf.x > canvas.width + 50) leaf.x = -50;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Progress and phase animation
  useEffect(() => {
    setShowContent(true);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 600);
          return 100;
        }
        return p + 0.8;
      });
    }, 40);

    const phaseInterval = setInterval(() => {
      setPhase((p) => (p + 1) % phrases.length);
    }, 1200);

    return () => {
      clearInterval(interval);
      clearInterval(phaseInterval);
    };
  }, [onComplete]);

  return (
    <div style={styles.container}>
      {/* Gradient Background */}
      <div style={styles.gradient} />

      {/* Animated gradient waves */}
      <div style={styles.wave1} />
      <div style={styles.wave2} />
      <div style={styles.wave3} />

      {/* Canvas for floating elements */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Soft light overlay */}
      <div style={styles.lightOverlay} />

      {/* Content */}
      <div
        style={{
          ...styles.content,
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(30px)",
        }}
      >
        {/* Logo area with rice paddy icon */}
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <div style={styles.logoInner}>
              <span style={styles.logoEmoji}>🌾</span>
            </div>
            {/* Orbiting elements */}
            <div style={styles.orbit}>
              <div style={styles.orbitDot1}>💧</div>
              <div style={styles.orbitDot2}>☀️</div>
              <div style={styles.orbitDot3}>🌱</div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 style={styles.title}>
          <span style={styles.titleMain}>AgriDSS</span>
          <span style={styles.titleSub}>Intelligence Platform</span>
        </h1>

        {/* Animated phrase */}
        <div style={styles.phraseContainer}>
          {phrases.map((phrase, i) => (
            <p
              key={i}
              style={{
                ...styles.phrase,
                opacity: phase === i ? 1 : 0,
                transform: phase === i ? "translateY(0)" : "translateY(10px)",
              }}
            >
              {phrase}
            </p>
          ))}
        </div>

        {/* Progress bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progress}%`,
              }}
            />
            {/* Growing plant indicator */}
            <div
              style={{
                ...styles.progressPlant,
                left: `${Math.min(progress, 98)}%`,
              }}
            >
              🌿
            </div>
          </div>
          <div style={styles.progressText}>
            <span>Loading ecosystem data...</span>
            <span style={styles.progressPercent}>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Data points */}
        <div style={styles.dataPoints}>
          <div style={styles.dataPoint}>
            <span style={styles.dataIcon}>🌡️</span>
            <span style={styles.dataLabel}>Climate Data</span>
          </div>
          <div style={styles.dataDivider} />
          <div style={styles.dataPoint}>
            <span style={styles.dataIcon}>🗺️</span>
            <span style={styles.dataLabel}>13 Taluks</span>
          </div>
          <div style={styles.dataDivider} />
          <div style={styles.dataPoint}>
            <span style={styles.dataIcon}>🤖</span>
            <span style={styles.dataLabel}>ML Models</span>
          </div>
        </div>

        {/* Footer */}
        <p style={styles.footer}>
          M.Tech Research Project • ERA5 Climate Intelligence
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@300;400;500;600;700&family=Dancing+Script:wght@400;500;600;700&display=swap');

        @keyframes wave {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
          50% { transform: translateX(-50%) translateY(-20px) rotate(2deg); }
        }

        @keyframes wave2 {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
          50% { transform: translateX(-50%) translateY(-15px) rotate(-2deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(70px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
        }

        @keyframes orbit2 {
          0% { transform: rotate(120deg) translateX(70px) rotate(-120deg); }
          100% { transform: rotate(480deg) translateX(70px) rotate(-480deg); }
        }

        @keyframes orbit3 {
          0% { transform: rotate(240deg) translateX(70px) rotate(-240deg); }
          100% { transform: rotate(600deg) translateX(70px) rotate(-600deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes grow {
          0%, 100% { transform: scale(1) translateX(-50%); }
          50% { transform: scale(1.2) translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    position: "absolute",
    inset: 0,
    background: `
      linear-gradient(135deg, 
        #0d3320 0%, 
        #134e3a 25%, 
        #166534 50%, 
        #15803d 75%, 
        #166534 100%
      )
    `,
  },
  wave1: {
    position: "absolute",
    bottom: "-10%",
    left: "50%",
    width: "200%",
    height: "40%",
    background: "linear-gradient(180deg, transparent, rgba(74, 222, 128, 0.1))",
    borderRadius: "50% 50% 0 0",
    animation: "wave 8s ease-in-out infinite",
  },
  wave2: {
    position: "absolute",
    bottom: "-15%",
    left: "50%",
    width: "180%",
    height: "35%",
    background: "linear-gradient(180deg, transparent, rgba(134, 239, 172, 0.08))",
    borderRadius: "50% 50% 0 0",
    animation: "wave2 10s ease-in-out infinite",
    animationDelay: "-2s",
  },
  wave3: {
    position: "absolute",
    bottom: "-20%",
    left: "50%",
    width: "220%",
    height: "45%",
    background: "linear-gradient(180deg, transparent, rgba(187, 247, 208, 0.05))",
    borderRadius: "50% 50% 0 0",
    animation: "wave 12s ease-in-out infinite",
    animationDelay: "-4s",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  lightOverlay: {
    position: "absolute",
    inset: 0,
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(187, 247, 208, 0.08) 0%, transparent 40%)
    `,
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    zIndex: 10,
    textAlign: "center",
    padding: "40px",
    transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  logoContainer: {
    marginBottom: "40px",
    display: "flex",
    justifyContent: "center",
  },
  logoCircle: {
    position: "relative",
    width: "140px",
    height: "140px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoInner: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))",
    backdropFilter: "blur(10px)",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.1)",
    animation: "pulse 3s ease-in-out infinite",
  },
  logoEmoji: {
    fontSize: "48px",
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
    animation: "float 4s ease-in-out infinite",
  },
  orbit: {
    position: "absolute",
    inset: 0,
  },
  orbitDot1: {
    position: "absolute",
    top: "50%",
    left: "50%",
    fontSize: "20px",
    animation: "orbit 8s linear infinite",
    marginTop: "-10px",
    marginLeft: "-10px",
  },
  orbitDot2: {
    position: "absolute",
    top: "50%",
    left: "50%",
    fontSize: "20px",
    animation: "orbit2 8s linear infinite",
    marginTop: "-10px",
    marginLeft: "-10px",
  },
  orbitDot3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    fontSize: "20px",
    animation: "orbit3 8s linear infinite",
    marginTop: "-10px",
    marginLeft: "-10px",
  },
  title: {
    margin: "0 0 20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  titleMain: {
    fontSize: "3.5rem",
    fontWeight: "700",
    fontFamily: "'Playfair Display', serif",
    color: "#fff",
    textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    letterSpacing: "2px",
  },
  titleSub: {
    fontSize: "1.3rem",
    fontWeight: "400",
    fontFamily: "'Lato', sans-serif",
    color: "rgba(187, 247, 208, 0.9)",
    letterSpacing: "8px",
    textTransform: "uppercase",
  },
  phraseContainer: {
    position: "relative",
    height: "40px",
    marginBottom: "50px",
  },
  phrase: {
    position: "absolute",
    width: "100%",
    margin: 0,
    fontSize: "1.2rem",
    fontFamily: "'Dancing Script', cursive",
    color: "rgba(255, 255, 255, 0.8)",
    transition: "all 0.5s ease",
    letterSpacing: "1px",
  },
  progressContainer: {
    width: "320px",
    margin: "0 auto 40px",
  },
  progressTrack: {
    position: "relative",
    height: "6px",
    background: "rgba(255, 255, 255, 0.15)",
    borderRadius: "3px",
    overflow: "visible",
    marginBottom: "12px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #4ade80, #86efac, #bbf7d0)",
    borderRadius: "3px",
    transition: "width 0.1s ease",
    boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)",
  },
  progressPlant: {
    position: "absolute",
    top: "-12px",
    fontSize: "20px",
    transform: "translateX(-50%)",
    transition: "left 0.1s ease",
    animation: "grow 2s ease-in-out infinite",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
  },
  progressText: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.8rem",
    fontFamily: "'Lato', sans-serif",
    color: "rgba(255, 255, 255, 0.6)",
  },
  progressPercent: {
    color: "#86efac",
    fontWeight: "600",
  },
  dataPoints: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
    marginBottom: "40px",
  },
  dataPoint: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dataIcon: {
    fontSize: "18px",
  },
  dataLabel: {
    fontSize: "0.85rem",
    fontFamily: "'Lato', sans-serif",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  dataDivider: {
    width: "1px",
    height: "20px",
    background: "rgba(255, 255, 255, 0.2)",
  },
  footer: {
    margin: 0,
    fontSize: "0.75rem",
    fontFamily: "'Lato', sans-serif",
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: "2px",
  },
};
