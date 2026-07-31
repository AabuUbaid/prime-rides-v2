const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Response may not contain JSON
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Something went wrong");
  }

  return data;
}
