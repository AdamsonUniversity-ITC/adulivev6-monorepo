/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ADU_LIVE_URL?: string;
  readonly VITE_AUTH_SERVICE_URL?: string;
  readonly VITE_REGISTRAR_SERVICE_URL?: string;
  readonly VITE_HRMDO_SERVICE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

