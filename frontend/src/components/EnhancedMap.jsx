/**
 * Advanced Regional Agricultural Intelligence Map v3
 * Crop zone polygons · Satellite/Dark/Terrain tiles · Disease hotspots
 * LSTM forecast risk · Village alerts · Real-time layer toggles
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Circle,
  Polygon, Tooltip, useMap, useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes map-fade    { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes map-pulse   { 0%,100%{transform:scale(1)}50%{transform:scale(1.08)} }
  @keyframes map-ring    { 0%{transform:scale(0.8);opacity:0.9}100%{transform:scale(2.2);opacity:0} }
  @keyframes map-blink   { 0%,100%{opacity:1}50%{opacity:0.3} }
  @keyframes map-spin    { to{transform:rotate(360deg)} }
  @keyframes marker-drop { from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)} }
  .map-pulse-ring {
    position:absolute;width:100%;height:100%;border-radius:50%;
    border:2px solid currentColor;animation:map-ring 1.8s ease-out infinite;
  }
  .map-pulse-ring2 { animation-delay:0.9s; }
  .map-layer-btn { transition: all 0.2s ease !important; }
  .map-layer-btn:hover { transform:translateX(3px) !important; }
  .map-layer-btn.active { background:linear-gradient(135deg,#1d4ed8,#2563eb) !important; color:#fff !important; border-color:transparent !important; }
  .map-taluk-card { transition: all 0.2s ease !important; cursor:pointer; }
  .map-taluk-card:hover { background:#1e3a5f !important; border-color:#3b82f6 !important; transform:translateX(3px) !important; }
  .map-taluk-card.selected { background:#1e3a5f !important; border-color:#3b82f6 !important; }
  .leaflet-container { font-family: 'Inter',sans-serif !important; }
  .leaflet-popup-content-wrapper { border-radius:18px !important; box-shadow:0 16px 48px rgba(0,0,0,0.28) !important; padding:0 !important; overflow:hidden !important; border:none !important; }
  .leaflet-popup-content { margin:0 !important; }
  .leaflet-popup-tip-container { display:none !important; }
  .leaflet-popup-close-button { color:#64748b !important; font-size:18px !important; top:10px !important; right:12px !important; }
  .leaflet-tooltip { background:rgba(10,20,40,0.92) !important; border:1px solid rgba(99,179,237,0.3) !important; color:#e2e8f0 !important; border-radius:8px !important; font-size:11px !important; font-weight:600 !important; padding:5px 10px !important; box-shadow:0 4px 14px rgba(0,0,0,0.4) !important; }
  .leaflet-tooltip-top::before { border-top-color:rgba(99,179,237,0.3) !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// ─── Polygon generator ───────────────────────────────────────────────────────
function makePoly(lat, lng, areaSqKm, rotation = 0) {
  const R = Math.sqrt(areaSqKm / Math.PI) * 0.8;
  const dlat = R / 111;
  const dlng = R / (111 * Math.cos((lat * Math.PI) / 180));
  const offsets = [
    [1.00, -0.05], [0.72,  0.82], [0.10,  1.00],
    [-0.62, 0.78], [-1.00,  0.05], [-0.75, -0.72],
    [-0.08, -1.00], [0.65, -0.80],
  ];
  const r = rotation * Math.PI / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  return offsets.map(([dy, dx]) => {
    const ry = dy * cos - dx * sin;
    const rx = dy * sin + dx * cos;
    return [lat + dlat * ry, lng + dlng * rx];
  });
}

// ─── Seeded deterministic helpers ────────────────────────────────────────────
function seeded(seed, mul = 9301, add = 49297, mod = 233280) {
  let x = Math.sin(seed * mul + add) * mod;
  return x - Math.floor(x);
}
function seededStress(seed)    { return Math.floor(seeded(seed) * 65 + 12); }
function seededForecast(seed)  { return Math.floor(seeded(seed, 7213, 8642) * 70 + 15); }
function seededDisease(seed)   { return seeded(seed, 3571, 1234); }

// ─── Core data ───────────────────────────────────────────────────────────────
const TALUKS = [
  { name:"Palakkad",       district:"Palakkad",    lat:10.7867, lng:76.6548, area:248, mainCrop:"Rice",      rainfall:2100, soil:"Alluvial",   seed:1,  rot:5  },
  { name:"Chittur",        district:"Palakkad",    lat:10.6958, lng:76.7332, area:521, mainCrop:"Coconut",   rainfall:1800, soil:"Laterite",   seed:2,  rot:12 },
  { name:"Ottappalam",     district:"Palakkad",    lat:10.7710, lng:76.3800, area:429, mainCrop:"Rice",      rainfall:2300, soil:"Alluvial",   seed:3,  rot:-8 },
  { name:"Alathur",        district:"Palakkad",    lat:10.6482, lng:76.5361, area:453, mainCrop:"Banana",    rainfall:1900, soil:"Clay Loam",  seed:4,  rot:20 },
  { name:"Mannarkkad",     district:"Palakkad",    lat:10.9925, lng:76.4608, area:728, mainCrop:"Pepper",    rainfall:2500, soil:"Laterite",   seed:5,  rot:3  },
  { name:"Pattambi",       district:"Palakkad",    lat:10.8053, lng:76.1876, area:235, mainCrop:"Rice",      rainfall:2200, soil:"Alluvial",   seed:6,  rot:-15 },
  { name:"Shoranur",       district:"Palakkad",    lat:10.7660, lng:76.2790, area:198, mainCrop:"Rice",      rainfall:2050, soil:"Alluvial",   seed:7,  rot:8  },
  { name:"Nemmara",        district:"Palakkad",    lat:10.5926, lng:76.5048, area:312, mainCrop:"Coconut",   rainfall:1750, soil:"Laterite",   seed:8,  rot:-10 },
  { name:"Thrissur",       district:"Thrissur",    lat:10.5276, lng:76.2144, area:312, mainCrop:"Rice",      rainfall:2800, soil:"Alluvial",   seed:9,  rot:6  },
  { name:"Kodungallur",    district:"Thrissur",    lat:10.2260, lng:76.1930, area:189, mainCrop:"Coconut",   rainfall:3000, soil:"Laterite",   seed:10, rot:-5 },
  { name:"Chavakkad",      district:"Thrissur",    lat:10.5906, lng:76.0176, area:267, mainCrop:"Vegetables",rainfall:2600, soil:"Sandy Loam", seed:11, rot:15 },
  { name:"Malappuram",     district:"Malappuram",  lat:11.0509, lng:76.0710, area:387, mainCrop:"Arecanut",  rainfall:2400, soil:"Laterite",   seed:12, rot:-3 },
  { name:"Perinthalmanna", district:"Malappuram",  lat:10.9768, lng:76.2310, area:423, mainCrop:"Rubber",    rainfall:2200, soil:"Laterite",   seed:13, rot:18 },
  { name:"Tirur",          district:"Malappuram",  lat:10.9160, lng:75.9220, area:298, mainCrop:"Coconut",   rainfall:2700, soil:"Sandy Loam", seed:14, rot:-12 },
  { name:"Kozhikode",      district:"Kozhikode",   lat:11.2588, lng:75.7804, area:342, mainCrop:"Coconut",   rainfall:3200, soil:"Laterite",   seed:15, rot:7  },
  { name:"Vatakara",       district:"Kozhikode",   lat:11.6027, lng:75.5920, area:289, mainCrop:"Coconut",   rainfall:3100, soil:"Sandy Loam", seed:16, rot:-8 },
];

const CROP_META = {
  Rice:       { color:"#22c55e", fill:"#16a34a", emoji:"🌾", desc:"Paddy · 3 seasons/yr" },
  Coconut:    { color:"#84cc16", fill:"#65a30d", emoji:"🥥", desc:"Major plantation crop" },
  Banana:     { color:"#eab308", fill:"#ca8a04", emoji:"🍌", desc:"Commercial banana farming" },
  Pepper:     { color:"#78716c", fill:"#57534e", emoji:"⚫", desc:"Black pepper vines" },
  Rubber:     { color:"#b45309", fill:"#92400e", emoji:"🌳", desc:"Rubber plantation" },
  Arecanut:   { color:"#d97706", fill:"#b45309", emoji:"🌴", desc:"Betel nut palm" },
  Vegetables: { color:"#10b981", fill:"#059669", emoji:"🥬", desc:"Mixed vegetable farming" },
};

const SOIL_COLORS = {
  Alluvial:   "#78716c", Laterite:"#b45309", "Clay Loam":"#57534e", "Sandy Loam":"#d4a574",
};

const TILE_LAYERS = [
  { id:"satellite",  name:"🛰️ Satellite",  url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr:"Esri World Imagery" },
  { id:"dark",       name:"🌑 Dark",       url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr:"CartoDB" },
  { id:"street",     name:"🗺️ Street",     url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr:"OpenStreetMap" },
  { id:"topo",       name:"⛰️ Terrain",    url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", attr:"Esri Topo" },
];

const LAYERS = [
  { key:"zones",    icon:"🟩", label:"Crop Zone Map",     desc:"Polygon boundaries by primary crop" },
  { key:"stress",   icon:"🌡️", label:"Stress Heatmap",   desc:"CCSI-derived crop stress index" },
  { key:"crops",    icon:"📍", label:"Crop Markers",      desc:"Pinned marker per taluk" },
  { key:"rainfall", icon:"💧", label:"Rainfall Zones",    desc:"Annual rainfall distribution (mm)" },
  { key:"soil",     icon:"🟤", label:"Soil Type",         desc:"Dominant soil classification" },
  { key:"disease",  icon:"🦠", label:"Disease Hotspots",  desc:"Active pest/disease pressure" },
  { key:"forecast", icon:"🔮", label:"Forecast Risk",     desc:"LSTM 7-day stress prediction" },
  { key:"alerts",   icon:"🔔", label:"Village Alerts",    desc:"Real-time field alerts" },
];

const DISEASE_HOTSPOTS = [
  { name:"Palakkad",       lat:10.7867, lng:76.6548, disease:"Rice Blast",          pathogen:"Magnaporthe oryzae",    severity:"High",     since:"Apr 28", area:1840 },
  { name:"Chittur",        lat:10.6958, lng:76.7332, disease:"Coconut Root Wilt",   pathogen:"Phytoplasma",           severity:"High",     since:"Mar 15", area:2300 },
  { name:"Ottappalam",     lat:10.7710, lng:76.3800, disease:"Rice Blast",          pathogen:"Magnaporthe oryzae",    severity:"Moderate", since:"May 3",  area:1120 },
  { name:"Alathur",        lat:10.6482, lng:76.5361, disease:"Panama Wilt",         pathogen:"Fusarium oxysporum",    severity:"Moderate", since:"May 1",  area: 890 },
  { name:"Mannarkkad",     lat:10.9925, lng:76.4608, disease:"Phytophthora Blight", pathogen:"Phytophthora capsici",  severity:"High",     since:"Apr 20", area:1560 },
  { name:"Thrissur",       lat:10.5276, lng:76.2144, disease:"Sheath Blight",       pathogen:"Rhizoctonia solani",    severity:"Low",      since:"May 6",  area: 640 },
  { name:"Malappuram",     lat:11.0509, lng:76.0710, disease:"Koleroga",            pathogen:"Phytophthora arecae",   severity:"Moderate", since:"Apr 25", area: 730 },
  { name:"Tirur",          lat:10.9160, lng:75.9220, disease:"Bud Rot",             pathogen:"Phytophthora palmivora", severity:"Low",     since:"May 5",  area: 480 },
];

const VILLAGE_ALERTS = [
  { name:"Kanjikode",    lat:10.7700, lng:76.7000, type:"Irrigation", urgency:"critical", crop:"Rice",    msg:"Soil moisture critically low — immediate irrigation needed" },
  { name:"Melarcode",    lat:10.7200, lng:76.5800, type:"Pest",       urgency:"high",     crop:"Rice",    msg:"Brown plant hopper detected — spray Buprofezin 25% SC" },
  { name:"Koduvayur",    lat:10.7900, lng:76.5200, type:"Disease",    urgency:"high",     crop:"Rice",    msg:"Blast on 18% plots — apply Tricyclazole 0.6 g/L" },
  { name:"Parambikulam", lat:10.4300, lng:76.7500, type:"Weather",    urgency:"moderate", crop:"Banana",  msg:"Heat stress: Tmax 39°C forecast — shade net recommended" },
  { name:"Vadakarapathy",lat:10.5600, lng:76.6000, type:"Disease",    urgency:"high",     crop:"Coconut", msg:"Root wilt progression — remove and destroy affected palms" },
  { name:"Shoranur",     lat:10.7660, lng:76.2790, type:"Advisory",   urgency:"info",     crop:"Rice",    msg:"Optimal transplanting window: May 12–18 (monsoon onset predicted)" },
  { name:"Pattambi",     lat:10.8053, lng:76.1876, type:"Forecast",   urgency:"moderate", crop:"Rice",    msg:"7-day stress risk 71% — pre-emptive fungicide spray advised" },
  { name:"Perinthalmanna",lat:10.9768,lng:76.2310, type:"Pest",       urgency:"moderate", crop:"Rubber",  msg:"Mealybug surge — release Cryptolaemus beetles" },
];

// ─── Color helpers ───────────────────────────────────────────────────────────
function stressColor(s) {
  if (s < 20) return "#22c55e";
  if (s < 35) return "#a3e635";
  if (s < 50) return "#facc15";
  if (s < 65) return "#fb923c";
  return "#ef4444";
}
function stressLabel(s) {
  if (s < 20) return "Healthy";
  if (s < 35) return "Low Stress";
  if (s < 50) return "Moderate";
  if (s < 65) return "High Stress";
  return "Critical";
}
function rainfallColor(mm) {
  if (mm < 1800) return "#fde68a";
  if (mm < 2200) return "#a7f3d0";
  if (mm < 2600) return "#60a5fa";
  if (mm < 3000) return "#3b82f6";
  return "#1d4ed8";
}
function diseaseColor(s) { return s === "High" ? "#ef4444" : s === "Moderate" ? "#f59e0b" : "#22c55e"; }
function forecastColor(r) { return r >= 65 ? "#ef4444" : r >= 45 ? "#f59e0b" : r >= 25 ? "#60a5fa" : "#22c55e"; }
function alertColor(u)    { return u === "critical" ? "#ef4444" : u === "high" ? "#f59e0b" : u === "moderate" ? "#3b82f6" : "#22c55e"; }
function alertEmoji(u)    { return u === "critical" ? "🚨" : u === "high" ? "⚠️" : u === "moderate" ? "🔔" : "ℹ️"; }

// ─── Mini sparkline (canvas) ─────────────────────────────────────────────────
function MiniChart({ values, color = "#3b82f6", width = 110, height = 40 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const W = width, H = height;
    const mn = Math.min(...values), mx = Math.max(...values), rng = mx - mn || 1;
    ctx.clearRect(0, 0, W, H);
    const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - ((v - mn) / rng) * (H - 6) - 3]);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, color + "55"); g.addColorStop(1, color + "00");
    ctx.beginPath();
    ctx.moveTo(pts[0][0], H);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(pts[pts.length - 1][0], H); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath();
    pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
    const [lx, ly] = pts[pts.length - 1];
    ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }, [values, color, width, height]);
  return <canvas ref={ref} width={width} height={height} style={{ display: "block" }} />;
}

// ─── Leaflet custom icons ────────────────────────────────────────────────────
function createCropIcon(emoji, stress) {
  const bg = stressColor(stress);
  return L.divIcon({
    html: `<div style="width:40px;height:40px;background:${bg};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 4px 16px rgba(0,0,0,0.35);">
      <span style="display:block;transform:rotate(45deg);text-align:center;line-height:36px;font-size:18px;">${emoji}</span>
    </div>`,
    className: "", iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -44],
  });
}

function createAlertIcon(urgency) {
  const c = alertColor(urgency), em = alertEmoji(urgency);
  const pulse = urgency === "critical" || urgency === "high";
  return L.divIcon({
    html: `<div style="position:relative;width:38px;height:38px;">
      ${pulse ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${c};animation:map-ring 1.8s ease-out infinite;"></div>
      <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${c};animation:map-ring 1.8s ease-out infinite 0.9s;"></div>` : ""}
      <div style="position:absolute;inset:0;width:38px;height:38px;background:${c};border-radius:50%;border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 4px 14px ${c}70;display:flex;align-items:center;justify-content:center;font-size:17px;">${em}</div>
    </div>`,
    className: "", iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22],
  });
}

// ─── Map fly helper ──────────────────────────────────────────────────────────
function MapFly({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom, { duration: 1.2 }); }, [center, zoom]);
  return null;
}

// ─── Layer components ─────────────────────────────────────────────────────────

function CropZonePolygons({ taluks, visible }) {
  if (!visible) return null;
  return taluks.map(t => {
    const meta = CROP_META[t.mainCrop] || { color: "#6366f1", fill: "#4f46e5" };
    const sc = stressColor(t.stress);
    const poly = makePoly(t.lat, t.lng, t.area, t.rot);
    return (
      <Polygon key={`zone-${t.name}`} positions={poly}
        pathOptions={{
          fillColor: meta.fill, fillOpacity: 0.28,
          color: sc, weight: 2, dashArray: t.stress > 50 ? "6,3" : undefined,
          opacity: 0.85,
        }}
        eventHandlers={{ click: () => {} }}>
        <Tooltip direction="center" permanent={false} sticky>
          <span>{meta.emoji} {t.name} · {t.mainCrop} · Stress: {t.stress}%</span>
        </Tooltip>
      </Polygon>
    );
  });
}

function StressCircles({ taluks, visible }) {
  if (!visible) return null;
  return taluks.map(t => (
    <Circle key={`str-${t.name}`} center={[t.lat, t.lng]} radius={11000}
      pathOptions={{ fillColor: stressColor(t.stress), fillOpacity: 0.35, color: "transparent", weight: 0 }} />
  ));
}

function RainfallCircles({ taluks, visible }) {
  if (!visible) return null;
  return taluks.map(t => {
    const c = rainfallColor(t.rainfall);
    return (
      <Circle key={`rf-${t.name}`} center={[t.lat, t.lng]} radius={9000}
        pathOptions={{ fillColor: c, fillOpacity: 0.32, color: c, weight: 1 }}>
        <Popup><div style={{ padding: 12, textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
          <div style={{ fontWeight: 700, color: "#1e293b" }}>{t.name}</div>
          <div style={{ color: "#3b82f6", fontWeight: 900, fontSize: "1.3rem" }}>{t.rainfall} mm</div>
          <div style={{ color: "#64748b", fontSize: "0.78rem" }}>Annual Rainfall</div>
        </div></Popup>
      </Circle>
    );
  });
}

function SoilCircles({ taluks, visible }) {
  if (!visible) return null;
  return taluks.map(t => (
    <Circle key={`soil-${t.name}`} center={[t.lat, t.lng]} radius={8000}
      pathOptions={{ fillColor: SOIL_COLORS[t.soil] || "#999", fillOpacity: 0.40, color: "transparent", weight: 0 }}>
      <Popup><div style={{ padding: 12, fontFamily: "'Inter',sans-serif" }}>
        <div style={{ fontWeight: 700, color: "#1e293b" }}>{t.name}</div>
        <div style={{ fontWeight: 700, color: SOIL_COLORS[t.soil] }}>{t.soil}</div>
        <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: 4 }}>
          {t.soil === "Alluvial" && "High fertility · good water retention"}
          {t.soil === "Laterite" && "Acidic · well-drained · low fertility"}
          {t.soil === "Clay Loam" && "Moderate fertility · water-retentive"}
          {t.soil === "Sandy Loam" && "Light soil · fast drainage"}
        </div>
      </div></Popup>
    </Circle>
  ));
}

function DiseaseHotspots({ visible }) {
  if (!visible) return null;
  return DISEASE_HOTSPOTS.map(d => {
    const c = diseaseColor(d.severity);
    const r = d.severity === "High" ? 13000 : d.severity === "Moderate" ? 9500 : 6500;
    return (
      <Circle key={`dis-${d.name}`} center={[d.lat, d.lng]} radius={r}
        pathOptions={{ fillColor: c, fillOpacity: 0.32, color: c, weight: 2, dashArray: "6,4" }}>
        <Popup minWidth={230}>
          <div style={{ padding: "14px 18px", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 26 }}>🦠</span>
              <div>
                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.95rem" }}>{d.disease}</div>
                <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{d.name} · {d.pathogen}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[["Severity", d.severity, c], ["Area", `${d.area} ha`, "#6366f1"], ["Since", d.since, "#64748b"]].map(([l, v, col]) => (
                <div key={l} style={{ padding: "6px 8px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontWeight: 700, color: col, fontSize: "0.8rem", marginTop: 1 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Popup>
      </Circle>
    );
  });
}

function ForecastRiskLayer({ taluks, visible }) {
  if (!visible) return null;
  return taluks.map(t => {
    const risk = seededForecast(t.seed);
    const c = forecastColor(risk);
    return (
      <Circle key={`fc-${t.name}`} center={[t.lat, t.lng]} radius={10500}
        pathOptions={{ fillColor: c, fillOpacity: 0.25, color: c, weight: 1.5, dashArray: "8,5" }}>
        <Popup minWidth={210}>
          <div style={{ padding: "14px 16px", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>🔮 {t.name} — LSTM Forecast</div>
            <div style={{ padding: "10px 12px", background: `${c}12`, borderRadius: 10, border: `1.5px solid ${c}35`, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: "0.78rem", color: "#374151", fontWeight: 600 }}>7-Day Stress Risk</span>
                <span style={{ fontWeight: 900, color: c }}>{risk}%</span>
              </div>
              <div style={{ height: 6, background: "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${risk}%`, background: c, borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ fontSize: "0.76rem", color: "#475569", lineHeight: 1.6 }}>
              {risk >= 65 ? `⚠️ Pre-emptive irrigation + fungicide spray recommended for ${t.mainCrop}.`
                : risk >= 45 ? `⚡ Moderate risk. Monitor closely next 4–5 days.`
                : `✅ Low risk. Normal ${t.mainCrop} management.`}
            </div>
          </div>
        </Popup>
      </Circle>
    );
  });
}

function VillageAlertMarkers({ visible }) {
  if (!visible) return null;
  return VILLAGE_ALERTS.map(a => (
    <Marker key={`va-${a.name}`} position={[a.lat, a.lng]} icon={createAlertIcon(a.urgency)}>
      <Popup minWidth={240}>
        <div style={{ padding: "14px 16px", fontFamily: "'Inter',sans-serif" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>{alertEmoji(a.urgency)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.9rem" }}>{a.name}</div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{a.type} · {a.crop}</div>
            </div>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: alertColor(a.urgency) + "15", color: alertColor(a.urgency), textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {a.urgency}
            </span>
          </div>
          <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#374151", lineHeight: 1.6 }}>
            {a.msg}
          </div>
        </div>
      </Popup>
    </Marker>
  ));
}

// ─── Map overlay legend (always visible) ─────────────────────────────────────
function MapOverlayLegend({ layers, tile }) {
  const [collapsed, setCollapsed] = useState(false);
  const isDark = tile === "dark" || tile === "satellite";
  const bg = isDark ? "rgba(10,20,40,0.88)" : "rgba(255,255,255,0.92)";
  const tc = isDark ? "#e2e8f0" : "#1e293b";
  const bc = isDark ? "rgba(99,179,237,0.2)" : "#e2e8f0";

  const items = [];
  if (layers.zones) {
    Object.entries(CROP_META).forEach(([crop, m]) =>
      items.push({ dot: m.fill, label: `${m.emoji} ${crop}`, border: m.color }));
  }
  if (layers.stress) {
    [["#22c55e","Healthy"],["#facc15","Moderate"],["#ef4444","Critical"]].forEach(([c,l]) =>
      items.push({ dot: c, label: l }));
  }
  if (layers.disease) {
    [["#ef4444","High risk"],["#f59e0b","Moderate"],["#22c55e","Low"]].forEach(([c,l]) =>
      items.push({ dot: c, label: `🦠 ${l}`, dashed: true }));
  }
  if (layers.forecast) {
    [["#ef4444","Risk >65%"],["#f59e0b","45–65%"],["#60a5fa","25–45%"]].forEach(([c,l]) =>
      items.push({ dot: c, label: `🔮 ${l}` }));
  }
  if (layers.alerts) {
    [["#ef4444","Critical"],["#f59e0b","High"],["#3b82f6","Moderate"]].forEach(([c,l]) =>
      items.push({ dot: c, label: `🔔 ${l}` }));
  }
  if (!items.length) return null;

  return (
    <div style={{
      position: "absolute", bottom: 32, right: 14, zIndex: 1000,
      background: bg, backdropFilter: "blur(12px)", borderRadius: 14,
      border: `1px solid ${bc}`, padding: collapsed ? "8px 12px" : "12px 14px",
      minWidth: collapsed ? 0 : 160, boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
      transition: "all 0.3s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: collapsed ? 0 : 8 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: isDark ? "#93c5fd" : "#1d4ed8" }}>Legend</span>
        <button onClick={() => setCollapsed(p => !p)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: tc, padding: "0 0 0 8px" }}>
          {collapsed ? "▲" : "▼"}
        </button>
      </div>
      {!collapsed && items.slice(0, 14).map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0" }}>
          <div style={{
            width: 11, height: 11, borderRadius: it.dashed ? 3 : "50%",
            background: it.dot, flexShrink: 0,
            border: it.dashed ? `1.5px dashed ${it.dot}` : `2px solid ${it.border || it.dot}99`,
            opacity: 0.9,
          }} />
          <span style={{ fontSize: "0.72rem", color: tc, whiteSpace: "nowrap" }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Crop popup (rich) ───────────────────────────────────────────────────────
function CropPopup({ t }) {
  const forecast = seededForecast(t.seed);
  const histStress = [t.stress - 8, t.stress - 4, t.stress - 6, t.stress - 2, t.stress - 1, t.stress];
  const meta = CROP_META[t.mainCrop] || {};
  const sc = stressColor(t.stress);
  return (
    <div style={{ padding: "16px 18px", fontFamily: "'Inter',sans-serif", minWidth: 240 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 30 }}>{meta.emoji || "🌱"}</span>
        <div>
          <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "1rem" }}>{t.name}</div>
          <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{t.district} District · {meta.desc}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
        {[
          ["Crop",     t.mainCrop,       meta.fill || "#16a34a"],
          ["Soil",     t.soil,           SOIL_COLORS[t.soil]],
          ["Rainfall", `${t.rainfall}mm`,  "#3b82f6"],
          ["Area",     `${t.area} km²`,    "#6366f1"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 9, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
            <div style={{ fontWeight: 700, color: c || "#1e293b", fontSize: "0.82rem", marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
      {/* Stress bar */}
      <div style={{ padding: "10px 12px", borderRadius: 10, background: sc + "14", border: `1.5px solid ${sc}35`, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>CCSI Stress</span>
          <span style={{ fontWeight: 900, color: sc }}>{t.stress}% · {stressLabel(t.stress)}</span>
        </div>
        <div style={{ height: 6, background: "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${t.stress}%`, background: sc, borderRadius: 3 }} />
        </div>
      </div>
      {/* Mini chart + forecast */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <MiniChart values={histStress} color={sc} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700 }}>7-DAY FORECAST</div>
          <div style={{ fontWeight: 900, color: forecastColor(forecast), fontSize: "1.1rem" }}>{forecast}%</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EnhancedMap() {
  inject("enhanced-map-v3", CSS);

  const taluks = useMemo(() => TALUKS.map(t => ({ ...t, stress: seededStress(t.seed) })), []);

  const [center, setCenter]   = useState([10.7867, 76.6548]);
  const [zoom, setZoom]       = useState(8);
  const [tile, setTile]       = useState("satellite");
  const [layers, setLayers]   = useState({ zones: true, stress: false, crops: true, rainfall: false, soil: false, disease: false, forecast: false, alerts: false });
  const [selected, setSelected] = useState(null);
  const [districtFilter, setDistrictFilter] = useState("All");
  const [sideTab, setSideTab] = useState("regions");
  const [searchQ, setSearchQ] = useState("");
  const [now, setNow]         = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const districts = useMemo(() => ["All", ...new Set(TALUKS.map(t => t.district))], []);
  const filtered  = useMemo(() => taluks.filter(t =>
    (districtFilter === "All" || t.district === districtFilter) &&
    t.name.toLowerCase().includes(searchQ.toLowerCase())
  ), [taluks, districtFilter, searchQ]);

  const stats = useMemo(() => ({
    healthy:  taluks.filter(t => t.stress < 35).length,
    moderate: taluks.filter(t => t.stress >= 35 && t.stress < 55).length,
    critical: taluks.filter(t => t.stress >= 55).length,
    avgStress:   Math.round(taluks.reduce((a, t) => a + t.stress, 0) / taluks.length),
    avgRainfall: Math.round(taluks.reduce((a, t) => a + t.rainfall, 0) / taluks.length),
    diseaseHigh: DISEASE_HOTSPOTS.filter(d => d.severity === "High").length,
    alertsHigh:  VILLAGE_ALERTS.filter(a => a.urgency === "critical" || a.urgency === "high").length,
  }), [taluks]);

  const toggleLayer = (k) => setLayers(p => ({ ...p, [k]: !p[k] }));
  const handleSelect = (t) => { setSelected(t); setCenter([t.lat, t.lng]); setZoom(12); };

  const isDark = tile === "dark" || tile === "satellite";
  const sidebarBg = isDark ? "#0a1628" : "#fff";
  const sidebarText = isDark ? "#e2e8f0" : "#1e293b";
  const cardBg = isDark ? "#0f2040" : "#f8fafc";
  const cardBorder = isDark ? "#1e3a5f" : "#e2e8f0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, fontFamily: "'Inter','Segoe UI',sans-serif", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg,#060e1f 0%,#0f2240 50%,#1a3a70 100%)", padding: "20px 26px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#f1f5f9", fontFamily: "'Manrope',sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
              🗺️ Agricultural Intelligence Map
              <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#4ade80" }}>
                ● LIVE
              </span>
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
              Kerala · ERA5 climate · LSTM forecast · {now.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })} {now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
            </p>
          </div>
          {/* Summary pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { v: stats.healthy,     l: "Healthy",   c: "#22c55e" },
              { v: stats.moderate,    l: "Moderate",  c: "#facc15" },
              { v: stats.critical,    l: "Critical",  c: "#ef4444" },
              { v: stats.diseaseHigh, l: "Disease ⚠", c: "#f87171" },
              { v: stats.alertsHigh,  l: "Alerts 🔔", c: "#fb923c" },
            ].map(({ v, l, c }) => (
              <div key={l} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontWeight: 900, color: c, fontSize: "1rem", lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Tile tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TILE_LAYERS.map(tl => (
            <button key={tl.id} onClick={() => setTile(tl.id)}
              style={{
                padding: "7px 14px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
                fontSize: "0.75rem", fontWeight: 700, transition: "all 0.2s",
                background: tile === tl.id ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.1)",
                color: tile === tl.id ? "#0f172a" : "rgba(255,255,255,0.7)",
              }}>
              {tl.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", height: 700, overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        <div style={{ width: 280, background: sidebarBg, borderRight: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", flexShrink: 0, transition: "background 0.3s" }}>
          {/* Side tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${cardBorder}` }}>
            {[["regions","📍","Regions"],["layers","🗂️","Layers"],["stats","📊","Stats"]].map(([id,ic,lb]) => (
              <button key={id} onClick={() => setSideTab(id)}
                style={{
                  flex: 1, padding: "10px 4px", border: "none", cursor: "pointer",
                  fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                  background: sideTab === id ? (isDark ? "#0f2240" : "#eff6ff") : sidebarBg,
                  color: sideTab === id ? "#3b82f6" : "#94a3b8",
                  borderBottom: sideTab === id ? "2.5px solid #3b82f6" : "2.5px solid transparent",
                  transition: "all 0.2s",
                }}>
                {ic} {lb}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>

            {/* ── REGIONS ── */}
            {sideTab === "regions" && (
              <>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search taluk…"
                  style={{ width: "100%", padding: "8px 12px", border: `1px solid ${cardBorder}`, borderRadius: 10, fontSize: "0.82rem", marginBottom: 8, boxSizing: "border-box", outline: "none", background: isDark ? "#0a1628" : "#fff", color: sidebarText }} />
                <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", border: `1px solid ${cardBorder}`, borderRadius: 10, fontSize: "0.8rem", marginBottom: 10, boxSizing: "border-box", background: isDark ? "#0a1628" : "#fff", color: sidebarText }}>
                  {districts.map(d => <option key={d}>{d}</option>)}
                </select>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                  {filtered.length} Taluks
                </div>
                {filtered.map(t => {
                  const meta = CROP_META[t.mainCrop] || {};
                  return (
                    <div key={t.name} className={"map-taluk-card" + (selected?.name === t.name ? " selected" : "")}
                      onClick={() => handleSelect(t)}
                      style={{ padding: "9px 11px", borderRadius: 10, border: `1px solid ${cardBorder}`, marginBottom: 5, background: cardBg }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                        <span style={{ fontSize: 17 }}>{meta.emoji || "🌱"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: sidebarText, fontSize: "0.82rem" }}>{t.name}</div>
                          <div style={{ color: "#94a3b8", fontSize: "0.68rem" }}>{t.district} · {t.mainCrop}</div>
                        </div>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: stressColor(t.stress), background: stressColor(t.stress) + "20", borderRadius: 99, padding: "2px 7px" }}>
                          {t.stress}%
                        </span>
                      </div>
                      <div style={{ height: 4, background: isDark ? "#1e3a5f" : "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${t.stress}%`, background: stressColor(t.stress), borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* ── LAYERS ── */}
            {sideTab === "layers" && (
              <>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Map Overlays</div>
                {LAYERS.map(ly => (
                  <button key={ly.key} onClick={() => toggleLayer(ly.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "10px 12px", border: `1px solid ${layers[ly.key] ? "#3b82f6" : cardBorder}`,
                      borderRadius: 10, marginBottom: 7, cursor: "pointer", textAlign: "left",
                      background: layers[ly.key] ? "rgba(59,130,246,0.15)" : cardBg,
                      color: layers[ly.key] ? "#93c5fd" : "#94a3b8",
                      transition: "all 0.2s",
                    }}>
                    <span style={{ fontSize: 16 }}>{ly.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: layers[ly.key] ? "#e2e8f0" : sidebarText }}>{ly.label}</div>
                      <div style={{ fontSize: "0.67rem", opacity: 0.65, marginTop: 1 }}>{ly.desc}</div>
                    </div>
                    <div style={{ width: 38, height: 20, borderRadius: 99, background: layers[ly.key] ? "#3b82f6" : (isDark ? "#1e3a5f" : "#e2e8f0"), position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 2, left: layers[ly.key] ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                    </div>
                  </button>
                ))}

                {/* Compact legends */}
                {layers.zones && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>Crop Zones</div>
                    {Object.entries(CROP_META).map(([crop, m]) => (
                      <div key={crop} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0" }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: m.fill, flexShrink: 0, border: `1.5px solid ${m.color}` }} />
                        <span style={{ fontSize: "0.75rem", color: sidebarText }}>{m.emoji} {crop}</span>
                      </div>
                    ))}
                  </div>
                )}
                {layers.stress && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>Stress Level</div>
                    {[["#22c55e","Healthy","<35%"],["#facc15","Moderate","35–55%"],["#ef4444","Critical",">55%"]].map(([c, l, r]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: c, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: "0.75rem", color: sidebarText }}>{l}</span>
                        <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                {layers.rainfall && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>Rainfall (mm/yr)</div>
                    {[["#fde68a","<1800"],["#a7f3d0","1800–2200"],["#60a5fa","2200–2600"],["#3b82f6","2600–3000"],["#1d4ed8",">3000"]].map(([c, l]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0" }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.73rem", color: sidebarText }}>{l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── STATS ── */}
            {sideTab === "stats" && (
              <>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>District Summary</div>
                {["Palakkad", "Thrissur", "Malappuram", "Kozhikode"].map(d => {
                  const dt = taluks.filter(t => t.district === d);
                  if (!dt.length) return null;
                  const avg = Math.round(dt.reduce((a, t) => a + t.stress, 0) / dt.length);
                  return (
                    <div key={d} style={{ padding: "11px 12px", background: cardBg, borderRadius: 10, border: `1px solid ${cardBorder}`, marginBottom: 7 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, color: sidebarText, fontSize: "0.83rem" }}>{d}</span>
                        <span style={{ fontWeight: 800, color: stressColor(avg), fontSize: "0.83rem" }}>{avg}%</span>
                      </div>
                      <div style={{ height: 5, background: isDark ? "#1e3a5f" : "#e2e8f0", borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
                        <div style={{ height: "100%", width: `${avg}%`, background: stressColor(avg), borderRadius: 3 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#94a3b8" }}>
                        <span>{dt.length} taluks</span>
                        <span>{stressLabel(avg)}</span>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 14, fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Crop Distribution</div>
                {Object.entries(taluks.reduce((acc, t) => { acc[t.mainCrop] = (acc[t.mainCrop] || 0) + 1; return acc; }, {}))
                  .sort((a, b) => b[1] - a[1]).map(([crop, cnt]) => (
                    <div key={crop} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 7px", marginBottom: 3, borderRadius: 8, background: cardBg }}>
                      <span style={{ fontSize: 15 }}>{CROP_META[crop]?.emoji || "🌱"}</span>
                      <span style={{ flex: 1, fontSize: "0.8rem", color: sidebarText, fontWeight: 600 }}>{crop}</span>
                      <div style={{ width: 55, height: 5, background: isDark ? "#1e3a5f" : "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(cnt / taluks.length) * 100}%`, background: CROP_META[crop]?.fill || "#6366f1", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", minWidth: 18 }}>{cnt}</span>
                    </div>
                  ))}

                <div style={{ marginTop: 14, padding: "12px 14px", background: isDark ? "rgba(59,130,246,0.1)" : "#eff6ff", borderRadius: 12, border: `1px solid ${isDark ? "rgba(59,130,246,0.25)" : "#bfdbfe"}` }}>
                  <div style={{ fontWeight: 700, color: "#3b82f6", fontSize: "0.83rem", marginBottom: 7 }}>Region Overview</div>
                  <div style={{ fontSize: "0.77rem", color: isDark ? "#93c5fd" : "#1e40af", lineHeight: 1.7 }}>
                    <div>📐 {Math.round(taluks.reduce((a, t) => a + t.area, 0) / 1000)} k km² surveyed</div>
                    <div>💧 Avg rainfall: {stats.avgRainfall} mm/yr</div>
                    <div>🌡️ Mean CCSI: {stats.avgStress}%</div>
                    <div>🦠 Active disease zones: {DISEASE_HOTSPOTS.length}</div>
                    <div>🔔 Village alerts: {VILLAGE_ALERTS.length}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Map area ── */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer center={center} zoom={zoom} style={{ width: "100%", height: "100%" }} scrollWheelZoom={true} zoomControl={false}>
            <MapFly center={center} zoom={zoom} />

            {/* Base tile */}
            {TILE_LAYERS.map(tl => tile === tl.id && (
              <TileLayer key={tl.id} url={tl.url} attribution={`© ${tl.attr}`} maxZoom={19} />
            ))}

            {/* Crop zone polygons */}
            <CropZonePolygons taluks={taluks} visible={layers.zones} />

            {/* Stress / rainfall / soil circles */}
            <StressCircles taluks={taluks} visible={layers.stress} />
            <RainfallCircles taluks={taluks} visible={layers.rainfall} />
            <SoilCircles taluks={taluks} visible={layers.soil} />

            {/* Disease / forecast / alerts */}
            <DiseaseHotspots visible={layers.disease} />
            <ForecastRiskLayer taluks={taluks} visible={layers.forecast} />
            <VillageAlertMarkers visible={layers.alerts} />

            {/* Crop marker pins */}
            {layers.crops && taluks.map(t => (
              <Marker key={t.name} position={[t.lat, t.lng]}
                icon={createCropIcon(CROP_META[t.mainCrop]?.emoji || "🌱", t.stress)}
                eventHandlers={{ click: () => handleSelect(t) }}>
                <Popup minWidth={250} maxWidth={280}>
                  <CropPopup t={t} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Always-visible legend overlay */}
          <MapOverlayLegend layers={layers} tile={tile} />

          {/* Top-left mini counters */}
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { v: taluks.length,  l: "Taluks",   c: "#e2e8f0" },
              { v: stats.healthy,  l: "Healthy",  c: "#4ade80" },
              { v: stats.critical, l: "Critical", c: "#f87171" },
            ].map(({ v, l, c }) => (
              <div key={l} style={{ background: "rgba(6,14,31,0.82)", backdropFilter: "blur(8px)", borderRadius: 9, padding: "7px 11px", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontWeight: 900, color: c, fontSize: "0.95rem", minWidth: 18, lineHeight: 1 }}>{v}</span>
                <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.68rem", fontWeight: 600 }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Zoom controls */}
          <div style={{ position: "absolute", bottom: 80, right: 14, zIndex: 1000, display: "flex", flexDirection: "column", gap: 4 }}>
            {[["＋", () => setZoom(z => Math.min(z + 1, 18))], ["－", () => setZoom(z => Math.max(z - 1, 5))]].map(([label, fn]) => (
              <button key={label} onClick={fn}
                style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "rgba(6,14,31,0.82)", backdropFilter: "blur(8px)", color: "#e2e8f0", fontSize: "1.1rem", cursor: "pointer", fontWeight: 700 }}>
                {label}
              </button>
            ))}
          </div>

          {/* Selected taluk detail panel */}
          {selected && (
            <div style={{
              position: "absolute", right: 14, top: 14, width: 300, zIndex: 1000,
              background: "rgba(6,14,31,0.92)", backdropFilter: "blur(14px)",
              borderRadius: 18, boxShadow: "0 16px 50px rgba(0,0,0,0.45)",
              animation: "map-fade 0.3s ease both", border: "1px solid rgba(99,179,237,0.2)",
            }}>
              <div style={{ background: `linear-gradient(135deg,${CROP_META[selected.mainCrop]?.fill || "#16a34a"}25,transparent)`, padding: "16px 18px", borderRadius: "18px 18px 0 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 30 }}>{CROP_META[selected.mainCrop]?.emoji || "🌱"}</span>
                    <div>
                      <div style={{ fontWeight: 800, color: "#f1f5f9", fontSize: "1rem" }}>{selected.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{selected.district} District</div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.1)", cursor: "pointer", color: "#94a3b8", fontSize: 13 }}>✕</button>
                </div>
              </div>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
                  {[
                    ["Main Crop", selected.mainCrop,       CROP_META[selected.mainCrop]?.color || "#22c55e"],
                    ["Soil",      selected.soil,            SOIL_COLORS[selected.soil] || "#78716c"],
                    ["Rainfall",  `${selected.rainfall}mm/yr`, "#3b82f6"],
                    ["Area",      `${selected.area} km²`,   "#8b5cf6"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
                      <div style={{ fontWeight: 700, color: c, fontSize: "0.82rem", marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {/* Stress */}
                <div style={{ padding: "10px 12px", borderRadius: 12, background: stressColor(selected.stress) + "14", border: `1.5px solid ${stressColor(selected.stress)}30`, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.82rem" }}>CCSI Stress</span>
                    <span style={{ fontWeight: 900, color: stressColor(selected.stress) }}>{selected.stress}% · {stressLabel(selected.stress)}</span>
                  </div>
                  <div style={{ height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${selected.stress}%`, background: stressColor(selected.stress), borderRadius: 4, boxShadow: `0 0 8px ${stressColor(selected.stress)}80` }} />
                  </div>
                </div>
                {/* Forecast */}
                <div style={{ padding: "10px 12px", background: "rgba(59,130,246,0.1)", borderRadius: 10, border: "1px solid rgba(59,130,246,0.2)", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: "0.8rem", marginBottom: 5 }}>🔮 7-Day LSTM Forecast</div>
                  {(() => {
                    const risk = seededForecast(selected.seed);
                    const fc = forecastColor(risk);
                    return (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Predicted stress risk</span>
                          <span style={{ fontWeight: 900, color: fc }}>{risk}%</span>
                        </div>
                        <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${risk}%`, background: fc, borderRadius: 3 }} />
                        </div>
                      </>
                    );
                  })()}
                </div>
                {/* AI advice */}
                <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 12, fontSize: "0.77rem", color: "#94a3b8", lineHeight: 1.6 }}>
                  🧠 {selected.stress < 25
                    ? `${selected.mainCrop} at optimal conditions. Continue current schedule.`
                    : selected.stress < 45
                    ? `Moderate stress in ${selected.name}. Monitor soil moisture, light irrigation within 48h.`
                    : selected.stress < 65
                    ? `High stress! Immediate irrigation for ${selected.mainCrop}. Check for pest pressure.`
                    : `Critical — emergency irrigation needed. Contact Krishi Bhavan: 0491-2505456`}
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <button style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                    📊 DSS Analysis
                  </button>
                  <button style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                    🌾 Full Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
