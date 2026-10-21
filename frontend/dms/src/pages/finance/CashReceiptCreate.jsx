import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  getCashReceiptCategories,
  createCashReceipt,
  getCustomerCashReceiptDeals,
} from "../../api/cashReceipts";

import { getBalanceSheets } from "../../api/balanceSheets";

import { getCustomers } from "../../api/customers";


import { getApiErrorMessage } from "../../utils/errorMessage";
import { formatAED } from "../../utils/formatters";

const DIRECTIONS = [
  {
    value: "customer_payment",
    label: "Customer Payment",
  },
  {
    value: "company_on_behalf",
    label: "Company on Behalf",
  },
];

const FIXED_CATEGORIES = [
  {
    value: "additional_payment",
    label: "Additional Payment",
    source: "standard",
  },
  {
    value: "advance",
    label: "Advance",
    source: "standard",
  },
  {
    value: "final_payment",
    label: "Final Payment",
    source: "standard",
  },
  {
    value: "other",
    label: "Other",
    source: "standard",
  },
];

const FIXED_CATEGORY_VALUES = new Set(
  FIXED_CATEGORIES.map((option) => option.value),
);

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
  },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

function getResponseData(response) {
  const body = response?.data ?? response;

  return body?.data ?? body;
}

function CashReceiptCreate() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");

  const [deals, setDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsError, setDealsError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [quoteId, setQuoteId] = useState("");

  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [direction, setDirection] = useState("company_on_behalf");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionDate, setTransactionDate] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const presetCustomerId = searchParams.get("customer_id");
    const presetQuoteId = searchParams.get("quote_id");
    const presetAmount = searchParams.get("amount");
    const presetDirection = searchParams.get("direction");
    const presetCategory = searchParams.get("category");
    const presetPaymentMethod = searchParams.get("payment_method");
    const presetReference = searchParams.get("reference");
    const presetDescription = searchParams.get("description");

    if (presetCustomerId) {
      setCustomerId(presetCustomerId);
    }

    if (presetQuoteId) {
      setQuoteId(presetQuoteId);
    }

    if (presetAmount) {
      setAmount(presetAmount);
    }

    if (presetDirection) {
      setDirection(presetDirection);
    }

    if (
      presetCategory &&
      FIXED_CATEGORY_VALUES.has(presetCategory.trim().toLowerCase())
    ) {
      setCategory(presetCategory.trim().toLowerCase());
    }

    if (presetPaymentMethod) {
      setPaymentMethod(presetPaymentMethod);
    }

    if (presetReference) {
      setReference(presetReference);
    }

    if (presetDescription) {
      setDescription(presetDescription);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      try {
        setCustomersLoading(true);
        setCustomersError("");

        const response = await getCustomers();

        if (!active) {
          return;
        }

        const body = response?.data ?? response;

        const data = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];

        setCustomers(data);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load customers:", err);

        setCustomers([]);

        setCustomersError(err?.message || "Failed to load customers.");
      } finally {
        if (active) {
          setCustomersLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDeals() {
      if (!customerId) {
        setDeals([]);
        setQuoteId("");
        setDealsError("");
        return;
      }

      try {
        setDealsLoading(true);
        setDealsError("");
        if (!searchParams.get("quote_id")) {
          setQuoteId("");
        }
        const response = await getCustomerCashReceiptDeals(customerId);

        if (!active) {
          return;
        }

        const body = response?.data ?? response;

        const data = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];

        setDeals(data);

        const presetQuoteId = searchParams.get("quote_id");

        if (
          presetQuoteId &&
          data.some((deal) => String(deal.id) === String(presetQuoteId))
        ) {
          setQuoteId(presetQuoteId);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load customer deals:", err);

        setDeals([]);

        setDealsError(err?.message || "Failed to load customer deals.");
      } finally {
        if (active) {
          setDealsLoading(false);
        }
      }
    }

    loadDeals();

    return () => {
      active = false;
    };
  }, [customerId]);

  // Effect 1: load balance sheet whenever customer/quote changes
  useEffect(() => {
    let active = true;

    async function loadBalance() {
      if (!customerId || !quoteId) {
        setBalance(null);
        setBalanceError("");
        setBalanceLoading(false);
        return;
      }

      try {
        setBalanceLoading(true);
        setBalanceError("");

        const response = await getBalanceSheets({
          quote_id: quoteId,
        });

        if (!active) {
          return;
        }

        const body = response?.data ?? response;

        const rows = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];

        setBalance(rows[0] || null);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load customer balance:", err);

        setBalance(null);
        setBalanceError(err?.message || "Failed to load customer balance.");
      } finally {
        if (active) {
          setBalanceLoading(false);
        }
      }
    }

    loadBalance();

    return () => {
      active = false;
    };
  }, [customerId, quoteId]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");

        const response = await getCashReceiptCategories();

        if (!active) {
          return;
        }

        const data = getResponseData(response);
        const categoryOptions = Array.isArray(data) ? data : [];

        setCategories(categoryOptions);

        const presetCategory = String(searchParams.get("category") || "")
          .trim()
          .toLowerCase();

        const matchedCategory = categoryOptions.find(
          (option) =>
            String(option.value ?? "").trim().toLowerCase() === presetCategory,
        );

        if (matchedCategory) {
          setCategory(matchedCategory.value);
        } else {
          setCategory((current) =>
            categoryOptions.some((option) => option.value === current)
              ? current
              : "",
          );
        }
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load Cash Receipt categories:", err);

        setCategories([]);

        setCategoriesError(
          err?.message || "Failed to load Cash Receipt categories.",
        );
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!customerId.trim()) {
      toast.error("Customer is required.");
      return;
    }

    if (!quoteId.trim()) {
      toast.error("Quote / Deal is required.");
      return;
    }

    if (!category) {
      toast.error("Category is required.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer_id: Number(customerId),
        quote_id: Number(quoteId),
        direction,
        category,
        amount,
        payment_method: paymentMethod,
        description,
        reference,
      };

      if (transactionDate) {
        payload.transaction_date = transactionDate;
      }

      const response = await createCashReceipt(payload);

      const data = getResponseData(response);

      toast.success(response?.message || "Cash Receipt created successfully.");

      if (data?.id) {
        navigate(`/finance/cash-receipts/${data.id}`);
        return;
      }

      navigate("/finance/cash-receipts");
    } catch (err) {
      console.error("Failed to create Cash Receipt:", err);

      toast.error(getApiErrorMessage(err, "Failed to create Cash Receipt."));
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = categories;

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            to="/finance/cash-receipts"
            className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-amber-600"
          >
            ← Back to Cash Receipts
          </Link>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172033]">
            Create Cash Receipt
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record an actual financial transaction.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
            <div>
              <label
                htmlFor="cash-receipt-customer"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Customer
              </label>
              <select
                id="cash-receipt-customer"
                value={customerId}
                disabled={customersLoading}
                onChange={(event) => {
                  setCustomerId(event.target.value);
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {customersLoading
                    ? "Loading customers..."
                    : "Select customer"}
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
              {customersError && (
                <p className="mt-1 text-xs text-red-600">{customersError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="cash-receipt-quote"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Quote / Deal
              </label>

              <select
                id="cash-receipt-quote"
                value={quoteId}
                disabled={!customerId || dealsLoading || deals.length === 0}
                onChange={(event) => setQuoteId(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {!customerId
                    ? "Select customer first"
                    : dealsLoading
                      ? "Loading deals..."
                      : deals.length === 0
                        ? "No deals found"
                        : "Select quote / deal"}
                </option>

                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.quote_number || `Quote #${deal.id}`}
                    {" — "}
                    {deal.payment_method || "-"}
                    {" — "}
                    {deal.status || "-"}
                    {deal.vehicle_stock_id ? ` — ${deal.vehicle_stock_id}` : ""}
                  </option>
                ))}
              </select>

              {dealsError && (
                <p className="mt-1 text-xs text-red-600">{dealsError}</p>
              )}
            </div>

            {quoteId && (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-[#fffaf0] p-4 sm:p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Current Customer Balance
                </div>

                {balanceLoading ? (
                  <div className="mt-1 text-sm text-slate-500">
                    Loading balance...
                  </div>
                ) : balanceError ? (
                  <div className="mt-1 text-sm text-red-600">
                    {balanceError}
                  </div>
                ) : balance ? (
                  <>
                    <div className="mt-1 text-xl font-extrabold text-[#172033]">
                      {formatAED(balance.net_difference)}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>Received: {formatAED(balance.total_received)}</span>

                      <span>Spent:{formatAED(balance.total_spent)}</span>

                      <span>Status: {balance.balance_status || "-"}</span>
                    </div>
                  </>
                ) : (
                  <div className="mt-1 text-sm text-slate-500">
                    No balance information available.
                  </div>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="cash-receipt-direction"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Direction
              </label>

              <select
                id="cash-receipt-direction"
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              >
                {DIRECTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="cash-receipt-category"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Category
              </label>

              <select
                id="cash-receipt-category"
                value={category}
                disabled={
                  categoriesLoading ||
                  categoryOptions.length === 0
                }
                onChange={(event) => setCategory(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {categoriesLoading ? (
                  <option value="">Loading categories...</option>
                ) : (
                  <>
                    <option value="">Select category</option>

                    {categoryOptions.map((option) => (
                      <option
                        key={`${option.source}-${option.value}-${option.expense_preset_id ?? "standard"}`}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </>
                )}
              </select>

              {categoriesError && (
                <p className="mt-1 text-xs text-red-600">{categoriesError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="cash-receipt-amount"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Actual Amount
              </label>

              <input
                id="cash-receipt-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />

              <p className="mt-1 text-xs leading-5 text-slate-500">
                The amount is prefilled from the selected expense. Verify or adjust
                it to match the actual transaction.
              </p>
            </div>

            <div>
              <label
                htmlFor="cash-receipt-payment-method"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Payment Method
              </label>

              <select
                id="cash-receipt-payment-method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              >
                {PAYMENT_METHODS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="cash-receipt-date"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Transaction Date
              </label>

              <input
                id="cash-receipt-date"
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div>
              <label
                htmlFor="cash-receipt-reference"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Reference
              </label>

              <input
                id="cash-receipt-reference"
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={255}
                placeholder="Optional reference"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="cash-receipt-description"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Description
              </label>

              <textarea
                id="cash-receipt-description"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
                placeholder="Optional description"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/finance/cash-receipts")}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || categoriesLoading || categories.length === 0}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Cash Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CashReceiptCreate;
