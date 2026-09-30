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
  const query = companyId ? `?company=${encodeURIComponent(companyId)}` : "";

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

// =========================================================
// COMPANY DOCUMENTS
// =========================================================

export function getCompanyDocuments() {
  return apiClient("/company/documents/");
}

export function createCompanyDocument({ name, file }) {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("file", file);

  return apiClient("/company/documents/", {
    method: "POST",
    body: formData,
  });
}

export function updateCompanyDocument(documentId, { name, file }) {
  if (file) {
    const formData = new FormData();

    formData.append("name", name);

    if (file) {
      formData.append("file", file);
    }

    return apiClient(`/company/documents/${documentId}/`, {
      method: "PATCH",
      body: formData,
    });
  }

  return apiClient(`/company/documents/${documentId}/`, {
    method: "PATCH",
    body: JSON.stringify({
      name,
    }),
  });
}

export function deleteCompanyDocument(documentId) {
  return apiClient(`/company/documents/${documentId}/`, {
    method: "DELETE",
  });
}

export function downloadCompanyDocument(documentId) {
  return apiClient(`/company/documents/${documentId}/?download=true`, {
    responseType: "blob",
  });
}
