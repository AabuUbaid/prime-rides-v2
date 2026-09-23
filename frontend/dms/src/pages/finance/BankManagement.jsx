import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { createBank, getBanks, updateBank } from "../../api/finance";
import { useAuth } from "../../context/AuthContext";

const INITIAL_FORM = {
  name: "",
  interest_rate: "",
  is_cash: false,
  is_active: true,
};

function BankManagement() {
  const { user } = useAuth();

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const isMaster = user?.role === "MASTER";

  async function loadBanks() {
    setLoading(true);

    try {
      const response = await getBanks();

      setBanks(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load banks:", error);

      toast.error(error?.message || "Failed to load banks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanks();
  }, []);

  function openCreateModal() {
    setEditingBank(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(bank) {
    setEditingBank(bank);

    setForm({
      name: bank.name ?? "",
      interest_rate:
        bank.interest_rate !== null && bank.interest_rate !== undefined
          ? String(bank.interest_rate)
          : "",
      is_cash: Boolean(bank.is_cash),
      is_active: Boolean(bank.is_active),
    });

    setFieldErrors({});
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setEditingBank(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => {
      if (name === "is_cash") {
        return {
          ...current,
          is_cash: checked,
          interest_rate: checked
            ? "0.00"
            : current.interest_rate === "0.00"
              ? ""
              : current.interest_rate,
        };
      }

      return {
        ...current,
        [name]: type === "checkbox" ? checked : value,
      };
    });

    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function validateForm() {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Bank name is required.";
    }

    if (!form.is_cash) {
      if (form.interest_rate === "") {
        errors.interest_rate = "Interest rate is required.";
      } else if (Number(form.interest_rate) < 0) {
        errors.interest_rate = "Interest rate cannot be negative.";
      }
    }

    if (
      form.is_cash &&
      form.interest_rate !== "" &&
      Number(form.interest_rate) !== 0
    ) {
      errors.interest_rate = "Cash banks must have 0% interest.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function extractFieldErrors(error) {
    const message = error?.message || "";

    try {
      const parsed = JSON.parse(message);

      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.errors &&
        typeof parsed.errors === "object"
      ) {
        return parsed.errors;
      }
    } catch {
      // The API client may expose the backend message directly.
    }

    return {};
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isMaster) {
      toast.error("You do not have permission to modify banks.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      interest_rate: form.is_cash ? "0.00" : form.interest_rate,
      is_cash: form.is_cash,
      is_active: form.is_active,
    };

    setSaving(true);
    setFieldErrors({});

    try {
      let response;

      if (editingBank) {
        response = await updateBank(editingBank.id, payload);
      } else {
        response = await createBank(payload);
      }

      const updatedBank = response?.data;

      if (editingBank) {
        setBanks((current) =>
          current.map((bank) =>
            bank.id === editingBank.id ? updatedBank : bank,
          ),
        );

        toast.success(response?.message || "Bank updated successfully.");
      } else {
        setBanks((current) => [...current, updatedBank]);

        toast.success(response?.message || "Bank created successfully.");
      }

      closeModal();
    } catch (error) {
      console.error(
        editingBank ? "Failed to update bank:" : "Failed to create bank:",
        error,
      );

      const errors = extractFieldErrors(error);

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }

      toast.error(
        error?.message ||
          (editingBank ? "Failed to update bank." : "Failed to create bank."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(bank) {
    if (!isMaster) {
      toast.error("You do not have permission to modify banks.");
      return;
    }

    try {
      const response = await updateBank(bank.id, {
        is_active: !bank.is_active,
      });

      const updatedBank = response?.data;

      setBanks((current) =>
        current.map((currentBank) =>
          currentBank.id === bank.id ? updatedBank : currentBank,
        ),
      );

      toast.success(
        response?.message ||
          `Bank ${
            updatedBank?.is_active ? "activated" : "deactivated"
          } successfully.`,
      );
    } catch (error) {
      console.error("Failed to update bank status:", error);

      toast.error(error?.message || "Failed to update bank status.");
    }
  }

  function formatInterestRate(rate) {
    if (rate === null || rate === undefined || rate === "") {
      return "-";
    }

    return `${Number(rate).toFixed(2)}%`;
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Main */}
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Heading */}
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
              Banks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage finance banks, interest rates, cash banks, and active
              status.
            </p>
          </div>

          {isMaster && (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add Bank
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading banks...
            </div>
          ) : banks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-600">
                No banks found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add a bank to begin configuring Finance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Bank Name
                    </th>

                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Interest Rate
                    </th>

                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Cash
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
                  {banks.map((bank) => (
                    <tr key={bank.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">
                        {bank.name}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatInterestRate(bank.interest_rate)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {bank.is_cash ? (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            No
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {bank.is_active ? (
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
                              onClick={() => openEditModal(bank)}
                              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-gray-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(bank)}
                              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-gray-100"
                            >
                              {bank.is_active ? "Deactivate" : "Activate"}
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingBank ? "Edit Bank" : "Add Bank"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Configure the bank information used by Finance.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="bank-name"
                    className="mb-1.5 block text-sm font-medium text-slate-600"
                  >
                    Bank Name
                  </label>

                  <input
                    id="bank-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={150}
                    placeholder="Enter bank name"
                    className={`w-full h-10 rounded-xl border px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 ${
                      fieldErrors.name ? "border-red-400" : "border-gray-300"
                    }`}
                  />

                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {Array.isArray(fieldErrors.name)
                        ? fieldErrors.name.join(" ")
                        : fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Interest */}
                <div>
                  <label
                    htmlFor="bank-interest-rate"
                    className="mb-1.5 block text-sm font-medium text-slate-600"
                  >
                    Interest Rate (%)
                  </label>

                  <input
                    id="bank-interest-rate"
                    name="interest_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.interest_rate}
                    onChange={handleChange}
                    disabled={form.is_cash}
                    placeholder="e.g. 3.50"
                    className={`w-full h-10 rounded-xl border px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 disabled:bg-slate-50 disabled:text-slate-400 disabled:text-gray-500 ${
                      fieldErrors.interest_rate
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />

                  {form.is_cash && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Cash banks must use 0% interest.
                    </p>
                  )}

                  {fieldErrors.interest_rate && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {Array.isArray(fieldErrors.interest_rate)
                        ? fieldErrors.interest_rate.join(" ")
                        : fieldErrors.interest_rate}
                    </p>
                  )}
                </div>

                {/* Cash */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:bg-slate-50">
                  <input
                    name="is_cash"
                    type="checkbox"
                    checked={form.is_cash}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-amber-500"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Cash Bank
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      Mark this bank as a cash financing option.
                    </span>
                  </span>
                </label>

                {/* Active */}
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
                      Active banks are available for Finance operations.
                    </span>
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                    : editingBank
                      ? "Save Changes"
                      : "Create Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankManagement;
