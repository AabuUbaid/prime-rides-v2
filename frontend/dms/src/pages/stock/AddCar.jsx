import { useState } from "react";
import { createCar } from "../../api/inventory";
import { toast } from "react-toastify";

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

      const result = await createCar(formData);

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
      className="mx-auto max-w-5xl space-y-6 p-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Add Vehicle
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a new vehicle to the inventory.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <VehicleInformation
          formData={formData}
          handleChange={handleChange}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <PricingInformation
          formData={formData}
          handleChange={handleChange}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <VehicleDetails
          formData={formData}
          handleChange={handleChange}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <UploadSection
          formData={formData}
          setFormData={setFormData}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <SubmitSection saving={saving} />
      </div>
    </form>
  );
}

export default AddCar;