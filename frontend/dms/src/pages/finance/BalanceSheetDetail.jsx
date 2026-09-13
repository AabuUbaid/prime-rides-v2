import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";
import { deleteBalanceSheet, getBalanceSheet } from "../../api/balanceSheets";
import { formatAED } from "../../utils/formatters";

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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading Balance Sheet...</p>
        </div>
      </div>
    );
  }

  if (error || !balanceSheet) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/finance/balance-sheets"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            ← Back to Balance Sheets
          </Link>

          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">
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

      toast.error(err?.message || "Failed to delete Balance Sheet.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prime Rides</h1>

            <p className="text-sm text-gray-500">Dealer Management System</p>
          </div>

          <Link
            to="/dashboard"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <Link
            to="/finance/balance-sheets"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            ← Back to Balance Sheets
          </Link>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Balance Sheet
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {balanceSheet.quote_number || "-"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Link
                  to={`/finance/balance-sheets/${id}/print`}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Print
                </Link>

                {isMaster && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
              f
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Deal Information
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Customer
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.customer_name || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Mobile
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.customer_mobile || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Quote
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.quote_number || balanceSheet.quote || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Payment Method
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.payment_method || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Quote Status
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.quote_status || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Agent
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.agent_name || "-"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Vehicle Information
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Vehicle
                </p>
                <p className="mt-1 text-sm text-gray-900">
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
                <p className="text-xs font-medium uppercase text-gray-500">
                  Stock ID
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.vehicle_stock_id || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Year
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.vehicle_year || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Colour
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.vehicle_colour || "-"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Chassis Number
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {balanceSheet.vehicle_chassis_number || "-"}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            Financial Position
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Selling Price
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatAED(balanceSheet.selling_price)}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Evaluation
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatAED(balanceSheet.evaluation)}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Total Received
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatAED(balanceSheet.total_received)}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Total Spent
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatAED(balanceSheet.total_spent)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Net Difference
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatAED(balanceSheet.net_difference)}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Balance Status
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatBalanceStatus(balanceSheet.balance_status)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Transaction History
            </h3>
          </div>

          {transactions.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-gray-500">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Receipt No.
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Direction
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Category
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment Method
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Description
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {transaction.receipt_number || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(transaction.transaction_date)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDirection(transaction.direction)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {transaction.category || "-"}
                      </td>

                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatAED(transaction.amount)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {transaction.payment_method || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
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
