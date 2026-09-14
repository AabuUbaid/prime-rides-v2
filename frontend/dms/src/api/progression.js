import { apiClient } from "./client";

export async function getProgressions() {
  return apiClient("/progression/");
}

export async function getProgression(id) {
  return apiClient(`/progression/${id}/`);
}

export async function updateProgression(id, payload) {
  return apiClient(`/progression/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function advanceProgression(id, payload = {}) {
  return apiClient(`/progression/${id}/advance/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
