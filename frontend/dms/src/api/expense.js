import { apiClient } from "./client";

export function getExpenses(carId) {
  return apiClient(`/inventory/cars/${carId}/expenses/`);
}

export function createExpense(carId, expense) {
  return apiClient(`/inventory/cars/${carId}/expenses/`, {
    method: "POST",
    body: JSON.stringify(expense),
  });
}

export function updateExpense(expenseId, expense) {
  return apiClient(`/inventory/expenses/${expenseId}/`, {
    method: "PATCH",
    body: JSON.stringify(expense),
  });
}

export function deleteExpense(expenseId) {
  return apiClient(`/inventory/expenses/${expenseId}/`, {
    method: "DELETE",
  });
}
