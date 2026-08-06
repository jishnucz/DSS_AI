import { useState, useEffect } from "react";

const CSS = `
@keyframes cpa-slide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes cpa-pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
.cpa-stage-btn { transition: all 0.2s ease !important; }
.cpa-stage-btn:hover { transform:translateY(-2px) !important; box-shadow:0 4px 16px rgba(0,0,0,0.15) !important; }
.cpa-thresh-row { transition: background 0.18s !important; }
.cpa-thresh-row:hover { background: rgba(99,102,241,0.06) !important; }
.cpa-alert-card { animation: cpa-slide 0.35s ease both !important; }
`;

function injectStyle(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// Rice stress thresholds (from palakkad_crop_stress_thresholds.csv)
const RICE_STAGES = [
  {
    id: "germination", label: "Germination", icon: "🌱", days: "Day 1–15",
    season: "Virippu: Jun 15 | Mundakan: Oct 15",
    sensitivity: "Medium",
    critical_var: "Soil Moisture",
    thresholds: {
      temp:   { min: 20, max: 32, lo_stress: 18, hi_stress: 35, unit: "°C" },
      soil:   { min: 0.25, max: 0.40, lo_stress: 0.20, hi_stress: 0.50, unit: "m³/m³" },
    },
    tip: "Maintain field capacity (FC). Avoid water logging. Soil temp > 35°C kills seedlings.",
    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
  },
  {
    id: "vegetative", label: "Vegetative", icon: "🌿", days: "Day 16–50",
    season: "~July to August (Virippu)",
    sensitivity: "Low",
    critical_var: "Temperature",
    thresholds: {
      temp:   { min: 22, max: 33, lo_stress: 18, hi_stress: 36, unit: "°C" },
      soil:   { min: 0.30, max: 0.45, lo_stress: 0.22, hi_stress: 0.55, unit: "m³/m³" },
      rain:   { min: 5, max: 20, lo_stress: 0, hi_stress: 60, unit: "mm/day" },
    },
    tip: "Highest tillering occurs here. Maintain 2–5 cm standing water. Drought at tillering reduces panicle number.",
    color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0",
  },
  {
    id: "flowering", label: "Flowering", icon: "🌸", days: "Day 51–75",
    season: "~Sep to Oct (Virippu)",
    sensitivity: "High",
    critical_var: "Temperature",
    thresholds: {
      temp:   { min: 22, max: 32, lo_stress: 18, hi_stress: 35, unit: "°C" },
      soil:   { min: 0.30, max: 0.45, lo_stress: 0.22, hi_stress: 0.55, unit: "m³/m³" },
      rain:   { min: 5, max: 15, lo_stress: 0, hi_stress: 50, unit: "mm/day" },
    },
    tip: "MOST CRITICAL STAGE. Heat >35°C during pollen release causes sterility. Wind stress during SW monsoon can damage panicles.",
    color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
  },
  {
    id: "grainfilling", label: "Grain Filling", icon: "🌾", days: "Day 76–100",
    season: "~Oct (Virippu)",
    sensitivity: "High",
    critical_var: "Soil Moisture",
    thresholds: {
      soil:   { min: 0.30, max: 0.45, lo_stress: 0.22, hi_stress: 0.55, unit: "m³/m³" },
    },
    tip: "Grain weight is set here. Maintain soil moisture. Drought causes unfilled grains. Alternate wetting-drying (AWD) acceptable.",
    color: "#d97706", bg: "#fffbeb", border: "#fde68a",
  },
  {
    id: "maturity", label: "Maturity", icon: "🏆", days: "Day 101–110",
    season: "~Oct–Nov (Virippu)",
    sensitivity: "Low",
    critical_var: "Rainfall",
    thresholds: {
      rain:   { min: 0, max: 10, lo_stress: 0, hi_stress: 40, unit: "mm/day" },
    },
    tip: "Stop irrigation 10 days before harvest. Heavy rain (>40mm) at this stage = lodging + pre-harvest sprouting risk.",
    color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe",
  },
];

// Palakkad-specific phenological context
const PALAKKAD_CONTEXT = {
  virippu_start: "June 15",
  mundakan_start: "October 15",
  avg_virippu_yield: "3.8 t/ha",
  gap_effect: "Palakkad Gap channels strong SW monsoon winds (Jun–Sep). Flowering stage coincides with peak wind speed.",
  climate: "Semi-arid pocket (600–800mm annual) vs Kerala average (3000mm). Unique thermal regime.",
};

const VAR_LABELS = { temp: "Air Temperature", soil: "Soil Moisture", rain: "Daily Rainfall" };

function ThresholdBar({ variable, thresholds, currentVal }) {
  const range = thresholds.hi_stress - thresholds.lo_stress;
  const optW = ((thresholds.max - thresholds.min) / range) * 100;
  const optL = ((thresholds.min - thresholds.lo_stress) / range) * 100;
  const curP = currentVal != null ? ((currentVal - thresholds.lo_stress) / range) * 100 : null;

  const isStressed = currentVal != null && (currentVal < thresholds.min || currentVal > thresholds.max);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{VAR_LABELS[variable]}</span>
        {currentVal != null && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999,
            background: isStressed ? "#fef2f2" : "#f0fdf4",
            color: isStressed ? "#dc2626" : "#16a34a",
            border: `1px solid ${isStressed ? "#fca5a5" : "#bbf7d0"}`,
          }}>
            {isStressed ? "STRESSED" : "OPTIMAL"}  {currentVal.toFixed(2)} {thresholds.unit}
          </span>
        )}
      </div>
      <div style={{ position: "relative", height: 20, background: "#fee2e2", borderRadius: 4, overflow: "hidden" }}>
        {/* Optimal zone */}
        <div style={{
          position: "absolute", top: 0, height: "100%",
          left: `${optL}%`, width: `${optW}%`,
          background: "linear-gradient(90deg, #86efac, #4ade80, #86efac)",
          borderRadius: 2,
        }} />
        {/* Current value marker */}
        {curP != null && (
          <div style={{
            position: "absolute", top: 0, height: "100%",
            left: `${Math.min(Math.max(curP, 0), 98)}%`,
            width: 3, background: isStressed ? "#dc2626" : "#1d4ed8",
            borderRadius: 2, zIndex: 2,
          }} />
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280", marginTop: 2 }}>
        <span>{thresholds.lo_stress} {thresholds.unit}</span>
        <span style={{ color: "#16a34a", fontWeight: 600 }}>
          Optimal: {thresholds.min}–{thresholds.max}
        </span>
        <span>{thresholds.hi_stress} {thresholds.unit}</span>
      </div>
    </div>
  );
}

