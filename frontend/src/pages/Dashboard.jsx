import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../LanguageContext";

import Welcome from "../components/Welcome";
import Profile from "../components/Profile";
import SmartAdvisor from "../components/SmartAdvisor";
import CropDiseaseDetector from "../components/CropDiseaseDetector";
import VoiceAssistant from "../components/VoiceAssistant";
import NDVIViewer from "../components/NDVIViewer";
import OfflineSettings from "../components/OfflineSettings";
import OfflineIndicator from "../components/OfflineIndicator";
import EnhancedMap from "../components/EnhancedMap";

import AnalysisResearch from "../components/AnalysisResearch";
import PredictiveAdvisory from "../components/PredictiveAdvisory";

import ErrorBoundary from "../components/ErrorBoundary";
import { KeyboardManager, useTabNavigation } from "../components/KeyboardShortcuts";
import { useToast } from "../components/Toast";

import "./dashboard-pro.css";

// Modern icon component for sidebar navigation
function NavIcon({ id, label }) {
  const iconMap = {
    welcome: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
      </svg>
    ),
    advisor: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    ),
    dss: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>
    ),
    disease: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    ),
    voice: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/><path d="M17 16.91c-1.48 1.46-3.51 2.37-5.7 2.37-2.2 0-4.23-.91-5.7-2.37M19 12c0 .55-.45 1-1 1s-1-.45-1-1c0-2.64-2.05-4.78-4.7-4.78-.25 0-.5.02-.74.07-.55.1-.99-.35-1.09-.9-.1-.55.35-.99.9-1.09.32-.06.65-.09.99-.09 3.87 0 7 3.13 7 7z"/>
      </svg>
    ),
    satellite: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M16 9h-3V5h3V9zm8-4v8h-2V7h-6V5h8zm-4 15l-4-3.2V14h-8v6h8v-1.8L20 20z"/>
      </svg>
    ),
    research: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/>
      </svg>
    ),
    map: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    offline: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="nav-svg-icon">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
    ),
  };
  
  return iconMap[id] || <span className="nav-text-icon">{label.substring(0, 2).toUpperCase()}</span>;
}

