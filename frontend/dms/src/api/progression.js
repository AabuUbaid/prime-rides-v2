import { apiClient } from "./client";

export async function getProgressions(search = "", params = {}) {
  const query = new URLSearchParams();
  const searchValue = String(search ?? "").trim();

  if (searchValue) {
    query.set("search", searchValue);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();

  return apiClient(
    `/progression/${queryString ? `?${queryString}` : ""}`,
  );
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
