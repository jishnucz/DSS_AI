/**
 * 🔔 Toast Notification System
 * Provides elegant feedback for user actions
 */

import { useState, useEffect, createContext, useContext, useCallback } from "react";

// Toast Context
const ToastContext = createContext(null);

// Toast types
const TOAST_TYPES = {
  success: { icon: "✅", bg: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" },
  error: { icon: "❌", bg: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" },
  warning: { icon: "⚠️", bg: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" },
  info: { icon: "ℹ️", bg: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff" },
  loading: { icon: "⏳", bg: "linear-gradient(135deg, #64748b, #475569)", color: "#fff" },
};

// CSS for animations
const CSS = `
  @keyframes toastSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes toastSlideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  @keyframes toastProgress {
    from { width: 100%; }
    to { width: 0%; }
  }
  .toast-enter { animation: toastSlideIn 0.3s ease-out forwards; }
  .toast-exit { animation: toastSlideOut 0.3s ease-in forwards; }
`;

function inject(id, css) {
  if (!document.querySelector(`style[data-id="${id}"]`)) {
    const el = document.createElement("style");
    el.setAttribute("data-id", id);
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// Individual Toast Component
function Toast({ toast, onClose }) {
  const [exiting, setExiting] = useState(false);
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => onClose(toast.id), 300);
      }, toast.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);
  
  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };
  
  return (
    <div
      className={exiting ? "toast-exit" : "toast-enter"}
      style={{
        ...styles.toast,
        background: config.bg,
        color: config.color,
      }}
    >
      <div style={styles.toastContent}>
        <span style={styles.toastIcon}>{config.icon}</span>
        <div style={styles.toastText}>
          {toast.title && <strong style={styles.toastTitle}>{toast.title}</strong>}
          <span style={styles.toastMessage}>{toast.message}</span>
        </div>
        {toast.action && (
          <button onClick={toast.action.onClick} style={styles.toastAction}>
            {toast.action.label}
          </button>
        )}
        <button onClick={handleClose} style={styles.toastClose}>×</button>
      </div>
      {toast.duration !== 0 && (
        <div
          style={{
            ...styles.toastProgress,
            animation: `toastProgress ${toast.duration || 4000}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

// Toast Container (Provider)
export function ToastProvider({ children }) {
  inject("toast-system", CSS);
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback(({ type = "info", title, message, duration, action }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, duration, action }]);
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);
  
  // Convenience methods
  const toast = {
    success: (message, options = {}) => addToast({ type: "success", message, ...options }),
    error: (message, options = {}) => addToast({ type: "error", message, ...options }),
    warning: (message, options = {}) => addToast({ type: "warning", message, ...options }),
    info: (message, options = {}) => addToast({ type: "info", message, ...options }),
    loading: (message, options = {}) => addToast({ type: "loading", message, duration: 0, ...options }),
    dismiss: (id) => removeToast(id),
    update: (id, updates) => updateToast(id, updates),
    promise: async (promise, { loading, success, error }) => {
      const id = addToast({ type: "loading", message: loading, duration: 0 });
      try {
        const result = await promise;
        updateToast(id, { type: "success", message: success, duration: 4000 });
        return result;
      } catch (err) {
        updateToast(id, { type: "error", message: error || err.message, duration: 5000 });
        throw err;
      }
    }
  };
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={styles.container}>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const styles = {
  container: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "400px",
    pointerEvents: "none",
  },
  toast: {
    borderRadius: "16px",
    padding: "16px 20px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    pointerEvents: "auto",
    overflow: "hidden",
    position: "relative",
    backdropFilter: "blur(10px)",
  },
  toastContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  toastIcon: {
    fontSize: "20px",
    flexShrink: 0,
  },
  toastText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  toastTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  toastMessage: {
    fontSize: "0.9rem",
    opacity: 0.95,
    lineHeight: 1.4,
  },
  toastAction: {
    background: "rgba(255, 255, 255, 0.25)",
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    color: "inherit",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  toastClose: {
    background: "transparent",
    border: "none",
    color: "inherit",
    opacity: 0.7,
    fontSize: "22px",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
    transition: "opacity 0.2s",
  },
  toastProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "3px",
    background: "rgba(255, 255, 255, 0.4)",
    borderRadius: "0 0 16px 16px",
  },
};

export default ToastProvider;
