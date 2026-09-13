import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getBalanceSheets } from "../../api/balanceSheets";
import { formatAED } from "../../utils/formatters";

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

function getResponseData(response) {
  const body = response ?? {};

  return Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body)
      ? body
      : [];
}

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

function BalanceSheets() {
  const [balanceSheets, setBalanceSheets] = useState([]);

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

        const response = await getBalanceSheets(params);

        if (!active) {
          return;
        }

        setBalanceSheets(getResponseData(response));
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

  function clearFilters() {
    setCustomerId("");
    setQuoteId("");
    setSearch("");
    setPaymentMethod("");
    setBalanceStatus("");
  }

  const hasFilters =
    customerId || quoteId || search || paymentMethod || balanceStatus;

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
              Balance Sheets
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View calculated financial positions for Deals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/finance/balance-sheets/new"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create Balance Sheet
            </Link>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="balance-sheet-search"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Search
                </label>

                <input
                  id="balance-sheet-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Quote, customer, vehicle..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="balance-sheet-customer-id"
                  className="mb-1 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="balance-sheet-quote-id"
                  className="mb-1 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="balance-sheet-payment-method"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Payment Method
                </label>

                <select
                  id="balance-sheet-payment-method"
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
                  htmlFor="balance-sheet-status"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Balance Status
                </label>

                <select
                  id="balance-sheet-status"
                  value={balanceStatus}
                  onChange={(event) => setBalanceStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
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
                className="mt-4 text-sm font-medium text-gray-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Loading Balance Sheets...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && balanceSheets.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">No Balance Sheets found.</p>
          </div>
        )}

        {!loading && !error && balanceSheets.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Quote
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Vehicle
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment Method
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Received
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Spent
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Net Difference
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {balanceSheets.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {sheet.customer_name || "-"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {sheet.customer_mobile || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sheet.quote_number || sheet.quote || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {[sheet.vehicle_make, sheet.vehicle_model]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {sheet.vehicle_stock_id || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sheet.payment_method || "-"}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatAED(sheet.total_received)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatAED(sheet.total_spent)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatAED(sheet.net_difference)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatBalanceStatus(
                        sheet.balance_status || sheet.status,
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/finance/balance-sheets/${sheet.id}`}
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

export default BalanceSheets;
