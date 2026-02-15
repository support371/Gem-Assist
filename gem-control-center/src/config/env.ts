export type AppEnv = {
  itwinClientId: string;
  redirectUri: string;

  postSignoutRedirectUri: string;
  scope: string;
  authority: string;
  demoITwinId?: string;
  demoIModelId?: string;
  marketingBaseUrl: string;
};

function requireEnv(name: string): string {
  const v = import.meta.env[name] as string | undefined;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
export const env: AppEnv = {
  itwinClientId: requireEnv("VITE_ITWIN_CLIENT_ID"),
  redirectUri: requireEnv("VITE_ITWIN_REDIRECT_URI"),
  postSignoutRedirectUri: requireEnv("VITE_ITWIN_POST_SIGNOUT_REDIRECT_URI"),
  scope:
    (import.meta.env.VITE_ITWIN_SCOPE as string | undefined) ??
    "itwin-platform",
  authority:
    (import.meta.env.VITE_ITWIN_AUTHORITY as string | undefined) ??
    "https://ims.bentley.com",
  demoITwinId: import.meta.env.VITE_DEMO_ITWIN_ID as string | undefined,
  demoIModelId: import.meta.env.VITE_DEMO_IMODEL_ID as string | undefined,
  marketingBaseUrl:
    (import.meta.env.VITE_MARKETING_BASE_URL as string | undefined) ?? "/",
};
