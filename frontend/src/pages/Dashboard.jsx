import { useState, useEffect } from "react";
import DSSInput from "../components/DSSInput";
import DSSOutput from "../components/DSSOutput";
import ForecastTable from "../components/ForecastTable";
import CropClassification from "../components/CropClassification";
import ChatBot from "../components/ChatBot";
import MapTab from "../components/MapTab";
import { useLanguage } from "../LanguageContext";

// 🎓 Research-Powered Advanced Components
import ModelComparisonPanel from "../components/ModelComparisonPanel";
import SHAPExplanation from "../components/SHAPExplanation";
import ResearchShowcase from "../components/ResearchShowcase";
import ClimateProjections from "../components/ClimateProjections";
import TalukStressHeatmap from "../components/TalukStressHeatmap";

// 🚀 Advanced Integrated Components
import AdvancedDSS from "../components/AdvancedDSS";
import EnhancedMap from "../components/EnhancedMap";

// 👤 User Components
import Welcome from "../components/Welcome";
import Profile from "../components/Profile";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
  @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes glow { 0%, 100% { box-shadow: 0 4px 25px rgba(34, 197, 94, 0.2); } 50% { box-shadow: 0 8px 40px rgba(34, 197, 94, 0.3); } }
  @keyframes leafFloat { 0% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } 100% { transform: translateY(0) rotate(0deg); } }
  
  .tab-btn { position: relative; overflow: hidden; font-family: 'Poppins', sans-serif !important; transition: all 0.3s ease !important; }
  .tab-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), transparent); opacity: 0; transition: opacity 0.3s ease; }
  .tab-btn:hover::before { opacity: 1; }
  .tab-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 30px rgba(34, 197, 94, 0.2) !important; }
  .tab-btn::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 3px; background: linear-gradient(90deg, #22c55e, #16a34a); transition: all 0.3s ease; transform: translateX(-50%); border-radius: 3px 3px 0 0; }
  .tab-btn.active::after { width: 80%; }
  
  .lang-btn { transition: all 0.25s ease !important; font-family: 'Poppins', sans-serif !important; }
  .lang-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 25px rgba(34, 197, 94, 0.25) !important; background: linear-gradient(135deg, #f0fdf4, #dcfce7) !important; }
  
  .profile-btn { transition: all 0.25s ease !important; }
  .profile-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 25px rgba(34, 197, 94, 0.25) !important; background: linear-gradient(135deg, #dcfce7, #f0fdf4) !important; }
  
  .modal-close-btn:hover { background: rgba(239, 68, 68, 0.2) !important; transform: rotate(90deg) !important; }
  
  .glass-card { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
  .content-card { transition: all 0.3s ease; }
  .content-card:hover { transform: translateY(-4px); box-shadow: 0 25px 60px rgba(34, 197, 94, 0.15) !important; }
  
  * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

  /* Light Theme Scrollbar */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: #f0fdf4; border-radius: 5px; }
  ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 5px; }
  ::-webkit-scrollbar-thumb:hover { background: #16a34a; }
`;

// Premium Agriculture Background Images
const BG_IMAGES = {
  hero: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80",
  pattern: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80",
  sidebar: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
};

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function Dashboard({ user, onLogout }) {
  inject("dashboard-premium", CSS);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("welcome");
  const { language, setLanguage, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [detectedCropData, setDetectedCropData] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    // Load profile from localStorage on mount
    try {
      const stored = localStorage.getItem('agridss_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  });

  // Handler for when user wants DSS help from classifier
  const handleGetDSSHelp = (cropData) => {
    setDetectedCropData(cropData);
    setActiveTab("dss");
  };

  // Handler for Welcome page actions
  const handleGetStarted = (action) => {    if (action === 'profile') {
      setShowProfileModal(true);
    } else if (action === 'dss') {
      setActiveTab('dss');
    } else if (action === 'explore') {
      setActiveTab('dss'); // Unified DSS tab
    }
  };

  // Handler for saving profile
  const handleSaveProfile = (profileData) => {
    setUserProfile(profileData);
    setShowProfileModal(false);
    
    // Save to localStorage
    try {
      localStorage.setItem('agridss_user_profile', JSON.stringify(profileData));
      console.log('Profile saved successfully:', profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
    
    // Optional: Save to backend API
    // fetch('http://localhost:8000/api/profile/save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId: user?.id, profile: profileData })
    // }).catch(err => console.error('Backend save failed:', err));
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const languages = [
    { code: "en", name: "EN", full: "English", flag: "🇬🇧" },
    { code: "ml", name: "ML", full: "മലയാളം", flag: "🇮🇳" },
    { code: "ta", name: "TA", full: "தமிழ்", flag: "🇮🇳" },
    { code: "hi", name: "HI", full: "हिंदी", flag: "🇮🇳" },
  ];

  const tabs = [
    { id: "welcome", icon: "👋", label: t("tabWelcome") },
    { id: "dss", icon: "🧠", label: t("tabDSS") },
    { id: "research", icon: "🎓", label: t("tabResearch") },
    { id: "classifier", icon: "🌾", label: t("tabClassifier") },
    { id: "map", icon: "🗺️", label: t("tabMap") },
    { id: "chatbot", icon: "💬", label: t("tabChatbot") },
  ];

  return (
    <div style={styles.page}>
      {/* Nature Background Elements */}
      <div style={styles.bgGradient} />
      <div style={styles.bgGrid} />
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />
      
      {/* Floating Nature Elements */}
      <div style={styles.floatingElements}>
        {['🌿', '🍃', '🌱', '☘️', '🌾'].map((leaf, i) => (
          <div key={i} style={{
            ...styles.floatingLeaf,
            left: `${10 + i * 18}%`,
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${10 + i * 3}s`
          }}>
            {leaf}
          </div>
        ))}
      </div>

      {/* Header */}
      <header style={{ ...styles.header, ...(scrolled ? styles.headerScrolled : {}) }} className="glass-card">
        <div style={styles.headerContent}>
          {/* Logo & Brand */}
          <div style={styles.brand}>
            <div style={styles.logoWrap}>
              <span style={styles.logo}>🌾</span>
            </div>
            <div>
              <h1 style={styles.title}>{t("appTitle")}</h1>
              <p style={styles.tagline}>{t("appTagline")}</p>
            </div>
          </div>

          {/* Language Selector */}
          <div style={styles.languageSelector}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                className="lang-btn"
                onClick={() => setLanguage(lang.code)}
                style={{
                  ...styles.langButton,
                  ...(language === lang.code ? styles.langButtonActive : {}),
                }}
                title={lang.full}
              >
                <span style={styles.langFlag}>{lang.flag}</span>
                <span style={styles.langCode}>{lang.name}</span>
              </button>
            ))}
          </div>

          {/* Right Section: Profile + User Menu */}
          <div style={styles.rightSection}>
            {/* Profile Button */}
            <button
              onClick={() => setShowProfileModal(!showProfileModal)}
              className="profile-btn"
              style={styles.profileButton}
              title={t("myProfile")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              <span style={styles.profileButtonText}>{t("profile")}</span>
            </button>

            {/* User Menu */}
            <div style={styles.userSection}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={styles.userButton}
              >
                <div style={styles.userAvatar}>
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span style={styles.userName}>{user?.name || "User"}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {showUserMenu && (
                <div style={styles.userDropdown}>
                  <div style={styles.userDropdownHeader}>
                    <div style={styles.userDropdownAvatar}>
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div style={styles.userDropdownName}>{user?.name}</div>
                      <div style={styles.userDropdownEmail}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={styles.userDropdownDivider} />
                  <button onClick={onLogout} style={styles.logoutButton}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn"
              style={styles.modalClose}
              onClick={() => setShowProfileModal(false)}
            >
              ×
            </button>
            <Profile user={user} userProfile={userProfile} onSave={handleSaveProfile} />
          </div>
        </div>
      )}

      <main style={styles.main}>
        <div style={styles.container}>
          {/* Tab Navigation */}
          <div style={styles.tabNav}>
            <div style={styles.tabContainer}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === tab.id ? styles.tabButtonActive : styles.tabButtonInactive)
                  }}
                >
                  <span style={styles.tabIcon}>{tab.icon}</span>
                  <span style={styles.tabLabel}>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div style={styles.content}>
            {/* Welcome Tab */}
            {activeTab === "welcome" && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <Welcome user={user} onGetStarted={handleGetStarted} />
              </div>
            )}

            {/* 🧠 Unified DSS Tab - Basic + Advanced Analysis */}
            {activeTab === "dss" && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                {/* Basic DSS Input */}
                <DSSInput setResult={setResult} detectedCrop={detectedCropData} onCropUsed={() => setDetectedCropData(null)} />
                
                {result && (
                  <div style={styles.results}>
                    <DSSOutput result={result.current} />
                    <ForecastTable data={result.forecast} />
                  </div>
                )}

                {!result && (
                  <div style={styles.emptyState} className="glass-card">
                    {/* Background Overlay */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.95) 50%, rgba(255,255,255,0.9) 100%)",
                      borderRadius: "28px",
                      zIndex: 1,
                    }} />
                    
                    {/* Hero Section */}
                    <div style={styles.emptyHero}>
                      <div style={styles.emptyIconWrap}>
                        <span style={styles.emptyIcon}>🌾</span>
                      </div>
                      <h3 style={styles.emptyTitle}>Welcome to AgriDSS</h3>
                      <p style={styles.emptySubtitle}>
                        AI-Powered Agricultural Decision Support System
                      </p>
                    </div>
                    
                    {/* Features Grid */}
                    <div style={styles.emptyFeaturesGrid}>
                      {[
                        { icon: "🤖", title: "AI Predictions", desc: "88.3% accurate ML ensemble" },
                        { icon: "🌤️", title: "Weather Analysis", desc: "7-day ERA5 forecasting" },
                        { icon: "🌱", title: "Crop Insights", desc: "Stage-specific guidance" },
                        { icon: "🚨", title: "Stress Alerts", desc: "Real-time risk detection" },
                      ].map((f, i) => (
                        <div key={i} style={styles.emptyFeatureCard}>
                          <span style={styles.emptyFeatureIcon}>{f.icon}</span>
                          <div style={styles.emptyFeatureTitle}>{f.title}</div>
                          <div style={styles.emptyFeatureDesc}>{f.desc}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Call to Action */}
                    <div style={styles.emptyCta}>
                      <div style={styles.emptyCtaArrow}>↑</div>
                      <p style={styles.emptyCtaText}>
                        Fill in the form above to get AI-powered agricultural recommendations
                      </p>
                    </div>
                  </div>
                )}

                {/* Advanced DSS Section */}
                <div style={{ marginTop: "32px" }}>
                  <AdvancedDSS />
                </div>
              </div>
            )}

            {/* Classifier Tab */}
            {activeTab === "classifier" && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <CropClassification onGetDSSHelp={handleGetDSSHelp} />
              </div>
            )}

            {/* 🎓 Research Tab - Advanced Features */}
            {activeTab === "research" && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                {/* Research Header */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,253,244,0.95))",
                  backdropFilter: "blur(20px)",
                  borderRadius: "24px",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  padding: "40px",
                  marginBottom: "28px",
                  textAlign: "center",
                  boxShadow: "0 15px 50px rgba(34, 197, 94, 0.1)"
                }}>
                  <span style={{ fontSize: "52px", display: "block", marginBottom: "18px" }}>🎓</span>
                  <h2 style={{
                    margin: "0 0 10px 0",
                    fontSize: "1.9rem",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #16a34a, #22c55e)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}>
                    Research-Powered Insights
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "1rem", fontWeight: 500 }}>
                    M.Tech research findings integrated into production • 88.3% ensemble accuracy
                  </p>
                </div>

                {/* Research Showcase */}
                <div style={{ marginBottom: "24px" }}>
                  <ResearchShowcase />
                </div>

                {/* Two-column layout for Model Comparison and SHAP */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", 
                  gap: "24px",
                  marginBottom: "24px"
                }}>
                  <ModelComparisonPanel features={result?.current || {
                    temperature: 28,
                    precipitation: 120,
                    soil_moisture: 0.35,
                    wind_speed: 3.2,
                    pressure: 1012
                  }} />
                  <SHAPExplanation features={result?.current || {
                    temperature: 28,
                    precipitation: 120,
                    soil_moisture: 0.35,
                    wind_speed: 3.2,
                    pressure: 1012
                  }} />
                </div>

                {/* Climate Projections */}
                <div style={{ marginBottom: "24px" }}>
                  <ClimateProjections selectedTaluk="Central" />
                </div>

                {/* Taluk Stress Heatmap */}
                <TalukStressHeatmap onTalukSelect={(taluk) => console.log("Selected:", taluk)} />
              </div>
            )}

            {/* Map Tab - Enhanced with Layers */}
            {activeTab === "map" && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <EnhancedMap />
              </div>
            )}

            {/* ChatBot Tab */}
            {activeTab === "chatbot" && (
              <div style={{ ...styles.chatbotContainer, animation: "fadeIn 0.4s ease-out" }} className="glass-card">
                <ChatBot mode="tab" />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <span style={styles.footerLogo}>🌾</span>
            <span style={styles.footerName}>AgriDSS</span>
          </div>
          <p style={styles.footerText}>{t("footerText")}</p>
          <div style={styles.footerLinks}>
            <span style={styles.footerLink}>v2.0</span>
            <span style={styles.footerDot}>•</span>
            <span style={styles.footerLink}>Made with 💚</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 30%, #f8fafc 70%, #f0fdf4 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1e293b",
    position: "relative",
    overflow: "hidden",
  },
  bgGradient: {
    position: "fixed",
    inset: 0,
    background: `
      radial-gradient(ellipse 80% 40% at 20% 10%, rgba(34, 197, 94, 0.08), transparent 50%),
      radial-gradient(ellipse 60% 40% at 80% 90%, rgba(74, 222, 128, 0.06), transparent 50%),
      radial-gradient(ellipse 50% 30% at 50% 50%, rgba(34, 197, 94, 0.03), transparent)
    `,
    pointerEvents: "none",
    zIndex: 0,
  },
  bgGrid: {
    position: "fixed",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
    pointerEvents: "none",
    zIndex: 0,
  },
  bgOrb1: {
    position: "fixed",
    top: "10%",
    left: "-5%",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(34, 197, 94, 0.12), transparent 60%)",
    borderRadius: "50%",
    pointerEvents: "none",
    filter: "blur(100px)",
    zIndex: 0,
  },
  bgOrb2: {
    position: "fixed",
    bottom: "5%",
    right: "-5%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(74, 222, 128, 0.1), transparent 60%)",
    borderRadius: "50%",
    pointerEvents: "none",
    filter: "blur(80px)",
    zIndex: 0,
  },
  bgOrb3: {
    position: "fixed",
    top: "40%",
    left: "30%",
    width: "700px",
    height: "700px",
    background: "radial-gradient(circle, rgba(34, 197, 94, 0.06), transparent 60%)",
    borderRadius: "50%",
    pointerEvents: "none",
    filter: "blur(120px)",
    transform: "translate(-50%, -50%)",
    zIndex: 0,
  },
  floatingElements: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    overflow: "hidden",
  },
  floatingLeaf: {
    position: "absolute",
    top: "-60px",
    fontSize: "32px",
    opacity: 0.2,
    animation: "leafFloat 12s ease-in-out infinite",
    filter: "drop-shadow(0 4px 12px rgba(34, 197, 94, 0.2))",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255, 255, 255, 0.95)",
    borderBottom: "1px solid rgba(34, 197, 94, 0.15)",
    padding: "16px 32px",
    transition: "all 0.3s ease",
    backdropFilter: "blur(20px)",
  },
  headerScrolled: {
    background: "rgba(255, 255, 255, 0.98)",
    boxShadow: "0 4px 30px rgba(34, 197, 94, 0.1)",
  },
  headerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logoWrap: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(145deg, #22c55e, #16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.35)",
  },
  logo: {
    fontSize: "28px",
    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
  },
  title: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: "700",
    fontFamily: "'Poppins', sans-serif",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },
  tagline: {
    margin: 0,
    fontSize: "0.7rem",
    color: "#64748b",
    fontWeight: "500",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontFamily: "'Inter', sans-serif",
  },
  languageSelector: {
    display: "flex",
    gap: "6px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "14px",
    padding: "6px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
  },
  langButton: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "10px",
    background: "transparent",
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  },
  langButtonActive: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 16px rgba(34, 197, 94, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
    transform: "scale(1.05)",
  },
  langFlag: {
    fontSize: "18px",
    lineHeight: 1,
    filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
  },
  langCode: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: "0.75rem",
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  main: {
    flex: 1,
    padding: "40px 32px",
    position: "relative",
    zIndex: 1,
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  tabNav: {
    marginBottom: "32px",
  },
  tabContainer: {
    display: "inline-flex",
    gap: "6px",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "20px",
    padding: "8px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    boxShadow: "0 8px 40px rgba(34, 197, 94, 0.1)",
    backdropFilter: "blur(20px)",
  },
  tabButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 26px",
    border: "1px solid transparent",
    borderRadius: "14px",
    fontSize: "0.9rem",
    fontWeight: "500",
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    transition: "all 0.25s ease",
    outline: "none",
    whiteSpace: "nowrap",
    position: "relative",
  },
  tabButtonActive: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    borderColor: "transparent",
    boxShadow: "0 6px 25px rgba(34, 197, 94, 0.35)",
  },
  tabButtonInactive: {
    background: "transparent",
    color: "#64748b",
    borderColor: "transparent",
  },
  tabIcon: {
    fontSize: "18px",
  },
  tabLabel: {
    fontFamily: "'Poppins', sans-serif",
    letterSpacing: "0.3px",
  },
  content: {
    position: "relative",
  },
  results: {
    animation: "fadeIn 0.5s ease-out",
  },
  chatbotContainer: {
    padding: "0",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "24px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    boxShadow: "0 12px 50px rgba(34, 197, 94, 0.12)",
    minHeight: "700px",
    overflow: "hidden",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 50px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,253,244,0.95) 100%)",
    borderRadius: "28px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    boxShadow: "0 15px 60px rgba(34, 197, 94, 0.1)",
    backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=60')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
    overflow: "hidden",
  },
  emptyHero: {
    marginBottom: "36px",
    position: "relative",
    zIndex: 2,
  },
  emptyIconWrap: {
    width: "100px",
    height: "100px",
    borderRadius: "28px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "3px solid rgba(255, 255, 255, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    animation: "float 4s ease-in-out infinite",
    boxShadow: "0 15px 50px rgba(34, 197, 94, 0.35)",
  },
  emptyIcon: {
    fontSize: "48px",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
  },
  emptyTitle: {
    margin: "0 0 12px 0",
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: "-0.3px",
    fontFamily: "'Poppins', sans-serif",
    textShadow: "0 2px 10px rgba(255,255,255,0.8)",
  },
  emptySubtitle: {
    color: "#475569",
    fontSize: "1rem",
    margin: "0",
    fontFamily: "'Inter', sans-serif",
    textShadow: "0 1px 5px rgba(255,255,255,0.8)",
  },
  emptyFeaturesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "36px",
    position: "relative",
    zIndex: 2,
  },
  emptyFeatureCard: {
    background: "rgba(255, 255, 255, 0.95)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "20px",
    padding: "24px 18px",
    textAlign: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.1)",
  },
  emptyFeatureIcon: {
    fontSize: "2.2rem",
    marginBottom: "12px",
    display: "block",
  },
  emptyFeatureTitle: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "6px",
    fontFamily: "'Poppins', sans-serif",
  },
  emptyFeatureDesc: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontFamily: "'Inter', sans-serif",
  },
  emptyCta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    position: "relative",
    zIndex: 2,
  },
  emptyCtaArrow: {
    fontSize: "1.8rem",
    color: "#22c55e",
    animation: "float 2s ease-in-out infinite",
    textShadow: "0 4px 15px rgba(34, 197, 94, 0.3)",
  },
  emptyCtaText: {
    color: "#475569",
    fontSize: "0.9rem",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "500",
    background: "rgba(255,255,255,0.85)",
    padding: "8px 20px",
    borderRadius: "100px",
  },
  footer: {
    background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f0fdf4 100%)",
    borderTop: "1px solid rgba(34, 197, 94, 0.2)",
    padding: "40px 32px",
    position: "relative",
    zIndex: 1,
  },
  footerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
  },
  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  footerLogo: {
    fontSize: "22px",
  },
  footerName: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#16a34a",
  },
  footerText: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#64748b",
  },
  footerLinks: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  footerLink: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontFamily: "'Inter', sans-serif",
  },
  footerDot: {
    color: "#94a3b8",
  },
  userSection: {
    position: "relative",
  },
  userButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 14px 6px 6px",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "50px",
    cursor: "pointer",
    color: "#1e293b",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.15)",
  },
  userAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    color: "white",
    boxShadow: "0 3px 10px rgba(34, 197, 94, 0.3)",
  },
  userName: {
    fontSize: "0.85rem",
    fontWeight: "600",
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#1e293b",
  },
  userDropdown: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    width: "280px",
    background: "rgba(255, 255, 255, 0.98)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "20px",
    boxShadow: "0 15px 50px rgba(34, 197, 94, 0.15)",
    overflow: "hidden",
    animation: "fadeIn 0.2s ease-out",
    zIndex: 200,
  },
  userDropdownHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "18px",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
  },
  userDropdownAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0,
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)",
  },
  userDropdownName: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1e293b",
  },
  userDropdownEmail: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "4px",
  },
  userDropdownDivider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.2), transparent)",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "16px 18px",
    background: "transparent",
    border: "none",
    color: "#dc2626",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'Poppins', sans-serif",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  profileButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "linear-gradient(135deg, #ffffff, #f0fdf4)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: "12px",
    cursor: "pointer",
    color: "#16a34a",
    fontSize: "0.85rem",
    fontWeight: "600",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.1)",
    fontFamily: "'Poppins', sans-serif",
  },
  profileButtonText: {
    fontFamily: "'Poppins', sans-serif",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease-out",
  },
  modalContent: {
    position: "relative",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "32px",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 25px 80px rgba(0, 0, 0, 0.3)",
    animation: "slideIn 0.3s ease-out",
  },
  modalClose: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "rgba(239, 68, 68, 0.1)",
    border: "none",
    color: "#ef4444",
    fontSize: "24px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    zIndex: 10,
  },
};

export default Dashboard;
