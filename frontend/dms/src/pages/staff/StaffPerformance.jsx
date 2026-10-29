import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getStaffPerformance } from "../../api/staff";
import { getApiErrorMessage } from "../../utils/errorMessage";

export default function StaffPerformance() {
  const { id } = useParams();
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setData(await getStaffPerformance(id));
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Unable to load performance."));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  if (loading)
    return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Staff Performance</h1>
            <p className="mt-1 text-sm text-slate-500">
              Backend-calculated results for{" "}
              {data?.staff_name || `Staff #${id}`}
            </p>
          </div>
          <Link
            to="/staff"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
            <div key={l} className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="text-sm text-slate-500">{l}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                {l === "Vehicles Sold" ? (v ?? "-") : `AED ${v ?? "-"}`}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 text-sm text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          Sold count and profit come from completed Progression records and
          backend calculations.
        </div>
      </div>
    </div>
  );
}
