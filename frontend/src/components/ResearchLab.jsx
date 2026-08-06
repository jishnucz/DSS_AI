/**
 * 🔬 ResearchLab - Advanced AI Research Showcase
 * ================================================
 * 
 * Interactive visualization of cutting-edge AI/DL models:
 * 1. Temporal Fusion Transformer (TFT) - Multi-horizon attention forecasting
 * 2. Bayesian Deep Learning - Uncertainty quantification with MC Dropout
 * 3. Counterfactual Explanations - What-if scenario analysis
 * 4. Knowledge Graph Neural Network - Relational reasoning
 * 
 * Author: AgriDSS Research Team
 * Date: March 2026
 */

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../LanguageContext";

// API base URL
const API_BASE = "http://localhost:8000/api";

// Inject custom CSS
const inject = (id, css) => {
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }
};

// Custom CSS with animations
const CSS = `
  @keyframes pulseGlow { 
    0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
    50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
  }
  @keyframes flowChart {
    0% { stroke-dashoffset: 100; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes barGrow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes nodeGlow {
    0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
    50% { filter: drop-shadow(0 0 8px currentColor); }
  }
  .research-card { animation: fadeSlideUp 0.5s ease-out; }
  .research-card:hover { transform: translateY(-4px) scale(1.01); }
  .tft-attention-bar { animation: barGrow 0.8s ease-out forwards; transform-origin: left; }
  .kg-node { animation: nodeGlow 2s ease-in-out infinite; }
  .uncertainty-ring { animation: pulseGlow 2s ease-in-out infinite; }
`;

// Research AI features definition
const RESEARCH_FEATURES = [
  {
    id: "tft",
    name: "Temporal Fusion Transformer",
    icon: "📈",
    color: "#22c55e",
    shortName: "TFT",
    description: "Multi-horizon attention-based forecasting",
    reference: "Lim et al. (2021) - Google Research",
    paperUrl: "https://arxiv.org/abs/1912.09363"
  },
  {
    id: "bayesian",
    name: "Bayesian Uncertainty",
    icon: "🎲",
    color: "#10b981",
    shortName: "BNN",
    description: "Epistemic + Aleatoric decomposition via MC Dropout",
    reference: "Gal & Ghahramani (2016) - Cambridge",
    paperUrl: "https://arxiv.org/abs/1506.02142"
  },
  {
    id: "counterfactual",
    name: "Counterfactual XAI",
    icon: "🔄",
    color: "#f59e0b",
    shortName: "CF-XAI",
    description: "Minimal changes for different outcomes",
    reference: "Wachter et al. (2017) - Oxford",
    paperUrl: "https://arxiv.org/abs/1711.00399"
  },
  {
    id: "gnn",
    name: "Knowledge Graph NN",
    icon: "🕸️",
    color: "#22c55e",
    shortName: "GNN",
    description: "Message passing over agricultural entities",
    reference: "Kipf & Welling (2017) - Amsterdam",
    paperUrl: "https://arxiv.org/abs/1609.02907"
  }
];

