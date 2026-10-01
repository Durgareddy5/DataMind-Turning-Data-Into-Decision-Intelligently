import axios from "axios";

const TOKEN_STORAGE_KEY = "aida.token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, etc.) — session just won't persist
    // across reloads, which is a degraded-but-working state, not a crash.
  }
}

export const api = axios.create({
  // In dev the Vite proxy forwards /api to the local API. In production the
  // frontend is served separately, so VITE_API_URL points at the API's origin.
  baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A single place every feature's fetch/mutate calls flow through, so a 401
// (expired/invalid token) always drops the user back to login instead of
// leaving half the UI stuck on a silent failure.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);
