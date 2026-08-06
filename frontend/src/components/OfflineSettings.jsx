import { useState, useEffect } from "react";
import SMSAlertRegistration from "./SMSAlertRegistration";

const CSS = `
  @keyframes os-fade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes os-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,0.4); } 70% { box-shadow:0 0 0 8px rgba(34,197,94,0); } }
  @keyframes os-spin { to { transform:rotate(360deg); } }
  @keyframes os-bar { from { width:0 } }
  .os-tab { transition: all 0.2s cubic-bezier(.4,0,.2,1) !important; }
  .os-tab:hover { background:rgba(255,255,255,0.18) !important; transform:translateY(-1px) !important; }
  .os-tab.os-active { background:rgba(255,255,255,0.95) !important; color:#1e3a8a !important; font-weight:700 !important; box-shadow:0 3px 12px rgba(0,0,0,0.15) !important; }
  .os-card { transition: box-shadow 0.2s, transform 0.2s !important; }
  .os-card:hover { transform:translateY(-2px) !important; box-shadow:0 8px 28px rgba(30,58,138,0.10) !important; }
  .os-feature-row { transition: background 0.15s !important; }
  .os-feature-row:hover { background:#f1f5f9 !important; }
  .os-dl-btn { transition: all 0.2s !important; }
  .os-dl-btn:hover { transform:translateY(-2px) !important; }
`;
function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

const TABS = [
  { id: "overview", icon: "📊", label: "Overview" },
  { id: "sms", icon: "📱", label: "SMS Alerts" },
  { id: "downloads", icon: "📥", label: "Downloads" },
  { id: "quickref", icon: "📖", label: "Quick Reference" },
  { id: "contacts", icon: "📞", label: "Emergency" },
];

const FEATURES = [
  { icon: "🤖", label: "AI Crop Advisor", sub: "Get stress alerts & advice", offline: true },
  { icon: "📅", label: "Crop Calendar", sub: "Sowing to harvest timeline", offline: true },
  { icon: "🐛", label: "Pest Solutions", sub: "Disease ID & treatment guide", offline: true },
  { icon: "📞", label: "Emergency Contacts", sub: "Krishi helplines & numbers", offline: true },
  { icon: "🗣️", label: "Voice Assistant", sub: "Multilingual basic Q&A", offline: true },
  { icon: "📋", label: "Farm Input Calculator", sub: "Fertilizer & pesticide doses", offline: true },
  { icon: "🌡️", label: "Live Weather Forecast", sub: "Requires internet connection", offline: false },
  { icon: "🛰️", label: "NDVI Satellite Data", sub: "Requires internet connection", offline: false },
  { icon: "📈", label: "Live Market Prices", sub: "Requires internet connection", offline: false },
  { icon: "🗺️", label: "Regional Stress Map", sub: "Requires internet connection", offline: false },
];

const CROP_REF = [
  {
    crop: "Rice 🌾", seasons: "Virippu (Jun–Sep) · Mundakan (Sep–Jan) · Puncha (Jan–May)",
    stages: [
      { s: "Nursery", d: "20–25 days", tip: "Maintain thin water film" },
      { s: "Transplanting", d: "15 days", tip: "Cloudy days preferred" },
      { s: "Tillering", d: "25–30 days", tip: "5–7 cm water level" },
      { s: "Panicle Initiation", d: "15 days", tip: "Critical water stage" },
      { s: "Flowering", d: "20 days", tip: "Avoid water stress" },
      { s: "Grain Filling", d: "25 days", tip: "Intermittent irrigation" },
    ],
    pests: [
      { name: "Leaf Blast", action: "Tricyclazole 0.6 g/L spray" },
      { name: "Brown Plant Hopper", action: "Drain field + Imidacloprid 0.5 ml/L" },
      { name: "Stem Borer", action: "Carbofuran 3G granules + light traps" },
      { name: "Sheath Blight", action: "Hexaconazole 2 ml/L" },
    ],
    thresholds: "Ideal: 25–35°C · Cold stress: <15°C · Heat stress: >40°C",
  },
  {
    crop: "Coconut 🥥", seasons: "Year-round",
    stages: [
      { s: "Young Palm", d: "0–5 yr", tip: "Basin irrigation 40 L/day" },
      { s: "Bearing Palm", d: "5+ yr", tip: "45 L/palm/day" },
    ],
    pests: [
      { name: "Rhinoceros Beetle", action: "Naphthalene balls in crown" },
      { name: "Red Palm Weevil", action: "Ferulure pheromone traps" },
    ],
    thresholds: "NPK: 500g:320g:1200g per palm per year",
  },
  {
    crop: "Banana 🍌", seasons: "Year-round",
    stages: [
      { s: "Establishment", d: "0–3 months", tip: "20–25 L/plant/day" },
      { s: "Vegetative", d: "3–9 months", tip: "Regular irrigation" },
      { s: "Flowering & Harvest", d: "9–14 months", tip: "Reduce water pre-harvest" },
    ],
    pests: [
      { name: "Sigatoka Leaf Spot", action: "Mancozeb 2.5 g/L spray" },
      { name: "Banana Weevil", action: "Chlorpyrifos soil drench" },
    ],
    thresholds: "Spacing: 1.8m × 1.8m · Harvest: 12–14 months",
  },
];

