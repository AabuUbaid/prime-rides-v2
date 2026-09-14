import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getStaffPerformance } from "../../api/staff";
export default function StaffPerformance() {
  const { id } = useParams();
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setData(await getStaffPerformance(id));
      } catch (e) {
        toast.error(e?.message || "Unable to load performance.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  if (loading)
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Staff Performance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Backend-calculated results for{" "}
              {data?.staff_name || `Staff #${id}`}
            </p>
          </div>
          <Link
            to="/staff"
            className="rounded-lg border bg-white px-4 py-2 text-sm"
          >
            Back
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Vehicles Sold", data?.vehicles_sold],
            ["Sales Value", data?.sales_value],
            ["Profit", data?.profit],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl border bg-white p-5">
              <div className="text-sm text-gray-500">{l}</div>
              <div className="mt-2 text-2xl font-semibold">
                {l === "Vehicles Sold" ? (v ?? "-") : `AED ${v ?? "-"}`}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-white p-5 text-sm text-gray-600">
          Sold count and profit come from completed Progression records and
          backend calculations.
        </div>
      </div>
    </div>
  );
}
