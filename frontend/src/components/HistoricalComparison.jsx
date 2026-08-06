/**
 * 📈 Historical Comparison Component
 * Compare current season with past 5 years of data
 */

import { useState } from "react";

// Historical data for Palakkad (simulated based on actual patterns)
const HISTORICAL_DATA = {
  2020: {
    avgTemp: 28.2,
    totalRainfall: 2450,
    yield: 3.8,
    pestIncidence: "moderate",
    stressDays: 18,
    majorEvent: "COVID lockdown affected labor",
    season: { start: "Jun 15", end: "Oct 25" }
  },
  2021: {
    avgTemp: 27.8,
    totalRainfall: 2680,
    yield: 4.1,
    pestIncidence: "low",
    stressDays: 12,
    majorEvent: "Good monsoon, high yield",
    season: { start: "Jun 8", end: "Oct 18" }
  },
  2022: {
    avgTemp: 28.5,
    totalRainfall: 2250,
    yield: 3.6,
    pestIncidence: "high",
    stressDays: 24,
    majorEvent: "BPH outbreak in September",
    season: { start: "Jun 20", end: "Nov 5" }
  },
  2023: {
    avgTemp: 29.1,
    totalRainfall: 2120,
    yield: 3.4,
    pestIncidence: "moderate",
    stressDays: 28,
    majorEvent: "Heat wave in April, delayed sowing",
    season: { start: "Jul 5", end: "Nov 12" }
  },
  2024: {
    avgTemp: 28.8,
    totalRainfall: 2380,
    yield: 4.0,
    pestIncidence: "low",
    stressDays: 15,
    majorEvent: "Normal monsoon, good recovery",
    season: { start: "Jun 12", end: "Oct 22" }
  },
  2025: {
    avgTemp: 28.4,
    totalRainfall: 1850, // Current season partial
    yield: 4.2, // Projected
    pestIncidence: "low",
    stressDays: 10,
    majorEvent: "Current season - AI-based management",
    season: { start: "Jun 10", end: "Ongoing" },
    isCurrent: true
  }
};

