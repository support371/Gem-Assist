import React, { useEffect, useState } from "react";
import { handleSigninCallback } from "../auth/oidc";
import { useNavigate } from "react-router-dom";

export const SigninCallback: React.FC = () => {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    (async () => {
      try {
        await handleSigninCallback();
        nav("/app/viewer");
      } catch (e) {
        setMsg(`Sign-in failed: ${(e as Error).message}`);
      }
    })();
  }, [nav]);

  return <div style={{ padding: 16 }}>{msg}</div>;
};
