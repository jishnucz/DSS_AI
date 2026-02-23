/**
 * 🌡️ Climate Projections Scenario Planner
 * Visualizes future climate scenarios and crop suitability
 * Based on research Cell 47+ climate analysis
 */

import { useState, useEffect } from "react";

const CSS = `
  @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); } 50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); } }
  @keyframes tempRise { from { height: 0%; } to { height: var(--temp-height); } }
  
  .year-btn { transition: all 0.2s ease !important; }
  .year-btn:hover { transform: translateY(-2px) !important; }
  
  .scenario-card { transition: all 0.3s ease !important; }
  .scenario-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 40px rgba(34, 197, 94, 0.2) !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function ClimateProjections({ selectedTaluk = "Central" }) {
  inject("climate-projections", CSS);
  
  const [selectedYear, setSelectedYear] = useState(2030);
  const [selectedScenario, setSelectedScenario] = useState("moderate");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const years = [2030, 2040, 2050];
  
  const scenarios = {
    optimistic: { label: "Optimistic", icon: "🌱", color: "#22c55e", tempIncrease: 0.5 },
    moderate: { label: "Moderate", icon: "⚖️", color: "#f59e0b", tempIncrease: 1.5 },
    pessimistic: { label: "Pessimistic", icon: "🔥", color: "#ef4444", tempIncrease: 3.0 }
  };
  
  // Projected data based on research
  const projections = {
    2030: {
      optimistic: { 
        tempChange: +0.5, rainfall: +3, 
        crops: { rice: "High", coconut: "High", rubber: "High", banana: "High" },
        risks: ["Minor heat stress during summer"],
        opportunities: ["Extended growing season"]
      },
      moderate: { 
        tempChange: +0.8, rainfall: -2, 
        crops: { rice: "High", coconut: "High", rubber: "Medium", banana: "High" },
        risks: ["Moderate heat stress", "Slight rainfall variability"],
        opportunities: ["New crop varieties viable"]
      },
      pessimistic: { 
        tempChange: +1.2, rainfall: -8, 
        crops: { rice: "Medium", coconut: "High", rubber: "Medium", banana: "Medium" },
        risks: ["Heat waves", "Water stress", "Pest increase"],
        opportunities: ["Heat-tolerant varieties needed"]
      }
    },
    2040: {
      optimistic: { 
        tempChange: +0.9, rainfall: +5, 
        crops: { rice: "High", coconut: "High", rubber: "High", banana: "High" },
        risks: ["Sporadic heat events"],
        opportunities: ["Improved soil carbon", "Diversification potential"]
      },
      moderate: { 
        tempChange: +1.5, rainfall: -5, 
        crops: { rice: "Medium", coconut: "High", rubber: "Medium", banana: "Medium" },
        risks: ["Water scarcity", "Modified monsoon", "New pests"],
        opportunities: ["Irrigation optimization", "Climate-resilient varieties"]
      },
      pessimistic: { 
        tempChange: +2.3, rainfall: -15, 
        crops: { rice: "Low", coconut: "Medium", rubber: "Low", banana: "Medium" },
        risks: ["Severe drought", "Failed monsoons", "Crop failures"],
        opportunities: ["Emergency planning required", "Shift to drought-resistant"]
      }
    },
    2050: {
      optimistic: { 
        tempChange: +1.2, rainfall: +8, 
        crops: { rice: "High", coconut: "High", rubber: "Medium", banana: "High" },
        risks: ["Moderate climate variability"],
        opportunities: ["Sustainable agriculture model", "Carbon sequestration"]
      },
      moderate: { 
        tempChange: +2.1, rainfall: -10, 
        crops: { rice: "Medium", coconut: "Medium", rubber: "Low", banana: "Medium" },
        risks: ["Significant water stress", "Shortened seasons", "Extreme events"],
        opportunities: ["Precision agriculture", "Water harvesting critical"]
      },
      pessimistic: { 
        tempChange: +3.5, rainfall: -25, 
        crops: { rice: "Low", coconut: "Low", rubber: "Very Low", banana: "Low" },
        risks: ["Agricultural crisis", "Mass migration", "Food insecurity"],
        opportunities: ["Complete transformation required", "Alternative livelihoods"]
      }
    }
  };
  
  const currentProjection = projections[selectedYear][selectedScenario];
  
  const getSuitabilityColor = (level) => {
    const colors = {
      "Very Low": "#ef4444",
      "Low": "#f97316",
      "Medium": "#f59e0b",
      "High": "#22c55e"
    };
    return colors[level] || "#6b7280";
  };
  
  const getSuitabilityWidth = (level) => {
    const widths = {
      "Very Low": 20,
      "Low": 40,
      "Medium": 65,
      "High": 90
    };
    return widths[level] || 50;
  };
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.headerIcon}>🌡️</span>
          <div>
            <h2 style={styles.headerTitle}>Climate Projections</h2>
            <p style={styles.headerSubtitle}>
              IPCC-based scenarios for {selectedTaluk}
            </p>
          </div>
        </div>
      </div>
      
      {/* Year Selector */}
      <div style={styles.yearSelector}>
        <span style={styles.selectorLabel}>Projection Year:</span>
        <div style={styles.yearButtons}>
          {years.map((year) => (
            <button
              key={year}
              className="year-btn"
              onClick={() => setSelectedYear(year)}
              style={{
                ...styles.yearBtn,
                ...(selectedYear === year ? styles.yearBtnActive : {})
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
      
      {/* Scenario Cards */}
      <div style={styles.scenarioGrid}>
        {Object.entries(scenarios).map(([key, scenario]) => (
          <div
            key={key}
            className="scenario-card"
            onClick={() => setSelectedScenario(key)}
            style={{
              ...styles.scenarioCard,
              borderColor: selectedScenario === key ? scenario.color : "transparent",
              background: selectedScenario === key 
                ? `linear-gradient(135deg, ${scenario.color}15, ${scenario.color}05)`
                : "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)"
            }}
          >
            <span style={styles.scenarioIcon}>{scenario.icon}</span>
            <span style={{ 
              ...styles.scenarioLabel,
              color: selectedScenario === key ? scenario.color : "#9ca3af"
            }}>
              {scenario.label}
            </span>
            <span style={styles.scenarioTemp}>
              +{scenario.tempIncrease}°C
            </span>
          </div>
        ))}
      </div>
      
      {/* Projection Details */}
      <div style={styles.projectionDetails}>
        {/* Temperature & Rainfall Changes */}
        <div style={styles.changesRow}>
          <div style={styles.changeCard}>
            <div style={styles.changeIcon}>🌡️</div>
            <div style={styles.changeValue}>
              <span style={{
                color: currentProjection.tempChange > 2 ? "#ef4444" : 
                       currentProjection.tempChange > 1 ? "#f59e0b" : "#22c55e"
              }}>
                +{currentProjection.tempChange}°C
              </span>
            </div>
            <div style={styles.changeLabel}>Temperature Change</div>
            <div style={styles.changeBar}>
              <div style={{
                ...styles.changeBarFill,
                width: `${Math.min(currentProjection.tempChange / 4 * 100, 100)}%`,
                background: currentProjection.tempChange > 2 ? "#ef4444" : 
                           currentProjection.tempChange > 1 ? "#f59e0b" : "#22c55e"
              }} />
            </div>
          </div>
          
          <div style={styles.changeCard}>
            <div style={styles.changeIcon}>💧</div>
            <div style={styles.changeValue}>
              <span style={{
                color: currentProjection.rainfall < -10 ? "#ef4444" : 
                       currentProjection.rainfall < 0 ? "#f59e0b" : "#22c55e"
              }}>
                {currentProjection.rainfall > 0 ? "+" : ""}{currentProjection.rainfall}%
              </span>
            </div>
            <div style={styles.changeLabel}>Rainfall Change</div>
            <div style={styles.changeBar}>
              <div style={{
                ...styles.changeBarFill,
                width: `${50 + (currentProjection.rainfall / 50 * 50)}%`,
                background: currentProjection.rainfall < -10 ? "#ef4444" : 
                           currentProjection.rainfall < 0 ? "#f59e0b" : "#22c55e"
              }} />
            </div>
          </div>
        </div>
        
        {/* Crop Suitability */}
        <div style={styles.cropSection}>
          <h4 style={styles.sectionTitle}>
            <span>🌾</span>
            Projected Crop Suitability
          </h4>
          <div style={styles.cropGrid}>
            {Object.entries(currentProjection.crops).map(([crop, suitability], i) => (
              <div 
                key={crop}
                style={{
                  ...styles.cropRow,
                  animation: `slideIn 0.3s ease-out ${i * 0.1}s both`
                }}
              >
                <span style={styles.cropName}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</span>
                <div style={styles.cropBarContainer}>
                  <div style={{
                    ...styles.cropBar,
                    width: `${getSuitabilityWidth(suitability)}%`,
                    background: getSuitabilityColor(suitability)
                  }} />
                </div>
                <span style={{
                  ...styles.cropSuitability,
                  color: getSuitabilityColor(suitability)
                }}>
                  {suitability}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Risks & Opportunities */}
        <div style={styles.riskOpportunityGrid}>
          <div style={styles.riskCard}>
            <h4 style={styles.riskTitle}>
              <span>⚠️</span>
              Climate Risks
            </h4>
            <ul style={styles.riskList}>
              {currentProjection.risks.map((risk, i) => (
                <li key={i} style={styles.riskItem}>
                  <span style={styles.riskDot}>•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
          
          <div style={styles.opportunityCard}>
            <h4 style={styles.opportunityTitle}>
              <span>💡</span>
              Opportunities
            </h4>
            <ul style={styles.opportunityList}>
              {currentProjection.opportunities.map((opp, i) => (
                <li key={i} style={styles.opportunityItem}>
                  <span style={styles.oppDot}>✓</span>
                  {opp}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Timeline Visualization */}
      <div style={styles.timeline}>
        <div style={styles.timelineHeader}>Future Climate Timeline</div>
        <div style={styles.timelineLine}>
          <div style={styles.timelineNow}>
            <span style={styles.timelineDot} />
            <span style={styles.timelineYear}>2024</span>
            <span style={styles.timelineLabel}>Now</span>
          </div>
          {years.map((year, i) => (
            <div 
              key={year}
              style={{
                ...styles.timelinePoint,
                left: `${25 + i * 25}%`
              }}
            >
              <span style={{
                ...styles.timelineDot,
                background: selectedYear === year 
                  ? scenarios[selectedScenario].color 
                  : "#6b7280",
                transform: selectedYear === year ? "scale(1.5)" : "scale(1)"
              }} />
              <span style={{
                ...styles.timelineYear,
                color: selectedYear === year ? "#1f2937" : "#9ca3af",
                fontWeight: selectedYear === year ? 800 : 700
              }}>{year}</span>
              <span style={styles.timelineLabel}>
                +{projections[year][selectedScenario].tempChange}°C
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer Note */}
      <div style={styles.footer}>
        <span>📊</span>
        <span>
          Based on IPCC AR6 scenarios and local climate model downscaling
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(59, 130, 246, 0.15)"
  },
  header: {
    marginBottom: "24px"
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  headerIcon: {
    fontSize: "40px"
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#64748b"
  },
  yearSelector: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px"
  },
  selectorLabel: {
    fontSize: "0.9rem",
    color: "#64748b",
    fontWeight: 500
  },
  yearButtons: {
    display: "flex",
    gap: "8px"
  },
  yearBtn: {
    padding: "10px 24px",
    background: "#f0fdf4",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "10px",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  yearBtnActive: {
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    borderColor: "transparent",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)"
  },
  scenarioGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "28px"
  },
  scenarioCard: {
    padding: "20px",
    borderRadius: "16px",
    border: "2px solid",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s"
  },
  scenarioIcon: {
    fontSize: "32px",
    display: "block",
    marginBottom: "8px"
  },
  scenarioLabel: {
    display: "block",
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "4px"
  },
  scenarioTemp: {
    fontSize: "0.85rem",
    color: "#64748b"
  },
  projectionDetails: {},
  changesRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    marginBottom: "28px"
  },
  changeCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    borderRadius: "16px",
    padding: "24px",
    textAlign: "center"
  },
  changeIcon: {
    fontSize: "32px",
    marginBottom: "8px"
  },
  changeValue: {
    fontSize: "2rem",
    fontWeight: 800,
    marginBottom: "4px"
  },
  changeLabel: {
    fontSize: "0.85rem",
    color: "#64748b",
    marginBottom: "12px"
  },
  changeBar: {
    height: "8px",
    background: "#f0fdf4",
    borderRadius: "4px",
    overflow: "hidden"
  },
  changeBarFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.5s ease-out"
  },
  cropSection: {
    marginBottom: "28px"
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "16px"
  },
  cropGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  cropRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  cropName: {
    width: "100px",
    fontSize: "0.9rem",
    color: "#374151",
    fontWeight: 500
  },
  cropBarContainer: {
    flex: 1,
    height: "12px",
    background: "#f0fdf4",
    borderRadius: "6px",
    overflow: "hidden"
  },
  cropBar: {
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.5s ease-out"
  },
  cropSuitability: {
    width: "80px",
    textAlign: "right",
    fontSize: "0.85rem",
    fontWeight: 600
  },
  riskOpportunityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    marginBottom: "28px"
  },
  riskCard: {
    background: "rgba(239, 68, 68, 0.1)",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid rgba(239, 68, 68, 0.2)"
  },
  riskTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#dc2626",
    margin: "0 0 12px 0"
  },
  riskList: {
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  riskItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "0.85rem",
    color: "#ef4444",
    marginBottom: "8px"
  },
  riskDot: {
    color: "#ef4444"
  },
  opportunityCard: {
    background: "rgba(34, 197, 94, 0.1)",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid rgba(34, 197, 94, 0.2)"
  },
  opportunityTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#16a34a",
    margin: "0 0 12px 0"
  },
  opportunityList: {
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  opportunityItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "0.85rem",
    color: "#22c55e",
    marginBottom: "8px"
  },
  oppDot: {
    color: "#22c55e"
  },
  timeline: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    borderRadius: "16px",
    padding: "32px 24px",
    marginBottom: "20px",
    marginTop: "20px"
  },
  timelineHeader: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1f2937",
    textAlign: "center",
    marginBottom: "48px"
  },
  timelineLine: {
    position: "relative",
    height: "8px",
    background: "linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)",
    borderRadius: "4px",
    marginTop: "48px",
    marginBottom: "48px"
  },
  timelineNow: {
    position: "absolute",
    left: 0,
    top: "-40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
  },
  timelinePoint: {
    position: "absolute",
    top: "-40px",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
  },
  timelineDot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#6b7280",
    transition: "all 0.3s",
    border: "3px solid #ffffff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  timelineYear: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1f2937"
  },
  timelineLabel: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontWeight: 500
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "16px",
    background: "#eff6ff",
    borderRadius: "12px",
    fontSize: "0.85rem",
    color: "#3b82f6"
  }
};

export default ClimateProjections;
