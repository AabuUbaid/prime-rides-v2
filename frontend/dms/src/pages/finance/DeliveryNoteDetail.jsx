import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";
import {
  deleteDeliveryNote,
  getDeliveryNote,
  updateDeliveryNote,
} from "../../api/deliveryNotes";

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

function InputField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-600">{label}</label>

      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
      />
    </div>
  );
}

export default function DeliveryNoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deliveryNote, setDeliveryNote] = useState(null);

  const [deliveryDate, setDeliveryDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColour, setVehicleColour] = useState("");
  const [vehicleChassisNumber, setVehicleChassisNumber] = useState("");
  const [vehicleEngineNumber, setVehicleEngineNumber] = useState("");
  const [vehicleMileage, setVehicleMileage] = useState("");
  const [buyerName, setBuyerName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  async function loadDeliveryNote() {
    try {
      setLoading(true);
      setError("");

      const response = await getDeliveryNote(id);
      const data = response?.data ?? response;

      setDeliveryNote(data || null);

      setDeliveryDate(data?.delivery_date ?? "");
      setCustomerName(data?.customer_name ?? "");
      setVehicleMake(data?.vehicle_make ?? "");
      setVehicleModel(data?.vehicle_model ?? "");
      setVehicleYear(data?.vehicle_year ?? "");
      setVehicleColour(data?.vehicle_colour ?? "");
      setVehicleChassisNumber(data?.vehicle_chassis_number ?? "");
      setVehicleEngineNumber(data?.vehicle_engine_number ?? "");
      setVehicleMileage(data?.vehicle_mileage ?? "");
      setBuyerName(data?.buyer_name ?? "");
    } catch (err) {
      setDeliveryNote(null);
      setError(err?.message || "Unable to load Delivery Note.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveryNote();
  }, [id]);

  function cancelEditing() {
    setEditing(false);

    setDeliveryDate(deliveryNote?.delivery_date ?? "");
    setCustomerName(deliveryNote?.customer_name ?? "");
    setVehicleMake(deliveryNote?.vehicle_make ?? "");
    setVehicleModel(deliveryNote?.vehicle_model ?? "");
    setVehicleYear(deliveryNote?.vehicle_year ?? "");
    setVehicleColour(deliveryNote?.vehicle_colour ?? "");
    setVehicleChassisNumber(deliveryNote?.vehicle_chassis_number ?? "");
    setVehicleEngineNumber(deliveryNote?.vehicle_engine_number ?? "");
    setVehicleMileage(deliveryNote?.vehicle_mileage ?? "");
    setBuyerName(deliveryNote?.buyer_name ?? "");
  }

  async function handleSave() {
    try {
      setSaving(true);

      const response = await updateDeliveryNote(id, {
        delivery_date: deliveryDate,
        customer_name: customerName,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear || null,
        vehicle_colour: vehicleColour,
        vehicle_chassis_number: vehicleChassisNumber,
        vehicle_engine_number: vehicleEngineNumber,
        vehicle_mileage: vehicleMileage || null,
        buyer_name: buyerName,
      });

      const data = response?.data ?? response;

      setDeliveryNote(data || deliveryNote);
      setEditing(false);

      toast.success("Delivery Note updated successfully.");
      await loadDeliveryNote();
    } catch (err) {
      toast.error(err?.message || "Unable to update Delivery Note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this Delivery Note?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await deleteDeliveryNote(id);

      toast.success("Delivery Note deleted successfully.");
      navigate("/finance/delivery-notes");
    } catch (err) {
      toast.error(err?.message || "Unable to delete Delivery Note.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading Delivery Note...
        </div>
      </div>
    );
  }

  if (error || !deliveryNote) {
    return (
      <div className="p-6">
        <Link
          to="/finance/delivery-notes"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Delivery Notes
        </Link>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Delivery Note not found."}
        </div>
      </div>
    );
  }

  const isMaster = user?.role === "MASTER";

  const vehicleName = [
    deliveryNote.vehicle_make,
    deliveryNote.vehicle_model,
    deliveryNote.vehicle_year,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/finance/delivery-notes"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Delivery Notes
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            Delivery Note
          </h1>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {deliveryNote.delivery_note_number}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {deliveryNote.unit || "Car"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <PrintButton
            customerName={deliveryNote.customer_name}
            documentNumber={deliveryNote.delivery_note_number}
            label="Print Delivery Note"
            onClick={() =>
              navigate(`/finance/delivery-notes/${deliveryNote.id}/print`)
            }
          />
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
          <Section title="Delivery Note Information">
            <DetailRow
              label="Delivery Note Number"
              value={deliveryNote.delivery_note_number}
            />
            <DetailRow label="Quote" value={deliveryNote.quote} />
            <DetailRow label="Insurance" value={deliveryNote.insurance} />
            <DetailRow label="Quantity" value={deliveryNote.quantity} />
            <DetailRow label="Unit" value={deliveryNote.unit} />

            <div className="py-4">
              <InputField
                label="Delivery Date"
                type="date"
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
              />
            </div>
          </Section>

          <Section title="Customer">
            <div className="py-4">
              <InputField
                label="Customer"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
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
                label="Colour"
                value={vehicleColour}
                onChange={(event) => setVehicleColour(event.target.value)}
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
                value={vehicleMileage}
                onChange={(event) => setVehicleMileage(event.target.value)}
              />
            </div>
          </Section>

          <Section title="Buyer">
            <div className="space-y-4 py-4">
              <InputField
                label="Buyer Name"
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
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
          <Section title="Delivery Note Information">
            <DetailRow
              label="Delivery Note Number"
              value={deliveryNote.delivery_note_number}
            />
            <DetailRow
              label="Delivery Date"
              value={formatDate(deliveryNote.delivery_date)}
            />
            <DetailRow label="Quote" value={deliveryNote.quote} />
            <DetailRow label="Insurance" value={deliveryNote.insurance} />
            <DetailRow label="Quantity" value={deliveryNote.quantity} />
            <DetailRow label="Unit" value={deliveryNote.unit} />
          </Section>

          <Section title="Customer">
            <DetailRow label="Customer" value={deliveryNote.customer_name} />
          </Section>

          <Section title="Vehicle">
            <DetailRow label="Vehicle" value={vehicleName} />
            <DetailRow label="Colour" value={deliveryNote.vehicle_colour} />
            <DetailRow
              label="Chassis"
              value={deliveryNote.vehicle_chassis_number}
            />
            <DetailRow
              label="Engine"
              value={deliveryNote.vehicle_engine_number}
            />
            <DetailRow label="Mileage" value={deliveryNote.vehicle_mileage} />
          </Section>

          <Section title="Buyer">
            <DetailRow label="Buyer Name" value={deliveryNote.buyer_name} />
          </Section>
        </div>
      )}
    </div>
  );
}
