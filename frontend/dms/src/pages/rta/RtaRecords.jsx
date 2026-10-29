import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRtaRecords } from "../../api/rta";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/ui/StatusBadge";

const RECORD_TYPE_LABELS = {
  PURCHASE: "Purchase",
  SALE: "Sale",
};

const STATUS_LABELS = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  SIGNED: "Signed",
  SUBMITTED: "Submitted",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function RtaRecords() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const response = await getRtaRecords();

      const data =
        response && Object.prototype.hasOwnProperty.call(response, "data")
          ? response.data
          : response;

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setItems(records);
    } catch (e) {
      setError(e?.message || "Unable to load RTA records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              RTA Records
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage RTA purchase and sale records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {user?.role !== "SALES_STAFF" && (
              <Link
                to="/rta/new"
                className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
              >
                + Create RTA
              </Link>
            )}

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">RTA Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Quote</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Party</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">{record.rta_date || "-"}</td>

                    <td className="px-4 py-3">
                      {RECORD_TYPE_LABELS[record.record_type] ||
                        record.record_type ||
                        "-"}
                    </td>

                    <td className="px-4 py-3">{record.quote || "-"}</td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {record.vehicle_stock_id ||
                          record.vehicle_chassis_number ||
                          "-"}
                      </div>

                      <div className="text-xs text-slate-500">
                        {[record.vehicle_make, record.vehicle_model]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {record.customer
                        ? `Customer #${record.customer}`
                        : record.second_party_role === "Customer"
                          ? record.second_party_name || "-"
                          : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {record.second_party_name || "-"}
                      </div>

                      <div className="text-xs text-slate-500">
                        {record.second_party_role || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={record.status}>
                        {STATUS_LABELS[record.status] || record.status || "-"}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/rta/${record.id}`}
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !items.length && (
            <div className="p-6 text-sm text-slate-500">
              No RTA records are currently available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
