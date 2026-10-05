import { apiClient } from "./client";

export function getCustomers(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return apiClient(`/customers/${queryString ? `?${queryString}` : ""}`);
}

export function createCustomer(payload) {
  return apiClient("/customers/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCustomer(id) {
  return apiClient(`/customers/${id}/`);
}

export function updateCustomer(id, payload) {
  return apiClient(`/customers/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadCustomerDocument(id, payload) {
  return apiClient(`/customers/${id}/documents/`, {
    method: "POST",
    body: payload,
  });
}

export function deleteCustomerDocument(customerId, documentId) {
  return apiClient(`/customers/${customerId}/documents/${documentId}/`, {
    method: "DELETE",
  });
}

export function deleteCustomer(id) {
  return apiClient(`/customers/${id}/`, {
    method: "DELETE",
  });
}

export function importCustomers(payload) {
  return apiClient("/customers/import/", {
    method: "POST",
    body: payload,
  });
}
