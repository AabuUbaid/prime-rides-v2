import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  createExpensePreset,
  deleteExpensePreset,
  getExpensePresets,
  updateExpensePreset,
} from "../../api/finance";
import { useAuth } from "../../context/AuthContext";

const INITIAL_FORM = {
  name: "",
  expense_type: "",
  calculation_type: "fixed",
  amount: "",
  percentage: "",
  minimum_amount: "",
  condition_key: "",
  condition_value: "",
  is_active: true,
};

const CALCULATION_TYPES = [
  {
    value: "fixed",
    label: "Fixed amount",
  },
  {
    value: "percentage_minimum",
    label: "Percentage with minimum",
  },
  {
    value: "conditional",
    label: "Conditional value",
  },
];

function toNumberString(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
}

function getCalculationLabel(value) {
  return (
    CALCULATION_TYPES.find(
      (type) => type.value === value,
    )?.label || value || "-"
  );
}

function getFieldError(value) {
  if (Array.isArray(value)) {
    return value.join(" ");
  }

  return value || "";
}

function getApiErrors(error) {
  const errors = error?.cause?.errors;

  if (
    errors &&
    typeof errors === "object" &&
    !Array.isArray(errors)
  ) {
    return errors;
  }

  return {};
}

function getResponseData(response) {
  if (
    response &&
    Object.prototype.hasOwnProperty.call(
      response,
      "data",
    )
  ) {
    return response.data;
  }

  return response;
}

function getApiMessage(error) {
  const nonFieldErrors = getApiErrors(error).non_field_errors;

  if (nonFieldErrors) {
    return getFieldError(nonFieldErrors);
  }

  return (
    error?.cause?.message ||
    error?.message ||
    "Something went wrong."
  );
}