function Dashboard({ user, onLogout }) {
  const { language, setLanguage, t } = useLanguage();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("welcome");
  const [detectedCropData, setDetectedCropData] = useState(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("agridss_user_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const tabs = useMemo(
    () => [
      { id: "welcome", icon: "W", label: t("tabWelcome") || "Welcome", group: "Main" },
      { id: "advisor", icon: "SA", label: "Smart Advisor", group: "Main" },
      { id: "analysis", icon: "DS", label: "Analysis & Research", group: "Analysis" },
      { id: "disease", icon: "DA", label: "Disease AI", group: "Analysis" },
      { id: "voice", icon: "VA", label: "Voice", group: "Tools" },
      { id: "satellite", icon: "SV", label: "Satellite", group: "Tools" },
      { id: "map", icon: "MP", label: t("tabMap") || "Map", group: "Insights" },
      { id: "predictive", icon: "LF", label: "Live 7-Day Forecast", group: "Insights" },
      { id: "offline", icon: "OF", label: "Offline", group: "System" },
    ],
    [t]
  );

  const sidebarSections = useMemo(
    () =>
      tabs.reduce((sections, tab) => {
        const section = tab.group || "Other";
        if (!sections[section]) {
          sections[section] = [];
        }
        sections[section].push(tab);
        return sections;
      }, {}),
    [tabs]
  );

  useTabNavigation(setActiveTab, tabs);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onEscape = (e) => {
      if (e.key === "Escape") {
        setMobileSidebarOpen(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  const handleGetDSSHelp = (cropData) => {
    setDetectedCropData(cropData);
    setActiveTab("dss");
    toast.info("Detected crop linked to DSS analysis");
  };

  const handleGetStarted = (action) => {
    if (action === "profile") {
      setShowProfileModal(true);
      return;
    }
    const tabMap = {
      dss: "analysis", explore: "analysis", analysis: "analysis",
      advisor: "advisor", map: "map", satellite: "satellite",
      research: "analysis", disease: "disease",
    };
    const target = tabMap[action];
    if (target) setActiveTab(target);
  };

  const handleSaveProfile = (profileData) => {
    setUserProfile(profileData);
    setShowProfileModal(false);

    try {
      localStorage.setItem("agridss_user_profile", JSON.stringify(profileData));
    } catch {
      toast.warning("Profile saved in session, but local storage write failed.");
    }
  };

  const renderMainContent = () => {
    if (activeTab === "welcome") {
      return <Welcome user={user} onGetStarted={handleGetStarted} />;
    }

    if (activeTab === "advisor") {
      return (
        <ErrorBoundary>
          <SmartAdvisor onDSSAction={handleGetDSSHelp} />
        </ErrorBoundary>
      );
    }

    if (activeTab === "analysis") {
      return (
        <ErrorBoundary>
          <AnalysisResearch detectedCrop={detectedCropData} />
        </ErrorBoundary>
      );
    }

    if (activeTab === "disease") {
      return <CropDiseaseDetector />;
    }

    if (activeTab === "voice") {
      return <VoiceAssistant />;
    }

    if (activeTab === "offline") {
      return <OfflineSettings />;
    }

    if (activeTab === "satellite") {
      return (
        <section className="panel panel-airy">
          <div className="panel-head">
            <h2>Satellite Intelligence</h2>
            <p>Multi-source remote sensing signals for crop vitality and stress interpretation.</p>
          </div>
          <ErrorBoundary>
            <NDVIViewer />
          </ErrorBoundary>
        </section>
      );
    }

    if (activeTab === "predictive") {
      return (
        <section className="panel panel-airy">
          <div className="panel-head">
            <h2>Live 7-Day Forecast</h2>
            <p>LightGBM + XGBoost ensemble (86.4% test acc) · Open-Meteo ECMWF real-time · stage-aware crop advisory.</p>
          </div>
          <ErrorBoundary>
            <PredictiveAdvisory />
          </ErrorBoundary>
        </section>
      );
    }

    return (
      <ErrorBoundary>
        <EnhancedMap />
      </ErrorBoundary>
    );
  };

  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Dashboard";

  const languages = [
    { code: "en", name: "EN" },
    { code: "ml", name: "ML" },
    { code: "ta", name: "TA" },
    { code: "hi", name: "HI" },
  ];

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const welcomeLabel = user?.name ? `Welcome, ${user.name}` : "Welcome";

  return (
    <KeyboardManager onTabChange={setActiveTab} tabs={tabs}>
      <div className="dash-root">
        <div className="bg-noise" />
        <div className="bg-radial" />

        <header className="dash-topbar">
          <div className="topbar-shell">
            <div className="topbar-left">
              <button className="icon-btn mobile-only" onClick={() => setMobileSidebarOpen(true)} aria-label="Open navigation">
                ☰
              </button>
              {!isMobile && (
                <button
                  className="icon-btn sidebar-launch"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                  title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                >
                  {sidebarCollapsed ? "☰" : "⟨"}
                </button>
              )}
              <div className="brand-mark">AG</div>
              <div className="brand-copy">
                <strong>{t("appTitle") || "Palakkad DSS"}</strong>
                <span>Smart Agriculture Platform</span>
              </div>
            </div>

            <div className="topbar-center">
              <label className="topbar-search" aria-label="Search features and tools">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder={`Search in ${activeLabel}`}
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value.toLowerCase();
                    setSearchQuery(query);
                    if (query.length > 0) {
                      const results = tabs.filter(tab => 
                        tab.label.toLowerCase().includes(query) || 
                        tab.id.toLowerCase().includes(query)
                      );
                      setSearchResults(results.length > 0 ? results : null);
                    } else {
                      setSearchResults(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults && searchResults.length > 0) {
                      setActiveTab(searchResults[0].id);
                      setSearchQuery("");
                      setSearchResults(null);
                    }
                  }}
                />
              </label>
              {searchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="search-result-item"
                      onClick={() => {
                        setActiveTab(result.id);
                        setSearchQuery("");
                        setSearchResults(null);
                      }}
                    >
                      {result.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="topbar-actions">
              <div className="topbar-date">{todayLabel}</div>
              <div className="topbar-welcome">{welcomeLabel}</div>

              <div className="lang-switch">
                <button
                  className="dropdown-trigger"
                  onClick={() => setShowLanguageMenu((v) => !v)}
                  title="Change language"
                >
                  {languages.find((l) => l.code === language)?.name || "Language"}
                  <span style={{ fontSize: "0.7rem", marginLeft: "4px" }}>▼</span>
                </button>
                {showLanguageMenu && (
                  <div className="dropdown-menu">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className={"chip" + (language === lang.code ? " active" : "")}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="outline-btn" onClick={() => setShowProfileModal(true)}>
                Profile
              </button>

              <div className="user-wrap">
                <button className="user-btn" onClick={() => setShowUserMenu((v) => !v)}>
                  <span className="avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  <span className="user-text">{user?.name || "User"}</span>
                </button>
                {showUserMenu && (
                  <div className="user-menu">
                    <div className="user-menu-meta">
                      <strong>{user?.name || "User"}</strong>
                      <span>{user?.email || "No email"}</span>
                    </div>
                    <button className="danger-link" onClick={onLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className={"dash-layout" + (sidebarCollapsed && !isMobile ? " sidebar-collapsed" : "") }>
          <aside
            className={
              "dash-sidebar" +
              (sidebarCollapsed ? " collapsed" : "") +
              (mobileSidebarOpen ? " mobile-open" : "")
            }
          >
            <div className="sidebar-head">
              <div className="sidebar-head-copy">
                <span className="sidebar-title">Workspace</span>
                <span className="sidebar-subtitle">Main navigation</span>
              </div>
              {!isMobile && (
                <button
                  className="sidebar-toggle"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  aria-label="Toggle sidebar"
                >
                  <span className="sidebar-toggle-icon">{sidebarCollapsed ? "❯" : "❮"}</span>
                  <span className="sidebar-toggle-text">{sidebarCollapsed ? "Show" : "Hide"}</span>
                </button>
              )}
              {isMobile && (
                <button className="sidebar-toggle mobile-close" onClick={() => setMobileSidebarOpen(false)} aria-label="Close sidebar">
                  ✕
                </button>
              )}
            </div>

            <nav className="sidebar-nav">
              {Object.entries(sidebarSections).map(([section, sectionTabs]) => (
                <div key={section} className="sidebar-group">
                  <div className="sidebar-group-label">{section}</div>
                  <div className="sidebar-group-items">
                    {sectionTabs.map((tab) => (
                      <button
                        key={tab.id}
                        className={"nav-item" + (activeTab === tab.id ? " active" : "")}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileSidebarOpen(false);
                        }}
                        title={tab.label}
                        data-label={tab.label}
                        aria-label={tab.label}
                      >
                        <span className="nav-icon">
                          <NavIcon id={tab.id} label={tab.label} />
                        </span>
                        <span className="nav-label">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="sidebar-dock" aria-label="Quick actions">
              <button className="sidebar-dock-btn" onClick={() => setShowProfileModal(true)} title="Profile" aria-label="Profile">
                <span className="dock-icon">PR</span>
                <span className="dock-label">Profile</span>
              </button>
              <button className="sidebar-dock-btn" onClick={onLogout} title="Logout" aria-label="Logout">
                <span className="dock-icon">LO</span>
                <span className="dock-label">Logout</span>
              </button>
              <button className="sidebar-dock-btn" onClick={() => setActiveTab("analysis")} title="Analysis" aria-label="Analysis">
                <span className="dock-icon">AR</span>
                <span className="dock-label">Analysis</span>
              </button>
            </div>

          </aside>

          {mobileSidebarOpen && <button className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />}

          <section className="dash-main">{renderMainContent()}</section>
        </div>

        {showProfileModal && (
          <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
            <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn modal-close" onClick={() => setShowProfileModal(false)}>
                ✕
              </button>
              <Profile user={user} userProfile={userProfile} onSave={handleSaveProfile} />
            </div>
          </div>
        )}

        <OfflineIndicator />
      </div>
    </KeyboardManager>
  );
}

export default Dashboard;

