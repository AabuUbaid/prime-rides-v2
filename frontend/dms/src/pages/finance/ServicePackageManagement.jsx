import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  createServicePackage,
  deleteServicePackage,
  getServicePackages,
  updateServicePackage,
} from "../../api/finance";
import { useAuth } from "../../context/AuthContext";

const INITIAL_FORM = {
  name: "",
  description: "",
  amount: "",
  is_default: false,
  is_active: true,
};

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

  if (
    errors &&
    typeof errors === "object" &&
    !Array.isArray(errors)
  ) {
    return errors;
  }

  return {};
}

function getApiMessage(error) {
  const errors = getApiErrors(error);

  if (errors.non_field_errors) {
    return getFieldError(errors.non_field_errors);
  }

  return (
    error?.cause?.message ||
    error?.message ||
    "Something went wrong."
  );
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

function ServicePackageManagement() {
  const { user } = useAuth();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isMaster = user?.role === "MASTER";

  async function loadPackages() {
    setLoading(true);

    try {
      const response = await getServicePackages();

      const data = getResponseData(response);

      setPackages(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Failed to load service packages:",
        error,
      );

      setPackages([]);
      toast.error(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadPackages();
}, []);

  const sortedPackages = useMemo(() => {
    return [...packages]
      .filter(
        (item) =>
          item &&
          typeof item === "object",
      )
      .sort((a, b) => {
        const defaultCompare =
          Number(Boolean(b.is_default)) -
          Number(Boolean(a.is_default));

        if (defaultCompare !== 0) {
          return defaultCompare;
        }

        return String(
          a.name || "",
        ).localeCompare(
          String(b.name || ""),
        );
      });
  }, [packages]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setEditingPackage(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(servicePackage) {
    setEditingPackage(servicePackage);

    setForm({
      name: servicePackage.name ?? "",
      description:
        servicePackage.description ?? "",
      amount: toNumberString(
        servicePackage.amount,
      ),
      is_default: Boolean(
        servicePackage.is_default,
      ),
      is_active: Boolean(
        servicePackage.is_active,
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

  function validateForm() {
    const errors = {};

    if (!form.name.trim()) {
      errors.name =
        "Service package name is required.";
    }

    if (form.name.trim().length > 150) {
      errors.name =
        "Service package name cannot exceed 150 characters.";
    }

    if (form.description.length > 255) {
      errors.description =
        "Description cannot exceed 255 characters.";
    }

    if (form.amount === "") {
      errors.amount =
        "Service package amount is required.";
    } else {
      const amount = Number(form.amount);

      if (!Number.isFinite(amount)) {
        errors.amount =
          "Amount must be a valid number.";
      } else if (amount < 0) {
        errors.amount =
          "Service package amount cannot be negative.";
      }
    }

    if (
      form.is_default &&
      !form.is_active
    ) {
      errors.is_default =
        "A default service package must be active.";
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      description:
        form.description.trim(),
      amount: form.amount,
      is_default: form.is_default,
      is_active: form.is_active,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isMaster) {
      toast.error(
        "You do not have permission to modify service packages.",
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

      if (editingPackage) {
        response =
          await updateServicePackage(
            editingPackage.id,
            payload,
          );
      } else {
        response =
          await createServicePackage(
            payload,
          );
      }

      const savedPackage =
        getResponseData(response);

      if (
        !savedPackage ||
        typeof savedPackage !==
          "object"
      ) {
        throw new Error(
          "The server returned an invalid service package response.",
        );
      }

      await loadPackages();

      toast.success(
        response?.message ||
          (editingPackage
            ? "Service package updated successfully."
            : "Service package created successfully."),
      );

      closeModal();
    } catch (error) {
      console.error(
        editingPackage
          ? "Failed to update service package:"
          : "Failed to create service package:",
        error,
      );

      const errors =
        getApiErrors(error);

      if (
        Object.keys(errors).length > 0
      ) {
        setFieldErrors(errors);
      }

      toast.error(
        getApiMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(
    servicePackage,
  ) {
    if (!isMaster) {
      toast.error(
        "You do not have permission to modify service packages.",
      );

      return;
    }

    if (
      servicePackage.is_default &&
      servicePackage.is_active
    ) {
      toast.error(
        "The default service package cannot be deactivated. Set another package as default first.",
      );

      return;
    }

    try {
      await updateServicePackage(
        servicePackage.id,
        {
          is_active:
            !servicePackage.is_active,
        },
      );

      await loadPackages();

      toast.success(
        `Service package ${
          servicePackage.is_active
            ? "deactivated"
            : "activated"
        } successfully.`,
      );
    } catch (error) {
      console.error(
        "Failed to update service package status:",
        error,
      );

      toast.error(
        getApiMessage(error),
      );
    }
  }

  async function handleDelete(
    servicePackage,
  ) {
    if (!isMaster) {
      toast.error(
        "You do not have permission to delete service packages.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${servicePackage.name}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteServicePackage(
        servicePackage.id,
      );

      await loadPackages();

      toast.success(
        "Service package deleted successfully.",
      );
    } catch (error) {
      console.error(
        "Failed to delete service package:",
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
              Service Packages
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage service package pricing and the
              default package used by Finance.
            </p>
          </div>

          {isMaster && (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              + Add Service Package
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading service packages...
            </div>
          ) : sortedPackages.length ===
            0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                No service packages found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add a service package to begin
                configuring Finance.
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
                      Description
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Default
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
                  {sortedPackages.map(
                    (servicePackage) => (
                      <tr
                        key={
                          servicePackage.id
                        }
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {
                            servicePackage.name
                          }
                        </td>

                        <td className="max-w-xs px-6 py-4 text-sm text-gray-600">
                          <span
                            className="block truncate"
                            title={
                              servicePackage.description ||
                              ""
                            }
                          >
                            {
                              servicePackage.description ||
                              "-"
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(
                            servicePackage.amount,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {servicePackage.is_default ? (
                            <span className="inline-flex rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
                              Default
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              No
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {servicePackage.is_active ? (
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
                                    servicePackage,
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
                                    servicePackage,
                                  )
                                }
                                disabled={
                                  servicePackage.is_default &&
                                  servicePackage.is_active
                                }
                                title={
                                  servicePackage.is_default &&
                                  servicePackage.is_active
                                    ? "Set another package as default before deactivating this package."
                                    : ""
                                }
                                className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {servicePackage.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    servicePackage,
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
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPackage
                  ? "Edit Service Package"
                  : "Add Service Package"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Configure the package available to
                Finance operations.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className="space-y-5 px-6 py-6">
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
                    htmlFor="service-package-name"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>

                  <input
                    id="service-package-name"
                    name="name"
                    type="text"
                    maxLength={150}
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Premium Service Package"
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
                    htmlFor="service-package-description"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="service-package-description"
                    name="description"
                    rows={3}
                    maxLength={255}
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional description"
                    className={`w-full resize-none rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-300 ${
                      fieldErrors.description
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  <p className="mt-1.5 text-xs text-gray-500">
                    {form.description.length}/255
                    characters
                  </p>

                  {fieldErrors.description && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {getFieldError(
                        fieldErrors.description,
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="service-package-amount"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Amount (AED)
                  </label>

                  <input
                    id="service-package-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={
                      form.amount
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2800.00"
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

                <label className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
                  <input
                    name="is_default"
                    type="checkbox"
                    checked={
                      form.is_default
                    }
                    onChange={
                      handleChange
                    }
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />

                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      Default package
                    </span>

                    <span className="mt-1 block text-xs text-gray-500">
                      This is the package the Finance
                      backend can resolve when the
                      Service Package option is selected.
                    </span>
                  </span>
                </label>

                {fieldErrors.is_default && (
                  <p className="-mt-3 text-xs text-red-600">
                    {getFieldError(
                      fieldErrors.is_default,
                    )}
                  </p>
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
                      Active packages are available
                      for Finance configuration and
                      future calculations.
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
                    : editingPackage
                      ? "Save Changes"
                      : "Create Service Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServicePackageManagement;