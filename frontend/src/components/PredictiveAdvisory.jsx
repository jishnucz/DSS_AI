/**
 * Predictive Advisory — LIVE 7-day crop stress forecast for Palakkad.
 *
 * Data source: `/api/ensemble/forecast` (backend ensemble_inference.py)
 * Models: LightGBM (86.39%) + XGBoost (84.10%) trained in
 *   research_analysis/notebooks/Palakkad_Ensemble_Forecasting.ipynb
 * Live weather: Open-Meteo (ECMWF IFS + GFS)
 *
 * Replaces the earlier seeded-random mockup with real data from the trained pipeline.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, AlertCircle, CheckCircle2, CloudSun, Brain,
  Wheat, MapPin, BarChart3, ShieldAlert, RadioTower, Loader2, Flame,
} from "lucide-react";

// Backend base URL — keep absolute so the Live 7-Day Forecast page works
// regardless of how the frontend is served (Vite dev, built dist via FastAPI,
// or a remote tunnel).
const API = "http://localhost:8000";

const CSS = `
  @keyframes pa-fade  { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes pa-pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
  @keyframes pa-spin  { to { transform: rotate(360deg); } }
  .pa-card { animation: pa-fade 0.4s ease both; }
  .pa-live { animation: pa-pulse 2s ease-in-out infinite; }
  .pa-spin { animation: pa-spin 1.1s linear infinite; }
`;
function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const s = document.createElement("style");
    s.setAttribute("data-id", id);
    s.textContent = css;
    document.head.appendChild(s);
  }
}

// Vivid stress palette — high-contrast on light backgrounds
const STRESS_COLOR = { None: "#16a34a", Low: "#ea580c", High: "#dc2626" };
const STRESS_BG    = { None: "#ecfdf5", Low: "#fff7ed", High: "#fef2f2" };
const STRESS_BORDER= { None: "#bbf7d0", Low: "#fed7aa", High: "#fecaca" };
const StressIcon = ({ label, size = 14 }) => {
  if (label === "None") return <CheckCircle2 size={size} strokeWidth={2.4} />;
  if (label === "Low")  return <AlertCircle  size={size} strokeWidth={2.4} />;
  if (label === "High") return <Flame        size={size} strokeWidth={2.4} />;
  return null;
};

function StressPill({ label, conf }) {
  const c = STRESS_COLOR[label]  || "#475569";
  const bg= STRESS_BG[label]     || "#f1f5f9";
  const bd= STRESS_BORDER[label] || "#cbd5e1";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 99, fontSize: "0.78rem", fontWeight: 800,
      background: bg, border: `1.5px solid ${bd}`, color: c,
    }}>
      <StressIcon label={label} />
      {label} {conf != null && <span style={{ opacity: 0.78, fontWeight: 600 }}>{Math.round(conf * 100)}%</span>}
    </span>
  );
}

function ProbBar({ p_none, p_low, p_high }) {
  const total = p_none + p_low + p_high || 1;
  const pn = (p_none / total) * 100;
  const pl = (p_low  / total) * 100;
  const ph = (p_high / total) * 100;
  return (
    <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden",
                  background: "#f1f5f9", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}>
      <div title={`None ${pn.toFixed(0)}%`} style={{ width: `${pn}%`, background: STRESS_COLOR.None, transition: "width 0.4s ease" }} />
      <div title={`Low ${pl.toFixed(0)}%`}  style={{ width: `${pl}%`, background: STRESS_COLOR.Low,  transition: "width 0.4s ease" }} />
      <div title={`High ${ph.toFixed(0)}%`} style={{ width: `${ph}%`, background: STRESS_COLOR.High, transition: "width 0.4s ease" }} />
    </div>
  );
}

function DayCard({ row }) {
  const date = new Date(row.date);
  const isToday = row.days_ahead === 0;
  const label = isToday
    ? "Today"
    : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const c  = STRESS_COLOR[row.stress_lbl] || "#475569";
  const bg = STRESS_BG[row.stress_lbl]    || "#ffffff";
  return (
    <div style={{
      background: "#ffffff",
      border: `1px solid ${STRESS_BORDER[row.stress_lbl] || "#e2e8f0"}`,
      borderLeft: `5px solid ${c}`,
      borderRadius: 12, padding: "16px 18px", display: "grid",
      gridTemplateColumns: "minmax(110px,1fr) minmax(180px,1.4fr) minmax(200px,1.6fr) minmax(240px,3fr)",
      gap: 16, alignItems: "center",
      boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
    }}>
      <div>
        <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase",
                      fontWeight: 700, letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
          {isToday ? date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
                   : `+${row.days_ahead} day${row.days_ahead === 1 ? "" : "s"}`}
        </div>
      </div>
      <div>
        <StressPill label={row.stress_lbl} conf={row.confidence} />
        <div style={{ marginTop: 8 }}>
          <ProbBar p_none={row.p_none} p_low={row.p_low} p_high={row.p_high} />
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px",
                    fontSize: "0.82rem", color: "#1e293b", fontWeight: 600 }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
          <span style={{ color: "#94a3b8", fontWeight: 500 }}>Tmax</span>
          <strong style={{ color: row.tmax > 36 ? "#dc2626" : "#0f172a" }}>{row.tmax.toFixed(1)}°C</strong>
        </span>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
          <span style={{ color: "#94a3b8", fontWeight: 500 }}>Tmin</span>
          <strong style={{ color: "#0f172a" }}>{row.tmin.toFixed(1)}°C</strong>
        </span>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
          <span style={{ color: "#94a3b8", fontWeight: 500 }}>Rain</span>
          <strong style={{ color: row.rain > 40 ? "#2563eb" : "#0f172a" }}>{row.rain.toFixed(1)}mm</strong>
        </span>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
          <span style={{ color: "#94a3b8", fontWeight: 500 }}>SWB</span>
          <strong style={{ color: row.swb < 0.3 ? "#dc2626" : row.swb < 0.5 ? "#ea580c" : "#16a34a" }}>
            {row.swb.toFixed(2)}
          </strong>
        </span>
      </div>
      <div style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.5,
                    background: bg, borderRadius: 8, padding: "8px 10px",
                    borderLeft: `3px solid ${c}` }}>
        {row.advisory || "—"}
      </div>
    </div>
  );
}

export default function PredictiveAdvisory() {
  inject("pa-v2", CSS);
  const [data, setData]   = useState(null);
  const [info, setInfo]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaluk, setSelectedTaluk] = useState(null);
  const [now, setNow]     = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [forecastRes, infoRes] = await Promise.all([
          fetch(`${API}/api/ensemble/forecast`),
          fetch(`${API}/api/ensemble/info`),
        ]);
        if (!forecastRes.ok) throw new Error(`Forecast HTTP ${forecastRes.status} — ensure backend is running on :8000`);
        if (!infoRes.ok)     throw new Error(`Info HTTP ${infoRes.status} — ensure backend is running on :8000`);
        const f = await forecastRes.json();
        const i = await infoRes.json();
        if (cancelled) return;
        setData(f);
        setInfo(i);
        if (f.taluks?.length && !selectedTaluk) {
          setSelectedTaluk(f.taluks[0].taluk);
        }
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const taluk = useMemo(() => {
    if (!data?.taluks) return null;
    return data.taluks.find(t => t.taluk === selectedTaluk) || data.taluks[0];
  }, [data, selectedTaluk]);

  const taluks = data?.taluks || [];

  // Aggregate alerts across all taluks
  const alerts = useMemo(() => {
    const out = [];
    taluks.forEach(t => (t.rows || []).forEach(r => {
      if (r.stress_lbl === "High") {
        out.push({ taluk: t.taluk, date: r.date, days_ahead: r.days_ahead,
                   message: r.advisory, conf: r.confidence });
      }
    }));
    return out;
  }, [taluks]);

  const S = {
    root:    { fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0f172a" },
    header:  {
      background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)",
      borderRadius: 18, padding: "24px 28px 22px", marginBottom: 16,
      boxShadow: "0 8px 24px rgba(37, 99, 235, 0.25)",
      color: "#ffffff",
    },
    card:    {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 16, padding: "20px 22px", marginBottom: 16,
      boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
    },
    sectionTitle: { fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: 6 },
    sectionSub:   { fontSize: "0.78rem", color: "#64748b", marginBottom: 14 },
    talukChip: (active) => ({
      padding: "10px 18px", borderRadius: 10, border: "2px solid",
      fontSize: "0.84rem", fontWeight: 700, cursor: "pointer",
      transition: "all 0.18s ease",
      background: active ? "#2563eb" : "#ffffff",
      borderColor: active ? "#2563eb" : "#cbd5e1",
      color: active ? "#ffffff" : "#334155",
      boxShadow: active ? "0 4px 10px rgba(37, 99, 235, 0.28)" : "none",
      display: "inline-flex", alignItems: "center", gap: 8,
    }),
  };

  if (loading) {
    return (
      <div style={S.root}>
        <div style={S.card}>
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
            <Loader2 className="pa-spin" size={40} color="#2563eb"
                     style={{ marginBottom: 14 }} />
            <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 6, color: "#0f172a" }}>
              Loading live forecast…
            </div>
            <div style={{ fontSize: "0.85rem" }}>
              Fetching Open-Meteo data + running LightGBM ensemble for all 5 taluks
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={S.root}>
        <div style={{ ...S.card, borderColor: "#fecaca", background: "#fef2f2" }}>
          <div style={{ color: "#dc2626", fontWeight: 800, fontSize: "1.05rem", marginBottom: 8,
                          display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={20} strokeWidth={2.4} />
            Forecast unavailable
          </div>
          <div style={{ fontSize: "0.88rem", color: "#7f1d1d", marginBottom: 10 }}>{error}</div>
          <div style={{ fontSize: "0.78rem", color: "#991b1b" }}>
            Possible causes: backend not running, <code style={{ background:"#fff", padding:"1px 6px", borderRadius:4 }}>Output_nwp/</code> models missing,
            or Open-Meteo API unreachable. Try <code style={{ background:"#fff", padding:"1px 6px", borderRadius:4 }}>python backend/app.py</code>.
          </div>
        </div>
      </div>
    );
  }

  const rows = taluk?.rows || [];

  return (
    <div style={S.root}>

      {/* Header */}
      <div style={S.header} className="pa-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{ width: 54, height: 54, borderRadius: 14,
                            background: "rgba(255,255,255,0.18)",
                            backdropFilter: "blur(8px)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}>
                <Wheat size={28} strokeWidth={2.2} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 900, color: "#ffffff",
                              letterSpacing: -0.3 }}>
                  Live Crop Stress Forecast — Palakkad
                </h2>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.82)" }}>
                  {data?.as_of || "—"} · Updated {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7,
                              background: "rgba(34,197,94,0.95)", border: "1px solid #16a34a",
                              borderRadius: 99, padding: "5px 14px", fontSize: "0.74rem",
                              color: "#ffffff", fontWeight: 800,
                              boxShadow: "0 2px 6px rgba(22,163,74,0.35)" }}>
                <span className="pa-live" style={{ width: 7, height: 7, borderRadius: "50%",
                                                     background: "#ffffff",
                                                     boxShadow: "0 0 0 2px rgba(255,255,255,0.4)" }} />
                {taluk?.source === "API" ? "LIVE · OPEN-METEO" : "MASTER CSV"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
                              background: "#ffffff", border: "1px solid #dbeafe",
                              borderRadius: 99, padding: "5px 14px", fontSize: "0.74rem",
                              color: "#1e40af", fontWeight: 800 }}>
                <Brain size={13} strokeWidth={2.4} /> {info?.live_inference || "Ensemble"}
              </span>
              {info?.ensemble?.test_acc != null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
                                background: "#faf5ff", border: "1px solid #e9d5ff",
                                borderRadius: 99, padding: "5px 14px", fontSize: "0.74rem",
                                color: "#7c3aed", fontWeight: 800 }}>
                  Ensemble test acc: {(info.ensemble.test_acc * 100).toFixed(2)}%
                </span>
              )}
              {alerts.length > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
                                background: "#dc2626", border: "1px solid #b91c1c",
                                borderRadius: 99, padding: "5px 14px", fontSize: "0.74rem",
                                color: "#ffffff", fontWeight: 800,
                                boxShadow: "0 2px 6px rgba(220,38,38,0.4)" }}>
                  <AlertTriangle size={13} strokeWidth={2.4} /> {alerts.length} HIGH stress alert{alerts.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Taluk selector */}
      <div style={{ ...S.card, padding: "16px 20px" }}>
        <div style={{ ...S.sectionTitle, marginBottom: 12 }}>Select Taluk</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {taluks.map(t => {
            const isActive = t.taluk === taluk?.taluk;
            const worst = (t.rows || []).reduce((acc, r) =>
              r.stress_idx > acc ? r.stress_idx : acc, 0);
            const worstLbl  = ["None", "Low", "High"][worst];
            const dotColor  = STRESS_COLOR[worstLbl];
            return (
              <button key={t.taluk}
                style={S.talukChip(isActive)}
                onClick={() => setSelectedTaluk(t.taluk)}>
                <span>{t.taluk}</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "2px 8px", borderRadius: 99,
                  fontSize: "0.66rem", fontWeight: 700,
                  background: isActive ? "rgba(255,255,255,0.18)" : STRESS_BG[worstLbl],
                  color: isActive ? "#ffffff" : dotColor,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%",
                                 background: isActive ? "#ffffff" : dotColor }} />
                  {worstLbl}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7-day forecast for selected taluk */}
      {taluk && (
        <div style={S.card} className="pa-card">
          <div style={S.sectionTitle}>
            {taluk.taluk} — 8-day forecast · dominant crop: <span style={{ color: "#2563eb" }}>
              {rows[0]?.crop || "Rice"}
            </span>
          </div>
          <div style={S.sectionSub}>
            Stress class + probabilities + weather + agronomic advisory per day.
            Source: <strong style={{ color: "#0f172a" }}>{taluk.source}</strong> · Model: <strong style={{ color: "#0f172a" }}>{taluk.model}</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r, i) => <DayCard key={i} row={r} />)}
            {rows.length === 0 && (
              <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No rows returned.</div>
            )}
          </div>
        </div>
      )}

      {/* Multi-taluk alert summary */}
      {alerts.length > 0 && (
        <div style={{ ...S.card, borderColor: "#fecaca", background: "#fef2f2" }}>
          <div style={{ ...S.sectionTitle, color: "#dc2626",
                          display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldAlert size={18} strokeWidth={2.4} />
            District-wide High Stress Alerts
          </div>
          <div style={{ ...S.sectionSub, color: "#991b1b" }}>
            All HIGH-stress predictions across the 5 taluks in the next 7 days.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1.5px solid #fca5a5",
                                     borderLeft: "5px solid #dc2626",
                                     borderRadius: 10, padding: "12px 14px",
                                     boxShadow: "0 1px 3px rgba(220,38,38,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "#dc2626" }}>{a.taluk}</span>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
                    +{a.days_ahead}d · {a.date}
                  </span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.45 }}>{a.message}</div>
                <div style={{ marginTop: 6, fontSize: "0.72rem", color: "#64748b" }}>
                  confidence <strong style={{ color: "#dc2626" }}>{Math.round(a.conf * 100)}%</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model ensemble info */}
      {info?.models && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Trained Ensemble — Test Set Accuracy</div>
          <div style={S.sectionSub}>
            All 6 models trained on 1984–2013, validated on 2013–2020, tested on 2020–2026.
            Final ensemble: <strong style={{ color: "#7c3aed" }}>{info.ensemble?.kind || "stacking"}</strong>
            ({(info.ensemble?.test_acc * 100).toFixed(2)}%, F1 {info.ensemble?.test_f1?.toFixed(4)}).
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {info.models.map((m, i) => {
              // Vivid per-model colour palette
              const palette = ["#16a34a","#2563eb","#7c3aed","#0891b2","#ea580c","#db2777"];
              const c = palette[i % palette.length];
              return (
                <div key={m.name} style={{ background: "#ffffff",
                                            border: "1px solid #e2e8f0",
                                            borderTop: `4px solid ${c}`,
                                            borderRadius: 10, padding: "12px 14px",
                                            boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>{m.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: 8, fontWeight: 600 }}>{m.type}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 900, color: c }}>
                      {(m.test_acc * 100).toFixed(2)}%
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>test acc</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                    <div style={{ width: `${m.test_acc * 100}%`, height: "100%", background: c,
                                    transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
