import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProgressions } from "../../api/progression";

const STAGE_LABELS = {
  evaluation: "Evaluation",
  passing: "Passing",
  dubai_passing: "Dubai Passing",
  registration_passing: "Registration Passing",
  insurance: "Insurance",
  registration: "Registration",
  delivery_video: "Delivery Video",
  completed: "Completed",
};
const STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
  completed: "Completed",
};
export default function Progressions() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function load() {
    try {
      setLoading(true);
      setError("");
      const r = await getProgressions();
      setItems(Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e?.message || "Unable to load Progression.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const rows = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aCompleted = a.status === "completed";
        const bCompleted = b.status === "completed";

        // Completed always goes to the bottom.
        if (aCompleted !== bCompleted) {
          return Number(aCompleted) - Number(bCompleted);
        }

        // Within the same status group, newest first.
        return (
          new Date(b.updated_at || b.created_at || 0) -
          new Date(a.updated_at || a.created_at || 0)
        );
      }),
    [items],
  );
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Progression</h1>
            <p className="mt-1 text-sm text-gray-500">
              Operational delivery and registration workflow.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.vehicle_stock_id || "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {[r.vehicle_year, r.vehicle_make, r.vehicle_model]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                    </td>
                    <td className="px-4 py-3">{r.customer_name || "-"}</td>
                    <td className="px-4 py-3">{r.seller_name || "-"}</td>
                    <td className="px-4 py-3">
                      {r.bank_name || r.payment_method || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {STAGE_LABELS[r.current_stage] || r.current_stage || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {STATUS_LABELS[r.status] || r.status || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/progression/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && !rows.length && (
            <div className="p-6 text-sm text-gray-500">
              No Progression records are currently available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
