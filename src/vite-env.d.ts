/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENWA_URL?: string;
  readonly VITE_OPENWA_API_KEY?: string;
  readonly VITE_OPENWA_SESSION_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
