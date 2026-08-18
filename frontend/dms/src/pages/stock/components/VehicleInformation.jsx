function VehicleInformation({ formData, handleChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Vehicle Information
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="number"
          name="year"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          name="make"
          placeholder="Make"
          value={formData.make}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          name="model"
          placeholder="Model"
          value={formData.model}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          name="variant"
          placeholder="Variant"
          value={formData.variant}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <input
          name="colour"
          placeholder="Colour"
          value={formData.colour}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

export default VehicleInformation;