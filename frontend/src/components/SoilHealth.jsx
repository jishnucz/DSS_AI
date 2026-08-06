/**
 * 🌱 Soil Health Analysis Component
 * Shows soil nutrient status, pH, and recommendations
 */

import { useState } from "react";

// Palakkad soil profiles by taluk
const SOIL_PROFILES = {
  "Palakkad Central": {
    type: "Clay Loam",
    ph: 6.2,
    nitrogen: 245, // kg/ha
    phosphorus: 18, // kg/ha
    potassium: 180, // kg/ha
    organic: 0.8, // %
    ec: 0.32, // dS/m
    zinc: 0.9,
    iron: 8.2,
    manganese: 12.5,
    copper: 1.2
  },
  "Chittur": {
    type: "Red Loam",
    ph: 5.8,
    nitrogen: 220,
    phosphorus: 15,
    potassium: 165,
    organic: 0.65,
    ec: 0.28,
    zinc: 0.7,
    iron: 12.5,
    manganese: 18.5,
    copper: 0.9
  },
  "Alathur": {
    type: "Laterite",
    ph: 5.5,
    nitrogen: 195,
    phosphorus: 12,
    potassium: 150,
    organic: 0.55,
    ec: 0.22,
    zinc: 0.5,
    iron: 22.5,
    manganese: 28.5,
    copper: 0.8
  },
  "Mannarkad": {
    type: "Forest Loam",
    ph: 6.5,
    nitrogen: 280,
    phosphorus: 22,
    potassium: 210,
    organic: 1.2,
    ec: 0.35,
    zinc: 1.2,
    iron: 6.8,
    manganese: 8.5,
    copper: 1.5
  }
};

// Optimal ranges for rice
const OPTIMAL_RANGES = {
  ph: { min: 5.5, max: 6.5, ideal: 6.0 },
  nitrogen: { min: 200, max: 300, unit: "kg/ha" },
  phosphorus: { min: 15, max: 25, unit: "kg/ha" },
  potassium: { min: 150, max: 250, unit: "kg/ha" },
  organic: { min: 0.75, max: 1.5, unit: "%" },
  zinc: { min: 0.6, max: 2.0, unit: "ppm" }
};

