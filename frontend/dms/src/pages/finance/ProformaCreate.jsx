import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { getInsurance } from "../../api/insurance";
import { getBankLoan } from "../../api/bankLoans";
import { createProforma } from "../../api/proforma";

import { getApiErrorMessage } from "../../utils/errorMessage";

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 sm:text-right">
        {value ?? "-"}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="px-5 py-1">{children}</div>
    </section>
  );
}

export default function ProformaCreate() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const navigate = useNavigate();

  const insuranceId = searchParams.get("insurance");

  const [insurance, setInsurance] = useState(null);
  const [vat, setVat] = useState("0.00");
  const [bankFinancedBy, setBankFinancedBy] = useState("");
  const [lpo, setLpo] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInsurance() {
      if (!insuranceId) {
        setError("Insurance record is required.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getInsurance(insuranceId);
        const data = response?.data ?? response;

        if (!cancelled) {
          setInsurance(data || null);

          if (data?.application_status !== "approved") {
            setError(
              "Proforma can only be created after Insurance is approved.",
            );
            return;
          }

          if (data?.payment_method === "Finance") {
            setBankFinancedBy(data?.bank_financed_by ?? "");

            if (data?.bank_loan) {
              try {
                const loanResponse = await getBankLoan(data.bank_loan);

                const bankLoan = loanResponse?.data ?? loanResponse;

                setLpo(bankLoan?.bank_reference ?? "");
              } catch (loanError) {
                console.error("Failed to load Bank Loan:", loanError);

                setError(
                  loanError?.message || "Unable to load approved Bank Loan.",
                );
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setInsurance(null);
          setError(err?.message || "Unable to load Insurance.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInsurance();

    return () => {
      cancelled = true;
    };
  }, [insuranceId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!insurance?.id) {
      return;
    }

    try {
      setSaving(true);

      const response = await createProforma({
        insurance: insurance.id,
        vat: vat || "0.00",
        ...(insurance.payment_method === "Finance"
          ? {
              bank_financed_by: bankFinancedBy,
              lpo,
            }
          : {}),
      });

      const data = response?.data ?? response;

      toast.success("Proforma created successfully.");

      if (returnTo?.startsWith("/progression/")) {
        navigate(returnTo, {
          replace: true,
        });
      } else if (data?.id) {
        navigate(`/finance/proformas/${data.id}`);
      } else {
        navigate("/finance/proformas");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to create Proforma."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center text-sm text-slate-500 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          Loading Insurance...
        </div>
      </div>
    );
  }

  if (error || !insurance) {
    return (
      <div className="p-6">
        <Link
          to="/finance/insurance"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Insurance
        </Link>

        <div className="mx-auto mt-4 w-full max-w-[1600px] rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error || "Insurance record not found."}
        </div>
      </div>
    );
  }

  const vehicleName = [
    insurance.vehicle_make,
    insurance.vehicle_model,
    insurance.vehicle_year,
    insurance.vehicle_colour,
  ]
    .filter(Boolean)
    .join(" ");

  const isFinance = insurance.payment_method === "Finance";

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-7">
        <Link
          to={`/finance/insurance/${insurance.id}`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Insurance
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Create Proforma Invoice
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create a Proforma from this approved Insurance record.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Customer & Vehicle">
          <DetailRow label="Customer" value={insurance.customer_name} />
          <DetailRow label="Mobile" value={insurance.customer_mobile} />
          <DetailRow label="Vehicle" value={vehicleName} />
          <DetailRow label="Chassis" value={insurance.vehicle_chassis_number} />
          <DetailRow label="Engine" value={insurance.vehicle_engine_number} />
          <DetailRow label="Mileage" value={insurance.vehicle_mileage} />
          <DetailRow label="Payment Method" value={insurance.payment_method} />
        </Section>

        <Section title="Proforma Options">
          <form onSubmit={handleSubmit} className="py-4">
            {isFinance && (
              <>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Bank / Financed By
                  </label>

                  <input
                    type="text"
                    value={bankFinancedBy}
                    onChange={(event) => setBankFinancedBy(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    LPO Number
                  </label>

                  <input
                    type="text"
                    value={lpo}
                    readOnly
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
                  />
                </div>
              </>
            )}

            <div className={isFinance ? "mt-4" : ""}>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">VAT</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={vat}
                onChange={(event) => setVat(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Proforma"}
              </button>

              <Link
                to={`/finance/insurance/${insurance.id}`}
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}
