import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { getCustomers } from "../../api/customers";
import {
  createBalanceSheet,
  getCustomerBalanceSheetDeals,
} from "../../api/balanceSheets";

import { getApiErrorMessage } from "../../utils/errorMessage";

function getResponseData(response) {
  const body = response ?? {};

  return body?.data ?? body;
}

function BalanceSheetCreate() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const initialCustomerId = searchParams.get("customer_id") || "";
  const initialQuoteId = searchParams.get("quote_id") || "";

  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [quoteId, setQuoteId] = useState(initialQuoteId);

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerOptions, setShowCustomerOptions] = useState(false);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);
        setError("");

        let allCustomers = [];
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const response = await getCustomers({
            page,
            page_size: 100,
          });

          const data = response?.data ?? response;
          const pageCustomers = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [];

          allCustomers = [...allCustomers, ...pageCustomers];

          hasNext = Boolean(response?.pagination?.next ?? data?.next);
          page += 1;

          if (page > 1000) {
            throw new Error("Customer pagination exceeded the safety limit.");
          }
        }

        setCustomers(allCustomers);
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

        const response = await getCustomerBalanceSheetDeals(customerId);

        const data = getResponseData(response);

        const customerDeals = Array.isArray(data) ? data : [];

        setDeals(customerDeals);

        if (initialQuoteId) {
          const matchingDeal = customerDeals.find(
            (deal) => String(deal.id) === String(initialQuoteId),
          );

          if (matchingDeal) {
            setQuoteId(String(matchingDeal.id));
          } else {
            setQuoteId("");
            setError(
              "The quote passed from Progression was not found under the selected customer.",
            );
          }
        }
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

      toast.error(getApiErrorMessage(err, "Failed to create Balance Sheet."));
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) return true;

    return [
      customer.customer_name,
      customer.name,
      customer.phone_number,
      customer.emirates_id_number,
      customer.email,
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(customerId)
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">


      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-8">
        <Link
          to="/finance/balance-sheets"
          className="text-sm font-medium text-slate-700 hover:underline"
        >
          ← Back to Balance Sheets
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Create Balance Sheet
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Select the customer and Deal. The backend will calculate the
            financial position from the actual transactions.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6"
        >

          <div className="relative">
            <label
              htmlFor="balance-sheet-customer-search"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
            >
              Customer
            </label>

            <input
              id="balance-sheet-customer-search"
              type="search"
              value={
                showCustomerOptions
                  ? customerSearch
                  : selectedCustomer
                    ? `${selectedCustomer.customer_name || selectedCustomer.name || `Customer #${selectedCustomer.id}`}${selectedCustomer.phone_number ? ` — ${selectedCustomer.phone_number}` : ""}`
                    : customerSearch
              }
              onFocus={() => {
                setCustomerSearch("");
                setShowCustomerOptions(true);
              }}
              onChange={(event) => {
                setCustomerSearch(event.target.value);
                setShowCustomerOptions(true);
              }}
              placeholder={
                loadingCustomers
                  ? "Loading customers..."
                  : "Search customer name, phone, or Emirates ID..."
              }
              disabled={loadingCustomers || submitting}
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
            />

            {showCustomerOptions && !loadingCustomers && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredCustomers.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-500">
                    No matching customers found.
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setCustomerId(String(customer.id));
                        setCustomerSearch("");
                        setShowCustomerOptions(false);
                        setQuoteId("");
                        setDeals([]);
                      }}
                      className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <div className="font-medium text-slate-900">
                        {customer.customer_name ||
                          customer.name ||
                          `Customer #${customer.id}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {customer.phone_number || ""}
                        {customer.emirates_id_number
                          ? ` · ${customer.emirates_id_number}`
                          : ""}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>


          <div className="mt-4">
            <label
              htmlFor="balance-sheet-deal"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
            >
              Deal / Quote
            </label>

            <select
              id="balance-sheet-deal"
              value={quoteId}
              onChange={(event) => setQuoteId(event.target.value)}
              disabled={!customerId || loadingDeals || submitting}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Link
              to="/finance/balance-sheets"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || !customerId || !quoteId}
              className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
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
