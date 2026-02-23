import { useState, useEffect } from "react";
import { useLanguage } from "../LanguageContext";

const CSS = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  
  .profile-input:focus { 
    border-color: rgba(34, 197, 94, 0.5) !important; 
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1) !important; 
    outline: none !important; 
  }
  
  .crop-tag { 
    transition: all 0.2s ease !important; 
  }
  .crop-tag:hover { 
    transform: translateY(-2px) !important; 
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2) !important; 
  }
  
  .save-btn { 
    transition: all 0.3s ease !important; 
  }
  .save-btn:hover:not(:disabled) { 
    transform: translateY(-2px) !important; 
    box-shadow: 0 10px 30px rgba(34, 197, 94, 0.35) !important; 
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

const AVAILABLE_CROPS = [
  { name: "Rice", icon: "🌾", color: "#fbbf24" },
  { name: "Wheat", icon: "🌾", color: "#f59e0b" },
  { name: "Maize", icon: "🌽", color: "#eab308" },
  { name: "Sugarcane", icon: "🎋", color: "#84cc16" },
  { name: "Coconut", icon: "🥥", color: "#10b981" },
  { name: "Banana", icon: "🍌", color: "#fef08a" },
  { name: "Vegetables", icon: "🥬", color: "#4ade80" },
  { name: "Cotton", icon: "☁️", color: "#e0e7ff" },
  { name: "Groundnut", icon: "🥜", color: "#d97706" },
  { name: "Pulses", icon: "🫘", color: "#78350f" }
];

const SOIL_TYPES = ["Red Soil", "Black Soil", "Laterite", "Alluvial", "Sandy Loam"];
const WATER_SOURCES = ["Borewell", "Canal", "River", "Pond", "Rainwater"];

export default function Profile({ user, userProfile, onSave }) {
  inject("profile-component", CSS);
  const { t } = useLanguage();

  const [profile, setProfile] = useState(() => {
    // Initialize with userProfile if available, otherwise use default values
    if (userProfile) {
      return userProfile;
    }
    return {
      name: user?.name || user?.username || "",
      phone: user?.phone || "",
      district: "",
      taluk: "",
      village: "",
      totalLand: "",
      irrigatedLand: "",
      soilType: "",
      waterSource: "",
      crops: []
    };
  });

  const [cropEntry, setCropEntry] = useState({
    crop: "",
    hectares: "",
    season: "Kharif"
  });

  const [saved, setSaved] = useState(false);

  // Sync profile state when userProfile prop changes
  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [userProfile]);

  const addCrop = () => {
    if (!cropEntry.crop || !cropEntry.hectares) return;
    
    const newCrop = {
      ...cropEntry,
      id: Date.now(),
      hectares: parseFloat(cropEntry.hectares)
    };
    
    setProfile(prev => ({
      ...prev,
      crops: [...prev.crops, newCrop]
    }));
    
    setCropEntry({ crop: "", hectares: "", season: "Kharif" });
  };

  const removeCrop = (id) => {
    setProfile(prev => ({
      ...prev,
      crops: prev.crops.filter(c => c.id !== id)
    }));
  };

  const handleSave = () => {
    // Call parent callback with profile data
    if (onSave) {
      onSave(profile);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalCropArea = profile.crops.reduce((sum, crop) => sum + crop.hectares, 0);

  return (
    <div style={styles.container}>
      <style>{CSS}</style>
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>👤</div>
        <div>
          <h1 style={styles.title}>{t("profileTitle")}</h1>
          <p style={styles.subtitle}>{t("profileSubtitle") || "Manage your farm details for personalized recommendations"}</p>
        </div>
      </div>

      {/* Profile Summary Card */}
      {profile.crops.length > 0 && (
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <span style={styles.summaryIcon}>🌾</span>
            <h3 style={styles.summaryTitle}>{t("farmSummary") || "Farm Summary"}</h3>
          </div>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>{t("totalLand") || "Total Land"}</div>
              <div style={styles.summaryValue}>{profile.totalLand || "—"} ha</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>{t("cropArea") || "Crop Area"}</div>
              <div style={styles.summaryValue}>{totalCropArea.toFixed(2)} ha</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>{t("cropsCount") || "Crops"}</div>
              <div style={styles.summaryValue}>{profile.crops.length}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>{t("soilType") || "Soil Type"}</div>
              <div style={styles.summaryValue}>{profile.soilType || "—"}</div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {/* Personal Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>👨‍🌾</span>
            <span>{t("personalDetails") || "Personal Details"}</span>
          </h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t("fullName") || "Full Name"}</label>
            <input
              className="profile-input"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder={t("enterName") || "Enter your name"}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t("phoneNumber") || "Phone Number"}</label>
            <input
              className="profile-input"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+91 1234567890"
              style={styles.input}
            />
          </div>
        </div>

        {/* Location */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>📍</span>
            <span>{t("locationDetails") || "Location"}</span>
          </h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>{t("district") || "District"}</label>
            <input
              className="profile-input"
              type="text"
              value={profile.district}
              onChange={(e) => setProfile({ ...profile, district: e.target.value })}
              placeholder={t("districtPlaceholder") || "e.g., Palakkad, Wayanad, Thrissur"}
              style={styles.input}
            />
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t("taluk") || "Taluk"}</label>
              <input
                className="profile-input"
                type="text"
                value={profile.taluk}
                onChange={(e) => setProfile({ ...profile, taluk: e.target.value })}
                placeholder={t("talukPlaceholder") || "Taluk name"}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t("village") || "Village"}</label>
              <input
                className="profile-input"
                type="text"
                value={profile.village}
                onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                placeholder={t("villagePlaceholder") || "Village name"}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Land Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>🏞️</span>
            <span>{t("landDetails") || "Land Details"}</span>
          </h2>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Total Land (hectares)</label>
              <input
                className="profile-input"
                type="number"
                step="0.01"
                value={profile.totalLand}
                onChange={(e) => setProfile({ ...profile, totalLand: e.target.value })}
                placeholder="0.00"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Irrigated Land (hectares)</label>
              <input
                className="profile-input"
                type="number"
                step="0.01"
                value={profile.irrigatedLand}
                onChange={(e) => setProfile({ ...profile, irrigatedLand: e.target.value })}
                placeholder="0.00"
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Soil Type</label>
              <select
                className="profile-input"
                value={profile.soilType}
                onChange={(e) => setProfile({ ...profile, soilType: e.target.value })}
                style={styles.input}
              >
                <option value="">Select soil type</option>
                {SOIL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Water Source</label>
              <select
                className="profile-input"
                value={profile.waterSource}
                onChange={(e) => setProfile({ ...profile, waterSource: e.target.value })}
                style={styles.input}
              >
                <option value="">Select water source</option>
                {WATER_SOURCES.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Crop Details */}
        <div style={styles.sectionFull}>
          <h2 style={styles.sectionTitle}>
            <span>🌱</span>
            <span>Your Crops</span>
          </h2>
          
          {/* Add Crop Form */}
          <div style={styles.addCropForm}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Crop</label>
                <select
                  className="profile-input"
                  value={cropEntry.crop}
                  onChange={(e) => setCropEntry({ ...cropEntry, crop: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select a crop</option>
                  {AVAILABLE_CROPS.map(crop => (
                    <option key={crop.name} value={crop.name}>
                      {crop.icon} {crop.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Area (hectares)</label>
                <input
                  className="profile-input"
                  type="number"
                  step="0.01"
                  value={cropEntry.hectares}
                  onChange={(e) => setCropEntry({ ...cropEntry, hectares: e.target.value })}
                  placeholder="0.00"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Season</label>
                <select
                  className="profile-input"
                  value={cropEntry.season}
                  onChange={(e) => setCropEntry({ ...cropEntry, season: e.target.value })}
                  style={styles.input}
                >
                  <option value="Kharif">Kharif (Jun-Oct)</option>
                  <option value="Rabi">Rabi (Nov-Mar)</option>
                  <option value="Zaid">Zaid (Apr-May)</option>
                  <option value="Perennial">Perennial</option>
                </select>
              </div>
              <button
                onClick={addCrop}
                disabled={!cropEntry.crop || !cropEntry.hectares}
                style={{
                  ...styles.addButton,
                  cursor: (!cropEntry.crop || !cropEntry.hectares) ? 'not-allowed' : 'pointer',
                  opacity: (!cropEntry.crop || !cropEntry.hectares) ? 0.5 : 1
                }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Crop List */}
          {profile.crops.length > 0 ? (
            <div style={styles.cropList}>
              {profile.crops.map((crop) => {
                const cropData = AVAILABLE_CROPS.find(c => c.name === crop.crop);
                return (
                  <div key={crop.id} className="crop-tag" style={styles.cropTag}>
                    <div style={styles.cropTagLeft}>
                      <span style={styles.cropIcon}>{cropData?.icon || "🌱"}</span>
                      <div>
                        <div style={styles.cropName}>{crop.crop}</div>
                        <div style={styles.cropDetails}>
                          {crop.hectares} ha • {crop.season}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCrop(crop.id)}
                      style={styles.removeButton}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🌾</div>
              <p style={styles.emptyText}>No crops added yet. Add your crops to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button
          className="save-btn"
          onClick={handleSave}
          style={styles.saveButton}
        >
          {saved ? "✓ Saved!" : "💾 Save Profile"}
        </button>
      </div>

      {/* Success Message */}
      {saved && (
        <div style={styles.successMessage}>
          <span style={styles.successIcon}>✓</span>
          <span>Profile updated successfully!</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 24px",
    animation: "fadeIn 0.5s ease-out"
  },
  
  // Header
  header: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "40px",
    padding: "32px",
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(240, 253, 244, 0.8))",
    borderRadius: "20px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    animation: "slideUp 0.5s ease-out"
  },
  headerIcon: {
    fontSize: "56px",
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(74, 222, 128, 0.1))",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid rgba(34, 197, 94, 0.3)"
  },
  title: {
    margin: "0 0 8px",
    fontSize: "2rem",
    fontWeight: 800,
    color: "#1f2937",
    fontFamily: "'Poppins', sans-serif"
  },
  subtitle: {
    margin: 0,
    fontSize: "1rem",
    color: "#64748b",
    fontFamily: "'Inter', sans-serif"
  },
  
  // Summary Card
  summaryCard: {
    marginBottom: "32px",
    padding: "28px",
    background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    borderRadius: "20px",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.12)",
    animation: "slideUp 0.6s ease-out"
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px"
  },
  summaryIcon: {
    fontSize: "28px"
  },
  summaryTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937",
    fontFamily: "'Poppins', sans-serif"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px"
  },
  summaryItem: {
    textAlign: "center"
  },
  summaryLabel: {
    fontSize: "0.85rem",
    color: "#64748b",
    marginBottom: "8px"
  },
  summaryValue: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#22c55e",
    fontFamily: "'Poppins', sans-serif"
  },
  
  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "24px",
    marginBottom: "32px"
  },
  
  // Sections
  section: {
    padding: "28px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.08)",
    animation: "slideUp 0.6s ease-out"
  },
  sectionFull: {
    gridColumn: "1 / -1",
    padding: "28px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.08)",
    animation: "slideUp 0.6s ease-out"
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "0 0 24px",
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937",
    fontFamily: "'Poppins', sans-serif"
  },
  
  // Form
  formGroup: {
    marginBottom: "20px",
    flex: 1
  },
  formRow: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-end"
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#374151",
    fontFamily: "'Inter', sans-serif"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    background: "rgba(255, 255, 255, 0.95)",
    fontSize: "0.95rem",
    color: "#1f2937",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    transition: "all 0.2s ease"
  },
  
  // Add Crop Form
  addCropForm: {
    marginBottom: "24px",
    padding: "24px",
    background: "rgba(240, 253, 244, 0.6)",
    borderRadius: "16px",
    border: "1px solid rgba(34, 197, 94, 0.2)"
  },
  addButton: {
    padding: "14px 24px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "28px",
    fontFamily: "'Poppins', sans-serif",
    boxShadow: "0 6px 20px rgba(34, 197, 94, 0.3)"
  },
  
  // Crop List
  cropList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px"
  },
  cropTag: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "rgba(240, 253, 244, 0.9)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.08)"
  },
  cropTagLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  cropIcon: {
    fontSize: "32px"
  },
  cropName: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1f2937",
    fontFamily: "'Poppins', sans-serif"
  },
  cropDetails: {
    fontSize: "0.85rem",
    color: "#64748b",
    fontFamily: "'Inter', sans-serif"
  },
  removeButton: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    background: "rgba(255, 255, 255, 0.9)",
    color: "#dc2626",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  
  // Empty State
  emptyState: {
    textAlign: "center",
    padding: "60px 20px"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.5
  },
  emptyText: {
    fontSize: "1rem",
    color: "#64748b",
    fontFamily: "'Inter', sans-serif"
  },
  
  // Actions
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginTop: "32px"
  },
  saveButton: {
    padding: "18px 48px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontSize: "1.1rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)"
  },
  
  // Success Message
  successMessage: {
    position: "fixed",
    bottom: "32px",
    right: "32px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 24px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    borderRadius: "14px",
    boxShadow: "0 8px 30px rgba(34, 197, 94, 0.4)",
    fontSize: "1rem",
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    animation: "slideUp 0.3s ease-out",
    zIndex: 1000
  },
  successIcon: {
    fontSize: "20px"
  }
};
