import { useState, useEffect } from "react";

const CROP_PRICES = {
  rice: {
    name: "Paddy (Rice)", icon: "🍚", unit: "quintal", msp: 2183,
    mandi: [
      { market: "Local Market", price: 2350, change: +2.5 },
      { market: "Thrissur",     price: 2280, change: -1.2 },
      { market: "Ernakulam",   price: 2420, change: +3.1 },
      { market: "Kozhikode",   price: 2300, change: +0.8 },
    ],
    trend: [2100, 2150, 2180, 2220, 2280, 2350],
    months: ["Jul","Aug","Sep","Oct","Nov","Dec"],
  },
  coconut: {
    name: "Coconut", icon: "🥥", unit: "1000 nuts", msp: 10000,
    mandi: [
      { market: "Local Market", price: 28500, change: +5.2 },
      { market: "Alappuzha",   price: 29200, change: +4.8 },
      { market: "Kannur",      price: 27800, change: +3.5 },
    ],
    trend: [22000, 24000, 25500, 26800, 27500, 28500],
    months: ["Jul","Aug","Sep","Oct","Nov","Dec"],
  },
  banana: {
    name: "Banana (Nendran)", icon: "🍌", unit: "quintal", msp: null,
    mandi: [
      { market: "Local Market", price: 4200, change: -2.1 },
      { market: "Thrissur",     price: 4350, change: +1.5 },
      { market: "Ernakulam",   price: 4500, change: +2.8 },
    ],
    trend: [3800, 4000, 4100, 4300, 4250, 4200],
    months: ["Jul","Aug","Sep","Oct","Nov","Dec"],
  },
  vegetables: {
    name: "Vegetables (Avg)", icon: "🥬", unit: "quintal", msp: null,
    mandi: [
      { market: "Local Market", price: 3500, change: +8.5 },
      { market: "Thrissur",     price: 3800, change: +6.2 },
      { market: "Kochi",        price: 4200, change: +4.1 },
    ],
    trend: [2800, 3000, 3200, 3100, 3300, 3500],
    months: ["Jul","Aug","Sep","Oct","Nov","Dec"],
  },
};

const CSS = `
  @keyframes mp-bar { from{transform:scaleY(0)} to{transform:scaleY(1)} }
  @keyframes mp-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .mp-crop-btn { transition: all 0.2s ease; }
  .mp-crop-btn:hover { transform: translateY(-2px); }
  .mp-mandi-card { transition: all 0.2s ease; }
  .mp-mandi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }
  .mp-bar-col { animation: mp-bar 0.6s var(--ease-out,cubic-bezier(0.16,1,0.3,1)) both; transform-origin: bottom; }
`;

function injectCSS(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

const fmt = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

export default function MarketPrices({ selectedCrop = "rice" }) {
  injectCSS("market-prices", CSS);
  const [crop, setCrop] = useState(selectedCrop);
  const data = CROP_PRICES[crop] || CROP_PRICES.rice;

  const maxP   = Math.max(...data.trend);
  const minP   = Math.min(...data.trend);
  const rangeP = maxP - minP || 1;

  const bestMandi = data.mandi.reduce((a, b) => (a.price > b.price ? a : b));
  const trending  = data.mandi[0].change > 0;

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.09)", border: "1px solid #e2e8f0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#713f12,#d97706)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>💰</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "'Manrope',sans-serif" }}>Market Prices</div>
              <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>MSP & Mandi rates · Updated today</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            {trending ? "📈 Trending Up" : "📉 Trending Down"}
          </div>
        </div>

        {/* Crop selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(CROP_PRICES).map(([key, val]) => (
            <button
              key={key}
              className="mp-crop-btn"
              onClick={() => setCrop(key)}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                border: "none",
                background: crop === key ? "#fff" : "rgba(255,255,255,0.2)",
                color: crop === key ? "#d97706" : "#fff",
                fontWeight: crop === key ? 700 : 600,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              {val.icon} {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, animation: "mp-fade 0.3s ease both" }} key={crop}>

        {/* MSP + Best Price row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "linear-gradient(135deg,#dcfce7,#f0fdf4)", borderRadius: 14, padding: "16px 18px", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Govt. MSP</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#15803d", fontFamily: "'Manrope',sans-serif" }}>
              {data.msp ? fmt(data.msp) : "No MSP"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#166534", marginTop: 4 }}>per {data.unit}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#fef3c7,#fffbeb)", borderRadius: 14, padding: "16px 18px", border: "1px solid #fde68a" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Best Mandi Price</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#d97706", fontFamily: "'Manrope',sans-serif" }}>{fmt(bestMandi.price)}</div>
            <div style={{ fontSize: "0.72rem", color: "#92400e", marginTop: 4 }}>📍 {bestMandi.market}</div>
          </div>
        </div>

        {/* Mandi cards */}
        <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 10 }}>Mandi Rates</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10, marginBottom: 18 }}>
          {data.mandi.map((m, i) => {
            const up = m.change > 0;
            const down = m.change < 0;
            return (
              <div key={i} className="mp-mandi-card" style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 4 }}>📍 {m.market}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Manrope',sans-serif" }}>{fmt(m.price)}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 8px", borderRadius: 99, background: up ? "#dcfce7" : down ? "#fee2e2" : "#f1f5f9", color: up ? "#166534" : down ? "#991b1b" : "#64748b", fontSize: "0.72rem", fontWeight: 700 }}>
                  {up ? "↑" : down ? "↓" : "→"} {Math.abs(m.change)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Bar chart */}
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b", marginBottom: 14 }}>📈 6-Month Price Trend <span style={{ color: "#64748b", fontWeight: 500 }}>({data.unit})</span></div>
          <div style={{ display: "flex", alignItems: "flex-end", height: 120, gap: 8 }}>
            {data.trend.map((price, i) => {
              const pct = 20 + ((price - minP) / rangeP) * 80;
              const isLast = i === data.trend.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%" }}>
                    <div
                      className="mp-bar-col"
                      style={{
                        height: `${pct}%`,
                        background: isLast ? "linear-gradient(to top,#16a34a,#4ade80)" : "linear-gradient(to top,#d1fae5,#86efac)",
                        borderRadius: "6px 6px 0 0",
                        animationDelay: `${i * 0.08}s`,
                        position: "relative",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 4 }}>{data.months[i]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.72rem", color: "#94a3b8" }}>
            <span>Min: {fmt(minP)}</span>
            <span>Max: {fmt(maxP)}</span>
          </div>
        </div>

        {/* Tip */}
        <div style={{ marginTop: 14, padding: "12px 16px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", fontSize: "0.82rem", color: "#166534", display: "flex", gap: 8 }}>
          <span>💡</span>
          <span>
            <strong>{data.name}</strong> is {trending ? "trending up" : "relatively stable"}.{" "}
            {data.msp && bestMandi.price > data.msp
              ? `Currently trading ₹${(bestMandi.price - data.msp).toLocaleString("en-IN")} above MSP.`
              : "Consider timing your sale for best returns."}
          </span>
        </div>
      </div>
    </div>
  );
}
