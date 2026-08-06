import { useState, useEffect } from "react";

const CROP_WATER_NEEDS = {
  rice:       { "Land Preparation":10, "Transplanting":8, "Vegetative":6, "Tillering":7, "Panicle Initiation":8, "Flowering":8, "Grain Filling":5, "Maturity":0 },
  coconut:    { default:40 },
  banana:     { default:25 },
  vegetables: { default:5  },
};

const SOIL_TYPES = {
  clay:         { capacity:0.45, adjustment:0.8  },
  loam:         { capacity:0.35, adjustment:1.0  },
  sandy:        { capacity:0.20, adjustment:1.3  },
  "clay loam":  { capacity:0.40, adjustment:0.9  },
};

const CSS = `
  @keyframes is-count { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  @keyframes is-fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .is-stat { transition: all 0.25s ease; }
  .is-stat:hover { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(14,165,233,0.18) !important; }
  .is-slot { transition: all 0.2s ease; }
  .is-slot:hover { background: #fff !important; }
`;

function injectCSS(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export default function IrrigationScheduler({
  crop = "rice", growthStage = "Tillering", soilType = "clay loam",
  temperature = 28, humidity = 75, rainfall = 0, landArea = 1,
}) {
  injectCSS("irrigation-scheduler", CSS);
  const [schedule, setSchedule] = useState(null);
  const [nextIrrigation, setNextIrrigation] = useState(null);

  useEffect(() => {
    const baseReq = CROP_WATER_NEEDS[crop]?.[growthStage] ?? CROP_WATER_NEEDS[crop]?.default ?? 6;
    const soil    = SOIL_TYPES[soilType] ?? SOIL_TYPES.loam;
    const etFactor = 1 + (temperature - 25) * 0.04 - (humidity - 60) * 0.01;
    const effRain  = rainfall * 0.8;
    const dailyNeed = Math.max(0, baseReq * etFactor * soil.adjustment - effRain);
    const interval  = rainfall > 5 ? 3 : rainfall > 0 ? 2 : 1;
    const volPerDay = dailyNeed * landArea * 10;
    const volPerSession = volPerDay * interval;
    const duration = Math.round(volPerSession / 0.01 / 60);

    setSchedule({
      dailyNeed: dailyNeed.toFixed(1),
      totalVolume: volPerDay.toFixed(0),
      interval,
      duration,
      optimalTime: temperature > 32 ? "6:00 AM / 5:00 PM" : "7:00 – 9:00 AM",
      method: crop === "rice" ? "Flood irrigation" : "Drip / Sprinkler",
      efficiency: crop === "rice" ? 60 : 90,
      savings: rainfall > 0 ? Math.round(effRain * landArea * 10) : 0,
      volumeK: ((volPerDay * interval) / 1000).toFixed(1),
    });

    const now = new Date();
    const next = new Date(now);
    if (now.getHours() > 9) next.setDate(next.getDate() + 1);
    next.setHours(7, 0, 0, 0);
    setNextIrrigation(next);
  }, [crop, growthStage, soilType, temperature, humidity, rainfall, landArea]);

  const fmtDate = (d) => {
    if (!d) return "--";
    const today = new Date(), tmrw = new Date(today);
    tmrw.setDate(tmrw.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tmrw.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
  };

  const statusInfo = !schedule ? { bg: "#f0f9ff", color: "#0369a1", icon: "💧", text: "Calculating…" }
    : rainfall > 10   ? { bg: "#dcfce7", color: "#166534", icon: "🌧️", text: "Rain sufficient" }
    : schedule.dailyNeed < 3 ? { bg: "#dbeafe", color: "#1e40af", icon: "💧", text: "Low demand" }
    : schedule.dailyNeed > 7 ? { bg: "#fef3c7", color: "#92400e", icon: "⚠️", text: "High demand" }
    : { bg: "#f0fdf4", color: "#166534", icon: "✅", text: "Normal" };

  const STATS = schedule ? [
    { icon: "💧", value: `${schedule.dailyNeed}`, unit: "mm/day",  label: "Daily need",  color: "#0ea5e9", bg: "#f0f9ff" },
    { icon: "🪣", value: schedule.totalVolume,     unit: "m³/day",  label: "Total volume", color: "#8b5cf6", bg: "#f5f3ff" },
    { icon: "📅", value: `${schedule.interval}d`,  unit: "interval", label: "Frequency",  color: "#16a34a", bg: "#f0fdf4" },
    { icon: "⏱️", value: `${schedule.duration}`,   unit: "min",     label: "Duration",   color: "#f59e0b", bg: "#fffbeb" },
  ] : [];

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.09)", border: "1px solid #e2e8f0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>💧</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "'Manrope',sans-serif" }}>Irrigation Scheduler</div>
              <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>{crop} · {growthStage} · {soilType} soil</div>
            </div>
          </div>
          <div style={{ background: statusInfo.bg, color: statusInfo.color, borderRadius: 20, padding: "6px 14px", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            {statusInfo.icon} {statusInfo.text}
          </div>
        </div>

        {/* Mini context strip */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {[
            { label: "Temp", val: `${temperature}°C`, icon: "🌡️" },
            { label: "Humidity", val: `${humidity}%`, icon: "💧" },
            { label: "Rainfall", val: `${rainfall}mm`, icon: "🌧️" },
            { label: "Area", val: `${landArea} ha`, icon: "🌾" },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem" }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{val}</div>
              <div style={{ fontSize: "0.62rem", opacity: 0.75 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {schedule && (
        <div style={{ padding: 16, animation: "is-fade 0.4s ease both" }}>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            {STATS.map((s, i) => (
              <div key={i} className="is-stat" style={{ background: s.bg, borderRadius: 14, padding: "14px 10px", textAlign: "center", border: `1px solid ${s.color}20`, boxShadow: `0 2px 10px ${s.color}14` }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: s.color, fontFamily: "'Manrope',sans-serif", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: 3 }}>{s.unit}</div>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Next irrigation box */}
          <div style={{ background: "linear-gradient(135deg,#e0f2fe,#bae6fd)", borderRadius: 16, padding: 16, marginBottom: 14, border: "1px solid #7dd3fc" }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0369a1", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              📅 Next Irrigation Schedule
              <span style={{ marginLeft: "auto", fontSize: "0.78rem", fontWeight: 600, color: "#0284c7" }}>
                {schedule.method} · {schedule.efficiency}% efficiency
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { icon: "📆", label: "Date",      val: fmtDate(nextIrrigation) },
                { icon: "⏰", label: "Best Time",  val: schedule.optimalTime },
                { icon: "⏱️", label: "Duration",   val: `${schedule.duration} min` },
                { icon: "🪣", label: "Volume",     val: `${schedule.volumeK}k L` },
              ].map(({ icon, label, val }) => (
                <div key={label} className="is-slot" style={{ background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0c4a6e" }}>{val}</div>
                  <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Savings or tip */}
          {schedule.savings > 0 ? (
            <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0", display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.83rem", color: "#166534" }}>
              <span style={{ fontSize: 18 }}>🌧️</span>
              <span><strong>Rain bonus!</strong> Recent rainfall saves approx. {schedule.savings} m³ of irrigation water. Reduce frequency accordingly.</span>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0", display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.83rem", color: "#166534" }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <span><strong>Water-saving tip:</strong> Irrigate early morning (6–9 AM) to reduce evaporation by up to 30%. For {crop}, {schedule.method.toLowerCase()} is recommended at this stage.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
