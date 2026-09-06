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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
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
      return "bg-blue-100 text-blue-700";
    case "booked":
      return "bg-amber-100 text-amber-700";
    case "sold":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
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
        });

        const data = Array.isArray(response?.data)
          ? response.data
          : [];

        setQuotes(data);
      } catch (err) {
        setQuotes([]);

        setError(
          err?.message ||
            "Unable to load quotes. Please try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status],
  );

  useEffect(() => {
  let cancelled = false;

  async function loadInitialQuotes() {
    try {
      setLoading(true);
      setError("");

      const response = await getQuotes({
        status,
        search,
      });

      if (cancelled) {
        return;
      }

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      setQuotes(data);
    } catch (err) {
      if (cancelled) {
        return;
      }

      setQuotes([]);
      setError(
        err?.message ||
          "Unable to load quotes. Please try again.",
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadInitialQuotes();

  return () => {
    cancelled = true;
  };
}, [search, status]);

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
    }, 400);
  };

  const handleStatusChange = (nextStatus) => {
    if (nextStatus === status) {
      return;
    }

    setStatus(nextStatus);
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Quotes & Deals
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage quotations and deal records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => navigate("/deals/new")}
    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
  >
    New Quote
  </button>

  <button
    type="button"
    onClick={handleRefresh}
    disabled={loading || refreshing}
    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                onClick={() =>
                  handleStatusChange(tab.value)
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-red-800">
                Unable to load quotes
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Loading */}
        {loading && (
          <div className="p-10 text-center">
            <div className="text-sm text-gray-500">
              Loading quotes...
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && quotes.length === 0 && (
          <div className="p-10 text-center">
            <h2 className="text-base font-semibold text-gray-900">
              No quotes found
            </h2>

            <p className="mt-1 text-sm text-gray-500">
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
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Quote
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Vehicle
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Price
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
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
                      onClick={() =>
                        handleRowClick(quote.id)
                      }
                      className="cursor-pointer transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {quote.quote_number || "-"}
                        </div>

                        {quote.vehicle_stock_id && (
                          <div className="mt-1 text-xs text-gray-500">
                            Stock #{quote.vehicle_stock_id}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {quote.customer_name || "-"}
                        </div>

                        {quote.customer_mobile && (
                          <div className="mt-1 text-xs text-gray-500">
                            {quote.customer_mobile}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-900">
                          {vehicleName || "-"}
                        </div>

                        {quote.vehicle_chassis_number && (
                          <div className="mt-1 text-xs text-gray-500">
                            Chassis:{" "}
                            {quote.vehicle_chassis_number}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(quote.price)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {quote.payment_method || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            quote.status,
                          )}`}
                        >
                          {STATUS_LABELS[quote.status] ||
                            quote.status ||
                            "-"}
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
        <div className="mt-3 text-sm text-gray-500">
          Showing {quotes.length}{" "}
          {quotes.length === 1 ? "record" : "records"}.
        </div>
      )}
    </div>
  );
}