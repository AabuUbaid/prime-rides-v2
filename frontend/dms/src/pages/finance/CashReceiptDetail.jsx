import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  getCashReceipt,
  updateCashReceipt,
  reverseCashReceipt,
} from "../../api/cashReceipts";

import { formatAED } from "../../utils/formatters";

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

function CashReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");

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
      toast.error(err?.message || "Failed to update Cash Receipt.");
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
      toast.error(err?.message || "Failed to reverse Cash Receipt.");
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
      <div className="mx-auto max-w-6xl">
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
    </div>
  );
}

export default CashReceiptDetail;
