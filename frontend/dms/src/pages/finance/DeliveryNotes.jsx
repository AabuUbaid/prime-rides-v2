import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDeliveryNotes } from "../../api/deliveryNotes";

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

export default function DeliveryNotes() {
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDeliveryNotes() {
      try {
        setLoading(true);
        setError("");

        const response = await getDeliveryNotes(
          search.trim() ? { search: search.trim() } : {},
        );

        const data = response?.data ?? response;

        if (!cancelled) {
          setDeliveryNotes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setDeliveryNotes([]);
          setError(err?.message || "Unable to load Delivery Note records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDeliveryNotes();

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
            Delivery Notes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage vehicle Delivery Notes created from approved Insurance.
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
            placeholder="Search Delivery Note, customer, chassis..."
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
            Loading Delivery Notes...
          </div>
        ) : deliveryNotes.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No Delivery Notes found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Delivery Note
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Vehicle
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Buyer
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {deliveryNotes.map((deliveryNote) => {
                  const vehicle = [
                    deliveryNote.vehicle_make,
                    deliveryNote.vehicle_model,
                    deliveryNote.vehicle_year,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={deliveryNote.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {deliveryNote.delivery_note_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Quote #{deliveryNote.quote ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {deliveryNote.customer_name || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Chassis: {deliveryNote.vehicle_chassis_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Mileage: {deliveryNote.vehicle_mileage ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        {formatDate(deliveryNote.delivery_date)}
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        {deliveryNote.buyer_name || "-"}
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <Link
                          to={`/finance/delivery-notes/${deliveryNote.id}`}
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
