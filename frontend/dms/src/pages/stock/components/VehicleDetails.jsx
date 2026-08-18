function VehicleDetails({ formData, handleChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Vehicle Details
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="number"
          name="mileage"
          placeholder="Mileage"
          min="0"
          step={1}
          value={formData.mileage}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          type="text"
          name="supplier"
          placeholder="Supplier"
          value={formData.supplier}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          type="text"
          name="chassis_number"
          placeholder="Chassis Number(VIN)"
          value={formData.chassis_number}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          type="text"
          name="engine_number"
          placeholder="Engine Number"
          value={formData.engine_number}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
          <option value="upcoming">Upcoming</option>
          <option value="in_service">In Service</option>
          <option value="in_house">In House</option>
        </select>

        <select
          name="source"
          value={formData.source}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="highlight_public"
          checked={formData.highlight_public}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300"
        />
        Highlight Public
      </label>
    </div>
  );
}

export default VehicleDetails;