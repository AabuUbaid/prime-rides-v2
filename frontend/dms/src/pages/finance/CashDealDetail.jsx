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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-800">
              Access Denied
            </h1>
            <p className="mt-2 text-sm text-red-700">
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl rounded-lg border border-gray-200 bg-white p-6">
          Loading cash deal...
        </div>
      </div>
    );
  }

  if (error || !cashDeal) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/finance/cash-deals"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            ← Back to Cash Deals
          </Link>

          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              to="/finance/cash-deals"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              ← Back to Cash Deals
            </Link>

            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              Cash Deal #{cashDeal.id}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {cashDeal.customer_name || "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/finance/cash-deals")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Customer
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Name
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.customer_name || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Mobile
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.customer_mobile || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Agent
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.agent_name || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Quote
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.quote ?? "-"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Vehicle Snapshot
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Vehicle
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {vehicleName || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Stock ID
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.vehicle_stock_id || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Year
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.vehicle_year ?? "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Colour
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.vehicle_colour || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Mileage
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.vehicle_mileage ?? "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Chassis
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.vehicle_chassis_number || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Engine
                </dt>

                <dd className="mt-1 text-sm text-gray-900">
                  {cashDeal.vehicle_engine_number || "-"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status</h2>

            <p className="text-sm text-gray-700">
              {formatStatus(cashDeal.status)}
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Selling Price
            </h2>

            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(cashDeal.selling_price)}
            </p>

            <p className="mt-4 text-xs font-medium uppercase text-gray-500">
              Evaluation
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatCurrency(cashDeal.evaluation)}
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Balance
            </h2>

            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(cashDeal.balance_amount)}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Balance is supplied by the backend.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Update Cash Deal
          </h2>

          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="advance-amount"
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="cash-deal-remark"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Remark
              </label>

              <textarea
                id="cash-deal-remark"
                rows={4}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
