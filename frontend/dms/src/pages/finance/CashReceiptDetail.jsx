import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  getCashReceipt,
  updateCashReceipt,
  reverseCashReceipt,
} from "../../api/cashReceipts";

import {
  getCompanies,
  getCompanyDocuments,
  downloadCompanyDocument,
} from "../../api/company";

import { formatAED } from "../../utils/formatters";

import { getApiErrorMessage } from "../../utils/errorMessage";

import { printDocument } from "../../utils/print";
import CashReceiptPrintTemplate from "../../components/printing/templates/CashReceiptPrintTemplate";

function parseCashReceiptResponse(response) {
  const body = response?.data ?? response;

  return body?.data ?? body;
}

function formatDirection(value) {
  if (value === "customer_payment") {
    return "Customer Payment";
  }

  if (value === "company_on_behalf") {
    return "Company on Behalf";
  }

  return value || "-";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function numberToWords(number) {
  const value = Number(number || 0);

  if (!Number.isFinite(value)) {
    return "";
  }

  const integerPart = Math.floor(value);
  const decimalPart = Math.round((value - integerPart) * 100);

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertBelowThousand(value) {
    const parts = [];

    if (value >= 100) {
      parts.push(`${ones[Math.floor(value / 100)]} Hundred`);
      value %= 100;
    }

    if (value >= 20) {
      parts.push(tens[Math.floor(value / 10)]);
      value %= 10;

      if (value > 0) {
        parts[parts.length - 1] += `-${ones[value]}`;
      }
    } else if (value > 0) {
      parts.push(ones[value]);
    }

    return parts.join(" ");
  }

  function convertInteger(value) {
    if (value === 0) {
      return "Zero";
    }

    const parts = [];

    const millions = Math.floor(value / 1000000);

    if (millions > 0) {
      parts.push(`${convertBelowThousand(millions)} Million`);
      value %= 1000000;
    }

    const thousands = Math.floor(value / 1000);

    if (thousands > 0) {
      parts.push(`${convertBelowThousand(thousands)} Thousand`);
      value %= 1000;
    }

    if (value > 0) {
      parts.push(convertBelowThousand(value));
    }

    return parts.join(" ");
  }

  let result = `UAE Dirhams ${convertInteger(integerPart)}`;

  if (decimalPart > 0) {
    result += ` and ${convertInteger(decimalPart)} Fils`;
  }

  return `${result} Only`;
}

function CashReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");

  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [printAssets, setPrintAssets] = useState({
    sealStamp: null,
  });

  async function loadReceipt() {
    try {
      setLoading(true);
      setError("");

      const response = await getCashReceipt(id);
      const data = parseCashReceiptResponse(response);

      setReceipt(data);
      setDescription(data?.description ?? "");
      setReference(data?.reference ?? "");
    } catch (err) {
      console.error("Failed to load cash receipt:", err);

      setReceipt(null);

      setError(err?.message || "Failed to load cash receipt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReceipt();
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
        if (!cancelled) {
          console.error("Failed to load company information:", error);
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

  async function handleSave(event) {
    event.preventDefault();

    try {
      setSaving(true);

      const response = await updateCashReceipt(id, {
        description,
        reference,
      });

      const data = parseCashReceiptResponse(response);

      setReceipt(data);
      setDescription(data?.description ?? "");
      setReference(data?.reference ?? "");

      toast.success("Cash Receipt updated successfully.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update Cash Receipt."));
    } finally {
      setSaving(false);
    }
  }

  async function handleReverse() {
    if (!receipt) {
      return;
    }

    if (
      receipt.is_reversal ||
      (receipt.reversed_receipt_id !== null &&
        receipt.reversed_receipt_id !== undefined)
    ) {
      toast.error("This Cash Receipt cannot be reversed again.");
      return;
    }

    const confirmed = window.confirm(
      `Reverse ${receipt.receipt_number || "this Cash Receipt"}? This will create a new reversal transaction and will not delete the original receipt.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await reverseCashReceipt(id, {});

      const data = parseCashReceiptResponse(response);

      toast.success(response?.message || "Cash Receipt reversed successfully.");

      if (data?.id) {
        navigate(`/finance/cash-receipts/${data.id}`, { replace: true });
        return;
      }

      await loadReceipt();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to reverse Cash Receipt."));
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-pulse rounded-full bg-amber-400" />
          <p className="text-sm font-medium text-slate-500">
            Loading cash receipts...
          </p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/finance/cash-receipts"
            className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-amber-600"
          >
            ← Back to Cash Receipts
          </Link>

          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
            {error || "Cash Receipt not found."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-5 sm:px-6 lg:px-8">
      <div className="no-print mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/finance/cash-receipts"
              className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-amber-600"
            >
              ← Back to Cash Receipts
            </Link>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172033]">
              {receipt.receipt_number || `Cash Receipt #${receipt.id}`}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {receipt.customer_name || "-"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!receipt.is_reversal && !receipt.reversed_receipt_id && (
              <button
                type="button"
                onClick={handleReverse}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
              >
                Reverse
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                try {
                  if (companyLoading) {
                    toast.error("Company information is still loading.");
                    return;
                  }

                  if (!company) {
                    toast.error("Company information could not be loaded.");
                    return;
                  }

                  const response = await getCompanyDocuments();

                  const documents = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                      ? response
                      : [];

                  const sealStampDocument = documents.find(
                    (document) => document?.name === "Seal & Stamp",
                  );

                  let sealStampUrl = null;

                  if (sealStampDocument?.id) {
                    const sealStampBlob = await downloadCompanyDocument(
                      sealStampDocument.id,
                    );

                    if (sealStampBlob instanceof Blob) {
                      sealStampUrl = URL.createObjectURL(sealStampBlob);
                    }
                  }

                  const assets = {
                    sealStamp: sealStampUrl,
                  };

                  setPrintAssets(assets);

                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      printDocument({
                        customerName: receipt.customer_name,
                        documentNumber: receipt.receipt_number,
                        documentTitle: `${company?.legal_entity_name || "Company"} - Cash Receipt - ${receipt.receipt_number || receipt.id}`,
                      });
                    });
                  });
                } catch (err) {
                  console.error("Cash Receipt print failed:", err);

                  toast.error(
                    getApiErrorMessage(
                      err,
                      "Unable to prepare the Cash Receipt for printing.",
                    ),
                  );
                }
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1F2A6E] px-4 text-sm font-bold text-white transition hover:bg-[#17215A]"
            >
              Print
            </button>

            <button
              type="button"
              onClick={() => navigate("/finance/cash-receipts")}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        {receipt.is_reversal && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-bold text-rose-800">
              This receipt is a reversal transaction.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
            <h2 className="mb-5 text-[15px] font-bold text-[#172033]">
              Transaction
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Receipt Number
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {receipt.receipt_number || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Amount
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-emerald-600">
                  {formatAED(receipt.amount)}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Direction
                </dt>
                <dd className="mt-1">
                  <span
                    className={
                      receipt.direction === "customer_payment"
                        ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                        : "inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700"
                    }
                  >
                    {formatDirection(receipt.direction)}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Category
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.category || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Payment Method
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.payment_method || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Transaction Date
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {formatDate(receipt.transaction_date)}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Source
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.source || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Created By
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.created_by_name || "-"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
            <h2 className="mb-5 text-[15px] font-bold text-[#172033]">
              Customer / Deal
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Customer
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.customer_name || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Customer Mobile
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.customer_mobile || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Quote
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.quote_number || receipt.quote || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Vehicle Stock
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.vehicle_stock_id || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Vehicle
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {[receipt.vehicle_make, receipt.vehicle_model]
                    .filter(Boolean)
                    .join(" ") || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Chassis
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {receipt.vehicle_chassis_number || "-"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
          <h2 className="mb-5 text-[15px] font-bold text-[#172033]">
            Expense Context
          </h2>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Quote Expense
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {receipt.quote_expense ?? "-"}
              </dd>
            </div>

            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                EMI Expense
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {receipt.emi_expense ?? "-"}
              </dd>
            </div>

            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Reversed Receipt
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {receipt.reversed_receipt_id ?? "-"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
          <h2 className="mb-5 text-[15px] font-bold text-[#172033]">
            Update Description / Reference
          </h2>
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="cash-receipt-description"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Description
              </label>

              <textarea
                id="cash-receipt-description"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div>
              <label
                htmlFor="cash-receipt-reference"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Reference
              </label>

              <input
                id="cash-receipt-reference"
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
          <h2 className="mb-5 text-[15px] font-bold text-[#172033]">
            Audit Information
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Created
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {formatDateTime(receipt.created_at)}
              </dd>
            </div>

            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Updated
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {formatDateTime(receipt.updated_at)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
      <CashReceiptPrintTemplate
        receipt={receipt}
        company={company}
        printAssets={printAssets}
      />
    </div>
  );
}

export default CashReceiptDetail;
