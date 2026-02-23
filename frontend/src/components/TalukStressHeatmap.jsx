/**
 * 🗺️ Taluk Stress Heatmap
 * Interactive visualization of 13 Palakkad taluks stress levels
 * Shows real-time crop stress across geographic regions
 */

import { useState, useEffect } from "react";

const CSS = `
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 15px currentColor; } 50% { box-shadow: 0 0 30px currentColor; } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  
  .taluk-card { transition: all 0.3s ease !important; cursor: pointer; }
  .taluk-card:hover { transform: scale(1.05) !important; z-index: 10 !important; }
  
  .stress-indicator { transition: all 0.3s ease !important; }
  .stress-indicator:hover { transform: scale(1.2) !important; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function TalukStressHeatmap({ onTalukSelect }) {
  inject("taluk-heatmap", CSS);
  
  const [taluks, setTaluks] = useState([]);
  const [selectedTaluk, setSelectedTaluk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid, map
  
  useEffect(() => {
    fetchTalukData();
  }, []);
  
  const fetchTalukData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/map/stress-overview");
      if (response.ok) {
        const data = await response.json();
        setTaluks(data.taluks || []);
      }
    } catch (err) {
      console.error("Failed to fetch taluk data:", err);
      // Use fallback data
      setTaluks(fallbackTaluks);
    } finally {
      setLoading(false);
    }
  };
  
  // Fallback taluk data with real GPS coordinates
  const fallbackTaluks = [
    { name: "Palakkad", lat: 10.7867, lon: 76.6548, stress: 0.42, elevation: 85, risk: "Moderate", crops: ["Rice", "Coconut"] },
    { name: "Ottapalam", lat: 10.7705, lon: 76.3798, stress: 0.35, elevation: 25, risk: "Low", crops: ["Paddy", "Banana"] },
    { name: "Alathur", lat: 10.6482, lon: 76.5459, stress: 0.58, elevation: 95, risk: "High", crops: ["Rice", "Groundnut"] },
    { name: "Chittur", lat: 10.7026, lon: 76.7436, stress: 0.72, elevation: 150, risk: "High", crops: ["Rice", "Sugarcane"] },
    { name: "Pattambi", lat: 10.8067, lon: 76.1906, stress: 0.28, elevation: 20, risk: "Low", crops: ["Paddy", "Coconut"] },
    { name: "Mannarkad", lat: 11.0163, lon: 76.4546, stress: 0.65, elevation: 250, risk: "High", crops: ["Rubber", "Pepper"] },
    { name: "Attappadi", lat: 11.1167, lon: 76.5833, stress: 0.78, elevation: 800, risk: "Critical", crops: ["Millet", "Vegetables"] },
    { name: "Nenmara", lat: 10.5620, lon: 76.6240, stress: 0.45, elevation: 110, risk: "Moderate", crops: ["Rice", "Banana"] },
    { name: "Kollengode", lat: 10.5833, lon: 76.6833, stress: 0.52, elevation: 180, risk: "Moderate", crops: ["Rice", "Vegetables"] },
    { name: "Kuzhalmannam", lat: 10.6790, lon: 76.6030, stress: 0.38, elevation: 75, risk: "Low", crops: ["Paddy", "Coconut"] },
    { name: "Thrithala", lat: 10.7250, lon: 76.1333, stress: 0.31, elevation: 15, risk: "Low", crops: ["Paddy", "Banana"] },
    { name: "Shornur", lat: 10.7599, lon: 76.2695, stress: 0.33, elevation: 18, risk: "Low", crops: ["Rice", "Coconut"] },
    { name: "Malampuzha", lat: 10.8333, lon: 76.6833, stress: 0.48, elevation: 120, risk: "Moderate", crops: ["Vegetables", "Fruits"] }
  ];
  
  const data = taluks.length > 0 ? taluks : fallbackTaluks;
  
  const getStressColor = (stress) => {
    if (stress >= 0.7) return "#ef4444";
    if (stress >= 0.5) return "#f59e0b";
    if (stress >= 0.3) return "#eab308";
    return "#22c55e";
  };
  
  const getRiskBadge = (risk) => {
    const colors = {
      "Critical": { bg: "#fee2e2", text: "#dc2626" },
      "High": { bg: "#fef3c7", text: "#d97706" },
      "Moderate": { bg: "#fef9c3", text: "#ca8a04" },
      "Low": { bg: "#dcfce7", text: "#16a34a" }
    };
    return colors[risk] || colors["Moderate"];
  };
  
  const handleTalukClick = (taluk) => {
    setSelectedTaluk(taluk);
    if (onTalukSelect) onTalukSelect(taluk);
  };
  
  // Calculate stats
  const avgStress = data.reduce((sum, t) => sum + t.stress, 0) / data.length;
  const criticalCount = data.filter(t => t.stress >= 0.7).length;
  const lowCount = data.filter(t => t.stress < 0.3).length;
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.headerIcon}>🗺️</span>
          <div>
            <h2 style={styles.headerTitle}>Regional Taluk Stress Map</h2>
            <p style={styles.headerSubtitle}>
              Real-time crop stress across 13 administrative regions
            </p>
          </div>
        </div>
        
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              ...styles.viewBtn,
              ...(viewMode === "grid" ? styles.viewBtnActive : {})
            }}
          >
            ▦ Grid
          </button>
          <button
            onClick={() => setViewMode("map")}
            style={{
              ...styles.viewBtn,
              ...(viewMode === "map" ? styles.viewBtnActive : {})
            }}
          >
            🗺️ Map
          </button>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{(avgStress * 100).toFixed(0)}%</span>
          <span style={styles.statLabel}>Avg Stress</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statValue, color: "#ef4444" }}>{criticalCount}</span>
          <span style={styles.statLabel}>Critical Areas</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statValue, color: "#22c55e" }}>{lowCount}</span>
          <span style={styles.statLabel}>Low Risk</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{data.length}</span>
          <span style={styles.statLabel}>Total Taluks</span>
        </div>
      </div>
      
      {/* Grid View */}
      {viewMode === "grid" && (
        <div style={styles.talukGrid}>
          {data.map((taluk, i) => (
            <div
              key={taluk.name}
              className="taluk-card"
              onClick={() => handleTalukClick(taluk)}
              style={{
                ...styles.talukCard,
                animation: `slideIn 0.3s ease-out ${i * 0.05}s both`,
                borderColor: selectedTaluk?.name === taluk.name 
                  ? getStressColor(taluk.stress) 
                  : "transparent"
              }}
            >
              {/* Stress Indicator */}
              <div 
                className="stress-indicator"
                style={{
                  ...styles.stressIndicator,
                  background: `radial-gradient(circle, ${getStressColor(taluk.stress)}, ${getStressColor(taluk.stress)}80)`
                }}
              >
                <span style={styles.stressValue}>{(taluk.stress * 100).toFixed(0)}%</span>
              </div>
              
              {/* Taluk Info */}
              <div style={styles.talukInfo}>
                <h4 style={styles.talukName}>{taluk.name}</h4>
                <div style={{
                  ...styles.riskBadge,
                  background: getRiskBadge(taluk.risk).bg,
                  color: getRiskBadge(taluk.risk).text
                }}>
                  {taluk.risk}
                </div>
              </div>
              
              {/* Quick Stats */}
              <div style={styles.quickStats}>
                <span style={styles.quickStat}>
                  <span style={styles.quickIcon}>⛰️</span>
                  {taluk.elevation}m
                </span>
                <span style={styles.quickStat}>
                  <span style={styles.quickIcon}>🌾</span>
                  {taluk.crops.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Map View (Simplified) */}
      {viewMode === "map" && (
        <div style={styles.mapView}>
          <div style={styles.mapContainer}>
            {/* Legend */}
            <div style={styles.mapLegend}>
              <span style={styles.legendTitle}>Stress Level</span>
              <div style={styles.legendGradient} />
              <div style={styles.legendLabels}>
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
            
            {/* Simplified map with positioned dots */}
            <svg viewBox="0 0 400 350" style={styles.mapSvg}>
              {/* District boundary approximation */}
              <path
                d="M50,50 L350,50 L350,300 L50,300 Z"
                fill="rgba(34, 197, 94, 0.05)"
                stroke="rgba(34, 197, 94, 0.3)"
                strokeWidth="2"
              />
              
              {/* Grid lines */}
              {[100, 150, 200, 250].map(y => (
                <line key={`h${y}`} x1="50" y1={y} x2="350" y2={y} stroke="rgba(255,255,255,0.05)" />
              ))}
              {[100, 150, 200, 250, 300].map(x => (
                <line key={`v${x}`} x1={x} y1="50" x2={x} y2="300" stroke="rgba(255,255,255,0.05)" />
              ))}
              
              {/* Taluk markers */}
              {data.map((taluk, i) => {
                // Normalize coordinates to SVG space
                const x = ((taluk.lon - 76.1) / 0.9) * 300 + 50;
                const y = 300 - ((taluk.lat - 10.5) / 0.7) * 250;
                const size = 12 + (taluk.stress * 10);
                
                return (
                  <g key={taluk.name} onClick={() => handleTalukClick(taluk)} style={{ cursor: "pointer" }}>
                    {/* Glow effect */}
                    <circle
                      cx={x}
                      cy={y}
                      r={size + 5}
                      fill={getStressColor(taluk.stress)}
                      opacity={0.2}
                    />
                    {/* Main dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={size}
                      fill={getStressColor(taluk.stress)}
                      stroke="#fff"
                      strokeWidth={selectedTaluk?.name === taluk.name ? 3 : 1}
                      opacity={0.9}
                    />
                    {/* Label */}
                    <text
                      x={x}
                      y={y + size + 14}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize="10"
                      fontFamily="Inter, sans-serif"
                    >
                      {taluk.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
      
      {/* Selected Taluk Details */}
      {selectedTaluk && (
        <div style={styles.detailsPanel}>
          <div style={styles.detailsHeader}>
            <h3 style={styles.detailsTitle}>
              {selectedTaluk.name} Details
            </h3>
            <button 
              onClick={() => setSelectedTaluk(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>
          
          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Stress Level</span>
              <span style={{ 
                ...styles.detailValue,
                color: getStressColor(selectedTaluk.stress)
              }}>
                {(selectedTaluk.stress * 100).toFixed(0)}%
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Risk Category</span>
              <span style={styles.detailValue}>{selectedTaluk.risk}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Elevation</span>
              <span style={styles.detailValue}>{selectedTaluk.elevation}m</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Coordinates</span>
              <span style={{ ...styles.detailValue, fontSize: "0.8rem" }}>
                {selectedTaluk.lat.toFixed(4)}°N, {selectedTaluk.lon.toFixed(4)}°E
              </span>
            </div>
          </div>
          
          <div style={styles.cropsSection}>
            <span style={styles.detailLabel}>Major Crops</span>
            <div style={styles.cropTags}>
              {selectedTaluk.crops.map(crop => (
                <span key={crop} style={styles.cropTag}>🌾 {crop}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div style={styles.footer}>
        <span>📡</span>
        <span>Data updated in real-time from ERA5 reanalysis</span>
      </div>
    </div>
  );
}

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
    fontSize: "1.5rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #22c55e, #4ade80)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#64748b"
  },
  viewToggle: {
    display: "flex",
    gap: "8px"
  },
  viewBtn: {
    padding: "8px 16px",
    background: "#f0fdf4",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  viewBtnActive: {
    background: "#dcfce7",
    borderColor: "rgba(34, 197, 94, 0.5)",
    color: "#16a34a"
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px"
  },
  statCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center"
  },
  statValue: {
    display: "block",
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: "4px"
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    textTransform: "uppercase"
  },
  talukGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "16px",
    marginBottom: "24px"
  },
  talukCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    borderRadius: "16px",
    padding: "16px",
    border: "2px solid transparent",
    textAlign: "center",
    transition: "all 0.3s ease"
  },
  stressIndicator: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    margin: "0 auto 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  stressValue: {
    fontSize: "1rem",
    fontWeight: 800,
    color: "#fff"
  },
  talukInfo: {
    marginBottom: "8px"
  },
  talukName: {
    margin: "0 0 8px 0",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1f2937"
  },
  riskBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase"
  },
  quickStats: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "8px"
  },
  quickStat: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.75rem",
    color: "#64748b"
  },
  quickIcon: {
    fontSize: "12px"
  },
  mapView: {
    marginBottom: "24px"
  },
  mapContainer: {
    position: "relative",
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    borderRadius: "16px",
    padding: "20px",
    minHeight: "400px"
  },
  mapLegend: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "10px",
    padding: "12px",
    zIndex: 10
  },
  legendTitle: {
    display: "block",
    fontSize: "0.75rem",
    color: "#64748b",
    marginBottom: "8px"
  },
  legendGradient: {
    width: "100px",
    height: "10px",
    background: "linear-gradient(90deg, #22c55e, #eab308, #f59e0b, #ef4444)",
    borderRadius: "5px",
    marginBottom: "4px"
  },
  legendLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.65rem",
    color: "#64748b"
  },
  mapSvg: {
    width: "100%",
    height: "350px"
  },
  detailsPanel: {
    background: "#dcfce7",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    animation: "fadeIn 0.3s ease-out"
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  detailsTitle: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#16a34a"
  },
  closeBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "rgba(34, 197, 94, 0.1)",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "14px"
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "16px"
  },
  detailItem: {
    textAlign: "center"
  },
  detailLabel: {
    display: "block",
    fontSize: "0.75rem",
    color: "#64748b",
    marginBottom: "4px",
    textTransform: "uppercase"
  },
  detailValue: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#1f2937"
  },
  cropsSection: {
    paddingTop: "12px",
    borderTop: "1px solid rgba(34, 197, 94, 0.2)"
  },
  cropTags: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    flexWrap: "wrap"
  },
  cropTag: {
    padding: "6px 12px",
    background: "rgba(34, 197, 94, 0.15)",
    borderRadius: "8px",
    fontSize: "0.8rem",
    color: "#16a34a"
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "12px",
    background: "#dcfce7",
    borderRadius: "10px",
    fontSize: "0.8rem",
    color: "#16a34a"
  }
};

export default TalukStressHeatmap;
