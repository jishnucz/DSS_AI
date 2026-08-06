/**
 * 🐛 Pest Forecasting Component
 * AI-powered pest risk prediction based on weather conditions
 * Specific to Palakkad rice pests and diseases
 */

import { useState, useEffect } from "react";

// Common rice pests in Palakkad with weather triggers
const PEST_DATABASE = [
  {
    id: "bph",
    name: "Brown Plant Hopper (BPH)",
    icon: "🦗",
    category: "insect",
    criticalMonths: [7, 8, 9, 10],
    tempRange: [25, 35],
    humidityThreshold: 85,
    rainTrigger: "after_heavy",
    description: "Sucks plant sap, causes hopper burn",
    symptoms: ["Yellowing leaves", "Hopper burn", "Honeydew secretion", "Sooty mold"],
    prevention: ["Avoid excess N fertilizer", "Maintain field hygiene", "Use resistant varieties", "Light traps"],
    treatment: ["Imidacloprid spray", "Thiamethoxam", "Drain water, dry field"]
  },
  {
    id: "stem_borer",
    name: "Stem Borer",
    icon: "🐛",
    category: "insect",
    criticalMonths: [6, 7, 8, 9],
    tempRange: [28, 34],
    humidityThreshold: 70,
    rainTrigger: "moderate",
    description: "Larva bores into stem, causes dead hearts",
    symptoms: ["Dead hearts", "White earheads", "Bore holes in stem", "Frass in tunnel"],
    prevention: ["Remove stubbles", "Early planting", "Avoid late transplanting", "Trichogramma release"],
    treatment: ["Cartap granules", "Carbofuran", "Chlorpyrifos spray"]
  },
  {
    id: "blast",
    name: "Rice Blast",
    icon: "🍂",
    category: "disease",
    criticalMonths: [6, 7, 8, 9, 10],
    tempRange: [20, 28],
    humidityThreshold: 90,
    rainTrigger: "continuous",
    description: "Fungal disease affecting leaves, nodes, panicles",
    symptoms: ["Diamond shaped lesions", "Node blast", "Neck rot", "White panicles"],
    prevention: ["Resistant varieties", "Balanced N fertilizer", "Proper spacing", "Seed treatment"],
    treatment: ["Tricyclazole", "Isoprothiolane", "Carbendazim spray"]
  },
  {
    id: "sheath_blight",
    name: "Sheath Blight",
    icon: "🟤",
    category: "disease",
    criticalMonths: [8, 9, 10],
    tempRange: [28, 32],
    humidityThreshold: 85,
    rainTrigger: "high_humidity",
    description: "Fungal infection of leaf sheath",
    symptoms: ["Oval lesions on sheath", "Gray-white center", "Lodging", "Reduced tillering"],
    prevention: ["Wider spacing", "Avoid excess N", "Proper drainage", "Clean bunds"],
    treatment: ["Hexaconazole", "Propiconazole", "Validamycin"]
  },
  {
    id: "gall_midge",
    name: "Gall Midge",
    icon: "🦟",
    category: "insect",
    criticalMonths: [7, 8, 9],
    tempRange: [25, 30],
    humidityThreshold: 80,
    rainTrigger: "after_rain",
    description: "Maggot feeds inside growing tiller",
    symptoms: ["Silver shoot (onion leaf)", "Stunted growth", "Reduced tillers", "No panicle"],
    prevention: ["Early transplanting", "Resistant varieties", "Avoid late planting", "Remove alternate hosts"],
    treatment: ["Carbofuran 3G", "Fipronil", "Phorate granules"]
  },
  {
    id: "bpb",
    name: "Bacterial Leaf Blight",
    icon: "🦠",
    category: "disease",
    criticalMonths: [7, 8, 9, 10],
    tempRange: [26, 34],
    humidityThreshold: 80,
    rainTrigger: "storm",
    description: "Bacterial infection causing leaf blight",
    symptoms: ["Water-soaked lesions", "Yellow to white stripes", "Wilting", "Kresek symptom"],
    prevention: ["Balanced fertilization", "Avoid wounds", "Resistant varieties", "Proper drainage"],
    treatment: ["Streptocycline", "Copper hydroxide", "No effective chemical - cultural control"]
  }
];

