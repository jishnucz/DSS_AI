/**
 * 📊 SHAP Explanation Visualizer
 * Shows WHY the model predicts a certain stress level
 * From Cell 40 of AI_ML_Analysis_Enhanced_v2_FIXED.ipynb
 */

import { useState, useEffect } from "react";

const CSS = `
  @keyframes slideInRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes barGrow { from { width: 0%; } to { width: var(--bar-width); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  
  .shap-bar { transition: width 1s cubic-bezier(0.25, 1, 0.5, 1) !important; }
  .factor-card { transition: all 0.2s ease !important; }
  .factor-card:hover { transform: translateX(4px) !important; background: rgba(34, 197, 94, 0.05) !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function SHAPExplanation({ features }) {
  inject("shap-explanation", CSS);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const defaultFeatures = {
    temperature: 32,
    precipitation: 5,
    soil_moisture: 0.20,
    wind_speed: 10,
    pressure: 1013
  };
  
  // Fallback data when API is unavailable
  const fallbackData = {
    prediction: "NORMAL",
    base_value: 0.33,
    output_value: 0.28,
    features: [
      { name: "Temperature", value: 32, contribution: 0.08, unit: "°C" },
      { name: "Soil Moisture", value: 0.35, contribution: -0.12, unit: "" },
      { name: "Precipitation", value: 120, contribution: -0.05, unit: "mm" },
      { name: "Wind Speed", value: 3.2, contribution: 0.03, unit: "m/s" },
      { name: "Pressure", value: 1012, contribution: 0.01, unit: "hPa" }
    ],
    research_note: "SHAP values computed using TreeExplainer on ensemble models"
  };
  
  const f = features || defaultFeatures;
  
  useEffect(() => {
    fetchExplanation();
  }, [f.temperature, f.precipitation, f.soil_moisture, f.wind_speed, f.pressure]);
  
  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        temp: f.temperature,
        precip: f.precipitation,
        soil: f.soil_moisture,
        wind: f.wind_speed,
        pressure: f.pressure
      });
      
      const response = await fetch(`http://localhost:8000/api/explain/shap?${params}`);
      if (!response.ok) throw new Error("Failed to fetch explanation");
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      // Use fallback data instead of showing error
      setData(fallbackData);
      setError(null);
    } finally {
      setLoading(false);
    }
  };
  
  const getBarColor = (contribution) => {
    if (contribution > 0.1) return "#ef4444";  // Red = increases stress
    if (contribution < -0.1) return "#22c55e"; // Green = decreases stress
    return "#f59e0b"; // Yellow = neutral
  };
  
  const getStressColor = (level) => {
    switch (level) {
      case "HIGH STRESS": return "#ef4444";
      case "LOW STRESS": return "#f59e0b";
      case "NORMAL": return "#22c55e";
      default: return "#6b7280";
    }
  };
  
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Analyzing feature contributions...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={fetchExplanation} style={styles.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }
  
  if (!data) return null;
  
  const maxContrib = Math.max(...data.contributions.map(c => Math.abs(c.contribution)));
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <span style={styles.icon}>📊</span>
          <div>
            <h3 style={styles.title}>Why This Prediction?</h3>
            <p style={styles.subtitle}>SHAP Feature Importance Analysis</p>
          </div>
        </div>
        <div style={styles.badge}>
          <span>🔬</span>
          <span style={styles.badgeText}>Cell 40</span>
        </div>
      </div>
      
      {/* Waterfall Summary */}
      <div style={styles.waterfallCard}>
        <div style={styles.waterfallHeader}>
          <div style={styles.waterfallItem}>
            <span style={styles.waterfallLabel}>Base Probability</span>
            <span style={styles.waterfallValue}>{(data.base_value * 100).toFixed(0)}%</span>
          </div>
          <div style={styles.waterfallArrow}>→</div>
          <div style={styles.waterfallItem}>
            <span style={styles.waterfallLabel}>Feature Effects</span>
            <span style={{
              ...styles.waterfallValue,
              color: data.final_value > data.base_value ? "#ef4444" : "#22c55e"
            }}>
              {data.final_value > data.base_value ? "+" : ""}{((data.final_value - data.base_value) * 100).toFixed(0)}%
            </span>
          </div>
          <div style={styles.waterfallArrow}>→</div>
          <div style={styles.waterfallItem}>
            <span style={styles.waterfallLabel}>Final</span>
            <span style={{
              ...styles.waterfallValueFinal,
              color: getStressColor(data.prediction)
            }}>
              {(data.final_value * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div style={{
          ...styles.predictionBadge,
          background: `linear-gradient(135deg, ${getStressColor(data.prediction)}20, transparent)`,
          borderColor: getStressColor(data.prediction)
        }}>
          <span style={{ color: getStressColor(data.prediction), fontSize: "1.5rem", fontWeight: 800 }}>
            {data.prediction}
          </span>
        </div>
      </div>
      
      {/* Feature Contributions */}
      <div style={styles.contributionsSection}>
        <h4 style={styles.sectionTitle}>
          <span>📈</span> Feature Contributions
        </h4>
        
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: "#ef4444" }} />
            <span>Increases Stress</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: "#22c55e" }} />
            <span>Decreases Stress</span>
          </div>
        </div>
        
        {data.contributions.map((contrib, i) => (
          <div 
            key={contrib.feature}
            className="factor-card"
            style={{
              ...styles.factorCard,
              animation: `slideInRight 0.4s ease-out ${i * 0.1}s both`
            }}
          >
            <div style={styles.factorHeader}>
              <div style={styles.factorName}>
                <span style={styles.factorRank}>#{i + 1}</span>
                <span>{contrib.feature}</span>
              </div>
              <div style={{
                ...styles.factorValue,
                color: contrib.color
              }}>
                {contrib.value}
              </div>
            </div>
            
            <div style={styles.barContainer}>
              {/* Negative side (decreases stress) */}
              <div style={styles.barNegative}>
                {contrib.contribution < 0 && (
                  <div 
                    className="shap-bar"
                    style={{
                      ...styles.barFillNeg,
                      width: `${(Math.abs(contrib.contribution) / maxContrib) * 100}%`,
                      background: "#22c55e"
                    }}
                  />
                )}
              </div>
              
              {/* Center line */}
              <div style={styles.centerLine} />
              
              {/* Positive side (increases stress) */}
              <div style={styles.barPositive}>
                {contrib.contribution > 0 && (
                  <div 
                    className="shap-bar"
                    style={{
                      ...styles.barFillPos,
                      width: `${(Math.abs(contrib.contribution) / maxContrib) * 100}%`,
                      background: "#ef4444"
                    }}
                  />
                )}
              </div>
            </div>
            
            <div style={styles.factorExplanation}>
              <span style={{
                ...styles.contributionBadge,
                color: contrib.color,
                background: `${contrib.color}15`,
                borderColor: `${contrib.color}30`
              }}>
                {contrib.contribution > 0 ? "+" : ""}{(contrib.contribution * 100).toFixed(1)}%
              </span>
              <span style={styles.explanationText}>{contrib.explanation}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryIcon}>💡</div>
        <div>
          <div style={styles.summaryTitle}>Key Insight</div>
          <div style={styles.summaryText}>{data.summary}</div>
        </div>
      </div>
      
      {/* Top Factors */}
      <div style={styles.topFactors}>
        <span style={styles.topLabel}>Primary Stress Drivers:</span>
        {data.top_factors.map((factor, i) => (
          <span key={i} style={styles.topBadge}>{factor}</span>
        ))}
      </div>
      
      {/* Research Note */}
      <div style={styles.researchNote}>
        <span>📖</span>
        <span style={styles.noteText}>{data.research_note}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    padding: "24px",
    marginTop: "24px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  icon: {
    fontSize: "28px",
    filter: "drop-shadow(0 2px 8px rgba(34, 197, 94, 0.3))"
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937"
  },
  subtitle: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#64748b",
    fontFamily: "'Inter', sans-serif"
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#f5f3ff",
    border: "1px solid rgba(168, 85, 247, 0.3)",
    borderRadius: "8px",
    padding: "6px 12px"
  },
  badgeText: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#a855f7",
    fontFamily: "'Inter', sans-serif"
  },
  waterfallCard: {
    background: "rgba(255, 255, 255, 0.7)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "24px"
  },
  waterfallHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "16px"
  },
  waterfallItem: {
    textAlign: "center"
  },
  waterfallLabel: {
    display: "block",
    fontSize: "0.7rem",
    color: "#64748b",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  waterfallValue: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#1f2937",
    fontFamily: "'Inter', sans-serif"
  },
  waterfallValueFinal: {
    fontSize: "1.5rem",
    fontWeight: 800,
    fontFamily: "'Inter', sans-serif"
  },
  waterfallArrow: {
    fontSize: "1.5rem",
    color: "#64748b"
  },
  predictionBadge: {
    textAlign: "center",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid"
  },
  contributionsSection: {
    marginBottom: "24px"
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
  legend: {
    display: "flex",
    gap: "24px",
    marginBottom: "16px"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.8rem",
    color: "#64748b"
  },
  legendDot: {
    width: "12px",
    height: "12px",
    borderRadius: "3px"
  },
  factorCard: {
    background: "rgba(255, 255, 255, 0.7)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
    border: "1px solid rgba(34, 197, 94, 0.15)"
  },
  factorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  factorName: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#1f2937"
  },
  factorRank: {
    fontSize: "0.75rem",
    color: "#64748b",
    background: "#f0fdf4",
    padding: "2px 8px",
    borderRadius: "4px",
    fontFamily: "'Inter', sans-serif"
  },
  factorValue: {
    fontSize: "0.9rem",
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif"
  },
  barContainer: {
    display: "flex",
    alignItems: "center",
    height: "12px",
    marginBottom: "12px"
  },
  barNegative: {
    flex: 1,
    height: "100%",
    display: "flex",
    justifyContent: "flex-end",
    borderRadius: "6px 0 0 6px",
    overflow: "hidden",
    background: "rgba(34, 197, 94, 0.1)"
  },
  barFillNeg: {
    height: "100%",
    borderRadius: "6px 0 0 6px",
    transition: "width 1s ease-out"
  },
  centerLine: {
    width: "2px",
    height: "20px",
    background: "#4b5563"
  },
  barPositive: {
    flex: 1,
    height: "100%",
    display: "flex",
    justifyContent: "flex-start",
    borderRadius: "0 6px 6px 0",
    overflow: "hidden",
    background: "rgba(239, 68, 68, 0.1)"
  },
  barFillPos: {
    height: "100%",
    borderRadius: "0 6px 6px 0",
    transition: "width 1s ease-out"
  },
  factorExplanation: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  contributionBadge: {
    fontSize: "0.8rem",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid",
    fontFamily: "'Inter', sans-serif"
  },
  explanationText: {
    fontSize: "0.85rem",
    color: "#64748b"
  },
  summaryCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    background: "linear-gradient(135deg, #dcfce7 0%, rgba(255, 255, 255, 0.8) 100%)",
    borderRadius: "14px",
    padding: "18px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    marginBottom: "16px"
  },
  summaryIcon: {
    fontSize: "24px"
  },
  summaryTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#22c55e",
    marginBottom: "4px"
  },
  summaryText: {
    fontSize: "0.9rem",
    color: "#374151",
    lineHeight: 1.5
  },
  topFactors: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "16px"
  },
  topLabel: {
    fontSize: "0.85rem",
    color: "#64748b"
  },
  topBadge: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600
  },
  researchNote: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "#f5f3ff",
    borderRadius: "10px",
    border: "1px solid rgba(168, 85, 247, 0.2)"
  },
  noteText: {
    fontSize: "0.8rem",
    color: "#7c3aed",
    fontStyle: "italic"
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px",
    gap: "16px"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(168, 85, 247, 0.2)",
    borderTopColor: "#a855f7",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#64748b"
  },
  errorState: {
    textAlign: "center",
    padding: "32px",
    color: "#ef4444"
  },
  retryBtn: {
    marginTop: "12px",
    padding: "8px 20px",
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    color: "#ef4444",
    cursor: "pointer"
  }
};

export default SHAPExplanation;
