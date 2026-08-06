import { useState } from "react";

const GOVERNMENT_SCHEMES = [
  {
    id:"pmkisan", name:"PM-KISAN", fullName:"Pradhan Mantri Kisan Samman Nidhi",
    icon:"🏛️", category:"income", amount:"₹6,000/year",
    eligibility:["Land-owning farmers","Valid Aadhaar","Bank account"],
    benefits:["Direct cash transfer","3 installments of ₹2,000","No repayment"],
    applyLink:"pmkisan.gov.in", status:"active",
    documents:["Aadhaar Card","Land Records","Bank Passbook"],
  },
  {
    id:"pmfby", name:"PMFBY", fullName:"Pradhan Mantri Fasal Bima Yojana",
    icon:"🌾", category:"insurance", amount:"Up to sum insured",
    eligibility:["All farmers","Notified crops","Seasonal coverage"],
    benefits:["Crop loss coverage","Low premium (2%)","Natural calamity protection"],
    applyLink:"pmfby.gov.in", status:"active",
    documents:["Land Records","Sowing Certificate","Bank Account"],
  },
  {
    id:"kcc", name:"KCC", fullName:"Kisan Credit Card",
    icon:"💳", category:"credit", amount:"Up to ₹3 lakh @ 4%",
    eligibility:["All farmers","Owner cultivators","Tenant farmers"],
    benefits:["Low interest rate","Flexible repayment","Insurance cover"],
    applyLink:"Nearest bank branch", status:"active",
    documents:["Land Records","ID Proof","Passport Photo"],
  },
  {
    id:"pkvy", name:"PKVY", fullName:"Paramparagat Krishi Vikas Yojana",
    icon:"🌿", category:"organic", amount:"₹50,000/ha over 3 years",
    eligibility:["Cluster of 50+ farmers","Organic farming commitment","PGS certification"],
    benefits:["Organic certification","Training support","Market linkage"],
    applyLink:"Agriculture Department", status:"active",
    documents:["Land Records","Cluster Formation","Organic Pledge"],
  },
  {
    id:"smam", name:"SMAM", fullName:"Sub-Mission on Agricultural Mechanization",
    icon:"🚜", category:"equipment", amount:"25–50% subsidy",
    eligibility:["All farmers","SC/ST extra benefits","Women farmers priority"],
    benefits:["Tractor subsidy","Equipment purchase","Custom hiring center"],
    applyLink:"Agriculture Department", status:"active",
    documents:["Land Records","Quotation","Category Certificate"],
  },
  {
    id:"pmksy", name:"PMKSY", fullName:"Pradhan Mantri Krishi Sinchai Yojana",
    icon:"💧", category:"irrigation", amount:"55–75% subsidy",
    eligibility:["All farmers","Drip/Sprinkler adoption"],
    benefits:["Micro irrigation subsidy","Water saving","Per drop more crop"],
    applyLink:"Agriculture / Horticulture Dept", status:"active",
    documents:["Land Records","Water Source Proof","Quotation"],
  },
  {
    id:"rkvy", name:"RKVY-RAFTAAR", fullName:"Rashtriya Krishi Vikas Yojana",
    icon:"📈", category:"development", amount:"Project based",
    eligibility:["State approved projects","FPO/FPC","Agri-startups"],
    benefits:["Infrastructure support","Value addition","Agri-business support"],
    applyLink:"State Agriculture Dept", status:"active",
    documents:["Project Proposal","Registration","Business Plan"],
  },
  {
    id:"kerala_rice", name:"Kerala Rice Mission", fullName:"Paddy Procurement & MSP",
    icon:"🍚", category:"msp", amount:"₹28.20/kg + bonus",
    eligibility:["Palakkad rice farmers","Grade A paddy","Registered with Supplyco"],
    benefits:["MSP guarantee","Bonus payment","Direct procurement"],
    applyLink:"Krishi Bhavan", status:"active",
    documents:["Pattayam","Ration Card","Bank Account"],
  },
];

const CATEGORIES = {
  income:      { label:"Income Support",    color:"#16a34a", bg:"#f0fdf4", icon:"💵" },
  insurance:   { label:"Crop Insurance",    color:"#f59e0b", bg:"#fffbeb", icon:"🛡️" },
  credit:      { label:"Credit / Loan",     color:"#3b82f6", bg:"#eff6ff", icon:"🏦" },
  organic:     { label:"Organic Farming",   color:"#10b981", bg:"#ecfdf5", icon:"🌿" },
  equipment:   { label:"Equipment",         color:"#8b5cf6", bg:"#f5f3ff", icon:"🚜" },
  irrigation:  { label:"Irrigation",        color:"#06b6d4", bg:"#ecfeff", icon:"💧" },
  development: { label:"Development",       color:"#ec4899", bg:"#fdf2f8", icon:"📈" },
  msp:         { label:"MSP / Procurement", color:"#84cc16", bg:"#f7fee7", icon:"🍚" },
};

