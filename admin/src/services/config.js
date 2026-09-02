function getBackendBaseUrl() {
  const hostname =
    typeof window !== "undefined" && window.location.hostname
      ? window.location.hostname
      : "localhost";

  return `http://${hostname}:5000`;
}

export const API_URL = getBackendBaseUrl();
export const SOCKET_URL = getBackendBaseUrl();