export default function SoilHealth({ taluk = "Palakkad Central", crop = "rice" }) {
  const [selectedTaluk, setSelectedTaluk] = useState(taluk);
  const soil = SOIL_PROFILES[selectedTaluk] || SOIL_PROFILES["Palakkad Central"];
  
  const getStatus = (value, metric) => {
    const range = OPTIMAL_RANGES[metric];
    if (!range) return { status: "unknown", color: "#6b7280" };
    
    if (value < range.min) return { status: "Low", color: "#ef4444", bg: "#fef2f2" };
    if (value > range.max) return { status: "High", color: "#f59e0b", bg: "#fef3c7" };
    return { status: "Optimal", color: "#22c55e", bg: "#f0fdf4" };
  };
  
  const getRecommendations = () => {
    const recs = [];
    
    // pH recommendations
    if (soil.ph < 5.5) {
      recs.push({ icon: "⚗️", text: "Apply lime @ 500 kg/ha to correct acidity", priority: "high" });
    } else if (soil.ph > 7.0) {
      recs.push({ icon: "⚗️", text: "Apply gypsum @ 250 kg/ha to reduce alkalinity", priority: "high" });
    }
    
    // Nitrogen
    if (soil.nitrogen < 200) {
      recs.push({ icon: "🧪", text: "Increase nitrogen: Apply Urea @ 120 kg/ha in splits", priority: "high" });
    }
    
    // Phosphorus
    if (soil.phosphorus < 15) {
      recs.push({ icon: "🧪", text: "Add phosphorus: Apply DAP @ 60 kg/ha at sowing", priority: "medium" });
    }
    
    // Potassium
    if (soil.potassium < 150) {
      recs.push({ icon: "🧪", text: "Boost potassium: Apply MOP @ 50 kg/ha", priority: "medium" });
    }
    
    // Organic matter
    if (soil.organic < 0.75) {
      recs.push({ icon: "🍂", text: "Improve organic matter: Add FYM @ 10 t/ha or green manure", priority: "high" });
    }
    
    // Zinc
    if (soil.zinc < 0.6) {
      recs.push({ icon: "🔬", text: "Zinc deficiency: Apply ZnSO4 @ 25 kg/ha", priority: "medium" });
    }
    
    // General good practices
    if (recs.length === 0) {
      recs.push({ icon: "✅", text: "Soil health is good! Maintain with balanced fertilization", priority: "low" });
    }
    
    return recs;
  };
  
  const styles = {
    container: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      border: "1px solid rgba(139, 69, 19, 0.15)",
      color: "#1f2937",
      overflow: "hidden",
      minWidth: "0"
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px"
    },
    title: {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    titleText: {
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#1f2937",
      margin: 0
    },
    subtitle: {
      fontSize: "0.8rem",
      color: "#6b7280"
    },
    select: {
      padding: "8px 16px",
      borderRadius: "8px",
      border: "1px solid #e5e7eb",
      fontSize: "0.9rem",
      background: "#fff",
      color: "#1e293b",
      cursor: "pointer",
      fontWeight: 500
    },
    soilType: {
      padding: "16px",
      background: "linear-gradient(135deg, #fef3c7, #fde68a)",
      borderRadius: "12px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      gap: "16px"
    },
    soilIcon: {
      fontSize: "40px"
    },
    soilInfo: {
      flex: 1
    },
    soilName: {
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#92400e"
    },
    soilMeta: {
      fontSize: "0.85rem",
      color: "#b45309"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
      gap: "12px",
      marginBottom: "20px"
    },
    card: {
      padding: "14px",
      borderRadius: "10px",
      textAlign: "center"
    },
    cardLabel: {
      fontSize: "0.75rem",
      color: "#6b7280",
      marginBottom: "4px"
    },
    cardValue: {
      fontSize: "1.3rem",
      fontWeight: 700
    },
    cardStatus: {
      fontSize: "0.7rem",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: "10px",
      marginTop: "4px",
      display: "inline-block"
    },
    phMeter: {
      marginBottom: "20px"
    },
    phBar: {
      height: "20px",
      borderRadius: "10px",
      background: "linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #22c55e, #3b82f6, #8b5cf6)",
      position: "relative",
      marginTop: "8px"
    },
    phMarker: {
      position: "absolute",
      top: "-8px",
      width: "4px",
      height: "36px",
      background: "#1f2937",
      borderRadius: "2px",
      transform: "translateX(-50%)"
    },
    phLabels: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "0.7rem",
      color: "#6b7280",
      marginTop: "4px"
    },
    recommendations: {
      padding: "16px",
      background: "#f0fdf4",
      borderRadius: "12px",
      border: "1px solid #bbf7d0"
    },
    recTitle: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#166534",
      marginBottom: "12px"
    },
    recList: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    recItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 12px",
      background: "#fff",
      borderRadius: "8px",
      fontSize: "0.85rem"
    },
    recIcon: {
      fontSize: "18px"
    },
    microGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "10px",
      marginBottom: "20px"
    },
    microCard: {
      padding: "10px",
      background: "#f9fafb",
      borderRadius: "8px",
      textAlign: "center"
    }
  };
  
  const recommendations = getRecommendations();
  const nitrogenStatus = getStatus(soil.nitrogen, "nitrogen");
  const phosphorusStatus = getStatus(soil.phosphorus, "phosphorus");
  const potassiumStatus = getStatus(soil.potassium, "potassium");
  const organicStatus = getStatus(soil.organic, "organic");
  const zincStatus = getStatus(soil.zinc, "zinc");
  const phStatus = getStatus(soil.ph, "ph");
  
  // pH indicator position (4-9 scale mapped to 0-100%)
  const phPosition = ((soil.ph - 4) / 5) * 100;
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <span style={{ fontSize: "28px" }}>🌱</span>
          <div>
            <h3 style={styles.titleText}>Soil Health Analysis</h3>
            <p style={styles.subtitle}>Nutrient status & recommendations</p>
          </div>
        </div>
        
        <select 
          style={styles.select}
          value={selectedTaluk}
          onChange={(e) => setSelectedTaluk(e.target.value)}
        >
          {Object.keys(SOIL_PROFILES).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      
      {/* Soil Type Info */}
      <div style={styles.soilType}>
        <span style={styles.soilIcon}>🏔️</span>
        <div style={styles.soilInfo}>
          <div style={styles.soilName}>{soil.type}</div>
          <div style={styles.soilMeta}>EC: {soil.ec} dS/m • Organic Carbon: {soil.organic}%</div>
        </div>
        <div style={{
          padding: "8px 14px",
          background: phStatus.bg,
          borderRadius: "8px",
          color: phStatus.color,
          fontWeight: 600
        }}>
          pH: {soil.ph}
        </div>
      </div>
      
      {/* pH Meter */}
      <div style={styles.phMeter}>
        <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>
          Soil pH Level
        </div>
        <div style={styles.phBar}>
          <div style={{ ...styles.phMarker, left: `${phPosition}%` }} />
        </div>
        <div style={styles.phLabels}>
          <span>4 (Acidic)</span>
          <span>5.5</span>
          <span>6.5 (Ideal)</span>
          <span>7.5</span>
          <span>9 (Alkaline)</span>
        </div>
      </div>
      
      {/* Macro Nutrients */}
      <div style={styles.grid}>
        <div style={{ ...styles.card, background: nitrogenStatus.bg }}>
          <div style={styles.cardLabel}>Nitrogen (N)</div>
          <div style={{ ...styles.cardValue, color: nitrogenStatus.color }}>{soil.nitrogen}</div>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>kg/ha</div>
          <span style={{ 
            ...styles.cardStatus, 
            background: nitrogenStatus.color,
            color: "#fff"
          }}>
            {nitrogenStatus.status}
          </span>
        </div>
        
        <div style={{ ...styles.card, background: phosphorusStatus.bg }}>
          <div style={styles.cardLabel}>Phosphorus (P)</div>
          <div style={{ ...styles.cardValue, color: phosphorusStatus.color }}>{soil.phosphorus}</div>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>kg/ha</div>
          <span style={{ 
            ...styles.cardStatus, 
            background: phosphorusStatus.color,
            color: "#fff"
          }}>
            {phosphorusStatus.status}
          </span>
        </div>
        
        <div style={{ ...styles.card, background: potassiumStatus.bg }}>
          <div style={styles.cardLabel}>Potassium (K)</div>
          <div style={{ ...styles.cardValue, color: potassiumStatus.color }}>{soil.potassium}</div>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>kg/ha</div>
          <span style={{ 
            ...styles.cardStatus, 
            background: potassiumStatus.color,
            color: "#fff"
          }}>
            {potassiumStatus.status}
          </span>
        </div>
      </div>
      
      {/* Micro Nutrients */}
      <div style={styles.microGrid}>
        <div style={styles.microCard}>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Zinc</div>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: zincStatus.color }}>{soil.zinc} ppm</div>
        </div>
        <div style={styles.microCard}>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Iron</div>
          <div style={{ fontSize: "1rem", fontWeight: 600 }}>{soil.iron} ppm</div>
        </div>
        <div style={styles.microCard}>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Manganese</div>
          <div style={{ fontSize: "1rem", fontWeight: 600 }}>{soil.manganese} ppm</div>
        </div>
        <div style={styles.microCard}>
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Copper</div>
          <div style={{ fontSize: "1rem", fontWeight: 600 }}>{soil.copper} ppm</div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div style={styles.recommendations}>
        <div style={styles.recTitle}>📋 Fertilizer Recommendations for {crop}</div>
        <div style={styles.recList}>
          {recommendations.map((rec, i) => (
            <div key={i} style={styles.recItem}>
              <span style={styles.recIcon}>{rec.icon}</span>
              <span style={{ flex: 1 }}>{rec.text}</span>
              <span style={{
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "0.7rem",
                fontWeight: 600,
                background: rec.priority === "high" ? "#fef2f2" : rec.priority === "medium" ? "#fef3c7" : "#f0fdf4",
                color: rec.priority === "high" ? "#991b1b" : rec.priority === "medium" ? "#92400e" : "#166534"
              }}>
                {rec.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
