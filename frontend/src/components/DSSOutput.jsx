import { useState } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
  @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
  @keyframes countUp      { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes barGrow      { from{width:0%} to{width:var(--w)} }
  @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:0.6} }
  @keyframes shimmer      { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
  @keyframes borderPulse  { 0%,100%{border-color:rgba(34,197,94,0.2)} 50%{border-color:rgba(34,197,94,0.5)} }
  @keyframes slideRight   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes glow         { 0%,100%{box-shadow:0 0 15px rgba(34,197,94,0.1)} 50%{box-shadow:0 0 25px rgba(34,197,94,0.2)} }

  .dss-card { transition: all 0.25s ease !important; position: relative; overflow: hidden; }
  .dss-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important; }

  .dss-stage-item { transition: all 0.25s ease !important; }
  .dss-stage-item:hover { background: rgba(34,197,94,0.05) !important; border-color: rgba(34,197,94,0.25) !important; }

  .dss-alert-item { transition: all 0.25s ease !important; }
  .dss-alert-item:hover { transform: translateX(4px) !important; background: rgba(34,197,94,0.03) !important; }

  .dss-tab { transition: all 0.25s ease !important; position: relative; }
  .dss-tab::before { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background: #22c55e; transition: all 0.3s; transform: translateX(-50%); }
  .dss-tab:hover { background: rgba(34,197,94,0.08) !important; color: #4ade80 !important; }
  .dss-tab:hover::before { width: 50%; }

  .dss-print { transition: all 0.25s ease !important; }
  .dss-print:hover { background: rgba(34,197,94,0.12) !important; border-color: rgba(34,197,94,0.4) !important; color: #4ade80 !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// ─── Design Tokens ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  good:    { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)",  icon: "✅", label: "OPTIMAL" },
  warning: { color: "#FFB74D", bg: "rgba(255,183,77,0.1)",  border: "rgba(255,183,77,0.25)",  icon: "⚠️", label: "ATTENTION" },
  alert:   { color: "#FF6B6B", bg: "rgba(255,107,107,0.1)", border: "rgba(255,107,107,0.25)", icon: "🔴", label: "CRITICAL" },
  info:    { color: "#60A5FA", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)",  icon: "ℹ️", label: "INFO" },
};

const TABS = ["Overview", "Growth Stage", "Recommendations", "Alerts"];

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, unit, status = "info", delay = 0 }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.info;
  return (
    <div className="dss-card" style={{
      ...s.metricCard,
      borderColor: cfg.border,
      background: `linear-gradient(135deg, ${cfg.bg}, rgba(240,253,244,0.95))`,
      animation: `fadeSlideUp 0.4s ease-out ${delay}s both`,
    }}>
      <div style={{ fontSize: "26px", marginBottom: "12px" }}>{icon}</div>
      <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "'Inter',sans-serif", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: "700", color: cfg.color, fontFamily: "'Poppins',sans-serif", lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: "4px", fontWeight: "500" }}>{unit}</span>}
      </div>
      <div style={{ marginTop: "12px", padding: "4px 10px", borderRadius: "100px", display: "inline-block", background: cfg.bg, border: `1px solid ${cfg.border}` }}>
        <span style={{ fontSize: "0.7rem", color: cfg.color, fontFamily: "'Inter',sans-serif", fontWeight: "600" }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max = 100, color = "#22c55e", unit = "%" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: "500", fontFamily: "'Inter',sans-serif" }}>{label}</span>
        <span style={{ fontSize: "0.85rem", color, fontFamily: "'Inter',sans-serif", fontWeight: "600" }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ height: "6px", borderRadius: "100px", background: "rgba(34,197,94,0.15)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "100px",
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          animation: "barGrow 0.8s ease-out forwards",
          "--w": `${pct}%`, width: 0,
        }} />
      </div>
    </div>
  );
}

function AlertItem({ type = "warning", title, description, delay = 0 }) {
  const cfg = STATUS_CONFIG[type] || STATUS_CONFIG.warning;
  return (
    <div className="dss-alert-item" style={{
      display: "flex", gap: "14px", alignItems: "flex-start",
      padding: "14px 16px", borderRadius: "12px",
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderLeft: `4px solid ${cfg.color}`,
      animation: `slideRight 0.35s ease-out ${delay}s both`,
      backdropFilter: "blur(8px)",
    }}>
      <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{cfg.icon}</span>
      <div>
        <div style={{ fontSize: "0.85rem", fontWeight: "700", color: cfg.color, marginBottom: "4px", fontFamily: "'Inter',sans-serif", letterSpacing: "0.5px" }}>
          {title}
        </div>
        <div style={{ fontSize: "0.88rem", color: "#374151", lineHeight: "1.65", fontFamily: "'Inter',sans-serif" }}>{description}</div>
      </div>
    </div>
  );
}

