import { useState, useEffect } from "react";

const CSS = `
  @keyframes wa-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
  @keyframes wa-slide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wa-spin { to{transform:rotate(360deg)} }
  .wa-card { transition: all 0.25s ease; }
  .wa-card:hover { transform: translateX(4px); }
  .wa-danger-pulse { animation: wa-pulse 2s infinite; }
  .wa-expand { animation: wa-slide 0.25s ease both; }
  .wa-action { transition: all 0.18s ease; }
  .wa-action:hover { background: rgba(255,255,255,0.9) !important; transform: translateX(2px); }
`;

function injectCSS(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

const generateAlerts = (temperature, humidity, rainfall) => {
  const alerts = [];
  const now = new Date();

  if (temperature > 38) {
    alerts.push({
      id: "heat", type: "danger", icon: "🌡️", title: "Heat Wave Alert",
      message: `Temperature exceeds 38°C. Avoid field work between 11 AM – 4 PM. Ensure adequate water for crops and livestock.`,
      severity: "critical",
      validUntil: new Date(now.getTime() + 24 * 3600000),
      actions: ["Irrigate early morning", "Use mulching", "Provide shade for nursery"]
    });
  } else if (temperature > 35) {
    alerts.push({
      id: "heat_mod", type: "warning", icon: "☀️", title: "High Temperature Advisory",
      message: `Temperature at ${temperature}°C. Consider adjusting irrigation schedule.`,
      severity: "moderate",
      validUntil: new Date(now.getTime() + 12 * 3600000),
      actions: ["Evening irrigation recommended", "Monitor for heat stress"]
    });
  }

  if (rainfall > 50) {
    alerts.push({
      id: "rain_heavy", type: "danger", icon: "🌧️", title: "Heavy Rainfall Warning",
      message: `Heavy rainfall (${rainfall}mm) expected. Risk of waterlogging in low-lying areas.`,
      severity: "critical",
      validUntil: new Date(now.getTime() + 24 * 3600000),
      actions: ["Ensure proper drainage", "Postpone fertilizer application", "Check bund strength"]
    });
  } else if (rainfall > 20) {
    alerts.push({
      id: "rain_mod", type: "info", icon: "🌦️", title: "Rainfall Expected",
      message: `Moderate rainfall (${rainfall}mm) expected. Good for crops — skip irrigation today.`,
      severity: "low",
      validUntil: new Date(now.getTime() + 12 * 3600000),
      actions: ["Skip scheduled irrigation", "Prepare for field operations after rain"]
    });
  }

  if (humidity > 90) {
    alerts.push({
      id: "humidity", type: "warning", icon: "💧", title: "High Humidity Alert",
      message: `Humidity at ${humidity}%. Increased risk of fungal diseases like blast and sheath blight.`,
      severity: "moderate",
      validUntil: new Date(now.getTime() + 24 * 3600000),
      actions: ["Monitor for disease symptoms", "Prepare fungicide spray", "Ensure proper spacing"]
    });
  }

  if (Math.random() > 0.7) {
    alerts.push({
      id: "wind", type: "warning", icon: "💨", title: "Strong Winds Expected",
      message: "Wind speeds of 40–50 km/h expected. Secure structures and support tall crops.",
      severity: "moderate",
      validUntil: new Date(now.getTime() + 6 * 3600000),
      actions: ["Postpone pesticide spraying", "Secure banana plants", "Check coconut trees"]
    });
  }

  if (temperature < 18) {
    alerts.push({
      id: "cold", type: "warning", icon: "❄️", title: "Cold Weather Advisory",
      message: `Temperature dropping to ${temperature}°C. May affect germination and young seedlings.`,
      severity: "moderate",
      validUntil: new Date(now.getTime() + 12 * 3600000),
      actions: ["Cover nursery with polythene", "Irrigate to maintain soil temp", "Delay transplanting"]
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "clear", type: "success", icon: "✅", title: "Favorable Weather",
      message: "Weather conditions are optimal for farming activities. No alerts at this time.",
      severity: "none", validUntil: null,
      actions: ["Proceed with normal farm operations"]
    });
  }

  return alerts;
};

const TYPE_CONFIG = {
  danger:  { accent: "#ef4444", bg: "#fff5f5", border: "#fecaca", badge: "#ef4444", badgeTxt: "#fff" },
  warning: { accent: "#f59e0b", bg: "#fffbeb", border: "#fde68a", badge: "#f59e0b", badgeTxt: "#fff" },
  info:    { accent: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", badge: "#3b82f6", badgeTxt: "#fff" },
  success: { accent: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", badge: "#22c55e", badgeTxt: "#fff" },
};

const SEV_LABEL = { critical: "CRITICAL", moderate: "WARNING", low: "INFO", none: "CLEAR" };

export default function WeatherAlerts({ temperature = 28, humidity = 75, rainfall = 5 }) {
  injectCSS("weather-alerts", CSS);
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const generated = generateAlerts(temperature, humidity, rainfall);
    setAlerts(generated);
    const first = generated.find(a => a.type === "danger");
    if (first) setExpanded(first.id);
  }, [temperature, humidity, rainfall]);

  const dangerCount  = alerts.filter(a => a.type === "danger").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;
  const headerBg     = dangerCount > 0
    ? "linear-gradient(135deg,#7f1d1d,#dc2626)"
    : warningCount > 0
    ? "linear-gradient(135deg,#78350f,#d97706)"
    : "linear-gradient(135deg,#14532d,#16a34a)";
  const statusText   = dangerCount > 0 ? `${dangerCount} Critical Alert${dangerCount > 1 ? "s" : ""}` : warningCount > 0 ? `${warningCount} Warning${warningCount > 1 ? "s" : ""}` : "All Clear";
  const statusIcon   = dangerCount > 0 ? "⚠️" : warningCount > 0 ? "⚡" : "✅";

  const fmt = (d) => d ? d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : "";

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.09)", border: "1px solid #e2e8f0" }}>

      {/* Gradient Header */}
      <div style={{ background: headerBg, padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "'Manrope',sans-serif" }}>Weather Alerts</div>
              <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>Agricultural advisories · Palakkad</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            {statusIcon} {statusText}
          </div>
        </div>

        {/* Mini weather strip */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { icon: "🌡️", val: `${temperature}°C`, label: "Temp" },
            { icon: "💧", val: `${humidity}%`, label: "Humidity" },
            { icon: "🌧️", val: `${rainfall}mm`, label: "Rain" },
          ].map(({ icon, val, label }) => (
            <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "1.1rem" }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{val}</div>
              <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>{label}</div>
            </div>
          ))}
          <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem" }}>🕐</div>
            <div style={{ fontWeight: 700, fontSize: "0.82rem" }}>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Updated</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {alerts.map(alert => {
          const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
          const isOpen = expanded === alert.id;
          const isDanger = alert.type === "danger";

          return (
            <div
              key={alert.id}
              className={`wa-card ${isDanger && isOpen ? "wa-danger-pulse" : ""}`}
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderLeft: `4px solid ${cfg.accent}`,
                borderRadius: 14,
                cursor: "pointer",
                overflow: "hidden",
              }}
              onClick={() => setExpanded(isOpen ? null : alert.id)}
            >
              {/* Card header */}
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{alert.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    {alert.title}
                    <span style={{ background: cfg.badge, color: cfg.badgeTxt, fontSize: "0.65rem", fontWeight: 800, padding: "2px 7px", borderRadius: 99, letterSpacing: "0.06em" }}>
                      {SEV_LABEL[alert.severity]}
                    </span>
                  </div>
                  {!isOpen && <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{alert.message}</div>}
                </div>
                <div style={{ fontSize: "0.85rem", color: cfg.accent, flexShrink: 0, fontWeight: 700 }}>{isOpen ? "▲" : "▼"}</div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div className="wa-expand" style={{ padding: "0 16px 16px" }}>
                  <p style={{ fontSize: "0.87rem", color: "#334155", lineHeight: 1.65, marginBottom: 12 }}>{alert.message}</p>

                  {alert.validUntil && (
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>⏰</span> Valid until {fmt(alert.validUntil)}
                    </div>
                  )}

                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: cfg.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Recommended Actions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {alert.actions.map((action, i) => (
                      <div key={i} className="wa-action" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.7)", borderRadius: 10, fontSize: "0.84rem", color: "#1e293b" }}>
                        <span style={{ color: cfg.accent, fontWeight: 700, flexShrink: 0 }}>→</span>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
