/**
 * 🎓 Research Overview Component
 * Introduction to research features with model details
 */

import { useState } from "react";

// Model information data
const ML_MODELS = [
  {
    id: "lstm",
    name: "LSTM",
    fullName: "Long Short-Term Memory",
    icon: "🧠",
    accuracy: 87.4,
    color: "#dc2626",
    description: "Recurrent neural network for time-series data. Captures temporal dependencies in climate patterns over days/weeks.",
    strengths: ["Temporal patterns", "Sequence learning", "Memory cells"],
    useCase: "Time-series stress prediction",
    params: "units=64, dropout=0.2, epochs=100"
  },
  {
    id: "rf",
    name: "Random Forest",
    fullName: "Random Forest Classifier",
    icon: "🌲",
    accuracy: 85.2,
    color: "#22c55e",
    description: "Ensemble of decision trees with bagging. Robust to overfitting and works well with agricultural parameters.",
    strengths: ["Robust", "No scaling needed", "Interpretable"],
    useCase: "Primary stress prediction model",
    params: "n_estimators=150, max_depth=10, min_samples_split=5"
  },
  {
    id: "et",
    name: "Extra Trees",
    fullName: "Extremely Randomized Trees",
    icon: "🌳",
    accuracy: 84.6,
    color: "#14b8a6",
    description: "Variant of Random Forest with more randomization. Faster training and better generalization.",
    strengths: ["Fast training", "Reduced variance", "Handles noise"],
    useCase: "Secondary prediction model",
    params: "n_estimators=150, max_depth=10, random_state=42"
  },
  {
    id: "gb",
    name: "Gradient Boosting",
    fullName: "Gradient Boosting Classifier",
    icon: "📈",
    accuracy: 83.8,
    color: "#3b82f6",
    description: "Sequential ensemble building weak learners into strong predictors. Captures complex patterns in climate data.",
    strengths: ["High performance", "Sequential learning", "Flexible"],
    useCase: "Climate pattern analysis",
    params: "n_estimators=100, learning_rate=0.05, max_depth=5"
  },
  {
    id: "mlp",
    name: "MLP Neural Net",
    fullName: "Multi-Layer Perceptron",
    icon: "🧠",
    accuracy: 82.1,
    color: "#a855f7",
    description: "Deep learning model with multiple hidden layers. Captures non-linear relationships in climate data.",
    strengths: ["Non-linear patterns", "Feature learning", "Scalable"],
    useCase: "Complex pattern recognition",
    params: "hidden_layers=(100, 50), activation=relu, solver=adam"
  },
  {
    id: "ada",
    name: "AdaBoost",
    fullName: "Adaptive Boosting",
    icon: "🚀",
    accuracy: 79.3,
    color: "#f59e0b",
    description: "Boosting algorithm that focuses on misclassified samples. Improves weak classifiers iteratively.",
    strengths: ["Simple", "Handles imbalanced data", "Interpretable"],
    useCase: "Baseline boosting model",
    params: "n_estimators=50, learning_rate=1.0"
  },
  {
    id: "svm",
    name: "SVM",
    fullName: "Support Vector Machine",
    icon: "�",
    accuracy: 81.5,
    color: "#ec4899",
    description: "Finds optimal hyperplane for classification. Works well with high-dimensional climate features.",
    strengths: ["High-dimensional", "Kernel trick", "Margin maximization"],
    useCase: "Boundary classification",
    params: "kernel=rbf, C=1.0, gamma=scale"
  },
  {
    id: "knn",
    name: "KNN",
    fullName: "K-Nearest Neighbors",
    icon: "🎯",
    accuracy: 78.9,
    color: "#8b5cf6",
    description: "Instance-based learning using similarity. Good for localized predictions based on neighboring conditions.",
    strengths: ["Simple", "No training", "Local patterns"],
    useCase: "Regional similarity",
    params: "n_neighbors=5, weights=distance, metric=euclidean"
  },
  {
    id: "nb",
    name: "Naive Bayes",
    fullName: "Gaussian Naive Bayes",
    icon: "📌",
    accuracy: 74.2,
    color: "#6366f1",
    description: "Probabilistic classifier based on Bayes theorem. Fast and works well with limited training data.",
    strengths: ["Fast", "Probabilistic", "Baseline model"],
    useCase: "Quick baseline predictions",
    params: "var_smoothing=1e-9"
  }
];

