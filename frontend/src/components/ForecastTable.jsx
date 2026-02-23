import { useState, useEffect, useRef } from "react";

const STYLES_ID = "forecast-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLES_ID)) {
  const s = document.createElement("style");
  s.id = STYLES_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-green {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes scanline {
      0% { top: -3px; }
      100% { top: calc(100% + 3px); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(16px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes sunrise {
      0% { transform: translateY(4px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }

    .fc-search-input:focus {
      border-color: rgba(34,197,94,0.5) !important;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.15) !important;
      outline: none !important;
    }
    .fc-tab:hover { background: rgba(34,197,94,0.1) !important; }
    .fc-tab.active {
      background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.12)) !important;
      border-color: rgba(34,197,94,0.4) !important;
      box-shadow: 0 4px 16px rgba(34,197,94,0.12) !important;
    }
    .fc-stat-card { transition: all 0.25s ease; }
    .fc-stat-card:hover { transform: translateY(-3px); border-color: rgba(34,197,94,0.2) !important; }
    .fc-search-btn:hover { box-shadow: 0 4px 20px rgba(34,197,94,0.45) !important; transform: scale(1.03); }

    .fc-scrollbar::-webkit-scrollbar { height: 4px; }
    .fc-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .fc-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.2); border-radius: 2px; }
  `;
  document.head.appendChild(s);
}

// WMO weather interpretation
const WMO = {
  0: { label: "Clear Sky", emoji: "☀️", color: "#FFD700", icon: "CLEAR" },
  1: { label: "Mainly Clear", emoji: "🌤️", color: "#FFC107", icon: "PCLEAR" },
  2: { label: "Partly Cloudy", emoji: "⛅", color: "#90A4AE", icon: "PCLOUDY" },
  3: { label: "Overcast", emoji: "☁️", color: "#78909C", icon: "CLOUDY" },
  45: { label: "Foggy", emoji: "🌫️", color: "#B0BEC5", icon: "FOG" },
  48: { label: "Icy Fog", emoji: "🌫️", color: "#CFD8DC", icon: "FOG" },
  51: { label: "Light Drizzle", emoji: "🌦️", color: "#64B5F6", icon: "DRIZZLE" },
  53: { label: "Drizzle", emoji: "🌧️", color: "#42A5F5", icon: "DRIZZLE" },
  55: { label: "Dense Drizzle", emoji: "🌧️", color: "#2196F3", icon: "RAIN" },
  61: { label: "Light Rain", emoji: "🌧️", color: "#2196F3", icon: "RAIN" },
  63: { label: "Rain", emoji: "🌧️", color: "#1976D2", icon: "RAIN" },
  65: { label: "Heavy Rain", emoji: "⛈️", color: "#1565C0", icon: "HEAVY" },
  71: { label: "Light Snow", emoji: "🌨️", color: "#E1F5FE", icon: "SNOW" },
  73: { label: "Snow", emoji: "❄️", color: "#B3E5FC", icon: "SNOW" },
  75: { label: "Heavy Snow", emoji: "❄️", color: "#81D4FA", icon: "SNOW" },
  80: { label: "Showers", emoji: "🌦️", color: "#4FC3F7", icon: "SHOWERS" },
  81: { label: "Showers", emoji: "🌧️", color: "#29B6F6", icon: "SHOWERS" },
  82: { label: "Heavy Showers", emoji: "⛈️", color: "#0288D1", icon: "HEAVY" },
  95: { label: "Thunderstorm", emoji: "⛈️", color: "#7B1FA2", icon: "STORM" },
  96: { label: "Storm + Hail", emoji: "⛈️", color: "#6A1B9A", icon: "STORM" },
  99: { label: "Severe Storm", emoji: "🌪️", color: "#4A148C", icon: "STORM" },
};
const getWX = (code) => WMO[code] || { label: "Unknown", emoji: "🌡️", color: "#888", icon: "UNKNOWN" };

// Animated SVG icon
function WXIcon({ code, size = 64 }) {
  const wx = getWX(code);
  const s = size;
  const maps = {
    CLEAR: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="14" fill="#FFD700" opacity="0.95">
          <animate attributeName="r" values="14;15;14" dur="3s" repeatCount="indefinite"/>
        </circle>
        {[0,45,90,135,180,225,270,315].map((a,i)=>(
          <line key={i}
            x1={32+Math.cos(a*Math.PI/180)*19} y1={32+Math.sin(a*Math.PI/180)*19}
            x2={32+Math.cos(a*Math.PI/180)*26} y2={32+Math.sin(a*Math.PI/180)*26}
            stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.5s" begin={`${i*0.3}s`} repeatCount="indefinite"/>
          </line>
        ))}
      </svg>
    ),
    PCLEAR: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <circle cx="24" cy="28" r="10" fill="#FFD700" opacity="0.9"/>
        <ellipse cx="36" cy="36" rx="16" ry="10" fill="rgba(200,220,240,0.25)">
          <animate attributeName="cx" values="36;38;36" dur="5s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="32" cy="38" rx="18" ry="9" fill="rgba(180,200,220,0.2)"/>
      </svg>
    ),
    PCLOUDY: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <circle cx="22" cy="28" r="9" fill="#FFD700" opacity="0.75"/>
        <ellipse cx="36" cy="34" rx="17" ry="11" fill="rgba(150,180,210,0.35)">
          <animate attributeName="cx" values="36;38;36" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="30" cy="37" rx="20" ry="10" fill="rgba(130,160,190,0.3)"/>
      </svg>
    ),
    CLOUDY: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <ellipse cx="32" cy="32" rx="20" ry="13" fill="rgba(140,160,180,0.35)">
          <animate attributeName="rx" values="20;22;20" dur="5s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="24" cy="29" rx="13" ry="10" fill="rgba(120,145,165,0.4)"/>
        <ellipse cx="38" cy="30" rx="12" ry="9" fill="rgba(110,135,155,0.35)"/>
      </svg>
    ),
    FOG: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        {[22,29,36,43].map((y,i)=>(
          <rect key={i} x={12+i*1.5} y={y} width={40-i*3} height="3.5" rx="1.75" fill="rgba(190,205,220,0.28)">
            <animate attributeName="x" values={`${12+i*1.5};${15+i*1.5};${12+i*1.5}`} dur={`${3.5+i*0.6}s`} repeatCount="indefinite"/>
          </rect>
        ))}
      </svg>
    ),
    DRIZZLE: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <ellipse cx="32" cy="24" rx="17" ry="10" fill="rgba(140,175,215,0.4)"/>
        {[20,27,34,41,24,31,38].map((x,i)=>(
          <circle key={i} cx={x} cy={40+i%3*5} r="2.5" fill="#93C5FD" opacity="0.75">
            <animate attributeName="cy" values={`${40+i%3*5};${44+i%3*5};${40+i%3*5}`} dur={`${1.4+i*0.18}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </svg>
    ),
    RAIN: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <ellipse cx="32" cy="22" rx="18" ry="11" fill="rgba(80,130,195,0.4)"/>
        {[18,25,32,39,46,22,29,36].map((x,i)=>(
          <line key={i} x1={x} y1={35+i%2*5} x2={x-4} y2={48+i%2*5}
            stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur={`${1.1+i*0.15}s`} begin={`${i*0.1}s`} repeatCount="indefinite"/>
          </line>
        ))}
      </svg>
    ),
    HEAVY: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <ellipse cx="32" cy="20" rx="20" ry="12" fill="rgba(60,100,160,0.5)"/>
        {[16,23,30,37,44,19,26,33,40].map((x,i)=>(
          <line key={i} x1={x} y1={33+i%3*3} x2={x-5} y2={50+i%3*3}
            stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="opacity" values="1;0.2;1" dur={`${0.8+i*0.12}s`} begin={`${i*0.08}s`} repeatCount="indefinite"/>
          </line>
        ))}
      </svg>
    ),
    SNOW: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <ellipse cx="32" cy="22" rx="16" ry="10" fill="rgba(180,215,240,0.4)"/>
        {[18,27,36,45,22,31,40].map((x,i)=>(
          <text key={i} x={x} y={40+i%3*7} fontSize="11" fill="white" opacity="0.75" textAnchor="middle">
            ❄
            <animate attributeName="y" values={`${40+i%3*7};${46+i%3*7};${40+i%3*7}`} dur={`${2.2+i*0.25}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.75;0.3;0.75" dur={`${2+i*0.2}s`} repeatCount="indefinite"/>
          </text>
        ))}
      </svg>
    ),
    SHOWERS: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <circle cx="22" cy="24" r="10" fill="rgba(100,150,200,0.4)"/>
        <ellipse cx="38" cy="26" rx="13" ry="9" fill="rgba(80,125,180,0.35)"/>
        {[20,30,40].map((x,i)=>(
          <line key={i} x1={x} y1={37} x2={x-5} y2={52}
            stroke="#60A5FA" strokeWidth="2.8" strokeLinecap="round">
            <animate attributeName="opacity" values="1;0.3;1" dur={`${1.2+i*0.3}s`} repeatCount="indefinite"/>
          </line>
        ))}
      </svg>
    ),
    STORM: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <ellipse cx="32" cy="20" rx="22" ry="13" fill="rgba(70,40,100,0.55)"/>
        <polyline points="38,30 30,42 35,42 27,58" stroke="#FFD700" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="opacity" values="1;0.1;1;0.1;1" dur="1.8s" repeatCount="indefinite"/>
        </polyline>
      </svg>
    ),
    UNKNOWN: (
      <svg width={s} height={s} viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="18" fill="rgba(120,120,120,0.2)"/>
        <text x="32" y="39" fontSize="22" textAnchor="middle" fill="rgba(255,255,255,0.4)">?</text>
      </svg>
    ),
  };
  return maps[wx.icon] || maps.UNKNOWN;
}

// Geocode + weather fetch
async function fetchGeo(location) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
  const d = await r.json();
  if (!d.results?.length) throw new Error(`Location "${location}" not found`);
  return d.results[0];
}
async function fetchWX(lat, lon) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation,surface_pressure,visibility` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset,uv_index_max` +
    `&timezone=auto&forecast_days=7`
  );
  return r.json();
}

// Agri tip logic
function agriTip(code, precip, maxTemp) {
  if ([95,96,99].includes(code)) return "⚠️ Severe storm alert — secure all farm equipment, protect young seedlings, and avoid field operations.";
  if (precip > 20 || [65,82].includes(code)) return "🌊 Heavy rainfall expected — inspect drainage, avoid fertilizer application, and monitor for waterlogging.";
  if (precip > 5 || [61,63,80,81].includes(code)) return "🌧 Rain forecast — hold off on pesticide/herbicide sprays; ideal for transplanting if soil is well-drained.";
  if ([71,73,75].includes(code)) return "❄️ Frost or snow risk — cover cold-sensitive crops overnight and safeguard irrigation pipes.";
  if (maxTemp > 40) return "🔥 Extreme heat — irrigate only at dawn or dusk to minimize evaporation; watch for heat stress signs.";
  if (maxTemp > 34) return "☀️ Hot day — increase irrigation frequency; shade nets recommended for nurseries and greenhouses.";
  if (maxTemp < 10) return "🧊 Cold stress possible — monitor crops for chilling injury; delay planting of warm-season varieties.";
  if ([0,1].includes(code)) return "✅ Ideal conditions — perfect for harvesting, spraying, and mechanized field operations.";
  if ([2,3].includes(code)) return "🌿 Partly cloudy — good for transplanting; reduced heat stress on newly planted seedlings.";
  return "📋 Normal conditions — follow your standard crop calendar and monitor for any pest activity.";
}

function windDir(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function Pill({ icon, label, value, accent = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "7px",
      padding: "7px 13px", borderRadius: "20px",
      background: accent ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${accent ? "rgba(34,197,94,0.22)" : "rgba(255,255,255,0.09)"}`,
      fontSize: "0.78rem", fontFamily: "'Inter', sans-serif",
    }}>
      <span>{icon}</span>
      <span style={{ color: "#666" }}>{label}</span>
      <span style={{ color: accent ? "#4ade80" : "#DDD", fontWeight: "600" }}>{value}</span>
    </div>
  );
}

