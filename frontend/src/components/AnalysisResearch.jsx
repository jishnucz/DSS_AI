import { useState, useEffect } from "react";
import {
  Lightbulb, Zap, TreeDeciduous, Brain, Bot, ArrowLeftRight,
  Target, Vote, CloudSun, Scale, BarChart3, TrendingUp, Calendar,
  Wheat, RadioTower,
} from "lucide-react";
import CropPhysiologyAdvisor from "./CropPhysiologyAdvisor";
import DataSourcesPanel from "./DataSourcesPanel";
import UnifiedAgriDSS from "./UnifiedAgriDSS";
import ModelComparisonPanel from "./ModelComparisonPanel";
import SHAPExplanation from "./SHAPExplanation";
import CropCalendar from "./CropCalendar";
import IrrigationScheduler from "./IrrigationScheduler";
import FarmInputCalculator from "./FarmInputCalculator";
import PestForecast from "./PestForecast";
import MarketPrices from "./MarketPrices";
import HistoricalComparison from "./HistoricalComparison";
import SoilHealth from "./SoilHealth";
import NDVIViewer from "./NDVIViewer";
import WeatherAlerts from "./WeatherAlerts";
import GovernmentSchemes from "./GovernmentSchemes";
import ClimateProjections from "./ClimateProjections";
import TalukStressHeatmap from "./TalukStressHeatmap";
import ErrorBoundary from "./ErrorBoundary";

const CSS = `
  @keyframes ar-fade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ar-bar  { from { width:0% } to { width:var(--w) } }
  @keyframes ar-glow { 0%,100% { box-shadow:0 0 0 0 rgba(99,102,241,0); } 50% { box-shadow:0 0 20px 4px rgba(99,102,241,0.18); } }
  .ar-tab-btn { transition: all 0.22s cubic-bezier(.4,0,.2,1) !important; }
  .ar-tab-btn:hover { background:rgba(255,255,255,0.18) !important; transform:translateY(-1px) !important; }
  .ar-tab-btn.ar-active { background:rgba(255,255,255,0.95) !important; color:#1e3a8a !important; font-weight:700 !important; box-shadow:0 4px 16px rgba(0,0,0,0.18) !important; }
  .ar-acc-row { transition: all 0.2s ease !important; }
  .ar-acc-row:hover { background:rgba(99,102,241,0.05) !important; }
  .ar-card { transition: transform 0.2s, box-shadow 0.2s !important; }
  .ar-card:hover { transform:translateY(-3px) !important; box-shadow:0 8px 32px rgba(30,58,138,0.13) !important; }
  .ar-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  @media(max-width:900px) { .ar-grid-2 { grid-template-columns:1fr !important; } }
`;
function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// Ensemble Forecasting notebook (Palakkad_Ensemble_Forecasting.ipynb)
// Trained 1984-2013 (54k seq), validated 2013-2020 (11.5k), tested 2020-2026 (11.6k)
// 20 dynamic + 5 static features. Labels = CCSI tercile (33/33/33 balanced)
const C1_MODELS = [
  { name: "LightGBM",      Icon: Lightbulb,      acc: 86.39, f1: 86.56, auc: null, color: "#16a34a", note: "Best individual" },
  { name: "BiLSTM (attn)", Icon: ArrowLeftRight, acc: 84.93, f1: 85.11, auc: null, color: "#15803d", note: "Best DL" },
  { name: "RandomForest",  Icon: TreeDeciduous,  acc: 84.42, f1: 84.70, auc: null, color: "#166534", note: "" },
  { name: "GRU",           Icon: Brain,          acc: 84.36, f1: 84.41, auc: null, color: "#22c55e", note: "" },
  { name: "XGBoost",       Icon: Zap,            acc: 84.10, f1: 84.37, auc: null, color: "#4ade80", note: "" },
  { name: "PatchTST",      Icon: Bot,            acc: 81.47, f1: 81.60, auc: null, color: "#86efac", note: "Transformer" },
];