export default function HistoricalComparison({ currentYield = 4.2 }) {
  const [selectedMetric, setSelectedMetric] = useState("yield");
  const [hoveredYear, setHoveredYear] = useState(null);
  
  const years = Object.keys(HISTORICAL_DATA).sort();
  const currentYear = "2025";
  
  const metrics = {
    yield: { label: "Yield (t/ha)", key: "yield", color: "#22c55e", unit: "t/ha" },
    rainfall: { label: "Rainfall (mm)", key: "totalRainfall", color: "#3b82f6", unit: "mm" },
    temperature: { label: "Avg Temp (°C)", key: "avgTemp", color: "#f59e0b", unit: "°C" },
    stress: { label: "Stress Days", key: "stressDays", color: "#ef4444", unit: "days" }
  };
  
  const getMaxValue = () => {
    const m = metrics[selectedMetric];
    return Math.max(...years.map(y => HISTORICAL_DATA[y][m.key]));
  };
  
  const get5YearAvg = () => {
    const m = metrics[selectedMetric];
    const pastYears = years.filter(y => y !== currentYear);
    const sum = pastYears.reduce((acc, y) => acc + HISTORICAL_DATA[y][m.key], 0);
    return (sum / pastYears.length).toFixed(1);
  };
  
  const getCurrentValue = () => {
    return HISTORICAL_DATA[currentYear][metrics[selectedMetric].key];
  };
  
  const getComparison = () => {
    const current = getCurrentValue();
    const avg = parseFloat(get5YearAvg());
    const diff = ((current - avg) / avg * 100).toFixed(1);
    return { diff, better: selectedMetric === "stress" ? current < avg : current > avg };
  };
  
  const styles = {
    container: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      border: "1px solid rgba(59, 130, 246, 0.15)",
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
    metricTabs: {
      display: "flex",
      gap: "8px"
    },
    metricTab: {
      padding: "8px 14px",
      borderRadius: "20px",
      border: "1px solid #e5e7eb",
      background: "#fff",
      fontSize: "0.8rem",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
      gap: "16px",
      marginBottom: "24px"
    },
    summaryCard: {
      padding: "16px",
      borderRadius: "12px",
      textAlign: "center"
    },
    summaryLabel: {
      fontSize: "0.8rem",
      color: "#6b7280",
      marginBottom: "4px"
    },
    summaryValue: {
      fontSize: "1.8rem",
      fontWeight: 700
    },
    summaryUnit: {
      fontSize: "0.8rem",
      color: "#6b7280"
    },
    chart: {
      marginBottom: "20px"
    },
    chartTitle: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#374151",
      marginBottom: "16px"
    },
    barChart: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-around",
      height: "160px",
      padding: "0 10px",
      gap: "12px"
    },
    barGroup: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    bar: {
      width: "100%",
      maxWidth: "50px",
      borderRadius: "6px 6px 0 0",
      transition: "all 0.3s ease",
      cursor: "pointer"
    },
    barValue: {
      fontSize: "0.75rem",
      fontWeight: 600,
      marginBottom: "4px"
    },
    barLabel: {
      fontSize: "0.8rem",
      color: "#6b7280",
      marginTop: "8px"
    },
    timeline: {
      marginTop: "24px"
    },
    timelineTitle: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#374151",
      marginBottom: "12px"
    },
    timelineGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
      gap: "12px"
    },
    timelineCard: {
      padding: "14px",
      background: "#f9fafb",
      borderRadius: "10px",
      border: "1px solid #e5e7eb",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    timelineYear: {
      fontSize: "1rem",
      fontWeight: 700,
      color: "#1f2937"
    },
    timelineEvent: {
      fontSize: "0.8rem",
      color: "#6b7280",
      marginTop: "4px"
    },
    timelineStats: {
      display: "flex",
      gap: "12px",
      marginTop: "8px",
      fontSize: "0.75rem"
    },
    insightBox: {
      marginTop: "20px",
      padding: "16px",
      background: "#f0fdf4",
      borderRadius: "12px",
      border: "1px solid #bbf7d0"
    },
    insightTitle: {
      fontSize: "0.85rem",
      fontWeight: 600,
      color: "#166534",
      marginBottom: "8px"
    },
    insightText: {
      fontSize: "0.85rem",
      color: "#374151",
      lineHeight: 1.6
    }
  };
  
  const maxVal = getMaxValue();
  const comparison = getComparison();
  const m = metrics[selectedMetric];
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <span style={{ fontSize: "28px" }}>📈</span>
          <div>
            <h3 style={styles.titleText}>Historical Comparison</h3>
            <p style={styles.subtitle}>Compare with past 5 years</p>
          </div>
        </div>
        
        <div style={styles.metricTabs}>
          {Object.entries(metrics).map(([key, metric]) => (
            <button
              key={key}
              style={{
                ...styles.metricTab,
                ...(selectedMetric === key ? {
                  background: metric.color,
                  color: "#fff",
                  borderColor: metric.color
                } : {})
              }}
              onClick={() => setSelectedMetric(key)}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={{ ...styles.summaryCard, background: "#f0fdf4" }}>
          <div style={styles.summaryLabel}>Current Season (2025)</div>
          <div style={{ ...styles.summaryValue, color: m.color }}>
            {getCurrentValue()}
          </div>
          <div style={styles.summaryUnit}>{m.unit}</div>
        </div>
        
        <div style={{ ...styles.summaryCard, background: "#f9fafb" }}>
          <div style={styles.summaryLabel}>5-Year Average</div>
          <div style={{ ...styles.summaryValue, color: "#6b7280" }}>
            {get5YearAvg()}
          </div>
          <div style={styles.summaryUnit}>{m.unit}</div>
        </div>
        
        <div style={{ 
          ...styles.summaryCard, 
          background: comparison.better ? "#f0fdf4" : "#fef2f2" 
        }}>
          <div style={styles.summaryLabel}>vs Average</div>
          <div style={{ 
            ...styles.summaryValue, 
            color: comparison.better ? "#22c55e" : "#ef4444" 
          }}>
            {comparison.diff > 0 ? "+" : ""}{comparison.diff}%
          </div>
          <div style={styles.summaryUnit}>
            {comparison.better ? "Better" : "Below"} than average
          </div>
        </div>
      </div>
      
      {/* Bar Chart */}
      <div style={styles.chart}>
        <div style={styles.chartTitle}>
          📊 {m.label} Trend (2020-2025)
        </div>
        <div style={styles.barChart}>
          {years.map(year => {
            const value = HISTORICAL_DATA[year][m.key];
            const height = (value / maxVal) * 100;
            const isCurrent = year === currentYear;
            const isHovered = hoveredYear === year;
            
            return (
              <div 
                key={year} 
                style={styles.barGroup}
                onMouseEnter={() => setHoveredYear(year)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                <div style={{ ...styles.barValue, color: m.color }}>
                  {value}
                </div>
                <div style={{
                  ...styles.bar,
                  height: `${height}%`,
                  background: isCurrent 
                    ? `linear-gradient(to top, ${m.color}, ${m.color}dd)`
                    : isHovered
                    ? m.color + "80"
                    : "#e5e7eb",
                  boxShadow: isCurrent ? `0 4px 12px ${m.color}40` : "none",
                  transform: isHovered ? "scaleY(1.05)" : "scaleY(1)"
                }} />
                <div style={{
                  ...styles.barLabel,
                  fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? m.color : "#6b7280"
                }}>
                  {year}
                  {isCurrent && " ★"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Year Details Timeline */}
      <div style={styles.timeline}>
        <div style={styles.timelineTitle}>📅 Season Summary</div>
        <div style={styles.timelineGrid}>
          {years.slice(-3).reverse().map(year => {
            const data = HISTORICAL_DATA[year];
            return (
              <div 
                key={year}
                style={{
                  ...styles.timelineCard,
                  ...(data.isCurrent ? {
                    background: "#f0fdf4",
                    borderColor: "#22c55e"
                  } : {})
                }}
              >
                <div style={styles.timelineYear}>
                  {data.isCurrent ? "🌟 " : ""}{year}
                </div>
                <div style={styles.timelineEvent}>{data.majorEvent}</div>
                <div style={styles.timelineStats}>
                  <span>🌾 {data.yield} t/ha</span>
                  <span>🌧️ {data.totalRainfall}mm</span>
                  <span>🐛 {data.pestIncidence}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* AI Insight */}
      <div style={styles.insightBox}>
        <div style={styles.insightTitle}>🤖 AI Insight</div>
        <div style={styles.insightText}>
          {selectedMetric === "yield" && (
            <>Current projected yield of {getCurrentValue()} t/ha is {Math.abs(parseFloat(comparison.diff))}% 
            {comparison.better ? " above" : " below"} the 5-year average. 
            {comparison.better 
              ? " AI-driven recommendations and favorable weather are contributing to improved yields."
              : " Consider adjusting fertilizer application and pest management strategies."}</>
          )}
          {selectedMetric === "rainfall" && (
            <>Rainfall patterns show 
            {getCurrentValue() < parseFloat(get5YearAvg()) 
              ? " below-normal precipitation. Ensure supplemental irrigation is planned."
              : " adequate moisture. Maintain proper drainage to prevent waterlogging."}</>
          )}
          {selectedMetric === "temperature" && (
            <>Average temperature of {getCurrentValue()}°C is 
            {getCurrentValue() > parseFloat(get5YearAvg())
              ? " slightly higher than normal. Monitor for heat stress during flowering."
              : " within optimal range for rice cultivation."}</>
          )}
          {selectedMetric === "stress" && (
            <>With only {getCurrentValue()} stress days so far, this season shows 
            {comparison.better
              ? " significantly improved conditions compared to previous years."
              : " some challenges that need attention."} 
            AI-based early warnings have helped reduce crop stress events.</>
          )}
        </div>
      </div>
    </div>
  );
}
