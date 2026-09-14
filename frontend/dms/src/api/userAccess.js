import { apiClient } from "./client";

export async function getUserAccess(params = {}) {
  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);
  const query = search.toString();
  return apiClient(`/staff/user-access/${query ? `?${query}` : ""}`);
}

export async function createUserAccess(payload) {
  return apiClient("/staff/user-access/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUserAccess(id, payload) {
  return apiClient(`/staff/user-access/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateUserAccess(id) {
  return apiClient(`/staff/user-access/${id}/`, { method: "DELETE" });
}

export async function activateUserAccess(id) {
  return apiClient(`/staff/user-access/${id}/activate/`, { method: "POST" });
}

export async function changeUserPassword(id, password) {
  return apiClient(`/staff/user-access/${id}/password/`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function getUserAccessMember(id) {
  return apiClient(`/staff/user-access/${id}/`);
}
