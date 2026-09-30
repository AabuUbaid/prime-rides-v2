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

export async function getAttendance(params = {}) {
  const search = new URLSearchParams();

  if (params.page) {
    search.set("page", params.page);
  }

  if (params.page_size) {
    search.set("page_size", params.page_size);
  }

  const query = search.toString();

  return apiClient(`/staff/attendance/${query ? `?${query}` : ""}`);
}

export async function createAttendance(payload) {
  return apiClient("/staff/attendance/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAttendance(id, payload) {
  return apiClient(`/staff/attendance/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAttendance(id) {
  return apiClient(`/staff/attendance/${id}/`, {
    method: "DELETE",
  });
}

export async function getPayroll(params = {}) {
  const search = new URLSearchParams();

  if (params.page) {
    search.set("page", params.page);
  }

  if (params.page_size) {
    search.set("page_size", params.page_size);
  }

  const query = search.toString();

  return apiClient(`/staff/payroll/${query ? `?${query}` : ""}`);
}

export async function createPayroll(payload) {
  return apiClient("/staff/payroll/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePayroll(id, payload) {
  return apiClient(`/staff/payroll/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePayroll(id) {
  return apiClient(`/staff/payroll/${id}/`, {
    method: "DELETE",
  });
}
