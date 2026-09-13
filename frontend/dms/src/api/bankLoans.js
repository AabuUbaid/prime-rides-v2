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
// BANK LOANS
// =========================================================

/**
 * Get Bank Loan tracker records.
 *
 * Search/filtering is performed by the backend.
 *
 * Supported query parameters:
 * - search
 * - status
 * - bank
 * - priority
 * - application_status
 */
export function getBankLoans(params = {}) {
  return apiClient(
    `/finance/bank-loans/${buildQueryString(params)}`,
  );
}

/**
 * Get a single Bank Loan.
 */
export function getBankLoan(bankLoanId) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/`,
  );
}

export function getBankLoanFollowUps(bankLoanId) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/follow-ups/`,
  );
}

/**
 * Update decision status.
 *
 * Backend is authoritative for allowed transitions.
 */
export function updateBankLoanStatus(
  bankLoanId,
  status,
) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/status/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    },
  );
}

/**
 * Update application progress status.
 *
 * This is intentionally separate from decision status.
 */
export function updateBankLoanApplicationStatus(
  bankLoanId,
  applicationStatus,
) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/application-status/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        application_status: applicationStatus,
      }),
    },
  );
}

/**
 * Update requested/approved finance.
 *
 * Both values are sent explicitly so requested finance
 * is never overwritten by approved finance.
 */
export function updateBankLoanFinance(
  bankLoanId,
  payload,
) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/finance/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Update priority.
 */
export function updateBankLoanPriority(
  bankLoanId,
  priority,
) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/priority/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        priority,
      }),
    },
  );
}

/**
 * Add a Bank Loan follow-up.
 *
 * The backend preserves previous follow-ups.
 */
export function createBankLoanFollowUp(
  bankLoanId,
  payload,
) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/follow-ups/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Create a new Bank Loan application for another bank
 * from a rejected Bank Loan.
 *
 * Backend owns validation and creation rules.
 */
export function createBankLoanForNewBank(
  bankLoanId,
  bankId,
) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/new-bank/`,
    {
      method: "POST",
      body: JSON.stringify({
        bank_id: bankId,
      }),
    },
  );
}

/**
 * Update application information.
 */
export function updateBankLoanApplicationInfo(
  bankLoanId,
  payload,
) {
  return apiClient(
    `/finance/bank-loans/${bankLoanId}/application-info/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}