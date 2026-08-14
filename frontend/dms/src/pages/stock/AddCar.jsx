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
    <form onSubmit={handleSubmit}>
      <h1>Add Vehicle</h1>

      <VehicleInformation formData={formData} handleChange={handleChange} />

      <PricingInformation formData={formData} handleChange={handleChange} />

      <VehicleDetails formData={formData} handleChange={handleChange} />

      <UploadSection formData={formData} setFormData={setFormData} />

      <SubmitSection saving={saving} />
    </form>
  );
}

export default AddCar;