export default function ForecastTable({ data: propData }) {
  const [location, setLocation] = useState("Regional");
  const [inputVal, setInputVal] = useState("Regional");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState(0);
  const [clock, setClock] = useState(new Date());
  const tabsRef = useRef(null);

  useEffect(() => {
    loadWeather("Regional");
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadWeather = async (loc) => {
    setLoading(true);
    setError("");
    try {
      const geo = await fetchGeo(loc);
      const wx = await fetchWX(geo.latitude, geo.longitude);
      setWeather({
        ...wx,
        name: geo.name,
        country: geo.country_code?.toUpperCase(),
        lat: geo.latitude,
        lon: geo.longitude,
      });
      setActiveDay(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (inputVal.trim()) {
      setLocation(inputVal.trim());
      loadWeather(inputVal.trim());
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const clockStr = clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = clock.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const curr = weather?.current;
  const daily = weather?.daily;
  const currWX = curr ? getWX(curr.weather_code) : null;

  return (
    <div style={styles.wrapper}>
      {/* Module label */}
      <div style={styles.moduleLabel}>
        <span style={styles.labelDot} />
        <span>REAL-TIME WEATHER INTELLIGENCE</span>
      </div>

      <div style={styles.container}>
        {/* ── Top bar ── */}
        <div style={styles.topBar}>
          <div style={styles.topBarBrand}>
            <span style={styles.brandIcon}>🌾</span>
            <div>
              <div style={styles.brandName}>AGRI<span style={{ color: "#22c55e" }}>CAST</span></div>
              <div style={styles.brandSub}>Agricultural Weather Intelligence</div>
            </div>
          </div>
          <div style={styles.clockWrap}>
            <div style={styles.clockTime}>{clockStr}</div>
            <div style={styles.clockDate}>{dateStr}</div>
          </div>
          <div style={styles.liveBadge}>
            <span style={styles.liveDot} />
            <span style={styles.liveText}>LIVE</span>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={styles.searchZone}>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <div style={styles.searchInputWrap}>
              <span style={{ fontSize: "16px" }}>📍</span>
              <input
                className="fc-search-input"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Search any location..."
                style={styles.searchInput}
              />
              {weather && (
                <span style={styles.searchCurrentLoc}>{weather.name}, {weather.country}</span>
              )}
            </div>
            <button type="submit" className="fc-search-btn" style={styles.searchBtn} disabled={loading}>
              {loading
                ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span>
                : "Search"
              }
            </button>
          </form>
          {error && <div style={styles.errorStrip}>⚠ {error}</div>}
        </div>

        {/* ── Loading skeleton ── */}
        {loading && !weather && (
          <div style={styles.skeleton}>
            <div style={{ fontSize: "36px", animation: "spin 2s linear infinite", display: "inline-block" }}>🌀</div>
            <p style={styles.skeletonText}>Fetching live weather data...</p>
          </div>
        )}

        {/* ── Current Conditions ── */}
        {weather && curr && (
          <div style={styles.currentPanel}>
            <div style={styles.currentLeft}>
              <div style={styles.location}>
                {weather.name}
                <span style={styles.country}>{weather.country}</span>
              </div>

              <div style={styles.tempRow}>
                <div style={styles.bigTemp}>
                  {Math.round(curr.temperature_2m)}
                  <span style={styles.tempUnit}>°C</span>
                </div>
                <div style={styles.tempMeta}>
                  <div style={styles.feelsLike}>Feels {Math.round(curr.apparent_temperature)}°C</div>
                  <div style={styles.wxLabel}>{currWX?.label}</div>
                </div>
              </div>

              <div style={styles.pillRow}>
                <Pill icon="💧" label="Humidity" value={`${curr.relative_humidity_2m}%`} />
                <Pill icon="💨" label="Wind" value={`${curr.wind_speed_10m} km/h ${windDir(curr.wind_direction_10m)}`} />
                <Pill icon="🌧" label="Precip" value={`${curr.precipitation} mm`} />
                <Pill icon="👁" label="Pressure" value={`${curr.surface_pressure?.toFixed(0)} hPa`} />
              </div>

              {/* Sunrise/sunset */}
              {daily && (
                <div style={styles.sunRow}>
                  <div style={styles.sunBlock}>
                    <span style={{ fontSize: "20px" }}>🌅</span>
                    <div>
                      <div style={styles.sunLabel}>SUNRISE</div>
                      <div style={styles.sunVal}>{fmtTime(daily.sunrise[0])}</div>
                    </div>
                  </div>
                  <div style={styles.sunBar}>
                    <div style={{
                      position: "absolute", top: "50%", left: "50%",
                      transform: "translate(-50%,-50%)",
                      fontSize: "0.65rem", color: "#555", fontFamily: "'Inter', sans-serif",
                    }}>
                      {daily.uv_index_max?.[0] ? `UV ${daily.uv_index_max[0]}` : ""}
                    </div>
                    <div style={{
                      height: "2px", width: "100%",
                      background: "linear-gradient(90deg, #FF9800, #FFD700, #FF9800)",
                    }} />
                  </div>
                  <div style={styles.sunBlock}>
                    <span style={{ fontSize: "20px" }}>🌇</span>
                    <div>
                      <div style={styles.sunLabel}>SUNSET</div>
                      <div style={styles.sunVal}>{fmtTime(daily.sunset[0])}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.currentRight}>
              <div style={styles.bigIconWrap}>
                <WXIcon code={curr.weather_code} size={110} />
              </div>
              <div style={styles.emojiLarge}>{currWX?.emoji}</div>
            </div>
          </div>
        )}

        {/* ── Day Tabs ── */}
        {weather && daily && (
          <>
            <div style={styles.tabsLabel}>
              <span style={styles.tabsLabelText}>7-DAY FORECAST</span>
              <div style={styles.tabsDivider} />
            </div>

            <div ref={tabsRef} className="fc-scrollbar" style={styles.tabsRow}>
              {daily.time.map((d, i) => {
                const wx = getWX(daily.weather_code[i]);
                const isActive = activeDay === i;
                const isToday = i === 0;
                return (
                  <button
                    key={i}
                    className={`fc-tab${isActive ? " active" : ""}`}
                    onClick={() => setActiveDay(i)}
                    style={{
                      ...styles.tab,
                      ...(isActive ? styles.tabActive : {}),
                    }}
                  >
                    <span style={{
                      fontSize: "0.65rem", fontFamily: "'Inter', sans-serif",
                      color: isToday ? "#22c55e" : isActive ? "#FFF" : "#555",
                      letterSpacing: "0.8px", fontWeight: "700",
                    }}>
                      {isToday ? "TODAY" : new Date(d).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                    </span>
                    <span style={{ fontSize: "22px", lineHeight: "1" }}>{wx.emoji}</span>
                    <span style={{ fontSize: "1rem", fontWeight: "800", color: isActive ? "#FFF" : "#CCC" }}>
                      {Math.round(daily.temperature_2m_max[i])}°
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#555", fontFamily: "'Inter', sans-serif" }}>
                      {Math.round(daily.temperature_2m_min[i])}°
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Day Detail ── */}
            <div style={styles.dayDetail}>
              <div style={{ animation: "slideInRight 0.35s ease-out" }} key={activeDay}>
                {(() => {
                  const i = activeDay;
                  const wx = getWX(daily.weather_code[i]);
                  return (
                    <>
                      <div style={styles.detailHeader}>
                        <div>
                          <div style={styles.detailDay}>
                            {i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(daily.time[i]).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                          </div>
                          <div style={styles.detailCondition}>
                            <span style={{ color: wx.color }}>{wx.emoji}</span> {wx.label}
                          </div>
                        </div>
                        <div style={styles.tempRange}>
                          <span style={styles.rangeHigh}>{Math.round(daily.temperature_2m_max[i])}°</span>
                          <span style={styles.rangeSep}>/</span>
                          <span style={styles.rangeLow}>{Math.round(daily.temperature_2m_min[i])}°</span>
                          <span style={styles.rangeUnit}>C</span>
                        </div>
                      </div>

                      {/* Stat grid */}
                      <div style={styles.statGrid}>
                        {[
                          { icon: "🌧", label: "Precipitation", val: `${daily.precipitation_sum[i]} mm` },
                          { icon: "💨", label: "Max Wind", val: `${daily.wind_speed_10m_max[i]} km/h` },
                          { icon: "🌅", label: "Sunrise", val: fmtTime(daily.sunrise[i]) },
                          { icon: "🌇", label: "Sunset", val: fmtTime(daily.sunset[i]) },
                          ...(daily.uv_index_max ? [{ icon: "☀️", label: "UV Index", val: daily.uv_index_max[i]?.toFixed(1) || "—" }] : []),
                        ].map((s, si) => (
                          <div key={si} className="fc-stat-card" style={styles.statCard}>
                            <div style={styles.statIcon}>{s.icon}</div>
                            <div style={styles.statLabel}>{s.label}</div>
                            <div style={styles.statVal}>{s.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Agri tip */}
                      <div style={styles.agriTipBox}>
                        <div style={styles.agriTipHeader}>
                          <span style={styles.agriTipBadge}>🌱 AGRI ADVISORY</span>
                          <span style={styles.agriTipDay}>
                            {i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(daily.time[i]).toLocaleDateString("en-US", { weekday: "long" })}
                          </span>
                        </div>
                        <p style={styles.agriTipText}>
                          {agriTip(daily.weather_code[i], daily.precipitation_sum[i], daily.temperature_2m_max[i])}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        )}

        {/* Fallback: propData */}
        {!weather && !loading && propData && propData.length > 0 && (
          <div style={styles.propGrid}>
            {propData.map((item, idx) => (
              <div key={idx} style={styles.propCard}>
                <div style={styles.propDate}>{fmt(item.date)}</div>
                <WXIcon code={0} size={44} />
                <p style={styles.propForecast}>{item.forecast}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={{ color: "#444" }}>Open-Meteo API · WMO Weather Interpretation</span>
          <span style={{ color: "#333", fontFamily: "'Inter', sans-serif" }}>
            {weather ? `${weather.lat?.toFixed(2)}°N ${weather.lon?.toFixed(2)}°E` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "'Inter', sans-serif", marginBottom: "32px" },

  moduleLabel: {
    display: "flex", alignItems: "center", gap: "8px",
    fontSize: "0.65rem", color: "#555", letterSpacing: "2px",
    fontFamily: "'Inter', sans-serif", marginBottom: "12px",
  },
  labelDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#22c55e", display: "inline-block",
    animation: "pulse-green 2s ease-in-out infinite",
  },

  container: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,253,244,0.95) 100%)",
    borderRadius: "24px",
    border: "1px solid rgba(34,197,94,0.2)",
    overflow: "hidden",
    boxShadow: "0 25px 70px rgba(34,197,94,0.1), 0 0 0 1px rgba(34,197,94,0.05)",
    animation: "fadeSlideUp 0.5s ease-out",
    backdropFilter: "blur(20px)",
  },

  topBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 32px",
    borderBottom: "1px solid rgba(34,197,94,0.15)",
    background: "rgba(255,255,255,0.95)",
    flexWrap: "wrap", gap: "12px",
  },
  topBarBrand: { display: "flex", alignItems: "center", gap: "12px" },
  brandIcon: { fontSize: "28px" },
  brandName: { fontSize: "1.05rem", fontWeight: "900", color: "#1e293b", letterSpacing: "2px", fontFamily: "'Poppins', sans-serif" },
  brandSub: { fontSize: "0.65rem", color: "#64748b", fontFamily: "'Inter', sans-serif", letterSpacing: "0.5px", marginTop: "2px" },
  clockWrap: { textAlign: "center" },
  clockTime: { fontSize: "1rem", fontWeight: "600", color: "#475569", fontFamily: "'Inter', sans-serif", letterSpacing: "2px" },
  clockDate: { fontSize: "0.65rem", color: "#64748b", fontFamily: "'Inter', sans-serif", marginTop: "2px" },
  liveBadge: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "6px 14px", borderRadius: "20px",
    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
  },
  liveDot: {
    width: "7px", height: "7px", borderRadius: "50%",
    background: "#22c55e", display: "inline-block",
    animation: "pulse-green 1.5s ease-in-out infinite",
    boxShadow: "0 0 6px rgba(34,197,94,0.6)",
  },
  liveText: { fontSize: "0.65rem", color: "#4ade80", fontWeight: "800", letterSpacing: "2px", fontFamily: "'Inter', sans-serif" },

  searchZone: { padding: "18px 32px", borderBottom: "1px solid rgba(34,197,94,0.08)" },
  searchForm: { display: "flex", gap: "10px", alignItems: "center" },
  searchInputWrap: {
    flex: 1, display: "flex", alignItems: "center", gap: "10px",
    padding: "12px 18px",
    background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.25)",
    borderRadius: "14px",
  },
  searchInput: {
    flex: 1, background: "transparent", border: "none", color: "#1e293b",
    fontSize: "0.9rem", fontFamily: "'Inter', sans-serif", fontWeight: "600",
  },
  searchCurrentLoc: {
    fontSize: "0.72rem", color: "#6B7280", fontFamily: "'Inter', sans-serif",
    whiteSpace: "nowrap",
  },
  searchBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#FFF", border: "none", borderRadius: "12px",
    fontSize: "0.88rem", fontWeight: "700", cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
    transition: "all 0.2s",
  },
  errorStrip: {
    marginTop: "10px", padding: "10px 16px", borderRadius: "10px",
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171", fontSize: "0.82rem", fontWeight: "600",
  },

  skeleton: { padding: "60px 32px", textAlign: "center" },
  skeletonText: { color: "#6B7280", fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", marginTop: "14px" },

  currentPanel: {
    display: "flex", gap: "20px", padding: "28px 32px",
    borderBottom: "1px solid rgba(34,197,94,0.08)",
    flexWrap: "wrap",
    background: "linear-gradient(135deg, rgba(34,197,94,0.04) 0%, transparent 60%)",
  },
  currentLeft: { flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "14px" },
  currentRight: { flex: "0 0 130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" },
  bigIconWrap: { filter: "drop-shadow(0 0 20px rgba(255,200,100,0.15))" },
  emojiLarge: { fontSize: "32px", marginTop: "-4px" },

  location: { fontSize: "1.05rem", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Poppins', sans-serif" },
  country: {
    fontSize: "0.65rem", padding: "3px 9px", borderRadius: "8px",
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)", border: "1px solid rgba(34,197,94,0.3)",
    color: "#16a34a", fontFamily: "'Inter', sans-serif", letterSpacing: "1px",
  },

  tempRow: { display: "flex", alignItems: "flex-end", gap: "14px" },
  bigTemp: { fontSize: "4.8rem", fontWeight: "900", color: "#1e293b", lineHeight: "1", letterSpacing: "-2px", fontFamily: "'Poppins', sans-serif" },
  tempUnit: { fontSize: "2.2rem", color: "#22c55e" },
  tempMeta: { paddingBottom: "8px" },
  feelsLike: { color: "#64748b", fontSize: "0.82rem", fontFamily: "'Inter', sans-serif", marginBottom: "4px" },
  wxLabel: { fontSize: "0.95rem", fontWeight: "700", color: "#475569", fontFamily: "'Inter', sans-serif" },

  pillRow: { display: "flex", flexWrap: "wrap", gap: "7px" },

  sunRow: { display: "flex", alignItems: "center", gap: "14px" },
  sunBlock: { display: "flex", alignItems: "center", gap: "8px" },
  sunBar: { flex: 1, position: "relative", height: "24px", display: "flex", alignItems: "center" },
  sunLabel: { fontSize: "0.6rem", color: "#64748b", fontFamily: "'Inter', sans-serif", letterSpacing: "1px", marginBottom: "3px" },
  sunVal: { fontSize: "0.88rem", color: "#1e293b", fontWeight: "700", fontFamily: "'Inter', sans-serif" },

  tabsLabel: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "20px 32px 12px",
  },
  tabsLabelText: { fontSize: "0.65rem", color: "#6B7280", fontFamily: "'Inter', sans-serif", letterSpacing: "2px", whiteSpace: "nowrap" },
  tabsDivider: { flex: 1, height: "1px", background: "rgba(34,197,94,0.1)" },

  tabsRow: {
    display: "flex", gap: "8px", padding: "0 32px 16px",
    overflowX: "auto",
  },
  tab: {
    flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
    padding: "14px 18px", minWidth: "76px",
    background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.15)",
    borderRadius: "14px", cursor: "pointer",
    transition: "all 0.25s ease",
    fontFamily: "'Inter', sans-serif",
  },
  tabActive: {
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    border: "1px solid rgba(34,197,94,0.35)",
    boxShadow: "0 4px 14px rgba(34,197,94,0.15)",
  },

  dayDetail: { padding: "0 32px 28px" },

  detailHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    marginBottom: "18px",
  },
  detailDay: { fontSize: "1.3rem", fontWeight: "900", color: "#1e293b", marginBottom: "4px", fontFamily: "'Poppins', sans-serif" },
  detailCondition: { fontSize: "0.88rem", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Inter', sans-serif" },
  tempRange: { display: "flex", alignItems: "baseline", gap: "4px" },
  rangeHigh: { fontSize: "2.4rem", fontWeight: "900", color: "#4ade80", fontFamily: "'Inter', sans-serif" },
  rangeSep: { fontSize: "1.6rem", color: "#374151" },
  rangeLow: { fontSize: "1.8rem", fontWeight: "700", color: "#60A5FA", fontFamily: "'Inter', sans-serif" },
  rangeUnit: { fontSize: "1rem", color: "#6B7280", fontFamily: "'Inter', sans-serif" },

  statGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "10px", marginBottom: "16px",
  },
  statCard: {
    padding: "18px 14px", borderRadius: "14px", textAlign: "center",
    background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.2)",
    cursor: "default",
    boxShadow: "0 4px 15px rgba(34,197,94,0.08)",
  },
  statIcon: { fontSize: "20px", marginBottom: "8px" },
  statLabel: { fontSize: "0.62rem", color: "#6B7280", letterSpacing: "0.8px", marginBottom: "5px", fontFamily: "'Inter', sans-serif" },
  statVal: { fontSize: "0.92rem", fontWeight: "700", color: "#E5E7EB", fontFamily: "'Inter', sans-serif" },

  agriTipBox: {
    padding: "18px 20px", borderRadius: "12px",
    background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)",
    borderLeft: "3px solid rgba(34,197,94,0.5)",
  },
  agriTipHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  agriTipBadge: {
    fontSize: "0.65rem", color: "#4ade80", fontWeight: "700",
    letterSpacing: "1px", fontFamily: "'Inter', sans-serif",
  },
  agriTipDay: { fontSize: "0.65rem", color: "#6B7280", fontFamily: "'Inter', sans-serif" },
  agriTipText: { margin: 0, fontSize: "0.87rem", color: "#D1D5DB", lineHeight: "1.65", fontWeight: "500", fontFamily: "'Inter', sans-serif" },

  propGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", padding: "20px 32px" },
  propCard: {
    padding: "20px", borderRadius: "14px", textAlign: "center",
    background: "rgba(255,255,255,0.95)", border: "1px solid rgba(34,197,94,0.2)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    boxShadow: "0 4px 15px rgba(34,197,94,0.08)",
  },
  propDate: {
    fontSize: "0.72rem", color: "#22c55e", fontWeight: "700",
    fontFamily: "'Inter', sans-serif", letterSpacing: "0.5px",
  },
  propForecast: { margin: 0, fontSize: "0.85rem", color: "#D1D5DB", lineHeight: "1.6", fontFamily: "'Inter', sans-serif" },

  footer: {
    padding: "14px 32px",
    borderTop: "1px solid rgba(34,197,94,0.08)",
    display: "flex", justifyContent: "space-between",
    fontSize: "0.65rem", fontFamily: "'Inter', sans-serif",
  },
};
