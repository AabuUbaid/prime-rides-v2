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

          <div className="relative">
            <label
              htmlFor="balance-sheet-customer-search"
              className="mb-1 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />

            {showCustomerOptions && !loadingCustomers && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                {filteredCustomers.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-500">
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
                      className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="font-medium text-gray-900">
                        {customer.customer_name ||
                          customer.name ||
                          `Customer #${customer.id}`}
                      </div>
                      <div className="text-xs text-gray-500">
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
