/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ITWIN_CLIENT_ID: string;
  readonly VITE_ITWIN_REDIRECT_URI: string;
  readonly VITE_ITWIN_POST_SIGNOUT_REDIRECT_URI: string;
  readonly VITE_ITWIN_SCOPE?: string;
  readonly VITE_ITWIN_AUTHORITY?: string;
  readonly VITE_DEMO_ITWIN_ID?: string;
  readonly VITE_DEMO_IMODEL_ID?: string;
  readonly VITE_MARKETING_BASE_URL?: string;

  readonly IMJS_ITWIN_ID?: string;
  readonly IMJS_IMODEL_ID?: string;
  readonly IMJS_AUTH_AUTHORITY: string;
  readonly IMJS_AUTH_CLIENT_CLIENT_ID: string;
  readonly IMJS_AUTH_CLIENT_SCOPES: string;
  readonly IMJS_AUTH_CLIENT_REDIRECT_URI: string;
  readonly IMJS_AUTH_CLIENT_LOGOUT_URI: string;
  readonly IMJS_AUTH_CLIENT_CHANGESET_ID?: string;
  readonly IMJS_BING_MAPS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
