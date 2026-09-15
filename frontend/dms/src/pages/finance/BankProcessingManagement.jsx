import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  createBankProcessingConfiguration,
  deleteBankProcessingConfiguration,
  getBankProcessingConfigurations,
  getBanks,
  updateBankProcessingConfiguration,
} from "../../api/finance";
import { useAuth } from "../../context/AuthContext";

const INITIAL_FORM = {
  bank_id: "",
  percentage: "",
  minimum_amount: "",
  banker_application_charge: "",
  is_active: true,
};

function getResponseData(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) {
    return response.data;
  }

  return response;
}

function toNumberString(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
}

function getFieldError(value) {
  if (Array.isArray(value)) {
    return value.join(" ");
  }

  return value || "";
}

function getApiErrors(error) {
  const errors = error?.cause?.errors;

  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    return errors;
  }

  return {};
}

function getApiMessage(error) {
  const errors = getApiErrors(error);

  if (errors.non_field_errors) {
    return getFieldError(errors.non_field_errors);
  }

  if (Array.isArray(errors)) {
    return errors.join(" ");
  }

  return error?.cause?.message || error?.message || "Something went wrong.";
}

function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return `AED ${number.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return `${number.toFixed(2)}%`;
}

function getBankName(configuration, banks) {
  if (configuration?.bank_name) {
    return configuration.bank_name;
  }

  if (configuration?.bank && typeof configuration.bank === "object") {
    return configuration.bank.name || "-";
  }

  const bankId = configuration?.bank_id ?? configuration?.bank;

  const bank = banks.find((item) => String(item.id) === String(bankId));

  return bank?.name || "-";
}

function BankProcessingManagement() {
  const { user } = useAuth();

  const [configurations, setConfigurations] = useState([]);
  const [banks, setBanks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfiguration, setEditingConfiguration] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const isMaster = user?.role === "MASTER";

  async function loadData() {
    setLoading(true);

    try {
      const [configurationResponse, bankResponse] = await Promise.all([
        getBankProcessingConfigurations(),
        getBanks(),
      ]);

      const configurationData = getResponseData(configurationResponse);

      const bankData = getResponseData(bankResponse);

      setConfigurations(
        Array.isArray(configurationData) ? configurationData : [],
      );

      setBanks(Array.isArray(bankData) ? bankData : []);
    } catch (error) {
      console.error("Failed to load bank processing configuration:", error);

      setConfigurations([]);
      setBanks([]);

      toast.error(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const sortedConfigurations = useMemo(() => {
    return [...configurations]
      .filter(
        (configuration) => configuration && typeof configuration === "object",
      )
      .sort((a, b) =>
        getBankName(a, banks).localeCompare(getBankName(b, banks)),
      );
  }, [configurations, banks]);

  /*
   * Banks that already have a processing configuration
   * are excluded from the Create dropdown.
   *
   * While editing, the current bank remains available.
   */

  function resetForm() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setEditingConfiguration(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(configuration) {
    const currentBankId =
      configuration?.bank_id ??
      (typeof configuration?.bank === "object"
        ? configuration.bank.id
        : configuration?.bank);

    setEditingConfiguration(configuration);

    setForm({
      bank_id:
        currentBankId !== null && currentBankId !== undefined
          ? String(currentBankId)
          : "",
      percentage: toNumberString(configuration.percentage),
      minimum_amount: toNumberString(configuration.minimum_amount),
      banker_application_charge: toNumberString(
        configuration.banker_application_charge ??
          configuration.application_charge,
      ),
      is_active: Boolean(configuration.is_active),
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
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFieldErrors((current) => {
      if (!current[name] && !(name === "bank_id" && current.bank)) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[name];

      if (name === "bank_id") {
        delete next.bank;
      }

      return next;
    });
  }

  function validateForm() {
    const errors = {};

    if (!form.bank_id) {
      errors.bank_id = "Bank is required.";
    }

    if (form.percentage === "") {
      errors.percentage = "Processing percentage is required.";
    } else if (
      !Number.isFinite(Number(form.percentage)) ||
      Number(form.percentage) < 0
    ) {
      errors.percentage = "Processing percentage must be 0 or greater.";
    }

    if (form.minimum_amount === "") {
      errors.minimum_amount = "Minimum amount is required.";
    } else if (
      !Number.isFinite(Number(form.minimum_amount)) ||
      Number(form.minimum_amount) < 0
    ) {
      errors.minimum_amount = "Minimum amount must be 0 or greater.";
    }

    if (form.banker_application_charge === "") {
      errors.banker_application_charge =
        "Banker application charge is required.";
    } else if (
      !Number.isFinite(Number(form.banker_application_charge)) ||
      Number(form.banker_application_charge) < 0
    ) {
      errors.banker_application_charge =
        "Banker application charge must be 0 or greater.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function buildPayload() {
    return {
      bank: Number(form.bank_id),
      percentage: form.percentage,
      minimum_amount: form.minimum_amount,
      application_charge: form.banker_application_charge,
      is_active: form.is_active,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isMaster) {
      toast.error(
        "You do not have permission to modify bank processing configuration.",
      );

      return;
    }

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const payload = buildPayload();

      let response;

      if (editingConfiguration) {
        response = await updateBankProcessingConfiguration(
          editingConfiguration.id,
          payload,
        );
      } else {
        response = await createBankProcessingConfiguration(payload);
      }

      const savedConfiguration = getResponseData(response);

      if (!savedConfiguration || typeof savedConfiguration !== "object") {
        throw new Error(
          "The server returned an invalid bank processing configuration response.",
        );
      }

      await loadData();

      toast.success(
        response?.message ||
          (editingConfiguration
            ? "Bank processing configuration updated successfully."
            : "Bank processing configuration created successfully."),
      );

      closeModal();
    } catch (error) {
      console.error(
        editingConfiguration
          ? "Failed to update bank processing configuration:"
          : "Failed to create bank processing configuration:",
        error,
      );

      const errors = getApiErrors(error);

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }

      toast.error(getApiMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(configuration) {
    if (!isMaster) {
      toast.error(
        "You do not have permission to modify bank processing configuration.",
      );

      return;
    }

    try {
      await updateBankProcessingConfiguration(configuration.id, {
        is_active: !configuration.is_active,
      });

      await loadData();

      toast.success(
        `Bank processing configuration ${
          configuration.is_active ? "deactivated" : "activated"
        } successfully.`,
      );
    } catch (error) {
      console.error("Failed to update bank processing status:", error);

      toast.error(getApiMessage(error));
    }
  }

  async function handleDelete(configuration) {
    if (!isMaster) {
      toast.error(
        "You do not have permission to delete bank processing configuration.",
      );

      return;
    }

    const confirmed = window.confirm(
      `Delete the bank processing configuration for "${getBankName(
        configuration,
        banks,
      )}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBankProcessingConfiguration(configuration.id);

      await loadData();

      toast.success("Bank processing configuration deleted successfully.");
    } catch (error) {
      console.error("Failed to delete bank processing configuration:", error);

      toast.error(getApiMessage(error));
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

              <p className="text-xs uppercase text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Bank Processing
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Configure bank processing percentages, minimum amounts, and banker
              application charges.
            </p>
          </div>

          {isMaster && (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              + Add Bank Processing
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading bank processing configurations...
            </div>
          ) : sortedConfigurations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                No bank processing configurations found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add a configuration to begin configuring Finance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Bank
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Percentage
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Minimum Amount
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Banker Application Charge
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
                  {sortedConfigurations.map((configuration) => (
                    <tr key={configuration.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {getBankName(configuration, banks)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatPercentage(configuration.percentage)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatCurrency(configuration.minimum_amount)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(
                          configuration.banker_application_charge ??
                            configuration.application_charge,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {configuration.is_active ? (
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
                              onClick={() => openEditModal(configuration)}
                              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(configuration)}
                              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-100"
                            >
                              {configuration.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(configuration)}
                              className="rounded-md border border-red-200 px-3 py-1.5 font-medium text-red-700 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingConfiguration
                  ? "Edit Bank Processing"
                  : "Add Bank Processing"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Configure the processing settings for one bank.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-6">
                {fieldErrors.non_field_errors && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium text-red-700">
                      {getFieldError(fieldErrors.non_field_errors)}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="processing-bank"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Bank
                  </label>

                  <select
                    id="processing-bank"
                    name="bank_id"
                    value={form.bank_id}
                    onChange={handleChange}
                    disabled={Boolean(editingConfiguration)}
                    className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100 ${
                      fieldErrors.bank_id ? "border-red-400" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select a bank</option>

                    {banks
                      .filter((bank) => bank.is_active)
                      .map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                          {bank.is_cash ? " — Cash" : ""}
                        </option>
                      ))}
                  </select>

                  {(fieldErrors.bank_id || fieldErrors.bank) && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {getFieldError(fieldErrors.bank_id || fieldErrors.bank)}
                    </p>
                  )}

                  {editingConfiguration && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      The bank cannot be changed while editing an existing
                      configuration.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="processing-percentage"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Processing Percentage (%)
                  </label>

                  <input
                    id="processing-percentage"
                    name="percentage"
                    type="number"
                    min="0"
                    step="0.0001"
                    inputMode="decimal"
                    value={form.percentage}
                    onChange={handleChange}
                    placeholder="e.g. 1.25"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                      fieldErrors.percentage
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.percentage && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {getFieldError(fieldErrors.percentage)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="processing-minimum"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Minimum Amount (AED)
                  </label>

                  <input
                    id="processing-minimum"
                    name="minimum_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.minimum_amount}
                    onChange={handleChange}
                    placeholder="e.g. 500.00"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                      fieldErrors.minimum_amount
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.minimum_amount && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {getFieldError(fieldErrors.minimum_amount)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="processing-application-charge"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Banker Application Charge (AED)
                  </label>

                  <input
                    id="processing-application-charge"
                    name="banker_application_charge"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.banker_application_charge}
                    onChange={handleChange}
                    placeholder="e.g. 400.00"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                      fieldErrors.banker_application_charge
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.banker_application_charge && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {getFieldError(fieldErrors.banker_application_charge)}
                    </p>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />

                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Active
                    </span>

                    <span className="mt-1 block text-xs text-gray-500">
                      Active configuration can be used by Finance calculations.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
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
                    : editingConfiguration
                      ? "Save Changes"
                      : "Create Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankProcessingManagement;
