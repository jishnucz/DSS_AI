/**
 * 📄 Report Export Component
 * Generates printable/PDF crop analysis reports
 * For banks, insurance companies, and government schemes
 */

import { useState, useRef } from "react";

const PRINT_CSS = `
  @media print {
    body * { visibility: hidden; }
    .print-report, .print-report * { visibility: visible; }
    .print-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
    .no-print { display: none !important; }
    @page { margin: 15mm; size: A4; }
  }
`;

export default function ReportExport({ 
  farmData = {},
  analysisData = {},
  yieldData = {},
  recommendations = []
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const reportRef = useRef(null);
  
  // Extract farm details
  const farmerName = farmData.farmerName || "Farmer";
  const location = farmData.village || farmData.taluk || "Palakkad";
  const crop = farmData.crop || "Rice";
  const landArea = farmData.landArea || 1;
  const farmerId = farmData.farmerId || `PAL-${Date.now().toString(36).toUpperCase()}`;
  const season = farmData.season || "Current Season";
  
  // Normalize analysis data
  const data = {
    stressLevel: (analysisData.stressLevel || "LOW").toUpperCase(),
    confidence: analysisData.confidence || 85,
    temperature: analysisData.temperature || 28,
    humidity: analysisData.humidity || analysisData.soilMoisture * 100 || 70,
    soilMoisture: typeof analysisData.soilMoisture === "number" && analysisData.soilMoisture < 1 
      ? Math.round(analysisData.soilMoisture * 100) 
      : analysisData.soilMoisture || 35,
    rainfall: analysisData.precipitation || analysisData.rainfall || 5,
    yieldPrediction: yieldData.predictedYield || 4.2,
    yieldPotential: Math.round((yieldData.predictedYield || 4.2) / 5 * 100),
    estimatedRevenue: yieldData.expectedRevenue || (yieldData.predictedYield * landArea * 22000) || 92400,
    recommendations: recommendations.length > 0 ? recommendations : [
      "Maintain current irrigation schedule",
      "Monitor for pest activity in next 7 days",
      "Apply fertilizer as per growth stage"
    ]
  };
  
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const reportId = farmerId;
  
  const getStressColor = (level) => {
    const l = level.toUpperCase();
    if (l.includes("NORMAL") || l.includes("LOW") || l.includes("OPTIMAL")) return "#22c55e";
    if (l.includes("MODERATE") || l.includes("MEDIUM")) return "#f59e0b";
    return "#ef4444";
  };
  
  const handlePrint = () => {
    setIsGenerating(true);
    
    // Inject print styles
    const styleEl = document.createElement('style');
    styleEl.textContent = PRINT_CSS;
    document.head.appendChild(styleEl);
    
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
      document.head.removeChild(styleEl);
    }, 300);
  };
  
  const handleDownloadPDF = () => {
    // For now, use print dialog which allows saving as PDF
    handlePrint();
  };
  
  const styles = {
    container: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      border: "1px solid rgba(34, 197, 94, 0.15)"
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
    buttonRow: {
      display: "flex",
      gap: "12px"
    },
    btn: {
      padding: "10px 20px",
      borderRadius: "10px",
      border: "none",
      fontWeight: 600,
      fontSize: "0.9rem",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease"
    },
    primaryBtn: {
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      color: "#fff"
    },
    secondaryBtn: {
      background: "#f3f4f6",
      color: "#374151",
      border: "1px solid #e5e7eb"
    },
    previewToggle: {
      padding: "8px 16px",
      borderRadius: "8px",
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
      cursor: "pointer",
      fontSize: "0.85rem",
      fontWeight: 500
    },
    // Report styles
    report: {
      background: "#fff",
      padding: "32px",
      maxWidth: "800px",
      margin: "20px auto",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    },
    reportHeader: {
      textAlign: "center",
      borderBottom: "2px solid #22c55e",
      paddingBottom: "20px",
      marginBottom: "24px"
    },
    reportLogo: {
      fontSize: "40px",
      marginBottom: "8px"
    },
    reportTitle: {
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#1f2937",
      margin: "0 0 4px 0"
    },
    reportSubtitle: {
      fontSize: "0.9rem",
      color: "#6b7280",
      margin: 0
    },
    reportMeta: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "0.85rem",
      color: "#6b7280",
      marginTop: "12px"
    },
    section: {
      marginBottom: "24px"
    },
    sectionTitle: {
      fontSize: "1rem",
      fontWeight: 600,
      color: "#1f2937",
      marginBottom: "12px",
      paddingBottom: "8px",
      borderBottom: "1px solid #e5e7eb"
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "12px"
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 12px",
      background: "#f9fafb",
      borderRadius: "6px"
    },
    infoLabel: {
      color: "#6b7280",
      fontSize: "0.85rem"
    },
    infoValue: {
      fontWeight: 600,
      color: "#1f2937",
      fontSize: "0.9rem"
    },
    statusBox: {
      padding: "16px",
      borderRadius: "10px",
      textAlign: "center",
      marginBottom: "16px"
    },
    statusLabel: {
      fontSize: "0.8rem",
      color: "#fff",
      opacity: 0.9
    },
    statusValue: {
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#fff"
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "12px",
      marginBottom: "20px"
    },
    metricCard: {
      padding: "12px",
      background: "#f9fafb",
      borderRadius: "8px",
      textAlign: "center"
    },
    metricValue: {
      fontSize: "1.2rem",
      fontWeight: 700,
      color: "#1f2937"
    },
    metricLabel: {
      fontSize: "0.75rem",
      color: "#6b7280",
      marginTop: "4px"
    },
    recList: {
      listStyle: "none",
      padding: 0,
      margin: 0
    },
    recItem: {
      padding: "10px 12px",
      background: "#f0fdf4",
      borderRadius: "6px",
      marginBottom: "8px",
      fontSize: "0.9rem",
      color: "#166534",
      display: "flex",
      alignItems: "flex-start",
      gap: "8px"
    },
    footer: {
      marginTop: "32px",
      paddingTop: "16px",
      borderTop: "1px solid #e5e7eb",
      textAlign: "center",
      fontSize: "0.75rem",
      color: "#9ca3af"
    },
    signature: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "40px",
      paddingTop: "20px"
    },
    signatureBox: {
      width: "200px",
      textAlign: "center"
    },
    signatureLine: {
      borderTop: "1px solid #1f2937",
      marginBottom: "8px"
    },
    signatureLabel: {
      fontSize: "0.8rem",
      color: "#6b7280"
    },
    qrPlaceholder: {
      width: "80px",
      height: "80px",
      background: "#f3f4f6",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.7rem",
      color: "#9ca3af",
      margin: "0 auto"
    }
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <div style={styles.container}>
      {/* Header with buttons */}
      <div style={styles.header}>
        <div style={styles.title}>
          <span style={{ fontSize: "28px" }}>📄</span>
          <div>
            <h3 style={styles.titleText}>Export Report</h3>
            <p style={styles.subtitle}>For banks, insurance & government schemes</p>
          </div>
        </div>
        
        <div style={styles.buttonRow}>
          <button
            style={styles.previewToggle}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "Hide Preview" : "Preview Report"}
          </button>
          
          <button
            style={{ ...styles.btn, ...styles.secondaryBtn }}
            onClick={handlePrint}
            disabled={isGenerating}
            className="no-print"
          >
            🖨️ Print
          </button>
          
          <button
            style={{ ...styles.btn, ...styles.primaryBtn }}
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="no-print"
          >
            📥 {isGenerating ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
      
      {/* Report Preview / Print Content */}
      {showPreview && (
        <div className="print-report" ref={reportRef} style={styles.report}>
          {/* Report Header */}
          <div style={styles.reportHeader}>
            <div style={styles.reportLogo}>🌾</div>
            <h1 style={styles.reportTitle}>Crop Analysis Report</h1>
            <p style={styles.reportSubtitle}>
              Palakkad Agricultural Decision Support System
            </p>
            <div style={styles.reportMeta}>
              <span>Report ID: {reportId}</span>
              <span>Date: {currentDate}</span>
            </div>
          </div>
          
          {/* Farm Details */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📋 Farm Details</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Farmer Name</span>
                <span style={styles.infoValue}>{farmerName}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Location</span>
                <span style={styles.infoValue}>{location}, Kerala</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Crop</span>
                <span style={styles.infoValue}>{crop}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Land Area</span>
                <span style={styles.infoValue}>{landArea} hectares</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Season</span>
                <span style={styles.infoValue}>{season}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Farmer ID</span>
                <span style={styles.infoValue}>{farmerId}</span>
              </div>
            </div>
          </div>
          
          {/* AI Analysis Summary */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🤖 AI Analysis Summary</h2>
            
            <div style={{
              ...styles.statusBox,
              background: getStressColor(data.stressLevel)
            }}>
              <div style={styles.statusLabel}>Crop Stress Level</div>
              <div style={styles.statusValue}>{data.stressLevel}</div>
              <div style={{ fontSize: "0.85rem", color: "#fff", marginTop: "4px" }}>
                Model Confidence: {data.confidence}%
              </div>
            </div>
            
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricValue}>{data.temperature}°C</div>
                <div style={styles.metricLabel}>Temperature</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricValue}>{data.humidity}%</div>
                <div style={styles.metricLabel}>Humidity</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricValue}>{data.soilMoisture}%</div>
                <div style={styles.metricLabel}>Soil Moisture</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricValue}>{data.rainfall} mm</div>
                <div style={styles.metricLabel}>Rainfall</div>
              </div>
            </div>
          </div>
          
          {/* Yield Prediction */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🌾 Yield Prediction</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Predicted Yield</span>
                <span style={styles.infoValue}>{data.yieldPrediction} tonnes/ha</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Total Expected</span>
                <span style={styles.infoValue}>{(data.yieldPrediction * landArea).toFixed(1)} tonnes</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Yield Potential</span>
                <span style={styles.infoValue}>{data.yieldPotential}%</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Est. Revenue</span>
                <span style={styles.infoValue}>{formatCurrency(data.estimatedRevenue)}</span>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>💡 Recommendations</h2>
            <ul style={styles.recList}>
              {data.recommendations.map((rec, i) => (
                <li key={i} style={styles.recItem}>
                  <span>✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Model Information */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🔬 Technical Details</h2>
            <div style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6 }}>
              <p><strong>Model:</strong> Voting Ensemble (8 ML models) • 88.3% accuracy</p>
              <p><strong>Data Source:</strong> ERA5 Climate Reanalysis (ECMWF)</p>
              <p><strong>Analysis Type:</strong> Multi-horizon stress prediction with SHAP explainability</p>
              <p><strong>Generated By:</strong> Palakkad AgriDSS v2.0</p>
            </div>
          </div>
          
          {/* Signatures */}
          <div style={styles.signature}>
            <div style={styles.signatureBox}>
              <div style={styles.signatureLine}></div>
              <div style={styles.signatureLabel}>Farmer's Signature</div>
            </div>
            <div style={styles.qrPlaceholder}>
              QR Code
            </div>
            <div style={styles.signatureBox}>
              <div style={styles.signatureLine}></div>
              <div style={styles.signatureLabel}>Agricultural Officer</div>
            </div>
          </div>
          
          {/* Footer */}
          <div style={styles.footer}>
            <p>This report is generated by AI-powered analysis and should be verified by local agricultural authorities.</p>
            <p>Palakkad Agricultural Decision Support System • Kerala State • {currentDate}</p>
          </div>
        </div>
      )}
      
      {/* Quick stats when preview hidden */}
      {!showPreview && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          padding: "16px",
          background: "#f9fafb",
          borderRadius: "12px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: getStressColor(data.stressLevel) }}>
              {data.stressLevel}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Stress Level</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1f2937" }}>
              {data.yieldPrediction} t/ha
            </div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Predicted Yield</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#16a34a" }}>
              {formatCurrency(data.estimatedRevenue)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Est. Revenue</div>
          </div>
        </div>
      )}
    </div>
  );
}
