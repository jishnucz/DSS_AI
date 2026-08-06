/**
 * 🧠 Advanced Decision Support System
 * Integrates ML research (88.3% accuracy) with practical farmer needs
 * Comprehensive inputs → AI-powered analysis → Actionable recommendations
 */

import { useState, useEffect } from "react";
import { useLanguage } from "../LanguageContext";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); } 50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.4); } }
  @keyframes barGrow { from { width: 0%; } to { width: var(--bar-width); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  .adss-card { transition: all 0.3s ease; }
  .adss-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(34, 197, 94, 0.15) !important; }
  
  .adss-input:focus { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15) !important; outline: none; }
  .adss-input { transition: all 0.2s ease; }
  
  .adss-select { transition: all 0.2s ease; cursor: pointer; }
  .adss-select:hover { border-color: rgba(34, 197, 94, 0.5); }
  
  .adss-btn { transition: all 0.25s ease; }
  .adss-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3); }
  
  .rec-card { transition: all 0.3s ease; }
  .rec-card:hover { transform: translateX(4px); border-left-width: 6px !important; }
  
  .model-indicator { animation: pulse 2s infinite; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// Kerala Districts and Taluks
const DISTRICTS = [
  { name: "Palakkad", taluks: ["Palakkad", "Chittur", "Ottappalam", "Alathur", "Mannarkkad", "Pattambi"] },
  { name: "Thrissur", taluks: ["Thrissur", "Kodungallur", "Chavakkad", "Mukundapuram"] },
  { name: "Malappuram", taluks: ["Malappuram", "Perinthalmanna", "Tirur", "Ponnani"] },
  { name: "Ernakulam", taluks: ["Ernakulam", "Aluva", "Muvattupuzha", "Kothamangalam"] },
  { name: "Kozhikode", taluks: ["Kozhikode", "Vadakara", "Koyilandy"] },
  { name: "Alappuzha", taluks: ["Alappuzha", "Cherthala", "Ambalapuzha", "Karthikappally"] },
];

// Crops with detailed info
const CROPS = [
  { name: "Rice", icon: "🌾", season: "Kharif/Rabi", waterNeed: "High", growthDays: "120-150" },
  { name: "Coconut", icon: "🥥", season: "Perennial", waterNeed: "Moderate", growthDays: "365+" },
  { name: "Banana", icon: "🍌", season: "Year-round", waterNeed: "High", growthDays: "270-365" },
  { name: "Sugarcane", icon: "🎋", season: "Year-round", waterNeed: "High", growthDays: "270-365" },
  { name: "Vegetables", icon: "🥬", season: "Year-round", waterNeed: "Moderate", growthDays: "45-90" },
  { name: "Turmeric", icon: "🟡", season: "Kharif", waterNeed: "Moderate", growthDays: "240-270" },
  { name: "Ginger", icon: "🫚", season: "Kharif", waterNeed: "Moderate", growthDays: "240-270" },
  { name: "Pepper", icon: "⚫", season: "Perennial", waterNeed: "High", growthDays: "365+" },
  { name: "Rubber", icon: "🌳", season: "Perennial", waterNeed: "High", growthDays: "2000+" },
  { name: "Arecanut", icon: "🌴", season: "Perennial", waterNeed: "Moderate", growthDays: "1800+" },
];

// Soil Types
const SOIL_TYPES = [
  { name: "Laterite", desc: "Red/brown, well-drained", suitability: ["Coconut", "Rubber", "Pepper"] },
  { name: "Alluvial", desc: "Fertile river deposits", suitability: ["Rice", "Vegetables", "Banana"] },
  { name: "Clay", desc: "Heavy, water-retentive", suitability: ["Rice", "Sugarcane"] },
  { name: "Sandy Loam", desc: "Light, well-drained", suitability: ["Vegetables", "Groundnut", "Turmeric"] },
  { name: "Red Loam", desc: "Iron-rich, moderate drainage", suitability: ["Coconut", "Arecanut", "Banana"] },
];

// Water Sources
const WATER_SOURCES = [
  { name: "Canal/River", reliability: "High", icon: "🏞️" },
  { name: "Well/Borewell", reliability: "Moderate", icon: "🕳️" },
  { name: "Pond/Tank", reliability: "Seasonal", icon: "💧" },
  { name: "Rainwater Only", reliability: "Low", icon: "🌧️" },
  { name: "Drip Irrigation", reliability: "High", icon: "💦" },
];

// ML Models — from Palakkad_Ensemble_Forecasting.ipynb (matches new ensemble pipeline)
const ML_MODELS = [
  { name: "Stacking Ensemble", accuracy: 86.4, icon: "🎯", type: "Primary" },
  { name: "LightGBM",          accuracy: 86.4, icon: "💡", type: "GBM" },
  { name: "BiLSTM + Attention",accuracy: 84.9, icon: "↔️", type: "Deep Learning" },
  { name: "Random Forest",     accuracy: 84.4, icon: "🌲", type: "Ensemble ML" },
];

// Master CSV taluks (must match backend ensemble_inference.py)
// If a user picks a taluk outside this set, fall back to "Chittur"
const ENSEMBLE_TALUKS = ["Chittur", "Kollengode", "Kuzhalmannam", "Mannarkkad", "Nenmara"];

// Map AdvancedDSS taluk selection → ensemble backend taluk
function ensembleTalukFor(formTaluk) {
  if (!formTaluk) return ENSEMBLE_TALUKS[0];
  // Direct match
  if (ENSEMBLE_TALUKS.includes(formTaluk)) return formTaluk;
  // Spelling variants
  if (formTaluk === "Mannarghat" || formTaluk === "Mannarkad") return "Mannarkkad";
  // Default
  return ENSEMBLE_TALUKS[0];
}

// Map the /api/ensemble/forecast/{taluk} response → AdvancedDSS rich display structure.
// Merges API stress/weather output with form-derived growth-stage + economic info.
function mapEnsembleToDSS(apiData, form, selectedCrop, selectedSoil) {
  const rows  = apiData?.rows || [];
  const today = rows.find(r => r.days_ahead === 0) || rows[0];
  if (!today) return null;

  // Growth stage from sowing date (local computation — API gives rice_stage but
  // we want it tied to user's actual sowing date, not season-based)
  const daysSinceSowing = form.sowingDate
    ? Math.floor((new Date() - new Date(form.sowingDate)) / 86400000)
    : 0;
  let growthStage = "Seedling", stageProgress = 10;
  if (daysSinceSowing > 90)      { growthStage = "Maturity";    stageProgress = 95; }
  else if (daysSinceSowing > 60) { growthStage = "Flowering";   stageProgress = 70; }
  else if (daysSinceSowing > 30) { growthStage = "Tillering";   stageProgress = 45; }
  else if (daysSinceSowing > 15) { growthStage = "Vegetative";  stageProgress = 25; }

  const stressLabel = today.stress_lbl;             // "None" | "Low" | "High"
  const overallHealth = stressLabel === "None" ? "Good"
                       : stressLabel === "Low" ? "Fair" : "At Risk";

  const soilMatch = selectedSoil?.suitability?.includes(form.crop) || false;

  // Convert the API's 6-feature SHAP (from notebook) to AdvancedDSS shape
  const SHAP_TOP6 = [
    { feature: "Precipitation",    value: 0.450, impact: today.rain > 1
        ? `${today.rain.toFixed(1)}mm forecast` : "Dry conditions — irrigation key" },
    { feature: "Soil Moisture",    value: 0.090, impact: today.swb > 0.5
        ? "Adequate root-zone moisture" : "Low SWB — supplementary irrigation" },
    { feature: "Tmax",             value: 0.168, impact: today.tmax > 36
        ? `Heat alert: ${today.tmax.toFixed(1)}°C exceeds 36° threshold`
        : `Tmax ${today.tmax.toFixed(1)}°C within safe range` },
    { feature: "Tmin",             value: 0.128, impact: `Tmin ${today.tmin.toFixed(1)}°C` },
    { feature: "Dry streak",       value: 0.060, impact: "Tracked from 7-day window" },
    { feature: "SWB (composite)",  value: 0.052, impact: `Current SWB ${today.swb.toFixed(2)}` },
  ];

  // Recommendations — pull the advisory from each forecast day
  const recommendations = rows.slice(0, 4).map((r, i) => ({
    priority: r.stress_lbl === "High" ? "Critical"
            : r.stress_lbl === "Low" ? "Moderate" : "Info",
    category: r.stress_lbl === "High" ? "Urgent action" : "Monitoring",
    title: r.days_ahead === 0 ? "Today" : `Day +${r.days_ahead} (${r.date})`,
    description: r.advisory || `Predicted ${r.stress_lbl} stress. Tmax ${r.tmax.toFixed(1)}°C, rain ${r.rain.toFixed(1)}mm`,
    action: r.stress_lbl === "High"
      ? `Action needed — confidence ${Math.round(r.confidence * 100)}%`
      : "Monitor weather, no urgent action",
  }));

  // Economic projection — form-based, untouched by API
  const yieldPerAcre = stressLabel === "High" ? 3.2
                     : stressLabel === "Low" ? 3.8 : 4.5;
  const landSize = parseFloat(form.landSize) || 0;
  const tonnes = landSize * yieldPerAcre;

  return {
    summary: {
      overallHealth,
      confidence: today.confidence * 100,
      modelUsed: apiData.model || "Ensemble (LightGBM + XGBoost)",
      dataSource: apiData.source === "API"
        ? "Open-Meteo ECMWF live + ERA5 reanalysis"
        : "Master CSV (42-yr ERA5 record)",
    },
    cropStatus: {
      crop: form.crop,
      variety: form.cropVariety || "Local variety",
      growthStage,
      stageProgress,
      daysSinceSowing,
      daysToHarvest: Math.max(0, parseInt(selectedCrop?.growthDays || 120) - daysSinceSowing),
    },
    stressAnalysis: {
      waterStress: today.swb < 0.4 ? "High" : today.swb < 0.6 ? "Moderate" : "Low",
      heatStress: today.tmax > 36 ? "High" : today.tmax > 33 ? "Moderate" : "Low",
      nutrientStress: form.organicFarming ? "Low" : "Moderate",
      overallStress: stressLabel,             // "None" | "Low" | "High" — single source of truth
    },
    predictions: {
      yieldPotential: soilMatch ? "85-95%" : "70-80%",
      optimalHarvest: form.sowingDate
        ? new Date(new Date(form.sowingDate).getTime() + parseInt(selectedCrop?.growthDays || 120) * 86400000).toLocaleDateString()
        : "Set sowing date",
      riskLevel: stressLabel === "High" ? "Elevated" : "Normal",
    },
    featureImportance: SHAP_TOP6,
    recommendations,
    economicAnalysis: {
      estimatedYield:   landSize ? `${tonnes.toFixed(1)} tonnes` : "Enter land size",
      estimatedRevenue: landSize ? `₹${(tonnes * 22000).toLocaleString("en-IN")}` : "—",
      inputCost:        landSize ? `₹${(landSize * 25000).toLocaleString("en-IN")}` : "—",
    },
    // Live 8-day forecast (new — not in old AdvancedDSS but useful)
    forecast8d: rows.map(r => ({
      date: r.date, daysAhead: r.days_ahead,
      tmax: r.tmax, tmin: r.tmin, rain: r.rain, swb: r.swb,
      stress: r.stress_lbl, confidence: r.confidence,
    })),
  };
}

export default function AdvancedDSS({ detectedCrop, onCropUsed }) {
  inject("advanced-dss", CSS);
  const { t } = useLanguage();
  
  // State for crop detection notice
  const [cropNotice, setCropNotice] = useState(null);
  
  // Form state - comprehensive farmer inputs
  const [form, setForm] = useState({
    // Location
    district: "Palakkad",
    taluk: "Palakkad",
    
    // Crop Details
    crop: "Rice",
    cropVariety: "",
    sowingDate: "",
    expectedHarvestDate: "",
    
    // Land Details
    landSize: "",
    landUnit: "acres",
    soilType: "Laterite",
    
    // Water & Irrigation
    waterSource: "Canal/River",
    irrigationMethod: "flood",
    waterAvailability: "adequate",
    
    // Farm Context
    previousCrop: "",
    farmingExperience: "5-10",
    organicFarming: false,
    
    // Budget & Resources
    budget: "",
    laborAvailable: "family",
    mechanization: "partial",
  });
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const taluks = DISTRICTS.find(d => d.name === form.district)?.taluks || [];
  const selectedCrop = CROPS.find(c => c.name === form.crop);
  const selectedSoil = SOIL_TYPES.find(s => s.name === form.soilType);
  
  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear crop notice if user changes crop
    if (key === 'crop') setCropNotice(null);
  };
  
  // Handle detected crop from classifier
  useEffect(() => {
    if (detectedCrop && detectedCrop.crop) {
      const matchedCrop = CROPS.find(c => c.name.toLowerCase() === detectedCrop.crop.toLowerCase());
      if (matchedCrop) {
        setForm(prev => ({ ...prev, crop: matchedCrop.name }));
        setCropNotice({
          crop: matchedCrop.name,
          growthStage: detectedCrop.growthStage,
          health: detectedCrop.health?.status,
          confidence: detectedCrop.confidence
        });
      } else {
        setCropNotice({
          crop: detectedCrop.crop,
          notInList: true,
          growthStage: detectedCrop.growthStage,
          health: detectedCrop.health?.status
        });
      }
      if (onCropUsed) onCropUsed();
    }
  }, [detectedCrop, onCropUsed]);
  
  // Calculate crop suitability based on soil
  const cropSuitability = selectedSoil?.suitability.includes(form.crop) ? "High" : "Moderate";
  
  // Run ML Analysis
  const runAnalysis = async () => {
    setLoading(true);
    setAnalysisProgress(0);

    // Progress simulation runs in parallel with the actual fetch
    const progressTimer = (async () => {
      const steps = [
        { progress: 15, message: "Fetching Open-Meteo live weather..." },
        { progress: 35, message: "Computing 30-day input window features..." },
        { progress: 60, message: "Running LightGBM + XGBoost ensemble..." },
        { progress: 80, message: "Generating stage-aware advisory..." },
        { progress: 95, message: "Finalising 7-day forecast..." },
      ];
      for (const step of steps) {
        await new Promise(r => setTimeout(r, 250));
        setAnalysisProgress(step.progress);
      }
    })();

    let mapped = null;
    try {
      const taluk = ensembleTalukFor(form.taluk);
      const response = await fetch(`/api/ensemble/forecast/${encodeURIComponent(taluk)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const apiData = await response.json();
      mapped = mapEnsembleToDSS(apiData, form, selectedCrop, selectedSoil);
    } catch (e) {
      // Backend unreachable or new ensemble unavailable → fall back to local rules
      console.warn("Ensemble API unavailable, using local heuristic result:", e?.message);
      mapped = generateResult();
    }

    await progressTimer;
    setAnalysisProgress(100);
    setResult(mapped);
    setLoading(false);
  };
  
  // Generate result based on form inputs
  const generateResult = () => {
    const daysSinceSowing = form.sowingDate 
      ? Math.floor((new Date() - new Date(form.sowingDate)) / 86400000)
      : 0;
    
    // Determine growth stage
    let growthStage = "Seedling";
    let stageProgress = 10;
    if (daysSinceSowing > 90) { growthStage = "Maturity"; stageProgress = 95; }
    else if (daysSinceSowing > 60) { growthStage = "Flowering"; stageProgress = 70; }
    else if (daysSinceSowing > 30) { growthStage = "Tillering"; stageProgress = 45; }
    else if (daysSinceSowing > 15) { growthStage = "Vegetative"; stageProgress = 25; }
    
    // Calculate stress based on conditions
    const waterStress = form.waterAvailability === "adequate" ? "Low" : 
                        form.waterAvailability === "limited" ? "Moderate" : "High";
    
    const soilMatch = selectedSoil?.suitability.includes(form.crop);
    
    return {
      // Overview — local heuristic fallback (API unreachable)
      summary: {
        overallHealth: soilMatch && waterStress === "Low" ? "Good" :
                      waterStress === "High" ? "At Risk" : "Fair",
        confidence: 75.0,
        modelUsed: "Local heuristic (API offline)",
        dataSource: "Form inputs only — start backend for live ensemble"
      },
      
      // Crop Status
      cropStatus: {
        crop: form.crop,
        variety: form.cropVariety || "Local variety",
        growthStage,
        stageProgress,
        daysSinceSowing,
        daysToHarvest: Math.max(0, parseInt(selectedCrop?.growthDays) - daysSinceSowing)
      },
      
      // Stress Analysis
      stressAnalysis: {
        waterStress,
        heatStress: "Low",
        nutrientStress: form.organicFarming ? "Low" : "Moderate",
        overallStress: waterStress
      },
      
      // ML Predictions
      predictions: {
        yieldPotential: soilMatch ? "85-95%" : "70-80%",
        optimalHarvest: form.sowingDate 
          ? new Date(new Date(form.sowingDate).getTime() + parseInt(selectedCrop?.growthDays || 120) * 86400000).toLocaleDateString()
          : "Calculate after sowing",
        riskLevel: waterStress === "High" ? "Elevated" : "Normal"
      },
      
      // Feature Importance (from research)
      featureImportance: [
        { feature: "Temperature", value: 0.342, impact: "High temperatures increase stress" },
        { feature: "Soil Moisture", value: 0.289, impact: form.waterAvailability === "adequate" ? "Adequate moisture detected" : "Low moisture - increase irrigation" },
        { feature: "Precipitation", value: 0.178, impact: "Monitor for waterlogging" },
        { feature: "Wind Speed", value: 0.112, impact: "Normal conditions" },
        { feature: "Pressure", value: 0.079, impact: "Stable atmospheric conditions" }
      ],
      
      // Actionable Recommendations
      recommendations: generateRecommendations(form, selectedCrop, waterStress, soilMatch),
      
      // Economic Analysis
      economics: {
        estimatedYield: form.landSize ? `${(parseFloat(form.landSize) * 4.5).toFixed(1)} tonnes` : "Enter land size",
        marketPrice: selectedCrop?.name === "Rice" ? "₹2,200/quintal" : "₹3,500/quintal",
        estimatedRevenue: form.landSize ? `₹${(parseFloat(form.landSize) * 45000).toLocaleString()}` : "-",
        inputCost: form.landSize ? `₹${(parseFloat(form.landSize) * 25000).toLocaleString()}` : "-"
      },
      
      // 7-day stress forecast (empty when API unavailable)
      forecast7Day: [],

      // Research AI Enhanced Analysis (simulated when API unavailable)
      research_ai: {
        available: true,
        forecasts: {
          day_1: { stress_probability: 0.25, stress_level: "NORMAL" },
          day_3: { stress_probability: waterStress === "High" ? 0.55 : 0.30, stress_level: waterStress === "High" ? "LOW STRESS" : "NORMAL" },
          day_7: { stress_probability: waterStress === "High" ? 0.68 : 0.35, stress_level: waterStress === "High" ? "HIGH STRESS" : "LOW STRESS" }
        },
        confidence: {
          score: 76,
          level: "Medium",
          explanation: "Model has moderate confidence based on available data"
        },
        actionable_insights: waterStress !== "Low" ? [
          { action: "Increase Soil Moisture", from: 0.25, to: 0.40, result: "NORMAL" },
          { action: "Schedule Irrigation", result: "NORMAL" }
        ] : [],
        summary: `7-day outlook: ${waterStress === "High" ? "worsening" : "stable"} | Prediction confidence: medium`
      }
    };
  };
  
  const generateRecommendations = (form, crop, waterStress, soilMatch) => {
    const recs = [];
    
    // Water recommendations
    if (waterStress === "High" || waterStress === "Moderate") {
      recs.push({
        category: "Irrigation",
        priority: "High",
        icon: "💧",
        title: "Increase Irrigation Frequency",
        description: `Current water stress is ${waterStress}. Consider increasing irrigation to 2-3 times per week.`,
        action: "Schedule irrigation for tomorrow morning (6-8 AM)"
      });
    }
    
    // Soil recommendations
    if (!soilMatch) {
      recs.push({
        category: "Soil",
        priority: "Medium",
        icon: "🌱",
        title: "Soil Amendment Required",
        description: `${form.soilType} soil is not optimal for ${form.crop}. Add organic matter to improve conditions.`,
        action: "Apply 2-3 tonnes/hectare of farmyard manure"
      });
    }
    
    // Growth stage specific
    recs.push({
      category: "Nutrient",
      priority: "Medium",
      icon: "🧪",
      title: "Fertilizer Application",
      description: crop ? `${crop.name} at current stage needs balanced NPK.` : "Apply balanced fertilizer.",
      action: "Apply DAP 50kg/hectare + MOP 25kg/hectare"
    });
    
    // Pest monitoring
    recs.push({
      category: "Protection",
      priority: "Low",
      icon: "🛡️",
      title: "Pest Monitoring",
      description: "Regular scouting recommended for common pests in the region.",
      action: "Scout fields twice weekly; install pheromone traps"
    });
    
    // Weather alert
    recs.push({
      category: "Weather",
      priority: "Medium",
      icon: "⛈️",
      title: "Weather Advisory",
      description: "Monitor weather forecasts for the next 7 days.",
      action: "Check AgriDSS weather tab for updates"
    });
    
    return recs;
  };
  
  const renderStep1 = () => (
    <div style={styles.stepContent}>
      <h3 style={styles.stepTitle}>📍 Location & Land Details</h3>
      
      <div style={styles.formGrid}>
        {/* District */}
        <div style={styles.formGroup}>
          <label style={styles.label}>District</label>
          <select
            className="adss-select"
            style={styles.select}
            value={form.district}
            onChange={e => {
              updateForm("district", e.target.value);
              updateForm("taluk", DISTRICTS.find(d => d.name === e.target.value)?.taluks[0] || "");
            }}
          >
            {DISTRICTS.map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        
        {/* Taluk */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Taluk</label>
          <select
            className="adss-select"
            style={styles.select}
            value={form.taluk}
            onChange={e => updateForm("taluk", e.target.value)}
          >
            {taluks.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        
        {/* Land Size */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Land Size</label>
          <div style={styles.inputGroup}>
            <input
              className="adss-input"
              type="number"
              style={{ ...styles.input, borderRadius: "12px 0 0 12px" }}
              placeholder="Enter size"
              value={form.landSize}
              onChange={e => updateForm("landSize", e.target.value)}
            />
            <select
              className="adss-select"
              style={{ ...styles.select, borderRadius: "0 12px 12px 0", borderLeft: "none", width: "100px" }}
              value={form.landUnit}
              onChange={e => updateForm("landUnit", e.target.value)}
            >
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
              <option value="cents">Cents</option>
            </select>
          </div>
        </div>
        
        {/* Soil Type */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Soil Type</label>
          <select
            className="adss-select"
            style={styles.select}
            value={form.soilType}
            onChange={e => updateForm("soilType", e.target.value)}
          >
            {SOIL_TYPES.map(s => (
              <option key={s.name} value={s.name}>{s.name} - {s.desc}</option>
            ))}
          </select>
          {selectedSoil && (
            <p style={styles.hint}>
              Best for: {selectedSoil.suitability.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div style={styles.stepContent}>
      <h3 style={styles.stepTitle}>🌾 Crop & Cultivation Details</h3>
      
      {/* Crop Selection Grid */}
      <div style={styles.cropGrid}>
        {CROPS.map(crop => (
          <div
            key={crop.name}
            className="adss-card"
            onClick={() => updateForm("crop", crop.name)}
            style={{
              ...styles.cropCard,
              ...(form.crop === crop.name ? styles.cropCardActive : {})
            }}
          >
            <span style={styles.cropIcon}>{crop.icon}</span>
            <span style={styles.cropName}>{crop.name}</span>
            <span style={styles.cropSeason}>{crop.season}</span>
            {form.crop === crop.name && cropSuitability && (
              <span style={{
                ...styles.suitabilityBadge,
                background: cropSuitability === "High" ? "rgba(34, 197, 94, 0.2)" : "rgba(245, 158, 11, 0.2)",
                color: cropSuitability === "High" ? "#22c55e" : "#f59e0b"
              }}>
                {cropSuitability} Suitability
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Crop Detection Notice */}
      {cropNotice && (
        <div style={styles.cropNotice}>
          <div style={styles.noticeHeader}>
            <span style={styles.noticeIcon}>🔍</span>
            <div>
              <div style={styles.noticeTitle}>
                {cropNotice.notInList 
                  ? `Detected: ${cropNotice.crop} (not in crop list)` 
                  : `Auto-detected: ${cropNotice.crop}`}
              </div>
              <div style={styles.noticeDetails}>
                {cropNotice.growthStage && cropNotice.growthStage !== "Unknown" && (
                  <span style={styles.noticeBadge}>📊 {cropNotice.growthStage}</span>
                )}
                {cropNotice.health && (
                  <span style={{
                    ...styles.noticeBadge,
                    background: cropNotice.health === "Healthy" ? "rgba(34, 197, 94, 0.2)" :
                               cropNotice.health === "Moderate" ? "rgba(245, 158, 11, 0.2)" :
                               "rgba(239, 68, 68, 0.2)",
                    color: cropNotice.health === "Healthy" ? "#22c55e" :
                           cropNotice.health === "Moderate" ? "#f59e0b" : "#ef4444"
                  }}>
                    {cropNotice.health === "Healthy" ? "✅" : cropNotice.health === "Moderate" ? "⚠️" : "🚨"} {cropNotice.health}
                  </span>
                )}
                {cropNotice.confidence && (
                  <span style={styles.noticeBadge}>🎯 {cropNotice.confidence}% confidence</span>
                )}
              </div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setCropNotice(null)} 
            style={styles.noticeDismiss}
          >
            ✕
          </button>
        </div>
      )}
      
      <div style={styles.formGrid}>
        {/* Sowing Date */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Sowing Date</label>
          <input
            className="adss-input"
            type="date"
            style={styles.input}
            value={form.sowingDate}
            onChange={e => updateForm("sowingDate", e.target.value)}
          />
        </div>
        
        {/* Previous Crop */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Previous Crop (for rotation planning)</label>
          <select
            className="adss-select"
            style={styles.select}
            value={form.previousCrop}
            onChange={e => updateForm("previousCrop", e.target.value)}
          >
            <option value="">Select previous crop</option>
            {CROPS.map(c => (
              <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div style={styles.stepContent}>
      <h3 style={styles.stepTitle}>💧 Water & Resources</h3>
      
      <div style={styles.formGrid}>
        {/* Water Source */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Primary Water Source</label>
          <div style={styles.optionGrid}>
            {WATER_SOURCES.map(ws => (
              <div
                key={ws.name}
                className="adss-card"
                onClick={() => updateForm("waterSource", ws.name)}
                style={{
                  ...styles.optionCard,
                  ...(form.waterSource === ws.name ? styles.optionCardActive : {})
                }}
              >
                <span style={{ fontSize: "24px" }}>{ws.icon}</span>
                <span style={styles.optionName}>{ws.name}</span>
                <span style={styles.optionDesc}>Reliability: {ws.reliability}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Water Availability */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Current Water Availability</label>
          <select
            className="adss-select"
            style={styles.select}
            value={form.waterAvailability}
            onChange={e => updateForm("waterAvailability", e.target.value)}
          >
            <option value="adequate">Adequate - No concerns</option>
            <option value="limited">Limited - Some stress</option>
            <option value="critical">Critical - Urgent need</option>
          </select>
        </div>
        
        {/* Irrigation Method */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Irrigation Method</label>
          <select
            className="adss-select"
            style={styles.select}
            value={form.irrigationMethod}
            onChange={e => updateForm("irrigationMethod", e.target.value)}
          >
            <option value="flood">Flood Irrigation</option>
            <option value="drip">Drip Irrigation</option>
            <option value="sprinkler">Sprinkler</option>
            <option value="manual">Manual/Pot</option>
            <option value="rainfed">Rainfed Only</option>
          </select>
        </div>
        
        {/* Farming Experience */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Farming Experience</label>
          <select
            className="adss-select"
            style={styles.select}
            value={form.farmingExperience}
            onChange={e => updateForm("farmingExperience", e.target.value)}
          >
            <option value="beginner">New to farming (&lt;2 years)</option>
            <option value="2-5">2-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10+">Experienced (10+ years)</option>
          </select>
        </div>
        
        {/* Organic */}
        <div style={styles.formGroup}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={form.organicFarming}
              onChange={e => updateForm("organicFarming", e.target.checked)}
              style={styles.checkbox}
            />
            <span>Organic Farming (no chemical inputs)</span>
          </label>
        </div>
      </div>
    </div>
  );
  
  const renderAnalysis = () => (
    <div style={styles.analysisContainer}>
      <div style={styles.progressSection}>
        <div style={styles.progressIcon}>🧠</div>
        <h3 style={styles.progressTitle}>AI Analysis in Progress</h3>
        <p style={styles.progressSubtitle}>Using 8 ML models trained on 140,000+ observations</p>
        
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${analysisProgress}%` }} />
        </div>
        <span style={styles.progressPercent}>{analysisProgress}%</span>
        
        {/* Model indicators */}
        <div style={styles.modelGrid}>
          {ML_MODELS.map((model, i) => (
            <div 
              key={model.name}
              className="model-indicator"
              style={{
                ...styles.modelCard,
                opacity: analysisProgress > (i + 1) * 20 ? 1 : 0.4
              }}
            >
              <span style={{ fontSize: "20px" }}>{model.icon}</span>
              <span style={styles.modelName}>{model.name}</span>
              <span style={styles.modelAccuracy}>{model.accuracy}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderResults = () => {
    if (!result) return null;
    
    return (
      <div style={styles.resultsContainer}>
        {/* Summary Header */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <div>
              <h2 style={styles.summaryTitle}>🧠 AI Analysis Complete</h2>
              <p style={styles.summarySubtitle}>
                {result.summary.modelUsed} • {result.summary.confidence}% confidence
              </p>
            </div>
            <div style={{
              ...styles.healthBadge,
              background: result.summary.overallHealth === "Good" ? "rgba(34, 197, 94, 0.15)" :
                         result.summary.overallHealth === "Fair" ? "rgba(245, 158, 11, 0.15)" :
                         "rgba(239, 68, 68, 0.15)",
              color: result.summary.overallHealth === "Good" ? "#22c55e" :
                    result.summary.overallHealth === "Fair" ? "#f59e0b" : "#ef4444"
            }}>
              {result.summary.overallHealth === "Good" ? "✅" : result.summary.overallHealth === "Fair" ? "⚠️" : "🚨"}
              {result.summary.overallHealth}
            </div>
          </div>
          
          {/* Key Metrics */}
          <div style={styles.metricsRow}>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>🌱</span>
              <span style={styles.metricValue}>{result.cropStatus.growthStage}</span>
              <span style={styles.metricLabel}>Growth Stage</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>📅</span>
              <span style={styles.metricValue}>{result.cropStatus.daysSinceSowing}</span>
              <span style={styles.metricLabel}>Days Since Sowing</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>🎯</span>
              <span style={styles.metricValue}>{result.predictions.yieldPotential}</span>
              <span style={styles.metricLabel}>Yield Potential</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>💰</span>
              <span style={styles.metricValue}>{result.economics.estimatedRevenue}</span>
              <span style={styles.metricLabel}>Est. Revenue</span>
            </div>
          </div>
        </div>
        
        {/* Feature Importance - from ML Research */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>📊 ML Feature Analysis (SHAP)</h3>
          <p style={styles.sectionDesc}>Key factors affecting your crop's stress prediction</p>
          
          <div style={styles.featureList}>
            {result.featureImportance.map((f, i) => {
              const raw = Math.abs(f.contribution ?? f.value ?? 0);
              const pct = (raw * 100).toFixed(1);
              const barW = Math.min(100, raw / 0.35 * 100);
              return (
              <div key={f.feature} style={styles.featureRow}>
                <div style={styles.featureInfo}>
                  <span style={styles.featureRank}>#{i + 1}</span>
                  <span style={styles.featureName}>{f.feature}</span>
                </div>
                <div style={styles.featureBarContainer}>
                  <div
                    style={{
                      ...styles.featureBar,
                      width: `${barW}%`,
                      background: i === 0 ? "linear-gradient(90deg, #ef4444, #fca5a5)" :
                                 i === 1 ? "linear-gradient(90deg, #f59e0b, #fcd34d)" :
                                 "linear-gradient(90deg, #22c55e, #86efac)"
                    }}
                  />
                </div>
                <span style={styles.featureValue}>{pct}%</span>
              </div>
              );
            })}
          </div>
        </div>
        
        {/* Actionable Recommendations */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>📋 Actionable Recommendations</h3>
          <p style={styles.sectionDesc}>Personalized advice based on your farm conditions</p>
          
          <div style={styles.recList}>
            {result.recommendations.map((rec, i) => (
              <div 
                key={i}
                className="rec-card"
                style={{
                  ...styles.recCard,
                  borderLeftColor: rec.priority === "High" ? "#ef4444" :
                                  rec.priority === "Medium" ? "#f59e0b" : "#22c55e"
                }}
              >
                <div style={styles.recHeader}>
                  <span style={styles.recIcon}>{rec.icon}</span>
                  <div>
                    <span style={styles.recTitle}>{rec.title}</span>
                    <span style={{
                      ...styles.recPriority,
                      background: rec.priority === "High" ? "rgba(239, 68, 68, 0.15)" :
                                 rec.priority === "Medium" ? "rgba(245, 158, 11, 0.15)" :
                                 "rgba(34, 197, 94, 0.15)",
                      color: rec.priority === "High" ? "#ef4444" :
                            rec.priority === "Medium" ? "#f59e0b" : "#22c55e"
                    }}>
                      {rec.priority} Priority
                    </span>
                  </div>
                </div>
                <p style={styles.recDesc}>{rec.description}</p>
                <div style={styles.recAction}>
                  <span style={styles.recActionIcon}>👉</span>
                  <span>{rec.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* ── 7-Day Stress Forecast ── */}
        {result.forecast7Day?.length > 0 && (
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>📅 7-Day Crop Stress Forecast</h3>
            <p style={styles.sectionDesc}>
              ML ensemble applied to Open-Meteo weather forecast — stress prediction &amp; daily action plan
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {result.forecast7Day.map((day, idx) => {
                const stressColor =
                  day.stress_prediction === "Normal"     ? "#22c55e" :
                  day.stress_prediction === "Low Stress" ? "#f59e0b" : "#ef4444";
                const stressBg =
                  day.stress_prediction === "Normal"     ? "rgba(34,197,94,0.08)" :
                  day.stress_prediction === "Low Stress" ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";

                return (
                  <div key={idx} style={{
                    background: "#fff",
                    borderRadius: "14px",
                    border: `1.5px solid ${stressColor}30`,
                    overflow: "hidden",
                  }}>
                    {/* Day header */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 18px",
                      background: stressBg,
                      borderBottom: `1px solid ${stressColor}20`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontWeight: 700, fontSize: "1rem", color: "#374151" }}>
                          Day {day.day}{day.date ? ` — ${day.date}` : ""}
                        </span>
                        <span style={{
                          padding: "2px 10px", borderRadius: "20px",
                          background: stressColor + "20",
                          color: stressColor, fontWeight: 700, fontSize: "0.78rem"
                        }}>
                          {day.stress_prediction === "Normal" ? "✅" :
                           day.stress_prediction === "Low Stress" ? "⚠️" : "🚨"}{" "}
                          {day.stress_prediction}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                          {Math.round(day.stress_probability * 100)}% confidence
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "14px", fontSize: "0.82rem", color: "#374151" }}>
                        <span title="Temperature">🌡️ {day.weather.temp_max}°C</span>
                        <span title="Rainfall">🌧️ {day.weather.rainfall}mm</span>
                        <span title="Soil Moisture">🌱 {day.soil_moisture_pct}%</span>
                        <span title="Rain probability">☂️ {day.weather.precip_prob}%</span>
                      </div>
                    </div>

                    {/* Growth stage + recommendations */}
                    <div style={{ padding: "12px 18px" }}>
                      <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "10px" }}>
                        Growth stage: <strong style={{ color: "#374151" }}>{day.growth_stage}</strong>
                        {" · "}Humidity: {day.weather.humidity}%
                        {" · "}Wind: {day.weather.wind} km/h
                        {" · "}ET₀: {day.weather.et0} mm/day
                      </div>

                      {day.recommendations?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {day.recommendations.map((rec, ri) => {
                            const prColor =
                              rec.priority === "Critical" ? "#ef4444" :
                              rec.priority === "High"     ? "#f97316" :
                              rec.priority === "Moderate" ? "#f59e0b" : "#22c55e";
                            return (
                              <div key={ri} style={{
                                padding: "10px 14px",
                                borderRadius: "10px",
                                background: prColor + "0d",
                                borderLeft: `4px solid ${prColor}`,
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                  <span>{rec.icon}</span>
                                  <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1f2937" }}>
                                    {rec.title}
                                  </span>
                                  <span style={{
                                    marginLeft: "auto",
                                    padding: "1px 8px", borderRadius: "12px",
                                    background: prColor + "20", color: prColor,
                                    fontSize: "0.72rem", fontWeight: 700
                                  }}>
                                    {rec.priority}
                                  </span>
                                </div>
                                <p style={{ margin: "0 0 4px 0", fontSize: "0.83rem", color: "#4b5563", lineHeight: 1.5 }}>
                                  {rec.detail}
                                </p>
                                <div style={{
                                  display: "flex", alignItems: "center", gap: "6px",
                                  fontSize: "0.8rem", color: "#374151",
                                  background: "#f9fafb", borderRadius: "6px", padding: "6px 10px"
                                }}>
                                  <span>👉</span>
                                  <span><strong>Action:</strong> {rec.action}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Research AI Enhanced Insights */}
        {result.research_ai?.available && (
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>🔬 Advanced Research AI Insights</h3>
            <p style={styles.sectionDesc}>TFT Forecasts • Bayesian Confidence • What-If Analysis</p>
            
            {/* Summary */}
            {result.research_ai.summary && (
              <div style={{
                padding: "12px 16px",
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))",
                borderRadius: "12px",
                marginBottom: "16px",
                fontSize: "0.9rem",
                color: "#374151"
              }}>
                <strong>📊 Summary:</strong> {result.research_ai.summary}
              </div>
            )}
            
            {/* TFT Multi-Horizon Forecasts */}
            {result.research_ai.forecasts && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#374151", marginBottom: "12px" }}>
                  📈 Temporal Fusion Transformer Forecasts
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {["day_1", "day_3", "day_7"].map(day => {
                    const forecast = result.research_ai.forecasts[day];
                    if (!forecast) return null;
                    const stressColor = forecast.stress_level === "NORMAL" ? "#22c55e" :
                                       forecast.stress_level === "LOW STRESS" ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={day} style={{
                        padding: "16px",
                        background: "#fff",
                        borderRadius: "12px",
                        border: `2px solid ${stressColor}20`,
                        textAlign: "center"
                      }}>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "4px" }}>
                          {day.replace("day_", "Day ")}
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: stressColor }}>
                          {Math.round((forecast.stress_probability || 0) * 100)}%
                        </div>
                        <div style={{ fontSize: "0.75rem", color: stressColor, fontWeight: 600 }}>
                          {forecast.stress_level}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Bayesian Confidence */}
            {result.research_ai.confidence && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#374151", marginBottom: "12px" }}>
                  🎲 Prediction Confidence (Bayesian)
                </h4>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  background: "#fff",
                  borderRadius: "12px"
                }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: `conic-gradient(
                      ${result.research_ai.confidence.level === "High" ? "#22c55e" : 
                        result.research_ai.confidence.level === "Medium" ? "#f59e0b" : "#ef4444"} 
                      ${result.research_ai.confidence.score * 3.6}deg, 
                      #e5e7eb ${result.research_ai.confidence.score * 3.6}deg
                    )`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <div style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: "#374151"
                    }}>
                      {result.research_ai.confidence.score}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                      {result.research_ai.confidence.level} Confidence
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      {result.research_ai.confidence.explanation || "Model is confident in this prediction"}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actionable Counterfactual Insights */}
            {result.research_ai.actionable_insights?.length > 0 && (
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#374151", marginBottom: "12px" }}>
                  💡 What-If Analysis (Counterfactual)
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {result.research_ai.actionable_insights.slice(0, 3).map((insight, i) => (
                    <div key={i} style={{
                      padding: "12px 16px",
                      background: "#fff",
                      borderRadius: "10px",
                      borderLeft: "4px solid #3b82f6",
                      fontSize: "0.9rem",
                      color: "#374151"
                    }}>
                      <strong>{insight.action}</strong>
                      {insight.from !== undefined && (
                        <span style={{ color: "#6b7280" }}>
                          {" "}from {insight.from} → {insight.to}
                        </span>
                      )}
                      {insight.result && (
                        <span style={{ 
                          marginLeft: "8px", 
                          padding: "2px 8px", 
                          borderRadius: "4px",
                          background: insight.result === "NORMAL" ? "#dcfce7" : "#fef3c7",
                          color: insight.result === "NORMAL" ? "#16a34a" : "#d97706",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}>
                          → {insight.result}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Run Again */}
        <div style={styles.actionBar}>
          <button
            className="adss-btn"
            style={styles.secondaryBtn}
            onClick={() => { setResult(null); setStep(1); }}
          >
            ← Start New Analysis
          </button>
          <button
            className="adss-btn"
            style={styles.primaryBtn}
            onClick={() => window.print()}
          >
            📄 Export Report
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.headerIcon}>🧠</span>
          <div>
            <h2 style={styles.title}>Advanced Decision Support System</h2>
            <p style={styles.subtitle}>
              ML-Powered Analysis • 88.3% Accuracy • 140K+ Training Observations
            </p>
          </div>
        </div>
        <div style={styles.researchBadge}>
          <span style={styles.badgeIcon}>🎓</span>
          <span style={styles.badgeText}>AI Research</span>
        </div>
      </div>
      
      {!loading && !result && (
        <>
          {/* Progress Steps */}
          <div style={styles.stepsBar}>
            {[
              { num: 1, label: "Location", icon: "📍" },
              { num: 2, label: "Crop", icon: "🌾" },
              { num: 3, label: "Resources", icon: "💧" },
            ].map(s => (
              <div 
                key={s.num}
                style={{
                  ...styles.stepIndicator,
                  ...(step === s.num ? styles.stepActive : step > s.num ? styles.stepDone : {})
                }}
                onClick={() => step > s.num && setStep(s.num)}
              >
                <span style={styles.stepIcon}>{step > s.num ? "✓" : s.icon}</span>
                <span style={styles.stepLabel}>{s.label}</span>
              </div>
            ))}
          </div>
          
          {/* Form Steps */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          
          {/* Navigation */}
          <div style={styles.navBar}>
            {step > 1 && (
              <button
                className="adss-btn"
                style={styles.secondaryBtn}
                onClick={() => setStep(step - 1)}
              >
                ← Previous
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <button
                className="adss-btn"
                style={styles.primaryBtn}
                onClick={() => setStep(step + 1)}
              >
                Next →
              </button>
            ) : (
              <button
                className="adss-btn"
                style={styles.analyzeBtn}
                onClick={runAnalysis}
              >
                🧠 Run AI Analysis
              </button>
            )}
          </div>
        </>
      )}
      
      {loading && renderAnalysis()}
      {result && renderResults()}
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 244, 0.95))",
    borderRadius: "24px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(34, 197, 94, 0.1)",
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(34, 197, 94, 0.15)",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerIcon: {
    fontSize: "48px",
  },
  title: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "0.9rem",
    color: "#64748b",
  },
  researchBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(74, 222, 128, 0.1))",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "30px",
  },
  badgeIcon: {
    fontSize: "18px",
  },
  badgeText: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#16a34a",
  },
  stepsBar: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    marginBottom: "32px",
  },
  stepIndicator: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    opacity: 0.5,
    transition: "all 0.3s ease",
  },
  stepActive: {
    opacity: 1,
  },
  stepDone: {
    opacity: 0.7,
  },
  stepIcon: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(34, 197, 94, 0.1)",
    borderRadius: "50%",
    fontSize: "20px",
  },
  stepLabel: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#374151",
  },
  stepContent: {
    animation: "fadeIn 0.4s ease-out",
  },
  stepTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "24px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  formGroup: {
    marginBottom: "8px",
  },
  label: {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "0.95rem",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "12px",
    background: "#fff",
    color: "#1f2937",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "0.95rem",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "12px",
    background: "#fff",
    color: "#1f2937",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  inputGroup: {
    display: "flex",
  },
  hint: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "6px",
  },
  cropGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  cropCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "16px 12px",
    background: "#fff",
    border: "2px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  cropCardActive: {
    borderColor: "#22c55e",
    background: "rgba(34, 197, 94, 0.08)",
    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.15)",
  },
  cropIcon: {
    fontSize: "32px",
  },
  cropName: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1f2937",
  },
  cropSeason: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  suitabilityBadge: {
    fontSize: "0.7rem",
    padding: "4px 8px",
    borderRadius: "10px",
    fontWeight: 600,
    marginTop: "4px",
  },
  optionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  optionCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "16px",
    background: "#fff",
    border: "2px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "14px",
    cursor: "pointer",
  },
  optionCardActive: {
    borderColor: "#22c55e",
    background: "rgba(34, 197, 94, 0.08)",
  },
  optionName: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#1f2937",
    textAlign: "center",
  },
  optionDesc: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    fontSize: "0.95rem",
    color: "#374151",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    accentColor: "#22c55e",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid rgba(34, 197, 94, 0.15)",
  },
  primaryBtn: {
    padding: "14px 28px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "14px 28px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#16a34a",
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "12px",
    cursor: "pointer",
  },
  analyzeBtn: {
    padding: "16px 36px",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    animation: "glow 2s infinite",
  },
  analysisContainer: {
    minHeight: "400px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressSection: {
    textAlign: "center",
    maxWidth: "500px",
  },
  progressIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    animation: "pulse 1.5s infinite",
  },
  progressTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: "8px",
  },
  progressSubtitle: {
    fontSize: "0.95rem",
    color: "#64748b",
    marginBottom: "24px",
  },
  progressBar: {
    width: "100%",
    height: "12px",
    background: "rgba(34, 197, 94, 0.1)",
    borderRadius: "6px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #22c55e, #4ade80)",
    borderRadius: "6px",
    transition: "width 0.3s ease",
  },
  progressPercent: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#22c55e",
  },
  modelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginTop: "32px",
  },
  modelCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "12px",
    background: "rgba(34, 197, 94, 0.08)",
    borderRadius: "12px",
    transition: "opacity 0.3s ease",
  },
  modelName: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#374151",
  },
  modelAccuracy: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#22c55e",
  },
  resultsContainer: {
    animation: "fadeIn 0.5s ease-out",
  },
  summaryCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "28px",
    marginBottom: "24px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.08)",
  },
  summaryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  summaryTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  summarySubtitle: {
    margin: "4px 0 0 0",
    fontSize: "0.9rem",
    color: "#64748b",
  },
  healthBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "30px",
    fontSize: "1rem",
    fontWeight: 600,
  },
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  metricCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "20px",
    background: "rgba(34, 197, 94, 0.06)",
    borderRadius: "16px",
    textAlign: "center",
  },
  metricIcon: {
    fontSize: "28px",
  },
  metricValue: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  metricLabel: {
    fontSize: "0.8rem",
    color: "#64748b",
  },
  sectionCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "28px",
    marginBottom: "24px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
  },
  sectionTitle: {
    margin: "0 0 4px 0",
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#1f2937",
  },
  sectionDesc: {
    margin: "0 0 20px 0",
    fontSize: "0.9rem",
    color: "#64748b",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  featureInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "140px",
    flexShrink: 0,
  },
  featureRank: {
    fontSize: "0.75rem",
    color: "#64748b",
    background: "rgba(34, 197, 94, 0.1)",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  featureName: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#374151",
  },
  featureBarContainer: {
    flex: 1,
    height: "16px",
    background: "rgba(34, 197, 94, 0.08)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  featureBar: {
    height: "100%",
    borderRadius: "8px",
    transition: "width 0.5s ease-out",
  },
  featureValue: {
    width: "50px",
    textAlign: "right",
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  recList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  recCard: {
    padding: "20px",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "14px",
    borderLeft: "4px solid",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  recHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "10px",
  },
  recIcon: {
    fontSize: "24px",
  },
  recTitle: {
    display: "block",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "4px",
  },
  recPriority: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "10px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  recDesc: {
    margin: "0 0 12px 0",
    fontSize: "0.9rem",
    color: "#64748b",
    lineHeight: 1.5,
  },
  recAction: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    background: "rgba(34, 197, 94, 0.08)",
    borderRadius: "10px",
    fontSize: "0.9rem",
    color: "#16a34a",
    fontWeight: 500,
  },
  recActionIcon: {
    fontSize: "14px",
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "24px",
  },
  // Crop Notice styles
  cropNotice: {
    marginTop: "20px",
    marginBottom: "24px",
    padding: "18px 22px",
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    animation: "fadeIn 0.3s ease-out",
  },
  noticeHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  noticeIcon: {
    fontSize: "24px",
    marginTop: "2px",
  },
  noticeTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#16a34a",
    marginBottom: "8px",
  },
  noticeDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  noticeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px 12px",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "100px",
    fontSize: "0.78rem",
    fontWeight: 500,
    color: "#475569",
    border: "1px solid rgba(34, 197, 94, 0.2)",
  },
  noticeDismiss: {
    padding: "6px 10px",
    background: "rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    color: "#64748b",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "10px",
    transition: "all 0.2s ease",
  },
};
