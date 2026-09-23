import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { getCashDeals } from "../../api/cashDeals";

import { formatAED } from "../../utils/formatters";

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
      <div className="min-h-screen bg-[#f5f6fa] p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-lg font-bold text-rose-800">Access Denied</h1>
            <p className="mt-2 text-sm text-rose-700">
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
    <div className="min-h-screen bg-[#f5f6fa]">
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-amber-600">
            Finance
          </p>

          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Cash Deal Tracker
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track cash transactions, advances, balances, and status.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="cash-deal-search"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Search
              </label>

              <input
                id="cash-deal-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Customer, quote, vehicle, chassis..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </div>

            <div>
              <label
                htmlFor="cash-deal-status"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Status
              </label>

              <select
                id="cash-deal-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
              className="mt-4 text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded-full bg-amber-400" />
              <p className="text-sm font-medium text-slate-500">
                Loading cash deals...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        )}

        {!loading && !error && cashDeals.length === 0 && (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-semibold text-slate-700">
              No cash deals found.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search or status filter.
            </p>
          </div>
        )}

        {!loading && !error && cashDeals.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Selling Price
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Amount Paid
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Balance
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {cashDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {deal.customer_name || "-"}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-400">
                        {deal.customer_mobile || ""}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-800">
                        {[
                          deal.vehicle_make,
                          deal.vehicle_model,
                          deal.vehicle_variant,
                        ]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-400">
                        {deal.vehicle_stock_id ||
                          deal.vehicle_chassis_number ||
                          "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {formatAED(deal.selling_price)}
                    </td>

                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {formatAED(deal.advance_amount)}
                    </td>

                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                      {formatAED(deal.balance_amount)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2.5 py-1",
                          "text-[10px] font-bold uppercase tracking-wide",
                          deal.status === "completed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : deal.status === "cancelled"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : deal.status === "ready_for_delivery"
                                ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                                : deal.status === "payment_pending"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : deal.status === "advance_received"
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {formatStatus(deal.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/finance/cash-deals/${deal.id}`}
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

export default CashDeals;
