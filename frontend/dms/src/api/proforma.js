import { apiClient } from "./client";

export async function getProformas(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiClient(`/proforma/${suffix}`);
}

export async function getProforma(id) {
  return apiClient(`/proforma/${id}/`);
}

export async function createProforma(data) {
  return apiClient("/proforma/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProforma(id, data) {
  return apiClient(`/proforma/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProforma(id) {
  return apiClient(`/proforma/${id}/`, {
    method: "DELETE",
  });
}
