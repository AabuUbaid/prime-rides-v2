import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getLedgerSummary } from "../../api/ledgerAccounts";
import { getApiErrorMessage } from "../../utils/errorMessage";

const money = (v) =>
  `AED ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function LedgerAccounts() {
  const [d, setD] = useState(null),
    [loading, setLoading] = useState(true);
  async function load() {
    try {
      setLoading(true);
      setD(await getLedgerSummary());
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to load Ledger Accounts."));
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Ledger Accounts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Read-only reporting from authoritative financial events.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {d && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Total Income", d.total_income],
                ["Total Expense", d.total_expense],
                ["Ledger Net", d.ledger_net],
                ["Stock Profit", d.stock_profit],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="text-sm text-slate-500">{l}</div>
                  <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{money(v)}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <h2 className="font-semibold">Expense Breakdown</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {[
                  ["Company on Behalf", d.company_on_behalf],
                  ["Vehicle Expenses", d.car_expenses],
                  ["Quote Expenses", d.quote_expenses],
                  ["EMI Expenses", d.emi_expenses],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="text-xs text-slate-500">{l}</div>
                    <div className="mt-1 font-semibold">{money(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
