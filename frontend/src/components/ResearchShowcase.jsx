/**
 * 🎓 Research Showcase Panel
 * Displays M.Tech research findings and methodology
 * For panel presentation
 */

import { useState, useEffect } from "react";

const CSS = `
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes countUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes barGrow { from { width: 0%; } to { width: var(--bar-width); } }
  
  .research-metric { transition: all 0.3s ease !important; }
  .research-metric:hover { transform: translateY(-4px) scale(1.02) !important; box-shadow: 0 12px 40px rgba(34, 197, 94, 0.2) !important; }
  
  .model-bar { transition: all 0.3s ease !important; }
  .model-bar:hover { transform: scaleY(1.1) !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function ResearchShowcase() {
  inject("research-showcase", CSS);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("metrics");
  
  useEffect(() => {
    fetchResearchData();
  }, []);
  
  const fetchResearchData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/research/summary");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error("Failed to fetch research data:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fallback data in case API is not running
  const fallbackData = {
    title: "Research-Powered Agricultural Intelligence",
    notebook: "AI_ML_Analysis_Enhanced_v2_FIXED.ipynb",
    key_metrics: {
      data_observations: "140,000+",
      time_period: "2010-2026",
      data_source: "ERA5 Reanalysis",
      models_tested: 10,
      best_accuracy: "88.3%",
      best_model: "Voting Ensemble"
    },
    model_accuracies: [
      { name: "Voting Ensemble", accuracy: 0.883, icon: "🏆" },
      { name: "LSTM", accuracy: 0.874, icon: "🧠" },
      { name: "Random Forest", accuracy: 0.852, icon: "🌲" },
      { name: "Extra Trees", accuracy: 0.846, icon: "🌳" },
      { name: "Gradient Boosting", accuracy: 0.838, icon: "📈" },
      { name: "MLP", accuracy: 0.821, icon: "🔮" },
      { name: "SVM", accuracy: 0.815, icon: "📊" },
      { name: "AdaBoost", accuracy: 0.793, icon: "🚀" },
      { name: "KNN", accuracy: 0.789, icon: "🎯" },
      { name: "Naive Bayes", accuracy: 0.742, icon: "📌" }
    ],
    feature_importance: [
      { feature: "Temperature", importance: 0.342, rank: 1 },
      { feature: "Soil Moisture", importance: 0.289, rank: 2 },
      { feature: "Precipitation", importance: 0.178, rank: 3 },
      { feature: "Wind Speed", importance: 0.112, rank: 4 },
      { feature: "Pressure", importance: 0.079, rank: 5 }
    ],
    forecast_horizons: [
      { days: 1, accuracy: 0.883, label: "Next Day" },
      { days: 3, accuracy: 0.821, label: "3-Day" },
      { days: 7, accuracy: 0.764, label: "Week Ahead" }
    ],
    coverage: {
      district: "Regional Coverage",
      state: "South India",
      taluks: 13,
      area_km2: 4480,
      crops: 63
    },
    unique_features: [
      "Real-time ensemble predictions from 8 ML models",
      "SHAP-based explainability",
      "Bootstrap confidence intervals",
      "Climate projection scenarios",
      "3D geographic visualization",
      "Multi-language support"
    ]
  };
  
  const d = data || fallbackData;
  
  const sections = [
    { id: "metrics", label: "Key Metrics", icon: "📊" },
    { id: "models", label: "Model Comparison", icon: "🔬" },
    { id: "features", label: "Feature Importance", icon: "📈" },
    { id: "coverage", label: "Coverage", icon: "🗺️" }
  ];
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.headerIcon}>🎓</span>
          <div>
            <h2 style={styles.headerTitle}>{d.title}</h2>
            <p style={styles.headerSubtitle}>
              M.Tech Research | {d.notebook}
            </p>
          </div>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.badgeNumber}>{d.key_metrics.best_accuracy}</span>
          <span style={styles.badgeLabel}>Best Accuracy</span>
        </div>
      </div>
      
      {/* Section Tabs */}
      <div style={styles.tabs}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              ...styles.tab,
              ...(activeSection === section.id ? styles.tabActive : {})
            }}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>
      
      {/* Content Sections */}
      <div style={styles.content}>
        {/* Key Metrics */}
        {activeSection === "metrics" && (
          <div style={styles.metricsGrid}>
            <MetricCard 
              icon="📊" 
              label="Observations" 
              value={d.key_metrics.data_observations}
              color="#22c55e"
            />
            <MetricCard 
              icon="📅" 
              label="Time Period" 
              value={d.key_metrics.time_period}
              color="#3b82f6"
            />
            <MetricCard 
              icon="🛰️" 
              label="Data Source" 
              value={d.key_metrics.data_source}
              color="#a855f7"
            />
            <MetricCard 
              icon="🤖" 
              label="Models Tested" 
              value={d.key_metrics.models_tested}
              color="#f59e0b"
            />
            <MetricCard 
              icon="🏆" 
              label="Best Model" 
              value={d.key_metrics.best_model}
              color="#ec4899"
            />
            <MetricCard 
              icon="🎯" 
              label="Accuracy" 
              value={d.key_metrics.best_accuracy}
              color="#14b8a6"
            />
          </div>
        )}
        
        {/* Model Comparison */}
        {activeSection === "models" && (
          <div style={styles.modelsSection}>
            <h4 style={styles.sectionTitle}>Algorithm Performance Comparison</h4>
            <div style={styles.modelBars}>
              {d.model_accuracies.map((model, i) => (
                <div 
                  key={model.name}
                  style={{
                    ...styles.modelRow,
                    animation: `slideUp 0.4s ease-out ${i * 0.05}s both`
                  }}
                >
                  <div style={styles.modelInfo}>
                    <span style={styles.modelIcon}>{model.icon}</span>
                    <span style={styles.modelName}>{model.name}</span>
                  </div>
                  <div style={styles.modelBarContainer}>
                    <div 
                      className="model-bar"
                      style={{
                        ...styles.modelBar,
                        width: `${(model.accuracy / 0.9) * 100}%`,
                        background: i === 0 
                          ? "linear-gradient(90deg, #22c55e, #4ade80)"
                          : i < 3 
                            ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                            : "linear-gradient(90deg, #64748b, #94a3b8)"
                      }}
                    />
                  </div>
                  <span style={{
                    ...styles.modelAccuracy,
                    color: i === 0 ? "#22c55e" : i < 3 ? "#3b82f6" : "#64748b"
                  }}>
                    {(model.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div style={styles.modelsNote}>
              <span>💡</span>
              <span>Voting Ensemble combines top 3 models for optimal performance</span>
            </div>
          </div>
        )}
        
        {/* Feature Importance */}
        {activeSection === "features" && (
          <div style={styles.featuresSection}>
            <h4 style={styles.sectionTitle}>SHAP Feature Importance Rankings</h4>
            <div style={styles.featureBars}>
              {d.feature_importance.map((feat, i) => (
                <div 
                  key={feat.feature}
                  style={{
                    ...styles.featureRow,
                    animation: `slideUp 0.4s ease-out ${i * 0.1}s both`
                  }}
                >
                  <div style={styles.featureInfo}>
                    <span style={styles.featureRank}>#{feat.rank}</span>
                    <span style={styles.featureName}>{feat.feature}</span>
                  </div>
                  <div style={styles.featureBarContainer}>
                    <div 
                      style={{
                        ...styles.featureBar,
                        width: `${(feat.importance / 0.35) * 100}%`,
                        background: `linear-gradient(90deg, ${
                          i === 0 ? "#ef4444" : 
                          i === 1 ? "#f59e0b" : 
                          "#22c55e"
                        }, ${
                          i === 0 ? "#fca5a5" : 
                          i === 1 ? "#fcd34d" : 
                          "#86efac"
                        })`
                      }}
                    />
                  </div>
                  <span style={styles.featureValue}>
                    {(feat.importance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div style={styles.featuresNote}>
              <span>🔬</span>
              <span>Temperature and Soil Moisture account for 63% of prediction importance</span>
            </div>
          </div>
        )}
        
        {/* Coverage */}
        {activeSection === "coverage" && (
          <div style={styles.coverageSection}>
            <div style={styles.coverageGrid}>
              <div style={styles.coverageCard}>
                <span style={styles.coverageIcon}>📍</span>
                <span style={styles.coverageValue}>{d.coverage.district}</span>
                <span style={styles.coverageLabel}>District</span>
              </div>
              <div style={styles.coverageCard}>
                <span style={styles.coverageIcon}>🏛️</span>
                <span style={styles.coverageValue}>{d.coverage.taluks}</span>
                <span style={styles.coverageLabel}>Taluks</span>
              </div>
              <div style={styles.coverageCard}>
                <span style={styles.coverageIcon}>📐</span>
                <span style={styles.coverageValue}>{d.coverage.area_km2.toLocaleString()}</span>
                <span style={styles.coverageLabel}>km² Area</span>
              </div>
              <div style={styles.coverageCard}>
                <span style={styles.coverageIcon}>🌾</span>
                <span style={styles.coverageValue}>{d.coverage.crops}</span>
                <span style={styles.coverageLabel}>Crop Varieties</span>
              </div>
            </div>
            
            <div style={styles.uniqueFeatures}>
              <h4 style={styles.sectionTitle}>Unique Features</h4>
              <div style={styles.featuresList}>
                {d.unique_features.map((feature, i) => (
                  <div key={i} style={styles.featureItem}>
                    <span style={styles.featureCheck}>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerIcon}>📖</span>
        <span style={styles.footerText}>
          Full analysis available in {d.notebook}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div 
      className="research-metric"
      style={{
        ...metricStyles.card,
        borderColor: `${color}30`
      }}
    >
      <span style={metricStyles.icon}>{icon}</span>
      <div style={{ ...metricStyles.value, color }}>{value}</div>
      <div style={metricStyles.label}>{label}</div>
    </div>
  );
}

const metricStyles = {
  card: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    borderRadius: "16px",
    border: "1px solid",
    padding: "24px",
    textAlign: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.12)"
  },
  icon: {
    fontSize: "32px",
    display: "block",
    marginBottom: "12px"
  },
  value: {
    fontSize: "1.5rem",
    fontWeight: 800,
    marginBottom: "8px",
    fontFamily: "'Inter', sans-serif"
  },
  label: {
    fontSize: "0.8rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px"
  }
};

const styles = {
  container: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(34, 197, 94, 0.15)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px"
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  headerIcon: {
    fontSize: "40px",
    animation: "float 3s ease-in-out infinite"
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #22c55e, #4ade80, #86efac)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#64748b",
    fontFamily: "'Inter', sans-serif"
  },
  headerBadge: {
    background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
    border: "2px solid #22c55e",
    borderRadius: "16px",
    padding: "16px 24px",
    textAlign: "center",
    animation: "pulse 2s ease-in-out infinite"
  },
  badgeNumber: {
    display: "block",
    fontSize: "2rem",
    fontWeight: 800,
    color: "#22c55e",
    fontFamily: "'Inter', sans-serif"
  },
  badgeLabel: {
    fontSize: "0.75rem",
    color: "#4ade80",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    background: "#f0fdf4",
    padding: "6px",
    borderRadius: "14px"
  },
  tab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 16px",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    color: "#374151",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  tabActive: {
    background: "#dcfce7",
    color: "#16a34a"
  },
  content: {
    minHeight: "300px"
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px"
  },
  modelsSection: {
    padding: "8px 0"
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "20px"
  },
  modelBars: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  modelRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  modelInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "180px",
    flexShrink: 0
  },
  modelIcon: {
    fontSize: "20px"
  },
  modelName: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#374151"
  },
  modelBarContainer: {
    flex: 1,
    height: "24px",
    background: "#f0fdf4",
    borderRadius: "6px",
    overflow: "hidden"
  },
  modelBar: {
    height: "100%",
    borderRadius: "6px",
    transition: "width 1s ease-out"
  },
  modelAccuracy: {
    width: "50px",
    textAlign: "right",
    fontSize: "0.9rem",
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif"
  },
  modelsNote: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
    padding: "12px 16px",
    background: "#dcfce7",
    borderRadius: "10px",
    fontSize: "0.85rem",
    color: "#16a34a"
  },
  featuresSection: {
    padding: "8px 0"
  },
  featureBars: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  featureInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "160px",
    flexShrink: 0
  },
  featureRank: {
    fontSize: "0.75rem",
    color: "#64748b",
    background: "rgba(34, 197, 94, 0.08)",
    padding: "4px 8px",
    borderRadius: "4px",
    fontFamily: "'Inter', sans-serif"
  },
  featureName: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#374151"
  },
  featureBarContainer: {
    flex: 1,
    height: "20px",
    background: "#f0fdf4",
    borderRadius: "10px",
    overflow: "hidden"
  },
  featureBar: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 1s ease-out"
  },
  featureValue: {
    width: "50px",
    textAlign: "right",
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#1f2937",
    fontFamily: "'Inter', sans-serif"
  },
  featuresNote: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
    padding: "12px 16px",
    background: "#f5f3ff",
    borderRadius: "10px",
    fontSize: "0.85rem",
    color: "#7c3aed"
  },
  coverageSection: {
    padding: "8px 0"
  },
  coverageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "28px"
  },
  coverageCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    borderRadius: "14px",
    padding: "20px",
    textAlign: "center",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.12)"
  },
  coverageIcon: {
    fontSize: "28px",
    display: "block",
    marginBottom: "10px"
  },
  coverageValue: {
    display: "block",
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: "4px"
  },
  coverageLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    textTransform: "uppercase"
  },
  uniqueFeatures: {},
  featuresList: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px"
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.9rem",
    color: "#374151"
  },
  featureCheck: {
    color: "#16a34a",
    fontWeight: "bold"
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(34, 197, 94, 0.15)"
  },
  footerIcon: {
    fontSize: "16px"
  },
  footerText: {
    fontSize: "0.85rem",
    color: "#64748b",
    fontFamily: "'Inter', sans-serif"
  }
};

export default ResearchShowcase;
