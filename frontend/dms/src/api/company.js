import { apiClient } from "./client";

// =========================================================
// COMPANIES
// =========================================================

export function getCompanies() {
  return apiClient("/company/");
}

export function getCompany(companyId) {
  return apiClient(`/company/${companyId}/`);
}

export function createCompany(company) {
  return apiClient("/company/", {
    method: "POST",
    body: JSON.stringify(company),
  });
}

export function updateCompany(companyId, company) {
  return apiClient(`/company/${companyId}/`, {
    method: "PATCH",
    body: JSON.stringify(company),
  });
}

// =========================================================
// BRANCHES
// =========================================================

export function getBranches(companyId) {
  const query = companyId
    ? `?company=${encodeURIComponent(companyId)}`
    : "";

  return apiClient(`/company/branches/${query}`);
}

export function getBranch(branchId) {
  return apiClient(`/company/branches/${branchId}/`);
}

export function createBranch(branch) {
  return apiClient("/company/branches/", {
    method: "POST",
    body: JSON.stringify(branch),
  });
}

export function updateBranch(branchId, branch) {
  return apiClient(`/company/branches/${branchId}/`, {
    method: "PATCH",
    body: JSON.stringify(branch),
  });
}