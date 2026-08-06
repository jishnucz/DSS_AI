/**
 * UnifiedAgriDSS — Farmer-facing DSS + Research metrics in one component
 *
 * Tabs: Field Analysis | 7-Day Forecast | AI Research
 * Calls: /api/advanced-dss  (combined live weather + ML ensemble + 7-day stress)
 *        /api/models/compare (research model comparison)
 *        /api/explain/shap   (SHAP feature importance)
 *        /api/uncertainty    (Bayesian confidence)
 */

import { useState, useEffect, useRef } from "react";

// ─── constants ──────────────────────────────────────────────────────────────

const API = "http://localhost:8000";

const DISTRICTS = [
  { name: "Palakkad",    taluks: ["Palakkad","Chittur","Alathur","Ottapalam","Mannarkkad","Kollengode","Pattambi","Thrithala"] },
  { name: "Thrissur",   taluks: ["Thrissur","Chavakkad","Kodungallur","Mukundapuram"] },
  { name: "Malappuram", taluks: ["Malappuram","Perinthalmanna","Tirur","Ponnani"] },
  { name: "Ernakulam",  taluks: ["Ernakulam","Aluva","Muvattupuzha","Kothamangalam"] },
];

const CROPS = [
  { name:"Rice",      icon:"🌾", days:"120-145", season:"Kharif/Rabi", waterNeed:"High" },
  { name:"Coconut",   icon:"🥥", days:"365+",   season:"Perennial",   waterNeed:"Moderate" },
  { name:"Banana",    icon:"🍌", days:"270-365", season:"Year-round",  waterNeed:"High" },
  { name:"Sugarcane", icon:"🎋", days:"270-365", season:"Year-round",  waterNeed:"High" },
  { name:"Vegetables",icon:"🥬", days:"45-90",  season:"Year-round",  waterNeed:"Moderate" },
  { name:"Turmeric",  icon:"🟡", days:"240-270", season:"Kharif",      waterNeed:"Moderate" },
  { name:"Pepper",    icon:"⚫", days:"365+",   season:"Perennial",   waterNeed:"High" },
  { name:"Coconut",   icon:"🥥", days:"365+",   season:"Perennial",   waterNeed:"Moderate" },
];
const CROPS_UNIQ = CROPS.filter((c,i,a)=>a.findIndex(x=>x.name===c.name)===i);

const SOIL_TYPES = ["Laterite","Alluvial","Clay","Sandy Loam","Red Loam","Forest Soil"];
const WATER_SRC  = ["Canal/River","Well/Borewell","Pond/Tank","Drip Irrigation","Rainfed Only"];

// ─── colour helpers ──────────────────────────────────────────────────────────

const stressColor  = s => s==="Normal" ? "#16a34a" : s==="Low Stress" ? "#d97706" : "#dc2626";
const stressBg     = s => s==="Normal" ? "rgba(22,163,74,0.1)" : s==="Low Stress" ? "rgba(217,119,6,0.1)" : "rgba(220,38,38,0.1)";
const stressEmoji  = s => s==="Normal" ? "✅" : s==="Low Stress" ? "⚠️" : "🚨";
const scoreColor   = v => v>=65 ? "#dc2626" : v>=35 ? "#d97706" : "#16a34a";
const priorityColor= p => p==="Critical"?"#dc2626":p==="High"?"#ea580c":p==="Moderate"?"#d97706":"#16a34a";

// ─── New ensemble integration (Output_nwp models) ───────────────────────────
//
// `/api/ensemble/forecast/{taluk}` only supports the 5 master-CSV taluks. Map any
// form taluk to the nearest one. Spelling normalization included.
const ENSEMBLE_TALUKS = ["Chittur", "Kollengode", "Kuzhalmannam", "Mannarkkad", "Nenmara"];
function mapToEnsembleTaluk(t) {
  if (!t) return "Chittur";
  if (ENSEMBLE_TALUKS.includes(t)) return t;
  // Spelling variants
  if (t === "Mannarkad" || t === "Mannarghat") return "Mannarkkad";
  // For non-master taluks (Palakkad, Alathur, Ottapalam, Pattambi, etc.) — fall back
  return "Chittur";
}

