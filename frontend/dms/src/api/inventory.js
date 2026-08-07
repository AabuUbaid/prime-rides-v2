import { apiClient } from "./client";

export function getCars() {
  return apiClient("/inventory/cars/");
}

export function getCar(id) {
  return apiClient(`/inventory/cars/${id}/`);
}

export async function createCar(formData) {
  const data = new FormData();

  Object.entries(formData).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      return;
    }

    if (key === "images") {
      value.forEach((image) => {
        data.append("images", image);
      });
    } else {
      data.append(key, value);
    }
  });

  return apiClient("/inventory/cars/", {
    method: "POST",
    body: data,
  });
}

export async function updateCar(id, formData) {
  const data = new FormData();

  Object.entries(formData).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      return;
    }

    if (key === "images") {
      value.forEach((file) => {
        data.append("images", file);
      });
    } else {
      data.append(key, value);
    }
  });

  return apiClient(`/inventory/cars/${id}/`, {
    method: "PATCH",
    body: data,
  });
}

export function patchCar(id, formData) {
  return apiClient(`/inventory/cars/${id}/`, {
    method: "PATCH",
    body: formData,
  });
}

export function deleteCar(id) {
  return apiClient(`/inventory/cars/${id}/`, {
    method: "DELETE",
  });
}
