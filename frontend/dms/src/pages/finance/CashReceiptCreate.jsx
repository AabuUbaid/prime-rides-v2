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
import { getQuote } from "../../api/quotes";
import { getEmi } from "../../api/finance";
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

  const [selectedQuote, setSelectedQuote] = useState(null);

  const [quoteExpenses, setQuoteExpenses] = useState([]);

  const [emiExpenses, setEmiExpenses] = useState([]);

  const [expenseLoading, setExpenseLoading] = useState(false);

  const [expenseError, setExpenseError] = useState("");

  const [quoteExpenseId, setQuoteExpenseId] = useState("");

  const [emiExpenseId, setEmiExpenseId] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [quoteId, setQuoteId] = useState("");

  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [direction, setDirection] = useState("customer_payment");
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

    if (presetCategory) {
      setCategory(presetCategory);
    }

    if (presetPaymentMethod) {
      setPaymentMethod(presetPaymentMethod);
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

  // Effect 2: load expense context whenever quote changes
  useEffect(() => {
    let active = true;

    async function loadExpenseContext() {
      if (!quoteId) {
        setSelectedQuote(null);
        setQuoteExpenses([]);
        setEmiExpenses([]);
        setQuoteExpenseId("");
        setEmiExpenseId("");
        setExpenseError("");
        return;
      }

      try {
        setExpenseLoading(true);
        setExpenseError("");

        setSelectedQuote(null);
        setQuoteExpenses([]);
        setEmiExpenses([]);
        setQuoteExpenseId("");
        setEmiExpenseId("");

        const quoteResponse = await getQuote(quoteId);

        if (!active) {
          return;
        }

        const quote = quoteResponse?.data ?? quoteResponse;

        if (!quote) {
          throw new Error("Selected quote details were not returned.");
        }

        setSelectedQuote(quote);

        const paymentMethod = String(quote.payment_method || "")
          .trim()
          .toLowerCase();

        if (paymentMethod === "finance") {
          const emiSheetId = quote.emi_sheet_id;

          if (!emiSheetId) {
            return;
          }

          const emiResponse = await getEmi(emiSheetId);

          if (!active) {
            return;
          }

          const emi = emiResponse?.data ?? emiResponse;

          const expenses = Array.isArray(emi?.expenses) ? emi.expenses : [];

          setEmiExpenses(expenses);
          return;
        }

        const expenses = Array.isArray(quote.expenses) ? quote.expenses : [];

        setQuoteExpenses(expenses);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error("Failed to load receipt expense context:", err);

        setSelectedQuote(null);
        setQuoteExpenses([]);
        setEmiExpenses([]);

        setExpenseError(err?.message || "Failed to load expense context.");
      } finally {
        if (active) {
          setExpenseLoading(false);
        }
      }
    }

    loadExpenseContext();

    return () => {
      active = false;
    };
  }, [quoteId]);

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

        if (categoryOptions.length > 0 && !category) {
          setCategory(categoryOptions[0].value);
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

  function handleQuoteExpenseChange(event) {
    const value = event.target.value;

    setQuoteExpenseId(value);
    setEmiExpenseId("");

    if (!value) {
      return;
    }

    const expense = quoteExpenses.find(
      (item) => String(item.id) === String(value),
    );

    if (expense?.expense_type) {
      setCategory(expense.expense_type);
    }
  }

  function handleEmiExpenseChange(event) {
    const value = event.target.value;

    setEmiExpenseId(value);
    setQuoteExpenseId("");

    if (!value) {
      return;
    }

    const expense = emiExpenses.find(
      (item) => String(item.id) === String(value),
    );

    if (expense?.expense_type) {
      setCategory(expense.expense_type);
    }
  }

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

    if (quoteExpenseId && emiExpenseId) {
      toast.error("Select only one expense context.");
      return;
    }

    if (
      selectedContextExpense &&
      selectedContextExpense.expense_type !== category
    ) {
      toast.error(
        "Selected expense context does not match the receipt category.",
      );
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

      if (quoteExpenseId) {
        payload.quote_expense_id = Number(quoteExpenseId);
      }

      if (emiExpenseId) {
        payload.emi_expense_id = Number(emiExpenseId);
      }

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

      toast.error(err?.message || "Failed to create Cash Receipt.");
    } finally {
      setSaving(false);
    }
  }

  const selectedContextExpense = quoteExpenseId
    ? quoteExpenses.find(
        (expense) => String(expense.id) === String(quoteExpenseId),
      )
    : emiExpenseId
      ? emiExpenses.find(
          (expense) => String(expense.id) === String(emiExpenseId),
        )
      : null;

  const categoryOptions =
    selectedContextExpense?.expense_type &&
    !categories.some(
      (option) => option.value === selectedContextExpense.expense_type,
    )
      ? [
          {
            value: selectedContextExpense.expense_type,
            label:
              selectedContextExpense.name ||
              selectedContextExpense.expense_type,
            source: "selected_expense",
          },
          ...categories,
        ]
      : categories;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            to="/finance/cash-receipts"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            ← Back to Cash Receipts
          </Link>

          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Create Cash Receipt
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Record an actual financial transaction.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="cash-receipt-customer"
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
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
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Quote / Deal
              </label>

              <select
                id="cash-receipt-quote"
                value={quoteId}
                disabled={!customerId || dealsLoading || deals.length === 0}
                onChange={(event) => setQuoteId(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
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

            {selectedQuote && (
              <div className="md:col-span-2 rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    Expense Context
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Optional. Select the specific Quote or EMI expense that this
                    actual transaction relates to.
                  </p>
                </div>

                {expenseLoading && (
                  <p className="text-sm text-gray-500">
                    Loading expense context...
                  </p>
                )}

                {!expenseLoading &&
                  !expenseError &&
                  String(selectedQuote.payment_method || "")
                    .trim()
                    .toLowerCase() === "cash" && (
                    <select
                      value={quoteExpenseId}
                      onChange={handleQuoteExpenseChange}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    >
                      <option value="">No Quote Expense</option>

                      {quoteExpenses.map((expense) => (
                        <option key={expense.id} value={expense.id}>
                          {expense.name ||
                            expense.expense_type ||
                            `Expense #${expense.id}`}
                          {" — "}
                          {expense.expense_type || "-"}
                        </option>
                      ))}
                    </select>
                  )}

                {!expenseLoading &&
                  !expenseError &&
                  String(selectedQuote.payment_method || "")
                    .trim()
                    .toLowerCase() === "finance" && (
                    <select
                      value={emiExpenseId}
                      onChange={handleEmiExpenseChange}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    >
                      <option value="">No EMI Expense</option>

                      {emiExpenses.map((expense) => (
                        <option key={expense.id} value={expense.id}>
                          {expense.name ||
                            expense.expense_type ||
                            `Expense #${expense.id}`}
                          {" — "}
                          {expense.expense_type || "-"}
                        </option>
                      ))}
                    </select>
                  )}

                {expenseError && (
                  <p className="mt-2 text-xs text-red-600">{expenseError}</p>
                )}

                {selectedContextExpense && (
                  <p className="mt-2 text-xs text-gray-600">
                    Actual configured/reference amount:{" "}
                    {formatAED(
                      selectedContextExpense.actual_amount ??
                        selectedContextExpense.amount ??
                        0,
                    )}
                    . The Cash Receipt amount remains separately entered by the
                    user.
                  </p>
                )}
              </div>
            )}

            {quoteId && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Customer Balance
                </div>

                {balanceLoading ? (
                  <div className="mt-1 text-sm text-gray-500">
                    Loading balance...
                  </div>
                ) : balanceError ? (
                  <div className="mt-1 text-sm text-red-600">
                    {balanceError}
                  </div>
                ) : balance ? (
                  <>
                    <div className="mt-1 text-xl font-semibold text-gray-900">
                      AED {formatAED(balance.net_difference)}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>
                        Received: AED {formatAED(balance.total_received)}
                      </span>

                      <span>Spent: AED {formatAED(balance.total_spent)}</span>

                      <span>Status: {balance.balance_status || "-"}</span>
                    </div>
                  </>
                ) : (
                  <div className="mt-1 text-sm text-gray-500">
                    No balance information available.
                  </div>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="cash-receipt-direction"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Direction
              </label>

              <select
                id="cash-receipt-direction"
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
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
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Category
              </label>

              <select
                id="cash-receipt-category"
                value={category}
                disabled={
                  categoriesLoading ||
                  categoryOptions.length === 0 ||
                  Boolean(selectedContextExpense)
                }
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
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

              {selectedContextExpense && (
                <p className="mt-1 text-xs text-gray-500">
                  Category is locked to the selected expense context.
                </p>
              )}

              {categoriesError && (
                <p className="mt-1 text-xs text-red-600">{categoriesError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="cash-receipt-amount"
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />

              <p className="mt-1 text-xs text-gray-500">
                Enter the actual transaction amount. Do not copy a configured
                expense amount automatically.
              </p>
            </div>

            <div>
              <label
                htmlFor="cash-receipt-payment-method"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Payment Method
              </label>

              <select
                id="cash-receipt-payment-method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
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
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Transaction Date
              </label>

              <input
                id="cash-receipt-date"
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="cash-receipt-reference"
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="cash-receipt-description"
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/finance/cash-receipts")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || categoriesLoading || categories.length === 0}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
