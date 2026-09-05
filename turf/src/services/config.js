function getBackendBaseUrl() {
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to the production Render backend url if env var is missing
  return "https://turf-hub-backend.onrender.com";
}

export const API_URL = getBackendBaseUrl();
export const SOCKET_URL = getBackendBaseUrl();
