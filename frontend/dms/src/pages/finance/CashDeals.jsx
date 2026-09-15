import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { getCashDeals } from "../../api/cashDeals";

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "booked", label: "Booked" },
  {
    value: "advance_received",
    label: "Advance Received",
  },
  {
    value: "payment_pending",
    label: "Payment Pending",
  },
  {
    value: "ready_for_delivery",
    label: "Ready for Delivery",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

function getResponseData(response) {
  const body = response?.data ?? response;

  const data = body?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(body)) {
    return body;
  }

  return [];
}

function formatStatus(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function CashDeals() {
  const { user } = useAuth();
  const isMaster = user?.role === "MASTER";

  const [cashDeals, setCashDeals] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!isMaster) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-800">
              Access Denied
            </h1>
            <p className="mt-2 text-sm text-red-700">
              You do not have permission to access Cash Deals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let active = true;

    async function loadCashDeals() {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (search.trim()) {
          params.search = search.trim();
        }

        if (status) {
          params.status = status;
        }

        const response = await getCashDeals(params);

        if (!active) {
          return;
        }

        setCashDeals(getResponseData(response));
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load cash deals:", err);

        setCashDeals([]);

        setError(err?.message || "Failed to load cash deals.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCashDeals();

    return () => {
      active = false;
    };
  }, [search, status]);

  function clearFilters() {
    setSearch("");
    setStatus("");
  }

  const hasFilters = search || status;

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
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Cash Deal Tracker
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Track cash transactions, advances, balances, and status.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="cash-deal-search"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Search
              </label>

              <input
                id="cash-deal-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Customer, quote, vehicle, chassis..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="cash-deal-status"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="cash-deal-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              >
                {STATUSES.map((option) => (
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

        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Loading cash deals...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && cashDeals.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">No cash deals found.</p>
          </div>
        )}

        {!loading && !error && cashDeals.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Vehicle
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Selling Price
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount Paid
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Balance
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
                {cashDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {deal.customer_name || "-"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {deal.customer_mobile || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {[
                          deal.vehicle_make,
                          deal.vehicle_model,
                          deal.vehicle_variant,
                        ]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {deal.vehicle_stock_id ||
                          deal.vehicle_chassis_number ||
                          "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(deal.selling_price)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(deal.advance_amount)}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(deal.balance_amount)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {formatStatus(deal.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/finance/cash-deals/${deal.id}`}
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

export default CashDeals;
