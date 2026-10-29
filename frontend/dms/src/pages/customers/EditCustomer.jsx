import { useEffect, useState } from "react";
import { ArrowLeft, Save, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { getCustomer, updateCustomer } from "../../api/customers";
import { getApiErrorMessage } from "../../utils/errorMessage";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emiratesIdNumber, setEmiratesIdNumber] = useState("");

  const [email, setEmail] = useState("");
  const [customerType, setCustomerType] = useState("INDIVIDUAL");
  const [companyName, setCompanyName] = useState("");
  const [trn, setTrn] = useState("");
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState("");

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
          throw new Error(response?.message || "Unable to load customer.");
        }

        if (cancelled) {
          return;
        }

        setCustomerName(response.data.customer_name || "");

        setPhoneNumber(response.data.phone_number || "");
        setEmiratesIdNumber(response.data.emirates_id_number || "");
        setEmail(response.data.email || "");

        setCustomerType(response.data.customer_type || "INDIVIDUAL");

        setCompanyName(response.data.company_name || "");

        setTrn(response.data.trn || "");

        setTradeLicenseNumber(response.data.trade_license_number || "");
      } catch (error) {
        console.error("Failed to load customer:", error);

        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Unable to load customer."));
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

    if (!emiratesIdNumber.trim()) {
      toast.error("Emirates ID number is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await updateCustomer(id, {
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        emirates_id_number: emiratesIdNumber.trim(),
        email: email.trim(),
        customer_type: customerType,
        company_name: customerType === "COMPANY" ? companyName.trim() : "",
        trn: customerType === "COMPANY" ? trn.trim() : "",
        trade_license_number:
          customerType === "COMPANY" ? tradeLicenseNumber.trim() : "",
      });

      if (!response?.success || !response?.data) {
        throw new Error(response?.message || "Unable to update customer.");
      }

      toast.success(response.message || "Customer updated successfully.");

      navigate(`/customers/${id}`, {
        replace: true,
      });
    } catch (error) {
      console.error("Customer update failed:", error);

      /*
       * Keep backend validation details visible
       * when duplicate phone numbers or other
       * serializer validation occurs.
       */
      toast.error(getApiErrorMessage(error, "Unable to update customer."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] px-4 py-10">
        <div className="mx-auto flex min-h-64 max-w-3xl items-center justify-center">
          <div className="text-sm text-slate-500">Loading customer...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to={`/customers/${id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            aria-label="Back to customer"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <UserRound size={20} className="text-amber-600" />

              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
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
          className="rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
        >
          <div className="grid gap-5 p-6">
            <div>
              <label
                htmlFor="edit-customer-name"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Customer Name
              </label>

              <input
                id="edit-customer-name"
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                disabled={saving}
              />
            </div>

            <div>
              <label
                htmlFor="edit-customer-phone"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Phone Number
              </label>

              <input
                id="edit-customer-phone"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                disabled={saving}
              />
            </div>

            <div>
              <label
                htmlFor="edit-customer-emirates-id"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Emirates ID Number
              </label>

              <input
                id="edit-customer-emirates-id"
                type="text"
                value={emiratesIdNumber}
                onChange={(event) => setEmiratesIdNumber(event.target.value)}
                placeholder="Enter Emirates ID number"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                disabled={saving}
              />
            </div>

          </div>

          <div>
            <label
              htmlFor="edit-customer-email"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
            >
              Email
            </label>

            <input
              id="edit-customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="customer@example.com"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              disabled={saving}
            />
          </div>

          <div>
            <label
              htmlFor="edit-customer-type"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
            >
              Customer Type
            </label>

            <select
              id="edit-customer-type"
              value={customerType}
              onChange={(event) => setCustomerType(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              disabled={saving}
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>

          {customerType === "COMPANY" && (
            <>
              <div>
                <label
                  htmlFor="edit-company-name"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Company Name
                </label>

                <input
                  id="edit-company-name"
                  type="text"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Enter company name"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-trn"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  TRN
                </label>

                <input
                  id="edit-trn"
                  type="text"
                  value={trn}
                  onChange={(event) => setTrn(event.target.value)}
                  placeholder="Enter TRN"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-trade-license-number"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Trade License Number
                </label>

                <input
                  id="edit-trade-license-number"
                  type="text"
                  value={tradeLicenseNumber}
                  onChange={(event) =>
                    setTradeLicenseNumber(event.target.value)
                  }
                  placeholder="Enter trade license number"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                  disabled={saving}
                />
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <Link
              to={`/customers/${id}`}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