// Advanced Research Models (used in Research Lab)
const ADVANCED_MODELS = [
  {
    id: "tft",
    name: "Temporal Fusion Transformer",
    icon: "⚡",
    color: "#0ea5e9",
    type: "Attention-based",
    description: "State-of-the-art multi-horizon forecasting with interpretable attention mechanisms.",
    use: "7-day, 14-day, 30-day stress forecasts",
    reference: "Lim et al. (2021)"
  },
  {
    id: "bayesian",
    name: "Bayesian Neural Network",
    icon: "🎲",
    color: "#8b5cf6",
    type: "Uncertainty Quantification",
    description: "Monte Carlo Dropout for epistemic uncertainty estimation in predictions.",
    use: "Confidence intervals, risk assessment",
    reference: "Gal & Ghahramani (2016)"
  },
  {
    id: "gnn",
    name: "Graph Neural Network",
    icon: "🔗",
    color: "#10b981",
    type: "Spatial Relations",
    description: "Models spatial relationships between 13 Palakkad taluks for regional stress propagation.",
    use: "Taluk interconnection analysis",
    reference: "Kipf & Welling (2017)"
  },
  {
    id: "counterfactual",
    name: "Counterfactual Explainer",
    icon: "🔄",
    color: "#f59e0b",
    type: "XAI",
    description: "What-if scenario analysis showing minimum changes needed to alter predictions.",
    use: "Decision support, actionable insights",
    reference: "Wachter et al. (2017)"
  }
];

const RESEARCH_METHODOLOGY = [
  {
    step: 1,
    title: "Data Collection",
    icon: "📡",
    description: "140,000+ data points from ERA5 reanalysis (ECMWF), IMD, and local agricultural databases.",
    details: ["Temperature (2m)", "Precipitation", "Soil Moisture", "Wind Speed", "Surface Pressure"]
  },
  {
    step: 2,
    title: "Preprocessing",
    icon: "⚙️",
    description: "Handling missing values, normalization, feature engineering, and temporal alignment.",
    details: ["StandardScaler normalization", "Rolling averages", "Lag features", "Seasonal encoding"]
  },
  {
    step: 3,
    title: "Model Training",
    icon: "🧠",
    description: "8 ML models trained with 5-fold cross-validation on historical stress events.",
    details: ["Stratified K-Fold", "Hyperparameter tuning", "Early stopping", "Class balancing"]
  },
  {
    step: 4,
    title: "Evaluation",
    icon: "📊",
    description: "Comprehensive metrics including accuracy, precision, recall, F1-score, and ROC-AUC.",
    details: ["Confusion matrix", "ROC curves", "Precision-Recall", "Feature importance"]
  },
  {
    step: 5,
    title: "Explainability",
    icon: "🔍",
    description: "SHAP values for model interpretability - understanding WHY predictions are made.",
    details: ["SHAP plots", "Feature contribution", "Local explanations", "Global importance"]
  },
  {
    step: 6,
    title: "Deployment",
    icon: "🚀",
    description: "Production-ready API with real-time predictions and uncertainty quantification.",
    details: ["FastAPI backend", "React frontend", "REST API", "Confidence intervals"]
  }
];

