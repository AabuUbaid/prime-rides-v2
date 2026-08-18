// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const API_URL = "http://localhost:8000/api";

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  /*
   * If another request is already refreshing the token,
   * wait for that same request instead of creating another one.
   */
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/accounts/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        });

        let data = null;

        try {
          data = await response.json();
        } catch {
          // Response may not contain JSON
        }

        if (!response.ok) {
          throw new Error(
            data?.detail ||
            data?.message ||
            JSON.stringify(data) ||
            "Token refresh failed",
          );
        }

        const newAccessToken = data?.data?.access;
        const newRefreshToken = data?.data?.refresh;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh");
        }

        localStorage.setItem("accessToken", newAccessToken);

        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        return newAccessToken;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

function clearAuthentication() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  window.location.href = "/login";
}

export async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem("accessToken");

  const headers = {
    ...options.headers,
  };

  /*
   * Only set JSON header when body is NOT FormData.
   */
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  /*
   * Access token expired.
   *
   * Do not attempt refresh for the refresh endpoint itself.
   */
  if (
    response.status === 401 &&
    !endpoint.includes("/accounts/refresh/")
  ) {
    try {
      const newAccessToken = await refreshAccessToken();

      const retryHeaders = {
        ...options.headers,
      };

      /*
       * Preserve FormData handling.
       */
      if (!(options.body instanceof FormData)) {
        retryHeaders["Content-Type"] = "application/json";
      }

      retryHeaders.Authorization = `Bearer ${newAccessToken}`;

      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    } catch (error) {
      console.error("Token refresh failed:", error);

      clearAuthentication();

      throw new Error("Session expired. Please login again.");
    }
  }

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