const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

export function resolveBackendUrl(path) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
