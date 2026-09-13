import { apiClient } from "./client";

export async function getDeliveryNotes(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiClient(`/delivery-notes/${suffix}`);
}

export async function getDeliveryNote(id) {
  return apiClient(`/delivery-notes/${id}/`);
}

export async function createDeliveryNote(data) {
  return apiClient("/delivery-notes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDeliveryNote(id, data) {
  return apiClient(`/delivery-notes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDeliveryNote(id) {
  return apiClient(`/delivery-notes/${id}/`, {
    method: "DELETE",
  });
}
