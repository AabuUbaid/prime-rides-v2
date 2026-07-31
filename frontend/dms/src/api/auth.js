import { apiClient } from "./client";

export function login(email, password) {
  return apiClient("/accounts/login/", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function getCurrentUser() {
  return apiClient("/accounts/me/");
}
