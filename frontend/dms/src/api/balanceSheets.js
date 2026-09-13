import { apiClient } from "./client";

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

export function getBalanceSheets(params = {}) {
  return apiClient(`/finance/balance-sheets/${buildQueryString(params)}`);
}

export function createBalanceSheet(payload) {
  return apiClient("/finance/balance-sheets/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getBalanceSheet(balanceSheetId) {
  return apiClient(`/finance/balance-sheets/${balanceSheetId}/`);
}

export function updateBalanceSheet(balanceSheetId, payload) {
  return apiClient(`/finance/balance-sheets/${balanceSheetId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteBalanceSheet(balanceSheetId) {
  return apiClient(`/finance/balance-sheets/${balanceSheetId}/`, {
    method: "DELETE",
  });
}

export function getCustomerBalanceSheetDeals(customerId) {
  return apiClient(`/finance/balance-sheets/customers/${customerId}/deals/`);
}
