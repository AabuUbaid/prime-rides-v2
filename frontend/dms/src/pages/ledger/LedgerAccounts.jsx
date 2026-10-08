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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Ledger Accounts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Read-only reporting from authoritative financial events.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border bg-white px-4 py-2 text-sm"
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
                <div key={l} className="rounded-xl border bg-white p-5">
                  <div className="text-sm text-gray-500">{l}</div>
                  <div className="mt-2 text-2xl font-semibold">{money(v)}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold">Expense Breakdown</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {[
                  ["Company on Behalf", d.company_on_behalf],
                  ["Vehicle Expenses", d.car_expenses],
                  ["Quote Expenses", d.quote_expenses],
                  ["EMI Expenses", d.emi_expenses],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">{l}</div>
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
