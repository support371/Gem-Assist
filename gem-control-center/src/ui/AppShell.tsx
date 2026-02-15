import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ThemeProvider, Button } from "@itwin/itwinui-react";
import "@itwin/itwinui-react/styles.css";

import { signIn, signOut } from "../auth/oidc";

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const loc = useLocation();
  const active = loc.pathname.startsWith(to);
  return (
    <Link
      to={to}
      style={{
        display: "block",
        padding: "10px 12px",
        borderRadius: 8,
        textDecoration: "none",
        fontWeight: 600,
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        color: "inherit",
      }}
    >
      {label}
    </Link>
  );
};

export const AppShell: React.FC = () => {
  return (
    <ThemeProvider theme="dark">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          height: "100vh",
        }}
      >
        <aside
          style={{
            padding: 14,
            borderRight: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            GEM Control Center
          </div>

          <nav style={{ display: "grid", gap: 8 }}>
            <NavItem to="/app" label="Dashboard" />
            <NavItem to="/app/viewer" label="Viewer" />
            <NavItem to="/app/activity" label="Activity" />
            <NavItem to="/app/settings" label="Settings" />
          </nav>

          <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
            <Button styleType="borderless" onClick={() => void signIn()}>
              Sign in
            </Button>
            <Button styleType="borderless" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>

          <div style={{ marginTop: 16, opacity: 0.7, fontSize: 12 }}>
            Viewer-first platform: model + hotspots + actions.
          </div>
        </aside>

        <main style={{ display: "grid", gridTemplateRows: "56px 1fr" }}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontWeight: 700 }}>Control Center</div>
            <div style={{ display: "flex", gap: 12, opacity: 0.85 }}>
              <span>Search</span>
              <span>Notifications</span>
              <span>Profile</span>
            </div>
          </header>

          <div style={{ minHeight: 0 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};
