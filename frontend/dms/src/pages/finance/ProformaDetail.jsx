import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";
import {
  deleteProforma,
  getProforma,
  updateProforma,
} from "../../api/proforma";
import PrintButton from "../../components/printing/PrintButton";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

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

function InputField({ label, value, onChange, type = "text", min, step }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-600">{label}</label>

      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        min={min}
        step={step}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
      />
    </div>
  );
}

export default function ProformaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [proforma, setProforma] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleChassisNumber, setVehicleChassisNumber] = useState("");
  const [vehicleEngineNumber, setVehicleEngineNumber] = useState("");
  const [vehicleMileage, setVehicleMileage] = useState("");
  const [vehiclePrice, setVehiclePrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [bankFinancedBy, setBankFinancedBy] = useState("");
  const [lpo, setLpo] = useState("");
  const [vat, setVat] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [includeSealStamp, setIncludeSealStamp] = useState(false);
  const [error, setError] = useState("");

  async function loadProforma() {
    try {
      setLoading(true);
      setError("");

      const response = await getProforma(id);
      const data = response?.data ?? response;

      setProforma(data || null);

      setCustomerName(data?.customer_name ?? "");
      setCustomerMobile(data?.customer_mobile ?? "");
      setVehicleMake(data?.vehicle_make ?? "");
      setVehicleModel(data?.vehicle_model ?? "");
      setVehicleYear(data?.vehicle_year ?? "");
      setVehicleChassisNumber(data?.vehicle_chassis_number ?? "");
      setVehicleEngineNumber(data?.vehicle_engine_number ?? "");
      setVehicleMileage(data?.vehicle_mileage ?? "");
      setVehiclePrice(data?.vehicle_price ?? "");
      setDownPayment(data?.down_payment ?? "");
      setBankFinancedBy(data?.bank_financed_by ?? "");
      setLpo(data?.lpo ?? "");
      setVat(data?.vat ?? "");
    } catch (err) {
      setProforma(null);
      setError(err?.message || "Unable to load Proforma.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProforma();
  }, [id]);

  function cancelEditing() {
    setEditing(false);

    setCustomerName(proforma?.customer_name ?? "");
    setCustomerMobile(proforma?.customer_mobile ?? "");
    setVehicleMake(proforma?.vehicle_make ?? "");
    setVehicleModel(proforma?.vehicle_model ?? "");
    setVehicleYear(proforma?.vehicle_year ?? "");
    setVehicleChassisNumber(proforma?.vehicle_chassis_number ?? "");
    setVehicleEngineNumber(proforma?.vehicle_engine_number ?? "");
    setVehicleMileage(proforma?.vehicle_mileage ?? "");
    setVehiclePrice(proforma?.vehicle_price ?? "");
    setDownPayment(proforma?.down_payment ?? "");
    setBankFinancedBy(proforma?.bank_financed_by ?? "");
    setLpo(proforma?.lpo ?? "");
    setVat(proforma?.vat ?? "");
  }

  async function handleSave() {
    try {
      setSaving(true);

      const payload = {
        customer_name: customerName,
        customer_mobile: customerMobile,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear || null,
        vehicle_chassis_number: vehicleChassisNumber,
        vehicle_engine_number: vehicleEngineNumber,
        vehicle_mileage: vehicleMileage || null,
        vehicle_price: vehiclePrice,
        vat: vat || "0.00",
      };

      if (proforma.payment_type === "finance") {
        payload.bank_financed_by = bankFinancedBy;
        payload.lpo = lpo;
        payload.down_payment = downPayment;
      }

      const response = await updateProforma(id, payload);
      const data = response?.data ?? response;

      setProforma(data || proforma);
      setEditing(false);

      toast.success("Proforma updated successfully.");
      await loadProforma();
    } catch (err) {
      toast.error(err?.message || "Unable to update Proforma.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this Proforma?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await deleteProforma(id);

      toast.success("Proforma deleted successfully.");
      navigate("/finance/proformas");
    } catch (err) {
      toast.error(err?.message || "Unable to delete Proforma.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading Proforma...
        </div>
      </div>
    );
  }

  if (error || !proforma) {
    return (
      <div className="p-6">
        <Link
          to="/finance/proformas"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Proformas
        </Link>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Proforma not found."}
        </div>
      </div>
    );
  }

  const vehicleName = [
    proforma.vehicle_make,
    proforma.vehicle_model,
    proforma.vehicle_year,
  ]
    .filter(Boolean)
    .join(" ");

  const isFinance = proforma.payment_type === "finance";
  const isMaster = user?.role === "MASTER";

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/finance/proformas"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Proformas
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            Proforma Invoice
          </h1>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {proforma.proforma_number}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {isFinance ? "Finance" : "Cash"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/finance/insurance/${proforma.insurance}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Open Insurance
          </Link>

          <div className="no-print flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
              <input
                type="checkbox"
                checked={includeSealStamp}
                onChange={(event) => setIncludeSealStamp(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              <span>Add Company Seal &amp; Stamp</span>
            </label>

            <PrintButton
              customerName={proforma.customer_name}
              documentNumber={proforma.proforma_number}
              label="Print Proforma"
              onClick={() =>
                navigate(
                  `/finance/proformas/${proforma.id}/print?seal_stamp=${
                    includeSealStamp ? "1" : "0"
                  }`,
                )
              }
            />
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Edit
            </button>
          )}

          {isMaster && !editing && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Proforma Information">
            <DetailRow
              label="Proforma Number"
              value={proforma.proforma_number}
            />

            <DetailRow
              label="Date"
              value={formatDate(proforma.proforma_date)}
            />

            <DetailRow label="Quote" value={proforma.quote} />

            <DetailRow
              label="Payment Type"
              value={isFinance ? "Finance" : "Cash"}
            />
          </Section>

          <Section title="Customer">
            <div className="space-y-4 py-4">
              <InputField
                label="Customer"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />

              <InputField
                label="Mobile"
                value={customerMobile}
                onChange={(event) => setCustomerMobile(event.target.value)}
              />
            </div>
          </Section>

          <Section title="Vehicle">
            <div className="space-y-4 py-4">
              <InputField
                label="Make"
                value={vehicleMake}
                onChange={(event) => setVehicleMake(event.target.value)}
              />

              <InputField
                label="Model"
                value={vehicleModel}
                onChange={(event) => setVehicleModel(event.target.value)}
              />

              <InputField
                label="Year"
                type="number"
                value={vehicleYear}
                onChange={(event) => setVehicleYear(event.target.value)}
              />

              <InputField
                label="Chassis"
                value={vehicleChassisNumber}
                onChange={(event) =>
                  setVehicleChassisNumber(event.target.value)
                }
              />

              <InputField
                label="Engine"
                value={vehicleEngineNumber}
                onChange={(event) => setVehicleEngineNumber(event.target.value)}
              />

              <InputField
                label="Mileage"
                type="number"
                min="0"
                value={vehicleMileage}
                onChange={(event) => setVehicleMileage(event.target.value)}
              />
            </div>
          </Section>

          <Section title="Commercial">
            <div className="space-y-4 py-4">
              <InputField
                label="Vehicle Price"
                type="number"
                min="0"
                step="0.01"
                value={vehiclePrice}
                onChange={(event) => setVehiclePrice(event.target.value)}
              />

              {isFinance && (
                <>
                  <InputField
                    label="Bank / Financed By"
                    value={bankFinancedBy}
                    onChange={(event) => setBankFinancedBy(event.target.value)}
                  />

                  <InputField
                    label="LPO Number"
                    value={lpo}
                    onChange={(event) => setLpo(event.target.value)}
                  />

                  <InputField
                    label="Down Payment"
                    type="number"
                    min="0"
                    step="0.01"
                    value={downPayment}
                    onChange={(event) => setDownPayment(event.target.value)}
                  />

                  <DetailRow label="Net Finance" value={proforma.net_finance} />
                </>
              )}

              <InputField
                label="VAT"
                type="number"
                min="0"
                step="0.01"
                value={vat}
                onChange={(event) => setVat(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>
          </Section>

          <div className="flex flex-wrap gap-2 xl:col-span-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={cancelEditing}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Proforma Information">
            <DetailRow
              label="Proforma Number"
              value={proforma.proforma_number}
            />

            <DetailRow
              label="Date"
              value={formatDate(proforma.proforma_date)}
            />

            <DetailRow label="Quote" value={proforma.quote} />

            <DetailRow
              label="Payment Type"
              value={isFinance ? "Finance" : "Cash"}
            />
          </Section>

          <Section title="Customer">
            <DetailRow label="Customer" value={proforma.customer_name} />
            <DetailRow label="Mobile" value={proforma.customer_mobile} />
          </Section>

          <Section title="Vehicle">
            <DetailRow label="Vehicle" value={vehicleName} />
            <DetailRow
              label="Chassis"
              value={proforma.vehicle_chassis_number}
            />
            <DetailRow label="Engine" value={proforma.vehicle_engine_number} />
            <DetailRow label="Mileage" value={proforma.vehicle_mileage} />
          </Section>

          <Section title="Commercial">
            <DetailRow label="Vehicle Price" value={proforma.vehicle_price} />

            {isFinance && (
              <>
                <DetailRow
                  label="Bank / Financed By"
                  value={proforma.bank_financed_by}
                />

                <DetailRow label="LPO Number" value={proforma.lpo} />

                <DetailRow label="Down Payment" value={proforma.down_payment} />

                <DetailRow label="Net Finance" value={proforma.net_finance} />
              </>
            )}

            <DetailRow label="VAT" value={proforma.vat} />
          </Section>
        </div>
      )}
    </div>
  );
}
