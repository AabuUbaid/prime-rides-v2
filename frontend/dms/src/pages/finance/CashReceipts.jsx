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
    <div className="min-h-screen bg-[#f5f6fa]">
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to="/finance/settings"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              ← Finance
            </Link>

            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-600">
              Finance
            </p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
              Cash Receipts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track actual customer payments and company-paid financial
              transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <Link
              to="/finance/cash-receipts/new"
              className="inline-flex items-center justify-center rounded-xl border border-amber-500 bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:border-amber-400 hover:bg-amber-400"
            >
              + Create Cash Receipt
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Total Received
            </p>

            <p className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-600">
              {formatAED(summary.total_received)}
            </p>
          </section>
        </div>

        {showFilters && (
          <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="cash-receipt-search"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Search
                </label>

                <input
                  id="cash-receipt-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Receipt, customer, vehicle..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-number"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Receipt Number
                </label>

                <input
                  id="cash-receipt-number"
                  type="text"
                  value={receiptNumber}
                  onChange={(event) => setReceiptNumber(event.target.value)}
                  placeholder="CR-000014"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-customer-id"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
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
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-quote-id"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
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
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-direction"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Direction
                </label>

                <select
                  id="cash-receipt-direction"
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
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
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Payment Method
                </label>

                <select
                  id="cash-receipt-payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Transaction Date
                </label>

                <input
                  id="cash-receipt-transaction-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) => setTransactionDate(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-date-from"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Date From
                </label>

                <input
                  id="cash-receipt-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="cash-receipt-date-to"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Date To
                </label>

                <input
                  id="cash-receipt-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded-full bg-amber-400" />
              <p className="text-sm font-medium text-slate-500">
                Loading cash receipts...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        )}

        {!loading && !error && receipts.length === 0 && (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-semibold text-slate-700">
              No cash receipts found.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your filters or search.
            </p>
          </div>
        )}

        {!loading && !error && receipts.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Receipt
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Quote
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Direction
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Category
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {receipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {receipt.receipt_number || "-"}
                      </div>

                      {receipt.is_reversal && (
                        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                          Reversal
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {receipt.customer_name || "-"}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-400">
                        {receipt.vehicle_stock_id || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {receipt.quote_number || receipt.quote || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2.5 py-1",
                          "text-[10px] font-bold uppercase tracking-wide",
                          receipt.direction === "customer_payment"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : receipt.direction === "company_on_behalf"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {formatDirection(receipt.direction)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {receipt.category || "-"}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatAED(receipt.amount)}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {formatDate(receipt.transaction_date)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/finance/cash-receipts/${receipt.id}`}
                        className="text-sm font-bold text-amber-600 transition-colors hover:text-amber-700"
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
