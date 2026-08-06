import { useState, useEffect } from "react";

const RICE_STAGES = [
  { id:1, name:"Land Prep",         full:"Land Preparation",    duration:"2 wks", daysFromStart:0,   activities:["Ploughing","Leveling","Puddling","Bund repair"],                          waterReq:"Saturated",            icon:"🚜", color:"#8b5cf6" },
  { id:2, name:"Sowing",            full:"Sowing / Transplanting", duration:"1 wk", daysFromStart:14,  activities:["Nursery prep","Transplanting seedlings","Spacing 20×15 cm"],            waterReq:"5–7 cm standing",      icon:"🌱", color:"#06b6d4" },
  { id:3, name:"Vegetative",        full:"Vegetative Stage",    duration:"4 wks", daysFromStart:21,  activities:["First weeding","N fertilizer (Day 21)","P fertilizer","Pest monitoring"], waterReq:"5 cm standing",        icon:"🌿", color:"#22c55e" },
  { id:4, name:"Tillering",         full:"Tillering",           duration:"3 wks", daysFromStart:49,  activities:["Second N application","Weed control","Pest/disease check","Water mgmt"],  waterReq:"3–5 cm standing",      icon:"🌾", color:"#16a34a" },
  { id:5, name:"Panicle Init",      full:"Panicle Initiation",  duration:"2 wks", daysFromStart:70,  activities:["Final N dose","Micronutrient spray","BPH monitoring","Maintain water"],   waterReq:"5–7 cm standing",      icon:"🌼", color:"#f59e0b" },
  { id:6, name:"Flowering",         full:"Flowering",           duration:"2 wks", daysFromStart:84,  activities:["No pesticide","Maintain water","Disease monitoring","Bird scaring"],       waterReq:"5 cm standing",        icon:"💮", color:"#ec4899" },
  { id:7, name:"Grain Filling",     full:"Grain Filling",       duration:"3 wks", daysFromStart:98,  activities:["Gradual water reduction","Potash spray","Fungicide if needed","Nutrient spray"], waterReq:"Intermittent",     icon:"🌾", color:"#f97316" },
  { id:8, name:"Harvest",           full:"Maturity & Harvest",  duration:"2 wks", daysFromStart:119, activities:["Drain field","Check grain moisture","Harvest at 20–22%","Proper drying"], waterReq:"Drain completely",     icon:"🎉", color:"#ef4444" },
];

const PALAKKAD_SEASONS = {
  mundakan: { name:"Mundakan (1st Crop)", startMonth:5,  duration:135 },
  virippu:  { name:"Virippu (2nd Crop)",  startMonth:10, duration:120 },
  puncha:   { name:"Puncha (3rd Crop)",   startMonth:2,  duration:110 },
};

const CSS = `
  @keyframes cc-glow { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.5)} 50%{box-shadow:0 0 0 8px rgba(22,163,74,0)} }
  @keyframes cc-slide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .cc-node { transition: transform 0.2s ease; }
  .cc-node:hover { transform: scale(1.12); }
  .cc-node-current { animation: cc-glow 2s infinite; }
  .cc-detail { animation: cc-slide 0.3s ease both; }
  .cc-act { transition: all 0.2s ease; }
  .cc-act:hover { background: #dcfce7 !important; transform: translateX(3px); }
`;

