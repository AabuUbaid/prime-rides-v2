import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProgressions } from "../../api/progression";

import { getInsurances } from "../../api/insurance";
import ProgressionPrintTemplate from "../../components/printing/templates/ProgressionPrintTemplate";
import StatusBadge from "../../components/ui/StatusBadge";

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

function getResponseRows(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response)) return response;
  return [];
}

export default function Progressions() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [showCompleted, setShowCompleted] = useState(false);

  const [printRows, setPrintRows] = useState(null);
  const [printingActive, setPrintingActive] = useState(false);

  async function load(searchValue = appliedSearch) {
    try {
      setLoading(true);
      setError("");
      const r = await getProgressions(searchValue);
      setItems(getResponseRows(r));
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
      [...items]
        .filter((item) => showCompleted || item.status !== "completed")
        .sort((a, b) => {
          const aCompleted = a.status === "completed";
          const bCompleted = b.status === "completed";

          if (aCompleted !== bCompleted) {
            return Number(aCompleted) - Number(bCompleted);
          }

          return (
            new Date(b.updated_at || b.created_at || 0) -
            new Date(a.updated_at || a.created_at || 0)
          );
        }),
    [items, showCompleted],
  );

  async function handlePrintActiveProgressions() {
    try {
      setPrintingActive(true);

      const allRows = [];
      let page = 1;

      while (true) {
        const response = await getProgressions(appliedSearch, {
          page,
          page_size: 100,
        });

        const pageRows = getResponseRows(response);

        if (!pageRows.length) break;

        allRows.push(...pageRows);

        const count = Number(
          response?.count ?? response?.pagination?.count ?? 0,
        );
        const next = response?.next ?? response?.pagination?.next;

        if (!next && (!count || allRows.length >= count)) {
          break;
        }

        page += 1;
      }

      const activeRows = allRows.filter((item) => item.status === "active");

      if (!activeRows.length) {
        window.alert("No active Progression records are available to print.");
        return;
      }

      // Match the detail page's insurance-approved checklist behavior.
      const preparedRows = await Promise.all(
        activeRows.map(async (item) => {
          let insuranceApproved = false;

          if (item.current_stage === "insurance" && item.quote) {
            try {
              const response = await getInsurances({
                quote_id: item.quote,
              });

              const insuranceRecords = getResponseRows(response);

              const insurance = insuranceRecords.find(
                (record) => String(record.quote) === String(item.quote),
              );

              const insuranceStatus = String(
                insurance?.application_status ||
                insurance?.status ||
                "",
              ).toLowerCase();

              insuranceApproved = [
                "approved",
                "completed",
              ].includes(insuranceStatus);
            } catch {
              // Keep the insurance checkbox unchecked if its status
              // cannot be verified.
            }
          }

          return { ...item, insuranceApproved };
        }),
      );

      const previousTitle = document.title;
      const date = new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");

      document.title = `Prime Rides - Active Progressions - ${date}`;
      setPrintRows(preparedRows);

      window.setTimeout(() => {
        window.addEventListener(
          "afterprint",
          () => {
            document.title = previousTitle;
            setPrintRows(null);
          },
          { once: true },
        );

        window.print();
      }, 300);
    } catch (error) {
      console.error("Failed to prepare active Progressions print:", error);

      window.alert(
        error?.message || "Unable to prepare Progressions for printing.",
      );
    } finally {
      setPrintingActive(false);
    }
  }


  return (
    <div
      className={`min-h-screen bg-gray-50 p-6 ${printRows ? "progression-printing" : ""
        }`}
    >
      {printRows && (
        <style>{`
          @media screen {
            .progression-print-wrapper {
              display: none !important;
            }
          }

          @media print {
            @page {
              size: A3 landscape;
              margin: 7mm;
            }

            body * {
              visibility: hidden !important;
            }

            .progression-print-wrapper,
            .progression-print-wrapper * {
              visibility: visible !important;
            }

            .progression-print-wrapper {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              background: #fff !important;
            }

            .progression-list-ui {
              display: none !important;
            }

            .progression-printing {
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }
          }
        `}</style>
      )}

      <div className="progression-list-ui mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Progression</h1>
            <p className="mt-1 text-sm text-slate-500">
              Operational delivery and registration workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintActiveProgressions}
              disabled={loading || printingActive}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-500 bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {printingActive
                ? "Preparing Print..."
                : "Print Active Progressions"}
            </button>

            <button
              type="button"
              onClick={() => load(appliedSearch)}
              disabled={loading}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = search.trim();
            setAppliedSearch(value);
            load(value);
          }}
          className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:flex-row"
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vehicle, stock ID, customer, seller, bank..."
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-5 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search Progression
          </button>

          <button
            type="button"
            disabled={loading && !appliedSearch}
            onClick={() => {
              setSearch("");
              setAppliedSearch("");
              load("");
            }}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Clear
          </button>
        </form>

        <div className="flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Show completed progressions
            </p>
            <p className="text-xs text-slate-500">
              Completed records are hidden by default.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showCompleted}
            onClick={() => setShowCompleted((previous) => !previous)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${showCompleted ? "bg-amber-500" : "bg-slate-300"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCompleted ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
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

              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.vehicle_stock_id || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {[r.vehicle_year, r.vehicle_make, r.vehicle_model]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {r.customer_name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {r.seller_name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {r.bank_name || r.payment_method || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {STAGE_LABELS[r.current_stage] || r.current_stage || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status}>
                        {STATUS_LABELS[r.status] || r.status || "-"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/progression/${r.id}`}
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

          {!loading && !rows.length && (
            <div className="p-6 text-sm text-slate-500">
              No Progression records are currently available.
            </div>
          )}
        </div>
      </div>

      {printRows && (
        <div className="progression-print-wrapper">
          <ProgressionPrintTemplate items={printRows} />
        </div>
      )}
    </div>
  );

}