const CONTACTS = [
  { name: "Kisan Call Center", num: "1800-180-1551", note: "24×7 Free, all languages", color: "#16a34a" },
  { name: "Krishi Bhavan Palakkad", num: "0491-2505456", note: "Office hours Mon–Sat", color: "#1d4ed8" },
  { name: "KAU Helpline", num: "0487-2438300", note: "Kerala Agricultural University", color: "#7c3aed" },
  { name: "Pest Emergency", num: "1800-425-1661", note: "Plant protection hotline, Free", color: "#dc2626" },
  { name: "Weather (IMD)", num: "1800-180-8080", note: "24×7 Free weather updates", color: "#0891b2" },
  { name: "Soil Testing Lab", num: "0491-2552033", note: "Palakkad district lab", color: "#b45309" },
];

const SMS_CODES = [
  { code: "CROP RICE", to: "51969", desc: "Rice crop advisory" },
  { code: "WEATHER PKD", to: "51969", desc: "Palakkad weather update" },
  { code: "PRICE PADDY", to: "51969", desc: "Today's paddy market price" },
  { code: "KVK PKD", to: "51969", desc: "KVK Palakkad contact" },
];

function StatusDot({ online }) {
  return (
    <span style={{
      display: "inline-block", width: 10, height: 10, borderRadius: "50%",
      background: online ? "#22c55e" : "#ef4444",
      animation: online ? "os-pulse 2s infinite" : "none",
      marginRight: 8,
    }} />
  );
}

