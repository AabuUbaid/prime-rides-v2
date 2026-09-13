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

export function getCashReceipts(params = {}) {
    return apiClient(
        `/finance/cash-receipts/${buildQueryString(params)}`,
    );
}

export function getCashReceipt(cashReceiptId) {
    return apiClient(
        `/finance/cash-receipts/${cashReceiptId}/`,
    );
}

export function createCashReceipt(payload) {
    return apiClient("/finance/cash-receipts/", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateCashReceipt(cashReceiptId, payload) {
    return apiClient(
        `/finance/cash-receipts/${cashReceiptId}/`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
    );
}

export function reverseCashReceipt(
    cashReceiptId,
    payload = {},
) {
    return apiClient(
        `/finance/cash-receipts/${cashReceiptId}/reverse/`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );
}

export function getCashReceiptCategories() {
    return apiClient(
        "/finance/cash-receipts/categories/",
    );
}

export function getCustomerCashReceiptDeals(customerId) {
    return apiClient(
        `/finance/cash-receipts/customers/${customerId}/deals/`,
    );
}