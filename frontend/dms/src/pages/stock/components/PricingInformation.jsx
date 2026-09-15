import { useAuth } from "../../../context/AuthContext";

function PricingInformation({ formData, handleChange }) {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Pricing Information
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Purchase, asking, and minimum selling price information.
        </p>
      </div>

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
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          type="number"
          name="least_selling_price"
          placeholder="Least Selling Price"
          min="0"
          step={1}
          value={formData.least_selling_price ?? ""}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />
      </div>
    </div>
  );
}

export default PricingInformation;
