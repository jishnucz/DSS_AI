/**
 * ⌨️ Keyboard Shortcuts Hook and Guide
 * Provides keyboard navigation throughout the application
 */

import { useEffect, useCallback, useState } from "react";

// Define available shortcuts
const SHORTCUTS = {
  "?": { key: "?", description: "Show keyboard shortcuts", category: "General" },
  "Escape": { key: "Escape", description: "Close modals/dialogs", category: "General" },
  "Alt+1": { key: "Alt+1", description: "Go to Welcome tab", category: "Navigation" },
  "Alt+2": { key: "Alt+2", description: "Go to Smart Advisor", category: "Navigation" },
  "Alt+3": { key: "Alt+3", description: "Go to DSS tab", category: "Navigation" },
  "Alt+4": { key: "Alt+4", description: "Go to Research tab", category: "Navigation" },
  "Alt+5": { key: "Alt+5", description: "Go to Map tab", category: "Navigation" },
  "Ctrl+K": { key: "Ctrl+K", description: "Focus search/input", category: "Actions" },
  "Ctrl+Enter": { key: "Ctrl+Enter", description: "Submit form", category: "Actions" },
  "Ctrl+/": { key: "Ctrl+/", description: "Toggle sidebar", category: "Actions" },
};

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Build key combination string
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
      if (event.altKey) parts.push("Alt");
      if (event.shiftKey) parts.push("Shift");
      parts.push(event.key);
      const combo = parts.join("+");

      // Check if this combination is registered
      const handler = shortcuts[combo] || shortcuts[event.key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Hook for tab navigation with Alt+number
 */
export function useTabNavigation(setActiveTab, tabs) {
  const shortcuts = {};
  
  tabs.forEach((tab, index) => {
    shortcuts[`Alt+${index + 1}`] = () => setActiveTab(tab.id);
  });
  
  // Escape to go to welcome
  shortcuts["Escape"] = () => setActiveTab("welcome");
  
  useKeyboardShortcuts(shortcuts);
}

/**
 * Keyboard Shortcuts Guide Modal
 */
export function KeyboardShortcutsGuide({ isOpen, onClose }) {
  const categories = {};
  
  // Group shortcuts by category
  Object.values(SHORTCUTS).forEach(shortcut => {
    if (!categories[shortcut.category]) {
      categories[shortcut.category] = [];
    }
    categories[shortcut.category].push(shortcut);
  });
  
  if (!isOpen) return null;
  
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>⌨️ Keyboard Shortcuts</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>
        
        <div style={styles.content}>
          {Object.entries(categories).map(([category, shortcuts]) => (
            <div key={category} style={styles.category}>
              <h3 style={styles.categoryTitle}>{category}</h3>
              <div style={styles.shortcuts}>
                {shortcuts.map(shortcut => (
                  <div key={shortcut.key} style={styles.shortcut}>
                    <kbd style={styles.kbd}>{shortcut.key}</kbd>
                    <span style={styles.description}>{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div style={styles.footer}>
          <span style={styles.hint}>Press <kbd style={styles.kbdSmall}>?</kbd> anytime to show this guide</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Global keyboard shortcuts manager component
 */
export function KeyboardManager({ children, onTabChange, tabs }) {
  const [showGuide, setShowGuide] = useState(false);
  
  const shortcuts = {
    "?": () => setShowGuide(true),
    "Escape": () => setShowGuide(false),
  };
  
  // Add tab navigation
  if (onTabChange && tabs) {
    tabs.forEach((tab, index) => {
      shortcuts[`Alt+${index + 1}`] = () => onTabChange(tab.id);
    });
  }
  
  useKeyboardShortcuts(shortcuts);
  
  return (
    <>
      {children}
      <KeyboardShortcutsGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "white",
    borderRadius: "20px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "80vh",
    overflow: "hidden",
    boxShadow: "0 25px 80px rgba(0, 0, 0, 0.3)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
  },
  title: {
    margin: 0,
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#16a34a",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "28px",
    color: "#64748b",
    cursor: "pointer",
    lineHeight: 1,
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  content: {
    padding: "24px",
    overflowY: "auto",
    maxHeight: "calc(80vh - 140px)",
  },
  category: {
    marginBottom: "24px",
  },
  categoryTitle: {
    margin: "0 0 12px 0",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  shortcuts: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  shortcut: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "8px 12px",
    background: "#f8fafc",
    borderRadius: "10px",
  },
  kbd: {
    display: "inline-block",
    padding: "6px 12px",
    background: "white",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    color: "#374151",
    boxShadow: "0 2px 0 #d1d5db",
    minWidth: "80px",
    textAlign: "center",
  },
  kbdSmall: {
    display: "inline-block",
    padding: "2px 8px",
    background: "white",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    color: "#374151",
    boxShadow: "0 1px 0 #d1d5db",
  },
  description: {
    color: "#475569",
    fontSize: "0.95rem",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    textAlign: "center",
  },
  hint: {
    color: "#64748b",
    fontSize: "0.85rem",
  },
};

export default KeyboardManager;
