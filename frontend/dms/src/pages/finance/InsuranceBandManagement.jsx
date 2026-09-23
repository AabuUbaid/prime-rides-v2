import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  createInsuranceBand,
  deleteInsuranceBand,
  getInsuranceBands,
  updateInsuranceBand,
} from "../../api/finance";
import { useAuth } from "../../context/AuthContext";

const INITIAL_FORM = {
  name: "",
  minimum_vehicle_price: "",
  maximum_vehicle_price: "",
  amount: "",
  no_license_surcharge: "",
  is_active: true,
};

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

  return error?.cause?.message || error?.message || "Something went wrong.";
}

function getResponseData(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) {
    return response.data;
  }

  return response;
}

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return `AED ${numericValue.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function InsuranceBandManagement() {
  const { user } = useAuth();

  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBand, setEditingBand] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isMaster = user?.role === "MASTER";

  async function loadBands() {
    setLoading(true);

    try {
      const response = await getInsuranceBands();

      const data = getResponseData(response);

      setBands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load insurance bands:", error);

      setBands([]);
      toast.error(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBands();
  }, []);

  const sortedBands = useMemo(() => {
    return [...bands]
      .filter((band) => band && typeof band === "object")
      .sort(
        (a, b) =>
          Number(a.minimum_vehicle_price || 0) -
          Number(b.minimum_vehicle_price || 0),
      );
  }, [bands]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setEditingBand(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(band) {
    setEditingBand(band);

    setForm({
      name: band.name ?? "",
      minimum_vehicle_price: toNumberString(band.minimum_vehicle_price),
      maximum_vehicle_price: toNumberString(band.maximum_vehicle_price),
      amount: toNumberString(band.amount),
      no_license_surcharge: toNumberString(band.no_license_surcharge),
      is_active: Boolean(band.is_active),
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

  function validateForm() {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Band name is required.";
    }

    const minimum = Number(form.minimum_vehicle_price);

    const maximum = Number(form.maximum_vehicle_price);

    const amount = Number(form.amount);

    const noLicenseSurcharge = Number(form.no_license_surcharge);

    if (form.minimum_vehicle_price === "") {
      errors.minimum_vehicle_price = "Minimum vehicle price is required.";
    } else if (!Number.isFinite(minimum) || minimum < 0) {
      errors.minimum_vehicle_price =
        "Minimum vehicle price must be 0 or greater.";
    }

    if (form.maximum_vehicle_price === "") {
      errors.maximum_vehicle_price = "Maximum vehicle price is required.";
    } else if (!Number.isFinite(maximum) || maximum < 0) {
      errors.maximum_vehicle_price =
        "Maximum vehicle price must be 0 or greater.";
    } else if (Number.isFinite(minimum) && maximum <= minimum) {
      errors.maximum_vehicle_price =
        "Maximum vehicle price must be greater than minimum vehicle price.";
    }

    if (form.amount === "") {
      errors.amount = "Insurance amount is required.";
    } else if (!Number.isFinite(amount) || amount < 0) {
      errors.amount = "Insurance amount must be 0 or greater.";
    }

    if (form.no_license_surcharge === "") {
      errors.no_license_surcharge = "No driving licence surcharge is required.";
    } else if (!Number.isFinite(noLicenseSurcharge) || noLicenseSurcharge < 0) {
      errors.no_license_surcharge =
        "No driving licence surcharge must be 0 or greater.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      minimum_vehicle_price: form.minimum_vehicle_price,
      maximum_vehicle_price: form.maximum_vehicle_price,
      amount: form.amount,
      no_license_surcharge: form.no_license_surcharge,
      is_active: form.is_active,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isMaster) {
      toast.error("You do not have permission to modify insurance bands.");

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

      if (editingBand) {
        response = await updateInsuranceBand(editingBand.id, payload);
      } else {
        response = await createInsuranceBand(payload);
      }

      /*
       * Reload after every successful mutation.
       * The backend remains the source of truth.
       */
      await loadBands();

      toast.success(
        response?.message ||
          (editingBand
            ? "Insurance band updated successfully."
            : "Insurance band created successfully."),
      );

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(
        editingBand
          ? "Failed to update insurance band:"
          : "Failed to create insurance band:",
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

  async function handleToggleActive(band) {
    if (!isMaster) {
      toast.error("You do not have permission to modify insurance bands.");

      return;
    }

    try {
      await updateInsuranceBand(band.id, {
        is_active: !band.is_active,
      });

      await loadBands();

      toast.success(
        `Insurance band ${
          band.is_active ? "deactivated" : "activated"
        } successfully.`,
      );
    } catch (error) {
      console.error("Failed to update insurance band status:", error);

      const errors = getApiErrors(error);

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }

      toast.error(getApiMessage(error));
    }
  }

  async function handleDelete(band) {
    if (!isMaster) {
      toast.error("You do not have permission to delete insurance bands.");

      return;
    }

    const confirmed = window.confirm(
      `Delete "${band.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteInsuranceBand(band.id);

      await loadBands();

      toast.success("Insurance band deleted successfully.");
    } catch (error) {
      console.error("Failed to delete insurance band:", error);

      toast.error(getApiMessage(error));
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Main */}
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/finance/settings"
              className="text-sm font-medium text-gray-600 hover:text-slate-800"
            >
              ← Back to Finance Settings
            </Link>
            <div className="mt-4 mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-600">
                Managements
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Insurance Bands
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure vehicle-price ranges and insurance amounts used by
              Finance.
            </p>
          </div>

          {isMaster && (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add Insurance Band
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading insurance bands...
            </div>
          ) : sortedBands.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-600">
                No insurance bands found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add an insurance band to begin configuring Finance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Band Name
                    </th>

                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Minimum Price
                    </th>

                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Maximum Price
                    </th>

                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Insurance Amount
                    </th>

                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      No Licence Surcharge
                    </th>

                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Status
                    </th>

                    {isMaster && (
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sortedBands.map((band) => (
                    <tr key={band.id}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {band.name}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatCurrency(band.minimum_vehicle_price)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatCurrency(band.maximum_vehicle_price)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">
                        {formatCurrency(band.amount)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">
                        {formatCurrency(band.no_license_surcharge)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {band.is_active ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
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
                              onClick={() => openEditModal(band)}
                              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-gray-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(band)}
                              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-gray-100"
                            >
                              {band.is_active ? "Deactivate" : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(band)}
                              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingBand ? "Edit Insurance Band" : "Add Insurance Band"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Define the vehicle price range and insurance amount for this
                band.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-6">
                {fieldErrors.non_field_errors && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm font-medium text-red-700">
                      {getFieldError(fieldErrors.non_field_errors)}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="insurance-band-name"
                    className="mb-1.5 block text-sm font-medium text-slate-600"
                  >
                    Band Name
                  </label>

                  <input
                    id="insurance-band-name"
                    name="name"
                    type="text"
                    maxLength={150}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Insurance 0 - 50,000"
                    className={`w-full h-10 rounded-xl border px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 ${
                      fieldErrors.name ? "border-red-400" : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {getFieldError(fieldErrors.name)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="insurance-minimum"
                      className="mb-1.5 block text-sm font-medium text-slate-600"
                    >
                      Minimum Vehicle Price
                    </label>

                    <input
                      id="insurance-minimum"
                      name="minimum_vehicle_price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={form.minimum_vehicle_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full h-10 rounded-xl border px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 ${
                        fieldErrors.minimum_vehicle_price
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                    />

                    {fieldErrors.minimum_vehicle_price && (
                      <p className="mt-1.5 text-xs font-medium text-rose-600">
                        {getFieldError(fieldErrors.minimum_vehicle_price)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="insurance-maximum"
                      className="mb-1.5 block text-sm font-medium text-slate-600"
                    >
                      Maximum Vehicle Price
                    </label>

                    <input
                      id="insurance-maximum"
                      name="maximum_vehicle_price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={form.maximum_vehicle_price}
                      onChange={handleChange}
                      placeholder="50000.00"
                      className={`w-full h-10 rounded-xl border px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 ${
                        fieldErrors.maximum_vehicle_price
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                    />

                    {fieldErrors.maximum_vehicle_price && (
                      <p className="mt-1.5 text-xs font-medium text-rose-600">
                        {getFieldError(fieldErrors.maximum_vehicle_price)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="insurance-amount"
                    className="mb-1.5 block text-sm font-medium text-slate-600"
                  >
                    Insurance Amount (AED)
                  </label>

                  <input
                    id="insurance-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="1990.00"
                    className={`w-full h-10 rounded-xl border px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 ${
                      fieldErrors.amount ? "border-red-400" : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.amount && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {getFieldError(fieldErrors.amount)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="insurance-no-license-surcharge"
                    className="mb-1.5 block text-sm font-medium text-slate-600"
                  >
                    No Driving Licence Surcharge (AED)
                  </label>

                  <input
                    id="insurance-no-license-surcharge"
                    name="no_license_surcharge"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.no_license_surcharge}
                    onChange={handleChange}
                    placeholder="850.00"
                    className={`w-full h-10 rounded-xl border px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 ${
                      fieldErrors.no_license_surcharge
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Added to this insurance band when the customer does not have
                    a driving licence.
                  </p>

                  {fieldErrors.no_license_surcharge && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {getFieldError(fieldErrors.no_license_surcharge)}
                    </p>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:bg-slate-50">
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-amber-500"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Active
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      Active bands are eligible for future Finance calculations.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingBand
                      ? "Save Changes"
                      : "Create Insurance Band"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InsuranceBandManagement;
