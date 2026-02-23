import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import SplashScreenAgriFlyer from "./components/SplashScreenAgriFlyer";
import Auth from "./components/Auth";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("palakkad_token");
    const savedUser = localStorage.getItem("palakkad_user");
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
        setShowLanding(false); // Skip landing if already authenticated
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem("palakkad_token");
        localStorage.removeItem("palakkad_user");
      }
    }
    setIsLoading(false);
  }, []);

  const handleGetStarted = () => {
    setShowLanding(false);
    setShowAuth(true);
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem("palakkad_token", token);
    localStorage.setItem("palakkad_user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("palakkad_token");
    localStorage.removeItem("palakkad_user");
    setUser(null);
    setIsAuthenticated(false);
    setShowLanding(true); // Show landing page again after logout
    setShowAuth(false);
  };

  // Show nothing while checking auth
  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Splash Screen - shown first */}
      {showSplash && <SplashScreenAgriFlyer onComplete={() => setShowSplash(false)} />}
      
      {/* Landing Page - shown after splash for non-authenticated users */}
      {!showSplash && !isAuthenticated && showLanding && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      
      {/* Auth - shown when user clicks Get Started */}
      {!showSplash && !isAuthenticated && showAuth && (
        <Auth onLogin={handleLogin} onBack={() => { setShowAuth(false); setShowLanding(true); }} />
      )}
      
      {/* Dashboard - shown after successful login */}
      {!showSplash && isAuthenticated && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