function StageTimeline({ stages, currentDay }) {
  return (
    <div style={s.timeline}>
      {stages.map((stage, i) => {
        const isActive = currentDay >= stage.startDay && currentDay <= stage.endDay;
        const isPast = currentDay > stage.endDay;
        return (
          <div key={i} className="dss-stage-item" style={{
            ...s.timelineItem,
            ...(isActive ? s.timelineItemActive : {}),
            ...(isPast ? s.timelineItemPast : {}),
          }}>
            <div style={s.timelineLeft}>
              <div style={{
                ...s.timelineDot,
                background: isActive ? "#22c55e" : isPast ? "#4ADE80" : "rgba(34,197,94,0.2)",
                boxShadow: isActive ? "0 0 0 4px rgba(34,197,94,0.2), 0 0 15px rgba(34,197,94,0.4)" : "none",
                animation: isActive ? "pulse 2s infinite" : "none",
              }} />
              {i < stages.length - 1 && (
                <div style={{
                  ...s.timelineConnector,
                  background: isPast ? "#4ADE80" : "rgba(34,197,94,0.15)",
                }} />
              )}
            </div>
            <div style={s.timelineContent}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.92rem", fontWeight: "700", color: isActive ? "#16a34a" : isPast ? "#6B7280" : "#4B5563", fontFamily: "'Inter',sans-serif" }}>
                  {stage.name}
                  {isActive && <span style={{ marginLeft: "8px", fontSize: "0.65rem", color: "#22c55e", fontFamily: "'Inter',sans-serif", letterSpacing: "1px" }}>● CURRENT</span>}
                </span>
                <span style={{ fontSize: "0.75rem", color: isActive ? "#4ade80" : "#4B5563", fontFamily: "'Inter',sans-serif" }}>
                  Day {stage.startDay}–{stage.endDay}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: isActive ? "#374151" : "#6B7280", lineHeight: "1.55", fontFamily: "'Inter',sans-serif" }}>
                {stage.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mock data helpers (replace with real API data) ──────────────────────────
function buildStages(crop) {
  const map = {
    Rice:      [
      { name: "Germination",       startDay: 1,   endDay: 7,   description: "Seeds absorb water and sprout. Maintain standing water at 2–3 cm." },
      { name: "Seedling",          startDay: 8,   endDay: 20,  description: "Young plants establish. Apply basal dose of nitrogen fertilizer." },
      { name: "Tillering",         startDay: 21,  endDay: 55,  description: "Side shoots develop. Critical period for weed management." },
      { name: "Panicle Initiation",startDay: 56,  endDay: 80,  description: "Reproductive phase begins. Maintain water level and top-dress nitrogen." },
      { name: "Heading / Flowering",startDay: 81, endDay: 100, description: "Panicles emerge. Avoid water stress. Monitor for blast disease." },
      { name: "Grain Filling",     startDay: 101, endDay: 125, description: "Grains fill and harden. Drain field gradually." },
      { name: "Maturity / Harvest",startDay: 126, endDay: 145, description: "80% of grains golden-yellow. Harvest to avoid shattering losses." },
    ],
    Wheat: [
      { name: "Germination",    startDay: 1,  endDay: 10,  description: "Seeds germinate in cool, moist soil." },
      { name: "Seedling",       startDay: 11, endDay: 25,  description: "First true leaves appear. Establish weed-free seedbed." },
      { name: "Tillering",      startDay: 26, endDay: 55,  description: "Secondary shoots form. Apply nitrogen to boost tiller count." },
      { name: "Jointing",       startDay: 56, endDay: 80,  description: "Stem elongation begins. Monitor for aphids and rust." },
      { name: "Heading",        startDay: 81, endDay: 100, description: "Ear emerges. Critical irrigation window." },
      { name: "Grain Filling",  startDay: 101,endDay: 125, description: "Starch accumulates in grain. Reduce irrigation." },
      { name: "Maturity",       startDay: 126,endDay: 140, description: "Leaves dry, grains hard. Harvest promptly." },
    ],
    Maize: [
      { name: "Emergence",   startDay: 1,  endDay: 10, description: "Seedlings emerge, establish uniform stand." },
      { name: "V-Stage",     startDay: 11, endDay: 40, description: "Leaf collar formation. Side-dress nitrogen at V6." },
      { name: "Tasseling",   startDay: 41, endDay: 65, description: "Tassel fully visible. High water demand begins." },
      { name: "Silking",     startDay: 66, endDay: 80, description: "Silks emerge. Pollination window — avoid any stress." },
      { name: "Grain Fill",  startDay: 81, endDay: 115,description: "Kernels develop from blister to dough stage." },
      { name: "Maturity",    startDay: 116,endDay: 130,description: "Black layer forms. Dry down before harvest." },
    ],
  };
  return map[crop] || map.Rice;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DSSOutput({ result }) {
  inject("agri-dss-out", CSS);
  const [activeTab, setActiveTab] = useState(0);

  if (!result) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif" }}>
        <div style={s.container}>
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>📊</div>
            <p style={s.emptyTitle}>No Analysis Yet</p>
            <p style={s.emptyText}>Configure parameters above and run the DSS analysis to see results here.</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    crop = "Rice",
    location = "Regional",
    days_since_sowing = 0,
    seasonal_progress = 0,
    growth_stage = "Tillering",
    water_stress = 0,
    nutrient_status = {},
    pest_risk = "Low",
    disease_risk = "Low",
    weather_summary = "",
    farmer_advisory = "",
    temperature = "28°C",
    rainfall = "0mm",
    wind_speed = "5km/h",
    soil_moisture = "65%",
    recommendations = [],
    alerts = [],
    yield_forecast = null,
    irrigation_advice = "",
    fertilizer_advice = "",
    // New enhanced fields
    stress = null,
    ai_prediction = null,
    crop_risk = "Low",
    humidity = "70%",
    temp_max = "",
    temp_min = "",
    uv_index = 6,
    growth_stage_progress = 0,
    water_need = "Medium",
  } = result.current || result;

  // Extract new sections from enhanced DSS
  const stressAnalysis = result.stress_analysis || stress || null;
  const aiModel = result.ai_model || ai_prediction || null;
  const irrigationData = result.irrigation || null;
  const fertilizerRecs = result.fertilizer_recommendations || [];
  const pestDiseaseRisks = result.pest_disease_risks || [];
  const advisoriesList = result.advisories || [];
  const forecast7day = result.forecast_7day || result.forecast || [];
  const regionData = result.region || null;
  
  // Get nutrient_status from TOP level (not current) - includes actual soil moisture
  const actualNutrientStatus = result.nutrient_status || nutrient_status || {};
  const actualSoilMoisture = actualNutrientStatus.moisture ?? parseInt(soil_moisture) ?? 65;

  const stages = buildStages(crop);
  const pestLevel = pest_risk === "High" || (pestDiseaseRisks.length > 0 && pestDiseaseRisks[0]?.severity === "High") ? "alert" : pest_risk === "Medium" ? "warning" : "good";
  const diseaseLevel = disease_risk === "High" ? "alert" : disease_risk === "Medium" ? "warning" : "good";
  const waterLevel = (stressAnalysis?.moisture || water_stress) > 60 ? "alert" : (stressAnalysis?.moisture || water_stress) > 30 ? "warning" : "good";
  const overallRisk = crop_risk || (stressAnalysis?.level) || "Low";
  const riskLevel = overallRisk === "Critical" ? "alert" : overallRisk === "High" ? "alert" : overallRisk === "Moderate" ? "warning" : "good";

  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      <div style={s.container}>
        <div style={s.glowTR} />
        <div style={s.glowBL} />

        {/* ── Header ── */}
        <div style={s.header}>
          <div>
            <span style={s.badge}>DSS REPORT</span>
            <h2 style={s.title}>Analysis Results</h2>
            <p style={s.sub}>
              <span style={s.subChip}>{crop}</span>
              <span style={s.subChip}>📍 {location}</span>
              <span style={s.subChip}>🗓 Day {days_since_sowing}</span>
              <span style={s.subChip}>🌱 {growth_stage}</span>
            </p>
          </div>
          <button className="dss-print" onClick={() => window.print()} style={s.printBtn}>
            ⬇ Export
          </button>
        </div>

        {/* ── Metric Cards ── */}
        <div style={s.metricsGrid}>
          <MetricCard icon="📅" label="Days Since Sowing" value={days_since_sowing} unit="days" status="info" delay={0} />
          <MetricCard icon="🌱" label="Growth Stage" value={growth_stage} status="info" delay={0.05} />
          <MetricCard icon="💧" label="Water Stress Index" value={`${water_stress}%`} status={waterLevel} delay={0.1} />
          <MetricCard icon="🐛" label="Pest Risk" value={pest_risk} status={pestLevel} delay={0.15} />
          <MetricCard icon="🦠" label="Disease Risk" value={disease_risk} status={diseaseLevel} delay={0.2} />
          {yield_forecast && (
            <MetricCard icon="📦" label="Yield Forecast" value={yield_forecast} unit="t/ha" status="good" delay={0.25} />
          )}
        </div>

        {/* ── Tab Navigation ── */}
        <div style={s.tabBar}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className="dss-tab"
              onClick={() => setActiveTab(i)}
              style={{ ...s.tab, ...(activeTab === i ? s.tabActive : {}) }}
            >
              {["📊", "🌿", "✅", "🔔"][i]}
              <span style={{ marginLeft: "6px" }}>{tab}</span>
              {i === 3 && alerts.length > 0 && (
                <span style={s.tabBadge}>{alerts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={s.tabContent}>

          {/* Overview */}
          {activeTab === 0 && (
            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              {/* Farmer Advisory Banner */}
              {farmer_advisory && (
                <div style={{
                  padding: "20px 22px",
                  background: "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(74,222,128,0.08) 100%)",
                  border: "1.5px solid rgba(34,197,94,0.3)",
                  borderRadius: "14px",
                  marginBottom: "24px",
                  borderLeft: "4px solid #22c55e",
                  backdropFilter: "blur(8px)"
                }}>
                  <div style={{ fontSize: "0.72rem", color: "#4ade80", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "10px", textTransform: "uppercase", fontWeight: "700" }}>
                    🌾 AGRI ADVISORY - TODAY
                  </div>
                  <p style={{ margin: 0, fontSize: "0.95rem", color: "#374151", lineHeight: "1.75", fontWeight: "500", fontFamily: "'Inter',sans-serif" }}>
                    {farmer_advisory.split(" | ").map((adv, i) => (
                      <span key={i}>
                        {adv}
                        {i < farmer_advisory.split(" | ").length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {weather_summary && (
                <div style={s.weatherBanner}>
                  <span style={s.weatherIcon}>🌤</span>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "6px" }}>WEATHER SUMMARY</div>
                    <p style={{ margin: 0, fontSize: "0.92rem", color: "#374151", lineHeight: "1.65", fontFamily: "'Inter',sans-serif" }}>{weather_summary}</p>
                  </div>
                </div>
              )}

              {/* AI Model Prediction - Ensemble */}
              {aiModel && (
                <div style={{ marginBottom: "24px" }}>
                  {/* Ensemble Header */}
                  <div style={{
                    padding: "20px 24px", borderRadius: "16px 16px 0 0",
                    background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.1) 100%)",
                    border: "1.5px solid rgba(139,92,246,0.3)", borderBottom: "none"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.7rem", color: "#A78BFA", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "700" }}>
                          🧠 AI ENSEMBLE PREDICTION
                        </span>
                        {aiModel.calibration?.calibration_applied && (
                          <span style={{
                            padding: "3px 8px", borderRadius: "12px", fontSize: "0.55rem",
                            background: "rgba(251,191,36,0.3)", color: "#FCD34D", fontWeight: "600",
                            border: "1px solid rgba(251,191,36,0.4)"
                          }}>
                            ⚡ STRESS-VALIDATED
                          </span>
                        )}
                      </div>
                      {aiModel.ensemble && (
                        <div style={{
                          padding: "4px 12px", borderRadius: "20px",
                          background: aiModel.ensemble.reliability === "High" ? "rgba(34,197,94,0.2)" : aiModel.ensemble.reliability === "Medium" ? "rgba(251,191,36,0.2)" : "rgba(239,68,68,0.2)",
                          border: `1px solid ${aiModel.ensemble.reliability === "High" ? "rgba(34,197,94,0.4)" : aiModel.ensemble.reliability === "Medium" ? "rgba(251,191,36,0.4)" : "rgba(239,68,68,0.4)"}`,
                          fontSize: "0.65rem", fontWeight: "700",
                          color: aiModel.ensemble.reliability === "High" ? "#4ADE80" : aiModel.ensemble.reliability === "Medium" ? "#FBBF24" : "#EF4444"
                        }}>
                          {aiModel.ensemble.reliability} Reliability ({(aiModel.ensemble.agreement * 100).toFixed(0)}% agree)
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      <div style={{ fontSize: "2.2rem", fontWeight: "800", color: aiModel.prediction === "Normal" ? "#4ADE80" : aiModel.prediction === "Low Stress" ? "#FBBF24" : "#EF4444" }}>
                        {aiModel.prediction || "Analyzing..."}
                      </div>
                      <div style={{ fontSize: "1rem", color: "#475569" }}>
                        <span style={{ fontWeight: "700", color: "#A78BFA", fontSize: "1.4rem" }}>{aiModel.confidence ? `${(aiModel.confidence * 100).toFixed(1)}%` : "N/A"}</span>
                        <span style={{ fontSize: "0.75rem", display: "block", color: "#64748b" }}>confidence</span>
                      </div>
                    </div>
                    {aiModel.probabilities && (
                      <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
                        {Object.entries(aiModel.probabilities).map(([label, prob]) => (
                          <div key={label} style={{
                            flex: 1, padding: "10px", borderRadius: "10px", textAlign: "center",
                            background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)"
                          }}>
                            <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "4px" }}>{label}</div>
                            <div style={{ fontSize: "1rem", fontWeight: "700", color: label === "Normal" ? "#4ADE80" : label === "Low Stress" ? "#FBBF24" : "#EF4444" }}>
                              {(prob * 100).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Individual Models Grid */}
                  {aiModel.individual_models && Object.keys(aiModel.individual_models).length > 0 && (
                    <div style={{
                      padding: "16px 20px", borderRadius: "0 0 16px 16px",
                      background: "rgba(139,92,246,0.06)", 
                      border: "1.5px solid rgba(139,92,246,0.2)", borderTop: "1px solid rgba(139,92,246,0.1)"
                    }}>
                      <div style={{ fontSize: "0.65rem", color: "#6B7280", fontFamily: "'Inter',sans-serif", letterSpacing: "1px", marginBottom: "4px", textTransform: "uppercase" }}>
                        INDIVIDUAL MODEL PREDICTIONS ({aiModel.ensemble?.models_used || Object.keys(aiModel.individual_models).length} models)
                      </div>
                      {/* Calibration note */}
                      {aiModel.calibration && (
                        <div style={{ 
                          fontSize: "0.6rem", color: "#64748b", marginBottom: "10px", fontStyle: "italic",
                          padding: "6px 10px", background: "rgba(34,197,94,0.1)", borderRadius: "6px",
                          borderLeft: "2px solid rgba(34,197,94,0.5)"
                        }}>
                          🤖 AI models drive prediction ({aiModel.calibration.ai_weight}). 
                          {aiModel.calibration.calibration_applied 
                            ? ` Adjusted by stress validation (${aiModel.calibration.stress_overall}% stress detected).`
                            : ` Confirmed by stress analysis (${aiModel.calibration.stress_overall}% stress).`
                          }
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                        {Object.entries(aiModel.individual_models).map(([modelName, result]) => {
                          const iconMap = { "LSTM": "🔮", "RandomForest": "🌲", "GradientBoosting": "📈", "MLP": "🧮", "RuleBased": "📋" };
                          return (
                            <div key={modelName} style={{
                              padding: "12px", borderRadius: "10px",
                              background: "rgba(139,92,246,0.06)",
                              border: result.prediction === aiModel.prediction ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.08)"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                <span style={{ fontSize: "0.9rem" }}>{iconMap[modelName] || "🤖"}</span>
                                <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: "600" }}>{modelName}</span>
                                {result.prediction === aiModel.prediction && (
                                  <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: "#4ADE80" }}>✓</span>
                                )}
                              </div>
                              <div style={{ 
                                fontSize: "0.85rem", fontWeight: "700", 
                                color: result.prediction === "Normal" ? "#4ADE80" : result.prediction === "Low Stress" ? "#FBBF24" : "#EF4444"
                              }}>
                                {result.prediction}
                              </div>
                              <div style={{ fontSize: "0.65rem", color: "#6B7280" }}>
                                {(result.confidence * 100).toFixed(0)}% conf
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stress Breakdown - Now separate */}
              {stressAnalysis && (
                <div style={{
                  padding: "24px", borderRadius: "16px", marginBottom: "24px",
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)"
                }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                    📊 STRESS BREAKDOWN
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <ProgressBar label="Temperature Stress" value={stressAnalysis.temperature ?? 0} color="#EF4444" />
                      <ProgressBar label="Moisture Stress" value={stressAnalysis.moisture ?? 0} color="#3B82F6" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <ProgressBar label="Rainfall Stress" value={stressAnalysis.rainfall ?? 0} color="#06B6D4" />
                      <ProgressBar label="Wind Stress" value={stressAnalysis.wind ?? 0} color="#8B5CF6" />
                    </div>
                  </div>
                  <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Overall Stress Level</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "800", color: (stressAnalysis.overall ?? 0) > 50 ? "#EF4444" : (stressAnalysis.overall ?? 0) > 25 ? "#FBBF24" : "#4ADE80" }}>
                      {stressAnalysis.overall ?? 0}%
                    </span>
                  </div>
                </div>
              )}

              {/* Weather Physics Analysis (NWP-style) */}
              {aiModel?.weather_analysis && Object.keys(aiModel.weather_analysis).length > 0 && (
                <div style={{
                  padding: "20px", borderRadius: "16px", marginBottom: "24px",
                  background: "linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.08) 100%)",
                  border: "1px solid rgba(6,182,212,0.25)"
                }}>
                  <div style={{ fontSize: "0.7rem", color: "#06B6D4", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "14px", textTransform: "uppercase", fontWeight: "700" }}>
                    🌡️ WEATHER PHYSICS ANALYSIS (NWP-INSPIRED)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
                    <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", textAlign: "center" }}>
                      <div style={{ fontSize: "0.6rem", color: "#64748b", marginBottom: "4px" }}>Weather Severity</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "800", color: (aiModel.weather_analysis.weather_severity_index ?? 0) > 50 ? "#EF4444" : (aiModel.weather_analysis.weather_severity_index ?? 0) > 25 ? "#FBBF24" : "#06B6D4" }}>
                        {aiModel.weather_analysis.weather_severity_index ?? 0}
                      </div>
                      <div style={{ fontSize: "0.55rem", color: "#6B7280" }}>WSI Index</div>
                    </div>
                    <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", textAlign: "center" }}>
                      <div style={{ fontSize: "0.6rem", color: "#64748b", marginBottom: "4px" }}>Evapotranspiration</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#60A5FA" }}>
                        {aiModel.weather_analysis.evapotranspiration_mm ?? 0}
                      </div>
                      <div style={{ fontSize: "0.55rem", color: "#6B7280" }}>ET₀ mm/day</div>
                    </div>
                    <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", textAlign: "center" }}>
                      <div style={{ fontSize: "0.6rem", color: "#64748b", marginBottom: "4px" }}>Growing Degree</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#4ADE80" }}>
                        {aiModel.weather_analysis.daily_gdd ?? 0}
                      </div>
                      <div style={{ fontSize: "0.55rem", color: "#6B7280" }}>GDD/day</div>
                    </div>
                    {aiModel.weather_analysis.et_stress !== undefined && (
                      <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", textAlign: "center" }}>
                        <div style={{ fontSize: "0.6rem", color: "#64748b", marginBottom: "4px" }}>ET Stress</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#FBBF24" }}>
                          {aiModel.weather_analysis.et_stress ?? 0}
                        </div>
                        <div style={{ fontSize: "0.55rem", color: "#6B7280" }}>Index</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 7-Day Forecast */}
              {forecast7day && forecast7day.length > 0 && (
                <div style={{
                  padding: "20px", borderRadius: "16px",
                  background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)",
                  marginBottom: "24px"
                }}>
                  <div style={{ fontSize: "0.7rem", color: "#60A5FA", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "16px", textTransform: "uppercase", fontWeight: "700" }}>
                    📅 7-DAY WEATHER FORECAST
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
                    {forecast7day.slice(0, 7).map((day, i) => (
                      <div key={i} style={{
                        padding: "14px 8px", borderRadius: "12px", textAlign: "center",
                        background: i === 0 ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.95)",
                        border: i === 0 ? "1px solid rgba(96,165,250,0.3)" : "1px solid rgba(34,197,94,0.15)"
                      }}>
                        <div style={{ fontSize: "0.65rem", color: "#6B7280", marginBottom: "6px" }}>
                          {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}
                        </div>
                        <div style={{ fontSize: "1.3rem", marginBottom: "6px" }}>
                          {day.condition?.toLowerCase().includes("rain") ? "🌧" : day.condition?.toLowerCase().includes("cloud") ? "☁" : "☀"}
                        </div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#374151" }}>
                          {day.temp_max?.toFixed(0) ?? "--"}°
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>
                          {day.temp_min?.toFixed(0) ?? "--"}°
                        </div>
                        {day.precipitation_mm > 0 && (
                          <div style={{ fontSize: "0.65rem", color: "#60A5FA", marginTop: "4px" }}>
                            💧 {day.precipitation_mm?.toFixed(1)}mm
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={s.nutrientGrid}>
                <div style={s.nutrientCard}>
                  <p style={s.nutrientTitle}>🧪 Nutrient Status</p>
                  <ProgressBar label="Nitrogen (N)" value={actualNutrientStatus.nitrogen ?? 72} color="#4ADE80" />
                  <ProgressBar label="Phosphorus (P)" value={actualNutrientStatus.phosphorus ?? 58} color="#60A5FA" />
                  <ProgressBar label="Potassium (K)" value={actualNutrientStatus.potassium ?? 85} color="#FFB74D" />
                  <ProgressBar label="Soil Moisture" value={actualSoilMoisture} color="#A78BFA" />
                </div>

                <div style={s.adviceCard}>
                  <p style={s.nutrientTitle}>💧 Irrigation Advice</p>
                  <p style={s.adviceText}>{irrigation_advice || "Maintain adequate soil moisture. Monitor rainfall and adjust irrigation scheduling based on evapotranspiration rates. Drip irrigation preferred for water efficiency."}</p>
                  <div style={s.adviseDivider} />
                  <p style={s.nutrientTitle}>🌿 Fertilizer Advice</p>
                  <p style={s.adviceText}>{fertilizer_advice || "Apply split doses of nitrogen fertilizer at key growth stages. Conduct soil testing before top-dressing. Avoid over-application to reduce runoff risk."}</p>
                </div>
              </div>
            </div>
          )}

          {/* Growth Stage */}
          {activeTab === 1 && (
            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              <div style={s.stageHeader}>
                <div style={s.stageCurrent}>
                  <div style={{ fontSize: "0.7rem", color: "#4ade80", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "8px" }}>
                    CURRENT STAGE
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#16a34a", fontFamily: "'Inter',sans-serif" }}>{growth_stage}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "8px", fontFamily: "'Inter',sans-serif" }}>
                    Day {days_since_sowing} of growing season
                  </div>
                </div>
                <div style={s.stageProgress}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "12px" }}>
                    SEASON PROGRESS
                  </div>
                  {(() => {
                    const totalDays = stages[stages.length - 1]?.endDay || 145;
                    const pct = Math.min(100, Math.round((days_since_sowing / totalDays) * 100));
                    return (
                      <>
                        <div style={{ height: "12px", borderRadius: "6px", background: "rgba(34,197,94,0.1)", overflow: "hidden", marginBottom: "10px" }}>
                          <div style={{
                            height: "100%", borderRadius: "6px",
                            background: "linear-gradient(90deg,#22c55e,#4ade80)",
                            animation: "barGrow 1.2s cubic-bezier(0.25,1,0.5,1) forwards",
                            "--w": `${pct}%`, width: 0,
                            boxShadow: "0 0 15px rgba(34,197,94,0.4)",
                          }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.75rem", color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>Sowing</span>
                          <span style={{ fontSize: "0.82rem", color: "#4ade80", fontFamily: "'Inter',sans-serif", fontWeight: "700" }}>{pct}% complete</span>
                          <span style={{ fontSize: "0.75rem", color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>Harvest</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              <StageTimeline stages={stages} currentDay={days_since_sowing} />
            </div>
          )}

          {/* Recommendations */}
          {activeTab === 2 && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "12px" }}>
              {(recommendations.length > 0 ? recommendations : [
                "Monitor soil moisture daily and irrigate if levels drop below 60% field capacity.",
                "Apply top-dress nitrogen fertilizer at the recommended rate for current growth stage.",
                "Scout fields twice weekly for pest and disease incidence. Maintain scouting records.",
                "Ensure proper drainage channels are clear ahead of expected rainfall.",
                "Maintain a field diary and compare current observations with historical data.",
              ]).map((rec, i) => (
                <div key={i} className="dss-alert-item" style={{
                  display: "flex", gap: "16px", alignItems: "flex-start",
                  padding: "16px 20px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.2)",
                  borderLeft: "4px solid rgba(34,197,94,0.6)",
                  animation: `slideRight 0.3s ease-out ${i * 0.06}s both`,
                }}>
                  <span style={{
                    minWidth: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                    background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontFamily: "'Inter',sans-serif", color: "#16a34a", fontWeight: "700",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151", lineHeight: "1.7", paddingTop: "5px", fontFamily: "'Inter',sans-serif" }}>{rec}</p>
                </div>
              ))}
            </div>
          )}

          {/* Alerts */}
          {activeTab === 3 && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "12px" }}>
              {(alerts.length > 0 ? alerts : []).length === 0 ? (
                <div style={s.noAlerts}>
                  <div style={{ fontSize: "44px", marginBottom: "14px" }}>✅</div>
                  <p style={{ margin: "0 0 8px", color: "#4ADE80", fontSize: "1.05rem", fontWeight: "700", fontFamily: "'Inter',sans-serif" }}>No Active Alerts</p>
                  <p style={{ margin: 0, color: "#6B7280", fontSize: "0.85rem", fontFamily: "'Inter',sans-serif" }}>
                    All monitored parameters are within acceptable ranges.
                  </p>
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <AlertItem
                    key={i}
                    type={alert.severity || "warning"}
                    title={alert.title || "Alert"}
                    description={alert.description || alert}
                    delay={i * 0.07}
                  />
                ))
              )}

              {/* Always show risk summary */}
              <div style={s.riskGrid}>
                {[
                  { label: "Pest Risk",    value: pest_risk,    icon: "🐛", level: pestLevel },
                  { label: "Disease Risk", value: disease_risk, icon: "🦠", level: diseaseLevel },
                  { label: "Water Stress", value: `${water_stress}%`, icon: "💧", level: waterLevel },
                ].map(({ label, value, icon, level }) => {
                  const cfg = STATUS_CONFIG[level];
                  return (
                    <div key={label} style={{ ...s.riskCard, borderColor: cfg.border, background: cfg.bg }}>
                      <div style={{ fontSize: "24px", marginBottom: "10px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{icon}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "6px" }}>{label.toUpperCase()}</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: "800", color: cfg.color, fontFamily: "'Inter',sans-serif" }}>{value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Pest/Disease Risks */}
              {pestDiseaseRisks && pestDiseaseRisks.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                    🔬 IDENTIFIED PEST & DISEASE THREATS
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {pestDiseaseRisks.map((risk, i) => (
                      <div key={i} style={{
                        padding: "14px 18px", borderRadius: "12px",
                        background: risk.severity === "high" ? "rgba(239,68,68,0.1)" : risk.severity === "medium" ? "rgba(251,191,36,0.1)" : "rgba(34,197,94,0.1)",
                        border: `1px solid ${risk.severity === "high" ? "rgba(239,68,68,0.3)" : risk.severity === "medium" ? "rgba(251,191,36,0.3)" : "rgba(34,197,94,0.3)"}`,
                        display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>{risk.name || risk.pest || risk.disease}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{risk.conditions || risk.description || "Monitor closely"}</div>
                        </div>
                        <span style={{
                          padding: "4px 12px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase",
                          background: risk.severity === "high" ? "rgba(239,68,68,0.2)" : risk.severity === "medium" ? "rgba(251,191,36,0.2)" : "rgba(34,197,94,0.2)",
                          color: risk.severity === "high" ? "#EF4444" : risk.severity === "medium" ? "#FBBF24" : "#4ADE80"
                        }}>
                          {risk.severity || "low"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Irrigation Schedule */}
              {irrigationData && (
                <div style={{ marginTop: "20px", padding: "20px", borderRadius: "16px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <div style={{ fontSize: "0.7rem", color: "#60A5FA", fontFamily: "'Inter',sans-serif", letterSpacing: "1.5px", marginBottom: "14px", textTransform: "uppercase", fontWeight: "700" }}>
                    💧 IRRIGATION SCHEDULE
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "6px" }}>URGENCY</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: "800", color: irrigationData.urgency === "high" ? "#EF4444" : irrigationData.urgency === "medium" ? "#FBBF24" : "#4ADE80", textTransform: "uppercase" }}>
                        {irrigationData.urgency || "N/A"}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "6px" }}>WATER NEEDED</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#60A5FA" }}>
                        {irrigationData.water_requirement_mm?.toFixed(1) || "--"} mm
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "6px" }}>SOIL MOISTURE</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#4ADE80" }}>
                        {irrigationData.soil_moisture_current?.toFixed(0) || "--"}%
                      </div>
                    </div>
                  </div>
                  {irrigationData.recommendation && (
                    <div style={{ marginTop: "14px", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      <span style={{ fontSize: "0.85rem", color: "#374151" }}>{irrigationData.recommendation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <span style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif", fontSize: "0.75rem" }}>
            Generated by AgriCast DSS Engine
          </span>
          <span style={{ color: "#4B5563", fontFamily: "'Inter',sans-serif", fontSize: "0.75rem" }}>
            {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: {
    position: "relative",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,253,244,0.95) 100%)",
    borderRadius: "28px", border: "1px solid rgba(34,197,94,0.2)",
    padding: "48px", marginBottom: "32px", overflow: "hidden",
    animation: "fadeSlideUp 0.45s ease-out",
    boxShadow: "0 25px 70px rgba(34,197,94,0.1), 0 0 0 1px rgba(34,197,94,0.05)",
    backdropFilter: "blur(20px)",
  },
  glowTR: { position: "absolute", top: 0, right: 0, width: "350px", height: "350px", background: "radial-gradient(circle at top right,rgba(34,197,94,0.08),transparent 60%)", pointerEvents: "none" },
  glowBL: { position: "absolute", bottom: 0, left: 0, width: "280px", height: "280px", background: "radial-gradient(circle at bottom left,rgba(74,222,128,0.05),transparent 60%)", pointerEvents: "none" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", paddingBottom: "32px", borderBottom: "1px solid rgba(34,197,94,0.15)" },
  badge: { display: "inline-block", marginBottom: "14px", padding: "8px 18px", borderRadius: "10px", background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid rgba(34,197,94,0.3)", color: "#16a34a", fontSize: "0.75rem", fontWeight: "700", fontFamily: "'Inter',sans-serif", letterSpacing: "2px" },
  title: { margin: "0 0 16px", color: "#1e293b", fontSize: "2rem", fontWeight: "800", fontFamily: "'Poppins',sans-serif", letterSpacing: "-0.5px" },
  sub: { margin: 0, display: "flex", flexWrap: "wrap", gap: "12px" },
  subChip: { padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(34,197,94,0.2)", color: "#475569", fontFamily: "'Inter',sans-serif", boxShadow: "0 2px 8px rgba(34,197,94,0.08)" },
  printBtn: { padding: "14px 28px", borderRadius: "14px", background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid rgba(34,197,94,0.25)", color: "#16a34a", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", fontFamily: "'Inter',sans-serif", flexShrink: 0 },

  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "20px", marginBottom: "40px" },
  metricCard: { padding: "28px", borderRadius: "20px", border: "1px solid", textAlign: "center", backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.95)" },

  tabBar: { display: "flex", gap: "10px", marginBottom: "32px", borderBottom: "1px solid rgba(34,197,94,0.15)", paddingBottom: "0" },
  tab: { display: "flex", alignItems: "center", padding: "14px 24px", borderRadius: "14px 14px 0 0", border: "none", background: "transparent", color: "#64748b", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", fontFamily: "'Poppins',sans-serif", position: "relative", marginBottom: "-1px" },
  tabActive: { background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", color: "#16a34a", borderBottom: "3px solid #22c55e" },
  tabBadge: { marginLeft: "8px", width: "22px", height: "22px", borderRadius: "50%", background: "#22c55e", color: "#FFF", fontSize: "0.7rem", fontWeight: "800", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  tabContent: { minHeight: "300px" },

  weatherBanner: { display: "flex", gap: "20px", alignItems: "flex-start", padding: "22px 26px", borderRadius: "18px", background: "linear-gradient(135deg, rgba(96,165,250,0.08), rgba(147,197,253,0.05))", border: "1px solid rgba(96,165,250,0.2)", marginBottom: "32px", backdropFilter: "blur(8px)" },
  weatherIcon: { fontSize: "34px", flexShrink: 0, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" },

  nutrientGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" },
  nutrientCard: { padding: "30px", borderRadius: "20px", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.15)", boxShadow: "0 8px 30px rgba(34,197,94,0.08)" },
  nutrientTitle: { margin: "0 0 20px", fontSize: "0.9rem", fontWeight: "700", color: "#64748b", fontFamily: "'Poppins',sans-serif", letterSpacing: "0.5px" },
  adviceCard: { padding: "30px", borderRadius: "20px", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.15)", boxShadow: "0 8px 30px rgba(34,197,94,0.08)" },
  adviceText: { margin: "0 0 20px", fontSize: "0.95rem", color: "#475569", lineHeight: "1.8", fontFamily: "'Inter',sans-serif" },
  adviseDivider: { height: "1px", background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)", margin: "20px 0" },

  stageHeader: { display: "flex", gap: "32px", marginBottom: "36px", flexWrap: "wrap" },
  stageCurrent: { flex: "0 0 auto", padding: "32px", borderRadius: "20px", background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid rgba(34,197,94,0.25)", minWidth: "240px" },
  stageProgress: { flex: 1, padding: "32px", borderRadius: "20px", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.15)", minWidth: "280px" },

  timeline: { display: "flex", flexDirection: "column" },
  timelineItem: { display: "flex", gap: "20px", padding: "16px 18px", borderRadius: "14px" },
  timelineItemActive: { background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid rgba(34,197,94,0.25)" },
  timelineItemPast: { opacity: 0.5 },
  timelineLeft: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "20px" },
  timelineDot: { width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, marginTop: "4px" },
  timelineConnector: { width: "2px", flex: 1, marginTop: "4px", marginBottom: "-4px", minHeight: "26px" },
  timelineContent: { flex: 1, paddingBottom: "20px" },

  noAlerts: { padding: "60px 32px", textAlign: "center", border: "2px dashed rgba(34,197,94,0.3)", borderRadius: "20px", background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" },
  riskGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", marginTop: "16px" },
  riskCard: { padding: "28px 20px", borderRadius: "18px", border: "1px solid", textAlign: "center", backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.95)" },

  emptyState: { padding: "80px 32px", textAlign: "center" },
  emptyIcon: { fontSize: "64px", marginBottom: "20px", opacity: 0.6 },
  emptyTitle: { margin: "0 0 14px", color: "#475569", fontSize: "1.25rem", fontWeight: "700", fontFamily: "'Poppins',sans-serif" },
  emptyText: { margin: 0, color: "#64748b", fontSize: "0.95rem", lineHeight: "1.8", fontFamily: "'Inter',sans-serif" },

  footer: { display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid rgba(34,197,94,0.15)" },
};
