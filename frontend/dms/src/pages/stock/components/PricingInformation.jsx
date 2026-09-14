import { useAuth } from "../../../context/AuthContext";

function PricingInformation({ formData, handleChange }) {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Pricing Information
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {user?.role === "MASTER" && (
          <input
            type="number"
            name="purchase_cost"
            placeholder="Purchase Cost"
            min="0"
            step={1}
            value={formData.purchase_cost ?? ""}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        )}

        <input
          type="number"
          name="asking_price"
          placeholder="Asking Price"
          min="0"
          step={1}
          value={formData.asking_price ?? ""}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          type="number"
          name="least_selling_price"
          placeholder="Least Selling Price"
          min="0"
          step={1}
          value={formData.least_selling_price ?? ""}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

export default PricingInformation;
