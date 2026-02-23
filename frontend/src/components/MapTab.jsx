import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "../LanguageContext";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
  
  .leaflet-container {
    height: 100%;
    width: 100%;
    border-radius: 20px;
    font-family: 'Inter', sans-serif !important;
  }
  
  .leaflet-popup-content-wrapper {
    background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,253,244,0.95) 100%);
    border: 1px solid rgba(34, 197, 94, 0.25);
    border-radius: 18px;
    box-shadow: 0 12px 40px rgba(34, 197, 94, 0.15);
    padding: 0;
  }
  
  .leaflet-popup-content {
    margin: 0;
    color: #1e293b;
    min-width: 220px;
  }
  
  .leaflet-popup-tip {
    background: rgba(255,255,255,0.98);
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
  
  .leaflet-control-zoom a {
    background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,253,244,0.95) 100%) !important;
    border: 1px solid rgba(34, 197, 94, 0.25) !important;
    color: #22c55e !important;
    font-weight: bold;
  }
  
  .leaflet-control-zoom a:hover {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
    color: #FFFFFF !important;
  }
  
  .custom-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-radius: 50%;
    border: 3px solid #FFFFFF;
    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.5);
    font-size: 18px;
    animation: markerPulse 2s infinite;
    cursor: pointer;
    transition: transform 0.3s ease;
  }
  
  .custom-marker:hover {
    transform: scale(1.2);
  }
  
  @keyframes markerPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
    50% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
  }
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .taluk-popup {
    animation: fadeInUp 0.3s ease;
  }
  
  .crop-pill {
    display: inline-block;
    padding: 4px 10px;
    margin: 3px;
    background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
    border: 1px solid rgba(34, 197, 94, 0.35);
    border-radius: 20px;
    font-size: 11px;
    color: #16a34a;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  
  .crop-pill:hover {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: #FFFFFF;
    transform: scale(1.05);
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

// Custom marker icon creator
const createCustomIcon = (emoji) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="custom-marker">${emoji}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -25],
  });
};

// Map controller component for flying to locations
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Taluk emoji mapping
const talukEmojis = {
  "Palakkad": "🏛️",
  "Chittur": "🌾",
  "Ottappalam": "🌴",
  "Alathur": "🌿",
  "Mannarkkad": "🌲",
  "Pattambi": "🍚",
  "Sreekrishnapuram": "🌻",
  "Attappadi": "🏔️",
};

// Crop emoji mapping
const cropEmojis = {
  "Rice": "🌾",
  "Coconut": "🥥",
  "Sugarcane": "🍬",
  "Turmeric": "🟡",
  "Banana": "🍌",
  "Vegetables": "🥬",
  "Arecanut": "🌴",
  "Groundnut": "🥜",
  "Cotton": "☁️",
  "Tapioca": "🥔",
  "Millets": "🌿",
  "Pepper": "⚫",
  "Coffee": "☕",
  "Cardamom": "💚",
  "Jackfruit": "🍈",
  "Rubber": "🌳",
  "Mango": "🥭",
  "Ginger": "🫚",
};