// Styles
const styles = {
  container: {
    padding: "24px",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 244, 0.95))",
    borderRadius: "24px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    boxShadow: "0 20px 60px rgba(34, 197, 94, 0.1)",
    color: "#1f2937",
    fontFamily: "'Poppins', sans-serif"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px",
    padding: "20px",
    background: "rgba(34, 197, 94, 0.08)",
    borderRadius: "16px",
    border: "1px solid rgba(34, 197, 94, 0.2)"
  },
  headerIcon: { fontSize: "48px" },
  headerTitle: { 
    fontSize: "28px", 
    fontWeight: 700, 
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  headerSubtitle: { color: "#a1a1aa", fontSize: "14px", marginTop: "4px" },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "24px"
  },
  featureBtn: (active, color) => ({
    padding: "16px",
    borderRadius: "12px",
    border: active ? `2px solid ${color}` : "2px solid #e5e7eb",
    background: active ? `${color}15` : "#ffffff",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textAlign: "center",
    boxShadow: active ? `0 4px 12px ${color}30` : "0 2px 8px rgba(0,0,0,0.05)"
  }),
  featureIcon: { fontSize: "32px", marginBottom: "8px" },
  featureName: { fontSize: "12px", fontWeight: 600, color: "#374151" },
  inputSection: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },
  inputGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "16px"
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  inputLabel: { fontSize: "12px", color: "#6b7280", fontWeight: 500 },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#1f2937",
    fontSize: "14px",
    width: "100%"
  },
  analyzeBtn: {
    padding: "16px 32px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "20px"
  },
  resultsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "24px"
  },
  card: (color) => ({
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: `1px solid ${color}30`,
    boxShadow: `0 4px 20px ${color}15`
  }),
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb"
  },
  cardTitle: { fontSize: "18px", fontWeight: 600, color: "#1f2937" },
  cardSubtitle: { fontSize: "11px", color: "#6b7280", marginTop: "2px" },
  barContainer: { marginBottom: "12px" },
  barLabel: { 
    display: "flex", 
    justifyContent: "space-between", 
    fontSize: "12px", 
    marginBottom: "4px",
    color: "#374151"
  },
  bar: (width, color) => ({
    height: "8px",
    borderRadius: "4px",
    background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
    width: `${width}%`,
    transformOrigin: "left"
  }),
  metricBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "8px",
    marginBottom: "8px",
    border: "1px solid #e5e7eb"
  },
  metricValue: { fontSize: "24px", fontWeight: 700, color: "#1f2937" },
  metricLabel: { fontSize: "12px", color: "#6b7280" },
  scenarioCard: (active) => ({
    padding: "16px",
    borderRadius: "12px",
    background: active ? "#dcfce7" : "#f9fafb",
    border: active ? "2px solid #22c55e" : "1px solid #e5e7eb",
    marginBottom: "12px"
  }),
  changeItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    background: "#f0fdf4",
    borderRadius: "6px",
    marginTop: "8px",
    fontSize: "12px",
    color: "#166534"
  },
  knowledgeGraph: {
    width: "100%",
    height: "300px",
    background: "#f9fafb",
    borderRadius: "12px",
    position: "relative",
    overflow: "hidden",
    border: "1px solid #e5e7eb"
  },
  graphNode: (x, y, color) => ({
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: `${color}30`,
    border: `2px solid ${color}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 600,
    color: color,
    cursor: "pointer",
    transition: "all 0.3s ease"
  }),
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    color: "#22c55e",
    background: "#f0fdf4",
    borderRadius: "16px",
    border: "1px solid #dcfce7"
  },
  reference: {
    fontSize: "10px",
    color: "#6b7280",
    marginTop: "16px",
    padding: "8px",
    background: "#f9fafb",
    borderRadius: "6px",
    fontStyle: "italic",
    border: "1px solid #e5e7eb"
  },
  error: {
    padding: "20px",
    background: "#fef2f2",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    color: "#dc2626",
    textAlign: "center",
    marginBottom: "20px"
  }
};

export default function ResearchLab() {
  inject("research-lab", CSS);
  const { t } = useLanguage();
  
  // State
  const [activeFeature, setActiveFeature] = useState("tft");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [inputs, setInputs] = useState({
    temperature: 32,
    precipitation: 5,
    soilMoisture: 0.35,
    windSpeed: 12,
    pressure: 1013,
    crop: "rice"
  });
  
  // Fetch capabilities on mount
  useEffect(() => {
    fetch(`${API_BASE}/research/capabilities`)
      .then(r => r.json())
      .then(setCapabilities)
      .catch(console.error);
  }, []);
  
  // Run analysis
  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch(`${API_BASE}/research/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: [
            inputs.temperature,
            inputs.precipitation,
            inputs.soilMoisture,
            inputs.windSpeed,
            inputs.pressure
          ],
          crop: inputs.crop,
          conditions: {
            temperature: inputs.temperature,
            humidity: 75,
            precipitation: inputs.precipitation
          }
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to connect to server. Make sure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, [inputs]);
  
  // Render TFT results
  const renderTFT = () => {
    if (!results?.tft_forecast) return null;
    const tft = results.tft_forecast;
    
    return (
      <div className="research-card" style={styles.card("#22c55e")}>
        <div style={styles.cardHeader}>
          <span style={{ fontSize: "32px" }}>📈</span>
          <div>
            <div style={styles.cardTitle}>Temporal Fusion Transformer</div>
            <div style={styles.cardSubtitle}>Multi-horizon Attention Forecasting</div>
          </div>
        </div>
        
        {/* Forecasts */}
        <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "14px" }}>
          📊 Multi-Horizon Forecasts
        </h4>
        {Object.entries(tft.forecasts || {}).map(([key, forecast]) => (
          <div key={key} style={styles.barContainer}>
            <div style={styles.barLabel}>
              <span>{key.replace("_", " ").toUpperCase()}</span>
              <span style={{ color: forecast.stress_level === "NORMAL" ? "#22c55e" : 
                            forecast.stress_level === "LOW STRESS" ? "#f59e0b" : "#ef4444" }}>
                {forecast.stress_level} ({(forecast.stress_probability * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="tft-attention-bar" style={styles.bar(forecast.stress_probability * 100, "#22c55e")} />
          </div>
        ))}
        
        {/* Variable Importance */}
        <h4 style={{ color: "#374151", margin: "20px 0 12px", fontSize: "14px" }}>
          🎯 Variable Selection Network
        </h4>
        {Object.entries(tft.variable_importance || {}).map(([feature, importance]) => (
          <div key={feature} style={styles.barContainer}>
            <div style={styles.barLabel}>
              <span>{feature}</span>
              <span>{(importance * 100).toFixed(0)}%</span>
            </div>
            <div className="tft-attention-bar" style={styles.bar(importance * 100, "#15803d")} />
          </div>
        ))}
        
        {/* Attention Interpretation */}
        {tft.attention_weights?.interpretation && (
          <div style={{ 
            marginTop: "16px", 
            padding: "12px", 
            background: "#22c55e20", 
            borderRadius: "8px",
            fontSize: "13px",
            color: "#86efac"
          }}>
            🔍 <strong>Attention Insight:</strong> {tft.attention_weights.interpretation}
          </div>
        )}
        
        <div style={styles.reference}>
          📄 Lim et al. (2021) "Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting"
        </div>
      </div>
    );
  };
  
  // Render Bayesian Uncertainty
  const renderBayesian = () => {
    if (!results?.uncertainty) return null;
    const unc = results.uncertainty;
    
    const reliabilityColor = unc.reliability_score > 0.7 ? "#22c55e" : 
                             unc.reliability_score > 0.4 ? "#f59e0b" : "#ef4444";
    
    return (
      <div className="research-card" style={styles.card("#10b981")}>
        <div style={styles.cardHeader}>
          <span style={{ fontSize: "32px" }}>🎲</span>
          <div>
            <div style={styles.cardTitle}>Bayesian Deep Learning</div>
            <div style={styles.cardSubtitle}>Monte Carlo Dropout Uncertainty</div>
          </div>
        </div>
        
        {/* Main Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div className="uncertainty-ring" style={{ 
            ...styles.metricBox, 
            borderLeft: `4px solid ${reliabilityColor}` 
          }}>
            <div>
              <div style={{ ...styles.metricValue, color: reliabilityColor }}>
                {(unc.reliability_score * 100).toFixed(0)}%
              </div>
              <div style={styles.metricLabel}>Reliability Score</div>
            </div>
          </div>
          <div style={styles.metricBox}>
            <div>
              <div style={styles.metricValue}>
                {(unc.confidence_interval_95?.[0] * 100).toFixed(0)}-
                {(unc.confidence_interval_95?.[1] * 100).toFixed(0)}%
              </div>
              <div style={styles.metricLabel}>95% Confidence Interval</div>
            </div>
          </div>
        </div>
        
        {/* Uncertainty Decomposition */}
        <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "14px" }}>
          🔬 Uncertainty Decomposition
        </h4>
        
        <div style={styles.barContainer}>
          <div style={styles.barLabel}>
            <span>🧠 Epistemic (Model Uncertainty)</span>
            <span>{(unc.epistemic_uncertainty * 100).toFixed(1)}%</span>
          </div>
          <div style={styles.bar(unc.epistemic_uncertainty * 200, "#10b981")} />
          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
            Reducible with more training data
          </div>
        </div>
        
        <div style={styles.barContainer}>
          <div style={styles.barLabel}>
            <span>📊 Aleatoric (Data Uncertainty)</span>
            <span>{(unc.aleatoric_uncertainty * 100).toFixed(1)}%</span>
          </div>
          <div style={styles.bar(unc.aleatoric_uncertainty * 100, "#34d399")} />
          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
            Irreducible noise in the environment
          </div>
        </div>
        
        {/* Explanations */}
        {unc.explanations && (
          <div style={{ marginTop: "16px" }}>
            {Object.entries(unc.explanations).map(([key, text]) => (
              <div key={key} style={{ 
                padding: "10px", 
                background: "#f0fdf4", 
                borderRadius: "6px", 
                marginBottom: "8px",
                fontSize: "12px",
                color: "#374151",
                border: "1px solid #dcfce7"
              }}>
                <strong style={{ color: "#10b981" }}>
                  {key.replace(/_/g, " ").toUpperCase()}:
                </strong>{" "}
                {text}
              </div>
            ))}
          </div>
        )}
        
        <div style={styles.reference}>
          📄 Gal & Ghahramani (2016) "Dropout as a Bayesian Approximation: Representing Model Uncertainty in Deep Learning"
        </div>
      </div>
    );
  };
  
  // Render Counterfactual
  const renderCounterfactual = () => {
    if (!results?.counterfactuals) return null;
    
    return (
      <div className="research-card" style={styles.card("#f59e0b")}>
        <div style={styles.cardHeader}>
          <span style={{ fontSize: "32px" }}>🔄</span>
          <div>
            <div style={styles.cardTitle}>Counterfactual Explanations</div>
            <div style={styles.cardSubtitle}>What-If Scenario Analysis</div>
          </div>
        </div>
        
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
          "What minimal changes would achieve a different outcome?"
        </p>
        
        {results.counterfactuals.map((scenario, idx) => (
          <div key={idx} style={styles.scenarioCard(scenario.is_current)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ 
                fontWeight: 600, 
                color: scenario.target === "NORMAL" ? "#22c55e" : 
                       scenario.target === "LOW STRESS" ? "#f59e0b" : "#ef4444" 
              }}>
                {scenario.is_current ? "✓ Current: " : "→ To achieve: "}
                {scenario.target}
              </span>
              <span style={{ 
                fontSize: "11px", 
                padding: "4px 8px", 
                background: "#374151", 
                borderRadius: "4px" 
              }}>
                Feasibility: {(scenario.feasibility * 100).toFixed(0)}%
              </span>
            </div>
            
            {/* Changes Required */}
            {Object.keys(scenario.changes || {}).length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>
                  Changes Required:
                </div>
                {Object.entries(scenario.changes).map(([feature, [orig, newVal]]) => (
                  <div key={feature} style={styles.changeItem}>
                    <span>📊 {feature}:</span>
                    <span style={{ color: "#ef4444" }}>{orig.toFixed(1)}</span>
                    <span>→</span>
                    <span style={{ color: "#22c55e" }}>{newVal.toFixed(1)}</span>
                    <span style={{ color: newVal > orig ? "#22c55e" : "#ef4444" }}>
                      ({newVal > orig ? "+" : ""}{(newVal - orig).toFixed(1)})
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Actionable Advice */}
            {scenario.advice && (
              <div style={{ 
                marginTop: "12px", 
                padding: "10px", 
                background: "#f59e0b10", 
                borderRadius: "6px",
                fontSize: "12px",
                color: "#fbbf24"
              }}>
                💡 {scenario.advice}
              </div>
            )}
          </div>
        ))}
        
        <div style={styles.reference}>
          📄 Wachter et al. (2017) "Counterfactual Explanations without Opening the Black Box"
        </div>
      </div>
    );
  };
  
  // Render Knowledge Graph
  const renderKnowledgeGraph = () => {
    if (!results?.knowledge_graph) return null;
    const kg = results.knowledge_graph;
    
    // Node positions for visualization
    const nodePositions = {
      "rice": { x: 50, y: 30, color: "#22c55e" },
      "blast": { x: 25, y: 60, color: "#ef4444" },
      "blight": { x: 75, y: 60, color: "#ef4444" },
      "high_humidity": { x: 15, y: 85, color: "#3b82f6" },
      "fungicide": { x: 85, y: 85, color: "#f59e0b" }
    };
    
    return (
      <div className="research-card" style={styles.card("#22c55e")}>
        <div style={styles.cardHeader}>
          <span style={{ fontSize: "32px" }}>🕸️</span>
          <div>
            <div style={styles.cardTitle}>Knowledge Graph Neural Network</div>
            <div style={styles.cardSubtitle}>Message Passing over Agricultural Entities</div>
          </div>
        </div>
        
        {/* Graph Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
          <div style={styles.metricBox}>
            <div>
              <div style={{ ...styles.metricValue, color: "#22c55e" }}>
                {kg.graph_stats?.total_nodes || 0}
              </div>
              <div style={styles.metricLabel}>Nodes</div>
            </div>
          </div>
          <div style={styles.metricBox}>
            <div>
              <div style={{ ...styles.metricValue, color: "#3b82f6" }}>
                {kg.graph_stats?.total_edges || 0}
              </div>
              <div style={styles.metricLabel}>Edges</div>
            </div>
          </div>
          <div style={styles.metricBox}>
            <div>
              <div style={{ ...styles.metricValue, color: "#f59e0b" }}>
                {kg.knowledge?.entities_found || 0}
              </div>
              <div style={styles.metricLabel}>Related</div>
            </div>
          </div>
        </div>
        
        {/* Visual Graph */}
        <div style={styles.knowledgeGraph}>
          <svg width="100%" height="100%" style={{ position: "absolute" }}>
            {/* Draw edges */}
            <line x1="50%" y1="30%" x2="25%" y2="60%" stroke="#22c55e40" strokeWidth="2" />
            <line x1="50%" y1="30%" x2="75%" y2="60%" stroke="#22c55e40" strokeWidth="2" />
            <line x1="25%" y1="60%" x2="15%" y2="85%" stroke="#ef444440" strokeWidth="2" />
            <line x1="75%" y1="60%" x2="85%" y2="85%" stroke="#ef444440" strokeWidth="2" />
          </svg>
          
          {/* Draw nodes */}
          {Object.entries(nodePositions).map(([id, pos]) => (
            <div 
              key={id} 
              className="kg-node"
              style={styles.graphNode(pos.x, pos.y, pos.color)}
            >
              {id.replace("_", "\n")}
            </div>
          ))}
        </div>
        
        {/* Recommendations from GNN */}
        {kg.recommendations?.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "14px" }}>
              🎯 Graph-Inferred Recommendations
            </h4>
            {kg.recommendations.slice(0, 4).map((rec, idx) => (
              <div key={idx} style={{ 
                padding: "12px", 
                background: "#f9fafb", 
                borderRadius: "8px", 
                marginBottom: "8px",
                border: "1px solid #e5e7eb",
                borderLeft: `3px solid ${
                  rec.type === "disease_alert" ? "#ef4444" : 
                  rec.type === "treatment" ? "#22c55e" : "#f59e0b"
                }`
              }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  {rec.type === "disease_alert" ? "⚠️" : rec.type === "treatment" ? "💊" : "🌤️"}
                  {" "}{rec.disease || rec.treatment || rec.action}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {rec.reason || rec.details?.type || rec.steps?.join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={styles.reference}>
          📄 Kipf & Welling (2017) "Semi-Supervised Classification with Graph Convolutional Networks"
        </div>
      </div>
    );
  };
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>🔬</span>
        <div>
          <h1 style={styles.headerTitle}>Advanced AI Research Lab</h1>
          <p style={styles.headerSubtitle}>
            State-of-the-art AI/DL models for agricultural decision support
            {capabilities?.available && " • All systems operational ✓"}
          </p>
        </div>
      </div>
      
      {/* Feature Selection */}
      <div style={styles.featureGrid}>
        {RESEARCH_FEATURES.map((feat) => (
          <button
            key={feat.id}
            style={styles.featureBtn(activeFeature === feat.id, feat.color)}
            onClick={() => setActiveFeature(feat.id)}
          >
            <div style={styles.featureIcon}>{feat.icon}</div>
            <div style={styles.featureName}>{feat.shortName}</div>
          </button>
        ))}
      </div>
      
      {/* Input Section */}
      <div style={styles.inputSection}>
        <h3 style={{ color: "#374151", marginBottom: "16px" }}>📊 Input Parameters</h3>
        <div style={styles.inputGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>🌡️ Temperature (°C)</label>
            <input
              type="number"
              style={styles.input}
              value={inputs.temperature}
              onChange={(e) => setInputs({ ...inputs, temperature: parseFloat(e.target.value) })}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>🌧️ Precipitation (mm)</label>
            <input
              type="number"
              style={styles.input}
              value={inputs.precipitation}
              onChange={(e) => setInputs({ ...inputs, precipitation: parseFloat(e.target.value) })}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>💧 Soil Moisture (0-1)</label>
            <input
              type="number"
              step="0.01"
              style={styles.input}
              value={inputs.soilMoisture}
              onChange={(e) => setInputs({ ...inputs, soilMoisture: parseFloat(e.target.value) })}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>💨 Wind Speed (km/h)</label>
            <input
              type="number"
              style={styles.input}
              value={inputs.windSpeed}
              onChange={(e) => setInputs({ ...inputs, windSpeed: parseFloat(e.target.value) })}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>📊 Pressure (hPa)</label>
            <input
              type="number"
              style={styles.input}
              value={inputs.pressure}
              onChange={(e) => setInputs({ ...inputs, pressure: parseFloat(e.target.value) })}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>🌾 Crop</label>
            <select
              style={styles.input}
              value={inputs.crop}
              onChange={(e) => setInputs({ ...inputs, crop: e.target.value })}
            >
              <option value="rice">Rice</option>
              <option value="coconut">Coconut</option>
              <option value="banana">Banana</option>
              <option value="vegetables">Vegetables</option>
            </select>
          </div>
        </div>
        
        <button 
          style={{
            ...styles.analyzeBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "wait" : "pointer"
          }} 
          onClick={runAnalysis}
          disabled={loading}
        >
          {loading ? (
            <>⏳ Analyzing...</>
          ) : (
            <>🔬 Run Advanced Analysis</>
          )}
        </button>
      </div>
      
      {/* Error Display */}
      {error && !loading && (
        <div style={styles.error}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>❌</div>
          <h4 style={{ margin: "0 0 8px 0", color: "#b91c1c" }}>Analysis Failed</h4>
          <p style={{ margin: 0, fontSize: "14px" }}>{error}</p>
          <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "#991b1b" }}>
            💡 Make sure the backend server is running: <code>python -m uvicorn app:app --port 8000</code>
          </p>
        </div>
      )}
      
      {/* Results */}
      {loading && (
        <div style={styles.loading}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔬</div>
            <div>Running Advanced AI Analysis...</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
              TFT • Bayesian • Counterfactual • GNN
            </div>
          </div>
        </div>
      )}
      
      {results && !loading && (
        <div style={styles.resultsContainer}>
          {renderTFT()}
          {renderBayesian()}
          {renderCounterfactual()}
          {renderKnowledgeGraph()}
        </div>
      )}
      
      {/* No results message */}
      {!results && !loading && !error && (
        <div style={{ 
          textAlign: "center", 
          padding: "60px",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔬</div>
          <h3 style={{ color: "#374151", margin: "0 0 8px 0" }}>Advanced AI Research Lab</h3>
          <p style={{ marginTop: "8px", color: "#6b7280" }}>
            Enter parameters above and click "Run Advanced Analysis" to see:
          </p>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(2, 1fr)", 
            gap: "12px", 
            maxWidth: "400px", 
            margin: "20px auto" 
          }}>
            {RESEARCH_FEATURES.map((f) => (
              <div key={f.id} style={{ 
                padding: "12px", 
                background: "#f9fafb", 
                borderRadius: "8px",
                textAlign: "left",
                border: "1px solid #e5e7eb"
              }}>
                <span style={{ color: "#374151" }}>{f.icon} <strong>{f.shortName}</strong></span>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                  {f.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
