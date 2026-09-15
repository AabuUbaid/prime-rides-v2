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

      const normalizedData = {
        ...formData,
        make: formatHumanText(formData.make),
        model: formatHumanText(formData.model),
        variant: formatHumanText(formData.variant),
        colour: formatHumanText(formData.colour),
        supplier: formatHumanText(formData.supplier),
        service_location: formatHumanText(formData.service_location),
        source_specify: formatHumanText(formData.source_specify),
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

          <p className="text-sm font-medium text-slate-600">
            Loading vehicle...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
            Inventory
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Vehicle
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Update vehicle information and inventory details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
          <VehicleInformation formData={formData} handleChange={handleChange} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
          <PricingInformation formData={formData} handleChange={handleChange} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
          <VehicleDetails
            formData={formData}
            handleChange={handleChange}
            hideStatus
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
          <UploadSection
            car={car}
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-6">
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