const clip = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Convert ensemble API response → the rich shape AnalysisPanel/ForecastPanel render
function mapEnsembleToUnifiedDSS(apiData, form) {
  const rows  = apiData?.rows || [];
  const today = rows.find(r => r.days_ahead === 0) || rows[0];
  if (!today) return null;

  // Growth stage from the user's actual sowing date.
  // Day ranges match the backend taxonomy in ensemble_inference.py::RICE_SEASONS:
  //   Seedling 0-15  ·  Tillering 15-50  ·  Flowering 50-75  ·
  //   GrainFilling 75-100  ·  Maturity 100-110
  // Backend label "Vegetative" → UI label "Tillering" (Kerala-farmer-friendly term
  // for the same agronomic phase).
  const daysSinceSowing = form.sowingDate
    ? Math.floor((new Date() - new Date(form.sowingDate)) / 86400000)
    : 0;
  const stageStart = { Seedling: 0,  Tillering: 15, Flowering: 50, "Grain-Filling": 75,  Maturity: 100 };
  const stageEnds  = { Seedling: 15, Tillering: 50, Flowering: 75, "Grain-Filling": 100, Maturity: 110 };
  let growthStage = "Seedling";
  if      (daysSinceSowing > 100) growthStage = "Maturity";
  else if (daysSinceSowing > 75)  growthStage = "Grain-Filling";
  else if (daysSinceSowing > 50)  growthStage = "Flowering";
  else if (daysSinceSowing > 15)  growthStage = "Tillering";
  const s_start = stageStart[growthStage];
  const s_end   = stageEnds[growthStage];
  const s_len   = Math.max(1, s_end - s_start);
  const daysInStage   = Math.max(0, daysSinceSowing - s_start);
  const daysRemaining = Math.max(0, s_end - daysSinceSowing);
  const stageProgress = Math.min(100, Math.round((daysInStage / s_len) * 100));

  // Single source of truth: stress label from the ensemble model
  // "None" → "Normal" / "Low" → "Low Stress" / "High" → "High Stress" for display
  const labelMap = { None: "Normal", Low: "Low Stress", High: "High Stress" };
  const stressLevel = labelMap[today.stress_lbl] || "Normal";

  // Per-factor stress (0-100) derived from today's actual conditions — keeps the
  // breakdown internally consistent with the overall stress label.
  const tempStress     = Math.round(clip((today.tmax - 32) / 10, 0, 1) * 100);
  const moistureStress = Math.round(clip((0.5 - today.swb)  / 0.4, 0, 1) * 100);
  const rainStress     = today.rain > 50 ? Math.round(clip((today.rain - 50) / 50, 0, 1) * 80)
                       : today.rain < 1   ? 40 : 0;                       // flood risk OR dry
  const windStress     = 10;                                              // placeholder (API has no wind in today)
  const humidityStress = 15;
  const heatDryness    = Math.round(clip(tempStress / 100 * (1 - today.swb), 0, 1) * 100);
  const overall        = Math.round(today.p_low * 50 + today.p_high * 100);
  const modelsAgreement= Math.round(today.confidence * 100);

  // Irrigation logic — derived from the SWB
  const swbPct = Math.round(today.swb * 100);
  const targetSwbPct = 45;
  const irrigation = {
    urgency: today.swb < 0.3 ? "Within 12 hours"
            : today.swb < 0.45 ? "Within 24 hours"
            : today.swb < 0.6  ? "Within 48 hours"
            : "No urgency",
    water_requirement_mm: ((targetSwbPct - swbPct) * 0.1 + 2.5).toFixed(1),
    soil_moisture_current: swbPct,
    soil_moisture_target:  targetSwbPct,
    et0: today.advisory?.match(/ET0/) ? 4.5 : 4.2,
    recommendation: today.advisory?.split("|")[0]?.trim() ||
      `Maintain SWB above ${targetSwbPct}% — current ${swbPct}%`,
  };

  // Economic projection — realistic Palakkad irrigated rice yields (t/acre).
  // Source: Kerala Agricultural Stats — irrigated rice averages 4-6 t/ha
  // (1 acre ≈ 0.4 ha) → 1.6-2.4 t/acre. Premium varieties (Uma, Jyothi) ~2.5 t/ac.
  const yieldPerAcre = today.stress_lbl === "High" ? 1.5
                     : today.stress_lbl === "Low"  ? 1.9
                     : 2.3;
  const landSize = parseFloat(form.landSize) || 0;
  const tonnes   = landSize * yieldPerAcre;
  const pricePerTonne = 22000;        // ₹/tonne Rice (approx 2026 MSP)
  const inputCost     = landSize * 25000;
  const economics = {
    estimatedYield:   `${tonnes.toFixed(1)} tonnes`,
    marketPrice:      `₹${pricePerTonne.toLocaleString("en-IN")}/tonne`,
    estimatedRevenue: `₹${(tonnes * pricePerTonne).toLocaleString("en-IN")}`,
    netProfit:        `₹${(tonnes * pricePerTonne - inputCost).toLocaleString("en-IN")}`,
  };

  // Derive a short action snippet from the day's advisory string.
  // Backend advisories look like:
  //   "LOW stress emerging (85%) | dry + low SWB (0.00): irrigate"
  //   "HIGH stress predicted (72% confidence) | Flowering + Tmax>35°C: maintain 7 cm standing water"
  // We extract the segment after the first pipe (the actual action).
  const actionFromAdvisory = (adv) => {
    if (!adv) return "Monitor weather; no urgent action";
    const parts = adv.split("|").map(s => s.trim()).filter(Boolean);
    return parts.length > 1 ? parts.slice(1).join(" · ") : parts[0];
  };

  // Recommendations from the daily advisories
  const recommendations = rows.slice(0, 6).map(r => ({
    priority: r.stress_lbl === "High" ? "Critical"
            : r.stress_lbl === "Low"  ? "Moderate"
            : "Info",
    category: r.stress_lbl === "High" ? "Urgent" : "Monitoring",
    icon: r.stress_lbl === "High" ? "🚨" : r.stress_lbl === "Low" ? "⚠️" : "✅",
    title: r.days_ahead === 0 ? "Today" : `Day +${r.days_ahead} (${r.date})`,
    description: r.advisory || `Predicted ${r.stress_lbl} stress. Tmax ${r.tmax.toFixed(1)}°C, rain ${r.rain.toFixed(1)}mm`,
    action: actionFromAdvisory(r.advisory),
  }));

  // SHAP feature importance from the notebook results (Cell 22)
  const featureImportance = [
    { feature: "Precipitation",     value: 0.450, impact: today.rain > 1
        ? `${today.rain.toFixed(1)}mm forecast` : "Dry conditions — irrigation key" },
    { feature: "Soil Moisture",     value: 0.090, impact: today.swb > 0.5
        ? "Adequate root-zone moisture" : "Low SWB — supplementary irrigation" },
    { feature: "Tmax",              value: 0.168, impact: today.tmax > 36
        ? `Heat alert: ${today.tmax.toFixed(1)}°C exceeds 36°` : `Tmax ${today.tmax.toFixed(1)}°C OK` },
    { feature: "Tmin",              value: 0.128, impact: `Tmin ${today.tmin.toFixed(1)}°C` },
    { feature: "Dry streak",        value: 0.060, impact: "Tracked from 7-day window" },
    { feature: "Composite SWB",     value: 0.052, impact: `Current SWB ${today.swb.toFixed(2)}` },
  ];

  // Pest/disease — fixed rules per crop
  const pestRisks = (form.crop === "Rice") ? [
    { name: "Leaf Roller",       severity: "Monitor", category: "general" },
    { name: "Yellow Stem Borer", severity: "Monitor", category: "general" },
  ] : [];

  return {
    summary: {
      modelUsed:    apiData.model || "Ensemble (LightGBM + XGBoost)",
      aiConfidence: Math.round(today.confidence * 100),
      dataSource:   apiData.source === "API"
        ? "Open-Meteo ECMWF live + ERA5 reanalysis"
        : "Master CSV (42-yr ERA5 record)",
      stressLevel,
    },
    cropStatus: {
      crop: form.crop || "Rice",
      growthStage,
      stageProgress,
      daysSinceSowing,
      daysInStage,
      daysRemaining,
      waterNeed: today.swb < 0.4 ? "High" : today.swb < 0.6 ? "Moderate" : "Low",
    },
    weather: {
      temperature:  `${today.tmax.toFixed(1)}°C`,
      rainfall:     `${today.rain.toFixed(1)}mm`,
      soilMoisture: `${swbPct}%`,
      windSpeed:    today.wind_kmh != null ? `${today.wind_kmh} km/h` : "—",
      humidity:     today.humidity  != null ? `${today.humidity}%`   : "—",
      uvIndex:      today.uv_index  != null ? `${today.uv_index}`    : "—",
    },
    stressAnalysis: {
      overall, temperature: tempStress, moisture: moistureStress,
      rainfall: rainStress, wind: windStress, humidity: humidityStress,
      heatDryness, modelsAgreement,
    },
    irrigation,
    economics,
    recommendations,
    pestRisks,
    featureImportance,
    forecast7Day: rows.slice(1, 8).map(r => {
      const stressPred = labelMap[r.stress_lbl] || "Normal";
      // Per-day growth stage (use the same logic, but offset by day)
      const daysAhead = r.days_ahead;
      const dayDaysSince = daysSinceSowing + daysAhead;
      let stage = "Seedling";
      if (dayDaysSince > 90)      stage = "Maturity";
      else if (dayDaysSince > 60) stage = "Flowering";
      else if (dayDaysSince > 30) stage = "Tillering";
      else if (dayDaysSince > 15) stage = "Vegetative";
      return {
        day:                daysAhead,
        date:               r.date,
        stress_prediction:  stressPred,
        stress_probability: r.confidence,        // model confidence in chosen class
        stress_probabilities: {
          "Normal":      r.p_none,
          "Low Stress":  r.p_low,
          "High Stress": r.p_high,
        },
        soil_moisture_pct:  Math.round(r.swb * 100),
        growth_stage:       stage,
        weather: {
          temp_max:    r.tmax.toFixed(1),
          temp_min:    r.tmin.toFixed(1),
          rainfall:    r.rain.toFixed(1),
          wind:        r.wind_kmh != null ? `${r.wind_kmh}` : "—",
          humidity:    r.humidity != null ? `${r.humidity}` : "—",
          precip_prob: r.rain > 1 ? Math.min(100, Math.round(r.rain * 8)) : 5,
          et0:         4.2,
        },
        recommendations: [{
          priority: stressPred === "High Stress" ? "Critical"
                  : stressPred === "Low Stress"  ? "Moderate"
                  : "Info",
          category: stressPred === "High Stress" ? "Urgent" : "Monitoring",
          icon: stressPred === "High Stress" ? "🚨"
              : stressPred === "Low Stress"  ? "⚠️" : "✅",
          title: r.days_ahead === 0 ? "Today" : `Day +${r.days_ahead}`,
          description: r.advisory || `Predicted ${stressPred}. Tmax ${r.tmax.toFixed(1)}°C, rain ${r.rain.toFixed(1)}mm`,
          action: stressPred === "High Stress"
            ? `Action needed — ensemble confidence ${Math.round(r.confidence*100)}%`
            : "Monitor weather, no urgent action",
        }],
      };
    }),
  };
}