// Ensemble outputs — winner of soft-vote vs stacking is locked on validation
// Both are reported. Stacking won on this run (val 88.66 vs 88.59).
const C2_MODELS = [
  { name: "Stacking (final)",    Icon: Target,   acc: 86.37, f1: 86.51, auc: null, color: "#6366f1", note: "Validation winner" },
  { name: "Soft-voting",         Icon: Vote,     acc: 85.88, f1: 86.07, auc: null, color: "#818cf8", note: "Val-tuned weights" },
  { name: "WeatherSeq2Seq LSTM", Icon: CloudSun, acc: null,  f1: null,  auc: null, color: "#a5b4fc", note: "MAE 1.20°C @ d+1" },
];

// Ensemble notebook (Palakkad_Ensemble_Forecasting.ipynb) - weather forecast MAE
// MAE on held-out test set, in °C (Tmax/Tmin) and mm/day (Rain)
const HORIZONS = [
  { label: "Day +1 (Tmax MAE)", acc: 1.20 },
  { label: "Day +3 (Tmax MAE)", acc: 1.49 },
  { label: "Day +7 (Tmax MAE)", acc: 1.73 },
];

const WHY_CARDS = [
  {
    Icon: Target,
    title: "Why LightGBM beats deep models (86.39%)",
    text: "On 77k sequences of 30-day windows × 25 features, tree boosting wins. LightGBM exploits the static taluk features (soil, elevation) immediately, where DL models have to relearn them. BiLSTM (84.93%) and GRU (84.36%) close the gap but never overtake. Final stacked ensemble: 86.37% — within 0.02% of LightGBM alone because the stacker correctly down-weights weaker models.",
    color: "#16a34a",
    bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
    border: "#bbf7d0",
  },
  {
    Icon: Brain,
    title: "Stacking beats soft voting (+0.49%)",
    text: "Soft voting test: 85.88%. Stacking (logistic-regression meta-learner on validation probabilities): 86.37%. Stacking learns that LightGBM should dominate and PatchTST (81.47%) should be down-weighted heavily. The meta-learner is locked on the validation set — no test peek. F1 went from 0.8607 → 0.8651.",
    color: "#1d4ed8",
    bg: "linear-gradient(135deg,#eff6ff,#dbeafe)",
    border: "#bfdbfe",
  },
  {
    Icon: Scale,
    title: "Why PatchTST underperforms (81.47%)",
    text: "PatchTST divides 30 days into 6 patches of 5 days, then runs a 3-layer transformer encoder. For a 25-dim × 6-token sequence, the attention mechanism has too much capacity vs the signal. The RNN inductive bias (BiLSTM at 84.93%) is better matched to this short-window daily climate problem. We keep PatchTST in the ensemble so the stacker can verify its weights are minimal.",
    color: "#7c3aed",
    bg: "linear-gradient(135deg,#faf5ff,#ede9fe)",
    border: "#ddd6fe",
  },
  {
    Icon: CloudSun,
    title: "Weather forecast beats climatology 2-3×",
    text: "Seq2Seq LSTM trained to forecast next 7 days of Tmax/Tmin/Rain from 30-day input. MAE at d+1: Tmax 1.20°C, Tmin 0.59°C, Rain 4.47mm. Climatology baseline (predict the long-term mean): 3.31°C, 1.57°C, 7.14mm. Our 286k-param model is within ~2.5×ECMWF skill on a small dataset — defensible result.",
    color: "#b45309",
    bg: "linear-gradient(135deg,#fffbeb,#fef3c7)",
    border: "#fde68a",
  },
];

function AccuracyBar({ pct, color, animate }) {
  return (
    <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 4, background: color,
        width: animate ? `${pct}%` : "0%",
        transition: animate ? "width 1.2s cubic-bezier(.4,0,.2,1)" : "none",
      }} />
    </div>
  );
}

