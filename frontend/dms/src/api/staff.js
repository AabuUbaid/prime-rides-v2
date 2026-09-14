import { apiClient } from "./client";

export async function getStaff() {
  return apiClient("/staff/");
}

export async function createStaff(payload) {
  return apiClient("/staff/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStaffMember(id) {
  return apiClient(`/staff/${id}/`);
}

export async function updateStaff(id, payload) {
  return apiClient(`/staff/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteStaff(id) {
  return apiClient(`/staff/${id}/`, { method: "DELETE" });
}

export async function activateStaff(id) {
  return apiClient(`/staff/${id}/activate/`, { method: "POST" });
}

export async function getStaffPerformance(id) {
  return apiClient(`/staff/${id}/performance/`);
}