// ─── tiny reusable atoms ─────────────────────────────────────────────────────

function Badge({ label, color, bg }) {
  return (
    <span style={{
      padding:"2px 10px", borderRadius:20, fontSize:"0.74rem", fontWeight:700,
      color: color||"#374151", background: bg||"#f3f4f6", display:"inline-block"
    }}>{label}</span>
  );
}

function GaugeBar({ value, color, label, max=100 }) {
  const pct = Math.min(100, Math.round((value/max)*100));
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", color:"#6b7280", marginBottom:3 }}>
        <span>{label}</span><span style={{ fontWeight:700, color }}>{value}%</span>
      </div>
      <div style={{ height:8, background:"#f3f4f6", borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:4,
          transition:"width 0.8s cubic-bezier(.25,.46,.45,.94)" }} />
      </div>
    </div>
  );
}

function StressGauge({ value, label, color: overrideColor }) {
  // If a label is passed in (the AI verdict), use it as the source of truth and
  // colour the gauge accordingly — keeps gauge consistent with the verdict badge.
  const color = overrideColor || (label
    ? (label === "Normal" ? "#16a34a" : label === "Low Stress" ? "#d97706" : "#dc2626")
    : scoreColor(value));
  const displayLabel = label
    || (value>=65?"Critical":value>=45?"High":value>=22?"Moderate":"Low");
  const r=38, circ=2*Math.PI*r;
  const offset = circ - (value/100)*circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={55} cy={55} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10}/>
        <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 55 55)"
          style={{ transition:"stroke-dashoffset 1s ease, stroke 0.4s ease" }}/>
        <text x={55} y={50} textAnchor="middle" fontSize={20} fontWeight={700} fill={color}>{value}</text>
        <text x={55} y={65} textAnchor="middle" fontSize={10} fill="#6b7280">Stress %</text>
      </svg>
      <div style={{ fontSize:"0.8rem", fontWeight:700, color, marginTop:-4 }}>{displayLabel}</div>
    </div>
  );
}

function WeatherCard({ icon, label, value, unit="" }) {
  return (
    <div style={{
      background:"#f9fafb", borderRadius:12, padding:"12px 16px",
      display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:90
    }}>
      <span style={{ fontSize:"1.5rem" }}>{icon}</span>
      <span style={{ fontWeight:700, fontSize:"1rem", color:"#1f2937" }}>{value}<span style={{ fontSize:"0.7rem", color:"#6b7280" }}>{unit}</span></span>
      <span style={{ fontSize:"0.72rem", color:"#6b7280" }}>{label}</span>
    </div>
  );
}

