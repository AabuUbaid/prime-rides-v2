import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getQuote,
  updateQuote,
  getQuotePrint,
} from "../../api/quotes";
import PrintButton from "../../components/printing/PrintButton";
import QuotePrintTemplate from "../../components/printing/templates/QuotePrintTemplate";

const STATUS_LABELS = {
  quote: "Quote",
  booked: "Booked",
  sold: "Sold",
  cancelled: "Cancelled",
};

const STATUS_ACTIONS = {
  quote: [
    {
      value: "booked",
      label: "Mark as Booked",
    },
    {
      value: "sold",
      label: "Mark as Sold",
    },
    {
      value: "cancelled",
      label: "Cancel Quote",
    },
  ],
  booked: [
    {
      value: "sold",
      label: "Mark as Sold",
    },
    {
      value: "cancelled",
      label: "Cancel Deal",
    },
  ],
  sold: [],
  cancelled: [],
};

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateInput(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function getStatusClass(status) {
  switch (status) {
    case "quote":
      return "bg-blue-100 text-blue-700";

    case "booked":
      return "bg-amber-100 text-amber-700";

    case "sold":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-sm font-medium text-gray-900 sm:text-right">
        {value ?? "-"}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      <div className="px-5 py-1">
        {children}
      </div>
    </section>
  );
}

function EditableField({ label, children }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <label className="mb-2 block text-sm text-gray-500">
        {label}
      </label>

      {children}
    </div>
  );
}

