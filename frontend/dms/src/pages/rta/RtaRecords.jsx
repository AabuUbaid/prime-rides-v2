import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRtaRecords } from "../../api/rta";

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              RTA Records
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage RTA purchase and sale records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/rta/new"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Create RTA
            </Link>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
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

              <tbody className="divide-y divide-gray-100">
                {items.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">{record.rta_date || "-"}</td>

                    <td className="px-4 py-3">
                      {RECORD_TYPE_LABELS[record.record_type] ||
                        record.record_type ||
                        "-"}
                    </td>

                    <td className="px-4 py-3">{record.quote || "-"}</td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {record.vehicle_stock_id ||
                          record.vehicle_chassis_number ||
                          "-"}
                      </div>

                      <div className="text-xs text-gray-500">
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
                      <div className="font-medium text-gray-900">
                        {record.second_party_name || "-"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {record.second_party_role || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {STATUS_LABELS[record.status] || record.status || "-"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/rta/${record.id}`}
                        className="font-medium text-gray-900 hover:underline"
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
            <div className="p-6 text-sm text-gray-500">
              No RTA records are currently available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
