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

export async function getRegistrationDocuments(id) {
  return apiClient(`/progression/${id}/registration-documents/`);
}

export async function downloadRegistrationDocument(
  progressionId,
  source,
  documentId,
) {
  return apiClient(
    `/progression/${progressionId}/registration-documents/${source}/${documentId}/download/`,
    {
      responseType: "blob",
    },
  );
}
