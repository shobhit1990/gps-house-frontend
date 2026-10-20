/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_NODE_ENV: string;
  readonly VITE_NODE_PORT: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_ALLOWED_HOSTS: string;
  readonly VITE_TOAST_ERROR_DURATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
