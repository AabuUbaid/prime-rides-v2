import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";

import { getCashDeal, updateCashDeal } from "../../api/cashDeals";

function formatStatus(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseCashDealResponse(response) {
  const body = response?.data ?? response;

  return body?.data ?? body;
}

function CashDealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cashDeal, setCashDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [advanceAmount, setAdvanceAmount] = useState("");

  const [remark, setRemark] = useState("");

  const { user } = useAuth();
  const isMaster = user?.role === "MASTER";

  if (!isMaster) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/dashboard"
            className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-lg font-semibold text-rose-800">
              Access Denied
            </h1>
            <p className="mt-2 text-sm text-rose-700">
              You do not have permission to access Cash Deals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function loadCashDeal() {
    try {
      setLoading(true);
      setError("");

      const response = await getCashDeal(id);

      const data = parseCashDealResponse(response);
      setCashDeal(data);

      setAdvanceAmount(data?.advance_amount ?? "");

      setRemark(data?.remark ?? "");
    } catch (err) {
      console.error("Failed to load cash deal:", err);

      setError(err?.message || "Failed to load cash deal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCashDeal();
  }, [id]);

  async function handleSave(event) {
    event.preventDefault();

    try {
      setSaving(true);

      const previousAdvance = Number(cashDeal?.advance_amount || 0);
      const newAdvance = Number(advanceAmount || 0);

      await updateCashDeal(id, {
        advance_amount: advanceAmount,
        remark,
      });

      toast.success("Cash Deal updated successfully.");

      const advancePaidNow = newAdvance - previousAdvance;

      if (advancePaidNow > 0) {
        const customerId = cashDeal?.customer;
        const quoteId = cashDeal?.quote;

        if (customerId && quoteId) {
          navigate(
            `/finance/cash-receipts/new?customer_id=${encodeURIComponent(
              customerId,
            )}&quote_id=${encodeURIComponent(
              quoteId,
            )}&amount=${encodeURIComponent(
              advancePaidNow,
            )}&direction=customer_payment&category=advance&payment_method=cash`,
          );
          return;
        }
      }

      await loadCashDeal();
    } catch (err) {
      toast.error(err?.message || "Failed to update Cash Deal.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] p-4 sm:p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-pulse rounded-full bg-amber-400" />
            <p className="text-sm font-medium text-slate-500">
              Loading cash deal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cashDeal) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1500px]">
          <Link
            to="/finance/cash-deals"
            className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700"
          >
            ← Back to Cash Deals
          </Link>

          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {error || "Cash Deal not found."}
          </div>
        </div>
      </div>
    );
  }

  const vehicleName = [
    cashDeal.vehicle_make,
    cashDeal.vehicle_model,
    cashDeal.vehicle_variant,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* <Link
              to="/finance/cash-deals"
              className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700"
            >
              ← Back to Cash Deals
            </Link> */}

            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-600">
              Finance · Cash Deal
            </p>

            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
              Cash Deal #{cashDeal.id}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {cashDeal.customer_name || "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/finance/cash-deals")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-slate-800">
              Customer
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Name
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.customer_name || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Mobile
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.customer_mobile || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Agent
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.agent_name || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Quote
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.quote ?? "-"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-slate-800">
              Vehicle Snapshot
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Vehicle
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {vehicleName || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Stock ID
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.vehicle_stock_id || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Year
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.vehicle_year ?? "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Colour
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.vehicle_colour || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Mileage
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.vehicle_mileage ?? "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Chassis
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.vehicle_chassis_number || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Engine
                </dt>

                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {cashDeal.vehicle_engine_number || "-"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-slate-800">
              Status
            </h2>

            <p
              className={[
                "inline-flex items-center rounded-full border px-3 py-1.5",
                "text-[10px] font-bold uppercase tracking-wide",
                cashDeal.status === "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : cashDeal.status === "cancelled"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : cashDeal.status === "ready_for_delivery"
                      ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                      : cashDeal.status === "payment_pending"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : cashDeal.status === "advance_received"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              {formatStatus(cashDeal.status)}
            </p>
          </section>

          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-slate-800">
              Selling Price
            </h2>

            <p className="text-xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(cashDeal.selling_price)}
            </p>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Evaluation
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              {formatCurrency(cashDeal.evaluation)}
            </p>
          </section>

          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-slate-800">
              Balance
            </h2>

            <p className="text-xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(cashDeal.balance_amount)}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Balance is supplied by the backend.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.06em] text-slate-800">
            Update Cash Deal
          </h2>

          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="advance-amount"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Advance Amount
              </label>

              <input
                id="advance-amount"
                type="number"
                min="0"
                step="0.01"
                value={advanceAmount}
                onChange={(event) => setAdvanceAmount(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </div>

            <div>
              <label
                htmlFor="cash-deal-remark"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Remark
              </label>

              <textarea
                id="cash-deal-remark"
                rows={4}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-500 bg-amber-500 px-5 text-sm font-bold text-slate-950 transition-colors hover:border-amber-400 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default CashDealDetail;
