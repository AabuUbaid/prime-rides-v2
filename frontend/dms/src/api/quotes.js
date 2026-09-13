import { apiClient } from "./client";

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== "" &&
      value !== null &&
      value !== undefined
    ) {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

export function getQuotes(params = {}) {
  return apiClient(
    `/quotes/${buildQueryString(params)}`,
  );
}

export function createQuote(payload) {
  return apiClient("/quotes/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getQuote(id) {
  return apiClient(`/quotes/${id}/`);
}

export function updateQuote(id, payload) {
  return apiClient(`/quotes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getQuotePrint(id) {
  return apiClient(`/quotes/${id}/print/`);
}

export function proceedToCashDeal(quoteId) {
  return apiClient(`/quotes/${quoteId}/proceed-to-cash-deal/`, {
    method: "POST",
  });
}

export function proceedToBankLoan(
  quoteId,
  payload,
) {
  return apiClient(
    `/quotes/${quoteId}/proceed-to-bank-loan/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}