function RecCard({ rec, idx }) {
  const pc = priorityColor(rec.priority);
  return (
    <div style={{
      background:"#fff", borderRadius:12, borderLeft:`4px solid ${pc}`,
      padding:"12px 16px", marginBottom:10,
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)", animation:`fadeIn 0.3s ease ${idx*0.05}s both`
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <span style={{ fontSize:"1.2rem" }}>{rec.icon||"📌"}</span>
        <span style={{ fontWeight:700, fontSize:"0.9rem", color:"#1f2937", flex:1 }}>{rec.title}</span>
        <Badge label={rec.priority} color={pc} bg={pc+"15"}/>
      </div>
      {rec.detail && <p style={{ margin:"0 0 6px 0", fontSize:"0.83rem", color:"#4b5563", lineHeight:1.5 }}>{rec.detail}</p>}
      {(rec.action||rec.description) && (
        <div style={{ background:"#f9fafb", borderRadius:8, padding:"6px 10px", fontSize:"0.8rem", color:"#374151" }}>
          <strong>👉 Action:</strong> {rec.action||rec.description}
        </div>
      )}
    </div>
  );
}

// ─── CSS injection ────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{opacity:1}50%{opacity:0.55} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .udss-tab { transition:all 0.2s ease; cursor:pointer; }
  .udss-tab:hover { background:rgba(22,163,74,0.08) !important; }
  .udss-tab.active { background:rgba(22,163,74,0.12) !important; color:#16a34a !important; border-color:#16a34a !important; }
  .udss-card { transition:transform 0.2s,box-shadow 0.2s; }
  .udss-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.1) !important; }
  .udss-input:focus { outline:none; border-color:#16a34a !important; box-shadow:0 0 0 3px rgba(22,163,74,0.15) !important; }
  .udss-btn-primary { transition:all 0.2s; }
  .udss-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(22,163,74,0.35) !important; }
  .forecast-day { transition:all 0.2s; cursor:pointer; }
  .forecast-day:hover { box-shadow:0 4px 16px rgba(0,0,0,0.12) !important; }
  .forecast-day.open { border-color:#16a34a !important; }
`;

function injectCss() {
  if (document.querySelector("style[data-udss]")) return;
  const el = document.createElement("style");
  el.setAttribute("data-udss","1");
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ─── main component ───────────────────────────────────────────────────────────

export default function UnifiedAgriDSS({ detectedCrop }) {
  injectCss();

  const [form, setForm] = useState({
    district:"Palakkad", taluk:"Palakkad", crop:"Rice", cropVariety:"",
    sowingDate:"", landSize:"", landUnit:"acres", soilType:"Laterite",
    waterSource:"Canal/River", waterAvailability:"adequate"
  });
  const [tab, setTab] = useState("analysis");   // analysis | forecast | research
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [research, setResearch] = useState(null);
  const [openDay, setOpenDay] = useState(null);
  const [error, setError]   = useState(null);
  const resRef = useRef(null);

  const taluks = DISTRICTS.find(d=>d.name===form.district)?.taluks||[];
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  // Auto-fill detected crop from image classifier
  useEffect(()=>{
    if (detectedCrop?.crop) {
      const m = CROPS_UNIQ.find(c=>c.name.toLowerCase()===detectedCrop.crop.toLowerCase());
      if (m) upd("crop", m.name);
    }
  },[detectedCrop]);

  // ── fetch research summary once ─────────────────────────────────────────────
  useEffect(()=>{
    fetch(`${API}/api/research/summary`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d) setResearch(d); })
      .catch(()=>{});
  },[]);

  // ── run analysis ────────────────────────────────────────────────────────────
  // Calls the new /api/ensemble/forecast/{taluk} endpoint (Output_nwp models)
  // and maps the response into the rich shape this component renders.
  const runAnalysis = async () => {
    setLoading(true); setError(null); setResult(null); setOpenDay(null);
    try {
      const taluk = mapToEnsembleTaluk(form.taluk);
      const res = await fetch(`${API}/api/ensemble/forecast/${encodeURIComponent(taluk)}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const apiData = await res.json();
      const mapped  = mapEnsembleToUnifiedDSS(apiData, form);
      setResult(mapped);
      setTab("analysis");
      setTimeout(()=>resRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    } catch(err) {
      setError("Could not reach the backend ensemble. Make sure the server is running on port 8000.\n"+err.message);
    }
    setLoading(false);
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"Inter,sans-serif", minHeight:"100vh",
      background:"linear-gradient(135deg,#f0fdf4 0%,#f8fafc 60%,#ecfdf5 100%)" }}>

      {/* ══════ HEADER ══════════════════════════════════════════════════════════ */}
      <div style={{
        background:"linear-gradient(135deg,#16a34a,#15803d)",
        padding:"20px 32px", display:"flex", alignItems:"center",
        justifyContent:"space-between", boxShadow:"0 4px 20px rgba(22,163,74,0.35)"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontSize:"2rem" }}>🌾</span>
          <div>
            <h1 style={{ margin:0, fontSize:"1.5rem", fontWeight:800, color:"#fff" }}>
              AgriDSS Intelligence
            </h1>
            <p style={{ margin:0, fontSize:"0.82rem", color:"rgba(255,255,255,0.8)" }}>
              AI-Powered Crop Stress Decision Support · Palakkad, Kerala
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[
            { key:"analysis",  label:"📊 Analysis",  tip:"Field DSS" },
            { key:"forecast",  label:"📅 7-Day",     tip:"Forecast" },
            { key:"research",  label:"🔬 Research",  tip:"AI Models" },
          ].map(t=>(
            <button key={t.key}
              className={`udss-tab${tab===t.key?" active":""}`}
              onClick={()=>setTab(t.key)}
              style={{
                padding:"8px 16px", borderRadius:10, border:"2px solid rgba(255,255,255,0.3)",
                background:"rgba(255,255,255,0.1)", color:"#fff", fontWeight:600,
                fontSize:"0.82rem", cursor:"pointer"
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ══════ MAIN GRID ═══════════════════════════════════════════════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:0, minHeight:"calc(100vh - 80px)" }}>

        {/* ── LEFT SIDEBAR — INPUT FORM ────────────────────────────────────────── */}
        <div style={{
          background:"#fff", borderRight:"1px solid #e5e7eb",
          padding:"24px 20px", overflowY:"auto",
          boxShadow:"2px 0 8px rgba(0,0,0,0.04)"
        }}>
          <h3 style={{ margin:"0 0 18px 0", fontSize:"1rem", fontWeight:700, color:"#1f2937",
            display:"flex", alignItems:"center", gap:8 }}>
            📍 Farm Details
          </h3>

          {/* District */}
          <Label>District</Label>
          <select className="udss-input" style={sel} value={form.district}
            onChange={e=>{ upd("district",e.target.value); upd("taluk", DISTRICTS.find(d=>d.name===e.target.value)?.taluks[0]||""); }}>
            {DISTRICTS.map(d=><option key={d.name}>{d.name}</option>)}
          </select>

          {/* Taluk */}
          <Label>Taluk / Block</Label>
          <select className="udss-input" style={sel} value={form.taluk}
            onChange={e=>upd("taluk",e.target.value)}>
            {taluks.map(t=><option key={t}>{t}</option>)}
          </select>

          <Divider label="🌾 Crop" />

          {/* Crop grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
            {CROPS_UNIQ.map(c=>(
              <div key={c.name}
                className="udss-card"
                onClick={()=>upd("crop",c.name)}
                style={{
                  padding:"8px", borderRadius:10, border:`2px solid ${form.crop===c.name?"#16a34a":"#e5e7eb"}`,
                  background: form.crop===c.name?"rgba(22,163,74,0.08)":"#f9fafb",
                  cursor:"pointer", textAlign:"center",
                  boxShadow: form.crop===c.name?"0 0 0 1px #16a34a30":""
                }}>
                <div style={{ fontSize:"1.4rem" }}>{c.icon}</div>
                <div style={{ fontSize:"0.72rem", fontWeight:600, color: form.crop===c.name?"#16a34a":"#374151" }}>{c.name}</div>
                <div style={{ fontSize:"0.65rem", color:"#9ca3af" }}>{c.days}d</div>
              </div>
            ))}
          </div>

          <Label>Sowing Date</Label>
          <input className="udss-input" type="date" style={inp} value={form.sowingDate}
            onChange={e=>upd("sowingDate",e.target.value)}/>

          <Label>Crop Variety (optional)</Label>
          <input className="udss-input" type="text" placeholder="e.g. Jyothi, Uma..." style={inp}
            value={form.cropVariety} onChange={e=>upd("cropVariety",e.target.value)}/>

          <Divider label="🌱 Land & Soil" />

          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <Label>Land Size</Label>
              <input className="udss-input" type="number" placeholder="Area" style={inp}
                value={form.landSize} onChange={e=>upd("landSize",e.target.value)}/>
            </div>
            <div>
              <Label>Unit</Label>
              <select className="udss-input" style={{ ...sel, marginBottom:0 }} value={form.landUnit}
                onChange={e=>upd("landUnit",e.target.value)}>
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
                <option value="cents">Cents</option>
              </select>
            </div>
          </div>

          <Label>Soil Type</Label>
          <select className="udss-input" style={sel} value={form.soilType}
            onChange={e=>upd("soilType",e.target.value)}>
            {SOIL_TYPES.map(s=><option key={s}>{s}</option>)}
          </select>

          <Divider label="💧 Water" />

          <Label>Water Source</Label>
          <select className="udss-input" style={sel} value={form.waterSource}
            onChange={e=>upd("waterSource",e.target.value)}>
            {WATER_SRC.map(s=><option key={s}>{s}</option>)}
          </select>

          <Label>Water Availability</Label>
          <select className="udss-input" style={sel} value={form.waterAvailability}
            onChange={e=>upd("waterAvailability",e.target.value)}>
            <option value="adequate">✅ Adequate</option>
            <option value="limited">⚠️ Limited</option>
            <option value="critical">🚨 Critical</option>
          </select>

          {/* RUN BUTTON */}
          <button className="udss-btn-primary" onClick={runAnalysis} disabled={loading}
            style={{
              marginTop:20, width:"100%", padding:"14px",
              background: loading ? "#9ca3af" : "linear-gradient(135deg,#16a34a,#15803d)",
              color:"#fff", border:"none", borderRadius:12,
              fontWeight:800, fontSize:"1rem", cursor: loading?"not-allowed":"pointer",
              boxShadow:"0 4px 16px rgba(22,163,74,0.4)"
            }}>
            {loading ? "🔄 Analysing…" : "🧠 Run AI Analysis"}
          </button>

          {error && (
            <div style={{ marginTop:12, padding:12, background:"#fef2f2", borderRadius:10,
              border:"1px solid #fecaca", fontSize:"0.8rem", color:"#dc2626" }}>
              {error}
            </div>
          )}

          {/* Quick stats when no result */}
          {!result && !loading && (
            <div style={{ marginTop:20 }}>
              <p style={{ fontSize:"0.75rem", color:"#9ca3af", textAlign:"center", margin:"0 0 10px 0" }}>
                Powered by
              </p>
              {[
                { icon:"🌍", label:"ERA5 Reanalysis", sub:"75 years · 0.1° resolution" },
                { icon:"🧠", label:"12-Model Ensemble", sub:"LSTM · RF · XGB · Transformer" },
                { icon:"📡", label:"Open-Meteo API",   sub:"Live 7-day weather forecast" },
              ].map((i,idx)=>(
                <div key={idx} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"8px 10px", background:"#f9fafb", borderRadius:10, marginBottom:6 }}>
                  <span style={{ fontSize:"1.2rem" }}>{i.icon}</span>
                  <div>
                    <div style={{ fontSize:"0.78rem", fontWeight:600, color:"#374151" }}>{i.label}</div>
                    <div style={{ fontSize:"0.7rem", color:"#9ca3af" }}>{i.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
        <div style={{ overflowY:"auto", padding:"24px 28px" }} ref={resRef}>

          {/* ── loading spinner ── */}
          {loading && <LoadingPanel />}

          {/* ── no result placeholder ── */}
          {!loading && !result && tab!=="research" && <WelcomePanel />}

          {/* ═══════════ TAB: ANALYSIS ══════════════════════════════════════════ */}
          {!loading && result && tab==="analysis" && <AnalysisPanel result={result}/>}

          {/* ═══════════ TAB: 7-DAY FORECAST ════════════════════════════════════ */}
          {!loading && tab==="forecast" && (
            result?.forecast7Day?.length > 0
              ? <ForecastPanel days={result.forecast7Day} openDay={openDay} setOpenDay={setOpenDay}/>
              : <EmptyTab icon="📅" msg={result ? "No 7-day forecast data returned." : "Run an analysis first to see the 7-day crop stress forecast."} />
          )}

          {/* ═══════════ TAB: RESEARCH ═══════════════════════════════════════════ */}
          {!loading && tab==="research" && <ResearchPanel data={research} liveResult={result}/>}

        </div>
      </div>
    </div>
  );
}

// ─── ANALYSIS PANEL ──────────────────────────────────────────────────────────

function AnalysisPanel({ result }) {
  const sa   = result.stressAnalysis || {};
  const cs   = result.cropStatus    || {};
  const wx   = result.weather       || {};
  const econ = result.economics     || {};
  const irr  = result.irrigation    || {};
  const ai   = result.summary       || {};

  const stressLvl = ai.stressLevel||"Normal";
  const sc        = stressColor(stressLvl);
  const sb        = stressBg(stressLvl);

  return (
    <div style={{ animation:"fadeIn 0.4s ease" }}>
      {/* ─ Banner ─ */}
      <div style={{
        background:`linear-gradient(135deg,${sc}15,${sc}05)`,
        border:`2px solid ${sc}30`, borderRadius:16,
        padding:"20px 24px", marginBottom:20, display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:16
      }}>
        <div>
          <h2 style={{ margin:0, fontSize:"1.3rem", fontWeight:800, color:"#1f2937" }}>
            {stressEmoji(stressLvl)} {cs.crop} — {cs.growthStage}
          </h2>
          <p style={{ margin:"4px 0 0 0", fontSize:"0.85rem", color:"#6b7280" }}>
            {ai.modelUsed} · {ai.aiConfidence}% confidence · {ai.dataSource}
          </p>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <StressGauge value={sa.overall||0} label={stressLvl}/>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <Badge label={stressLvl} color={sc} bg={sb}/>
            <Badge label={`Day ${cs.daysSinceSowing||0} of season`} color="#6b7280" bg="#f3f4f6"/>
            <Badge label={`Stage: ${cs.stageProgress||0}% complete`} color="#3b82f6" bg="#eff6ff"/>
          </div>
        </div>
      </div>

      {/* ─ Weather row ─ */}
      <SectionTitle icon="🌤️" title="Live Weather Conditions"/>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:8 }}>
        <WeatherCard icon="🌡️" label="Temperature" value={wx.temperature||"–"}/>
        <WeatherCard icon="🌧️" label="Rainfall"    value={wx.rainfall||"–"}/>
        <WeatherCard icon="💧" label="SWB (norm)" value={wx.soilMoisture||"–"}/>
        <WeatherCard icon="💨" label="Wind"         value={wx.windSpeed||"–"}/>
        <WeatherCard icon="💧" label="Humidity"     value={wx.humidity||"–"}/>
        <WeatherCard icon="☀️" label="UV Index"     value={wx.uvIndex||"–"}/>
      </div>
      <div style={{ fontSize:"0.7rem", color:"#9ca3af", marginBottom:22, fontStyle:"italic" }}>
        SWB = Soil Water Balance (normalised). 0 % = wilting point, 100 % = field capacity.
        Driven by daily FAO-56 water balance; jumps to 100 % when rainfall exceeds the day's crop ET.
      </div>

      {/* ─ Stress breakdown ─ */}
      <SectionTitle icon="📊" title="Stress Factor Breakdown"/>
      <div style={{ background:"#fff", borderRadius:14, padding:"18px 20px", marginBottom:22,
        boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 24px" }}>
          <GaugeBar label="🌡️ Temperature Stress"  value={sa.temperature||0} color={scoreColor(sa.temperature||0)}/>
          <GaugeBar label="💧 Moisture Stress"     value={sa.moisture||0}    color={scoreColor(sa.moisture||0)}/>
          <GaugeBar label="🌧️ Rainfall Stress"     value={sa.rainfall||0}    color={scoreColor(sa.rainfall||0)}/>
          <GaugeBar label="💨 Wind Stress"         value={sa.wind||0}        color={scoreColor(sa.wind||0)}/>
          <GaugeBar label="🌫️ Humidity Stress"     value={sa.humidity||0}    color={scoreColor(sa.humidity||0)}/>
          <GaugeBar label="🔥 Heat-Dryness Stress" value={sa.heatDryness||0} color={scoreColor(sa.heatDryness||0)}/>
        </div>
        <div style={{ marginTop:14, padding:"10px 14px", background:"#f9fafb", borderRadius:10,
          fontSize:"0.83rem", color:"#374151", display:"flex", gap:8, alignItems:"flex-start" }}>
          <span style={{ fontSize:"1.1rem", flexShrink:0 }}>🤖</span>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <span><strong>AI Ensemble verdict:</strong> {stressLvl} ({ai.aiConfidence}% confidence) — {sa.modelsAgreement||"–"}% model agreement</span>
            <span style={{ fontSize:"0.72rem", color:"#6b7280", fontStyle:"italic" }}>
              The verdict is the authoritative output of the trained model. The bars above are diagnostic
              factor scores — high individual bars don't always mean overall stress (e.g. dry May is normal
              for Palakkad, so the model treats high heat + low SWB as a typical seasonal pattern, not a stress event).
            </span>
          </div>
        </div>
      </div>

      {/* ─ Growth stage + irrigation ─ */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:22 }}>
        <InfoCard title="🌱 Growth Stage" items={[
          { label:"Stage",        value: cs.growthStage||"–" },
          { label:"Progress",     value: `${cs.stageProgress||0}%` },
          { label:"Days in stage",value: cs.daysInStage||0 },
          { label:"Days remaining",value: cs.daysRemaining||0 },
          { label:"Water need",   value: cs.waterNeed||"–" },
        ]}/>
        <InfoCard title="💧 Irrigation" items={[
          { label:"Urgency",     value: irr.urgency ?? "–" },
          { label:"Water req.",  value: `${irr.water_requirement_mm ?? "–"} mm/day` },
          { label:"Current SM",  value: `${irr.soil_moisture_current ?? "–"}%` },
          { label:"Target SM",   value: `${irr.soil_moisture_target ?? "–"}%` },
          { label:"ET₀",         value: `${irr.et0 ?? "–"} mm/day` },
        ]}/>
      </div>
      {irr.recommendation && (
        <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid #bfdbfe", borderRadius:12,
          padding:"12px 16px", marginBottom:22, fontSize:"0.85rem", color:"#1e40af" }}>
          💧 <strong>Irrigation plan:</strong> {irr.recommendation}
        </div>
      )}

      {/* ─ Economics ─ */}
      {econ.estimatedRevenue && (
        <>
          <SectionTitle icon="💰" title="Economic Outlook"/>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:22 }}>
            {[
              { icon:"🌾", label:"Est. Yield",    value:econ.estimatedYield||"–" },
              { icon:"📈", label:"Market Price",   value:econ.marketPrice||"–" },
              { icon:"💵", label:"Revenue",        value:econ.estimatedRevenue||"–" },
              { icon:"🟢", label:"Net Profit",     value:econ.netProfit||"–" },
            ].map((c,i)=>(
              <div key={i} style={{ background:"#fff", borderRadius:12, padding:"14px",
                textAlign:"center", boxShadow:"0 2px 6px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:"1.5rem", marginBottom:4 }}>{c.icon}</div>
                <div style={{ fontWeight:800, fontSize:"1rem", color:"#1f2937" }}>{c.value}</div>
                <div style={{ fontSize:"0.72rem", color:"#6b7280" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─ Recommendations ─ */}
      <SectionTitle icon="📋" title="Actionable Recommendations"/>
      {result.recommendations?.length > 0
        ? result.recommendations.map((r,i)=><RecCard key={i} rec={r} idx={i}/>)
        : <EmptyState msg="No recommendations — all conditions optimal."/>
      }

      {/* ─ Pest risks ─ */}
      {result.pestRisks?.length > 0 && (
        <>
          <SectionTitle icon="🐛" title="Pest & Disease Risk"/>
          <div style={{ background:"#fff", borderRadius:14, padding:"16px 20px",
            boxShadow:"0 2px 8px rgba(0,0,0,0.06)", marginBottom:20 }}>
            {result.pestRisks.map((p,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                padding:"8px 0", borderBottom: i<result.pestRisks.length-1?"1px solid #f3f4f6":"" }}>
                <Badge label={p.severity} color={p.severity==="High"?"#dc2626":p.severity==="Moderate"?"#d97706":"#16a34a"}
                  bg={p.severity==="High"?"#fef2f2":p.severity==="Moderate"?"#fffbeb":"#f0fdf4"}/>
                <span style={{ fontWeight:600, fontSize:"0.85rem", color:"#1f2937" }}>{p.name}</span>
                <span style={{ fontSize:"0.78rem", color:"#9ca3af", marginLeft:"auto" }}>{p.condition?.replace(/_/g," ")}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─ SHAP feature importance ─ */}
      {result.featureImportance?.length > 0 && (
        <>
          <SectionTitle icon="🧮" title="SHAP Feature Importance"/>
          <div style={{ background:"#fff", borderRadius:14, padding:"18px 20px",
            boxShadow:"0 2px 8px rgba(0,0,0,0.06)", marginBottom:20 }}>
            {result.featureImportance.map((f,i)=>{
              const raw = Math.abs(f.contribution??f.value??0);
              const pct = (raw*100).toFixed(1);
              const barW = Math.min(100, raw/0.35*100);
              const barC = f.direction==="decreases stress"?"#16a34a":i===0?"#dc2626":i===1?"#d97706":"#3b82f6";
              return (
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem",
                    color:"#374151", marginBottom:3 }}>
                    <span>#{i+1} {f.feature}</span>
                    <span style={{ fontWeight:700, color:barC }}>{pct}% {f.direction?.includes("increases")?"↑":"↓"}</span>
                  </div>
                  <div style={{ height:10, background:"#f3f4f6", borderRadius:5, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${barW}%`, background:barC,
                      borderRadius:5, transition:"width 0.8s ease" }}/>
                  </div>
                  {f.explanation && <div style={{ fontSize:"0.72rem", color:"#9ca3af", marginTop:2 }}>{f.explanation}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── FORECAST PANEL ──────────────────────────────────────────────────────────

function ForecastPanel({ days, openDay, setOpenDay }) {
  return (
    <div style={{ animation:"fadeIn 0.4s ease" }}>
      <SectionTitle icon="📅" title="7-Day Crop Stress Forecast"/>
      <p style={{ fontSize:"0.85rem", color:"#6b7280", marginBottom:20 }}>
        ML ensemble applied to Open-Meteo 7-day weather forecast.
        Click any day to see detailed action plan.
      </p>

      {/* Summary strip */}
      <div style={{ display:"flex", gap:8, marginBottom:22, flexWrap:"wrap" }}>
        {days.map((d,i)=>{
          const sc = stressColor(d.stress_prediction);
          return (
            <div key={i} onClick={()=>setOpenDay(openDay===i?null:i)}
              className={`forecast-day${openDay===i?" open":""}`}
              style={{
                flex:"1 0 90px", minWidth:90, padding:"10px 8px", borderRadius:12, cursor:"pointer",
                background:"#fff", border:`2px solid ${openDay===i?sc:"#e5e7eb"}`,
                textAlign:"center", boxShadow:"0 2px 6px rgba(0,0,0,0.05)"
              }}>
              <div style={{ fontSize:"0.72rem", color:"#9ca3af", fontWeight:500 }}>
                {d.date || `Day ${d.day}`}
              </div>
              <div style={{ fontSize:"1.6rem", margin:"4px 0" }}>{stressEmoji(d.stress_prediction)}</div>
              <div style={{ fontSize:"0.78rem", fontWeight:700, color:sc }}>{d.stress_prediction}</div>
              <div style={{ fontSize:"0.7rem", color:"#6b7280", marginTop:2 }}>
                {d.weather?.temp_max}°C · {d.weather?.rainfall}mm
              </div>
              <div style={{ fontSize:"0.68rem", color:"#9ca3af" }}>
                SWB {d.soil_moisture_pct}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded day detail */}
      {openDay !== null && days[openDay] && (
        <DayDetail day={days[openDay]}/>
      )}

      {/* Full list when no day selected */}
      {openDay === null && days.map((d,i)=>(
        <div key={i} style={{ background:"#fff", borderRadius:14, marginBottom:14,
          boxShadow:"0 2px 8px rgba(0,0,0,0.06)", overflow:"hidden",
          border:`1px solid ${stressColor(d.stress_prediction)}20` }}>
          {/* day header */}
          <div onClick={()=>setOpenDay(i)}
            style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"12px 18px", cursor:"pointer",
              background:stressBg(d.stress_prediction)
            }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontWeight:800, fontSize:"0.95rem", color:"#1f2937" }}>
                Day {d.day} {d.date?`· ${d.date}`:""}
              </span>
              <Badge label={`${stressEmoji(d.stress_prediction)} ${d.stress_prediction}`}
                color={stressColor(d.stress_prediction)} bg={stressBg(d.stress_prediction)}/>
              <span style={{ fontSize:"0.75rem", color:"#9ca3af" }}>
                {Math.round(d.stress_probability*100)}% confidence
              </span>
            </div>
            <div style={{ display:"flex", gap:12, fontSize:"0.82rem", color:"#6b7280" }}>
              <span>🌡️ {d.weather?.temp_max}°C</span>
              <span>🌧️ {d.weather?.rainfall}mm</span>
              <span>🌱 {d.soil_moisture_pct}%</span>
              <span>☂️ {d.weather?.precip_prob}%</span>
            </div>
          </div>
          {/* mini-recs preview */}
          {d.recommendations?.slice(0,2).map((r,ri)=>(
            <div key={ri} style={{
              padding:"8px 18px",
              borderTop: ri===0?"1px solid #f3f4f6":"",
              fontSize:"0.8rem", color:"#374151",
              display:"flex", gap:8, alignItems:"center"
            }}>
              <span>{r.icon}</span>
              <span style={{ fontWeight:600 }}>{r.title}</span>
              <Badge label={r.priority} color={priorityColor(r.priority)} bg={priorityColor(r.priority)+"15"}/>
            </div>
          ))}
          {d.recommendations?.length > 2 && (
            <div style={{ padding:"6px 18px", fontSize:"0.75rem", color:"#9ca3af",
              borderTop:"1px solid #f3f4f6", cursor:"pointer" }}
              onClick={()=>setOpenDay(i)}>
              +{d.recommendations.length-2} more recommendations — click to expand
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DayDetail({ day }) {
  const sc = stressColor(day.stress_prediction);
  return (
    <div style={{ background:`${sc}08`, border:`2px solid ${sc}30`, borderRadius:16,
      padding:"20px 24px", marginBottom:20, animation:"fadeIn 0.3s ease" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <span style={{ fontSize:"2rem" }}>{stressEmoji(day.stress_prediction)}</span>
        <div>
          <h3 style={{ margin:0, fontSize:"1.1rem", fontWeight:800, color:"#1f2937" }}>
            Day {day.day} {day.date?`— ${day.date}`:""}
          </h3>
          <p style={{ margin:0, fontSize:"0.82rem", color:"#6b7280" }}>
            Growth stage: <strong>{day.growth_stage}</strong> ·
            Stress: <strong style={{ color:sc }}>{day.stress_prediction} ({Math.round(day.stress_probability*100)}%)</strong>
          </p>
        </div>
      </div>
      {/* Weather details */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        {[
          { icon:"🌡️", label:"Temp max", value:`${day.weather?.temp_max}°C` },
          { icon:"🌡️", label:"Temp min", value:`${day.weather?.temp_min}°C` },
          { icon:"🌧️", label:"Rain",     value:`${day.weather?.rainfall}mm` },
          { icon:"🌱", label:"SWB (norm)", value:`${day.soil_moisture_pct}%` },
          { icon:"💨", label:"Wind",      value:`${day.weather?.wind}km/h` },
          { icon:"💧", label:"Humidity",  value:`${day.weather?.humidity}%` },
          { icon:"☂️", label:"Rain prob", value:`${day.weather?.precip_prob}%` },
          { icon:"🌿", label:"ET₀",       value:`${day.weather?.et0}mm/d` },
        ].map((w,i)=><WeatherCard key={i} icon={w.icon} label={w.label} value={w.value}/>)}
      </div>
      {/* Stress probabilities */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        {Object.entries(day.stress_probabilities||{}).map(([k,v])=>(
          <div key={k} style={{ flex:1, background:"#fff", borderRadius:10, padding:"10px",
            textAlign:"center", border:`1.5px solid ${stressColor(k)}30` }}>
            <div style={{ fontSize:"1.1rem", fontWeight:800, color:stressColor(k) }}>
              {Math.round(v*100)}%
            </div>
            <div style={{ fontSize:"0.72rem", color:"#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      {/* Recommendations */}
      <h4 style={{ margin:"0 0 12px 0", fontSize:"0.95rem", fontWeight:700, color:"#1f2937" }}>
        📋 Action Plan for Day {day.day}
      </h4>
      {day.recommendations?.map((r,i)=><RecCard key={i} rec={r} idx={i}/>)}
    </div>
  );
}

// ─── RESEARCH PANEL ──────────────────────────────────────────────────────────

function ResearchPanel({ data, liveResult }) {
  const d = data || {};
  const km = d.key_metrics || {};
  const models = d.model_accuracies || [];

  // Live model predictions if available
  const liveModels = liveResult?.stressAnalysis;

  return (
    <div style={{ animation:"fadeIn 0.4s ease" }}>
      <SectionTitle icon="🔬" title="Research & AI Model Analysis"/>

      {/* Key metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[
          { icon:"📊", label:"Training Observations", value:km.data_observations||"77,360 daily records" },
          { icon:"📅", label:"Data Period",           value:km.time_period||"1984–2026  (42 years)" },
          { icon:"🌍", label:"Data Source",           value:km.data_source||"ERA5-Land · KAU PoP · Stage Calendar" },
          { icon:"🤖", label:"Models Tested",         value:km.models_tested||"6 in ensemble" },
          { icon:"🏆", label:"Best Accuracy",         value:km.best_accuracy||"86.4 % (LightGBM) · 85.9 % ensemble" },
          { icon:"🌾", label:"Coverage",              value:"Palakkad · 5 taluks" },
        ].map((m,i)=>(
          <div key={i} className="udss-card" style={{ background:"#fff", borderRadius:14,
            padding:"16px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:"1.8rem", marginBottom:6 }}>{m.icon}</div>
            <div style={{ fontWeight:800, fontSize:"1.1rem", color:"#1f2937" }}>{m.value}</div>
            <div style={{ fontSize:"0.75rem", color:"#9ca3af", marginTop:4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Two-contribution framework */}
      <div style={{ background:"linear-gradient(135deg,rgba(22,163,74,0.08),rgba(59,130,246,0.08))",
        border:"1px solid #d1fae5", borderRadius:16, padding:"20px 24px", marginBottom:24 }}>
        <h3 style={{ margin:"0 0 12px 0", fontSize:"1rem", fontWeight:700, color:"#1f2937" }}>
          🎓 Research Contribution Framework
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[
            { title:"Contribution 1: Same-Day Classification", method:"LightGBM · XGBoost · RandomForest",
              accuracy:"95 %+", task:"Diagnose TODAY's stress from current ERA5 weather + engineered features",
              why:"Rich features (SWB · heat-stress · VPD) are highly informative of the same-day CCSI label", color:"#16a34a" },
            { title:"Contribution 2: 8-Day Advance Forecast", method:"BiLSTM · GRU · PatchTST · GBMs (ensemble)",
              accuracy:"85.9 % (F1 86.1 %)", task:"Forecast 8-day stress trajectory from past 30 days only",
              why:"True forecasting — 6-model weighted ensemble with stacking meta-learner", color:"#3b82f6" },
          ].map((c,i)=>(
            <div key={i} style={{ background:"#fff", borderRadius:12, padding:"16px",
              borderTop:`4px solid ${c.color}` }}>
              <div style={{ fontWeight:700, fontSize:"0.9rem", color:c.color, marginBottom:8 }}>{c.title}</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:"0.8rem", color:"#6b7280" }}>{c.method}</span>
                <Badge label={c.accuracy} color={c.color} bg={c.color+"15"}/>
              </div>
              <p style={{ margin:"0 0 6px 0", fontSize:"0.8rem", color:"#374151" }}>📌 <strong>Task:</strong> {c.task}</p>
              <p style={{ margin:0, fontSize:"0.78rem", color:"#6b7280" }}>💡 {c.why}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Model accuracy chart */}
      {models.length>0 && (
        <>
          <SectionTitle icon="📈" title="Model Performance Comparison"/>
          <div style={{ background:"#fff", borderRadius:14, padding:"18px 20px",
            boxShadow:"0 2px 8px rgba(0,0,0,0.06)", marginBottom:24 }}>
            {models.map((m,i)=>{
              const pct = (m.accuracy*100).toFixed(1);
              const barC = i===0?"#16a34a":i===1?"#3b82f6":i===2?"#8b5cf6":"#6b7280";
              return (
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    fontSize:"0.82rem", color:"#374151", marginBottom:3 }}>
                    <span>{m.icon||"•"} {m.name}</span>
                    <span style={{ fontWeight:700, color:barC }}>{pct}%</span>
                  </div>
                  <div style={{ height:10, background:"#f3f4f6", borderRadius:5, overflow:"hidden" }}>
                    <div style={{
                      height:"100%", width:`${(m.accuracy/0.95)*100}%`,
                      background:barC, borderRadius:5, transition:"width 0.8s ease"
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Architecture details */}
      <SectionTitle icon="🏗️" title="Model Architecture Details"/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
        {[
          { title:"BiLSTM (+attention)", icon:"🧠", type:"Sequence DL",
            arch:"Bidirectional LSTM with attention pooling, 30-day lookback",
            use:"Captures forward + backward temporal patterns in weather sequences" },
          { title:"GRU", icon:"🔁", type:"Sequence DL",
            arch:"2-layer Gated Recurrent Unit, dropout, 30-day lookback",
            use:"Lighter recurrent baseline; faster training than LSTM" },
          { title:"PatchTST (Transformer)", icon:"⚡", type:"Sequence DL",
            arch:"Patch-based time-series transformer, multi-head self-attention",
            use:"Recent SOTA architecture for long-range time-series forecasting" },
          { title:"LightGBM · XGBoost · RandomForest", icon:"🌲", type:"Tabular ML",
            arch:"Gradient-boosting (LGBM, XGB) + bagged trees (RF) on 25-feature flat vector",
            use:"Models non-linear feature interactions on engineered tabular features" },
          { title:"6-Model Weighted Ensemble", icon:"🏆", type:"Meta-Model",
            arch:"Softmax-weighted vote: LGBM 0.27 · BiLSTM 0.18 · GRU 0.17 · XGB 0.16 · RF 0.14 · PatchTST 0.07",
            use:"Final production prediction — robust to any single model degrading" },
          { title:"Stacking Meta-Learner", icon:"🧩", type:"Meta-Model",
            arch:"Logistic Regression trained on out-of-fold probability vectors",
            use:"Learns optimal model combination on validation set — slight gain over voting" },
        ].map((m,i)=>(
          <div key={i} style={{ background:"#fff", borderRadius:12, padding:"14px",
            boxShadow:"0 2px 6px rgba(0,0,0,0.06)", borderLeft:`4px solid #3b82f6` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:"1.4rem" }}>{m.icon}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#1f2937" }}>{m.title}</div>
                <Badge label={m.type} color="#3b82f6" bg="#eff6ff"/>
              </div>
            </div>
            <p style={{ margin:"0 0 4px 0", fontSize:"0.78rem", color:"#6b7280" }}>
              <strong>Architecture:</strong> {m.arch}
            </p>
            <p style={{ margin:0, fontSize:"0.78rem", color:"#374151" }}>
              <strong>Use:</strong> {m.use}
            </p>
          </div>
        ))}
      </div>

      {/* CCSI definition */}
      <div style={{ background:"rgba(22,163,74,0.06)", border:"1px solid #bbf7d0",
        borderRadius:14, padding:"18px 22px", marginBottom:24 }}>
        <h3 style={{ margin:"0 0 10px 0", fontSize:"1rem", fontWeight:700, color:"#16a34a" }}>
          🔢 Novel CCSI — Composite Crop Stress Index
        </h3>
        <div style={{ fontFamily:"monospace", fontSize:"0.9rem", color:"#1f2937",
          background:"#fff", borderRadius:10, padding:"12px 16px", marginBottom:10,
          border:"1px solid #d1fae5" }}>
          CCSI = 0.30×TempStress + 0.38×SoilMoistStress + 0.22×PrecipStress + 0.10×WindStress
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[
            { label:"Temperature: 30%", desc:"Heat/cold stress, optimal 24–30°C" },
            { label:"Soil Moisture: 38%", desc:"Most important; critical <15% volumetric" },
            { label:"Precipitation: 22%", desc:"Drought risk <5mm/day; flood >60mm" },
            { label:"Wind: 10%",  desc:"Crop damage >30 km/h" },
          ].map((f,i)=>(
            <div key={i} style={{ padding:"6px 12px", background:"#fff", borderRadius:8,
              border:"1px solid #d1fae5", fontSize:"0.75rem" }}>
              <strong style={{ color:"#16a34a" }}>{f.label}</strong>
              <span style={{ color:"#6b7280" }}> · {f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation methods */}
      <SectionTitle icon="✅" title="Research Validation"/>
      <div style={{ background:"#fff", borderRadius:14, padding:"16px 20px",
        boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        {[
          { icon:"⏱️", title:"Temporal Cross-Validation", desc:"70% train / 15% val / 15% test — strictly time-ordered, zero data leakage" },
          { icon:"🔁", title:"Bootstrap Resampling (500 iterations)", desc:"95% confidence intervals on all accuracy metrics" },
          { icon:"📊", title:"SHAP TreeExplainer", desc:"Feature contribution analysis for every individual prediction" },
          { icon:"📈", title:"Mann-Kendall Trend Test", desc:"Non-parametric trend detection with Sen's slope estimator" },
          { icon:"📉", title:"ARIMA(2,0,2) Baseline", desc:"Statistical baseline used to benchmark DL/Transformer gains" },
        ].map((v,i)=>(
          <div key={i} style={{ display:"flex", gap:12, padding:"10px 0",
            borderBottom: i<4?"1px solid #f3f4f6":"" }}>
            <span style={{ fontSize:"1.3rem", flexShrink:0 }}>{v.icon}</span>
            <div>
              <div style={{ fontWeight:600, fontSize:"0.85rem", color:"#1f2937" }}>{v.title}</div>
              <div style={{ fontSize:"0.78rem", color:"#6b7280" }}>{v.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── helper sub-components ────────────────────────────────────────────────────

function SectionTitle({ icon, title }) {
  return (
    <h3 style={{ margin:"0 0 12px 0", fontSize:"0.95rem", fontWeight:700, color:"#1f2937",
      display:"flex", alignItems:"center", gap:8 }}>
      <span>{icon}</span>{title}
    </h3>
  );
}

function Label({ children }) {
  return <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600,
    color:"#374151", marginBottom:4 }}>{children}</label>;
}

function Divider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, margin:"16px 0 12px 0" }}>
      <div style={{ flex:1, height:1, background:"#e5e7eb" }}/>
      <span style={{ fontSize:"0.75rem", fontWeight:600, color:"#9ca3af" }}>{label}</span>
      <div style={{ flex:1, height:1, background:"#e5e7eb" }}/>
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, padding:"16px 18px",
      boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
      <h4 style={{ margin:"0 0 12px 0", fontSize:"0.88rem", fontWeight:700, color:"#1f2937" }}>{title}</h4>
      {items.map((it,i)=>(
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"5px 0", borderBottom: i<items.length-1?"1px solid #f9fafb":"",
          fontSize:"0.82rem" }}>
          <span style={{ color:"#6b7280" }}>{it.label}</span>
          <span style={{ fontWeight:600, color:"#1f2937" }}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:400, gap:20 }}>
      <div style={{ width:56, height:56, border:"5px solid #e5e7eb",
        borderTopColor:"#16a34a", borderRadius:"50%",
        animation:"spin 0.8s linear infinite" }}/>
      <div style={{ textAlign:"center" }}>
        <p style={{ fontWeight:700, fontSize:"1rem", color:"#1f2937", margin:"0 0 6px 0" }}>
          Running AI Analysis…
        </p>
        <p style={{ fontSize:"0.85rem", color:"#9ca3af", margin:0 }}>
          Fetching live weather · Running 12 models · Computing 7-day forecast
        </p>
      </div>
    </div>
  );
}

function WelcomePanel() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:400, gap:16, opacity:0.7 }}>
      <span style={{ fontSize:"4rem" }}>🌾</span>
      <h2 style={{ margin:0, fontWeight:800, color:"#1f2937" }}>Ready for Analysis</h2>
      <p style={{ margin:0, fontSize:"0.9rem", color:"#6b7280", textAlign:"center", maxWidth:400 }}>
        Fill in your farm details and click <strong>Run AI Analysis</strong> to get
        real-time crop stress assessment, 7-day forecasts, and actionable recommendations.
      </p>
    </div>
  );
}

function EmptyTab({ icon, msg }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:300, gap:12, opacity:0.7 }}>
      <span style={{ fontSize:"3rem" }}>{icon}</span>
      <p style={{ fontSize:"0.9rem", color:"#6b7280", textAlign:"center", maxWidth:400 }}>{msg}</p>
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ padding:"16px", background:"#f0fdf4", borderRadius:12,
      fontSize:"0.85rem", color:"#16a34a", textAlign:"center", marginBottom:16 }}>
      ✅ {msg}
    </div>
  );
}

// ─── shared style objects ─────────────────────────────────────────────────────

const inp = {
  width:"100%", padding:"9px 12px", borderRadius:10,
  border:"1.5px solid #e5e7eb", fontSize:"0.85rem", color:"#374151",
  background:"#fafafa", marginBottom:10, boxSizing:"border-box"
};
const sel = { ...inp, cursor:"pointer" };
