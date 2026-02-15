import React from "react";

export const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>Dashboard</div>
      <div style={{ opacity: 0.85 }}>
        Command center shell. Wire metrics + feeds next.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {["Total Events", "Active iTwins", "Active iModels", "Health"].map(
          (t) => (
            <div
              key={t}
              style={{
                padding: 14,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ opacity: 0.8, fontWeight: 700 }}>{t}</div>
              <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                0
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
};
