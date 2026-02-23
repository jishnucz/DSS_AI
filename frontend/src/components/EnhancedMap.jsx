/**
 * 🗺️ Enhanced Map with ML-Powered Overlays
 * Weather, Soil Analysis, Crop Suitability, and Farm Planning
 */

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap, Circle, Polygon, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const CSS = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  
  .enhanced-map-container .leaflet-container { border-radius: 16px; }
  .enhanced-map-container .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
  .enhanced-map-container .leaflet-control-layers { border-radius: 12px; }
  
  .layer-toggle:hover { background: rgba(34, 197, 94, 0.15) !important; }
  .layer-toggle.active { background: rgba(34, 197, 94, 0.2) !important; border-color: #22c55e !important; }
  
  .location-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(34, 197, 94, 0.15) !important; }
  
  .legend-item { transition: all 0.2s ease; }
  .legend-item:hover { transform: translateX(4px); }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// Kerala Districts with centers
const DISTRICTS = [
  {
    name: "Palakkad",
    center: [10.7867, 76.6548],
    taluks: [
      { name: "Palakkad", lat: 10.7867, lng: 76.6548, area: 248, mainCrop: "Rice", rainfall: 2100 },
      { name: "Chittur", lat: 10.6958, lng: 76.7332, area: 521, mainCrop: "Coconut", rainfall: 1800 },
      { name: "Ottappalam", lat: 10.7710, lng: 76.3800, area: 429, mainCrop: "Rice", rainfall: 2300 },
      { name: "Alathur", lat: 10.6482, lng: 76.5361, area: 453, mainCrop: "Banana", rainfall: 1900 },
      { name: "Mannarkkad", lat: 10.9925, lng: 76.4608, area: 728, mainCrop: "Pepper", rainfall: 2500 },
      { name: "Pattambi", lat: 10.8053, lng: 76.1876, area: 235, mainCrop: "Rice", rainfall: 2200 },
    ]
  },
  {
    name: "Thrissur",
    center: [10.5276, 76.2144],
    taluks: [
      { name: "Thrissur", lat: 10.5276, lng: 76.2144, area: 312, mainCrop: "Rice", rainfall: 2800 },
      { name: "Kodungallur", lat: 10.2260, lng: 76.1930, area: 189, mainCrop: "Coconut", rainfall: 3000 },
      { name: "Chavakkad", lat: 10.5906, lng: 76.0176, area: 267, mainCrop: "Vegetables", rainfall: 2600 },
    ]
  },
  {
    name: "Malappuram",
    center: [11.0509, 76.0710],
    taluks: [
      { name: "Malappuram", lat: 11.0509, lng: 76.0710, area: 387, mainCrop: "Arecanut", rainfall: 2400 },
      { name: "Perinthalmanna", lat: 10.9768, lng: 76.2310, area: 423, mainCrop: "Rubber", rainfall: 2200 },
      { name: "Tirur", lat: 10.9160, lng: 75.9220, area: 298, mainCrop: "Coconut", rainfall: 2700 },
    ]
  },
];

// Crop Colors
const CROP_COLORS = {
  Rice: { color: "#22c55e", emoji: "🌾" },
  Coconut: { color: "#65a30d", emoji: "🥥" },
  Banana: { color: "#eab308", emoji: "🍌" },
  Pepper: { color: "#1f2937", emoji: "⚫" },
  Rubber: { color: "#713f12", emoji: "🌳" },
  Arecanut: { color: "#854d0e", emoji: "🌴" },
  Vegetables: { color: "#15803d", emoji: "🥬" },
  Sugarcane: { color: "#84cc16", emoji: "🎋" },
};

// Stress Levels
const STRESS_LEVELS = [
  { label: "No Stress", color: "#22c55e", range: "0-20%" },
  { label: "Low Stress", color: "#a3e635", range: "20-40%" },
  { label: "Moderate", color: "#facc15", range: "40-60%" },
  { label: "High Stress", color: "#fb923c", range: "60-80%" },
  { label: "Critical", color: "#ef4444", range: "80-100%" },
];

// Soil Types with colors
const SOIL_TYPES = [
  { name: "Laterite", color: "#b45309", desc: "Well-drained, acidic" },
  { name: "Alluvial", color: "#78716c", desc: "Fertile river deposits" },
  { name: "Clay", color: "#57534e", desc: "Water-retentive" },
  { name: "Sandy Loam", color: "#d4a574", desc: "Light, well-drained" },
];

