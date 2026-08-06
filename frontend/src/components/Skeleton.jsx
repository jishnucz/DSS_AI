/**
 * 💀 Skeleton Loading Components
 * Provides elegant loading placeholders for better perceived performance
 */

const CSS = `
  @keyframes skeleton-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
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

// Base skeleton styles
const baseStyles = {
  borderRadius: "8px",
  backgroundColor: "#f0f0f0",
};

// Text skeleton
export function SkeletonText({ width = "100%", height = "1rem", lines = 1, style = {} }) {
  inject("skeleton", CSS);
  
  if (lines === 1) {
    return (
      <div
        className="skeleton"
        style={{ ...baseStyles, width, height, ...style }}
      />
    );
  }
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            ...baseStyles,
            width: i === lines - 1 ? "70%" : width,
            height,
          }}
        />
      ))}
    </div>
  );
}

// Circle skeleton (for avatars)
export function SkeletonCircle({ size = 40, style = {} }) {
  inject("skeleton", CSS);
  
  return (
    <div
      className="skeleton"
      style={{
        ...baseStyles,
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// Rectangle skeleton (for images, cards)
export function SkeletonRect({ width = "100%", height = "200px", style = {} }) {
  inject("skeleton", CSS);
  
  return (
    <div
      className="skeleton"
      style={{ ...baseStyles, width, height, ...style }}
    />
  );
}

// Card skeleton
export function SkeletonCard({ style = {} }) {
  inject("skeleton", CSS);
  
  return (
    <div style={{
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      border: "1px solid #e2e8f0",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <SkeletonCircle size={48} />
        <div style={{ flex: 1 }}>
          <SkeletonText width="60%" height="1rem" style={{ marginBottom: "8px" }} />
          <SkeletonText width="40%" height="0.75rem" />
        </div>
      </div>
      <SkeletonText lines={3} style={{ marginBottom: "16px" }} />
      <SkeletonRect height="120px" />
    </div>
  );
}

// Weather card skeleton
export function SkeletonWeather({ style = {} }) {
  inject("skeleton", CSS);
  
  return (
    <div style={{
      background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
      borderRadius: "20px",
      padding: "24px",
      ...style,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <SkeletonText width="120px" height="1.2rem" style={{ marginBottom: "8px" }} />
          <SkeletonText width="80px" height="0.9rem" />
        </div>
        <SkeletonCircle size={60} />
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <SkeletonText width="100%" height="0.8rem" style={{ marginBottom: "8px" }} />
            <SkeletonText width="60%" height="1.2rem" style={{ margin: "0 auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Chat message skeleton
export function SkeletonMessage({ isUser = false, style = {} }) {
  inject("skeleton", CSS);
  
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      gap: "12px",
      padding: "8px 0",
      ...style,
    }}>
      {!isUser && <SkeletonCircle size={36} />}
      <div style={{ maxWidth: "70%" }}>
        <SkeletonText width="200px" height="1rem" style={{ marginBottom: "6px" }} />
        <SkeletonText width="150px" height="1rem" />
      </div>
      {isUser && <SkeletonCircle size={36} />}
    </div>
  );
}

// Table skeleton
export function SkeletonTable({ rows = 5, cols = 4, style = {} }) {
  inject("skeleton", CSS);
  
  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      ...style,
    }}>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "16px",
        padding: "16px",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
      }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonText key={i} width="80%" height="0.9rem" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "16px",
            padding: "16px",
            borderBottom: rowIdx < rows - 1 ? "1px solid #f1f5f9" : "none",
          }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonText key={colIdx} width="90%" height="0.85rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Full page loading skeleton
export function SkeletonPage() {
  inject("skeleton", CSS);
  
  return (
    <div style={{ padding: "24px" }}>
      {/* Header bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
        <SkeletonRect width="200px" height="50px" style={{ borderRadius: "12px" }} />
        <div style={{ flex: 1 }} />
        <SkeletonRect width="300px" height="50px" style={{ borderRadius: "12px" }} />
      </div>
      
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonRect key={i} width="100px" height="40px" style={{ borderRadius: "10px" }} />
        ))}
      </div>
      
      {/* Content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default {
  SkeletonText,
  SkeletonCircle,
  SkeletonRect,
  SkeletonCard,
  SkeletonWeather,
  SkeletonMessage,
  SkeletonTable,
  SkeletonPage,
};
