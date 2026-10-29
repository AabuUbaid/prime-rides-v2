import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApprovedInsuranceDocumentPicker from "./ApprovedInsuranceDocumentPicker";
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

  const navigate = useNavigate();
  const [showCreatePicker, setShowCreatePicker] = useState(false);

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
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Delivery Notes
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage vehicle Delivery Notes created from approved Insurance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreatePicker(true)}
          className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
        >
          Create Delivery Note
        </button>

        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full gap-2 lg:w-auto"
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Delivery Note, customer, chassis..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 lg:w-80"
          />

          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading Delivery Notes...
          </div>
        ) : deliveryNotes.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No Delivery Notes found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Delivery Note
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Buyer
                  </th>

                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {deliveryNotes.map((deliveryNote) => {
                  const vehicle = [
                    deliveryNote.vehicle_make,
                    deliveryNote.vehicle_model,
                    deliveryNote.vehicle_year,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={deliveryNote.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {deliveryNote.delivery_note_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Quote #{deliveryNote.quote ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {deliveryNote.customer_name || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {vehicle || "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Chassis: {deliveryNote.vehicle_chassis_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Mileage: {deliveryNote.vehicle_mileage ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-slate-700">
                        {formatDate(deliveryNote.delivery_date)}
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-slate-700">
                        {deliveryNote.buyer_name || "-"}
                      </td>

                      <td className="px-4 py-3 text-right align-top">
                        <Link
                          to={`/finance/delivery-notes/${deliveryNote.id}`}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
      {showCreatePicker && (
        <ApprovedInsuranceDocumentPicker
          documentLabel="Delivery Note"
          onClose={() => setShowCreatePicker(false)}
          onApproved={(insurance) => {
            setShowCreatePicker(false);
            navigate(
              `/finance/delivery-notes/new?insurance=${encodeURIComponent(insurance.id)}`,
            );
          }}
        />
      )}
      </div>
    </div>
  );
}
