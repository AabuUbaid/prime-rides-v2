import { apiClient } from "./client";

export function getCars(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return apiClient(`/inventory/cars/${queryString ? `?${queryString}` : ""}`);
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

export function deleteImage(imageId) {
  return apiClient(`/inventory/images/${imageId}/`, {
    method: "DELETE",
  });
}

export function setCoverImage(imageId) {
  return apiClient(`/inventory/images/${imageId}/cover/`, {
    method: "PATCH",
  });
}

export function reorderImages(carId, imageOrder) {
  return apiClient(`/inventory/cars/${carId}/images/reorder/`, {
    method: "PATCH",
    body: JSON.stringify({
      image_order: imageOrder,
    }),
  });
}

export const bulkDeleteImages = (imageIds) => {
  return apiClient("/inventory/images/bulk-delete/", {
    method: "POST",
    body: JSON.stringify({
      image_ids: imageIds,
    }),
  });
};
