import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { getInsurance } from "../../api/insurance";
import { createDeliveryNote } from "../../api/deliveryNotes";

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 sm:text-right">
        {value ?? "-"}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="px-5 py-1">{children}</div>
    </section>
  );
}

export default function DeliveryNoteCreate() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const navigate = useNavigate();

  const insuranceId = searchParams.get("insurance");

  const [insurance, setInsurance] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [buyerName, setBuyerName] = useState("");

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
              "Delivery Note can only be created after Insurance is approved.",
            );
          }

          setDeliveryDate(new Date().toISOString().slice(0, 10));
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

      const response = await createDeliveryNote({
        insurance: insurance.id,
        delivery_date: deliveryDate || undefined,
        buyer_name: buyerName,
      });

      const data = response?.data ?? response;

      toast.success("Delivery Note created successfully.");

      if (returnTo?.startsWith("/progression/")) {
        navigate(returnTo, {
          replace: true,
        });
      } else if (data?.id) {
        navigate(`/finance/delivery-notes/${data.id}`);
      } else {
        navigate("/finance/delivery-notes");
      }
    } catch (err) {
      toast.error(err?.message || "Unable to create Delivery Note.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
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
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Insurance
        </Link>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to={`/finance/insurance/${insurance.id}`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Insurance
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-gray-900">
          Create Delivery Note
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a Delivery Note from this approved Insurance record.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Customer & Vehicle">
          <DetailRow label="Customer" value={insurance.customer_name} />
          <DetailRow label="Vehicle" value={vehicleName} />
          <DetailRow label="Chassis" value={insurance.vehicle_chassis_number} />
          <DetailRow label="Engine" value={insurance.vehicle_engine_number} />
          <DetailRow label="Mileage" value={insurance.vehicle_mileage} />
        </Section>

        <Section title="Delivery Details">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Delivery Date
              </label>

              <input
                type="date"
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Buyer Name
              </label>

              <input
                type="text"
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Delivery Note"}
              </button>

              <Link
                to={`/finance/insurance/${insurance.id}`}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
