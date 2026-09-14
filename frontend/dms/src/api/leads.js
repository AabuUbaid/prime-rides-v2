import { apiClient } from "./client";

export async function getLeads(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return apiClient(`/leads/${query ? `?${query}` : ""}`);
}

export async function createLead(payload) {
  return apiClient("/leads/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLead(id) {
  return apiClient(`/leads/${id}/`);
}

export async function updateLead(id, payload) {
  return apiClient(`/leads/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteLead(id) {
  return apiClient(`/leads/${id}/`, { method: "DELETE" });
}

export async function addLeadActivity(id, note) {
  return apiClient(`/leads/${id}/activities/`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}