const CSS = `
  @keyframes gs-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gs-slide { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  .gs-card { transition: all 0.22s ease; cursor: pointer; }
  .gs-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
  .gs-filter { transition: all 0.18s ease; }
  .gs-filter:hover { transform: translateY(-2px); }
  .gs-doc { transition: all 0.15s ease; }
  .gs-doc:hover { background: #dcfce7 !important; }
  .gs-detail { animation: gs-slide 0.3s ease both; }
`;

function injectCSS(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

export default function GovernmentSchemes({ crop = "rice" }) {
  injectCSS("gov-schemes", CSS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("all");

  const visible = filter === "all"
    ? GOVERNMENT_SCHEMES
    : GOVERNMENT_SCHEMES.filter(s => s.category === filter);

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.09)", border: "1px solid #e2e8f0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏛️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "'Manrope',sans-serif" }}>Government Schemes</div>
              <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>Subsidies & assistance for {crop} farmers</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 700 }}>
            {GOVERNMENT_SCHEMES.length} active schemes
          </div>
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          <button
            className="gs-filter"
            onClick={() => setFilter("all")}
            style={{ padding: "5px 14px", borderRadius: 99, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: filter === "all" ? "#fff" : "rgba(255,255,255,0.2)", color: filter === "all" ? "#1d4ed8" : "#fff" }}
          >
            All
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              className="gs-filter"
              onClick={() => setFilter(key)}
              style={{ padding: "5px 14px", borderRadius: 99, border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", background: filter === key ? "#fff" : "rgba(255,255,255,0.15)", color: filter === key ? cat.color : "#fff" }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* Scheme cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, animation: "gs-fade 0.3s ease both" }} key={filter}>
          {visible.map(scheme => {
            const cat    = CATEGORIES[scheme.category];
            const active = selected?.id === scheme.id;
            return (
              <div
                key={scheme.id}
                className="gs-card"
                style={{
                  borderRadius: 14,
                  border: `1.5px solid ${active ? cat.color : "#e2e8f0"}`,
                  background: active ? cat.bg : "#fafafa",
                  padding: "14px 16px",
                  boxShadow: active ? `0 4px 20px ${cat.color}20` : "0 2px 8px rgba(0,0,0,0.04)",
                }}
                onClick={() => setSelected(active ? null : scheme)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.bg, border: `1.5px solid ${cat.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {scheme.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>{scheme.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>{scheme.fullName}</div>
                  </div>
                  <div style={{ background: cat.bg, color: cat.color, fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, flexShrink: 0, border: `1px solid ${cat.color}30` }}>
                    {cat.icon}
                  </div>
                </div>

                <div style={{ marginTop: 10, padding: "8px 12px", background: active ? "rgba(255,255,255,0.7)" : "#f0fdf4", borderRadius: 10, fontSize: "0.85rem", fontWeight: 700, color: "#166534", border: "1px solid #bbf7d0" }}>
                  💰 {scheme.amount}
                </div>

                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                  {scheme.benefits.slice(0, 2).map((b, i) => (
                    <span key={i} style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 99, background: "#f1f5f9", color: "#475569" }}>✓ {b}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="gs-detail" style={{ marginTop: 16, background: `${CATEGORIES[selected.category].bg}`, borderRadius: 16, border: `1.5px solid ${CATEGORIES[selected.category].color}40`, overflow: "hidden" }}>
            {/* Detail header */}
            <div style={{ background: CATEGORIES[selected.category].color, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 32 }}>{selected.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", fontFamily: "'Manrope',sans-serif" }}>{selected.name}</div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.85)" }}>{selected.fullName}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}>✕</button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: CATEGORIES[selected.category].color, marginBottom: 10 }}>✅ Eligibility</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {selected.eligibility.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.83rem", color: "#1e293b" }}>
                        <span style={{ color: CATEGORIES[selected.category].color, fontWeight: 700 }}>→</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: CATEGORIES[selected.category].color, marginBottom: 10 }}>🎁 Benefits</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {selected.benefits.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.83rem", color: "#1e293b" }}>
                        <span style={{ color: CATEGORIES[selected.category].color, fontWeight: 700 }}>→</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: CATEGORIES[selected.category].color, marginBottom: 10 }}>📄 Documents Required</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {selected.documents.map((doc, i) => (
                  <span key={i} className="gs-doc" style={{ padding: "6px 12px", background: "#fff", borderRadius: 99, fontSize: "0.78rem", color: "#334155", border: "1px solid #e2e8f0", fontWeight: 600 }}>
                    📎 {doc}
                  </span>
                ))}
              </div>

              <div style={{ padding: "12px 16px", background: "#fff", borderRadius: 12, border: `1.5px solid ${CATEGORIES[selected.category].color}30`, fontSize: "0.85rem", color: CATEGORIES[selected.category].color, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🔗</span>
                <span>How to apply: <strong>{selected.applyLink}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