export default function PestForecast({ 
  temperature = 28,
  humidity = 75,
  rainfall = 5,
  growthStage = "tillering"
}) {
  const [selectedPest, setSelectedPest] = useState(null);
  const [riskLevels, setRiskLevels] = useState([]);
  
  // Calculate risk levels based on weather
  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    const calculated = PEST_DATABASE.map(pest => {
      let riskScore = 0;
      
      // Temperature factor (30%)
      if (temperature >= pest.tempRange[0] && temperature <= pest.tempRange[1]) {
        riskScore += 30;
        // Higher risk if in optimal middle range
        const midTemp = (pest.tempRange[0] + pest.tempRange[1]) / 2;
        if (Math.abs(temperature - midTemp) < 3) riskScore += 10;
      }
      
      // Humidity factor (30%)
      if (humidity >= pest.humidityThreshold) {
        riskScore += 30;
        if (humidity >= pest.humidityThreshold + 5) riskScore += 10;
      } else if (humidity >= pest.humidityThreshold - 10) {
        riskScore += 15;
      }
      
      // Season factor (20%)
      if (pest.criticalMonths.includes(currentMonth)) {
        riskScore += 20;
      }
      
      // Rainfall factor (20%)
      if (rainfall > 10 && pest.rainTrigger.includes("heavy")) riskScore += 20;
      else if (rainfall > 5 && pest.rainTrigger.includes("moderate")) riskScore += 15;
      else if (rainfall > 0 && pest.rainTrigger.includes("after")) riskScore += 10;
      
      const riskLevel = riskScore >= 70 ? "High" : riskScore >= 40 ? "Moderate" : "Low";
      
      return {
        ...pest,
        riskScore,
        riskLevel
      };
    });
    
    // Sort by risk score
    calculated.sort((a, b) => b.riskScore - a.riskScore);
    setRiskLevels(calculated);
  }, [temperature, humidity, rainfall]);
  
  const styles = {
    container: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      border: "1px solid rgba(34, 197, 94, 0.15)",
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
    weatherBadge: {
      display: "flex",
      gap: "16px",
      padding: "8px 16px",
      background: "#f0fdf4",
      borderRadius: "20px",
      fontSize: "0.85rem"
    },
    weatherItem: {
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    riskGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
      marginBottom: "20px"
    },
    riskCard: {
      padding: "14px",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "2px solid transparent"
    },
    riskHeader: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "8px"
    },
    riskIcon: {
      fontSize: "24px"
    },
    riskName: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#1f2937"
    },
    riskCategory: {
      fontSize: "0.7rem",
      padding: "2px 8px",
      borderRadius: "10px",
      textTransform: "uppercase",
      fontWeight: 600
    },
    riskBar: {
      height: "6px",
      borderRadius: "3px",
      background: "#e5e7eb",
      marginTop: "10px",
      overflow: "hidden"
    },
    riskFill: {
      height: "100%",
      borderRadius: "3px",
      transition: "width 0.5s ease"
    },
    detailPanel: {
      marginTop: "16px",
      padding: "20px",
      background: "#fef3c7",
      borderRadius: "12px",
      border: "1px solid #fcd34d"
    },
    detailHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px"
    },
    detailTitle: {
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    detailName: {
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#92400e"
    },
    closeBtn: {
      background: "transparent",
      border: "none",
      fontSize: "20px",
      cursor: "pointer",
      color: "#92400e"
    },
    section: {
      marginBottom: "16px"
    },
    sectionTitle: {
      fontSize: "0.85rem",
      fontWeight: 600,
      color: "#92400e",
      marginBottom: "8px"
    },
    symptomList: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px"
    },
    symptomTag: {
      padding: "4px 10px",
      background: "#fff",
      borderRadius: "6px",
      fontSize: "0.8rem",
      color: "#78350f"
    },
    actionGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px"
    },
    actionBox: {
      padding: "12px",
      borderRadius: "8px"
    },
    actionTitle: {
      fontSize: "0.8rem",
      fontWeight: 600,
      marginBottom: "8px"
    },
    actionList: {
      listStyle: "none",
      margin: 0,
      padding: 0
    },
    actionItem: {
      fontSize: "0.8rem",
      marginBottom: "4px",
      display: "flex",
      alignItems: "flex-start",
      gap: "6px"
    },
    alertBox: {
      padding: "14px 16px",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    alertText: {
      fontSize: "0.9rem",
      color: "#991b1b",
      fontWeight: 500
    }
  };
  
  const getRiskColor = (level) => {
    if (level === "High") return { bg: "#fef2f2", border: "#ef4444", fill: "#ef4444", text: "#991b1b" };
    if (level === "Moderate") return { bg: "#fef3c7", border: "#f59e0b", fill: "#f59e0b", text: "#92400e" };
    return { bg: "#f0fdf4", border: "#22c55e", fill: "#22c55e", text: "#166534" };
  };
  
  const getCategoryStyle = (category) => {
    if (category === "insect") return { bg: "#dbeafe", color: "#1e40af" };
    return { bg: "#fce7f3", color: "#9d174d" };
  };
  
  const highRiskPests = riskLevels.filter(p => p.riskLevel === "High");
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <span style={{ fontSize: "28px" }}>🐛</span>
          <div>
            <h3 style={styles.titleText}>Pest & Disease Forecast</h3>
            <p style={styles.subtitle}>AI-powered risk prediction for {growthStage} stage</p>
          </div>
        </div>
        
        <div style={styles.weatherBadge}>
          <div style={styles.weatherItem}>
            🌡️ {temperature}°C
          </div>
          <div style={styles.weatherItem}>
            💧 {humidity}%
          </div>
          <div style={styles.weatherItem}>
            🌧️ {rainfall}mm
          </div>
        </div>
      </div>
      
      {/* High Risk Alert */}
      {highRiskPests.length > 0 && (
        <div style={styles.alertBox}>
          <span style={{ fontSize: "24px" }}>⚠️</span>
          <span style={styles.alertText}>
            High risk alert: {highRiskPests.map(p => p.name).join(", ")} - Immediate monitoring recommended!
          </span>
        </div>
      )}
      
      {/* Risk Cards Grid */}
      <div style={{ ...styles.riskGrid, marginTop: highRiskPests.length > 0 ? "16px" : 0 }}>
        {riskLevels.map(pest => {
          const colors = getRiskColor(pest.riskLevel);
          const catStyle = getCategoryStyle(pest.category);
          const isSelected = selectedPest?.id === pest.id;
          
          return (
            <div
              key={pest.id}
              style={{
                ...styles.riskCard,
                background: colors.bg,
                borderColor: isSelected ? colors.border : "transparent",
                transform: isSelected ? "scale(1.02)" : "scale(1)"
              }}
              onClick={() => setSelectedPest(isSelected ? null : pest)}
            >
              <div style={styles.riskHeader}>
                <span style={styles.riskIcon}>{pest.icon}</span>
                <div>
                  <div style={styles.riskName}>{pest.name}</div>
                  <span style={{
                    ...styles.riskCategory,
                    background: catStyle.bg,
                    color: catStyle.color
                  }}>
                    {pest.category}
                  </span>
                </div>
              </div>
              
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginTop: "8px"
              }}>
                <span style={{ 
                  fontSize: "0.85rem", 
                  fontWeight: 600, 
                  color: colors.text 
                }}>
                  {pest.riskLevel} Risk
                </span>
                <span style={{ 
                  fontSize: "0.8rem", 
                  color: "#6b7280" 
                }}>
                  {pest.riskScore}%
                </span>
              </div>
              
              <div style={styles.riskBar}>
                <div style={{
                  ...styles.riskFill,
                  background: colors.fill,
                  width: `${pest.riskScore}%`
                }} />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Detail Panel */}
      {selectedPest && (
        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <div style={styles.detailTitle}>
              <span style={{ fontSize: "28px" }}>{selectedPest.icon}</span>
              <span style={styles.detailName}>{selectedPest.name}</span>
            </div>
            <button 
              style={styles.closeBtn}
              onClick={() => setSelectedPest(null)}
            >
              ✕
            </button>
          </div>
          
          <p style={{ fontSize: "0.9rem", color: "#78350f", marginBottom: "16px" }}>
            {selectedPest.description}
          </p>
          
          <div style={styles.section}>
            <div style={styles.sectionTitle}>🔍 Symptoms to Watch</div>
            <div style={styles.symptomList}>
              {selectedPest.symptoms.map((symptom, i) => (
                <span key={i} style={styles.symptomTag}>{symptom}</span>
              ))}
            </div>
          </div>
          
          <div style={styles.actionGrid}>
            <div style={{ ...styles.actionBox, background: "#d1fae5" }}>
              <div style={{ ...styles.actionTitle, color: "#166534" }}>🛡️ Prevention</div>
              <ul style={styles.actionList}>
                {selectedPest.prevention.map((item, i) => (
                  <li key={i} style={styles.actionItem}>
                    <span>✅</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div style={{ ...styles.actionBox, background: "#fee2e2" }}>
              <div style={{ ...styles.actionTitle, color: "#991b1b" }}>💊 Treatment</div>
              <ul style={styles.actionList}>
                {selectedPest.treatment.map((item, i) => (
                  <li key={i} style={styles.actionItem}>
                    <span>💉</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
