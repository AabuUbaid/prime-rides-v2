import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  UserRound,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import {
  getCustomer,
  updateCustomer,
} from "../../api/customers";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomer() {
      if (!id) {
        toast.error("Customer ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await getCustomer(id);

        if (!response?.success || !response?.data) {
          throw new Error(
            response?.message ||
              "Unable to load customer."
          );
        }

        if (cancelled) {
          return;
        }

        setCustomerName(
          response.data.customer_name || ""
        );

        setPhoneNumber(
          response.data.phone_number || ""
        );
      } catch (error) {
        console.error(
          "Failed to load customer:",
          error
        );

        if (!cancelled) {
          toast.error(
            error?.message ||
              "Unable to load customer."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCustomer();

    return () => {
      cancelled = true;
    };
  }, [id]);

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

      const response = await updateCustomer(id, {
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
      });

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message ||
            "Unable to update customer."
        );
      }

      toast.success(
        response.message ||
          "Customer updated successfully."
      );

      navigate(`/customers/${id}`, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Customer update failed:",
        error
      );

      /*
       * Keep backend validation details visible
       * when duplicate phone numbers or other
       * serializer validation occurs.
       */
      const backendErrors =
        error?.cause?.errors;

      if (Array.isArray(backendErrors)) {
        toast.error(backendErrors.join(" "));
      } else if (
        backendErrors &&
        typeof backendErrors === "object"
      ) {
        const messages = Object.values(
          backendErrors
        )
          .flat()
          .filter(Boolean);

        toast.error(
          messages.length
            ? messages.join(" ")
            : error?.message ||
                "Unable to update customer."
        );
      } else {
        toast.error(
          error?.message ||
            "Unable to update customer."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex min-h-64 max-w-3xl items-center justify-center">
          <div className="text-sm text-slate-500">
            Loading customer...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to={`/customers/${id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Back to customer"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <UserRound
                size={20}
                className="text-slate-700"
              />

              <h1 className="text-2xl font-semibold text-slate-900">
                Edit Customer
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Update customer information.
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
                htmlFor="edit-customer-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Customer Name
              </label>

              <input
                id="edit-customer-name"
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                disabled={saving}
              />
            </div>

            <div>
              <label
                htmlFor="edit-customer-phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone Number
              </label>

              <input
                id="edit-customer-phone"
                type="tel"
                value={phoneNumber}
                onChange={(event) =>
                  setPhoneNumber(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Link
              to={`/customers/${id}`}
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
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}