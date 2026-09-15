function VehicleInformation({ formData, handleChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Vehicle Information
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Basic vehicle identity and classification.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="number"
          name="year"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          name="make"
          placeholder="Make"
          value={formData.make}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          name="model"
          placeholder="Model"
          value={formData.model}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          name="variant"
          placeholder="Variant"
          value={formData.variant}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          name="colour"
          placeholder="Colour"
          value={formData.colour}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <select
          name="vehicle_type"
          value={formData.vehicle_type}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        >
          <option value="">Select Vehicle Type</option>
          <option value="sedan">Sedan</option>
          <option value="suv">SUV (Sport Utility Vehicle)</option>
          <option value="hatchback">Hatchback</option>
          <option value="crossover">Crossover</option>
          <option value="coupe">Coupe</option>
          <option value="convertible">Convertible</option>
          <option value="pickup_truck">Pickup Truck</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );
}

export default VehicleInformation;
