import React from "react";
import { env } from "../config/env";

export const Settings: React.FC = () => {
  return (
    <div style={{ padding: 16, display: "grid", gap: 10 }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>Settings</div>
      <div style={{ opacity: 0.85 }}>Env overview (safe values only).</div>
      <pre style={{ whiteSpace: "pre-wrap", opacity: 0.9 }}>
{JSON.stringify(
  {
    scope: env.scope,
    authority: env.authority,
    redirectUri: env.redirectUri,
    marketingBaseUrl: env.marketingBaseUrl,
    demo: { itwinId: Boolean(env.demoITwinId), imodelId: Boolean(env.demoIModelId) },
  },
  null,
  2
)}
      </pre>
    </div>
  );
};
