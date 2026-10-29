import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";
import { deleteBalanceSheet, getBalanceSheet } from "../../api/balanceSheets";
import { formatAED } from "../../utils/formatters";
import { getApiErrorMessage } from "../../utils/errorMessage";

function formatBalanceStatus(value) {
  if (value === "settled") {
    return "Settled";
  }

  if (value === "customer_receivable") {
    return "Customer Receivable";
  }

  if (value === "customer_payable") {
    return "Customer Payable";
  }

  return value || "-";
}

function formatDirection(value) {
  if (value === "customer_payment") {
    return "Customer Payment";
  }

  if (value === "company_on_behalf") {
    return "Company On Behalf";
  }

  return value || "-";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getResponseData(response) {
  const body = response ?? {};

  return body?.data ?? body;
}

function BalanceSheetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMaster = user?.role === "MASTER";

  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBalanceSheet() {
      try {
        setLoading(true);
        setError("");

        const response = await getBalanceSheet(id);

        if (!active) {
          return;
        }

        setBalanceSheet(getResponseData(response));
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load Balance Sheet:", err);

        setBalanceSheet(null);
        setError(err?.message || "Failed to load Balance Sheet.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBalanceSheet();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <p className="text-sm text-slate-500">Loading Balance Sheet...</p>
        </div>
      </div>
    );
  }

  if (error || !balanceSheet) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <Link
            to="/finance/balance-sheets"
            className="text-sm font-medium text-slate-700 hover:underline"
          >
            ← Back to Balance Sheets
          </Link>

          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="text-sm text-rose-700">
              {error || "Balance Sheet not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const transactions = Array.isArray(balanceSheet.transactions)
    ? balanceSheet.transactions
    : [];

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this Balance Sheet?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBalanceSheet(id);

      toast.success("Balance Sheet deleted successfully.");
      window.location.href = "/finance/balance-sheets";
    } catch (err) {
      console.error("Failed to delete Balance Sheet:", err);

      toast.error(getApiErrorMessage(err, "Failed to delete Balance Sheet."));
    }
  }

  async function handleCreateCashReceipt() {
    const customerId = balanceSheet?.customer;
    const quoteId = balanceSheet?.quote;

    if (!customerId) {
      toast.error("Customer ID is missing from Balance Sheet.");
      return;
    }

    if (!quoteId) {
      toast.error("Quote ID is missing from Balance Sheet.");
      return;
    }

    const sellingPrice = Number(balanceSheet?.selling_price || 0);
    const totalReceived = Number(balanceSheet?.total_received || 0);

    console.log("Balance Sheet payment check:", {
      selling_price: balanceSheet?.selling_price,
      total_received: balanceSheet?.total_received,
      quote_id: balanceSheet?.quote,
    });

    const amount = Math.max(0, sellingPrice - totalReceived);

    if (amount <= 0) {
      toast.info("The customer has no remaining payment due.");
      return;
    }

    navigate(
      `/finance/cash-receipts/new?customer_id=${encodeURIComponent(
        customerId,
      )}&quote_id=${encodeURIComponent(quoteId)}&amount=${encodeURIComponent(
        amount,
      )}&direction=customer_payment&category=final_payment&payment_method=cash`,
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">


      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/finance/balance-sheets"
            className="text-sm font-medium text-slate-700 hover:underline"
          >
            ← Back to Balance Sheets
          </Link>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Balance Sheet
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {balanceSheet.quote_number || "-"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateCashReceipt}
                  disabled={false}
                  className="inline-flex h-10 items-center rounded-xl border border-emerald-600 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create Cash Receipt
                </button>

                <Link
                  to={`/finance/balance-sheets/${id}/print`}
                  className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
                >
                  Print
                </Link>

                {isMaster && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex h-10 items-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <h3 className="text-lg font-semibold text-slate-900">
              Deal Information
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Customer
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.customer_name || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Mobile
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.customer_mobile || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Quote
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.quote_number || balanceSheet.quote || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Payment Method
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.payment_method || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Quote Status
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.quote_status || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Agent
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.agent_name || "-"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Vehicle Information
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Vehicle
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {[
                    balanceSheet.vehicle_make,
                    balanceSheet.vehicle_model,
                    balanceSheet.vehicle_variant,
                  ]
                    .filter(Boolean)
                    .join(" ") || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Stock ID
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.vehicle_stock_id || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Year
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.vehicle_year || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Colour
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.vehicle_colour || "-"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Chassis Number
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {balanceSheet.vehicle_chassis_number || "-"}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <h3 className="text-lg font-semibold text-slate-900">
            Financial Position
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Selling Price
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatAED(balanceSheet.selling_price)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Total Received
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatAED(balanceSheet.total_received)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Total Spent
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatAED(balanceSheet.total_spent)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Net Difference
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatAED(balanceSheet.net_difference)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Balance Status
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatBalanceStatus(balanceSheet.balance_status)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Spent Breakdown
            </h3>
          </div>

          {Array.isArray(balanceSheet.spent_breakdown) &&
            balanceSheet.spent_breakdown.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {balanceSheet.spent_breakdown.map((item, index) => (
                <div
                  key={`${item.type}-${item.expense_id || item.receipt_id || index}`}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item.type === "quote_amount"
                        ? "Vehicle Price"
                        : item.narration || "-"}{" "}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.type === "quote_expense"
                        ? "Quote Expense"
                        : item.type === "vat"
                          ? "VAT"
                          : item.type === "company_on_behalf"
                            ? "Company Expense"
                            : "Quote"}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {formatAED(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <p className="text-sm text-slate-500">
                No spending breakdown available.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Transaction History
            </h3>
          </div>

          {transactions.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-slate-500">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Receipt No.
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Direction
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Category
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment Method
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {transaction.receipt_number || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        {formatDate(transaction.transaction_date)}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        {formatDirection(transaction.direction)}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        {transaction.category || "-"}
                      </td>

                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatAED(transaction.amount)}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        {transaction.payment_method || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        {transaction.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default BalanceSheetDetail;
