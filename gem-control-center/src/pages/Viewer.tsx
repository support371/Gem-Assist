import React, { useMemo, useState } from "react";
import { env } from "../config/env";

type Hotspot = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaPath: string;
};

const DEFAULT_HOTSPOTS: Hotspot[] = [
  {
    id: "reception",
    title: "Reception",
    description: "Book a demo or request enterprise security services.",
    ctaLabel: "Contact Us",
    ctaPath: "/contact-us",
  },
  {
    id: "showroom",
    title: "Showroom",
    description: "Explore services and offerings tied to model locations.",
    ctaLabel: "View Services",
    ctaPath: "/services",
  },
];

export const Viewer: React.FC = () => {
  const [selected, setSelected] = useState<Hotspot | null>(DEFAULT_HOTSPOTS[0]);

  const marketingUrl = useMemo(() => {
    const base = env.marketingBaseUrl.replace(/\/+$/, "");
    return (path: string) => `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }, []);

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 360px" }}>
      <section style={{ minWidth: 0, position: "relative" }}>
        {/* Replace this placeholder with the template’s actual iTwin Viewer component later. */}
        <div
          style={{
            height: "100%",
            background: "rgba(255,255,255,0.02)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>3D Viewer Area</div>
            <div style={{ marginTop: 8, opacity: 0.85 }}>
              Next: wire this to the template’s iTwin Viewer component and load an iTwin/iModel.
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DEFAULT_HOTSPOTS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelected(h)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: selected?.id === h.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                    color: "inherit",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {h.title}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 10, opacity: 0.8, fontSize: 12 }}>
              Demo iTwin/iModel IDs: {env.demoITwinId ? "set" : "not set"} / {env.demoIModelId ? "set" : "not set"}
            </div>
          </div>
        </div>
      </section>

      <aside style={{ padding: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>Details</div>
        {!selected ? (
          <div style={{ opacity: 0.8, marginTop: 8 }}>Select a hotspot.</div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{selected.title}</div>
            <div style={{ opacity: 0.85 }}>{selected.description}</div>
            <a
              href={marketingUrl(selected.ctaPath)}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.10)",
                color: "inherit",
                textDecoration: "none",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {selected.ctaLabel}
            </a>
          </div>
        )}
      </aside>
    </div>
  );
};