function ExpensePresetManagement() {
  const { user } = useAuth();

  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const isMaster = user?.role === "MASTER";

  async function loadPresets() {
    setLoading(true);

    try {
      const response = await getExpensePresets();

      const data = getResponseData(response);

setPresets(
  Array.isArray(data) ? data : [],
);
    } catch (error) {
      console.error(
        "Failed to load expense presets:",
        error,
      );

      toast.error(getApiMessage(error));

      setPresets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadPresets();
}, []);

  const sortedPresets = useMemo(() => {
    return [...presets]
      .filter(
        (preset) =>
          preset &&
          typeof preset === "object",
      )
      .sort((a, b) => {
        const typeA = String(
          a.expense_type || "",
        );

        const typeB = String(
          b.expense_type || "",
        );

        const typeCompare =
          typeA.localeCompare(typeB);

        if (typeCompare !== 0) {
          return typeCompare;
        }

        return String(
          a.name || "",
        ).localeCompare(
          String(b.name || ""),
        );
      });
  }, [presets]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setEditingPreset(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(preset) {
    setEditingPreset(preset);

    setForm({
      name: preset.name ?? "",
      expense_type:
        preset.expense_type ?? "",
      calculation_type:
        preset.calculation_type ?? "fixed",
      amount: toNumberString(
        preset.amount,
      ),
      percentage: toNumberString(
        preset.percentage,
      ),
      minimum_amount: toNumberString(
        preset.minimum_amount,
      ),
      condition_key:
        preset.condition_key ?? "",
      condition_value:
        String(preset.condition_value ?? "").toLowerCase() === "yes"
          ? "true"
          : String(preset.condition_value ?? "").toLowerCase() === "no"
            ? "false"
            : String(preset.condition_value ?? ""),
      is_active: Boolean(
        preset.is_active,
      ),
    });

    setFieldErrors({});
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    resetForm();
  }

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[name];

      return next;
    });
  }

  const conditionOptions = useMemo(() => {
  return presets
    .filter((preset) => preset?.expense_type)
    .filter(
      (preset) =>
        !editingPreset ||
        String(preset.id) !== String(editingPreset.id),
    )
    .map((preset) => ({
      value: preset.expense_type,
      label: `${preset.name} (${preset.expense_type})`,
    }));
}, [presets, editingPreset]);

  function validateForm() {
    const errors = {};

    if (!form.name.trim()) {
      errors.name =
        "Name is required.";
    }

    if (!form.expense_type.trim()) {
      errors.expense_type =
        "Expense type is required.";
    }

    if (!form.calculation_type) {
      errors.calculation_type =
        "Calculation type is required.";
    }

    if (form.amount !== "") {
      const amount = Number(
        form.amount,
      );

      if (!Number.isFinite(amount)) {
        errors.amount =
          "Amount must be a valid number.";
      } else if (amount < 0) {
        errors.amount =
          "Amount cannot be negative.";
      }
    }

    if (
      form.calculation_type ===
      "percentage_minimum"
    ) {
      if (form.percentage === "") {
        errors.percentage =
          "Percentage is required.";
      } else if (
        Number(form.percentage) < 0
      ) {
        errors.percentage =
          "Percentage cannot be negative.";
      }

      if (
        form.minimum_amount === ""
      ) {
        errors.minimum_amount =
          "Minimum amount is required.";
      } else if (
        Number(
          form.minimum_amount,
        ) < 0
      ) {
        errors.minimum_amount =
          "Minimum amount cannot be negative.";
      }
    }

    if (
      form.calculation_type ===
      "conditional"
    ) {
      if (
        !form.condition_key.trim()
      ) {
        errors.condition_key =
          "Condition key is required.";
      }

      if (
        !form.condition_value.trim()
      ) {
        errors.condition_value =
          "Condition value is required.";
      }
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      expense_type:
        form.expense_type.trim(),
      calculation_type:
        form.calculation_type,
      amount:
        form.amount === ""
          ? "0.00"
          : form.amount,
      percentage:
        form.calculation_type ===
        "percentage_minimum"
          ? form.percentage
          : null,
      minimum_amount:
        form.calculation_type ===
        "percentage_minimum"
          ? form.minimum_amount
          : null,
      condition_key:
        form.calculation_type ===
        "conditional"
          ? form.condition_key.trim()
          : "",
      condition_value:
        form.calculation_type ===
        "conditional"
          ? form.condition_value.trim()
          : "",
      is_active:
        form.is_active,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isMaster) {
      toast.error(
        "You do not have permission to modify expense presets.",
      );

      return;
    }

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const payload =
        buildPayload();

      let response;

      if (editingPreset) {
        response =
          await updateExpensePreset(
            editingPreset.id,
            payload,
          );
      } else {
        response =
          await createExpensePreset(
            payload,
          );
      }

      const savedPreset =
  getResponseData(response);

      /*
       * Never insert an undefined/null object
       * into the local collection.
       */
      if (
        !savedPreset ||
        typeof savedPreset !==
          "object"
      ) {
        throw new Error(
          "The server returned an invalid expense preset response.",
        );
      }

      /*
       * Reload from the backend after
       * successful mutations.
       *
       * This makes the database the source
       * of truth rather than local React state.
       */
      await loadPresets();

      toast.success(
        response?.message ||
          (editingPreset
            ? "Expense preset updated successfully."
            : "Expense preset created successfully."),
      );

      closeModal();
    } catch (error) {
      console.error(
        editingPreset
          ? "Failed to update expense preset:"
          : "Failed to create expense preset:",
        error,
      );

      const errors =
        getApiErrors(error);

      if (
        Object.keys(errors)
          .length > 0
      ) {
        setFieldErrors(
          errors,
        );
      }

      toast.error(
        getApiMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(
    preset,
  ) {
    if (!isMaster) {
      toast.error(
        "You do not have permission to modify expense presets.",
      );

      return;
    }

    try {
      await updateExpensePreset(
        preset.id,
        {
          is_active:
            !preset.is_active,
        },
      );

      await loadPresets();

      toast.success(
        `Expense preset ${
          preset.is_active
            ? "deactivated"
            : "activated"
        } successfully.`,
      );
    } catch (error) {
      console.error(
        "Failed to update expense preset status:",
        error,
      );

      toast.error(
        getApiMessage(error),
      );
    }
  }

  async function handleDelete(
    preset,
  ) {
    if (!isMaster) {
      toast.error(
        "You do not have permission to delete expense presets.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${preset.name}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteExpensePreset(
        preset.id,
      );

      await loadPresets();

      toast.success(
        "Expense preset deleted successfully.",
      );
    } catch (error) {
      console.error(
        "Failed to delete expense preset:",
        error,
      );

      toast.error(
        getApiMessage(error),
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Prime Rides
            </h1>

            <p className="text-sm text-gray-500">
              Dealer Management System
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/finance/settings"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Finance Master
            </Link>

            <Link
              to="/dashboard"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name}
              </p>

              <p className="text-xs uppercase text-gray-500">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Expense Presets
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage finance expense rules
              used by future EMI
              calculations.
            </p>
          </div>

          {isMaster && (
            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              + Add Expense Preset
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading expense presets...
            </div>
          ) : sortedPresets.length ===
            0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                No expense presets
                found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add an expense preset to
                begin configuring
                Finance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Name
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Expense Type
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Calculation
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Rule
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    {isMaster && (
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {sortedPresets.map(
                    (preset) => (
                      <tr
                        key={preset.id}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {preset.name}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {
                            preset.expense_type
                          }
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {getCalculationLabel(
                            preset.calculation_type,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          AED{" "}
                          {Number(
                            preset.amount ||
                              0,
                          ).toFixed(
                            2,
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {preset.calculation_type ===
                          "percentage_minimum" ? (
                            <span>
                              {
                                preset.percentage
                              }
                              % with
                              minimum AED{" "}
                              {Number(
                                preset.minimum_amount ||
                                  0,
                              ).toFixed(
                                2,
                              )}
                            </span>
                          ) : preset.calculation_type ===
                            "conditional" ? (
                            <span>
                              {
                                preset.condition_key
                              }{" "}
                              ={" "}
                              {
                                preset.condition_value
                              }
                            </span>
                          ) : (
                            "Fixed value"
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {preset.is_active ? (
                            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                              Inactive
                            </span>
                          )}
                        </td>

                        {isMaster && (
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    preset,
                                  )
                                }
                                className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleActive(
                                    preset,
                                  )
                                }
                                className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-100"
                              >
                                {preset.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    preset,
                                  )
                                }
                                className="rounded-md border border-red-200 px-3 py-1.5 font-medium text-red-700 transition hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPreset
                  ? "Edit Expense Preset"
                  : "Add Expense Preset"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Configure how this expense
                is represented in Finance
                Master settings.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label
                    htmlFor="expense-name"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>

                  <input
                    id="expense-name"
                    name="name"
                    type="text"
                    maxLength={150}
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. RTA Passing"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                      fieldErrors.name
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {getFieldError(
                        fieldErrors.name,
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="expense-type"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Expense Type
                  </label>

                  <input
                    id="expense-type"
                    name="expense_type"
                    type="text"
                    maxLength={80}
                    value={
                      form.expense_type
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. rta, evaluation, roadside_assistance"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                      fieldErrors.expense_type
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.expense_type && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {getFieldError(
                        fieldErrors.expense_type,
                      )}
                    </p>
                  )}
                </div>

                {fieldErrors.non_field_errors && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium text-red-700">
                      {getFieldError(
                        fieldErrors.non_field_errors,
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="calculation-type"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Calculation Type
                  </label>

                  <select
                    id="calculation-type"
                    name="calculation_type"
                    value={
                      form.calculation_type
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300"
                  >
                    {CALCULATION_TYPES.map(
                      (type) => (
                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {type.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="expense-amount"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Amount (AED)
                  </label>

                  <input
                    id="expense-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={
                      handleChange
                    }
                    placeholder="0.00"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                      fieldErrors.amount
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.amount && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {getFieldError(
                        fieldErrors.amount,
                      )}
                    </p>
                  )}
                </div>

                {form.calculation_type ===
                  "percentage_minimum" && (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="expense-percentage"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Percentage (%)
                      </label>

                      <input
                        id="expense-percentage"
                        name="percentage"
                        type="number"
                        min="0"
                        step="0.0001"
                        inputMode="decimal"
                        value={
                          form.percentage
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="1.2500"
                        className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                          fieldErrors.percentage
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                      />

                      {fieldErrors.percentage && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {getFieldError(
                            fieldErrors.percentage,
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="expense-minimum"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Minimum Amount
                        (AED)
                      </label>

                      <input
                        id="expense-minimum"
                        name="minimum_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={
                          form.minimum_amount
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="540.00"
                        className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                          fieldErrors.minimum_amount
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                      />

                      {fieldErrors.minimum_amount && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {getFieldError(
                            fieldErrors.minimum_amount,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {form.calculation_type ===
                  "conditional" && (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="condition-key"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Condition Key
                      </label>

                     <select
    id="condition-key"
    name="condition_key"
    value={form.condition_key}
    onChange={handleChange}
    className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
        fieldErrors.condition_key
            ? "border-red-400"
            : "border-gray-300"
    }`}
>
    <option value="">Select Expense Type</option>

    {conditionOptions.map((option) => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ))}
</select>

                      {fieldErrors.condition_key && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {getFieldError(
                            fieldErrors.condition_key,
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="condition-value"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Condition Value
                      </label>

                      <select
                        id="condition-value"
                        name="condition_value"
                        value={form.condition_value}
                        onChange={handleChange}
                        className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                          fieldErrors.condition_value
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select value</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>

                      {fieldErrors.condition_value && (
                        <p className="mt-1.5 text-xs text-red-600">
                          {getFieldError(
                            fieldErrors.condition_value,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={
                      form.is_active
                    }
                    onChange={
                      handleChange
                    }
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />

                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Active
                    </span>

                    <span className="mt-1 block text-xs text-gray-500">
                      Active presets can
                      be used by future
                      Finance
                      calculations.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingPreset
                      ? "Save Changes"
                      : "Create Expense Preset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensePresetManagement;