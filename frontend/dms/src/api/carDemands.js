import { apiClient } from "./client";

export function getCarDemands(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return apiClient(
    `/inventory/car-demands/${queryString ? `?${queryString}` : ""}`,
  );
}

export function createCarDemand(data) {
  return apiClient("/inventory/car-demands/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCarDemand(demandId) {
  return apiClient(`/inventory/car-demands/${demandId}/`);
}

export function updateCarDemand(demandId, data) {
  return apiClient(`/inventory/car-demands/${demandId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCarDemand(demandId) {
  return apiClient(`/inventory/car-demands/${demandId}/`, {
    method: "DELETE",
  });
}

export function getCarDemandMatches(demandId) {
  return apiClient(`/inventory/car-demands/${demandId}/matches/`);
}

export function linkCarDemandVehicles(demandId, vehicleIds) {
  return apiClient(`/inventory/car-demands/${demandId}/link/`, {
    method: "POST",
    body: JSON.stringify({
      vehicle_ids: vehicleIds,
    }),
  });
}

export function unlinkCarDemandVehicles(demandId, vehicleIds) {
  return apiClient(`/inventory/car-demands/${demandId}/unlink/`, {
    method: "POST",
    body: JSON.stringify({
      vehicle_ids: vehicleIds,
    }),
  });
}
