import { apiClient } from "./client";

export const getInsurances = (params = {}) => {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();

  return apiClient(`/insurance/${query ? `?${query}` : ""}`);
};

export const getInsurance = (id) => apiClient(`/insurance/${id}/`);

export const createInsurance = (quoteId) =>
  apiClient(`/insurance/quotes/${quoteId}/create/`, {
    method: "POST",
  });

export const updateInsuranceStatus = (id, payload) =>
  apiClient(`/insurance/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const startInsuranceRenewal = (id) =>
  apiClient(`/insurance/${id}/renewal/start/`, {
    method: "POST",
  });

export const updateInsuranceRenewalStatus = (id, payload) =>
  apiClient(`/insurance/${id}/renewal/status/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const approveInsuranceRenewal = (id, payload = {}) =>
  apiClient(`/insurance/${id}/renewal/approve/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
