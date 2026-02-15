import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./ui/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Viewer } from "./pages/Viewer";
import { Activity } from "./pages/Activity";
import { Settings } from "./pages/Settings";
import { SigninCallback } from "./pages/SigninCallback";

export const router = createBrowserRouter([
  { path: "/signin-callback", element: <SigninCallback /> },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "viewer", element: <Viewer /> },
      { path: "activity", element: <Activity /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "*", element: <div style={{ padding: 16 }}>Not found</div> },
]);
