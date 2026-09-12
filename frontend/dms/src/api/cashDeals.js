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

// =========================================================
// CASH DEALS
// =========================================================

/**
 * Get Cash Deal tracker records.
 *
 * Filtering/searching is handled by the backend.
 *
 * Supported query parameters:
 * - search
 * - status
 */
export function getCashDeals(params = {}) {
  return apiClient(
    `/finance/cash-deals/${buildQueryString(params)}`,
  );
}

/**
 * Get a single Cash Deal.
 */
export function getCashDeal(cashDealId) {
  return apiClient(
    `/finance/cash-deals/${cashDealId}/`,
  );
}

/**
 * Update Cash Deal advance and/or remark.
 *
 * Backend is authoritative for:
 * - advance validation
 * - balance calculation
 * - status transition
 * - inventory status transition
 */
export function updateCashDeal(
  cashDealId,
  payload,
) {
  return apiClient(
    `/finance/cash-deals/${cashDealId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}