import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { formatHumanText } from "../../utils/textFormatters";

import { getCar, updateCar, deleteCar } from "../../api/inventory";
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
  remove_certificate: false,

  images: [],
};

function EditCar() {
  const { id } = useParams();

  const [car, setCar] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCar() {
      try {
        const response = await getCar(id);

        setCar(response.data);
        setFormData({
          ...initialFormData,

          ...response.data,

          images: [],
          possession_certificate: null,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadCar();
  }, [id]);

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

      const { status, ...editableData } = formData;

      const normalizedData = {
        ...editableData,
        make: formatHumanText(editableData.make),
        model: formatHumanText(editableData.model),
        variant: formatHumanText(editableData.variant),
        colour: formatHumanText(editableData.colour),
        supplier: formatHumanText(editableData.supplier),
        service_location: formatHumanText(editableData.service_location),
        source_specify: formatHumanText(editableData.source_specify),
      };

      const result = await updateCar(id, normalizedData);

      console.log(result);

      setCar(result.data);

      setFormData((prev) => ({
        ...prev,
        remove_certificate: false,
        possession_certificate: null,
      }));

      toast.success("Vehicle updated successfully.");
    } catch (error) {
      console.error(error);

      toast.error(error.message || "Failed to update vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this vehicle?",
    );

    if (!confirmed) return;

    try {
      await deleteCar(id);

      toast.success("Vehicle deleted successfully.");

      navigate("/stock");
    } catch (error) {
      toast.error(error.message || "Failed to delete vehicle.");
    }
  };

  if (loading) {
    return (
      <h2 className="p-6 text-xl font-semibold text-gray-900">Loading...</h2>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>

        <p className="mt-1 text-sm text-gray-500">
          Update vehicle information and inventory details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <VehicleInformation formData={formData} handleChange={handleChange} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <PricingInformation formData={formData} handleChange={handleChange} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <VehicleDetails
            formData={formData}
            handleChange={handleChange}
            hideStatus
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <UploadSection
            car={car}
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <SubmitSection
            saving={saving}
            handleSubmit={handleSubmit}
            handleDelete={handleDelete}
          />
        </div>
      </form>
    </div>
  );
}

export default EditCar;
