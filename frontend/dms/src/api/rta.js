import { apiClient } from "./client";

export async function getRtaRecords(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return apiClient(`/rta/${queryString ? `?${queryString}` : ""}`);
}

export async function getRtaRecord(id) {
  return apiClient(`/rta/${id}/`);
}

export async function createRtaRecord(payload) {
  return apiClient("/rta/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRtaDocuments(rtaRecordId) {
  return apiClient(`/rta/${rtaRecordId}/documents/`);
}

export async function uploadRtaDocument(rtaRecordId, file, documentType) {
  const formData = new FormData();

  formData.append("document_type", documentType);
  formData.append("file", file);

  return apiClient(`/rta/${rtaRecordId}/documents/`, {
    method: "POST",
    body: formData,
  });
}

export async function downloadRtaDocument(documentId) {
  return apiClient(`/rta/documents/${documentId}/download/`, {
    responseType: "blob",
  });
}

export async function deleteRtaDocument(documentId) {
  return apiClient(`/rta/documents/${documentId}/delete/`, {
    method: "DELETE",
  });
}

export async function getRtaTemplates(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return apiClient(`/rta/templates/${queryString ? `?${queryString}` : ""}`);
}

export async function getRtaTemplate(templateId) {
  return apiClient(`/rta/templates/${templateId}/`);
}

export async function createRtaTemplate(payload) {
  return apiClient("/rta/templates/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRtaTemplate(templateId, payload) {
  return apiClient(`/rta/templates/${templateId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
