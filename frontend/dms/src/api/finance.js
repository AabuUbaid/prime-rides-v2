import { apiClient } from "./client";

/**
 * Build a query string from an object.
 *
 * Empty, null, and undefined values are ignored.
 */
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
// BANKS
// =========================================================

/**
 * Get banks.
 *
 * Backend behavior:
 * - MASTER receives all banks, including inactive banks.
 * - Other authenticated users receive active banks only.
 *
 * No active_only parameter is sent because the backend determines
 * this from the authenticated user's role.
 */
export function getBanks() {
  return apiClient("/finance/banks/");
}

/**
 * Create a bank.
 * MASTER only.
 */
export function createBank(bank) {
  return apiClient("/finance/banks/", {
    method: "POST",
    body: JSON.stringify(bank),
  });
}

/**
 * Update a bank.
 * MASTER only.
 */
export function updateBank(bankId, bank) {
  return apiClient(`/finance/banks/${bankId}/`, {
    method: "PATCH",
    body: JSON.stringify(bank),
  });
}

// =========================================================
// EXPENSE PRESETS
// =========================================================

/**
 * Get expense presets.
 *
 * Supported filters:
 * - active_only
 * - expense_type
 */
export function getExpensePresets(params = {}) {
  return apiClient(
    `/finance/expense-presets/${buildQueryString(params)}`,
  );
}

/**
 * Get a single expense preset.
 * MASTER only.
 */
export function getExpensePreset(expensePresetId) {
  return apiClient(
    `/finance/expense-presets/${expensePresetId}/`,
  );
}

/**
 * Create an expense preset.
 * MASTER only.
 */
export function createExpensePreset(expensePreset) {
  return apiClient("/finance/expense-presets/", {
    method: "POST",
    body: JSON.stringify(expensePreset),
  });
}

/**
 * Update an expense preset.
 * MASTER only.
 */
export function updateExpensePreset(
  expensePresetId,
  expensePreset,
) {
  return apiClient(
    `/finance/expense-presets/${expensePresetId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(expensePreset),
    },
  );
}

/**
 * Delete an expense preset.
 * MASTER only.
 */
export function deleteExpensePreset(expensePresetId) {
  return apiClient(
    `/finance/expense-presets/${expensePresetId}/`,
    {
      method: "DELETE",
    },
  );
}

// =========================================================
// INSURANCE BANDS
// =========================================================

/**
 * Get insurance bands.
 *
 * Supported filter:
 * - active_only
 */
export function getInsuranceBands(params = {}) {
  return apiClient(
    `/finance/insurance-bands/${buildQueryString(params)}`,
  );
}

/**
 * Get a single insurance band.
 * MASTER only.
 */
export function getInsuranceBand(insuranceBandId) {
  return apiClient(
    `/finance/insurance-bands/${insuranceBandId}/`,
  );
}

/**
 * Create an insurance band.
 * MASTER only.
 */
export function createInsuranceBand(insuranceBand) {
  return apiClient("/finance/insurance-bands/", {
    method: "POST",
    body: JSON.stringify(insuranceBand),
  });
}

/**
 * Update an insurance band.
 * MASTER only.
 */
export function updateInsuranceBand(
  insuranceBandId,
  insuranceBand,
) {
  return apiClient(
    `/finance/insurance-bands/${insuranceBandId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(insuranceBand),
    },
  );
}

/**
 * Delete an insurance band.
 * MASTER only.
 */
export function deleteInsuranceBand(insuranceBandId) {
  return apiClient(
    `/finance/insurance-bands/${insuranceBandId}/`,
    {
      method: "DELETE",
    },
  );
}

// =========================================================
// SERVICE PACKAGES
// =========================================================

/**
 * Get service packages.
 *
 * Supported filter:
 * - active_only
 */
export function getServicePackages(params = {}) {
  return apiClient(
    `/finance/service-packages/${buildQueryString(params)}`,
  );
}

/**
 * Get a single service package.
 * MASTER only.
 */
export function getServicePackage(servicePackageId) {
  return apiClient(
    `/finance/service-packages/${servicePackageId}/`,
  );
}

/**
 * Create a service package.
 * MASTER only.
 */
export function createServicePackage(servicePackage) {
  return apiClient("/finance/service-packages/", {
    method: "POST",
    body: JSON.stringify(servicePackage),
  });
}

/**
 * Update a service package.
 * MASTER only.
 */
export function updateServicePackage(
  servicePackageId,
  servicePackage,
) {
  return apiClient(
    `/finance/service-packages/${servicePackageId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(servicePackage),
    },
  );
}

/**
 * Delete a service package.
 * MASTER only.
 */
export function deleteServicePackage(servicePackageId) {
  return apiClient(
    `/finance/service-packages/${servicePackageId}/`,
    {
      method: "DELETE",
    },
  );
}

// =========================================================
// BANK PROCESSING CONFIGURATIONS
// =========================================================

/**
 * Get bank processing configurations.
 *
 * Supported filter:
 * - active_only
 */
export function getBankProcessingConfigurations(
  params = {},
) {
  return apiClient(
    `/finance/bank-processing-configurations/${buildQueryString(
      params,
    )}`,
  );
}

/**
 * Get a single bank processing configuration.
 * MASTER only.
 */
export function getBankProcessingConfiguration(
  configurationId,
) {
  return apiClient(
    `/finance/bank-processing-configurations/${configurationId}/`,
  );
}

/**
 * Create a bank processing configuration.
 * MASTER only.
 */
export function createBankProcessingConfiguration(
  configuration,
) {
  return apiClient(
    "/finance/bank-processing-configurations/",
    {
      method: "POST",
      body: JSON.stringify(configuration),
    },
  );
}

/**
 * Update a bank processing configuration.
 * MASTER only.
 */
export function updateBankProcessingConfiguration(
  configurationId,
  configuration,
) {
  return apiClient(
    `/finance/bank-processing-configurations/${configurationId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(configuration),
    },
  );
}

/**
 * Delete a bank processing configuration.
 * MASTER only.
 */
export function deleteBankProcessingConfiguration(
  configurationId,
) {
  return apiClient(
    `/finance/bank-processing-configurations/${configurationId}/`,
    {
      method: "DELETE",
    },
  );
}