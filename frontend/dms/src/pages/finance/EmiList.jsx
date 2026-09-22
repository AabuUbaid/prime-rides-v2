import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBanks, getEmiEstimates } from "../../api/finance";
import { useAuth } from "../../context/AuthContext";

import { formatAED } from "../../utils/formatters";

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-AE");
}

function getStatusLabel(status) {
  return String(status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function EmiList() {
  const { user } = useAuth();

  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [bank, setBank] = useState("");

  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [search, status, bank]);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          setLoading(true);
          setError("");

          const params = {
            page,
          };

          if (search.trim()) {
            params.search = search.trim();
          }

          if (status) {
            params.status = status;
          }

          if (bank) {
            params.bank = bank;
          }

          const response = await getEmiEstimates(params);

          if (cancelled) {
            return;
          }

          const data = response?.data ?? response;

          if (Array.isArray(data)) {
            setEmis(data);
            setPagination(null);
          } else {
            setEmis(Array.isArray(data?.results) ? data.results : []);
            setPagination(data || null);
          }
        } catch (err) {
          if (cancelled) {
            return;
          }

          console.error("Failed to load EMI estimates:", err);

          setError(err?.message || "Failed to load EMI estimates.");

          setEmis([]);
          setPagination(null);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      },
      search.trim() ? 350 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, status, bank, page]);

  useEffect(() => {
    let cancelled = false;

    async function loadBanks() {
      try {
        setBanksLoading(true);

        const response = await getBanks();
        const data = response?.data ?? response;

        if (!cancelled) {
          setBanks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load finance banks:", err);

        if (!cancelled) {
          setBanks([]);
        }
      } finally {
        if (!cancelled) {
          setBanksLoading(false);
        }
      }
    }

    loadBanks();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasPreviousPage = Boolean(pagination?.previous) && page > 1;

  const hasNextPage = Boolean(pagination?.next);

  const showingPageControls =
    Boolean(pagination?.count) || hasPreviousPage || hasNextPage;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
              Sales & Customers
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              EMI Estimates
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              View saved finance estimates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/finance/emi"
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
            >
              + New EMI
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="emi-search"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Search
              </label>

              <input
                id="emi-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="EMI no, customer, vehicle..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </div>

            <div>
              <label
                htmlFor="emi-status"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Status
              </label>

              <select
                id="emi-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="emi-bank"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Bank
              </label>

              <select
                id="emi-bank"
                value={bank}
                onChange={(event) => setBank(event.target.value)}
                disabled={banksLoading}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                <option value="">
                  {banksLoading ? "Loading banks..." : "All Banks"}
                </option>

                {!banksLoading &&
                  banks.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {(search || status || bank) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
                setBank("");
                setPage(1);
              }}
              className="mt-4 text-sm font-semibold text-slate-500 transition hover:text-amber-600"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <p className="text-sm text-slate-500">Loading EMI estimates...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        )}

        {!loading && !error && emis.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">No EMI estimates found.</p>

            <Link
              to="/finance/emi"
              className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
            >
              Create EMI
            </Link>
          </div>
        )}

        {!loading && !error && emis.length > 0 && (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        EMI Number
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Customer
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vehicle
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Bank
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Interest
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Finance Amount
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Monthly EMI
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Created
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {emis.map((emi) => (
                      <tr key={emi.id}>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                          {emi.emi_number || "—"}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div>
                            <p className="font-medium text-gray-900">
                              {emi.customer_name || "—"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {emi.customer_mobile || "—"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div>
                            <p className="font-medium text-gray-900">
                              {[
                                emi.vehicle_make,
                                emi.vehicle_model,
                                emi.vehicle_variant,
                              ]
                                .filter(Boolean)
                                .join(" ") || "—"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {emi.vehicle_stock_id || "Manual Vehicle"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {emi.bank_name || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">
                          {emi.interest_rate != null
                            ? `${emi.interest_rate}%`
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm font-semibold text-slate-900">
                          {formatAED(emi.finance_amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm font-bold text-slate-900">
                          {formatAED(emi.monthly_emi)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              emi.status === "active"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : emi.status === "cancelled"
                                  ? "border-slate-200 bg-slate-100 text-slate-600"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {getStatusLabel(emi.status)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {formatDate(emi.created_at)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <Link
                            to={`/finance/emi/${emi.id}`}
                            className="text-sm font-bold text-amber-600 transition hover:text-amber-700"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {showingPageControls && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-sm text-slate-500">
                  {pagination?.count != null
                    ? `${pagination.count} EMI record${
                        pagination.count === 1 ? "" : "s"
                      }`
                    : `Page ${page}`}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!hasPreviousPage}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-sm font-medium text-gray-700">
                    Page {page}
                  </span>

                  <button
                    type="button"
                    disabled={!hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default EmiList;
