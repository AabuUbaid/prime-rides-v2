import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProgressions } from "../../api/progression";

import { getInsurances } from "../../api/insurance";
import ProgressionPrintTemplate from "../../components/printing/templates/ProgressionPrintTemplate";

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

      <div className="progression-list-ui mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Progression</h1>
            <p className="mt-1 text-sm text-gray-500">
              Operational delivery and registration workflow.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintActiveProgressions}
              disabled={loading || printingActive}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {printingActive
                ? "Preparing Print..."
                : "Print Active Progressions"}
            </button>

            <button
              type="button"
              onClick={() => load(appliedSearch)}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium"
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
          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row"
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vehicle, stock ID, customer, seller, bank..."
            className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </form>

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

      {printRows && (
        <div className="progression-print-wrapper">
          <ProgressionPrintTemplate items={printRows} />
        </div>
      )}
    </div>
  );

}
