import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInsurances } from "../../api/insurance";

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

function formatStatus(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClass(status) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700";

    case "DOCUMENTS_PENDING":
      return "bg-amber-100 text-amber-700";

    case "APPLIED":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getExpiryClass(status) {
  switch (status) {
    case "normal":
      return "bg-green-100 text-green-700";

    case "renewal_priority":
      return "bg-amber-100 text-amber-700";

    case "expiring_today":
      return "bg-orange-100 text-orange-700";

    case "expired":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function Insurance() {
  const [insurances, setInsurances] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInsurances() {
      try {
        setLoading(true);
        setError("");

        const response = await getInsurances(
          search.trim() ? { search: search.trim() } : {},
        );

        const data = response?.data ?? response;

        if (!cancelled) {
          setInsurances(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setInsurances([]);
          setError(err?.message || "Unable to load Insurance records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInsurances();

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
          <h1 className="text-2xl font-semibold text-gray-900">Insurance</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage Insurance applications, active policies, and renewal status.
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
            placeholder="Search customer, policy, chassis..."
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
            Loading Insurance records...
          </div>
        ) : insurances.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No Insurance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    Payment
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Application
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Policy
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Expiry
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {insurances.map((insurance) => {
                  const vehicle = [
                    insurance.vehicle_make,
                    insurance.vehicle_model,
                    insurance.vehicle_year,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={insurance.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {insurance.customer_name || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {insurance.customer_mobile || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Chassis: {insurance.vehicle_chassis_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Mileage: {insurance.vehicle_mileage ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        {insurance.payment_method || "-"}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            insurance.application_status,
                          )}`}
                        >
                          {formatStatus(insurance.application_status)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {insurance.policy_number || "Not approved"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {formatDate(insurance.expiry_date)}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getExpiryClass(
                            insurance.expiry_status,
                          )}`}
                        >
                          {insurance.days_remaining !== null &&
                          insurance.days_remaining !== undefined
                            ? `${insurance.days_remaining} days`
                            : "-"}
                        </span>

                        <div className="mt-1 text-xs text-gray-500">
                          {formatStatus(insurance.expiry_status)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <Link
                          to={`/finance/insurance/${insurance.id}`}
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
