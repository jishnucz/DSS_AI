/**
 * 🛡️ Error Boundary Component
 * Catches React errors and displays a friendly fallback UI
 */

import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to error tracking service
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div style={styles.actions}>
              <button onClick={this.handleRetry} style={styles.retryBtn}>
                🔄 Try Again
              </button>
              <button onClick={() => window.location.reload()} style={styles.reloadBtn}>
                ↻ Reload Page
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details style={styles.details}>
                <summary style={styles.summary}>Technical Details</summary>
                <pre style={styles.stack}>
                  {this.state.error?.stack}
                  {"\n\nComponent Stack:\n"}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    padding: "40px",
    background: "linear-gradient(135deg, #fef2f2, #fff)",
  },
  card: {
    background: "white",
    borderRadius: "24px",
    padding: "40px",
    textAlign: "center",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
  },
  icon: {
    fontSize: "60px",
    marginBottom: "20px",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#dc2626",
  },
  message: {
    margin: "0 0 24px 0",
    color: "#64748b",
    fontSize: "1rem",
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  retryBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  reloadBtn: {
    padding: "12px 24px",
    background: "white",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  details: {
    marginTop: "24px",
    textAlign: "left",
  },
  summary: {
    cursor: "pointer",
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  stack: {
    marginTop: "12px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
    fontSize: "0.75rem",
    overflow: "auto",
    maxHeight: "200px",
    color: "#475569",
    textAlign: "left",
    whiteSpace: "pre-wrap",
  },
};

export default ErrorBoundary;
