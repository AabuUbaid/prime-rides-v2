import { useState } from "react";
import { createCar } from "../../api/inventory";
import { toast } from "react-toastify";

import { formatHumanText } from "../../utils/textFormatters";
import VehicleInformation from "./components/VehicleInformation";
import PricingInformation from "./components/PricingInformation";
import VehicleDetails from "./components/VehicleDetails";
import UploadSection from "./components/UploadSection";
import SubmitSection from "./components/SubmitSection";

const initialFormData = {
  year: "",
  make: "",
  model: "",
  variant: "",
  colour: "",
  vehicle_type: "",
  service_location: "",
  actual_mileage: "",

  purchase_cost: "",
  asking_price: "",
  least_selling_price: "",

  mileage: "",
  supplier: "",

  status: "available",
  source: "own_purchase",
  source_specify: "",

  chassis_number: "",
  engine_number: "",

  highlight_public: false,

  possession_certificate: null,

  images: [],
};

function AddCar() {
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "source" && value !== "other") {
        updated.source_specify = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (
      !formData.make ||
      !formData.model ||
      !formData.variant ||
      !formData.colour ||
      !formData.year
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setSaving(true);

      const normalizedFormData = {
        ...formData,
        make: formatHumanText(formData.make),
        model: formatHumanText(formData.model),
        variant: formatHumanText(formData.variant),
        colour: formatHumanText(formData.colour),
        supplier: formatHumanText(formData.supplier),
        service_location: formatHumanText(formData.service_location),
        source_specify: formatHumanText(formData.source_specify),
      };

      const result = await createCar(normalizedFormData);

      console.log(result);

      toast.success("Vehicle created successfully.");

      setFormData(initialFormData);
    } catch (error) {
      console.error(error);

      toast.error(error.message || "Failed to create vehicle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
            Inventory
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Add Vehicle
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Add a new vehicle to the inventory.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
        <VehicleInformation formData={formData} handleChange={handleChange} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
        <PricingInformation formData={formData} handleChange={handleChange} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
        <VehicleDetails formData={formData} handleChange={handleChange} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
        <UploadSection formData={formData} setFormData={setFormData} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
        <SubmitSection saving={saving} />
      </div>
    </form>
  );
}

export default AddCar;