export default function ResearchOverview({ onNavigate }) {
  const [selectedModel, setSelectedModel] = useState(null);
  const [activeMethodStep, setActiveMethodStep] = useState(null);
  
  const styles = {
    container: {
      background: "#ffffff",
      borderRadius: "24px",
      padding: "0",
      boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
      border: "1px solid rgba(139, 92, 246, 0.15)",
      overflow: "hidden",
      color: "#1f2937"
    },
    heroSection: {
      background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)",
      padding: "48px 40px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden"
    },
    heroPattern: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      opacity: 0.5
    },
    heroContent: {
      position: "relative",
      zIndex: 1
    },
    heroIcon: {
      fontSize: "64px",
      marginBottom: "16px",
      display: "block"
    },
    heroTitle: {
      fontSize: "2.2rem",
      fontWeight: 800,
      color: "#fff",
      margin: "0 0 12px 0"
    },
    heroSubtitle: {
      fontSize: "1.1rem",
      color: "rgba(255,255,255,0.9)",
      margin: "0 0 24px 0",
      maxWidth: "700px",
      marginLeft: "auto",
      marginRight: "auto"
    },
    heroStats: {
      display: "flex",
      justifyContent: "center",
      gap: "40px",
      flexWrap: "wrap"
    },
    heroStat: {
      textAlign: "center"
    },
    heroStatValue: {
      fontSize: "2.5rem",
      fontWeight: 800,
      color: "#fff"
    },
    heroStatLabel: {
      fontSize: "0.85rem",
      color: "rgba(255,255,255,0.8)",
      textTransform: "uppercase",
      letterSpacing: "1px"
    },
    content: {
      padding: "40px"
    },
    section: {
      marginBottom: "40px"
    },
    sectionTitle: {
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#1f2937",
      marginBottom: "24px",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    modelGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "16px"
    },
    modelCard: {
      padding: "20px",
      borderRadius: "16px",
      border: "2px solid #e5e7eb",
      cursor: "pointer",
      transition: "all 0.3s ease",
      background: "#fff"
    },
    modelCardActive: {
      borderColor: "#8b5cf6",
      boxShadow: "0 8px 25px rgba(139, 92, 246, 0.2)"
    },
    modelHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "12px"
    },
    modelIcon: {
      fontSize: "28px"
    },
    modelName: {
      fontSize: "1rem",
      fontWeight: 700,
      color: "#1f2937"
    },
    modelAccuracy: {
      marginLeft: "auto",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "0.85rem",
      fontWeight: 700
    },
    modelDesc: {
      fontSize: "0.85rem",
      color: "#6b7280",
      lineHeight: 1.6
    },
    modelDetails: {
      marginTop: "16px",
      padding: "16px",
      background: "#f9fafb",
      borderRadius: "12px"
    },
    modelStrengths: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "12px"
    },
    strengthBadge: {
      padding: "4px 10px",
      background: "#dcfce7",
      color: "#166534",
      borderRadius: "6px",
      fontSize: "0.75rem",
      fontWeight: 600
    },
    methodologySteps: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "16px"
    },
    methodStep: {
      padding: "20px",
      background: "#f9fafb",
      borderRadius: "16px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: "2px solid transparent"
    },
    methodStepActive: {
      background: "#f0fdf4",
      borderColor: "#22c55e"
    },
    methodNumber: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      color: "#fff",
      fontSize: "1rem",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 12px"
    },
    methodIcon: {
      fontSize: "32px",
      marginBottom: "8px"
    },
    methodTitle: {
      fontSize: "0.9rem",
      fontWeight: 700,
      color: "#1f2937"
    },
    methodDetails: {
      marginTop: "24px",
      padding: "24px",
      background: "#f0fdf4",
      borderRadius: "16px",
      border: "1px solid #bbf7d0"
    },
    detailsList: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "12px"
    },
    detailTag: {
      padding: "6px 12px",
      background: "#dcfce7",
      color: "#166534",
      borderRadius: "8px",
      fontSize: "0.8rem",
      fontWeight: 500
    },
    quickNav: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "12px",
      marginTop: "24px"
    },
    navCard: {
      padding: "20px",
      background: "#f9fafb",
      borderRadius: "16px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: "1px solid #e5e7eb"
    },
    navIcon: {
      fontSize: "32px",
      marginBottom: "8px"
    },
    navTitle: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#1f2937"
    },
    navDesc: {
      fontSize: "0.75rem",
      color: "#6b7280",
      marginTop: "4px"
    }
  };
  
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroPattern} />
        <div style={styles.heroContent}>
          <span style={styles.heroIcon}>🎓</span>
          <h1 style={styles.heroTitle}>Research-Powered Agricultural Intelligence</h1>
          <p style={styles.heroSubtitle}>
            Explore our cutting-edge ML models, methodology, and explainable AI features 
            designed specifically for Palakkad's agricultural ecosystem
          </p>
          <div style={styles.heroStats}>
            <div style={styles.heroStat}>
              <div style={styles.heroStatValue}>8</div>
              <div style={styles.heroStatLabel}>ML Models</div>
            </div>
            <div style={styles.heroStat}>
              <div style={styles.heroStatValue}>88.3%</div>
              <div style={styles.heroStatLabel}>Ensemble Accuracy</div>
            </div>
            <div style={styles.heroStat}>
              <div style={styles.heroStatValue}>140K+</div>
              <div style={styles.heroStatLabel}>Data Points</div>
            </div>
            <div style={styles.heroStat}>
              <div style={styles.heroStatValue}>SHAP</div>
              <div style={styles.heroStatLabel}>Explainability</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.content}>
        {/* Quick Navigation */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>🧭</span> Quick Navigation
          </h2>
          <div style={styles.quickNav}>
            {[
              { icon: "🔬", title: "AI Analysis", desc: "Models & Predictions", tab: "analysis" },
              { icon: "🌾", title: "Farm Tools", desc: "Planning & Calendar", tab: "tools" },
              { icon: "📈", title: "Market Data", desc: "Prices & Trends", tab: "market" },
              { icon: "🛡️", title: "Alerts", desc: "Weather & Schemes", tab: "alerts" }
            ].map((item, i) => (
              <div 
                key={i}
                style={styles.navCard}
                onClick={() => onNavigate && onNavigate(item.tab)}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f0fdf4";
                  e.currentTarget.style.borderColor = "#22c55e";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.navIcon}>{item.icon}</div>
                <div style={styles.navTitle}>{item.title}</div>
                <div style={styles.navDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Methodology Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>📋</span> Research Methodology
          </h2>
          <div style={styles.methodologySteps}>
            {RESEARCH_METHODOLOGY.map((method) => (
              <div
                key={method.step}
                style={{
                  ...styles.methodStep,
                  ...(activeMethodStep === method.step ? styles.methodStepActive : {})
                }}
                onClick={() => setActiveMethodStep(activeMethodStep === method.step ? null : method.step)}
              >
                <div style={styles.methodNumber}>{method.step}</div>
                <div style={styles.methodIcon}>{method.icon}</div>
                <div style={styles.methodTitle}>{method.title}</div>
              </div>
            ))}
          </div>
          
          {activeMethodStep && (
            <div style={styles.methodDetails}>
              <h4 style={{ margin: "0 0 8px 0", color: "#166534" }}>
                {RESEARCH_METHODOLOGY[activeMethodStep - 1].icon} {RESEARCH_METHODOLOGY[activeMethodStep - 1].title}
              </h4>
              <p style={{ margin: "0 0 12px 0", color: "#374151", lineHeight: 1.6 }}>
                {RESEARCH_METHODOLOGY[activeMethodStep - 1].description}
              </p>
              <div style={styles.detailsList}>
                {RESEARCH_METHODOLOGY[activeMethodStep - 1].details.map((d, i) => (
                  <span key={i} style={styles.detailTag}>{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* ML Models Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>🤖</span> Machine Learning Models Used
          </h2>
          <div style={styles.modelGrid}>
            {ML_MODELS.map((model) => (
              <div
                key={model.id}
                style={{
                  ...styles.modelCard,
                  ...(selectedModel === model.id ? styles.modelCardActive : {})
                }}
                onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
              >
                <div style={styles.modelHeader}>
                  <span style={styles.modelIcon}>{model.icon}</span>
                  <span style={styles.modelName}>{model.name}</span>
                  <span style={{
                    ...styles.modelAccuracy,
                    background: `${model.color}20`,
                    color: model.color
                  }}>
                    {model.accuracy}%
                  </span>
                </div>
                <div style={styles.modelDesc}>{model.description}</div>
                
                {selectedModel === model.id && (
                  <div style={styles.modelDetails}>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "8px" }}>
                      <strong>Full Name:</strong> {model.fullName}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "8px" }}>
                      <strong>Use Case:</strong> {model.useCase}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontFamily: "monospace" }}>
                      {model.params}
                    </div>
                    <div style={styles.modelStrengths}>
                      {model.strengths.map((s, i) => (
                        <span key={i} style={styles.strengthBadge}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Research Models Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>🔬</span> Advanced Research Models
          </h2>
          <p style={{ color: "#64748b", marginBottom: "20px", textAlign: "center" }}>
            State-of-the-art deep learning architectures used in the Research Lab
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px"
          }}>
            {ADVANCED_MODELS.map((model) => (
              <div
                key={model.id}
                style={{
                  background: `linear-gradient(135deg, ${model.color}15, ${model.color}05)`,
                  border: `2px solid ${model.color}40`,
                  borderRadius: "16px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "32px" }}>{model.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>{model.name}</div>
                    <div style={{ 
                      fontSize: "0.7rem", 
                      background: model.color, 
                      color: "white", 
                      padding: "2px 8px", 
                      borderRadius: "10px",
                      display: "inline-block"
                    }}>{model.type}</div>
                  </div>
                </div>
                <p style={{ fontSize: "0.85rem", color: "#4b5563", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                  {model.description}
                </p>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  <strong>Use:</strong> {model.use}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "4px" }}>
                  📚 {model.reference}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Accuracy Comparison Bar Chart */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>📊</span> Model Accuracy Comparison
          </h2>
          <div style={{ 
            padding: "24px", 
            background: "#f9fafb", 
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {ML_MODELS.map((model) => (
              <div key={model.id} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "100px", fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                  {model.icon} {model.name}
                </div>
                <div style={{ 
                  flex: 1, 
                  height: "28px", 
                  background: "#e5e7eb", 
                  borderRadius: "14px",
                  overflow: "hidden",
                  position: "relative"
                }}>
                  <div style={{
                    width: `${model.accuracy}%`,
                    height: "100%",
                    background: model.id === "ensemble" 
                      ? "linear-gradient(90deg, #22c55e, #16a34a)"
                      : model.color,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: "12px",
                    transition: "width 0.5s ease"
                  }}>
                    <span style={{ 
                      fontSize: "0.8rem", 
                      fontWeight: 700, 
                      color: "#fff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)"
                    }}>
                      {model.accuracy}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Key Features */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>✨</span> Key Research Features
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            {[
              { icon: "🔬", title: "TFT Forecasting", desc: "Temporal Fusion Transformer for 7-day predictions" },
              { icon: "📉", title: "SHAP Explainability", desc: "Understand why each prediction is made" },
              { icon: "🎯", title: "Bayesian Uncertainty", desc: "Confidence intervals for every prediction" },
              { icon: "🔄", title: "Counterfactual XAI", desc: "'What-if' analysis for decision support" },
              { icon: "🕸️", title: "Knowledge Graph", desc: "Agricultural domain knowledge network" },
              { icon: "📡", title: "Real-time API", desc: "Live predictions with <200ms latency" }
            ].map((f, i) => (
              <div key={i} style={{
                padding: "20px",
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                borderRadius: "16px",
                border: "1px solid #bbf7d0"
              }}>
                <span style={{ fontSize: "32px", marginBottom: "12px", display: "block" }}>{f.icon}</span>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "1rem", fontWeight: 700, color: "#166534" }}>{f.title}</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#374151" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
