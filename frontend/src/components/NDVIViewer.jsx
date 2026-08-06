/**
 * 🛰️ NDVI Viewer Component
 * Satellite-based vegetation health visualization
 * Shows NDVI (Normalized Difference Vegetation Index) maps
 */

import { useState } from "react";

// Simulated NDVI data for Palakkad taluks (in production, fetch from GEE/Sentinel)
const NDVI_DATA = {
  "Palakkad Central": {
    current: 0.72,
    lastWeek: 0.68,
    lastMonth: 0.55,
    lastYear: 0.70,
    trend: [0.35, 0.42, 0.55, 0.65, 0.72, 0.72],
    months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    healthStatus: "Healthy",
    coverage: 85
  },
  "Chittur": {
    current: 0.65,
    lastWeek: 0.63,
    lastMonth: 0.48,
    lastYear: 0.67,
    trend: [0.30, 0.38, 0.48, 0.58, 0.65, 0.65],
    months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    healthStatus: "Good",
    coverage: 78
  },
  "Alathur": {
    current: 0.58,
    lastWeek: 0.60,
    lastMonth: 0.52,
    lastYear: 0.62,
    trend: [0.32, 0.40, 0.52, 0.56, 0.60, 0.58],
    months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    healthStatus: "Moderate",
    coverage: 72
  },
  "Mannarkad": {
    current: 0.78,
    lastWeek: 0.75,
    lastMonth: 0.62,
    lastYear: 0.76,
    trend: [0.40, 0.50, 0.62, 0.70, 0.78, 0.78],
    months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    healthStatus: "Excellent",
    coverage: 92
  },
  "Ottapalam": {
    current: 0.68,
    lastWeek: 0.66,
    lastMonth: 0.50,
    lastYear: 0.69,
    trend: [0.32, 0.42, 0.50, 0.60, 0.68, 0.68],
    months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    healthStatus: "Good",
    coverage: 80
  },
  "Pattambi": {
    current: 0.70,
    lastWeek: 0.67,
    lastMonth: 0.54,
    lastYear: 0.71,
    trend: [0.35, 0.45, 0.54, 0.62, 0.70, 0.70],
    months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    healthStatus: "Healthy",
    coverage: 82
  }
};

// NDVI color scale
const getNDVIColor = (value) => {
  if (value < 0.2) return "#d73027"; // Bare soil
  if (value < 0.3) return "#fc8d59"; // Sparse vegetation
  if (value < 0.4) return "#fee08b"; // Light vegetation
  if (value < 0.5) return "#d9ef8b"; // Moderate vegetation
  if (value < 0.6) return "#a6d96a"; // Good vegetation
  if (value < 0.7) return "#66bd63"; // Healthy vegetation
  if (value < 0.8) return "#1a9850"; // Dense vegetation
  return "#006837"; // Very dense vegetation
};

const getHealthIcon = (status) => {
  const icons = {
    "Excellent": "🌟",
    "Healthy": "✅",
    "Good": "👍",
    "Moderate": "⚠️",
    "Poor": "❌",
    "Critical": "🚨"
  };
  return icons[status] || "📊";
};

