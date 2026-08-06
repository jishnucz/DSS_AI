import React, { useState, useEffect } from 'react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [connectionType, setConnectionType] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" message briefly
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    // Detect connection type (2G, 3G, 4G, etc.)
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const conn = navigator.connection;
        setConnectionType({
          effectiveType: conn.effectiveType, // 'slow-2g', '2g', '3g', '4g'
          downlink: conn.downlink, // Mbps
          rtt: conn.rtt, // Round trip time in ms
          saveData: conn.saveData // Data saver mode
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  // Determine if connection is slow
  const isSlowConnection = connectionType && 
    (connectionType.effectiveType === 'slow-2g' || 
     connectionType.effectiveType === '2g' ||
     connectionType.downlink < 0.5);

  if (!showBanner && isOnline && !isSlowConnection) {
    return null;
  }

  const bannerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    background: isOnline 
      ? (isSlowConnection ? '#fef3c7' : '#dcfce7') 
      : '#fee2e2',
    borderTop: `2px solid ${isOnline 
      ? (isSlowConnection ? '#f59e0b' : '#22c55e') 
      : '#ef4444'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const iconStyle = {
    fontSize: '20px',
    marginRight: '10px',
  };

  const textStyle = {
    flex: 1,
    fontSize: '14px',
    color: isOnline 
      ? (isSlowConnection ? '#92400e' : '#166534') 
      : '#991b1b',
  };

  const buttonStyle = {
    padding: '6px 12px',
    background: 'white',
    border: `1px solid ${isOnline ? '#22c55e' : '#ef4444'}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  };

  return (
    <div style={bannerStyle}>
      <span style={iconStyle}>
        {isOnline ? (isSlowConnection ? '🐌' : '✅') : '📴'}
      </span>
      <div style={textStyle}>
        {!isOnline && (
          <>
            <strong>You're offline</strong> - Using cached data. 
            <span style={{ opacity: 0.8 }}> Basic features still work!</span>
          </>
        )}
        {isOnline && isSlowConnection && (
          <>
            <strong>Slow connection ({connectionType?.effectiveType?.toUpperCase()})</strong> - 
            <span style={{ opacity: 0.8 }}> Low Bandwidth Mode enabled automatically</span>
          </>
        )}
        {isOnline && !isSlowConnection && (
          <>
            <strong>Back online!</strong> - Syncing data...
          </>
        )}
      </div>
      {!isOnline && (
        <button 
          style={buttonStyle} 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      )}
      {isOnline && (
        <button 
          style={buttonStyle} 
          onClick={() => setShowBanner(false)}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default OfflineIndicator;
