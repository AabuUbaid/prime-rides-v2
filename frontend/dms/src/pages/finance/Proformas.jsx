import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProformas } from "../../api/proforma";

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

function formatPaymentType(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());
}

export default function Proformas() {
  const [proformas, setProformas] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProformas() {
      try {
        setLoading(true);
        setError("");

        const response = await getProformas(
          search.trim() ? { search: search.trim() } : {},
        );

        const data = response?.data ?? response;

        if (!cancelled) {
          setProformas(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setProformas([]);
          setError(err?.message || "Unable to load Proforma records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProformas();

    return () => {
      cancelled = true;
    };
  }, [search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Proforma Invoices
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage Proforma Invoices created from approved Insurance records.
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full gap-2 lg:w-auto"
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Proforma, customer, mobile..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 lg:w-80"
          />

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading Proforma records...
          </div>
        ) : proformas.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No Proforma records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Proforma
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Vehicle
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Vehicle Price
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {proformas.map((proforma) => {
                  const vehicle = [
                    proforma.vehicle_make,
                    proforma.vehicle_model,
                    proforma.vehicle_year,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={proforma.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {proforma.proforma_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Quote #{proforma.quote ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {proforma.customer_name || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {proforma.customer_mobile || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Chassis: {proforma.vehicle_chassis_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Mileage: {proforma.vehicle_mileage ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {formatPaymentType(proforma.payment_type)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right align-top text-sm font-medium text-gray-900">
                        {proforma.vehicle_price ?? "-"}
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        {formatDate(proforma.proforma_date)}
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <Link
                          to={`/finance/proformas/${proforma.id}`}
                          className="inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