function ModelAccuracyView() {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 50); return () => clearTimeout(t); }, []);

  return (
    <div style={{ animation: "ar-fade 0.4s ease both" }}>
      {/* Stress Classification Section */}
      <div style={{ marginBottom: 28 }}>
        <div style={s.sectionHead}>
          <Target size={22} strokeWidth={2.2} color="#16a34a" />
          <div>
            <div style={s.sectionTitle}>Stress Classification — Ensemble of 6 Models</div>
            <div style={s.sectionSub}>30-day weather window → Stress label (None / Low / High) via CCSI tercile</div>
          </div>
          <div style={{ ...s.taskBadge, background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>LightGBM 86.4% (best)</div>
        </div>
        <div style={s.tableWrap}>
          <div style={s.tableHead}>
            <span style={{ flex: 2 }}>Model</span>
            <span style={{ flex: 3 }}>Accuracy</span>
            <span style={{ width: 55, textAlign: "right" }}>F1</span>
            <span style={{ width: 55, textAlign: "right" }}>AUC</span>
          </div>
          {C1_MODELS.map((m) => (
            <div key={m.name} className="ar-acc-row" style={s.tableRow}>
              <span style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}>
                <m.Icon size={16} strokeWidth={2.2} color={m.color} />
                <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>{m.name}</span>
                {m.note && <span style={{ fontSize: "0.65rem", background: m.color, color: "#fff", borderRadius: 99, padding: "2px 8px", fontWeight: 700 }}>{m.note}</span>}
              </span>
              <span style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                <AccuracyBar pct={m.acc} color={m.color} animate={shown} />
                <span style={{ fontWeight: 700, color: m.color, minWidth: 48, fontSize: "0.85rem" }}>{m.acc}%</span>
              </span>
              <span style={{ width: 55, textAlign: "right", color: "#475569", fontSize: "0.82rem" }}>{m.f1}%</span>
              <span style={{ width: 55, textAlign: "right", color: "#475569", fontSize: "0.82rem" }}>{m.auc}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ensemble Section */}
      <div style={{ marginBottom: 28 }}>
        <div style={s.sectionHead}>
          <Target size={22} strokeWidth={2.2} color="#6366f1" />
          <div>
            <div style={s.sectionTitle}>Final Ensemble — Stacking Meta-Learner</div>
            <div style={s.sectionSub}>Logistic regression over the 6 models' validation probabilities. Winner of soft-vote vs stacking is locked on validation.</div>
          </div>
          <div style={{ ...s.taskBadge, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>Stacking 86.37% (final)</div>
        </div>
        <div style={s.tableWrap}>
          <div style={s.tableHead}>
            <span style={{ flex: 2 }}>Model</span>
            <span style={{ flex: 3 }}>Accuracy</span>
            <span style={{ width: 55, textAlign: "right" }}>F1</span>
            <span style={{ width: 55, textAlign: "right" }}>AUC</span>
          </div>
          {C2_MODELS.map((m) => (
            <div key={m.name} className="ar-acc-row" style={s.tableRow}>
              <span style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}>
                <m.Icon size={16} strokeWidth={2.2} color={m.color} />
                <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>{m.name}</span>
                {m.note && <span style={{ fontSize: "0.65rem", background: m.color === "#94a3b8" ? "#64748b" : m.color, color: "#fff", borderRadius: 99, padding: "2px 8px", fontWeight: 700 }}>{m.note}</span>}
              </span>
              <span style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                {m.acc != null && <AccuracyBar pct={m.acc} color={m.color} animate={shown} />}
                {m.acc != null
                  ? <span style={{ fontWeight: 700, color: m.color === "#e0e7ff" || m.color === "#c7d2fe" ? "#6366f1" : m.color, minWidth: 48, fontSize: "0.85rem" }}>{m.acc}%</span>
                  : <span style={{ color: "#64748b", fontSize: "0.82rem", fontStyle: "italic" }}>regression model — see MAE</span>
                }
              </span>
              <span style={{ width: 55, textAlign: "right", color: "#475569", fontSize: "0.82rem" }}>{m.f1 != null ? `${m.f1}%` : "—"}</span>
              <span style={{ width: 55, textAlign: "right", color: "#475569", fontSize: "0.82rem" }}>{m.auc ? `${m.auc}%` : "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Weather Forecast Skill */}
      <div style={{ marginBottom: 28 }}>
        <div style={s.sectionHead}>
          <Calendar size={22} strokeWidth={2.2} color="#6366f1" />
          <div>
            <div style={s.sectionTitle}>Weather Forecast Skill — Seq2Seq LSTM</div>
            <div style={s.sectionSub}>Tmax MAE in °C on held-out test set. Lower = better. Beats climatology by 2-3×.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {HORIZONS.map((h) => (
            <div key={h.label} className="ar-card" style={s.horizonCard}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{h.label}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#6366f1", fontFamily: "'Inter',sans-serif", lineHeight: 1.1, marginTop: 6 }}>{h.acc}°C</div>
              <div style={{ marginTop: 10 }}>
                <AccuracyBar pct={Math.min(100, (1 - h.acc / 3.5) * 100)} color="#6366f1" animate={shown} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
        {WHY_CARDS.map((c) => (
          <div key={c.title} className="ar-card" style={{ ...s.whyCard, background: c.bg, borderColor: c.border }}>
            <div style={{ marginBottom: 10, color: c.color }}>
              <c.Icon size={28} strokeWidth={2.2} />
            </div>
            <div style={{ fontWeight: 700, color: c.color, fontSize: "0.95rem", marginBottom: 8 }}>{c.title}</div>
            <div style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.6 }}>{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Wrench, LineChart, Bell } from "lucide-react";

const DEMO_FEATURES = { temperature: 28, precipitation: 120, soil_moisture: 0.35, wind_speed: 3.2, pressure: 1012 };

const TABS = [
  { id: "dss",        label: "DSS Analysis",    Icon: BarChart3 },
  { id: "accuracy",   label: "Model Accuracy",  Icon: TrendingUp },
  { id: "ai",         label: "AI Analysis",     Icon: Bot },
  { id: "physiology", label: "Crop Physiology", Icon: Wheat },
  { id: "tools",      label: "Farm Tools",      Icon: Wrench },
  { id: "market",     label: "Market & Data",   Icon: LineChart },
  { id: "alerts",     label: "Alerts & Support",Icon: Bell },
];

export default function AnalysisResearch({ detectedCrop }) {
  inject("ar-styles", CSS);
  const [tab, setTab] = useState("dss");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Master header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div>
            <h2 style={s.headerTitle}>Analysis & Research</h2>
            <p style={s.headerSub}>AI-powered crop stress DSS · 42-year ERA5 record · 6-model stacking ensemble · MTech research</p>
          </div>
          <div style={s.headerStats}>
            <div style={s.stat}><div style={s.statVal}>86.4%</div><div style={s.statLbl}>Stacking Ensemble</div></div>
            <div style={s.statDiv} />
            <div style={s.stat}><div style={s.statVal}>1.2°C</div><div style={s.statLbl}>Tmax MAE d+1</div></div>
            <div style={s.statDiv} />
            <div style={s.stat}><div style={s.statVal}>25</div><div style={s.statLbl}>Features</div></div>
            <div style={s.statDiv} />
            <div style={s.stat}><div style={s.statVal}>6</div><div style={s.statLbl}>Models</div></div>
          </div>
        </div>
        <div style={s.tabStrip}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={"ar-tab-btn" + (tab === t.id ? " ar-active" : "")}
              style={s.tabBtn}
              onClick={() => setTab(t.id)}
            >
              <span style={{ marginRight: 6, display: "inline-flex", verticalAlign: "-2px" }}>
                <t.Icon size={14} strokeWidth={2.4} />
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={s.content} key={tab}>
        {tab === "dss" && (
          <ErrorBoundary>
            <UnifiedAgriDSS detectedCrop={detectedCrop} />
          </ErrorBoundary>
        )}

        {tab === "accuracy" && <ModelAccuracyView />}

        {tab === "physiology" && (
          <ErrorBoundary>
            <div style={{ animation: "ar-fade 0.4s ease both" }}>
              <CropPhysiologyAdvisor currentWeather={{ temp: 31.2, soil: 0.28, rain: 2.1 }} />
            </div>
          </ErrorBoundary>
        )}

        {tab === "ai" && (
          <ErrorBoundary>
            <div style={{ animation: "ar-fade 0.4s ease both" }}>
              <div style={{ marginBottom: 20, padding: "12px 18px", background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe", fontSize: "0.85rem", color: "#1e40af" }}>
                <strong>Note:</strong> Model comparison uses current weather inputs for real-time stress classification (C1 task). Research accuracies shown reflect the MTech notebook validation results.
              </div>
              <div className="ar-grid-2">
                <ErrorBoundary><ModelComparisonPanel features={DEMO_FEATURES} /></ErrorBoundary>
                <ErrorBoundary><SHAPExplanation features={DEMO_FEATURES} /></ErrorBoundary>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {tab === "tools" && (
          <ErrorBoundary>
            <div className="ar-grid-2" style={{ animation: "ar-fade 0.4s ease both" }}>
              <CropCalendar crop="Rice" season="mundakan" sowingDate={new Date(Date.now() - 45 * 86400000).toISOString()} />
              <IrrigationScheduler crop="Rice" soilType="clay loam" growthStage="tillering" temperature={28} rainfall={5} humidity={75} />
              <FarmInputCalculator crop="Rice" area={1.5} season="kharif" />
              <PestForecast temperature={28} humidity={75} rainfall={5} growthStage="tillering" />
            </div>
          </ErrorBoundary>
        )}

        {tab === "market" && (
          <ErrorBoundary>
            <div style={{ animation: "ar-fade 0.4s ease both", marginBottom: 24 }}>
              <DataSourcesPanel />
            </div>
            <div className="ar-grid-2" style={{ animation: "ar-fade 0.4s ease both" }}>
              <MarketPrices crop="Rice" variety="Jyothi" location="Palakkad" />
              <HistoricalComparison crop="Rice" taluk="Central" currentYear={2025} />
              <SoilHealth taluk="Central" crop="Rice" />
              <NDVIViewer selectedTaluk="Central" date={new Date().toISOString()} />
            </div>
          </ErrorBoundary>
        )}

        {tab === "alerts" && (
          <ErrorBoundary>
            <div style={{ animation: "ar-fade 0.4s ease both" }}>
              <div className="ar-grid-2" style={{ marginBottom: 20 }}>
                <WeatherAlerts temperature={28} humidity={75} rainfall={5} windSpeed={12}
                  forecast={[{ day: "Today", temp: 28, rain: 5 }, { day: "Tomorrow", temp: 32, rain: 0 }, { day: "Day 3", temp: 34, rain: 0 }]} />
                <GovernmentSchemes landSize={1.5} cropType="Rice" farmerCategory="small" />
              </div>
              <ClimateProjections selectedTaluk="Central" />
              <TalukStressHeatmap onTalukSelect={(t) => console.log("Taluk:", t)} />
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

const s = {
  header: {
    background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%)",
    borderRadius: "20px 20px 0 0",
    padding: "24px 28px 0",
    boxShadow: "0 4px 32px rgba(15,23,42,0.25)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 16,
    flexWrap: "wrap",
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#fff",
    fontFamily: "'Manrope','Inter',sans-serif",
    letterSpacing: "-0.5px",
  },
  headerSub: {
    margin: "4px 0 0",
    fontSize: "0.82rem",
    color: "rgba(255,255,255,0.65)",
  },
  headerStats: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "10px 16px",
  },
  stat: { textAlign: "center", padding: "0 12px" },
  statVal: { fontSize: "1.25rem", fontWeight: 800, color: "#fff", fontFamily: "'Inter',sans-serif" },
  statLbl: { fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  statDiv: { width: 1, height: 32, background: "rgba(255,255,255,0.2)" },
  tabStrip: {
    display: "flex",
    gap: 4,
    overflowX: "auto",
    paddingBottom: 0,
    scrollbarWidth: "none",
  },
  tabBtn: {
    padding: "10px 16px",
    borderRadius: "10px 10px 0 0",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.8)",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "'Inter',sans-serif",
    letterSpacing: 0.2,
  },
  content: {
    background: "#f8fafc",
    borderRadius: "0 0 20px 20px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    borderTop: "none",
    minHeight: 400,
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  sectionTitle: { fontWeight: 700, color: "#1e293b", fontSize: "1rem" },
  sectionSub: { color: "#64748b", fontSize: "0.8rem", marginTop: 2 },
  taskBadge: {
    marginLeft: "auto",
    padding: "6px 14px",
    borderRadius: 99,
    fontWeight: 700,
    fontSize: "0.8rem",
  },
  tableWrap: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  },
  tableHead: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 18px",
    background: "#f1f5f9",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottom: "1px solid #e2e8f0",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 18px",
    borderBottom: "1px solid #f1f5f9",
  },
  horizonCard: {
    flex: 1,
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e0e7ff",
    padding: "18px 20px",
    boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
  },
  whyCard: {
    borderRadius: 14,
    border: "1.5px solid",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
};
