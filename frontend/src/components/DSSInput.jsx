import { useState, useEffect } from "react";
import axios from "axios";
import { useLanguage } from "../LanguageContext";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin        { to{transform:rotate(360deg)} }
  @keyframes shimmer     { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.6} }
  @keyframes glow        { 0%,100%{box-shadow:0 0 20px rgba(34,197,94,0.2)} 50%{box-shadow:0 0 35px rgba(34,197,94,0.35)} }
  
  .agri-input:focus { border-color: rgba(34,197,94,0.5) !important; box-shadow: 0 0 0 4px rgba(34,197,94,0.1) !important; outline: none !important; background: rgba(255,255,255,0.05) !important; }
  .agri-input:hover { border-color: rgba(255,255,255,0.15) !important; }
  .agri-input { transition: all 0.25s ease !important; }
  .agri-select { appearance: none !important; -webkit-appearance: none !important; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2322c55e' d='M6 8L1 3h10z'/%3E%3C/svg%3E") !important; background-repeat: no-repeat !important; background-position: right 14px center !important; }
  .agri-submit:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 12px 40px rgba(34,197,94,0.4) !important; }
  .agri-submit:active:not(:disabled) { transform: translateY(-1px) scale(0.98) !important; }
  .agri-submit { transition: all 0.25s ease !important; }
  .crop-chip { transition: all 0.25s ease !important; cursor: pointer; }
  .crop-chip:hover { border-color: rgba(34,197,94,0.4) !important; background: rgba(34,197,94,0.1) !important; color: #FFF !important; transform: translateY(-2px) !important; }
  .crop-chip.active { border-color: rgba(34,197,94,0.5) !important; background: rgba(34,197,94,0.15) !important; color: #FFF !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

const CROPS = [
  { label: "Rice", icon: "🌾" },
  { label: "Wheat", icon: "🌿" },
  { label: "Sugarcane", icon: "🎋" },
  { label: "Coconut", icon: "🥥" },
  { label: "Maize", icon: "🌽" },
  { label: "Cotton", icon: "☁️" },
  { label: "Groundnut", icon: "🥜" },
];

function Label({ children, required }) {
  return (
    <label style={s.label}>
      {children}
      {required && <span style={{ color: "#22c55e", marginLeft: "4px" }}>*</span>}
    </label>
  );
}

export default function DSSInput({ setResult, detectedCrop, onCropUsed }) {
  inject("agri-dss", CSS);
  const { t } = useLanguage();

  const [form, setForm] = useState({ location: "Regional", crop: "Rice", sowing_date: "", check_date: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cropNotice, setCropNotice] = useState(null);

  // Handle detected crop from classifier
  useEffect(() => {
    if (detectedCrop && detectedCrop.crop) {
      const matchedCrop = CROPS.find(c => c.label.toLowerCase() === detectedCrop.crop.toLowerCase());
      if (matchedCrop) {
        setForm(prev => ({ ...prev, crop: matchedCrop.label }));
        setCropNotice({
          crop: matchedCrop.label,
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

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(""); if (k === "crop") setCropNotice(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sowing_date || !form.check_date) { setError("Please fill in both date fields"); return; }
    if (new Date(form.sowing_date) >= new Date(form.check_date)) { setError("Check date must be after sowing date"); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post("http://127.0.0.1:8000/dss", form);
      setResult(res.data);
    } catch {
      setError("Unable to connect to the backend. Please ensure the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const daysSince = form.sowing_date && form.check_date
    ? Math.max(0, Math.round((new Date(form.check_date) - new Date(form.sowing_date)) / 86400000))
    : null;

  return (
    <div style={{ fontFamily: "'Syne',sans-serif" }}>
      <div style={s.container}>
        <div style={s.glow} />

        {/* Header */}
        <div style={s.header}>
          <span style={s.badge}>DECISION SUPPORT</span>
          <h2 style={s.title}>Analysis Parameters</h2>
          <p style={s.sub}>Configure your crop monitoring parameters for AI-powered recommendations</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {/* Crop Picker */}
          <div>
            <Label>{t("crop")}</Label>
            <div style={s.cropGrid}>
              {CROPS.map(({ label, icon }) => (
                <button
                  key={label} type="button"
                  className={`crop-chip${form.crop === label ? " active" : ""}`}
                  onClick={() => set("crop", label)}
                  style={{ ...s.cropChip, ...(form.crop === label ? s.cropChipActive : {}) }}
                >
                  <span style={{ fontSize: "18px" }}>{icon}</span>
                  <span style={{ fontSize: "0.78rem", fontFamily: "'DM Mono',monospace" }}>{label}</span>
                </button>
              ))}
            </div>
            {/* Crop Detection Notice */}
            {cropNotice && (
              <div style={s.cropNotice}>
                <div style={s.noticeHeader}>
                  <span style={s.noticeIcon}>🔍</span>
                  <div>
                    <div style={s.noticeTitle}>
                      {cropNotice.notInList 
                        ? `Detected: ${cropNotice.crop} (not in crop list)` 
                        : `Auto-detected: ${cropNotice.crop}`}
                    </div>
                    <div style={s.noticeDetails}>
                      {cropNotice.growthStage && cropNotice.growthStage !== "Unknown" && (
                        <span style={s.noticeBadge}>📊 {cropNotice.growthStage}</span>
                      )}
                      {cropNotice.health && (
                        <span style={{
                          ...s.noticeBadge,
                          background: cropNotice.health === "Healthy" ? "rgba(34, 197, 94, 0.2)" :
                                     cropNotice.health === "Moderate" ? "rgba(245, 158, 11, 0.2)" :
                                     "rgba(239, 68, 68, 0.2)",
                          color: cropNotice.health === "Healthy" ? "#4ade80" :
                                 cropNotice.health === "Moderate" ? "#fbbf24" : "#f87171"
                        }}>
                          {cropNotice.health === "Healthy" ? "✅" : cropNotice.health === "Moderate" ? "⚠️" : "🚨"} {cropNotice.health}
                        </span>
                      )}
                      {cropNotice.confidence && (
                        <span style={s.noticeBadge}>🎯 {cropNotice.confidence}% confidence</span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setCropNotice(null)} 
                  style={s.noticeDismiss}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <Label>{t("location")}</Label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>📍</span>
              <input
                className="agri-input"
                type="text"
                value={form.location}
                onChange={e => set("location", e.target.value)}
                placeholder={t("locationPlaceholder")}
                style={s.input}
              />
            </div>
          </div>

          {/* Date row */}
          <div style={s.dateRow}>
            <div style={s.dateGroup}>
              <Label required>{t("sowingDate")}</Label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>🌱</span>
                <input
                  className="agri-input"
                  type="date"
                  value={form.sowing_date}
                  max={today}
                  onChange={e => set("sowing_date", e.target.value)}
                  required style={s.input}
                />
              </div>
              {form.sowing_date && (
                <p style={s.dateHint}>
                  {new Date(form.sowing_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
            <div style={s.dateGroup}>
              <Label required>{t("checkDate")}</Label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>📅</span>
                <input
                  className="agri-input"
                  type="date"
                  value={form.check_date}
                  min={form.sowing_date || undefined}
                  onChange={e => set("check_date", e.target.value)}
                  required style={s.input}
                />
              </div>
              {form.check_date && (
                <p style={s.dateHint}>
                  {new Date(form.check_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          {/* Duration preview */}
          {daysSince !== null && daysSince > 0 && (
            <div style={s.durationCard}>
              <div style={s.durationLeft}>
                <div style={{ fontSize: "0.65rem", color: "#64748b", letterSpacing: "1px", fontFamily: "'DM Mono',monospace", marginBottom: "4px" }}>
                  GROWTH DURATION
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#16a34a", fontFamily: "'Syne',sans-serif" }}>
                  {daysSince} <span style={{ fontSize: "1rem", color: "#475569" }}>days</span>
                </div>
              </div>
              <div style={s.durationRight}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "'DM Mono',monospace", marginBottom: "6px" }}>
                  {form.crop} Growth Stage
                </div>
                <div style={{ fontSize: "0.85rem", color: "#dc2626", fontWeight: "700" }}>
                  {getGrowthStage(form.crop, daysSince)}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ ...s.error, animation: "slideDown 0.3s ease" }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button
            className="agri-submit"
            type="submit"
            disabled={loading}
            style={{ ...s.submit, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: "18px" }}>◌</span>
                {t("loading")}
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <span>⚡</span>
                {t("runAnalysis")}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function getGrowthStage(crop, days) {
  const stages = {
    Rice:      [[20,"Germination"],[45,"Tillering"],[70,"Panicle Init."],[100,"Heading"],[130,"Ripening"],[999,"Mature"]],
    Wheat:     [[25,"Germination"],[50,"Tillering"],[80,"Jointing"],[110,"Heading"],[135,"Grain Fill"],[999,"Mature"]],
    Maize:     [[15,"Emergence"],[40,"V-Stage"],[65,"Tasseling"],[90,"Silking"],[120,"Grain Fill"],[999,"Mature"]],
    Sugarcane: [[30,"Germination"],[90,"Tillering"],[180,"Elongation"],[300,"Grand Growth"],[365,"Maturation"],[999,"Mature"]],
    Coconut:   [[90,"Seedling"],[365,"Juvenile"],[999,"Adult"]],
    Cotton:    [[20,"Germination"],[50,"Squaring"],[80,"Flowering"],[110,"Boll Set"],[160,"Boll Open"],[999,"Harvest"]],
    Groundnut: [[15,"Germination"],[35,"Flowering"],[65,"Peg Formation"],[90,"Pod Fill"],[999,"Mature"]],
  };
  const crop_stages = stages[crop] || stages["Rice"];
  for (const [d, stage] of crop_stages) { if (days <= d) return stage; }
  return "Mature";
}

const s = {
  container: { position: "relative", background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,244,0.95))", borderRadius: "24px", border: "1px solid rgba(34,197,94,0.2)", padding: "40px", marginBottom: "32px", overflow: "hidden", animation: "fadeSlideUp 0.4s ease-out", boxShadow: "0 20px 60px rgba(34,197,94,0.1)", backdropFilter: "blur(20px)" },
  glow: { position: "absolute", top: 0, left: 0, width: "400px", height: "400px", background: "radial-gradient(circle at top left,rgba(34,197,94,0.08),transparent 60%)", pointerEvents: "none" },
  header: { marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid rgba(34,197,94,0.15)" },
  badge: { display: "inline-block", marginBottom: "14px", padding: "8px 18px", borderRadius: "100px", background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid rgba(34,197,94,0.3)", color: "#16a34a", fontSize: "0.75rem", fontWeight: "600", fontFamily: "'Poppins',sans-serif", letterSpacing: "0.5px" },
  title: { margin: "0 0 10px", color: "#1e293b", fontSize: "1.6rem", fontWeight: "700", fontFamily: "'Poppins',sans-serif", letterSpacing: "-0.5px", background: "linear-gradient(135deg, #16a34a, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  sub: { margin: 0, color: "#64748b", fontSize: "0.95rem", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: "26px" },

  label: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontSize: "0.85rem", fontWeight: "600", color: "#16a34a", fontFamily: "'Poppins',sans-serif", letterSpacing: "0.3px" },

  cropGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" },
  cropChip: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px 10px", borderRadius: "16px", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(34,197,94,0.15)", color: "#475569", fontFamily: "'Inter',sans-serif", cursor: "pointer", transition: "all 0.25s ease", boxShadow: "0 4px 15px rgba(34,197,94,0.05)" },
  cropChipActive: { background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid #22c55e", color: "#16a34a", boxShadow: "0 8px 30px rgba(34,197,94,0.2)" },

  inputWrap: { display: "flex", alignItems: "center", gap: "0", position: "relative" },
  inputIcon: { position: "absolute", left: "16px", fontSize: "18px", zIndex: 1, pointerEvents: "none" },
  input: { width: "100%", padding: "16px 20px 16px 50px", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "14px", fontSize: "0.95rem", fontFamily: "'Inter',sans-serif", fontWeight: "500", background: "rgba(255,255,255,0.9)", color: "#1e293b", transition: "all 0.25s ease" },
  dateHint: { margin: "10px 0 0", fontSize: "0.78rem", color: "#16a34a", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: "6px", fontWeight: "500" },

  dateRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  dateGroup: { display: "flex", flexDirection: "column" },

  durationCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 28px", borderRadius: "16px", background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid rgba(34,197,94,0.25)", borderLeft: "5px solid #22c55e" },
  durationLeft: {},
  durationRight: { textAlign: "right" },

  error: { display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderRadius: "14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", fontSize: "0.9rem", fontWeight: "500", fontFamily: "'Inter',sans-serif" },

  submit: { padding: "18px 36px", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#FFF", border: "none", borderRadius: "14px", fontSize: "1rem", fontWeight: "600", fontFamily: "'Poppins',sans-serif", boxShadow: "0 10px 40px rgba(34,197,94,0.35)", marginTop: "12px", cursor: "pointer", transition: "all 0.25s ease" },

  // Crop Notice styles
  cropNotice: { marginTop: "18px", padding: "18px 22px", background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", animation: "fadeSlideUp 0.3s ease-out" },
  noticeHeader: { display: "flex", alignItems: "flex-start", gap: "12px" },
  noticeIcon: { fontSize: "24px", marginTop: "2px" },
  noticeTitle: { fontSize: "0.95rem", fontWeight: "600", color: "#16a34a", marginBottom: "8px", fontFamily: "'Poppins',sans-serif" },
  noticeDetails: { display: "flex", flexWrap: "wrap", gap: "10px" },
  noticeBadge: { display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", background: "rgba(255,255,255,0.8)", borderRadius: "100px", fontSize: "0.78rem", fontWeight: "500", color: "#475569", fontFamily: "'Inter',sans-serif", border: "1px solid rgba(34,197,94,0.2)" },
  noticeDismiss: { padding: "6px 10px", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(34,197,94,0.2)", color: "#64748b", fontSize: "14px", cursor: "pointer", borderRadius: "10px", transition: "all 0.2s ease" },
};