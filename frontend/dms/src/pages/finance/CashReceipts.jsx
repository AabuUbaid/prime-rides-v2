import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getCashReceipts,
  getCashReceiptCategories,
} from "../../api/cashReceipts";

import { formatAED } from "../../utils/formatters";

const DIRECTIONS = [
  { value: "", label: "All Directions" },
  {
    value: "customer_payment",
    label: "Customer Payment",
  },
  {
    value: "company_on_behalf",
    label: "Company on Behalf",
  },
];

const PAYMENT_METHODS = [
  { value: "", label: "All Payment Methods" },
  { value: "cash", label: "Cash" },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
  },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

function getResponseData(response) {
  const body = response ?? {};

  return {
    data: Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
        ? body
        : [],
    summary: body?.summary ?? {},
  };
}

function formatDirection(value) {
  if (value === "customer_payment") {
    return "Customer Payment";
  }

  if (value === "company_on_behalf") {
    return "Company on Behalf";
  }

  return value || "-";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function CashReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState({
    total_received: "0.00",
  });

  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [receiptNumber, setReceiptNumber] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [quoteId, setQuoteId] = useState("");

  const [transactionDate, setTransactionDate] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);

        const response = await getCashReceiptCategories();

        if (!active) {
          return;
        }

        const body = response?.data ?? response;

        const data = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];

        setCategories(data);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load Cash Receipt categories:", err);

        setCategories([]);
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadReceipts() {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (receiptNumber.trim()) {
          params.receipt_number = receiptNumber.trim();
        }

        if (customerId.trim()) {
          params.customer_id = customerId.trim();
        }

        if (quoteId.trim()) {
          params.quote_id = quoteId.trim();
        }

        if (transactionDate) {
          params.transaction_date = transactionDate;
        }

        if (search.trim()) {
          params.search = search.trim();
        }

        if (direction) {
          params.direction = direction;
        }

        if (category.trim()) {
          params.category = category.trim();
        }

        if (paymentMethod) {
          params.payment_method = paymentMethod;
        }

        if (dateFrom) {
          params.date_from = dateFrom;
        }

        if (dateTo) {
          params.date_to = dateTo;
        }

        const response = await getCashReceipts(params);

        if (!active) {
          return;
        }

        const result = getResponseData(response);

        setReceipts(result.data);
        setSummary(result.summary);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load cash receipts:", err);

        setReceipts([]);
        setSummary({
          total_received: "0.00",
        });

        setError(err?.message || "Failed to load cash receipts.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReceipts();

    return () => {
      active = false;
    };
  }, [
    search,
    receiptNumber,
    customerId,
    quoteId,
    direction,
    category,
    paymentMethod,
    transactionDate,
    dateFrom,
    dateTo,
  ]);

  function clearFilters() {
    setSearch("");
    setReceiptNumber("");
    setCustomerId("");
    setQuoteId("");
    setDirection("");
    setCategory("");
    setPaymentMethod("");
    setTransactionDate("");
    setDateFrom("");
    setDateTo("");
  }

  const hasFilters =
    search ||
    receiptNumber ||
    customerId ||
    quoteId ||
    direction ||
    category ||
    paymentMethod ||
    transactionDate ||
    dateFrom ||
    dateTo;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prime Rides</h1>

            <p className="text-sm text-gray-500">Dealer Management System</p>
          </div>

          <Link
            to="/dashboard"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link
              to="/finance/settings"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              ← Finance
            </Link>

            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              Cash Receipts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track actual customer payments and company-paid financial
              transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <Link
              to="/finance/cash-receipts/new"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Create Cash Receipt
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Received
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatAED(summary.total_received)}
            </p>
          </section>
        </div>

        {showFilters && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="cash-receipt-search"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Search
                </label>

                <input
                  id="cash-receipt-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Receipt, customer, vehicle..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-number"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Receipt Number
                </label>

                <input
                  id="cash-receipt-number"
                  type="text"
                  value={receiptNumber}
                  onChange={(event) => setReceiptNumber(event.target.value)}
                  placeholder="CR-000014"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-customer-id"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Customer ID
                </label>

                <input
                  id="cash-receipt-customer-id"
                  type="number"
                  min="1"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  placeholder="Customer ID"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-quote-id"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Quote ID
                </label>

                <input
                  id="cash-receipt-quote-id"
                  type="number"
                  min="1"
                  value={quoteId}
                  onChange={(event) => setQuoteId(event.target.value)}
                  placeholder="Quote ID"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-direction"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Direction
                </label>

                <select
                  id="cash-receipt-direction"
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                >
                  {DIRECTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-category"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>

                <select
                  id="cash-receipt-category"
                  value={category}
                  disabled={categoriesLoading}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : "All Categories"}
                  </option>

                  {!categoriesLoading &&
                    categories.map((option) => (
                      <option
                        key={`${option.source}-${option.value}-${option.expense_preset_id ?? "standard"}`}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-payment-method"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Payment Method
                </label>

                <select
                  id="cash-receipt-payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                >
                  {PAYMENT_METHODS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-transaction-date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Transaction Date
                </label>

                <input
                  id="cash-receipt-transaction-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) => setTransactionDate(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-date-from"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Date From
                </label>

                <input
                  id="cash-receipt-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-date-to"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Date To
                </label>

                <input
                  id="cash-receipt-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-gray-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Loading cash receipts...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && receipts.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">No cash receipts found.</p>
          </div>
        )}

        {!loading && !error && receipts.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Receipt
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Quote
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Direction
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Category
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {receipt.receipt_number || "-"}
                      </div>

                      {receipt.is_reversal && (
                        <div className="text-xs text-red-600">Reversal</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {receipt.customer_name || "-"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {receipt.vehicle_stock_id || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {receipt.quote_number || receipt.quote || "-"}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDirection(receipt.direction)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {receipt.category || "-"}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatAED(receipt.amount)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(receipt.transaction_date)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/finance/cash-receipts/${receipt.id}`}
                        className="text-sm font-medium text-gray-900 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default CashReceipts;
