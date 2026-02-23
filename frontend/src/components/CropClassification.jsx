import { useState, useRef } from "react";
import axios from "axios";

const CSS = `
  @keyframes cropFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes cropPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes cropSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes cropGlow { 0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); } 50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.6); } }
  @keyframes healthPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes loadingSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
  
  .crop-upload-zone:hover { border-color: #22c55e !important; background: rgba(34, 197, 94, 0.1) !important; }
  .crop-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3) !important; }
  .crop-btn:active { transform: translateY(0); }
  .crop-action-btn:hover { background: rgba(34, 197, 94, 0.15) !important; border-color: #22c55e !important; }
  
  @media (max-width: 900px) {
    .crop-main-content { grid-template-columns: 1fr !important; }
  }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function CropClassification({ onGetDSSHelp }) {
  inject("crop-classifier-styles", CSS);
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const processFile = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setResult(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/classify-crop",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000
        }
      );

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || "Classification failed");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend or process image");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleGetDSSHelp = () => {
    if (result && onGetDSSHelp) {
      onGetDSSHelp({
        crop: result.crop,
        growthStage: result.growth_stage,
        health: result.health,
        confidence: result.confidence
      });
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case "Healthy": return "#22c55e";
      case "Moderate": return "#f59e0b";
      case "Stressed": return "#f97316";
      default: return "#ef4444";
    }
  };

  const getHealthBg = (status) => {
    switch (status) {
      case "Healthy": return "rgba(34, 197, 94, 0.15)";
      case "Moderate": return "rgba(245, 158, 11, 0.15)";
      case "Stressed": return "rgba(249, 115, 22, 0.15)";
      default: return "rgba(239, 68, 68, 0.15)";
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>📸</div>
        <div>
          <h2 style={styles.title}>Crop Image Analysis</h2>
          <p style={styles.subtitle}>AI-powered crop identification, health assessment & growth stage detection</p>
        </div>
      </div>

      <div className="crop-main-content" style={styles.mainContent}>
        {/* Left Panel - Upload */}
        <div style={styles.uploadPanel}>
          {/* Upload Zone */}
          <div
            className="crop-upload-zone"
            style={{
              ...styles.uploadZone,
              borderColor: dragActive ? "#22c55e" : "rgba(34, 197, 94, 0.3)",
              background: dragActive ? "rgba(34, 197, 94, 0.1)" : "rgba(17, 24, 39, 0.5)"
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {!preview ? (
              <div style={styles.uploadContent}>
                <div style={styles.uploadIconWrap}>
                  <span style={styles.uploadIcon}>🌿</span>
                </div>
                <h3 style={styles.uploadTitle}>Upload Crop Image</h3>
                <p style={styles.uploadText}>Drag & drop or click to select</p>
                <div style={styles.uploadActions}>
                  <button
                    className="crop-action-btn"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={styles.actionButton}
                  >
                    <span>📁</span> Browse Files
                  </button>
                  <button
                    className="crop-action-btn"
                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                    style={styles.actionButton}
                  >
                    <span>📷</span> Take Photo
                  </button>
                </div>
                <p style={styles.uploadHint}>Supports PNG, JPG, WEBP • Max 10MB</p>
              </div>
            ) : (
              <div style={styles.previewContainer}>
                <img src={preview} alt="Preview" style={styles.previewImage} />
                <div style={styles.previewOverlay}>
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={styles.changeImageBtn}
                  >
                    🔄 Change Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.buttonGroup}>
            <button
              className="crop-btn"
              onClick={handleUpload}
              disabled={!file || loading}
              style={{
                ...styles.analyzeButton,
                opacity: !file || loading ? 0.5 : 1,
                cursor: !file || loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}>⚡</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>🔬</span>
                  Analyze Crop
                </>
              )}
            </button>
            {file && (
              <button onClick={handleClear} style={styles.clearButton}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Features */}
          <div style={styles.featuresGrid}>
            {[
              { icon: "🌱", title: "22+ Crops", desc: "Comprehensive database" },
              { icon: "📊", title: "Growth Stage", desc: "Track development" },
              { icon: "🩺", title: "Health Check", desc: "Disease detection" },
              { icon: "💡", title: "Smart Tips", desc: "Care recommendations" }
            ].map((f, i) => (
              <div key={i} style={styles.featureCard}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <div>
                  <div style={styles.featureTitle}>{f.title}</div>
                  <div style={styles.featureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Results */}
        <div style={styles.resultsPanel}>
          {!result && !loading && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🌾</div>
              <h3 style={styles.emptyTitle}>Ready to Analyze</h3>
              <p style={styles.emptyText}>
                Upload a photo of your crop to get instant AI-powered insights including crop type, growth stage, and health assessment.
              </p>
              <div style={styles.emptySteps}>
                <div style={styles.step}><span style={styles.stepNum}>1</span> Take or upload photo</div>
                <div style={styles.step}><span style={styles.stepNum}>2</span> Click Analyze</div>
                <div style={styles.step}><span style={styles.stepNum}>3</span> Get DSS recommendations</div>
              </div>
            </div>
          )}

          {loading && (
            <div style={styles.loadingState}>
              <div style={styles.loadingSpinner}>🔄</div>
              <h3 style={styles.loadingTitle}>Analyzing Your Crop...</h3>
              <p style={styles.loadingText}>AI is identifying crop type, assessing health, and detecting growth stage</p>
              <div style={styles.loadingProgress}>
                <div style={styles.loadingBar} />
              </div>
            </div>
          )}

          {result && (
            <div style={styles.resultContent}>
              {/* Main Result Card */}
              <div style={styles.mainResultCard}>
                <div style={styles.cropBadge}>
                  <span style={styles.cropEmoji}>🌾</span>
                  <div>
                    <div style={styles.cropName}>{result.crop}</div>
                    <div style={styles.confidenceBar}>
                      <div style={styles.confidenceTrack}>
                        <div style={{ ...styles.confidenceFill, width: `${result.confidence}%` }} />
                      </div>
                      <span style={styles.confidenceText}>{result.confidence}% confidence</span>
                    </div>
                  </div>
                </div>

                {/* Growth Stage */}
                {result.growth_stage && result.growth_stage !== "Unknown" && (
                  <div style={styles.growthStageCard}>
                    <span style={styles.stageIcon}>🌱</span>
                    <div>
                      <div style={styles.stageLabel}>Growth Stage</div>
                      <div style={styles.stageValue}>{result.growth_stage}</div>
                    </div>
                  </div>
                )}

                {/* Health Status */}
                {result.health && (
                  <div style={{
                    ...styles.healthCard,
                    backgroundColor: getHealthBg(result.health.status),
                    borderColor: getHealthColor(result.health.status)
                  }}>
                    <div style={styles.healthHeader}>
                      <span style={styles.healthIcon}>
                        {result.health.status === "Healthy" ? "✅" : 
                         result.health.status === "Moderate" ? "⚠️" : "🚨"}
                      </span>
                      <div style={styles.healthInfo}>
                        <div style={styles.healthLabel}>Plant Health</div>
                        <div style={{ ...styles.healthStatus, color: getHealthColor(result.health.status) }}>
                          {result.health.status}
                        </div>
                      </div>
                      <div style={{
                        ...styles.healthScoreBadge,
                        backgroundColor: getHealthColor(result.health.status)
                      }}>
                        {result.health.score}%
                      </div>
                    </div>
                    {result.health.issues && result.health.issues.length > 0 && (
                      <div style={styles.issuesList}>
                        {result.health.issues.map((issue, idx) => (
                          <div key={idx} style={styles.issueItem}>
                            <span style={styles.issueDot}>•</span>
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Analysis */}
              {result.caption && (
                <div style={styles.analysisCard}>
                  <div style={styles.cardHeader}>
                    <span>🤖</span> AI Analysis
                  </div>
                  <p style={styles.analysisText}>{result.caption}</p>
                  {result.matched_keywords && result.matched_keywords.length > 0 && (
                    <div style={styles.keywordTags}>
                      {result.matched_keywords.map((kw, idx) => (
                        <span key={idx} style={styles.keywordTag}>{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Disease Recommendations */}
              {result.disease_recommendations && result.disease_recommendations.length > 0 && (
                <div style={styles.diseaseCard}>
                  <div style={styles.cardHeader}>
                    <span>🩺</span> Treatment Recommendations
                  </div>
                  <ul style={styles.recList}>
                    {result.disease_recommendations.map((rec, idx) => (
                      <li key={idx} style={styles.diseaseItem}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Care Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div style={styles.careCard}>
                  <div style={styles.cardHeader}>
                    <span>💡</span> Care Recommendations
                  </div>
                  <ul style={styles.recList}>
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} style={styles.careItem}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Get DSS Help Button */}
              {result.crop && result.crop !== "Unknown" && (
                <button
                  className="crop-btn"
                  onClick={handleGetDSSHelp}
                  style={styles.dssHelpButton}
                >
                  <span>📊</span>
                  Get DSS Recommendations for {result.crop}
                  <span style={styles.arrowIcon}>→</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,253,244,0.95))",
    borderRadius: "28px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    padding: "36px",
    backdropFilter: "blur(20px)",
    animation: "cropFadeIn 0.5s ease-out",
    boxShadow: "0 25px 70px rgba(34,197,94,0.1)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px"
  },
  headerIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },
  title: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #22c55e, #4ade80)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "0.9rem",
    color: "#64748b"
  },
  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: "32px"
  },
  uploadPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  uploadZone: {
    border: "2px dashed",
    borderRadius: "20px",
    padding: "32px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    minHeight: "280px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  uploadContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px"
  },
  uploadIconWrap: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(74, 222, 128, 0.1))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px"
  },
  uploadIcon: {
    fontSize: "40px"
  },
  uploadTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1e293b"
  },
  uploadText: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#64748b"
  },
  uploadActions: {
    display: "flex",
    gap: "12px",
    marginTop: "16px"
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    border: "1px solid rgba(34, 197, 94, 0.35)",
    borderRadius: "12px",
    color: "#16a34a",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  uploadHint: {
    margin: "12px 0 0 0",
    fontSize: "0.75rem",
    color: "#64748b"
  },
  previewContainer: {
    position: "relative",
    width: "100%"
  },
  previewImage: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "cover",
    borderRadius: "16px"
  },
  previewOverlay: {
    position: "absolute",
    bottom: "12px",
    left: "50%",
    transform: "translateX(-50%)"
  },
  changeImageBtn: {
    padding: "10px 20px",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 18px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "12px",
    color: "#f87171",
    fontSize: "0.9rem"
  },
  errorIcon: {
    fontSize: "1.1rem"
  },
  buttonGroup: {
    display: "flex",
    gap: "12px"
  },
  analyzeButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "16px 24px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    borderRadius: "14px",
    color: "white",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)"
  },
  spinner: {
    animation: "cropSpin 1s linear infinite"
  },
  clearButton: {
    padding: "16px 20px",
    background: "rgba(107, 114, 128, 0.2)",
    border: "1px solid rgba(107, 114, 128, 0.3)",
    borderRadius: "14px",
    color: "#9CA3AF",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "8px"
  },
  featureCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    background: "rgba(34, 197, 94, 0.05)",
    border: "1px solid rgba(34, 197, 94, 0.1)",
    borderRadius: "12px"
  },
  featureIcon: {
    fontSize: "1.5rem"
  },
  featureTitle: {
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#1e293b"
  },
  featureDesc: {
    fontSize: "0.75rem",
    color: "#64748b"
  },
  resultsPanel: {
    minHeight: "400px"
  },
  emptyState: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px",
    background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,253,244,0.9))",
    borderRadius: "22px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    boxShadow: "0 8px 30px rgba(34,197,94,0.06)"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "20px",
    opacity: 0.7
  },
  emptyTitle: {
    margin: "0 0 12px 0",
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1e293b"
  },
  emptyText: {
    margin: "0 0 24px 0",
    fontSize: "0.95rem",
    color: "#64748b",
    maxWidth: "320px",
    lineHeight: 1.6
  },
  emptySteps: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "0.9rem",
    color: "#9CA3AF"
  },
  stepNum: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: "700"
  },
  loadingState: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px"
  },
  loadingSpinner: {
    fontSize: "64px",
    animation: "cropSpin 2s linear infinite",
    marginBottom: "24px"
  },
  loadingTitle: {
    margin: "0 0 8px 0",
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1e293b"
  },
  loadingText: {
    margin: "0 0 24px 0",
    fontSize: "0.9rem",
    color: "#64748b"
  },
  loadingProgress: {
    width: "200px",
    height: "4px",
    background: "rgba(34, 197, 94, 0.2)",
    borderRadius: "4px",
    overflow: "hidden"
  },
  loadingBar: {
    width: "30%",
    height: "100%",
    background: "linear-gradient(90deg, #22c55e, #4ade80)",
    borderRadius: "4px",
    animation: "loadingSlide 1.5s ease-in-out infinite"
  },
  resultContent: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    animation: "slideInRight 0.5s ease-out"
  },
  mainResultCard: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,244,0.95))",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "22px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 8px 30px rgba(34,197,94,0.1)"
  },
  cropBadge: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  cropEmoji: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px"
  },
  cropName: {
    fontSize: "1.75rem",
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: "4px"
  },
  confidenceBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  confidenceTrack: {
    width: "120px",
    height: "6px",
    background: "rgba(34, 197, 94, 0.2)",
    borderRadius: "6px",
    overflow: "hidden"
  },
  confidenceFill: {
    height: "100%",
    background: "linear-gradient(90deg, #22c55e, #4ade80)",
    borderRadius: "6px",
    transition: "width 0.5s ease"
  },
  confidenceText: {
    fontSize: "0.85rem",
    color: "#4ade80",
    fontWeight: "600"
  },
  growthStageCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    background: "rgba(34, 197, 94, 0.1)",
    borderRadius: "12px",
    border: "1px solid rgba(34, 197, 94, 0.2)"
  },
  stageIcon: {
    fontSize: "1.5rem"
  },
  stageLabel: {
    fontSize: "0.8rem",
    color: "#9CA3AF",
    fontWeight: "500"
  },
  stageValue: {
    fontSize: "1rem",
    color: "#4ade80",
    fontWeight: "700"
  },
  healthCard: {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid"
  },
  healthHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  healthIcon: {
    fontSize: "1.5rem"
  },
  healthInfo: {
    flex: 1
  },
  healthLabel: {
    fontSize: "0.8rem",
    color: "#9CA3AF",
    fontWeight: "500"
  },
  healthStatus: {
    fontSize: "1.1rem",
    fontWeight: "700"
  },
  healthScoreBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    color: "white",
    fontSize: "0.9rem",
    fontWeight: "700"
  },
  issuesList: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  issueItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "0.85rem",
    color: "#D1D5DB",
    padding: "8px 12px",
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "8px"
  },
  issueDot: {
    color: "#ef4444",
    fontWeight: "bold"
  },
  analysisCard: {
    background: "rgba(17, 24, 39, 0.5)",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "16px",
    padding: "20px"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "1rem",
    fontWeight: "700",
    color: "#F3F4F6",
    marginBottom: "12px"
  },
  analysisText: {
    margin: 0,
    fontSize: "0.95rem",
    color: "#D1D5DB",
    lineHeight: 1.6,
    fontStyle: "italic"
  },
  keywordTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px"
  },
  keywordTag: {
    padding: "5px 12px",
    background: "rgba(34, 197, 94, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "20px",
    color: "#4ade80",
    fontSize: "0.8rem",
    fontWeight: "600"
  },
  diseaseCard: {
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "16px",
    padding: "20px"
  },
  recList: {
    margin: 0,
    paddingLeft: "20px"
  },
  diseaseItem: {
    marginBottom: "8px",
    color: "#fca5a5",
    fontSize: "0.9rem",
    lineHeight: 1.5
  },
  careCard: {
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    borderRadius: "16px",
    padding: "20px"
  },
  careItem: {
    marginBottom: "8px",
    color: "#fcd34d",
    fontSize: "0.9rem",
    lineHeight: 1.5
  },
  dssHelpButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "18px 28px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    borderRadius: "16px",
    color: "white",
    fontSize: "1.05rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(34, 197, 94, 0.35)",
    marginTop: "8px"
  },
  arrowIcon: {
    fontSize: "1.2rem",
    marginLeft: "4px"
  }
};

export default CropClassification;
