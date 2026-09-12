import { useState } from "react";
import { ArrowLeft, Save, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { createCustomer } from "../../api/customers";

export default function NewCustomer() {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await createCustomer({
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
      });

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message ||
            "Unable to create customer."
        );
      }

      toast.success(
        response.message ||
          "Customer created successfully."
      );

      navigate(
        `/customers/${response.data.id}`,
        { replace: true }
      );
    } catch (error) {
      console.error(
        "Customer creation failed:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to create customer."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/customers"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Back to customers"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <UserRound size={20} className="text-slate-700" />

              <h1 className="text-2xl font-semibold text-slate-900">
                New Customer
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Create a customer record.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="grid gap-5 p-6">
            <div>
              <label
                htmlFor="customer-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Customer Name
              </label>

              <input
                id="customer-name"
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                placeholder="Enter customer name"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                disabled={saving}
              />
            </div>

            <div>
              <label
                htmlFor="customer-phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone Number
              </label>

              <input
                id="customer-phone"
                type="tel"
                value={phoneNumber}
                onChange={(event) =>
                  setPhoneNumber(event.target.value)
                }
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Link
              to="/customers"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />

              {saving
                ? "Creating..."
                : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}