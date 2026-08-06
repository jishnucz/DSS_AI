import { useState } from "react";

const CSS = `
@keyframes ds-slide { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
.ds-card { transition: transform 0.2s, box-shadow 0.2s !important; }
.ds-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 28px rgba(30,58,138,0.12) !important; }
.ds-row { transition: background 0.15s !important; }
.ds-row:hover { background: rgba(99,102,241,0.05) !important; }
`;

function injectStyle(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

const SOURCES = [
  {
    name: "ERA5-Land Reanalysis",
    provider: "Copernicus / ECMWF",
    type: "Primary Weather",
    icon: "🛰️",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    variables: [
      { name: "2m Air Temperature (t2m)", use: "CCSI thermal component S_T, heat stress flags", unit: "K → °C" },
      { name: "Total Precipitation (tp)", use: "CCSI rainfall component S_TP, flood risk flags", unit: "m → mm" },
      { name: "Soil Water Vol. Layer 1 (swvl1)", use: "CCSI soil moisture component S_SM, drought detection", unit: "m³/m³" },
      { name: "Soil Temperature Layer 1 (stl1)", use: "Root zone heat stress, indirect crop stress", unit: "K → °C" },
      { name: "10m Wind U/V components", use: "CCSI wind component S_W, Palakkad Gap wind index", unit: "m/s → km/h" },
    ],
    stats: "184,824 hourly rows × 5 files → 7,701 daily records (2005–2026)",
    quality: 99,
    note: "0.1° spatial resolution (~11 km). ERA5-Land is downscaled ERA5 at 9x higher resolution. Released monthly with 5-day lag.",
  },
  {
    name: "Rice Stage Calendar",
    provider: "Kerala Agricultural University (KAU)",
    type: "Crop Calendar",
    icon: "🗓️",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    variables: [
      { name: "Virippu season", use: "Jun 15 – Oct 31 (Kharif rice)", unit: "5 stages" },
      { name: "Mundakan season", use: "Oct 15 – Feb 28 (Rabi rice)", unit: "5 stages" },
      { name: "Germination (Day 1–15)", use: "Medium sensitivity — soil moisture critical", unit: "Feature: stage_code=1" },
      { name: "Flowering (Day 51–75)", use: "HIGH sensitivity — heat AND wind critical", unit: "Feature: is_critical_stage=1" },
      { name: "Grain Filling (Day 76–100)", use: "HIGH sensitivity — drought prevents grain fill", unit: "Feature: is_critical_stage=1" },
    ],
    stats: "10 stage records × 2 seasons | 45.6% off-season | 13.7% Flowering days",
    quality: 95,
    note: "Stages mapped to every date (2005–2026) to create phenological features. Rice dominates 75–81% of cultivated area across all 13 taluks.",
  },
  {
    name: "Crop Stress Thresholds",
    provider: "Kerala Agricultural University (KAU) + ICAR-IIRR",
    type: "Agronomy Thresholds",
    icon: "📐",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    variables: [
      { name: "Air Temperature — Optimal: 22–32°C", use: "t_heat_stress = 1 if T > 35°C", unit: "Binary feature" },
      { name: "Soil Moisture — Optimal: 0.30–0.45", use: "sm_drought_flag = 1 if SM < 0.22", unit: "Binary feature" },
      { name: "Rainfall — Optimal: 5–15 mm/day", use: "rain_flood_flag = 1 if TP > 50 mm", unit: "Binary feature" },
      { name: "Stage-specific thresholds", use: "Flowering has tighter limits than Vegetative", unit: "Per-stage lookup" },
      { name: "Critical × VPD interaction", use: "critical_x_vpd = is_critical × VPD", unit: "Interaction feature" },
    ],
    stats: "10 threshold rows × 3 variables = 30 threshold conditions per date",
    quality: 92,
    note: "These thresholds make the model crop-physiologically aware, not just weather-reactive. Features verified against known agronomic literature.",
  },
  {
    name: "Derived: Vapor Pressure Deficit",
    provider: "Computed from ERA5 temperature",
    type: "Atmospheric Physics",
    icon: "💧",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#ddd6fe",
    variables: [
      { name: "Saturation VP: es = 6.1078 × exp(17.27×T / (T+237.3))", use: "Magnus formula for VPD computation", unit: "hPa" },
      { name: "Actual VP: ea = es(T_min)", use: "Tmin as dew-point proxy for humid tropical climate", unit: "hPa" },
      { name: "VPD = es_mean − ea", use: "Direct plant water stress indicator", unit: "Range: 0.66–20.5 hPa" },
      { name: "RH_approx = ea / es_mean × 100", use: "Approximate relative humidity (no RH in ERA5-Land)", unit: "52–98%" },
    ],
    stats: "Computed daily 2005–2026. VPD is a top-3 predictor of transpiration stress in tropical crops.",
    quality: 85,
    note: "Approximate: uses Tmin as dew-point proxy. Accuracy improves with actual dew-point data (unavailable in ERA5-Land). Still significant feature in model.",
  },
  {
    name: "Derived: Growing Degree Days",
    provider: "Computed from ERA5 temperature",
    type: "Thermal Accumulation",
    icon: "🌡️",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    variables: [
      { name: "GDD_daily = max(0, T_mean − 10°C)", use: "Base 10°C for rice; captures heat accumulation", unit: "°C-days" },
      { name: "Cumulative GDD per season", use: "Resets at each Virippu/Mundakan start", unit: "0–1200 °C-days/season" },
      { name: "Season-specific GDD tracking", use: "Virippu and Mundakan accumulate separately", unit: "2 accumulators" },
    ],
    stats: "Rice needs ~1100–1400 GDD for full cycle. Palakkad's semi-arid thermal regime is unique in Kerala.",
    quality: 90,
    note: "GDD is a standard agronomic maturity indicator. Captured in feature vector as both daily and cumulative values.",
  },
  {
    name: "Palakkad Crop Distribution",
    provider: "Kerala Department of Agriculture",
    type: "Regional Context",
    icon: "🗺️",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    variables: [
      { name: "13 taluks, 54 crop records", use: "Rice area: 75–81% of cultivated land per taluk", unit: "Hectares" },
      { name: "Dominant crops: Rice, Coconut, Banana", use: "Contextualizes why rice-optimized CCSI is valid", unit: "3–5 crops/taluk" },
      { name: "Season mapping: Kharif/Rabi", use: "Confirms Virippu (Jun) + Mundakan (Oct) alignment", unit: "Annual data" },
      { name: "Yield data: avg 3.0–4.2 t/ha rice", use: "Used in yield prediction component of app", unit: "t/ha" },
    ],
    stats: "13 taluks × 4-5 crops = 54 area records. Rice is unambiguously dominant (>75% everywhere).",
    quality: 88,
    note: "Used to validate that rice is the right crop to optimize for, and that Palakkad-wide CCSI is meaningful.",
  },
];

const FEATURES_SUMMARY = [
  { category: "ERA5 base variables", count: 14, examples: "t2m, tp, swvl1, stl, wind" },
  { category: "Lag features (7 lags × 6 vars)", count: 42, examples: "t2m_lag1 … wind_lag7" },
  { category: "Rolling stats (3/7/14-day)", count: 72, examples: "swvl1_roll7_mean, tp_roll14_max" },
  { category: "14-day slope (trend)", count: 6, examples: "t2m_slope14, tp_slope14" },
  { category: "Cyclic time encoding", count: 4, examples: "sin_doy, cos_month" },
  { category: "VPD / Humidity (NEW)", count: 3, examples: "vpd, rh_approx, es_mean" },
  { category: "Crop phenology (NEW)", count: 6, examples: "season_code, stage_code, gdd_daily, cum_gdd" },
  { category: "Crop stress flags (NEW)", count: 3, examples: "t_heat_stress, sm_drought, rain_flood" },
  { category: "Monsoon phase (NEW)", count: 5, examples: "monsoon_phase, is_sw_monsoon" },
  { category: "Interaction terms (NEW)", count: 3, examples: "critical_x_vpd, heat_x_drought" },
  { category: "CCSI lag features (NEW)", count: 5, examples: "ccsi_lag1, ccsi_adj_lag1" },
];

function QualityBar({ pct, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3,
          transition: "width 1s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

export default function DataSourcesPanel() {
  injectStyle("dsp", CSS);
  const [active, setActive] = useState(null);

  const s = {
    wrap: { fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: 980, margin: "0 auto" },
    header: {
      background: "linear-gradient(135deg,#0f172a,#1e3a8a,#0891b2)",
      borderRadius: 16, padding: "20px 24px", marginBottom: 20, color: "#fff",
    },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
    card: (src) => ({
      background: "#fff", borderRadius: 14, border: `1px solid ${src.border}`,
      padding: "16px 18px", cursor: "pointer",
      boxShadow: active === src.name ? `0 6px 24px ${src.color}22` : "0 2px 8px rgba(0,0,0,0.05)",
      outline: active === src.name ? `2px solid ${src.color}` : "none",
    }),
    feat: {
      background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
      padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    },
  };

  const activeSrc = SOURCES.find((s) => s.name === active);

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          📊 Data Sources — All Inputs to the Research Model
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          25 features · 77,360 daily records · 1984–2026 (42 yrs) · ERA5-Land + KAU Crop Calendar + Stress Thresholds
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { label: "Primary source", val: "ERA5-Land (ECMWF)" },
            { label: "Crop source", val: "KAU agronomic standards" },
            { label: "Derived features", val: "SWB, VPD, heat-stress, phenology" },
            { label: "Total features", val: "25 (20 seq + 5 static)" },
          ].map((item) => (
            <div key={item.label} style={{ fontSize: 11 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 1 }}>{item.label}</div>
              <div style={{ color: "#fff", fontWeight: 700 }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Source cards grid */}
      <div style={s.grid}>
        {SOURCES.map((src) => (
          <div key={src.name} className="ds-card" style={s.card(src)}
            onClick={() => setActive(active === src.name ? null : src.name)}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 26 }}>{src.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>{src.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{src.provider}</div>
                <span style={{
                  display: "inline-block", marginTop: 5, padding: "2px 8px", borderRadius: 9999,
                  background: src.bg, color: src.color, fontSize: 10, fontWeight: 700,
                  border: `1px solid ${src.border}`,
                }}>{src.type}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>{src.stats}</div>
            <QualityBar pct={src.quality} color={src.color} />
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Data quality / reliability score</div>
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {activeSrc && (
        <div style={{
          ...s.feat, marginBottom: 20, animation: "ds-slide 0.3s ease",
          borderLeft: `4px solid ${activeSrc.color}`, borderColor: `${activeSrc.color}44 ${activeSrc.border} ${activeSrc.border} ${activeSrc.color}`,
          borderWidth: "1px 1px 1px 4px",
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{activeSrc.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{activeSrc.name}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{activeSrc.provider}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, marginBottom: 12,
            padding: "10px 14px", background: activeSrc.bg, borderRadius: 8 }}>
            {activeSrc.note}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
            Variables Used:
          </div>
          {activeSrc.variables.map((v, i) => (
            <div key={i} className="ds-row" style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 100px",
              gap: 8, padding: "7px 10px", borderRadius: 6, marginBottom: 4,
              border: "1px solid #f1f5f9",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{v.name}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{v.use}</div>
              <div style={{ fontSize: 11, color: activeSrc.color, fontWeight: 600, textAlign: "right" }}>{v.unit}</div>
            </div>
          ))}
        </div>
      )}

      {/* Feature engineering table */}
      <div style={s.feat}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>
          Feature Engineering Summary — 163 Total Features
        </div>
        {FEATURES_SUMMARY.map((row, i) => {
          const pct = (row.count / 163) * 100;
          const isNew = row.category.includes("NEW");
          return (
            <div key={i} className="ds-row" style={{
              display: "grid", gridTemplateColumns: "200px 50px 1fr 140px",
              gap: 10, alignItems: "center", padding: "6px 10px", borderRadius: 6, marginBottom: 3,
              background: isNew ? "#f0fdf4" : "transparent",
              border: isNew ? "1px solid #bbf7d0" : "1px solid transparent",
            }}>
              <div style={{ fontSize: 12, fontWeight: isNew ? 700 : 500,
                color: isNew ? "#16a34a" : "#374151" }}>
                {row.category}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", textAlign: "right" }}>
                {row.count}
              </div>
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`,
                  background: isNew ? "#16a34a" : "#6366f1", borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{row.examples}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 8,
          fontSize: 11, color: "#64748b" }}>
          <strong>Green rows</strong> = Derived features added on top of raw ERA5 (heat_stress, dry_streak, crop_et, swb_norm, etc.).
          The 25-feature ensemble (LightGBM 86.39%, BiLSTM 84.93%, stacking 86.37%) was trained on 1984-2013 and validated on the 2020-2026 held-out test set.
        </div>
      </div>
    </div>
  );
}
