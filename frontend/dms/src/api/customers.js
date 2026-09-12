import { apiClient } from "./client";

export function getCustomers() {
  return apiClient("/customers/");
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

export function deleteCustomerDocument(
  customerId,
  documentId
) {
  return apiClient(
    `/customers/${customerId}/documents/${documentId}/`,
    {
      method: "DELETE",
    }
  );
}

export function deleteCustomer(id) {
  return apiClient(`/customers/${id}/`, {
    method: "DELETE",
  });
}