function injectCSS(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export default function CropCalendar({ crop = "Rice", sowingDate = null, season = "mundakan" }) {
  injectCSS("crop-calendar", CSS);
  const [currentStage, setCurrentStage] = useState(3);
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    if (sowingDate) {
      const days = Math.floor((new Date() - new Date(sowingDate)) / 86400000);
      const idx  = RICE_STAGES.findIndex((s, i) => {
        const next = RICE_STAGES[i + 1];
        return days >= s.daysFromStart && (!next || days < next.daysFromStart);
      });
      setCurrentStage(idx >= 0 ? idx : 0);
    }
  }, [sowingDate]);

  const displayIdx   = selectedStage ?? currentStage;
  const displayStage = RICE_STAGES[displayIdx];
  const progress     = (currentStage / (RICE_STAGES.length - 1)) * 100;
  const upcoming     = RICE_STAGES[currentStage + 1];

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.09)", border: "1px solid #e2e8f0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#14532d,#16a34a)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>📅</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "'Manrope',sans-serif" }}>Crop Calendar</div>
              <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>{crop} growth stages & activities</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 14px", fontSize: "0.8rem", fontWeight: 700 }}>
            {PALAKKAD_SEASONS[season]?.name ?? "Current Season"}
          </div>
        </div>

        {/* Overall progress bar */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", opacity: 0.8, marginBottom: 6 }}>
            <span>Season progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.25)", borderRadius: 99 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#4ade80", borderRadius: 99, transition: "width 0.8s ease" }} />
          </div>
        </div>
      </div>

      {/* Stage Timeline */}
      <div style={{ padding: "24px 20px 16px", overflowX: "auto" }}>
        <div style={{ display: "flex", position: "relative", minWidth: 520, paddingTop: 24 }}>
          {/* Track */}
          <div style={{ position: "absolute", top: 44, left: "6%", right: "6%", height: 4, background: "#e2e8f0", borderRadius: 99 }} />
          <div style={{ position: "absolute", top: 44, left: "6%", width: `${progress * 0.88}%`, height: 4, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: 99, transition: "width 0.8s ease" }} />

          {RICE_STAGES.map((stage, idx) => {
            const done    = idx < currentStage;
            const current = idx === currentStage;
            const sel     = idx === displayIdx;
            const stageColor = stage.color;

            return (
              <div
                key={stage.id}
                className={`cc-node ${current ? "cc-node-current" : ""}`}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", zIndex: 2 }}
                onClick={() => setSelectedStage(sel && selectedStage !== null ? null : idx)}
              >
                {current && (
                  <div style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", background: "#16a34a", color: "#fff", fontSize: "0.6rem", fontWeight: 800, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
                    NOW
                  </div>
                )}
                <div style={{
                  width: 40, height: 40,
                  borderRadius: "50%",
                  background: done ? stageColor : current ? "#fff" : "#f1f5f9",
                  border: `3px solid ${done || current ? stageColor : "#e2e8f0"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: done ? 14 : 18,
                  color: done ? "#fff" : undefined,
                  boxShadow: sel ? `0 0 0 4px ${stageColor}40, 0 4px 12px rgba(0,0,0,0.15)` : "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.25s ease",
                }}>
                  {done ? "✓" : stage.icon}
                </div>
                <span style={{
                  marginTop: 8, fontSize: "0.64rem", fontWeight: current ? 700 : 500,
                  color: current ? "#16a34a" : "#64748b", textAlign: "center", maxWidth: 60, lineHeight: 1.3,
                }}>
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 12 }}>
          {[{ dot: "#16a34a", label: "Completed" }, { dot: "#fff", border: "2px solid #16a34a", label: "Current" }, { dot: "#f1f5f9", border: "2px solid #e2e8f0", label: "Upcoming" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#64748b" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: l.dot, border: l.border }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Stage Detail Card */}
      <div className="cc-detail" key={displayIdx} style={{ margin: "0 16px 16px", background: "#f0fdf4", borderRadius: 16, border: "1px solid #bbf7d0", overflow: "hidden" }}>
        <div style={{ background: displayStage.color, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{displayStage.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#fff", fontFamily: "'Manrope',sans-serif" }}>{displayStage.full}</div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)" }}>Duration: {displayStage.duration}</div>
          </div>
          {displayIdx === currentStage && (
            <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>Active</div>
          )}
        </div>

        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#16a34a", marginBottom: 10 }}>Key Activities</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8, marginBottom: 14 }}>
            {displayStage.activities.map((act, i) => (
              <div key={i} className="cc-act" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fff", borderRadius: 10, fontSize: "0.83rem", color: "#1e293b", border: "1px solid #e2e8f0" }}>
                <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>✓</span>
                {act}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#dbeafe", borderRadius: 10, fontSize: "0.85rem", color: "#1e40af", fontWeight: 600 }}>
            <span>💧</span>
            Water Requirement: {displayStage.waterReq}
          </div>
        </div>
      </div>

      {/* Upcoming notice */}
      {upcoming && (
        <div style={{ margin: "0 16px 16px", padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⏰</span>
          <div style={{ fontSize: "0.83rem", color: "#92400e", lineHeight: 1.55 }}>
            <strong>Next stage:</strong> {upcoming.full} — prepare for{" "}
            {upcoming.activities.slice(0, 2).join(" & ")}
          </div>
        </div>
      )}
    </div>
  );
}