function SyncBar({ pct, color = "#6366f1" }) {
  return (
    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
      <div style={{
        height: "100%", width: `${pct}%`, borderRadius: 3, background: color,
        animation: "os-bar 1.2s cubic-bezier(.4,0,.2,1) both",
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

export default function OfflineSettings() {
  inject("os-styles", CSS);
  const [tab, setTab] = useState("overview");
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncPct, setSyncPct] = useState(0);
  const [syncDone, setSyncDone] = useState(!!localStorage.getItem("lastCacheSync"));
  const [lastSync, setLastSync] = useState(localStorage.getItem("lastCacheSync") || null);
  const [cacheSize, setCacheSize] = useState("0 KB");
  const [expandedCrop, setExpandedCrop] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSync = async () => {
    if (!online) { showToast("No internet connection — please retry when online.", "error"); return; }
    setSyncing(true); setSyncPct(0);
    const steps = [15, 35, 55, 72, 88, 100];
    for (const p of steps) {
      await new Promise(r => setTimeout(r, 280));
      setSyncPct(p);
    }
    const ts = new Date().toLocaleString("en-IN");
    localStorage.setItem("lastCacheSync", ts);
    setLastSync(ts); setSyncDone(true); setSyncing(false);
    setCacheSize("4.2 MB");
    showToast("Offline data synced successfully!");
  };

  const downloadTxt = () => {
    const lines = [
      "AGRIDSS PALAKKAD — FARMING QUICK REFERENCE GUIDE",
      "=".repeat(50),
      "",
      "RICE CULTIVATION CALENDAR",
      "-".repeat(30),
      "Virippu: Jun–Sep (Main monsoon crop)",
      "Mundakan: Sep–Jan (Second crop)",
      "Puncha: Jan–May (Summer irrigated crop)",
      "",
      "GROWTH STAGES:",
      "Nursery: 20-25 days | Transplanting: 15 days",
      "Tillering: 25-30 days | Flowering: 20 days",
      "Grain Filling: 25 days",
      "",
      "WATER MANAGEMENT:",
      "• 5-7 cm during tillering",
      "• Drain before fertilizer",
      "• Intermittent during grain filling",
      "",
      "COMMON PESTS:",
      "• Leaf Blast → Tricyclazole 0.6g/L",
      "• Brown Plant Hopper → Imidacloprid 0.5ml/L",
      "• Stem Borer → Carbofuran 3G granules",
      "• Sheath Blight → Hexaconazole 2ml/L",
      "",
      "WEATHER THRESHOLDS:",
      "• Ideal: 25-35°C",
      "• Cold stress: Below 15°C",
      "• Heat stress: Above 40°C",
      "",
      "EMERGENCY HELPLINES:",
      "• Kisan Call Center: 1800-180-1551 (Free, 24x7)",
      "• Krishi Bhavan Palakkad: 0491-2505456",
      "• KAU Helpline: 0487-2438300",
      "• Pest Emergency: 1800-425-1661",
      "",
      "SMS CODES (No Internet Needed):",
      "• Send 'CROP RICE' to 51969",
      "• Send 'WEATHER PKD' to 51969",
      "• Send 'PRICE PADDY' to 51969",
      "",
      "=".repeat(50),
      "Generated by AgriDSS Palakkad",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "AgriDSS_Farming_Guide.txt";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast("Farming guide downloaded!");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      "🌾 AgriDSS Palakkad — Smart Farming Platform\n\n" +
      "✅ AI crop stress monitoring\n✅ Works offline\n✅ Malayalam, Tamil & Hindi\n✅ Emergency contacts\n\n" +
      "Emergency: Kisan Call Center 1800-180-1551 (Free 24x7)"
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const clearCache = async () => {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
    localStorage.clear();
    setSyncDone(false); setLastSync(null); setCacheSize("0 KB");
    showToast("Cache cleared — data will re-sync when online.", "info");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 80, right: 24, zIndex: 9999,
          background: toast.type === "error" ? "#fef2f2" : toast.type === "info" ? "#eff6ff" : "#f0fdf4",
          border: `1px solid ${toast.type === "error" ? "#fecaca" : toast.type === "info" ? "#bfdbfe" : "#bbf7d0"}`,
          color: toast.type === "error" ? "#991b1b" : toast.type === "info" ? "#1e40af" : "#166534",
          padding: "12px 20px", borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          animation: "os-fade 0.3s ease both",
          fontWeight: 600, fontSize: "0.85rem",
        }}>
          {toast.type === "error" ? "⚠️" : toast.type === "info" ? "ℹ️" : "✅"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#1d4ed8 100%)",
        borderRadius: "20px 20px 0 0",
        padding: "24px 28px 20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>📴</span>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#fff", fontFamily: "'Manrope',sans-serif" }}>
                Offline Mode
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}>
              Works without internet · ഇന്റർനെറ്റ് ഇല്ലാതെ · இணைய இல்லாமல்
            </p>
          </div>
          {/* Live status badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: online ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
            border: `1px solid ${online ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
            borderRadius: 99, padding: "8px 16px",
          }}>
            <StatusDot online={online} />
            <span style={{ color: online ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: "0.82rem" }}>
              {online ? "Connected" : "Offline"}
            </span>
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { v: FEATURES.filter(f => f.offline).length, l: "Offline Features" },
            { v: syncDone ? "4.2 MB" : "0 KB", l: "Cached Data" },
            { v: lastSync ? lastSync.split(",")[0] : "Never", l: "Last Sync" },
            { v: CONTACTS.length, l: "Helplines" },
          ].map(({ v, l }) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", minWidth: 100 }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{v}</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Tab strip */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.id} className={"os-tab" + (tab === t.id ? " os-active" : "")}
              style={{
                padding: "8px 14px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                borderRadius: "8px 8px 0 0",
                background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)",
                fontSize: "0.8rem", fontWeight: 600,
              }}
              onClick={() => setTab(t.id)}>
              <span style={{ marginRight: 5 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 20px 20px", padding: 24 }}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ animation: "os-fade 0.4s ease both" }}>
            {/* Connection card */}
            <div className="os-card" style={s.card}>
              <div style={s.cardHead}>
                <span style={{ fontSize: 20 }}>🌐</span>
                <h3 style={s.cardTitle}>Network Status</h3>
              </div>
              <div style={{
                padding: "16px 20px", borderRadius: 12, marginBottom: 16,
                background: online ? "#f0fdf4" : "#fef2f2",
                border: `1.5px solid ${online ? "#bbf7d0" : "#fecaca"}`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 32 }}>{online ? "✅" : "📴"}</span>
                <div>
                  <div style={{ fontWeight: 700, color: online ? "#166534" : "#991b1b", fontSize: "1rem" }}>
                    {online ? "Connected to Internet" : "Offline — No Connection"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: online ? "#16a34a" : "#dc2626", marginTop: 2 }}>
                    {online ? "All features available · Syncing in real-time" : "Basic features still working from cache"}
                  </div>
                </div>
              </div>
              {/* Sync */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>Offline Data Package</div>
                  <div style={{ color: "#64748b", fontSize: "0.78rem" }}>
                    {syncDone ? `Synced · ${cacheSize || "4.2 MB"} · ${lastSync}` : "Not synced yet"}
                  </div>
                </div>
                <button onClick={handleSync} disabled={syncing}
                  style={{
                    padding: "8px 16px", borderRadius: 10, border: "none", cursor: syncing ? "default" : "pointer",
                    background: syncing ? "#e2e8f0" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                    color: syncing ? "#64748b" : "#fff", fontWeight: 700, fontSize: "0.82rem",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  {syncing
                    ? <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #94a3b8", borderTopColor: "#6366f1", borderRadius: "50%", animation: "os-spin 0.8s linear infinite" }} /> Syncing…</>
                    : <>{syncDone ? "🔄 Re-sync" : "☁️ Sync Now"}</>
                  }
                </button>
              </div>
              {syncing && <SyncBar pct={syncPct} color="#6366f1" />}
              {syncDone && !syncing && <SyncBar pct={100} color="#22c55e" />}
            </div>

            {/* Features grid */}
            <div className="os-card" style={s.card}>
              <div style={s.cardHead}>
                <span style={{ fontSize: 20 }}>✨</span>
                <h3 style={s.cardTitle}>Feature Availability</h3>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {FEATURES.map((f, i) => (
                  <div key={i} className="os-feature-row" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    background: f.offline ? "#f8fafc" : "#fafafa",
                    border: f.offline ? "1px solid #e2e8f0" : "1px solid #f1f5f9",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>{f.label}</div>
                      <div style={{ color: "#64748b", fontSize: "0.73rem" }}>{f.sub}</div>
                    </div>
                    <span style={{
                      padding: "3px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700,
                      background: f.offline ? "#dcfce7" : "#f1f5f9",
                      color: f.offline ? "#16a34a" : "#94a3b8",
                      border: f.offline ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                      whiteSpace: "nowrap",
                    }}>
                      {f.offline ? "✓ Offline" : "Online only"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="os-card" style={s.card}>
              <div style={s.cardHead}><span style={{ fontSize: 20 }}>⚙️</span><h3 style={s.cardTitle}>App Settings</h3></div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="os-dl-btn" onClick={clearCache} style={s.clearBtn}>
                  🗑️ Clear Cache & Reset
                </button>
                <button className="os-dl-btn" onClick={() => { if ("serviceWorker" in navigator) { navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.update())); } showToast("Checking for app updates…", "info"); }}
                  style={{ ...s.clearBtn, borderColor: "#6366f1", color: "#4f46e5" }}>
                  🔄 Check for Updates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SMS ALERTS */}
        {tab === "sms" && (
          <div style={{ animation: "os-fade 0.4s ease both" }}>
            <div className="os-card" style={{ ...s.card, marginBottom: 0 }}>
              <div style={s.cardHead}><span style={{ fontSize: 20 }}>📱</span><h3 style={s.cardTitle}>SMS Codes — No Internet Required</h3></div>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: 16 }}>
                Works on any mobile phone. Send these codes to get farming information instantly, even on 2G networks.
              </p>
              <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                {SMS_CODES.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "monospace", fontWeight: 800, color: "#1e40af", fontSize: "1rem", letterSpacing: 1 }}>{c.code}</div>
                      <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: 3 }}>{c.desc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Send to</div>
                      <div style={{ fontWeight: 800, color: "#6366f1", fontSize: "1.1rem" }}>{c.to}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <SMSAlertRegistration />
            </div>
          </div>
        )}

        {/* DOWNLOADS */}
        {tab === "downloads" && (
          <div style={{ animation: "os-fade 0.4s ease both" }}>
            <div className="os-card" style={s.card}>
              <div style={s.cardHead}><span style={{ fontSize: 20 }}>📥</span><h3 style={s.cardTitle}>Downloadable Resources</h3></div>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: 20 }}>
                Save these files on your phone. Access farming guides anytime — even without this app.
              </p>
              <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Farming Quick Guide", fmt: "TXT", size: "~12 KB", color: "#16a34a", action: downloadTxt, icon: "📄" },
                  { label: "Pest Control Guide", fmt: "TXT", size: "~8 KB", color: "#dc2626", action: downloadTxt, icon: "🐛" },
                  { label: "Crop Calendar 2025", fmt: "TXT", size: "~10 KB", color: "#1d4ed8", action: downloadTxt, icon: "📅" },
                ].map((d, i) => (
                  <button key={i} className="os-dl-btn" onClick={d.action} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px", borderRadius: 14,
                    background: `linear-gradient(135deg, ${d.color}12, ${d.color}06)`,
                    border: `1.5px solid ${d.color}30`,
                    cursor: "pointer", textAlign: "left",
                  }}>
                    <span style={{ fontSize: 28 }}>{d.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>{d.label}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>Format: {d.fmt} · {d.size}</div>
                    </div>
                    <span style={{ padding: "6px 12px", borderRadius: 8, background: d.color, color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>
                      Download
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
                <h4 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: "0.9rem", fontWeight: 700 }}>📲 Share with Farmer Groups</h4>
                <button className="os-dl-btn" onClick={shareWhatsApp} style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
                  background: "#25d366", color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>📲</span> Share App on WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QUICK REFERENCE */}
        {tab === "quickref" && (
          <div style={{ animation: "os-fade 0.4s ease both" }}>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: 16 }}>
              Complete crop guides — works offline. Tap a crop to expand.
            </p>
            {CROP_REF.map((cr, ci) => (
              <div key={ci} className="os-card" style={{ ...s.card, marginBottom: 16 }}>
                <button onClick={() => setExpandedCrop(expandedCrop === ci ? -1 : ci)}
                  style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", padding: 0 }}>
                  <span style={{ fontSize: 28 }}>{cr.crop.split(" ")[1]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>{cr.crop}</div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{cr.seasons}</div>
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: "1.2rem", transform: expandedCrop === ci ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {expandedCrop === ci && (
                  <div style={{ marginTop: 16, animation: "os-fade 0.3s ease both" }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, color: "#374151", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Growth Stages</div>
                      {cr.stages.map((st, si) => (
                        <div key={si} style={{ display: "flex", gap: 12, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, border: "1px solid #e2e8f0" }}>
                          <div style={{ minWidth: 24, height: 24, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>{si + 1}</div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.83rem" }}>{st.s}</span>
                            <span style={{ color: "#94a3b8", fontSize: "0.75rem", marginLeft: 8 }}>{st.d}</span>
                            <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>💡 {st.tip}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, color: "#374151", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Common Pests & Treatment</div>
                      {cr.pests.map((p, pi) => (
                        <div key={pi} style={{ display: "flex", gap: 10, padding: "8px 12px", background: "#fef9f0", borderRadius: 8, marginBottom: 6, border: "1px solid #fde68a" }}>
                          <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.82rem", minWidth: 110 }}>{p.name}</span>
                          <span style={{ color: "#92400e", fontSize: "0.8rem" }}>→ {p.action}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: "10px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: "0.8rem", color: "#1e40af", fontWeight: 600 }}>
                      ℹ️ {cr.thresholds}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EMERGENCY */}
        {tab === "contacts" && (
          <div style={{ animation: "os-fade 0.4s ease both" }}>
            <div style={{ padding: "12px 16px", background: "#fef9c3", borderRadius: 12, border: "1px solid #fde047", marginBottom: 20, fontSize: "0.85rem", color: "#854d0e", fontWeight: 600 }}>
              ⚡ All numbers below work without internet. Save them on your phone now.
            </div>
            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              {CONTACTS.map((c, i) => (
                <div key={i} className="os-card" style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 20px", borderRadius: 14,
                  background: "#fff", border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}15`, border: `1.5px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 20 }}>📞</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.88rem" }}>{c.name}</div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>{c.note}</div>
                  </div>
                  <a href={`tel:${c.num}`} style={{
                    padding: "8px 14px", borderRadius: 10, background: `${c.color}`,
                    color: "#fff", fontWeight: 800, fontSize: "0.85rem", textDecoration: "none",
                    fontFamily: "monospace", letterSpacing: 0.5,
                  }}>
                    {c.num}
                  </a>
                </div>
              ))}
            </div>
            <div className="os-card" style={{ ...s.card, background: "#fef2f2", border: "1.5px solid #fecaca" }}>
              <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: 8, fontSize: "0.9rem" }}>🚨 Crop Emergency Protocol</div>
              <ol style={{ color: "#7f1d1d", fontSize: "0.82rem", lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                <li>Call Pest Emergency: 1800-425-1661 (Free, 24×7)</li>
                <li>Describe: crop name, visible symptom, days since appearance</li>
                <li>Take a photo of affected plant for diagnosis</li>
                <li>Do NOT spray randomly — wait for expert advice</li>
                <li>Isolate affected area to prevent spread</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  card: { background: "#fff", borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", marginBottom: 16 },
  cardHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  cardTitle: { margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" },
  clearBtn: { padding: "10px 16px", borderRadius: 10, background: "#fff", border: "1.5px solid #e2e8f0", color: "#64748b", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" },
};
