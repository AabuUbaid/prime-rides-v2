// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const API_URL = "http://localhost:8000/api";

export async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem("accessToken");

  const headers = {
    ...options.headers,
  };

  // Only set JSON header when body is NOT FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

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
    console.error("API ERROR:", data);

    throw new Error(
      data?.detail ||
        data?.message ||
        JSON.stringify(data) ||
        "Something went wrong",
    );
  }

  return data;
}