export default function MapTab() {
  inject("map-tab-leaflet", CSS);
  const { t } = useLanguage();
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaluk, setSelectedTaluk] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.7867, 76.6548]);
  const [mapZoom, setMapZoom] = useState(10);
  const [viewMode, setViewMode] = useState("satellite");
  const [dssInsights, setDssInsights] = useState(null);
  const [dssLoading, setDssLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/map-data")
      .then((res) => res.json())
      .then((data) => {
        setMapData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load map data:", err);
        setLoading(false);
      });
  }, []);

  const handleTalukClick = async (taluk) => {
    setSelectedTaluk(taluk);
    setMapCenter([taluk.lat, taluk.lng]);
    setMapZoom(13);
    
    // Fetch DSS quick insights
    setDssLoading(true);
    setDssInsights(null);
    const primaryCrop = taluk.crops[0] || "Rice";
    try {
      const res = await fetch(`http://localhost:8000/dss-quick/${taluk.name}/${primaryCrop}`);
      if (res.ok) {
        const data = await res.json();
        setDssInsights(data);
      }
    } catch (err) {
      console.error("Failed to fetch DSS insights:", err);
    } finally {
      setDssLoading(false);
    }
  };

  const resetView = () => {
    setSelectedTaluk(null);
    setDssInsights(null);
    setMapCenter([10.7867, 76.6548]);
    setMapZoom(10);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingIcon}>🛰️</div>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>{t("loadingMapData")}</p>
        <p style={styles.loadingSubtext}>Initializing satellite view...</p>
      </div>
    );
  }

  if (!mapData || !mapData.taluks) {
    return (
      <div style={styles.error}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{t("failed")}</p>
        <button style={styles.retryButton} onClick={() => window.location.reload()}>
          🔄 Retry
        </button>
      </div>
    );
  }

  // Tile layer configurations
  const tileLayers = {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri",
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenTopoMap",
    },
    street: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>🛰️ {t("mapTitle")}</h1>
          <p style={styles.subtitle}>
            Interactive Satellite View • {mapData.taluks.length} Taluks • {mapData.district}, {mapData.state}
          </p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.viewToggle}>
            <button
              style={{ ...styles.viewButton, ...(viewMode === "satellite" ? styles.viewButtonActive : {}) }}
              onClick={() => setViewMode("satellite")}
            >
              🛰️ Satellite
            </button>
            <button
              style={{ ...styles.viewButton, ...(viewMode === "terrain" ? styles.viewButtonActive : {}) }}
              onClick={() => setViewMode("terrain")}
            >
              ⛰️ Terrain
            </button>
            <button
              style={{ ...styles.viewButton, ...(viewMode === "street" ? styles.viewButtonActive : {}) }}
              onClick={() => setViewMode("street")}
            >
              🗺️ Street
            </button>
          </div>
          {selectedTaluk && (
            <button style={styles.resetButton} onClick={resetView}>
              🔙 Reset View
            </button>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* Side Panel - Taluk List */}
        <div style={styles.sidePanel}>
          <h3 style={styles.panelTitle}>📍 Regional Taluks</h3>
          <div style={styles.talukList}>
            {mapData.taluks.map((taluk, index) => (
              <div
                key={taluk.name}
                style={{
                  ...styles.talukCard,
                  ...(selectedTaluk?.name === taluk.name ? styles.talukCardActive : {}),
                }}
                onClick={() => handleTalukClick(taluk)}
              >
                <div style={styles.talukHeader}>
                  <span style={styles.talukEmoji}>{talukEmojis[taluk.name] || "📍"}</span>
                  <span style={styles.talukName}>{taluk.name}</span>
                </div>
                <div style={styles.talukCrops}>
                  {taluk.crops.slice(0, 3).map((crop) => (
                    <span key={crop} style={styles.cropTag}>
                      {cropEmojis[crop] || "🌱"} {crop}
                    </span>
                  ))}
                  {taluk.crops.length > 3 && (
                    <span style={styles.moreTag}>+{taluk.crops.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div style={styles.mapWrapper}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={styles.map}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            
            <TileLayer
              key={viewMode}
              url={tileLayers[viewMode].url}
              attribution={tileLayers[viewMode].attribution}
              maxZoom={19}
            />

            {/* Taluk Markers */}
            {mapData.taluks.map((taluk) => (
              <Marker
                key={taluk.name}
                position={[taluk.lat, taluk.lng]}
                icon={createCustomIcon(talukEmojis[taluk.name] || "📍")}
                eventHandlers={{
                  click: () => handleTalukClick(taluk),
                }}
              >
                <Popup>
                  <div className="taluk-popup" style={popupStyles.container}>
                    <div style={popupStyles.header}>
                      <span style={popupStyles.emoji}>{talukEmojis[taluk.name] || "📍"}</span>
                      <h3 style={popupStyles.title}>{taluk.name}</h3>
                    </div>
                    <div style={popupStyles.info}>
                      <p style={popupStyles.label}>📊 Population: <span style={popupStyles.value}>{taluk.population}</span></p>
                      <p style={popupStyles.label}>📍 Coordinates:</p>
                      <p style={popupStyles.coords}>{taluk.lat.toFixed(4)}°N, {taluk.lng.toFixed(4)}°E</p>
                    </div>
                    <div style={popupStyles.cropsSection}>
                      <p style={popupStyles.cropsTitle}>🌾 Major Crops:</p>
                      <div style={popupStyles.cropsList}>
                        {taluk.crops.map((crop) => (
                          <span key={crop} className="crop-pill">
                            {cropEmojis[crop] || "🌱"} {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Popup>
                <Circle
                  center={[taluk.lat, taluk.lng]}
                  radius={3000}
                  pathOptions={{
                    color: "#22c55e",
                    fillColor: "#22c55e",
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                />
              </Marker>
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div style={styles.legend}>
            <h4 style={styles.legendTitle}>🎯 Legend</h4>
            <div style={styles.legendItem}>
              <span style={styles.legendDot}></span>
              <span>Taluk Center</span>
            </div>
            <div style={styles.legendItem}>
              <span style={styles.legendCircle}></span>
              <span>Coverage Area (3km)</span>
            </div>
          </div>

          {/* Selected Taluk Info Card */}
          {selectedTaluk && (
            <div style={styles.infoCard}>
              <div style={styles.infoHeader}>
                <span style={styles.infoEmoji}>{talukEmojis[selectedTaluk.name] || "📍"}</span>
                <div>
                  <h3 style={styles.infoTitle}>{selectedTaluk.name} Taluk</h3>
                  <p style={styles.infoPopulation}>Population: {selectedTaluk.population}</p>
                </div>
              </div>
              <div style={styles.infoCrops}>
                <p style={styles.infoCropsLabel}>🌾 Crops Grown:</p>
                <div style={styles.infoCropList}>
                  {selectedTaluk.crops.map((crop) => (
                    <span key={crop} style={styles.infoCropTag}>
                      {cropEmojis[crop] || "🌱"} {crop}
                    </span>
                  ))}
                </div>
              </div>
              <div style={styles.infoCoords}>
                📍 {selectedTaluk.lat.toFixed(4)}°N, {selectedTaluk.lng.toFixed(4)}°E
              </div>

              {/* DSS Quick Insights */}
              <div style={{ marginTop: "16px", borderTop: "1px solid rgba(34,197,94,0.2)", paddingTop: "16px" }}>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#A78BFA", fontWeight: "700", letterSpacing: "1px" }}>🤖 DSS QUICK INSIGHTS</p>
                {dssLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(34,197,94,0.2)", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Analyzing conditions...</span>
                  </div>
                ) : dssInsights ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#9CA3AF", marginBottom: "4px" }}>STRESS</div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: (dssInsights.current?.water_stress ?? 0) > 50 ? "#EF4444" : (dssInsights.current?.water_stress ?? 0) > 25 ? "#FBBF24" : "#4ADE80" }}>
                          {dssInsights.current?.water_stress ?? 0}%
                        </div>
                      </div>
                      <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#9CA3AF", marginBottom: "4px" }}>PEST RISK</div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: dssInsights.current?.pest_risk === "High" ? "#EF4444" : dssInsights.current?.pest_risk === "Medium" ? "#FBBF24" : "#4ADE80" }}>
                          {dssInsights.current?.pest_risk ?? "N/A"}
                        </div>
                      </div>
                    </div>
                    {dssInsights.current?.weather_summary && (
                      <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.2)", boxShadow: "0 2px 8px rgba(34,197,94,0.08)" }}>
                        <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>🌤 WEATHER</div>
                        <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.4" }}>
                          {dssInsights.current.weather_summary.substring(0, 80)}...
                        </div>
                      </div>
                    )}
                    {dssInsights.ai_model && (
                      <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                        <div style={{ fontSize: "10px", color: "#A78BFA", marginBottom: "4px" }}>🧠 AI PREDICTION</div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: dssInsights.ai_model.prediction === "Normal" ? "#4ADE80" : dssInsights.ai_model.prediction === "Low Stress" ? "#FBBF24" : "#EF4444" }}>
                          {dssInsights.ai_model.prediction} ({((dssInsights.ai_model.confidence ?? 0) * 100).toFixed(0)}%)
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "11px", color: "#6B7280" }}>Click on a taluk to see AI-powered insights</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{mapData.taluks.length}</span>
          <span style={styles.statLabel}>Taluks</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{[...new Set(mapData.taluks.flatMap(t => t.crops))].length}</span>
          <span style={styles.statLabel}>Crop Types</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>1,491</span>
          <span style={styles.statLabel}>Sq. km Area</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>2.8M+</span>
          <span style={styles.statLabel}>Population</span>
        </div>
      </div>
    </div>
  );
}

const popupStyles = {
  container: {
    padding: "16px",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    borderBottom: "1px solid rgba(34, 197, 94, 0.2)",
    paddingBottom: "10px",
  },
  emoji: {
    fontSize: "28px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#16a34a",
    fontFamily: "'Poppins', sans-serif",
  },
  info: {
    marginBottom: "12px",
  },
  label: {
    margin: "4px 0",
    fontSize: "12px",
    color: "#64748b",
  },
  value: {
    color: "#1e293b",
    fontWeight: "600",
  },
  coords: {
    margin: "2px 0",
    fontSize: "11px",
    color: "#16a34a",
    fontFamily: "'Inter', sans-serif",
  },
  cropsSection: {
    marginTop: "12px",
  },
  cropsTitle: {
    margin: "0 0 8px 0",
    fontSize: "12px",
    color: "#64748b",
  },
  cropsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 30%, #f8fafc 70%, #f0fdf4 100%)",
    padding: "0",
    fontFamily: "'Inter', sans-serif",
  },
  loading: {
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  loadingIcon: {
    fontSize: "64px",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(34, 197, 94, 0.2)",
    borderTopColor: "#22c55e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#1e293b",
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    fontFamily: "'Poppins', sans-serif",
  },
  loadingSubtext: {
    color: "#64748b",
    fontSize: "14px",
    margin: 0,
  },
  error: {
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  errorIcon: {
    fontSize: "64px",
  },
  errorText: {
    color: "#1e293b",
    fontSize: "18px",
    margin: 0,
    fontFamily: "'Poppins', sans-serif",
  },
  retryButton: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    borderBottom: "1px solid rgba(34, 197, 94, 0.15)",
    background: "rgba(255,255,255,0.95)",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {},
  headerRight: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 4px 0",
    fontFamily: "'Poppins', sans-serif",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  viewToggle: {
    display: "flex",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "14px",
    padding: "4px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.08)",
  },
  viewButton: {
    background: "transparent",
    color: "#64748b",
    border: "none",
    padding: "8px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  viewButtonActive: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#FFFFFF",
  },
  resetButton: {
    background: "rgba(255, 255, 255, 0.95)",
    color: "#1e293b",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    padding: "8px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.08)",
  },
  content: {
    display: "flex",
    height: "calc(100vh - 200px)",
    minHeight: "600px",
  },
  sidePanel: {
    width: "320px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRight: "1px solid rgba(34, 197, 94, 0.15)",
    padding: "20px",
    overflowY: "auto",
  },
  panelTitle: {
    color: "#1e293b",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 16px 0",
    fontFamily: "'Inter', sans-serif",
  },
  talukList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  talukCard: {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "14px",
    padding: "14px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 12px rgba(34, 197, 94, 0.08)",
  },
  talukCardActive: {
    background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
    borderColor: "#22c55e",
    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.2)",
  },
  talukHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  talukEmoji: {
    fontSize: "24px",
  },
  talukName: {
    color: "#1e293b",
    fontSize: "15px",
    fontWeight: "600",
    fontFamily: "'Inter', sans-serif",
  },
  talukCrops: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  cropTag: {
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    color: "#16a34a",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "600",
    border: "1px solid rgba(34, 197, 94, 0.3)",
  },
  moreTag: {
    background: "rgba(255, 255, 255, 0.9)",
    color: "#64748b",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "11px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
    padding: "20px",
    paddingLeft: "0",
  },
  map: {
    height: "100%",
    width: "100%",
    borderRadius: "20px",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    boxShadow: "0 12px 40px rgba(34, 197, 94, 0.1)",
  },
  legend: {
    position: "absolute",
    bottom: "40px",
    left: "20px",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 244, 0.95) 100%)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "14px",
    padding: "14px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.12)",
  },
  legendTitle: {
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0 0 10px 0",
    fontFamily: "'Poppins', sans-serif",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#9CA3AF",
    fontSize: "11px",
    marginBottom: "6px",
  },
  legendDot: {
    width: "12px",
    height: "12px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    borderRadius: "50%",
    border: "2px solid #FFFFFF",
  },
  legendCircle: {
    width: "12px",
    height: "12px",
    border: "2px solid #22c55e",
    borderRadius: "50%",
    background: "rgba(34, 197, 94, 0.2)",
  },
  infoCard: {
    position: "absolute",
    top: "40px",
    right: "40px",
    width: "280px",
    background: "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)",
    border: "1px solid rgba(34, 197, 94, 0.4)",
    borderRadius: "16px",
    padding: "20px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 32px rgba(34, 197, 94, 0.2)",
  },
  infoHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(34, 197, 94, 0.3)",
  },
  infoEmoji: {
    fontSize: "36px",
  },
  infoTitle: {
    color: "#22c55e",
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
    fontFamily: "'Inter', sans-serif",
  },
  infoPopulation: {
    color: "#9CA3AF",
    fontSize: "12px",
    margin: "4px 0 0 0",
  },
  infoCrops: {
    marginBottom: "12px",
  },
  infoCropsLabel: {
    color: "#9CA3AF",
    fontSize: "12px",
    margin: "0 0 8px 0",
  },
  infoCropList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  infoCropTag: {
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%)",
    color: "#FFFFFF",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    border: "1px solid rgba(34, 197, 94, 0.4)",
  },
  infoCoords: {
    color: "#6B7280",
    fontSize: "11px",
    fontFamily: "'Inter', sans-serif",
  },
  statsBar: {
    display: "flex",
    justifyContent: "center",
    gap: "48px",
    padding: "20px",
    borderTop: "1px solid rgba(34, 197, 94, 0.15)",
    background: "rgba(17, 24, 39, 0.5)",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  statValue: {
    color: "#22c55e",
    fontSize: "24px",
    fontWeight: "800",
    fontFamily: "'Inter', sans-serif",
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: "12px",
  },
};