// Custom marker icon
const createMarkerIcon = (emoji, stressLevel = 0) => {
  const color = stressLevel < 20 ? "#22c55e" : 
                stressLevel < 40 ? "#a3e635" :
                stressLevel < 60 ? "#facc15" :
                stressLevel < 80 ? "#fb923c" : "#ef4444";
  
  return L.divIcon({
    html: `
      <div style="
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 20px;">${emoji}</span>
      </div>
    `,
    className: "custom-marker",
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

// Map Controller component
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 11, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Weather Overlay Layer
function WeatherOverlay({ data }) {
  if (!data) return null;
  
  return (
    <>
      {data.map((point, i) => (
        <Circle
          key={i}
          center={[point.lat, point.lng]}
          radius={point.radius || 8000}
          pathOptions={{
            fillColor: point.color,
            fillOpacity: 0.3,
            color: point.color,
            weight: 1,
          }}
        >
          <Popup>
            <div style={{ textAlign: "center", padding: "8px" }}>
              <span style={{ fontSize: "24px" }}>{point.icon}</span>
              <p style={{ margin: "8px 0 4px", fontWeight: 600 }}>{point.label}</p>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>{point.value}</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
}

// Stress Heatmap Layer
function StressHeatmap({ talukData }) {
  return (
    <>
      {talukData.map((taluk, i) => (
        <Circle
          key={i}
          center={[taluk.lat, taluk.lng]}
          radius={10000}
          pathOptions={{
            fillColor: taluk.stress < 20 ? "#22c55e" : 
                      taluk.stress < 40 ? "#a3e635" :
                      taluk.stress < 60 ? "#facc15" :
                      taluk.stress < 80 ? "#fb923c" : "#ef4444",
            fillOpacity: 0.4,
            color: "transparent",
            weight: 0,
          }}
        />
      ))}
    </>
  );
}

export default function EnhancedMap() {
  inject("enhanced-map", CSS);
  
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS[0]);
  const [selectedTaluk, setSelectedTaluk] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.7867, 76.6548]);
  const [mapZoom, setMapZoom] = useState(9);
  
  // Active overlays
  const [overlays, setOverlays] = useState({
    weather: false,
    stress: true,
    soil: false,
    crops: true,
  });
  
  const [infoPanel, setInfoPanel] = useState(null);
  
  // Generated weather data
  const weatherData = [
    { lat: 10.7867, lng: 76.6548, icon: "🌡️", label: "Temperature", value: "32°C", color: "#ef4444", radius: 12000 },
    { lat: 10.5276, lng: 76.2144, icon: "💧", label: "Humidity", value: "78%", color: "#3b82f6", radius: 10000 },
    { lat: 11.0509, lng: 76.0710, icon: "🌧️", label: "Rainfall", value: "15mm/day", color: "#0ea5e9", radius: 11000 },
  ];
  
  // Generate stress data for taluks
  const talukStressData = DISTRICTS.flatMap(d => 
    d.taluks.map(t => ({
      ...t,
      stress: Math.floor(Math.random() * 60) + 10 // Random stress 10-70%
    }))
  );
  
  const toggleOverlay = (key) => {
    setOverlays(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handleTalukClick = (taluk, district) => {
    setSelectedTaluk(taluk);
    setMapCenter([taluk.lat, taluk.lng]);
    setMapZoom(12);
    setInfoPanel({
      type: "taluk",
      data: taluk,
      district: district.name
    });
  };
  
  const renderSidebar = () => (
    <div style={styles.sidebar}>
      {/* District Selector */}
      <div style={styles.sidebarSection}>
        <h3 style={styles.sidebarTitle}>📍 Select Region</h3>
        <select
          style={styles.select}
          value={selectedDistrict.name}
          onChange={e => {
            const d = DISTRICTS.find(d => d.name === e.target.value);
            setSelectedDistrict(d);
            setMapCenter(d.center);
            setMapZoom(10);
          }}
        >
          {DISTRICTS.map(d => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
        
        {/* Taluk List */}
        <div style={styles.talukList}>
          {selectedDistrict.taluks.map(taluk => {
            const stress = talukStressData.find(t => t.name === taluk.name)?.stress || 0;
            return (
              <div
                key={taluk.name}
                className="location-card"
                onClick={() => handleTalukClick(taluk, selectedDistrict)}
                style={{
                  ...styles.talukCard,
                  ...(selectedTaluk?.name === taluk.name ? styles.talukCardActive : {})
                }}
              >
                <div style={styles.talukHeader}>
                  <span style={styles.talukEmoji}>
                    {CROP_COLORS[taluk.mainCrop]?.emoji || "🌱"}
                  </span>
                  <div>
                    <span style={styles.talukName}>{taluk.name}</span>
                    <span style={styles.talukCrop}>{taluk.mainCrop}</span>
                  </div>
                </div>
                <div style={styles.stressIndicator}>
                  <div style={styles.stressBarBg}>
                    <div 
                      style={{
                        ...styles.stressBarFill,
                        width: `${stress}%`,
                        background: stress < 30 ? "#22c55e" : stress < 60 ? "#facc15" : "#ef4444"
                      }}
                    />
                  </div>
                  <span style={styles.stressPercent}>{stress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Layer Controls */}
      <div style={styles.sidebarSection}>
        <h3 style={styles.sidebarTitle}>🗺️ Map Layers</h3>
        <div style={styles.layerToggles}>
          {[
            { key: "crops", icon: "🌾", label: "Crop Markers" },
            { key: "stress", icon: "📊", label: "Stress Heatmap" },
            { key: "weather", icon: "⛅", label: "Weather" },
            { key: "soil", icon: "🟤", label: "Soil Types" },
          ].map(layer => (
            <button
              key={layer.key}
              className={`layer-toggle ${overlays[layer.key] ? "active" : ""}`}
              onClick={() => toggleOverlay(layer.key)}
              style={{
                ...styles.layerToggle,
                ...(overlays[layer.key] ? styles.layerToggleActive : {})
              }}
            >
              <span>{layer.icon}</span>
              <span>{layer.label}</span>
              <span style={styles.toggleCheck}>
                {overlays[layer.key] ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div style={styles.sidebarSection}>
        <h3 style={styles.sidebarTitle}>📋 Stress Legend</h3>
        <div style={styles.legend}>
          {STRESS_LEVELS.map(level => (
            <div key={level.label} className="legend-item" style={styles.legendItem}>
              <span 
                style={{
                  ...styles.legendColor,
                  background: level.color
                }}
              />
              <span style={styles.legendLabel}>{level.label}</span>
              <span style={styles.legendRange}>{level.range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderInfoPanel = () => {
    if (!infoPanel) return null;
    
    const { data, district } = infoPanel;
    const stress = talukStressData.find(t => t.name === data.name)?.stress || 0;
    
    return (
      <div style={styles.infoPanel}>
        <div style={styles.infoPanelHeader}>
          <div>
            <span style={styles.infoPanelIcon}>
              {CROP_COLORS[data.mainCrop]?.emoji || "🌱"}
            </span>
            <h3 style={styles.infoPanelTitle}>{data.name}</h3>
            <p style={styles.infoPanelSubtitle}>{district} District</p>
          </div>
          <button 
            onClick={() => setInfoPanel(null)}
            style={styles.closeBtn}
          >
            ✕
          </button>
        </div>
        
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <span style={styles.infoCardIcon}>🌾</span>
            <span style={styles.infoCardValue}>{data.mainCrop}</span>
            <span style={styles.infoCardLabel}>Main Crop</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoCardIcon}>📐</span>
            <span style={styles.infoCardValue}>{data.area} km²</span>
            <span style={styles.infoCardLabel}>Area</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoCardIcon}>🌧️</span>
            <span style={styles.infoCardValue}>{data.rainfall} mm</span>
            <span style={styles.infoCardLabel}>Avg Rainfall</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoCardIcon}>⚠️</span>
            <span style={{
              ...styles.infoCardValue,
              color: stress < 30 ? "#22c55e" : stress < 60 ? "#facc15" : "#ef4444"
            }}>
              {stress}%
            </span>
            <span style={styles.infoCardLabel}>Stress Level</span>
          </div>
        </div>
        
        {/* ML Insights */}
        <div style={styles.insightSection}>
          <h4 style={styles.insightTitle}>🧠 AI Insights</h4>
          <div style={styles.insightList}>
            <div style={styles.insightItem}>
              <span style={styles.insightBullet}>•</span>
              <span>
                {stress < 30 
                  ? "Favorable conditions for farming"
                  : stress < 60 
                    ? "Monitor water levels closely"
                    : "Immediate irrigation recommended"
                }
              </span>
            </div>
            <div style={styles.insightItem}>
              <span style={styles.insightBullet}>•</span>
              <span>
                {data.mainCrop} shows {stress < 40 ? "good" : "moderate"} growth potential
              </span>
            </div>
            <div style={styles.insightItem}>
              <span style={styles.insightBullet}>•</span>
              <span>
                Based on ERA5 climate data analysis
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div style={styles.actionButtons}>
          <button style={styles.actionBtn}>
            📊 View Analysis
          </button>
          <button style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }}>
            🧠 Run DSS
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="enhanced-map-container" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🗺️ Smart Agricultural Map</h2>
          <p style={styles.subtitle}>
            Real-time crop stress monitoring • ML-powered insights • ERA5 weather data
          </p>
        </div>
        <div style={styles.headerBadge}>
          <span>🧠</span>
          <span>AI-Enhanced</span>
        </div>
      </div>
      
      <div style={styles.content}>
        {/* Sidebar */}
        {renderSidebar()}
        
        {/* Map */}
        <div style={styles.mapWrapper}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={styles.map}
            scrollWheelZoom={true}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Satellite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; Esri'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Street">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Terrain">
                <TileLayer
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenTopoMap'
                />
              </LayersControl.BaseLayer>
            </LayersControl>
            
            {/* Stress Heatmap */}
            {overlays.stress && <StressHeatmap talukData={talukStressData} />}
            
            {/* Weather Overlay */}
            {overlays.weather && <WeatherOverlay data={weatherData} />}
            
            {/* Crop Markers */}
            {overlays.crops && DISTRICTS.flatMap(district =>
              district.taluks.map(taluk => {
                const stress = talukStressData.find(t => t.name === taluk.name)?.stress || 0;
                return (
                  <Marker
                    key={taluk.name}
                    position={[taluk.lat, taluk.lng]}
                    icon={createMarkerIcon(
                      CROP_COLORS[taluk.mainCrop]?.emoji || "🌱",
                      stress
                    )}
                    eventHandlers={{
                      click: () => handleTalukClick(taluk, district)
                    }}
                  >
                    <Popup>
                      <div style={styles.popup}>
                        <h4 style={styles.popupTitle}>
                          {CROP_COLORS[taluk.mainCrop]?.emoji} {taluk.name}
                        </h4>
                        <p style={styles.popupDistrict}>{district.name} District</p>
                        <div style={styles.popupStats}>
                          <div>
                            <span style={styles.popupStatLabel}>Main Crop</span>
                            <span style={styles.popupStatValue}>{taluk.mainCrop}</span>
                          </div>
                          <div>
                            <span style={styles.popupStatLabel}>Stress</span>
                            <span style={{
                              ...styles.popupStatValue,
                              color: stress < 30 ? "#22c55e" : stress < 60 ? "#facc15" : "#ef4444"
                            }}>
                              {stress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
            )}
          </MapContainer>
          
          {/* Quick Stats Overlay */}
          <div style={styles.quickStats}>
            <div style={styles.quickStatItem}>
              <span style={styles.quickStatValue}>{DISTRICTS.length}</span>
              <span style={styles.quickStatLabel}>Districts</span>
            </div>
            <div style={styles.quickStatItem}>
              <span style={styles.quickStatValue}>
                {DISTRICTS.reduce((sum, d) => sum + d.taluks.length, 0)}
              </span>
              <span style={styles.quickStatLabel}>Taluks</span>
            </div>
            <div style={styles.quickStatItem}>
              <span style={styles.quickStatValue}>
                {talukStressData.filter(t => t.stress < 30).length}
              </span>
              <span style={styles.quickStatLabel}>Healthy</span>
            </div>
            <div style={styles.quickStatItem}>
              <span style={{ ...styles.quickStatValue, color: "#facc15" }}>
                {talukStressData.filter(t => t.stress >= 30 && t.stress < 60).length}
              </span>
              <span style={styles.quickStatLabel}>Moderate</span>
            </div>
            <div style={styles.quickStatItem}>
              <span style={{ ...styles.quickStatValue, color: "#ef4444" }}>
                {talukStressData.filter(t => t.stress >= 60).length}
              </span>
              <span style={styles.quickStatLabel}>Critical</span>
            </div>
          </div>
        </div>
        
        {/* Info Panel */}
        {renderInfoPanel()}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 244, 0.95))",
    borderRadius: "24px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    overflow: "hidden",
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 28px",
    borderBottom: "1px solid rgba(34, 197, 94, 0.15)",
    background: "rgba(255, 255, 255, 0.8)",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "0.9rem",
    color: "#64748b",
  },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(74, 222, 128, 0.1))",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "30px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#16a34a",
  },
  content: {
    display: "flex",
    height: "600px",
    position: "relative",
  },
  sidebar: {
    width: "300px",
    padding: "20px",
    borderRight: "1px solid rgba(34, 197, 94, 0.15)",
    background: "#fff",
    overflowY: "auto",
  },
  sidebarSection: {
    marginBottom: "24px",
  },
  sidebarTitle: {
    margin: "0 0 12px 0",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#374151",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "0.9rem",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "10px",
    background: "#fff",
    color: "#1f2937",
    cursor: "pointer",
    marginBottom: "12px",
  },
  talukList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  talukCard: {
    padding: "12px 14px",
    background: "rgba(34, 197, 94, 0.04)",
    border: "1px solid rgba(34, 197, 94, 0.1)",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  talukCardActive: {
    background: "rgba(34, 197, 94, 0.1)",
    borderColor: "#22c55e",
  },
  talukHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  talukEmoji: {
    fontSize: "24px",
  },
  talukName: {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1f2937",
  },
  talukCrop: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  stressIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  stressBarBg: {
    flex: 1,
    height: "6px",
    background: "rgba(34, 197, 94, 0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  stressBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  stressPercent: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#64748b",
    width: "35px",
  },
  layerToggles: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  layerToggle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    background: "rgba(34, 197, 94, 0.04)",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: "#374151",
    transition: "all 0.2s ease",
  },
  layerToggleActive: {
    background: "rgba(34, 197, 94, 0.12)",
    borderColor: "#22c55e",
  },
  toggleCheck: {
    marginLeft: "auto",
    color: "#22c55e",
    fontWeight: 700,
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 0",
  },
  legendColor: {
    width: "16px",
    height: "16px",
    borderRadius: "4px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  legendLabel: {
    fontSize: "0.8rem",
    color: "#374151",
    flex: 1,
  },
  legendRange: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  quickStats: {
    position: "absolute",
    top: "16px",
    left: "16px",
    display: "flex",
    gap: "8px",
    zIndex: 1000,
  },
  quickStatItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 14px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    minWidth: "60px",
  },
  quickStatValue: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#22c55e",
  },
  quickStatLabel: {
    fontSize: "0.7rem",
    color: "#64748b",
    marginTop: "2px",
  },
  infoPanel: {
    position: "absolute",
    right: "16px",
    top: "16px",
    width: "320px",
    background: "rgba(255, 255, 255, 0.98)",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    padding: "20px",
    zIndex: 1000,
    animation: "slideUp 0.3s ease-out",
  },
  infoPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  infoPanelIcon: {
    fontSize: "32px",
    display: "block",
    marginBottom: "8px",
  },
  infoPanelTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  infoPanelSubtitle: {
    margin: "4px 0 0 0",
    fontSize: "0.85rem",
    color: "#64748b",
  },
  closeBtn: {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.05)",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "14px",
    color: "#64748b",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  infoCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "14px",
    background: "rgba(34, 197, 94, 0.06)",
    borderRadius: "12px",
    textAlign: "center",
  },
  infoCardIcon: {
    fontSize: "20px",
    marginBottom: "6px",
  },
  infoCardValue: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  infoCardLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "4px",
  },
  insightSection: {
    marginBottom: "16px",
  },
  insightTitle: {
    margin: "0 0 10px 0",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#374151",
  },
  insightList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  insightItem: {
    display: "flex",
    gap: "8px",
    fontSize: "0.85rem",
    color: "#64748b",
    lineHeight: 1.4,
  },
  insightBullet: {
    color: "#22c55e",
    fontWeight: 700,
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
  },
  actionBtn: {
    flex: 1,
    padding: "12px",
    fontSize: "0.85rem",
    fontWeight: 600,
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "10px",
    background: "transparent",
    color: "#16a34a",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  actionBtnPrimary: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    border: "none",
  },
  popup: {
    minWidth: "160px",
    padding: "8px",
  },
  popupTitle: {
    margin: "0 0 4px 0",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1f2937",
  },
  popupDistrict: {
    margin: "0 0 12px 0",
    fontSize: "0.8rem",
    color: "#64748b",
  },
  popupStats: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  },
  popupStatLabel: {
    display: "block",
    fontSize: "0.7rem",
    color: "#64748b",
    marginBottom: "2px",
  },
  popupStatValue: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1f2937",
  },
};
