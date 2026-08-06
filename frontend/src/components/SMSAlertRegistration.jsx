import React, { useState } from 'react';

const SMSAlertRegistration = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState(['weather', 'pest']);
  const [language, setLanguage] = useState('ml');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Add CSS for input placeholder
  const inputPlaceholderStyle = `
    input::placeholder {
      color: #9ca3af !important;
      opacity: 1 !important;
    }
    input:-ms-input-placeholder {
      color: #9ca3af !important;
    }
    input::-ms-input-placeholder {
      color: #9ca3af !important;
    }
  `;

  const crops = [
    { id: 'rice', name: 'Rice', nameML: 'നെല്ല്' },
    { id: 'coconut', name: 'Coconut', nameML: 'തേങ്ങ' },
    { id: 'banana', name: 'Banana', nameML: 'വാഴ' },
    { id: 'arecanut', name: 'Arecanut', nameML: 'അടക്ക' },
    { id: 'rubber', name: 'Rubber', nameML: 'റബ്ബർ' },
    { id: 'vegetables', name: 'Vegetables', nameML: 'പച്ചക്കറി' },
  ];

  const alertTypes = [
    { id: 'weather', name: 'Weather Alerts', nameML: 'കാലാവസ്ഥ', icon: '🌧️' },
    { id: 'pest', name: 'Pest Warnings', nameML: 'കീട മുന്നറിയിപ്പ്', icon: '🐛' },
    { id: 'price', name: 'Market Prices', nameML: 'വിപണി വില', icon: '💰' },
    { id: 'advisory', name: 'Crop Advisory', nameML: 'വിള ഉപദേശം', icon: '🌾' },
  ];

  const languages = [
    { id: 'ml', name: 'Malayalam', nameNative: 'മലയാളം' },
    { id: 'en', name: 'English', nameNative: 'English' },
    { id: 'ta', name: 'Tamil', nameNative: 'தமிழ்' },
    { id: 'hi', name: 'Hindi', nameNative: 'हिंदी' },
  ];

  const handleCropToggle = (cropId) => {
    setSelectedCrops(prev => 
      prev.includes(cropId) 
        ? prev.filter(c => c !== cropId)
        : [...prev, cropId]
    );
  };

  const handleAlertToggle = (alertId) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(a => a !== alertId)
        : [...prev, alertId]
    );
  };

  const handleRegister = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    if (selectedCrops.length === 0) {
      alert('Please select at least one crop');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call (in real app, this would hit backend)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store locally for offline access
      const registration = {
        phone: phoneNumber,
        crops: selectedCrops,
        alerts: selectedAlerts,
        language,
        registeredAt: new Date().toISOString(),
      };
      localStorage.setItem('smsAlertRegistration', JSON.stringify(registration));
      
      setIsRegistered(true);
    } catch (error) {
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '24px',
  };

  const sectionStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '10px',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '1.1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    fontFamily: 'monospace',
    color: '#1f2937',
    backgroundColor: 'white',
  };

  const chipsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  };

  const chipStyle = (isSelected) => ({
    padding: '10px 16px',
    borderRadius: '20px',
    border: `2px solid ${isSelected ? '#22c55e' : '#e5e7eb'}`,
    background: isSelected ? '#dcfce7' : 'white',
    color: isSelected ? '#15803d' : '#374151',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isSelected ? '600' : '400',
    transition: 'all 0.2s',
  });

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
    transition: 'all 0.3s ease',
  };

  if (isRegistered) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#16a34a', marginBottom: '8px' }}>
            SMS Alerts Registered!
          </h2>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            You will receive alerts at <strong>{phoneNumber}</strong>
          </p>
          <div style={{ 
            background: '#f0fdf4', 
            padding: '16px', 
            borderRadius: '12px',
            textAlign: 'left',
            fontSize: '0.9rem'
          }}>
            <p><strong>📱 Your subscriptions:</strong></p>
            <p>• Crops: {selectedCrops.join(', ')}</p>
            <p>• Alerts: {selectedAlerts.join(', ')}</p>
            <p>• Language: {languages.find(l => l.id === language)?.nameNative}</p>
          </div>
          <button 
            style={{ 
              ...buttonStyle, 
              marginTop: '20px', 
              background: '#64748b',
              boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)'
            }}
            onClick={() => setIsRegistered(false)}
          >
            ✏️ Edit Preferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{inputPlaceholderStyle}</style>
      <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📱</div>
        <h2 style={{ color: '#1f2937', marginBottom: '4px' }}>
          SMS Alerts - No Internet Needed
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Receive farming advice directly on your phone via SMS
        </p>
      </div>

      {/* Phone Number */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📞 Mobile Number</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ 
            padding: '14px 12px',
            background: '#f3f4f6',
            borderRadius: '12px',
            fontWeight: '600',
            color: '#374151'
          }}>
            +91
          </span>
          <input
            type="tel"
            placeholder="Enter 10-digit number"
            style={inputStyle}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </div>
      </div>

      {/* Select Crops */}
      <div style={sectionStyle}>
        <label style={labelStyle}>🌾 Select Your Crops</label>
        <div style={chipsContainerStyle}>
          {crops.map(crop => (
            <button
              key={crop.id}
              style={chipStyle(selectedCrops.includes(crop.id))}
              onClick={() => handleCropToggle(crop.id)}
            >
              {crop.name} <span style={{ opacity: 0.7 }}>({crop.nameML})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alert Types */}
      <div style={sectionStyle}>
        <label style={labelStyle}>🔔 Alert Types</label>
        <div style={chipsContainerStyle}>
          {alertTypes.map(alert => (
            <button
              key={alert.id}
              style={chipStyle(selectedAlerts.includes(alert.id))}
              onClick={() => handleAlertToggle(alert.id)}
            >
              {alert.icon} {alert.name}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={sectionStyle}>
        <label style={labelStyle}>🗣️ SMS Language</label>
        <div style={chipsContainerStyle}>
          {languages.map(lang => (
            <button
              key={lang.id}
              style={chipStyle(language === lang.id)}
              onClick={() => setLanguage(lang.id)}
            >
              {lang.nameNative}
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        background: '#fef3c7',
        border: '1px solid #fcd34d',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '20px',
        fontSize: '0.9rem',
        color: '#92400e',
      }}>
        <strong>💡 How it works:</strong>
        <ul style={{ marginTop: '8px', marginLeft: '16px', lineHeight: '1.6' }}>
          <li>Get weather alerts before rain/storms</li>
          <li>Receive pest warnings for your crops</li>
          <li>Daily market price updates</li>
          <li>Works on any phone - no smartphone needed!</li>
        </ul>
      </div>

      {/* Register Button */}
      <button 
        style={{
          ...buttonStyle,
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transform: isLoading ? 'scale(0.98)' : 'scale(1)',
        }}
        onClick={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <>⏳ Registering...</>
        ) : (
          <>📲 Register for SMS Alerts</>
        )}
      </button>

      {/* Alternative */}
      <div style={{ 
        marginTop: '16px', 
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#64748b'
      }}>
        Or send <strong>START</strong> to <strong>56789</strong> from your phone
      </div>
    </div>
    </>
  );
};

export default SMSAlertRegistration;