export default function NDVIViewer({ selectedTaluk = "Palakkad Central" }) {
  const [taluk, setTaluk] = useState(selectedTaluk);
  const [hoveredTaluk, setHoveredTaluk] = useState(null);
  const data = NDVI_DATA[taluk] || NDVI_DATA["Palakkad Central"];
  
  const getChange = (current, previous) => {
    const change = ((current - previous) / previous * 100).toFixed(1);
    return {
      value: change,
      positive: parseFloat(change) >= 0
    };
  };
  
  const weekChange = getChange(data.current, data.lastWeek);
  const monthChange = getChange(data.current, data.lastMonth);
  const yearChange = getChange(data.current, data.lastYear);
  
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
    mainDisplay: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "20px"
    },
    mapBox: {
      padding: "20px",
      background: "#f9fafb",
      borderRadius: "12px",
      minHeight: "250px"
    },
    mapTitle: {
      fontSize: "0.85rem",
      fontWeight: 600,
      color: "#374151",
      marginBottom: "12px"
    },
    miniMap: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
      gridTemplateRows: "repeat(2, 1fr)",
      gap: "8px",
      height: "180px"
    },
    miniTaluk: {
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s",
      padding: "8px",
      textAlign: "center"
    },
    miniTalukText: {
      fontSize: "0.7rem",
      fontWeight: 600,
      color: "#fff",
      textShadow: "0 1px 2px rgba(0,0,0,0.3)"
    },
    ndviCircle: {
      width: "160px",
      height: "160px",
      borderRadius: "50%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      margin: "20px auto"
    },
    ndviValue: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#fff"
    },
    ndviLabel: {
      fontSize: "0.85rem",
      color: "#fff",
      opacity: 0.9
    },
    statsBox: {
      padding: "20px",
      background: "#f0fdf4",
      borderRadius: "12px"
    },
    statsTitle: {
      fontSize: "0.85rem",
      fontWeight: 600,
      color: "#166534",
      marginBottom: "16px"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
      gap: "12px"
    },
    statCard: {
      padding: "12px",
      background: "#fff",
      borderRadius: "8px",
      textAlign: "center"
    },
    statLabel: {
      fontSize: "0.7rem",
      color: "#6b7280"
    },
    statValue: {
      fontSize: "1.2rem",
      fontWeight: 700,
      marginTop: "4px"
    },
    statChange: {
      fontSize: "0.75rem",
      fontWeight: 600,
      marginTop: "4px",
      padding: "2px 6px",
      borderRadius: "4px",
      display: "inline-block"
    },
    legend: {
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "#f9fafb",
      borderRadius: "8px",
      marginTop: "16px"
    },
    legendItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "0.7rem",
      color: "#6b7280"
    },
    legendColor: {
      width: "12px",
      height: "12px",
      borderRadius: "2px"
    },
    trendChart: {
      marginTop: "20px",
      padding: "16px",
      background: "#f9fafb",
      borderRadius: "12px"
    },
    trendTitle: {
      fontSize: "0.85rem",
      fontWeight: 600,
      color: "#374151",
      marginBottom: "12px"
    },
    trendLine: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-around",
      height: "80px"
    },
    trendPoint: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      flex: 1
    },
    trendDot: {
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      marginBottom: "8px"
    },
    insight: {
      marginTop: "16px",
      padding: "14px 16px",
      background: "#dbeafe",
      borderRadius: "10px",
      display: "flex",
      alignItems: "flex-start",
      gap: "12px"
    },
    insightText: {
      fontSize: "0.85rem",
      color: "#1e40af",
      lineHeight: 1.5
    }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <span style={{ fontSize: "28px" }}>🛰️</span>
          <div>
            <h3 style={styles.titleText}>Satellite NDVI Viewer</h3>
            <p style={styles.subtitle}>Vegetation health from space • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <select 
          style={styles.select}
          value={taluk}
          onChange={(e) => setTaluk(e.target.value)}
        >
          {Object.keys(NDVI_DATA).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      
      {/* Main Display */}
      <div style={styles.mainDisplay}>
        {/* Mini Map */}
        <div style={styles.mapBox}>
          <div style={styles.mapTitle}>🗺️ Palakkad NDVI Map</div>
          <div style={styles.miniMap}>
            {Object.entries(NDVI_DATA).map(([name, d]) => (
              <div
                key={name}
                style={{
                  ...styles.miniTaluk,
                  background: getNDVIColor(d.current),
                  transform: hoveredTaluk === name || taluk === name ? "scale(1.05)" : "scale(1)",
                  boxShadow: taluk === name ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                  border: taluk === name ? "2px solid #fff" : "none"
                }}
                onMouseEnter={() => setHoveredTaluk(name)}
                onMouseLeave={() => setHoveredTaluk(null)}
                onClick={() => setTaluk(name)}
              >
                <span style={styles.miniTalukText}>
                  {name.split(" ")[0]}<br/>
                  {d.current.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* NDVI Gauge */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            ...styles.ndviCircle,
            background: `linear-gradient(135deg, ${getNDVIColor(data.current)}, ${getNDVIColor(data.current)}dd)`
          }}>
            <div style={styles.ndviValue}>{data.current.toFixed(2)}</div>
            <div style={styles.ndviLabel}>NDVI Index</div>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "8px",
            marginTop: "8px"
          }}>
            <span style={{ fontSize: "24px" }}>{getHealthIcon(data.healthStatus)}</span>
            <span style={{ 
              fontSize: "1.1rem", 
              fontWeight: 600, 
              color: data.healthStatus === "Excellent" || data.healthStatus === "Healthy" 
                ? "#166534" 
                : data.healthStatus === "Good" 
                ? "#15803d"
                : "#92400e"
            }}>
              {data.healthStatus}
            </span>
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              ({data.coverage}% area covered)
            </span>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div style={styles.statsBox}>
        <div style={styles.statsTitle}>📊 NDVI Change Analysis - {taluk}</div>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>vs Last Week</div>
            <div style={{ ...styles.statValue, color: weekChange.positive ? "#22c55e" : "#ef4444" }}>
              {weekChange.positive ? "+" : ""}{weekChange.value}%
            </div>
            <span style={{
              ...styles.statChange,
              background: weekChange.positive ? "#dcfce7" : "#fef2f2",
              color: weekChange.positive ? "#166534" : "#991b1b"
            }}>
              {data.lastWeek.toFixed(2)} → {data.current.toFixed(2)}
            </span>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statLabel}>vs Last Month</div>
            <div style={{ ...styles.statValue, color: monthChange.positive ? "#22c55e" : "#ef4444" }}>
              {monthChange.positive ? "+" : ""}{monthChange.value}%
            </div>
            <span style={{
              ...styles.statChange,
              background: monthChange.positive ? "#dcfce7" : "#fef2f2",
              color: monthChange.positive ? "#166534" : "#991b1b"
            }}>
              {data.lastMonth.toFixed(2)} → {data.current.toFixed(2)}
            </span>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statLabel}>vs Same Time Last Year</div>
            <div style={{ ...styles.statValue, color: yearChange.positive ? "#22c55e" : "#ef4444" }}>
              {yearChange.positive ? "+" : ""}{yearChange.value}%
            </div>
            <span style={{
              ...styles.statChange,
              background: yearChange.positive ? "#dcfce7" : "#fef2f2",
              color: yearChange.positive ? "#166534" : "#991b1b"
            }}>
              {data.lastYear.toFixed(2)} → {data.current.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Trend Chart */}
      <div style={styles.trendChart}>
        <div style={styles.trendTitle}>📈 NDVI Seasonal Trend</div>
        <div style={styles.trendLine}>
          {data.trend.map((val, i) => (
            <div key={i} style={styles.trendPoint}>
              <div style={{ fontSize: "0.75rem", color: "#374151", fontWeight: 500 }}>
                {val.toFixed(2)}
              </div>
              <div style={{
                width: "4px",
                height: `${val * 80}px`,
                background: getNDVIColor(val),
                borderRadius: "2px",
                marginBottom: "8px"
              }} />
              <div style={{
                ...styles.trendDot,
                background: getNDVIColor(val)
              }} />
              <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{data.months[i]}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, background: "#d73027" }} />
          {"<0.2 Bare"}
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, background: "#fee08b" }} />
          0.3-0.4 Light
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, background: "#a6d96a" }} />
          0.5-0.6 Good
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, background: "#1a9850" }} />
          0.7-0.8 Dense
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColor, background: "#006837" }} />
          {">0.8 Very Dense"}
        </div>
      </div>
      
      {/* AI Insight */}
      <div style={styles.insight}>
        <span style={{ fontSize: "24px" }}>🤖</span>
        <div style={styles.insightText}>
          <strong>Satellite Analysis:</strong> {taluk} shows {data.healthStatus.toLowerCase()} vegetation with NDVI of {data.current.toFixed(2)}. 
          {data.current > data.lastYear 
            ? ` This is ${((data.current - data.lastYear) / data.lastYear * 100).toFixed(0)}% better than this time last year, indicating improved crop management.`
            : ` Conditions are slightly below last year. Consider increasing fertilizer application or checking for stress factors.`}
          {data.coverage >= 80 
            ? ` High coverage (${data.coverage}%) suggests uniform crop growth.`
            : ` Coverage at ${data.coverage}% - some areas may need attention.`}
        </div>
      </div>
    </div>
  );
}
