/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MODUS_API_TOKEN: string;
  readonly VITE_MODUS_API_ENDPOINT: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
