import { apiClient } from "./client";

function getReport(endpoint, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return apiClient(
    `/reports/${endpoint}/${queryString ? `?${queryString}` : ""}`,
  );
}

export function getSalesReport(params = {}) {
  return getReport("sales", params);
}

export function getInventoryReport(params = {}) {
  return getReport("inventory", params);
}

export function getCashReceiptsReport(params = {}) {
  return getReport("cash-receipts", params);
}

export function getFinanceReport(params = {}) {
  return getReport("finance", params);
}

export function getVehicleAdditionsReport(params = {}) {
  return getReport("vehicle-additions", params);
}

export function getVehicleSalesReport(params = {}) {
  return getReport("vehicle-sales", params);
}

export function getOperationalPerformanceReport(params = {}) {
  return getReport("operational-performance", params);
}
