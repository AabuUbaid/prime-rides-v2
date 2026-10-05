import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuotes } from "../../api/quotes";

const STATUS_TABS = [
  { value: "open", label: "Open" },
  { value: "all", label: "All" },
  { value: "quote", label: "Quotes" },
  { value: "booked", label: "Booked" },
  { value: "sold", label: "Sold" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_LABELS = {
  quote: "Quote",
  booked: "Booked",
  sold: "Sold",
  cancelled: "Cancelled",
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getStatusClasses(status) {
  switch (status) {
    case "quote":
      return "border border-blue-200 bg-blue-50 text-blue-700";

    case "booked":
      return "border border-amber-200 bg-amber-50 text-amber-700";

    case "sold":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";

    case "cancelled":
      return "border border-rose-200 bg-rose-50 text-rose-700";

    default:
      return "border border-slate-200 bg-slate-100 text-slate-600";
  }
}

export default function Quotes() {
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState("open");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const searchTimerRef = useRef(null);

  const loadQuotes = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getQuotes({
          status,
          search,
          page,
          page_size: pageSize,
        });

        const data = response?.data ?? response;

        if (Array.isArray(data)) {
          setQuotes(data);
          setTotalCount(data.length);
          setHasNextPage(false);
          setHasPreviousPage(false);
        } else {
          setQuotes(Array.isArray(data?.results) ? data.results : []);
          setTotalCount(Number(data?.count ?? 0));
          setHasNextPage(Boolean(data?.next));
          setHasPreviousPage(Boolean(data?.previous));
        }
      } catch (err) {
        setQuotes([]);

        setError(err?.message || "Unable to load quotes. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status, page, pageSize],
  );

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearchInput(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, 400);
  };

  const handleStatusChange = (nextStatus) => {
    if (nextStatus === status) {
      return;
    }

    setStatus(nextStatus);
    setPage(1);
  };

  const handleRefresh = () => {
    loadQuotes({ refresh: true });
  };

  const handleRowClick = (quoteId) => {
    if (!quoteId) {
      return;
    }

    navigate(`/deals/${quoteId}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
            Sales & Customers
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quotes & Deals
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage quotations and deal records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/deals/new")}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
          >
            New Quote
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "border border-amber-200 bg-amber-50 text-amber-700 shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <input
            type="search"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search quote, customer, mobile, vehicle, chassis, engine..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-rose-800">
                Unable to load quotes
              </h2>

              <p className="text-sm text-rose-700">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => loadQuotes()}
              disabled={loading}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        {/* Loading */}
        {loading && (
          <div className="p-10 text-center">
            <div className="text-sm text-slate-400">Loading quotes...</div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && quotes.length === 0 && (
          <div className="p-10 text-center">
            <h2 className="text-base font-semibold text-slate-800">
              No quotes found
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {search
                ? "Try a different search term."
                : "There are no records for this status yet."}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && quotes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Quote
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Price
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {quotes.map((quote) => {
                  const vehicleName = [
                    quote.vehicle_make,
                    quote.vehicle_model,
                    quote.vehicle_variant,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr
                      key={quote.id}
                      onClick={() => handleRowClick(quote.id)}
                      className="cursor-pointer transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {quote.quote_number || "-"}
                        </div>

                        {quote.vehicle_stock_id && (
                          <div className="mt-1 text-xs text-slate-400">
                            Stock {quote.vehicle_stock_id}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {quote.customer_name || "-"}
                        </div>

                        {quote.customer_mobile && (
                          <div className="mt-1 text-xs text-slate-400">
                            {quote.customer_mobile}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-800">
                          {vehicleName || "-"}
                        </div>

                        {quote.vehicle_chassis_number && (
                          <div className="mt-1 text-xs text-slate-400">
                            Chassis: {quote.vehicle_chassis_number}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-800">
                        {formatCurrency(quote.price)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {quote.payment_method || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusClasses(
                            quote.status,
                          )}`}
                        >
                          {STATUS_LABELS[quote.status] || quote.status || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(quote.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {!loading && !error && quotes.length > 0 && (
        <div className="mt-3 text-sm text-slate-400">
          Showing {quotes.length} {quotes.length === 1 ? "record" : "records"}.
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm">
          Page {page}
          {totalCount > 0 && <> · {totalCount} total</>}
        </span>

        <button
          type="button"
          disabled={!hasNextPage}
          onClick={() => setPage((current) => current + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
