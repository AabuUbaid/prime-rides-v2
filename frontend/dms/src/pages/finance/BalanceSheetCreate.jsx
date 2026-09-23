import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getCustomers } from "../../api/customers";
import {
  createBalanceSheet,
  getCustomerBalanceSheetDeals,
} from "../../api/balanceSheets";

function getResponseData(response) {
  const body = response ?? {};

  return body?.data ?? body;
}

function BalanceSheetCreate() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [quoteId, setQuoteId] = useState("");

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);
        setError("");

        const response = await getCustomers();
        const data = getResponseData(response);

        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load customers:", err);

        setCustomers([]);
        setError(err?.message || "Failed to load customers.");
      } finally {
        setLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, []);

  useEffect(() => {
    if (!customerId) {
      return;
    }

    async function loadDeals() {
      try {
        setLoadingDeals(true);
        setError("");
        setQuoteId("");

        const response = await getCustomerBalanceSheetDeals(customerId);

        const data = getResponseData(response);

        setDeals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load customer deals:", err);

        setDeals([]);
        setError(err?.message || "Failed to load customer deals.");
      } finally {
        setLoadingDeals(false);
      }
    }

    loadDeals();
  }, [customerId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!customerId) {
      toast.error("Please select a customer.");
      return;
    }

    if (!quoteId) {
      toast.error("Please select a deal.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await createBalanceSheet({
        customer_id: Number(customerId),
        quote_id: Number(quoteId),
      });

      const data = getResponseData(response);

      toast.success("Balance Sheet created successfully.");

      if (data?.id) {
        navigate(`/finance/balance-sheets/${data.id}`);
        return;
      }

      navigate("/finance/balance-sheets");
    } catch (err) {
      console.error("Failed to create Balance Sheet:", err);

      toast.error(err?.message || "Failed to create Balance Sheet.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
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

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link
          to="/finance/balance-sheets"
          className="text-sm font-medium text-gray-700 hover:underline"
        >
          ← Back to Balance Sheets
        </Link>

        <div className="mt-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Create Balance Sheet
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select the customer and Deal. The backend will calculate the
            financial position from the actual transactions.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="balance-sheet-customer"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Customer
            </label>

            <select
              id="balance-sheet-customer"
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value);
                setQuoteId("");
              }}
              disabled={loadingCustomers || submitting}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              <option value="">
                {loadingCustomers ? "Loading customers..." : "Select customer"}
              </option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name ||
                    customer.name ||
                    `Customer #${customer.id}`}
                  {customer.phone_number ? ` — ${customer.phone_number}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label
              htmlFor="balance-sheet-deal"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Deal / Quote
            </label>

            <select
              id="balance-sheet-deal"
              value={quoteId}
              onChange={(event) => setQuoteId(event.target.value)}
              disabled={!customerId || loadingDeals || submitting}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              <option value="">
                {!customerId
                  ? "Select customer first"
                  : loadingDeals
                    ? "Loading deals..."
                    : deals.length === 0
                      ? "No deals found"
                      : "Select deal"}
              </option>

              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.quote_number || `Quote #${deal.id}`}
                  {" — "}
                  {deal.payment_method || "-"}
                  {" — "}
                  {deal.status || deal.quote_status || ""}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Link
              to="/finance/balance-sheets"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || !customerId || !quoteId}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Balance Sheet"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default BalanceSheetCreate;