function SensitivityDot({ level }) {
  const colors = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 700, color: colors[level] || "#6b7280",
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: colors[level] || "#6b7280",
        boxShadow: `0 0 6px ${colors[level]}88`,
        display: "inline-block",
      }} />
      {level} Sensitivity
    </span>
  );
}

export default function CropPhysiologyAdvisor({ currentWeather }) {
  injectStyle("cpa", CSS);
  const [activeStage, setActiveStage] = useState("flowering");

  const stage = RICE_STAGES.find((s) => s.id === activeStage) || RICE_STAGES[2];

  // Mock current weather if not provided
  const wx = currentWeather || { temp: 31.2, soil: 0.28, rain: 2.1 };
  const currentVals = { temp: wx.temp, soil: wx.soil, rain: wx.rain };

  // Compute alerts
  const alerts = [];
  if (stage.thresholds.temp && wx.temp > stage.thresholds.temp.hi_stress) {
    alerts.push({ type: "danger", msg: `Heat stress! ${wx.temp}°C exceeds critical threshold (${stage.thresholds.temp.hi_stress}°C) during ${stage.label}.` });
  }
  if (stage.thresholds.soil && wx.soil < stage.thresholds.soil.lo_stress) {
    alerts.push({ type: "danger", msg: `Severe drought stress! Soil moisture ${wx.soil.toFixed(2)} below critical limit (${stage.thresholds.soil.lo_stress}).` });
  }
  if (stage.thresholds.temp && wx.temp > stage.thresholds.temp.max && wx.temp <= stage.thresholds.temp.hi_stress) {
    alerts.push({ type: "warning", msg: `Sub-optimal temperature. ${wx.temp}°C exceeds optimal max (${stage.thresholds.temp.max}°C) — monitor closely.` });
  }
  if (stage.thresholds.soil && wx.soil < stage.thresholds.soil.min && wx.soil >= stage.thresholds.soil.lo_stress) {
    alerts.push({ type: "warning", msg: `Soil moisture below optimal (${wx.soil.toFixed(2)} vs min ${stage.thresholds.soil.min}). Consider irrigation.` });
  }
  if (alerts.length === 0) {
    alerts.push({ type: "ok", msg: `Conditions are within optimal range for ${stage.label} stage. Continue current management.` });
  }

  const s = {
    wrap: { fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 900, margin: "0 auto" },
    header: {
      background: "linear-gradient(135deg,#0f172a,#166534,#15803d)",
      borderRadius: 16, padding: "20px 24px", marginBottom: 20, color: "#fff",
    },
    title: { fontSize: 18, fontWeight: 800, marginBottom: 4 },
    sub: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
    stageRow: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    stageBtn: (active, stg) => ({
      padding: "8px 14px", borderRadius: 10, border: `2px solid ${active ? stg.color : "#e5e7eb"}`,
      background: active ? stg.bg : "#fff", color: active ? stg.color : "#6b7280",
      fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 6,
    }),
    card: {
      background: "#fff", borderRadius: 14, padding: "20px 22px",
      border: `1px solid ${stage.border}`, marginBottom: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    },
    alertBox: (type) => ({
      background: type === "danger" ? "#fef2f2" : type === "warning" ? "#fffbeb" : "#f0fdf4",
      border: `1px solid ${type === "danger" ? "#fca5a5" : type === "warning" ? "#fde68a" : "#bbf7d0"}`,
      borderRadius: 10, padding: "12px 16px", marginBottom: 10,
      color: type === "danger" ? "#b91c1c" : type === "warning" ? "#92400e" : "#15803d",
      fontSize: 13, fontWeight: 600, display: "flex", gap: 10, alignItems: "flex-start",
    }),
    tipBox: {
      background: `linear-gradient(135deg,${stage.bg},rgba(255,255,255,0.8))`,
      border: `1px solid ${stage.border}`, borderRadius: 12, padding: "14px 18px",
      fontSize: 13, color: "#374151", lineHeight: 1.7, marginTop: 12,
    },
    ctxRow: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 },
    ctxPill: { background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#374151" },
    gridTwo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  };

  const alertIcons = { danger: "🚨", warning: "⚠️", ok: "✅" };

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>🌾 Palakkad Rice Crop Physiology Advisor</div>
        <div style={s.sub}>
          Stage-specific stress thresholds · Virippu & Mundakan seasons · Based on KAU agronomic standards
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { label: "Virippu starts", val: PALAKKAD_CONTEXT.virippu_start },
            { label: "Mundakan starts", val: PALAKKAD_CONTEXT.mundakan_start },
            { label: "Avg yield", val: PALAKKAD_CONTEXT.avg_virippu_yield },
            { label: "Climate", val: "Semi-arid (Palakkad gap)" },
          ].map((item) => (
            <div key={item.label} style={{ fontSize: 11 }}>
              <div style={{ color: "rgba(255,255,255,0.55)", marginBottom: 1 }}>{item.label}</div>
              <div style={{ color: "#fff", fontWeight: 700 }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage selector */}
      <div style={s.stageRow}>
        {RICE_STAGES.map((stg) => (
          <button
            key={stg.id}
            className="cpa-stage-btn"
            style={s.stageBtn(activeStage === stg.id, stg)}
            onClick={() => setActiveStage(stg.id)}
          >
            <span>{stg.icon}</span>
            <span>{stg.label}</span>
            <span style={{ fontSize: 10, opacity: 0.7 }}>{stg.days}</span>
          </button>
        ))}
      </div>

      {/* Active stage detail */}
      <div style={{ animation: "cpa-slide 0.3s ease both" }} key={activeStage}>
        {/* Stage header card */}
        <div style={{ ...s.card, borderLeft: `4px solid ${stage.color}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 36 }}>{stage.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b" }}>
                {stage.label} Stage — {stage.days}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{stage.season}</div>
            </div>
            <SensitivityDot level={stage.sensitivity} />
          </div>

          {/* Palakkad-specific context */}
          <div style={s.ctxRow}>
            <div style={s.ctxPill}>Critical: <strong>{stage.critical_var}</strong></div>
            <div style={s.ctxPill}>GDD Base: <strong>10°C (rice)</strong></div>
            {activeStage === "flowering" && (
              <div style={{ ...s.ctxPill, background: "#fef2f2", color: "#dc2626", fontWeight: 700 }}>
                ⚠️ Palakkad Gap wind risk during SW Monsoon
              </div>
            )}
          </div>

          {/* Thresholds visualization */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
              Stress Thresholds
            </div>
            {Object.entries(stage.thresholds).map(([varKey, thresh]) => (
              <ThresholdBar key={varKey} variable={varKey} thresholds={thresh}
                currentVal={currentVals[varKey]} />
            ))}
          </div>

          {/* Agronomic tip */}
          <div style={s.tipBox}>
            <span style={{ fontWeight: 700, color: stage.color }}>Agronomic Tip: </span>
            {stage.tip}
          </div>
        </div>

        {/* Alerts based on current weather */}
        <div style={s.card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>
            Current Conditions Assessment
          </div>
          {alerts.map((alert, i) => (
            <div key={i} className="cpa-alert-card" style={s.alertBox(alert.type)}>
              <span>{alertIcons[alert.type]}</span>
              <span>{alert.msg}</span>
            </div>
          ))}
        </div>

        {/* Season-level summary grid */}
        <div style={s.gridTwo}>
          <div style={s.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>
              📅 Virippu Season Timeline
            </div>
            {RICE_STAGES.map((stg) => (
              <div key={stg.id} style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12,
                background: stg.id === activeStage ? `${stg.bg}` : "transparent",
                padding: "4px 8px", borderRadius: 6,
              }}>
                <span>{stg.icon}</span>
                <div style={{ flex: 1, color: "#374151" }}>{stg.label}</div>
                <span style={{ color: "#6b7280" }}>{stg.days}</span>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: stg.color,
                }} />
              </div>
            ))}
          </div>

          <div style={s.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>
              🌡️ Palakkad Climate Context
            </div>
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Palakkad Gap Effect: </span>
                {PALAKKAD_CONTEXT.gap_effect}
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>Climate: </span>
                {PALAKKAD_CONTEXT.climate}
              </div>
              <div style={{ marginTop: 10, background: "#f1f5f9", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
                  Ensemble Model Integration
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  Phenological stage is fed into the 6-model ensemble (LightGBM 86.4%, BiLSTM 84.9%, stacking 86.4%).
                  GDD and crop stress flags add physiological context to weather-based prediction.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
