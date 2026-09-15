function VehicleDetails({ formData, handleChange, hideStatus = false }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Vehicle Details
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Mileage, sourcing, identifiers, and operational information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="number"
          name="mileage"
          placeholder="Mileage"
          min="0"
          step={1}
          value={formData.mileage}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          type="number"
          name="actual_mileage"
          placeholder="Actual Mileage"
          value={formData.actual_mileage}
          onChange={handleChange}
          min="0"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          type="text"
          name="supplier"
          placeholder="Supplier"
          value={formData.supplier}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          type="text"
          name="chassis_number"
          placeholder="Chassis Number(VIN)"
          value={formData.chassis_number}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        <input
          type="text"
          name="engine_number"
          placeholder="Engine Number"
          value={formData.engine_number}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        />

        {!hideStatus && (
          <div>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
              <option value="upcoming">Upcoming</option>
              <option value="in_service">In Service</option>
              <option value="in_house">In House</option>
            </select>
          </div>
        )}

        {formData.status === "in_service" && (
          <input
            name="service_location"
            placeholder="Specify Location"
            value={formData.service_location}
            onChange={handleChange}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
        )}

        <select
          name="source"
          value={formData.source}
          onChange={handleChange}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
        >
          <option value="own_purchase">Own Purchase</option>
          <option value="fly_wheel">Flywheel</option>
          <option value="park_and_sale">Park & Sale</option>
          <option value="auction">Auction</option>
          <option value="trade_in">Trade-In</option>
          <option value="other">Other</option>
        </select>

        {formData.source === "other" && (
          <input
            type="text"
            name="source_specify"
            placeholder="Specify Source"
            value={formData.source_specify}
            onChange={handleChange}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="highlight_public"
          checked={formData.highlight_public}
          onChange={handleChange}
          className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
        />

        <span>Highlight Public</span>
      </label>
    </div>
  );
}

export default VehicleDetails;
