import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getBalanceSheets } from "../../api/balanceSheets";
import { formatAED } from "../../utils/formatters";
import StatusBadge from "../../components/ui/StatusBadge";

const PAYMENT_METHODS = [
  { value: "", label: "All Payment Methods" },
  { value: "cash", label: "Cash" },
  { value: "finance", label: "Finance" },
];

const BALANCE_STATUSES = [
  { value: "", label: "All Balance Statuses" },
  { value: "settled", label: "Settled" },
  { value: "customer_receivable", label: "Customer Receivable" },
  { value: "customer_payable", label: "Customer Payable" },
];


const getResponseData = (response) => {
  const body = response?.data ?? response;

  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body)) return body;

  return [];
};


function formatBalanceStatus(value) {
  if (value === "settled") {
    return "Settled";
  }

  if (value === "customer_receivable") {
    return "Customer Receivable";
  }

  if (value === "customer_payable") {
    return "Customer Payable";
  }

  return value || "-";
}

function getBalanceStatusVariant(value) {
  if (value === "settled") return "success";
  if (value === "customer_receivable") return "info";
  if (value === "customer_payable") return "warning";
  return undefined;
}

function BalanceSheets() {
  const [balanceSheets, setBalanceSheets] = useState([]);

  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  const [customerId, setCustomerId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [balanceStatus, setBalanceStatus] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBalanceSheets() {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (customerId.trim()) {
          params.customer_id = customerId.trim();
        }

        if (quoteId.trim()) {
          params.quote_id = quoteId.trim();
        }

        if (search.trim()) {
          params.search = search.trim();
        }

        if (paymentMethod) {
          params.payment_method = paymentMethod;
        }

        if (balanceStatus) {
          params.balance_status = balanceStatus;
        }

        const firstResponse = await getBalanceSheets({
          ...params,
          page: 1,
        });

        if (!active) {
          return;
        }

        const firstBody = firstResponse?.data?.pagination
          ? firstResponse.data
          : firstResponse;

        const totalPages = Number(
          firstBody?.pagination?.total_pages ?? 1
        );

        const remainingResponses = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            getBalanceSheets({
              ...params,
              page: index + 2,
            })
          )
        );

        if (!active) {
          return;
        }

        const allResponses = [
          firstResponse,
          ...remainingResponses,
        ];

        const allBalanceSheets = allResponses.flatMap((response) => {
          const body = response?.data?.success !== undefined
            ? response.data
            : response;

          return Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.results)
              ? body.results
              : Array.isArray(body)
                ? body
                : [];
        });

        setBalanceSheets(allBalanceSheets);


      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load Balance Sheets:", err);

        setBalanceSheets([]);
        setError(err?.message || "Failed to load Balance Sheets.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBalanceSheets();

    return () => {
      active = false;
    };
  }, [customerId, quoteId, search, paymentMethod, balanceStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [customerId, quoteId, search, paymentMethod, balanceStatus]);

  function clearFilters() {
    setCustomerId("");
    setQuoteId("");
    setSearch("");
    setPaymentMethod("");
    setBalanceStatus("");
  }

  const hasFilters =
    customerId || quoteId || search || paymentMethod || balanceStatus;

  const totalPages = Math.ceil(balanceSheets.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedBalanceSheets = balanceSheets.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              to="/finance/settings"
              className="text-sm font-medium text-slate-700 hover:underline"
            >
              ← Finance
            </Link>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Balance Sheets
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View calculated financial positions for Deals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/finance/balance-sheets/new"
              className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
            >
              Create Balance Sheet
            </Link>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="balance-sheet-search"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Search
                </label>

                <input
                  id="balance-sheet-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Quote, customer, vehicle..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="balance-sheet-customer-id"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Customer ID
                </label>

                <input
                  id="balance-sheet-customer-id"
                  type="number"
                  min="1"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  placeholder="Customer ID"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="balance-sheet-quote-id"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Quote ID
                </label>

                <input
                  id="balance-sheet-quote-id"
                  type="number"
                  min="1"
                  value={quoteId}
                  onChange={(event) => setQuoteId(event.target.value)}
                  placeholder="Quote ID"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="balance-sheet-payment-method"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Payment Method
                </label>

                <select
                  id="balance-sheet-payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
                  htmlFor="balance-sheet-status"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Balance Status
                </label>

                <select
                  id="balance-sheet-status"
                  value={balanceStatus}
                  onChange={(event) => setBalanceStatus(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                >
                  {BALANCE_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-slate-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading && (
          <div           className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="text-sm text-slate-500">Loading Balance Sheets...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {!loading && !error && balanceSheets.length === 0 && (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="text-sm text-slate-500">No Balance Sheets found.</p>
          </div>
        )}

        {!loading && !error && balanceSheets.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Quote
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Payment Method
                  </th>

                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Received
                  </th>

                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Spent
                  </th>

                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Net Difference
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedBalanceSheets.map((sheet) => (
                  <tr key={sheet.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {sheet.customer_name || "-"}
                      </div>

                      <div className="text-xs text-slate-500">
                        {sheet.customer_mobile || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      {sheet.quote_number || sheet.quote || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">
                        {[sheet.vehicle_make, sheet.vehicle_model]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </div>

                      <div className="text-xs text-slate-500">
                        {sheet.vehicle_stock_id || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      {sheet.payment_method || "-"}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-slate-900">
                      {formatAED(sheet.total_received)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-slate-900">
                      {formatAED(sheet.total_spent)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-slate-900">
                      {formatAED(sheet.net_difference)}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        status={sheet.balance_status || sheet.status}
                        variant={getBalanceStatusVariant(
                          sheet.balance_status || sheet.status,
                        )}
                      >
                        {formatBalanceStatus(
                          sheet.balance_status || sheet.status,
                        )}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/finance/balance-sheets/${sheet.id}`}
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1}–
            {Math.min(startIndex + PAGE_SIZE, balanceSheets.length)} of{" "}
            {balanceSheets.length} balance sheets
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-slate-600">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage >= totalPages}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BalanceSheets;
