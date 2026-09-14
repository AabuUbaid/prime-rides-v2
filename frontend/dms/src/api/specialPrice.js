import { apiClient } from "./client";

export async function getSpecialPriceRequests() {
  return apiClient("/inventory/special-price/");
}

export async function createSpecialPriceRequest(payload) {
  return apiClient("/inventory/special-price/request/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function decideSpecialPriceRequest(id, payload) {
  return apiClient(`/inventory/special-price/${id}/decision/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
