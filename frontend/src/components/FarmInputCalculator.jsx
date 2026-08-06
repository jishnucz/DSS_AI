/**
 * 🧮 Farm Input Calculator
 * Calculates seed, fertilizer, pesticide requirements with cost estimation
 */

import { useState, useEffect } from "react";

// Input requirements per hectare for different crops
const CROP_INPUTS = {
  rice: {
    seed: { amount: 50, unit: "kg", price: 60 }, // kg/ha
    urea: { amount: 100, unit: "kg", price: 8 },
    dap: { amount: 50, unit: "kg", price: 28 },
    mop: { amount: 50, unit: "kg", price: 18 },
    zinc: { amount: 25, unit: "kg", price: 45 },
    pesticide: { amount: 2, unit: "L", price: 800 },
    herbicide: { amount: 1.5, unit: "L", price: 600 },
    labor: { amount: 40, unit: "days", price: 600 }
  },
  coconut: {
    fertilizer: { amount: 500, unit: "g/palm", price: 0.5 },
    organic: { amount: 25, unit: "kg/palm", price: 5 },
    pesticide: { amount: 0.5, unit: "L/palm", price: 400 }
  },
  banana: {
    sucker: { amount: 2500, unit: "nos/ha", price: 25 },
    urea: { amount: 200, unit: "kg", price: 8 },
    dap: { amount: 100, unit: "kg", price: 28 },
    mop: { amount: 300, unit: "kg", price: 18 },
    organic: { amount: 10000, unit: "kg", price: 3 }
  },
  vegetables: {
    seed: { amount: 5, unit: "kg", price: 2000 },
    urea: { amount: 80, unit: "kg", price: 8 },
    dap: { amount: 60, unit: "kg", price: 28 },
    mop: { amount: 40, unit: "kg", price: 18 },
    pesticide: { amount: 3, unit: "L", price: 600 }
  }
};

export default function FarmInputCalculator({
  crop = "rice",
  landArea = 1,
  season = "kharif"
}) {
  const [inputs, setInputs] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [showDetails, setShowDetails] = useState(true);
  
  useEffect(() => {
    calculateInputs();
  }, [crop, landArea]);
  
  const calculateInputs = () => {
    const cropData = CROP_INPUTS[crop] || CROP_INPUTS.rice;
    const calculated = [];
    let total = 0;
    
    Object.entries(cropData).forEach(([name, data]) => {
      const quantity = data.amount * landArea;
      const cost = quantity * data.price;
      total += cost;
      
      calculated.push({
        name: formatName(name),
        quantity: quantity.toFixed(1),
        unit: data.unit,
        unitPrice: data.price,
        totalCost: cost
      });
    });
    
    setInputs(calculated);
    setTotalCost(total);
  };
  
  const formatName = (name) => {
    const names = {
      seed: "🌾 Seeds",
      urea: "🧪 Urea (N)",
      dap: "🧪 DAP (P)",
      mop: "🧪 MOP (K)",
      zinc: "🧪 Zinc Sulphate",
      pesticide: "🐛 Pesticide",
      herbicide: "🌿 Herbicide",
      labor: "👷 Labor",
      sucker: "🌱 Suckers",
      organic: "🍂 Organic Manure",
      fertilizer: "🧪 NPK Fertilizer"
    };
    return names[name] || name;
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const fertilizerCost = inputs.filter(i => i.name.includes("🧪")).reduce((sum, i) => sum + i.totalCost, 0);
  const laborCost      = inputs.find(i => i.name.includes("Labor"))?.totalCost || 0;
  const otherCost      = totalCost - fertilizerCost - laborCost;

  const breakdown = [
    { label: "Fertilizers", value: fertilizerCost, pct: Math.round((fertilizerCost / totalCost) * 100) || 0, color: "#8b5cf6" },
    { label: "Labor",       value: laborCost,      pct: Math.round((laborCost / totalCost) * 100) || 0,      color: "#f59e0b" },
    { label: "Seeds & Other", value: otherCost,    pct: Math.round((otherCost / totalCost) * 100) || 0,      color: "#16a34a" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.09)", border: "1px solid #e2e8f0" }}>

      {/* Gradient Header */}
      <div style={{ background: "linear-gradient(135deg,#3b0764,#7c3aed)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🧮</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "'Manrope',sans-serif" }}>Farm Input Calculator</div>
              <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>{crop.charAt(0).toUpperCase() + crop.slice(1)} · {landArea} ha · {season}</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", opacity: 0.85, marginBottom: 2 }}>Total Cost</div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "'Manrope',sans-serif" }}>{formatCurrency(totalCost)}</div>
          </div>
        </div>

        {/* Cost breakdown bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", gap: 2 }}>
            {breakdown.map(b => (
              <div key={b.label} style={{ width: `${b.pct}%`, background: b.color, transition: "width 0.8s ease" }} title={`${b.label}: ${b.pct}%`} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {breakdown.map(b => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.7rem", opacity: 0.85 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.color }} />
                {b.label} ({b.pct}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Summary stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {breakdown.map(b => (
            <div key={b.label} style={{ background: "#faf5ff", borderRadius: 12, padding: "12px 14px", textAlign: "center", border: `1.5px solid ${b.color}20` }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: b.color, fontFamily: "'Manrope',sans-serif" }}>{formatCurrency(b.value)}</div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 3 }}>{b.label}</div>
            </div>
          ))}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{ padding: "7px 16px", background: "#f5f3ff", border: "1.5px solid #e9d5ff", borderRadius: 10, fontSize: "0.8rem", color: "#7c3aed", cursor: "pointer", fontWeight: 600, marginBottom: 14 }}
        >
          {showDetails ? "▲ Hide line items" : "▼ Show line items"}
        </button>

        {/* Table */}
        {showDetails && (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f3ff" }}>
                  {["Input", "Quantity", "Rate/Unit", "Total"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: i === 3 ? "right" : "left", fontSize: "0.75rem", fontWeight: 700, color: "#5b21b6", borderBottom: "2px solid #e9d5ff" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inputs.map((input, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#faf5ff" }}>
                    <td style={{ padding: "10px 12px", fontSize: "0.83rem", color: "#1e293b", borderBottom: "1px solid #f3e8ff" }}>{input.name}</td>
                    <td style={{ padding: "10px 12px", fontSize: "0.83rem", color: "#475569", borderBottom: "1px solid #f3e8ff" }}>{input.quantity} {input.unit}</td>
                    <td style={{ padding: "10px 12px", fontSize: "0.83rem", color: "#475569", borderBottom: "1px solid #f3e8ff" }}>₹{input.unitPrice}</td>
                    <td style={{ padding: "10px 12px", fontSize: "0.83rem", fontWeight: 700, color: "#7c3aed", textAlign: "right", borderBottom: "1px solid #f3e8ff" }}>{formatCurrency(input.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Note */}
        <div style={{ padding: "12px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", fontSize: "0.8rem", color: "#92400e", display: "flex", gap: 8 }}>
          <span>💡</span>
          <span><strong>Note:</strong> Prices are approximate based on current market rates. Consider applying for PM-KISAN and fertilizer subsidy schemes to reduce costs.</span>
        </div>
      </div>
    </div>
  );
}
