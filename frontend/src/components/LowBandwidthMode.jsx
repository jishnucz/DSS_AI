import React, { useState, useEffect } from 'react';

const LowBandwidthMode = ({ onModeChange }) => {
  const [isLowBandwidth, setIsLowBandwidth] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('lowBandwidthMode');
    if (saved !== null) return saved === 'true';
    
    // Auto-detect slow connection
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return conn.effectiveType === 'slow-2g' || 
             conn.effectiveType === '2g' ||
             conn.saveData === true;
    }
    return false;
  });

  const [settings, setSettings] = useState({
    disableImages: true,
    disableAnimations: true,
    compressResponses: true,
    cacheAggressive: true,
  });

  useEffect(() => {
    // Save preference
    localStorage.setItem('lowBandwidthMode', isLowBandwidth.toString());
    
    // Apply CSS changes for low bandwidth
    if (isLowBandwidth) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.body.classList.add('low-bandwidth');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.body.classList.remove('low-bandwidth');
    }
    
    // Notify parent component
    if (onModeChange) {
      onModeChange(isLowBandwidth, settings);
    }
  }, [isLowBandwidth, settings, onModeChange]);

  // Auto-detect connection changes
  useEffect(() => {
    if ('connection' in navigator) {
      const handleConnectionChange = () => {
        const conn = navigator.connection;
        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
          setIsLowBandwidth(true);
        }
      };
      navigator.connection.addEventListener('change', handleConnectionChange);
      return () => navigator.connection.removeEventListener('change', handleConnectionChange);
    }
  }, []);

  const containerStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    marginBottom: '16px',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  };

  const titleStyle = {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const toggleStyle = {
    width: '56px',
    height: '28px',
    borderRadius: '14px',
    background: isLowBandwidth ? '#22c55e' : '#d1d5db',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.3s',
    border: 'none',
  };

  const toggleKnobStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    background: 'white',
    position: 'absolute',
    top: '2px',
    left: isLowBandwidth ? '30px' : '2px',
    transition: 'left 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  };

  const infoStyle = {
    background: '#f0fdf4',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '0.9rem',
    color: '#166534',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  };

  const settingsGridStyle = {
    display: 'grid',
    gap: '10px',
  };

  const settingItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    fontSize: '0.9rem',
  };

  const checkboxStyle = {
    width: '20px',
    height: '20px',
    accentColor: '#22c55e',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          <span>🐌</span>
          Low Bandwidth Mode
        </div>
        <button 
          style={toggleStyle}
          onClick={() => setIsLowBandwidth(!isLowBandwidth)}
          aria-label="Toggle low bandwidth mode"
        >
          <div style={toggleKnobStyle}></div>
        </button>
      </div>

      {isLowBandwidth && (
        <>
          <div style={infoStyle}>
            <span>💡</span>
            <div>
              <strong>Data saver active!</strong> The app will use less data by disabling images 
              and animations. Perfect for 2G/3G connections or when data is expensive.
            </div>
          </div>

          <div style={settingsGridStyle}>
            <div style={settingItemStyle}>
              <span>🖼️ Disable satellite images</span>
              <input 
                type="checkbox" 
                style={checkboxStyle}
                checked={settings.disableImages}
                onChange={(e) => setSettings(s => ({...s, disableImages: e.target.checked}))}
              />
            </div>
            <div style={settingItemStyle}>
              <span>✨ Disable animations</span>
              <input 
                type="checkbox" 
                style={checkboxStyle}
                checked={settings.disableAnimations}
                onChange={(e) => setSettings(s => ({...s, disableAnimations: e.target.checked}))}
              />
            </div>
            <div style={settingItemStyle}>
              <span>📦 Compress API responses</span>
              <input 
                type="checkbox" 
                style={checkboxStyle}
                checked={settings.compressResponses}
                onChange={(e) => setSettings(s => ({...s, compressResponses: e.target.checked}))}
              />
            </div>
            <div style={settingItemStyle}>
              <span>💾 Aggressive caching</span>
              <input 
                type="checkbox" 
                style={checkboxStyle}
                checked={settings.cacheAggressive}
                onChange={(e) => setSettings(s => ({...s, cacheAggressive: e.target.checked}))}
              />
            </div>
          </div>
        </>
      )}

      {!isLowBandwidth && (
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Enable this if you have slow internet (2G/3G) or want to save mobile data. 
          The app will load faster and use less data.
        </p>
      )}
    </div>
  );
};

export default LowBandwidthMode;
