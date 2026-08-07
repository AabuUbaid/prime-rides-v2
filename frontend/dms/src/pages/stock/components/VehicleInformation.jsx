function VehicleInformation({ formData, handleChange }) {
  return (
    <div>
      <h2>Vehicle Information</h2>

      <input
        type="number"
        name="year"
        placeholder="Year"
        value={formData.year}
        onChange={handleChange}
      />

      <input
        name="make"
        placeholder="Make"
        value={formData.make}
        onChange={handleChange}
      />

      <input
        name="model"
        placeholder="Model"
        value={formData.model}
        onChange={handleChange}
      />

      <input
        name="variant"
        placeholder="Variant"
        value={formData.variant}
        onChange={handleChange}
      />

      <input
        name="colour"
        placeholder="Colour"
        value={formData.colour}
        onChange={handleChange}
      />
    </div>
  );
}

export default VehicleInformation;
