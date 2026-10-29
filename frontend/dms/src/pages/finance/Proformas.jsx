import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApprovedInsuranceDocumentPicker from "./ApprovedInsuranceDocumentPicker";
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
  const navigate = useNavigate();
  const [showCreatePicker, setShowCreatePicker] = useState(false);

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
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Proforma Invoices
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage Proforma Invoices created from approved Insurance records.
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:flex-row lg:w-auto">
          <button
            type="button"
            onClick={() => setShowCreatePicker(true)}
            className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
          >
            Create Proforma
          </button>

          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full flex-1 gap-2 lg:w-auto"
          >
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Proforma, customer, mobile..."
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
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading Proforma records...
          </div>
        ) : proformas.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No Proforma records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Proforma
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Payment
                  </th>

                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle Price
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {proformas.map((proforma) => {
                  const vehicle = [
                    proforma.vehicle_make,
                    proforma.vehicle_model,
                    proforma.vehicle_year,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={proforma.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {proforma.proforma_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Quote #{proforma.quote ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {proforma.customer_name || "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {proforma.customer_mobile || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-slate-900">
                          {vehicle || "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Chassis: {proforma.vehicle_chassis_number || "-"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Mileage: {proforma.vehicle_mileage ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {formatPaymentType(proforma.payment_type)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right align-top text-sm font-medium tabular-nums text-slate-900">
                        {proforma.vehicle_price ?? "-"}
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-slate-700">
                        {formatDate(proforma.proforma_date)}
                      </td>

                      <td className="px-4 py-3 text-right align-top">
                        <Link
                          to={`/finance/proformas/${proforma.id}`}
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
          documentLabel="Proforma Invoice"
          onClose={() => setShowCreatePicker(false)}
          onApproved={(insurance) => {
            setShowCreatePicker(false);
            navigate(
              `/finance/proformas/new?insurance=${encodeURIComponent(insurance.id)}`,
            );
          }}
        />
      )}
      </div>
    </div>
  );
}