export default function QuoteDetail() {
  const { id } = useParams();

  const [quote, setQuote] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [printing, setPrinting] = useState(false);
const [printQuote, setPrintQuote] = useState(null);

  const [editingCommercial, setEditingCommercial] =
    useState(false);

  const [editingExpenses, setEditingExpenses] =
    useState(false);

  const [extraDownPayment, setExtraDownPayment] =
    useState("");

  const [depositDate, setDepositDate] =
    useState("");

  const [expenseDrafts, setExpenseDrafts] =
    useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        if (!cancelled) {
          setError("Quote ID is missing.");
          setLoading(false);
        }

        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const response = await getQuote(id);

        if (!cancelled) {
          setQuote(response?.data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setError(
            err?.message ||
              "Unable to load this quote.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const startCommercialEdit = () => {
    setExtraDownPayment(
      quote?.extra_down_payment ?? "",
    );

    setDepositDate(
      formatDateInput(quote?.deposit_date),
    );

    setEditingCommercial(true);
  };

  const cancelCommercialEdit = () => {
    setExtraDownPayment(
      quote?.extra_down_payment ?? "",
    );

    setDepositDate(
      formatDateInput(quote?.deposit_date),
    );

    setEditingCommercial(false);
  };

  const saveCommercial = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await updateQuote(id, {
        extra_down_payment:
          extraDownPayment === ""
            ? null
            : extraDownPayment,
        deposit_date:
          depositDate || null,
      });

      toast.success(
        "Commercial details updated.",
      );

      const response = await getQuote(id);

      setQuote(response?.data || null);
      setEditingCommercial(false);
    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to update commercial details.",
      );
    } finally {
      setSaving(false);
    }
  };

  const startExpenseEdit = () => {
    const expenses = Array.isArray(
      quote?.expenses,
    )
      ? quote.expenses
      : [];

    setExpenseDrafts(
      expenses.map((expense) => ({
        id: expense.id,
        actual_amount:
          expense.actual_amount ?? "",
        applies:
          expense.applies !== false,
      })),
    );

    setEditingExpenses(true);
  };

  const cancelExpenseEdit = () => {
    setExpenseDrafts([]);
    setEditingExpenses(false);
  };

  const updateExpenseDraft = (
    expenseId,
    field,
    value,
  ) => {
    setExpenseDrafts((current) =>
      current.map((expense) =>
        String(expense.id) ===
        String(expenseId)
          ? {
              ...expense,
              [field]: value,
            }
          : expense,
      ),
    );
  };

  const saveExpenses = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      const expenseUpdates =
        expenseDrafts.map((expense) => ({
          id: expense.id,
          actual_amount:
            expense.actual_amount === ""
              ? null
              : expense.actual_amount,
          applies: Boolean(expense.applies),
        }));

      await updateQuote(id, {
        expense_updates: expenseUpdates,
      });

      toast.success(
        "Expense details updated.",
      );

      const response = await getQuote(id);

      setQuote(response?.data || null);
      setExpenseDrafts([]);
      setEditingExpenses(false);
    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to update expenses.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    nextStatus,
  ) => {
    if (!quote || saving) {
      return;
    }

    const allowedActions =
      STATUS_ACTIONS[quote.status] || [];

    const allowed = allowedActions.some(
      (action) =>
        action.value === nextStatus,
    );

    if (!allowed) {
      toast.error(
        "This status change is not allowed.",
      );
      return;
    }

    const label =
      STATUS_LABELS[nextStatus] ||
      nextStatus;

    const confirmed = window.confirm(
      `Are you sure you want to change this quote to "${label}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await updateQuote(id, {
        status: nextStatus,
      });

      toast.success(
        `Quote updated to ${label}.`,
      );

      const response = await getQuote(id);

      setQuote(response?.data || null);
    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to update quote status.",
      );
    } finally {
      setSaving(false);
    }
  };

  async function handlePrintQuote() {
  if (!id) {
    toast.error("Quote ID is missing.");
    return;
  }

  try {
    setPrinting(true);

    const response = await getQuotePrint(id);

    if (!response?.success || !response?.data) {
      throw new Error("Quote print data could not be loaded.");
    }

    setPrintQuote(response.data);

    // Wait for React to render the dedicated print template
    requestAnimationFrame(() => {
      window.print();
    });
  } catch (err) {
    console.error("Quote print failed:", err);
    toast.error(
      err?.message || "Unable to prepare the quotation for printing."
    );
  } finally {
    setPrinting(false);
  }
}

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading quote...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Link
            to="/deals"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Deals
          </Link>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-800">
            Unable to load quote
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Quote not found
          </h1>

          <Link
            to="/deals"
            className="mt-4 inline-block text-sm font-medium text-gray-600 underline"
          >
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  const vehicleName = [
    quote.vehicle_make,
    quote.vehicle_model,
    quote.vehicle_variant,
  ]
    .filter(Boolean)
    .join(" ");

  const statusActions =
    STATUS_ACTIONS[quote.status] || [];

  const expenses = Array.isArray(
    quote.expenses,
  )
    ? quote.expenses
    : [];

  const financeFields = [
    quote.emi_bank_name,
    quote.emi_interest_rate,
    quote.emi_vehicle_price,
    quote.emi_finance_amount,
    quote.emi_tenure_years,
    quote.emi_total_interest,
    quote.emi_total_payable,
    quote.emi_monthly_emi,
  ];

  const hasFinanceData =
    quote.payment_method === "Finance" ||
    financeFields.some(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== "",
    );

  return (
    <div className="p-6">
          <div className="no-print-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/deals"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Deals
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {quote.quote_number || "Quote"}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                quote.status,
              )}`}
            >
              {STATUS_LABELS[quote.status] ||
                quote.status ||
                "-"}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Created {formatDate(quote.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
  <button
  type="button"
  onClick={handlePrintQuote}
  disabled={saving || printing}
  className="no-print inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
>
  {printing ? "Preparing..." : "Print Quote"}
</button>

  {statusActions.map((action) => (
    <button
      key={action.value}
      type="button"
      onClick={() =>
        handleStatusChange(action.value)
      }
      disabled={saving}
      className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
        action.value === "cancelled"
          ? "bg-red-600 hover:bg-red-700"
          : "bg-gray-900 hover:bg-gray-800"
      }`}
    >
      {saving
        ? "Updating..."
        : action.label}
    </button>
  ))}
</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Customer */}
        <Section title="Customer">
  <DetailRow
    label="Customer Name"
    value={quote.customer_name}
  />

  <DetailRow
    label="Mobile"
    value={quote.customer_mobile}
  />

  <DetailRow
    label="Salesperson ID"
    value={quote.salesperson_id}
  />
</Section>

        {/* Vehicle */}
        <Section title="Vehicle">
          <DetailRow
            label="Vehicle"
            value={vehicleName}
          />

          <DetailRow
            label="Stock ID"
            value={quote.vehicle_stock_id}
          />

          <DetailRow
            label="Year"
            value={quote.vehicle_year}
          />

          <DetailRow
            label="Colour"
            value={quote.vehicle_colour}
          />

          <DetailRow
            label="Mileage"
            value={quote.vehicle_mileage}
          />

          <DetailRow
            label="Chassis Number"
            value={
              quote.vehicle_chassis_number
            }
          />

          <DetailRow
            label="Engine Number"
            value={
              quote.vehicle_engine_number
            }
          />
        </Section>

        {/* Commercial */}
        <Section title="Commercial Details">
          {!editingCommercial ? (
            <>
              <DetailRow
                label="Price"
                value={formatCurrency(
                  quote.price,
                )}
              />

              <DetailRow
                label="Payment Method"
                value={quote.payment_method}
              />

              <DetailRow
                label="Down Payment"
                value={formatCurrency(
                  quote.down_payment,
                )}
              />

              <DetailRow
                label="Extra Down Payment"
                value={formatCurrency(
                  quote.extra_down_payment,
                )}
              />

              <DetailRow
                label="Deposit Date"
                value={formatDate(
                  quote.deposit_date,
                )}
              />

              <div className="py-3">
                <button
                  type="button"
                  onClick={
                    startCommercialEdit
                  }
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Edit Deposit Details
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Protected fields */}
              <DetailRow
                label="Price"
                value={formatCurrency(
                  quote.price,
                )}
              />

              <DetailRow
                label="Payment Method"
                value={quote.payment_method}
              />

              <DetailRow
                label="Down Payment"
                value={formatCurrency(
                  quote.down_payment,
                )}
              />

              <EditableField label="Extra Down Payment">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraDownPayment}
                  onChange={(event) =>
                    setExtraDownPayment(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </EditableField>

              <EditableField label="Deposit Date">
                <input
                  type="date"
                  value={depositDate}
                  onChange={(event) =>
                    setDepositDate(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                />
              </EditableField>

              <div className="flex gap-2 py-3">
                <button
                  type="button"
                  onClick={saveCommercial}
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save"}
                </button>

                <button
                  type="button"
                  onClick={
                    cancelCommercialEdit
                  }
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </Section>

        {/* Historical Finance */}
        {hasFinanceData && (
          <Section title="Historical Finance">
            <DetailRow
              label="Bank"
              value={quote.emi_bank_name}
            />

            <DetailRow
              label="Interest Rate"
              value={
                quote.emi_interest_rate
              }
            />

            <DetailRow
              label="Vehicle Price"
              value={formatCurrency(
                quote.emi_vehicle_price,
              )}
            />

            <DetailRow
              label="VAT Enabled"
              value={
                quote.emi_vat_enabled
                  ? "Yes"
                  : "No"
              }
            />

            <DetailRow
              label="VAT Amount"
              value={formatCurrency(
                quote.emi_vat_amount,
              )}
            />

            <DetailRow
              label="EMI Down Payment"
              value={formatCurrency(
                quote.emi_down_payment,
              )}
            />

            <DetailRow
              label="Finance Amount"
              value={formatCurrency(
                quote.emi_finance_amount,
              )}
            />

            <DetailRow
              label="Expense Total"
              value={formatCurrency(
                quote.emi_expense_total,
              )}
            />

            <DetailRow
              label="Tenure"
              value={
                quote.emi_tenure_years
                  ? `${quote.emi_tenure_years} years`
                  : "-"
              }
            />

            <DetailRow
              label="Total Interest"
              value={formatCurrency(
                quote.emi_total_interest,
              )}
            />

            <DetailRow
              label="Total Payable"
              value={formatCurrency(
                quote.emi_total_payable,
              )}
            />

            <DetailRow
              label="Monthly EMI"
              value={formatCurrency(
                quote.emi_monthly_emi,
              )}
            />
          </Section>
        )}

        {/* Quote information */}
        <Section title="Quote Information">
          <DetailRow
            label="Quote Number"
            value={quote.quote_number}
          />

          <DetailRow
            label="Source"
            value={quote.source}
          />

          <DetailRow
            label="Customer ID"
            value={quote.customer_id}
          />

          <DetailRow
            label="Car ID"
            value={quote.car_id}
          />

          <DetailRow
            label="Saved EMI ID"
            value={quote.emi_sheet_id}
          />

          <DetailRow
            label="Status"
            value={
              STATUS_LABELS[quote.status] ||
              quote.status
            }
          />

          <DetailRow
            label="Created"
            value={formatDate(
              quote.created_at,
            )}
          />

          <DetailRow
            label="Last Updated"
            value={formatDate(
              quote.updated_at,
            )}
          />
        </Section>

        {/* Expenses */}
        <Section title="Internal Expenses">
          {!editingExpenses ? (
            <>
              {expenses.length === 0 ? (
                <div className="py-5 text-sm text-gray-500">
                  No internal expenses recorded.
                </div>
              ) : (
                <div className="py-1">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border-b border-gray-100 py-4 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {expense.name ||
                              "Expense"}
                          </div>

                          {expense.description && (
                            <div className="mt-1 text-xs text-gray-500">
                              {expense.description}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {expense.applies ===
                            false
                              ? "Not Applied"
                              : "Applied"}
                          </div>

                          <div className="mt-1 text-sm text-gray-700">
                            Actual:{" "}
                            {formatCurrency(
                              expense.actual_amount,
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Estimated:{" "}
                        {expense.estimated_min !==
                        null
                          ? formatCurrency(
                              expense.estimated_min,
                            )
                          : "-"}
                        {" – "}
                        {expense.estimated_max !==
                        null
                          ? formatCurrency(
                              expense.estimated_max,
                            )
                          : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expenses.length > 0 && (
                <div className="py-3">
                  <button
                    type="button"
                    onClick={
                      startExpenseEdit
                    }
                    disabled={saving}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Edit Expenses
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {expenseDrafts.map((draft) => {
                const expense = expenses.find(
                  (item) =>
                    String(item.id) ===
                    String(draft.id),
                );

                if (!expense) {
                  return null;
                }

                return (
                  <div
                    key={draft.id}
                    className="border-b border-gray-100 py-4 last:border-b-0"
                  >
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.name ||
                          "Expense"}
                      </div>

                      {expense.description && (
                        <div className="mt-1 text-xs text-gray-500">
                          {expense.description}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-gray-500">
                          Actual Amount
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            draft.actual_amount
                          }
                          onChange={(event) =>
                            updateExpenseDraft(
                              draft.id,
                              "actual_amount",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-500">
                          Applies
                        </label>

                        <label className="flex min-h-[42px] items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={
                              draft.applies
                            }
                            onChange={(event) =>
                              updateExpenseDraft(
                                draft.id,
                                "applies",
                                event.target.checked,
                              )
                            }
                          />

                          <span className="text-sm text-gray-700">
                            Expense applies
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2 py-4">
                <button
                  type="button"
                  onClick={saveExpenses}
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Expenses"}
                </button>

                <button
                  type="button"
                  onClick={
                    cancelExpenseEdit
                  }
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </Section>
      </div>
          </div>
<QuotePrintTemplate quote={printQuote} />
    </div>
  );
}