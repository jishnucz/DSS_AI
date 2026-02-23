import { useState, useEffect } from "react";

const CSS = `
  @keyframes splashZoomIn {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes splashGlow {
    0%, 100% {
      filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.3));
    }
    50% {
      filter: drop-shadow(0 0 60px rgba(34, 197, 94, 0.8)) drop-shadow(0 0 100px rgba(74, 222, 128, 0.5));
    }
  }

  @keyframes splashPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
    }
    50% {
      box-shadow: 0 0 0 30px rgba(34, 197, 94, 0);
    }
  }

  @keyframes splashFadeOut {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      visibility: hidden;
    }
  }

  @keyframes particleFloat {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) rotate(720deg);
      opacity: 0;
    }
  }

  @keyframes ringExpand {
    0% {
      transform: scale(0.5);
      opacity: 0.8;
      border-width: 3px;
    }
    100% {
      transform: scale(3);
      opacity: 0;
      border-width: 0px;
    }
  }

  @keyframes textReveal {
    0% {
      opacity: 0;
      letter-spacing: 20px;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      letter-spacing: 8px;
      transform: translateY(0);
    }
  }

  @keyframes lineExpand {
    0% {
      width: 0;
    }
    100% {
      width: 200px;
    }
  }

  .splash-particle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, #22c55e, #4ade80);
    border-radius: 50%;
    animation: particleFloat 4s ease-in-out infinite;
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

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState("loading"); // loading → fadeout → done

  useEffect(() => {
    inject("splash-styles", CSS);

    // Phase 1: Show animation for 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setPhase("fadeout");
    }, 2500);

    // Phase 2: Complete fade out after 3 seconds total
    const completeTimer = setTimeout(() => {
      setPhase("done");
      onComplete?.();
    }, 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div style={{
      ...styles.container,
      animation: phase === "fadeout" ? "splashFadeOut 0.7s ease-out forwards" : "none",
    }}>
      {/* Animated background gradient */}
      <div style={styles.bgGradient} />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="splash-particle"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `-20px`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            opacity: 0.3 + Math.random() * 0.5,
          }}
        />
      ))}

      {/* Main content */}
      <div style={styles.content}>
        {/* Expanding rings */}
        <div style={styles.ringContainer}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                ...styles.ring,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* App name */}
        <h1 style={styles.title}>AGRIDSS INTELLIGENCE</h1>

        {/* Subtitle */}
        <div style={styles.subtitle}>
          <div style={styles.line} />
          <span style={styles.subtitleText}>Agricultural Intelligence System</span>
          <div style={styles.line} />
        </div>

        {/* Loading indicator */}
        <div style={styles.loadingDots}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom attribution */}
      <div style={styles.attribution}>
        <span style={styles.poweredBy}>Powered by AI & Weather Intelligence</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0a0f0d 0%, #111827 50%, #0d1117 100%)",
    overflow: "hidden",
  },
  bgGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(74, 222, 128, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(22, 163, 74, 0.08) 0%, transparent 70%)
    `,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  ringContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "300px",
    height: "300px",
  },
  ring: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "280px",
    height: "280px",
    border: "2px solid rgba(34, 197, 94, 0.5)",
    borderRadius: "50%",
    animation: "ringExpand 2s ease-out infinite",
  },
  title: {
    margin: 0,
    fontSize: "3.5rem",
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "8px",
    textShadow: "0 0 40px rgba(34, 197, 94, 0.5)",
    animation: "textReveal 1s ease-out 0.3s forwards",
    opacity: 0,
    position: "relative",
    zIndex: 2,
  },
  subtitle: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px",
    opacity: 0,
    animation: "textReveal 1s ease-out 0.6s forwards",
  },
  line: {
    height: "1px",
    width: "0",
    background: "linear-gradient(90deg, transparent, #22c55e, transparent)",
    animation: "lineExpand 1s ease-out 1s forwards",
  },
  subtitleText: {
    fontSize: "0.85rem",
    color: "#4ade80",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "2px",
    whiteSpace: "nowrap",
  },
  loadingDots: {
    display: "flex",
    gap: "8px",
    marginTop: "48px",
    opacity: 0,
    animation: "textReveal 0.5s ease-out 0.9s forwards",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#22c55e",
    animation: "splashPulse 1.4s ease-in-out infinite",
  },
  attribution: {
    position: "absolute",
    bottom: "32px",
    opacity: 0,
    animation: "textReveal 0.5s ease-out 1.1s forwards",
  },
  poweredBy: {
    fontSize: "0.75rem",
    color: "#6B7280",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "1px",
  },
};
