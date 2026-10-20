export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

export const SOCKET_CONFIG = {
  URL: import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",
} as const;

export const ENV = {
  NODE_ENV: import.meta.env.VITE_NODE_ENV || "development",
  IS_DEVELOPMENT: import.meta.env.DEV || true,
  IS_PRODUCTION: import.meta.env.PROD || false,
  APP_NAME: import.meta.env.VITE_APP_NAME || "GPS House",
} as const;

export const LOG_CONFIG = {
  ENABLE_API_LOGGING: ENV.IS_DEVELOPMENT,
  LOG_LEVEL: ENV.IS_DEVELOPMENT ? "debug" : "error",
} as const;

export const TOAST_CONFIG = {
  ERROR_DURATION: parseInt(import.meta.env.VITE_TOAST_ERROR_DURATION || "8000", 10),
} as const;

export default {
  API: API_CONFIG,
  SOCKET: SOCKET_CONFIG,
  ENV,
  LOG: LOG_CONFIG,
  TOAST: TOAST_CONFIG,
};
