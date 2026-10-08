import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { deleteEmi, getEmi } from "../../api/finance";
import {
  getCompanies,
  getCompanyDocuments,
  downloadCompanyDocument,
} from "../../api/company";
import { useAuth } from "../../context/AuthContext";

import { formatAED } from "../../utils/formatters";

import PrintDocument from "../../components/printing/PrintDocument";
import EmiPrintTemplate from "../../components/printing/templates/EmiPrintTemplate";

import { getApiErrorMessage } from "../../utils/errorMessage";

function getResponseData(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) {
    return response.data;
  }

  return response;
}

function formatPercentage(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return `${numericValue.toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function DetailItem({ label, value, valueClassName = "" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-semibold text-slate-800 ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold tracking-tight text-slate-900">
          {title}
        </h2>
      </div>
      <div className="p-5"> {children}</div>
    </section>
  );
}

function EmiDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [emi, setEmi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [printing, setPrinting] = useState(false);

  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  const [printAssets, setPrintAssets] = useState({
    logo: null,
    sealStamp: null,
  });

  const [includeSealStamp, setIncludeSealStamp] = useState(false);
  const [printAssetsLoading, setPrintAssetsLoading] = useState(false);

  const isMaster = user?.role === "MASTER";

  useEffect(() => {
    let isMounted = true;

    async function loadEmi() {
      try {
        setLoading(true);
        setError("");

        const response = await getEmi(id);
        const data = getResponseData(response);

        if (!isMounted) {
          return;
        }

        if (!data || typeof data !== "object") {
          throw new Error("EMI record was not returned by the server.");
        }

        setEmi(data);
      } catch (requestError) {
        console.error("Failed to load EMI details:", requestError);

        if (!isMounted) {
          return;
        }

        const message = getApiErrorMessage(
          requestError,
          "Failed to load EMI details.",
        );

        setError(message);
        setEmi(null);
        toast.error(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEmi();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      try {
        setCompanyLoading(true);

        const response = await getCompanies();
        const data = response?.data ?? response;

        if (!cancelled) {
          setCompany(data && typeof data === "object" ? data : null);
        }
      } catch (error) {
        console.error("Failed to load company information:", error);

        if (!cancelled) {
          setCompany(null);
        }
      } finally {
        if (!cancelled) {
          setCompanyLoading(false);
        }
      }
    }

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (printAssets.logo) {
        URL.revokeObjectURL(printAssets.logo);
      }

      if (printAssets.sealStamp) {
        URL.revokeObjectURL(printAssets.sealStamp);
      }
    };
  }, [printAssets.logo, printAssets.sealStamp]);

  async function handleDelete() {
    if (!isMaster || deleting) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${emi?.emi_number || "this EMI"}?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await deleteEmi(id);

      if (response && response.success === false) {
        throw new Error(response.message || "Failed to delete EMI.");
      }

      toast.success(response?.message || "EMI sheet deleted successfully.");

      navigate("/finance/emi/list");
    } catch (deleteError) {
      console.error("Failed to delete EMI:", deleteError);

      toast.error(getApiErrorMessage(deleteError, "Failed to delete EMI."));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

          <p className="text-sm font-medium text-slate-600">
            Loading EMI Details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !emi) {
    return (
      <div className="emi-detail-page min-h-screen bg-[#f5f6fa]">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prime Rides</h1>

              <p className="text-sm text-slate-500">Dealer Management System</p>
            </div>

            <Link
              to="/finance/emi/list"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to EMI Estimates
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-base font-semibold text-red-800">
              Unable to load EMI
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error || "The requested EMI record could not be found."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const vehicleDescription = [
    emi.vehicle_make,
    emi.vehicle_model,
    emi.vehicle_variant,
  ]
    .filter(Boolean)
    .join(" ");

  const expenses = Array.isArray(emi.expenses) ? emi.expenses : [];

  const statusLabel = String(emi.status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  async function loadEmiPrintAssets() {
    try {
      setPrintAssetsLoading(true);

      const response = await getCompanyDocuments();

      const documents = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      const logoDocument = documents.find(
        (document) => document?.name === "Logo",
      );

      const sealStampDocument = documents.find(
        (document) => document?.name === "Seal & Stamp",
      );

      let logoUrl = null;
      let sealStampUrl = null;

      if (logoDocument?.id) {
        const logoBlob = await downloadCompanyDocument(logoDocument.id);

        if (logoBlob instanceof Blob) {
          logoUrl = URL.createObjectURL(logoBlob);
        }
      }

      if (sealStampDocument?.id) {
        const sealStampBlob = await downloadCompanyDocument(
          sealStampDocument.id,
        );

        if (sealStampBlob instanceof Blob) {
          sealStampUrl = URL.createObjectURL(sealStampBlob);
        }
      }

      const assets = {
        logo: logoUrl,
        sealStamp: sealStampUrl,
      };

      setPrintAssets(assets);

      return assets;
    } finally {
      setPrintAssetsLoading(false);
    }
  }

  return (
    <div className="emi-detail-page bg-[#f5f6fa]">
      {/* =====================================================
                NORMAL SCREEN UI
                Hidden completely when printing.
               ===================================================== */}
      <div className="no-print-screen">
        <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Page heading */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                to="/finance/emi/list"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                ← Back to EMI List
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {displayValue(emi.emi_number)}
                </h2>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    emi.status === "active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : emi.status === "cancelled"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="no-print flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={includeSealStamp}
                  onChange={(event) =>
                    setIncludeSealStamp(event.target.checked)
                  }
                  disabled={printing || printAssetsLoading}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />

                <span>Add Company Seal &amp; Stamp</span>
              </label>

              <button
                type="button"
                onClick={async () => {
                  if (companyLoading) {
                    toast.error("Company information is still loading.");
                    return;
                  }

                  if (!company) {
                    toast.error("Company information could not be loaded.");
                    return;
                  }

                  try {
                    setPrinting(true);

                    const assets = await loadEmiPrintAssets();

                    if (!assets.logo) {
                      throw new Error(
                        "Company Logo is not configured. Please upload a Logo in Company Documents.",
                      );
                    }

                    if (includeSealStamp && !assets.sealStamp) {
                      throw new Error(
                        "Company Seal & Stamp is not configured. Please upload a Seal & Stamp document in Company Documents.",
                      );
                    }

                    setPrintAssets(assets);

                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        window.print();
                      });
                    });
                  } catch (error) {
                    console.error("EMI print failed:", error);

                    toast.error(
                      getApiErrorMessage(
                        error,
                        "Unable to prepare the EMI for printing.",
                      ),
                    );
                  } finally {
                    setPrinting(false);
                  }
                }}
                disabled={!emi || companyLoading || printAssetsLoading}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {printAssetsLoading ? "Preparing..." : "Print EMI"}
              </button>

              {isMaster && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete EMI"}
                </button>
              )}
            </div>
          </div>

          {/* Customer */}
          <SectionCard title="Customer">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem
                label="Customer Name"
                value={displayValue(emi.customer_name)}
              />

              <DetailItem
                label="Mobile"
                value={displayValue(emi.customer_mobile)}
              />
            </div>
          </SectionCard>

          {/* Vehicle */}
          <SectionCard title="Vehicle Snapshot">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Stock ID"
                value={displayValue(emi.vehicle_stock_id)}
              />

              <DetailItem label="Make" value={displayValue(emi.vehicle_make)} />

              <DetailItem
                label="Model"
                value={displayValue(emi.vehicle_model)}
              />

              <DetailItem
                label="Variant"
                value={displayValue(emi.vehicle_variant)}
              />

              <DetailItem label="Year" value={displayValue(emi.vehicle_year)} />

              <DetailItem
                label="Colour"
                value={displayValue(emi.vehicle_colour)}
              />

              <DetailItem
                label="Mileage"
                value={
                  emi.vehicle_mileage === null ||
                  emi.vehicle_mileage === undefined ||
                  emi.vehicle_mileage === ""
                    ? "-"
                    : `${Number(emi.vehicle_mileage).toLocaleString(
                        "en-AE",
                      )} km`
                }
              />

              <DetailItem
                label="Chassis Number"
                value={displayValue(emi.vehicle_chassis_number)}
              />

              <DetailItem
                label="Engine Number"
                value={displayValue(emi.vehicle_engine_number)}
              />
            </div>

            {vehicleDescription && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Vehicle
                </p>

                <p className="mt-1 text-base font-bold text-slate-900">
                  {vehicleDescription}
                </p>
              </div>
            )}
          </SectionCard>

          {/* Financing */}
          <SectionCard title="Financing">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Bank" value={displayValue(emi.bank_name)} />

              <DetailItem
                label="Interest Rate"
                value={formatPercentage(emi.interest_rate)}
              />

              <DetailItem
                label="Manual Rate Used"
                value={emi.manual_rate_used ? "Yes" : "No"}
              />

              <DetailItem
                label="Vehicle Price"
                value={formatAED(emi.vehicle_price)}
              />

              <DetailItem
                label="VAT"
                value={
                  emi.vat_enabled ? formatAED(emi.vat_amount) : "Not Applied"
                }
              />

              <DetailItem
                label="Price After VAT"
                value={formatAED(emi.price_after_vat)}
              />

              <DetailItem
                label="Down Payment"
                value={formatAED(emi.down_payment)}
              />

              <DetailItem
                label="Finance Amount"
                value={formatAED(emi.finance_amount)}
                valueClassName="text-base"
              />

              <DetailItem
                label="Tenure"
                value={
                  emi.tenure_years === null || emi.tenure_years === undefined
                    ? "-"
                    : `${emi.tenure_years} ${
                        Number(emi.tenure_years) === 1 ? "Year" : "Years"
                      }`
                }
              />
            </div>
          </SectionCard>

          {/* EMI Result */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                EMI Summary
              </h2>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Total Interest
                </p>

                <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                  {formatAED(emi.total_interest)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Total Payable
                </p>

                <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                  {formatAED(emi.total_payable)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Monthly EMI
                </p>

                <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                  {formatAED(emi.monthly_emi)}
                </p>
              </div>
            </div>
          </section>

          {/* Expenses */}
          <SectionCard title="Expenses">
            {expenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm text-slate-500">
                  No individual expenses were saved for this EMI.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] divide-y divide-slate-100">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Description
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {expenses.map((expense, index) => (
                      <tr
                        key={expense.id ?? `${expense.expense_type}-${index}`}
                      >
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {displayValue(expense.expense_type)}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {displayValue(expense.name)}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {displayValue(expense.description)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm font-bold text-slate-900">
                          {formatAED(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end border-t border-slate-100 pt-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">Other Expenses Total</p>

                <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {formatAED(emi.expense_total)}
                </p>
              </div>
            </div>
          </SectionCard>
        </main>
      </div>
      <PrintDocument
        documentType="EMI ESTIMATE"
        documentNumber={emi?.emi_number}
        date={formatDate(emi?.created_at)}
        status={statusLabel}
        company={company}
        showHeader={false}
        showFooter={false}
      >
        <EmiPrintTemplate
          emi={emi}
          company={company}
          printAssets={printAssets}
          includeSealStamp={includeSealStamp}
        />
      </PrintDocument>
    </div>
  );
}

export default EmiDetail;
