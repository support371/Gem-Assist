import React from "react";

export const Activity: React.FC = () => {
  return (
    <div style={{ padding: 16, display: "grid", gap: 10 }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>Activity</div>
      <div style={{ opacity: 0.85 }}>
        Webhook stream slot (connect your backend next).
      </div>
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          padding: 14,
        }}
      >
        Waiting for events…
      </div>
    </div>
  );
};
