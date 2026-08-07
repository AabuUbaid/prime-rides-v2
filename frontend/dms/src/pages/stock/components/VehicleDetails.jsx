function VehicleDetails({ formData, handleChange }) {
  return (
    <div>
      <h2>VehicleDetails</h2>
      <input
        type="number"
        name="mileage"
        placeholder="Mileage"
        min="0"
        step={1}
        value={formData.mileage}
        onChange={handleChange}
      />

      <input
        type="text"
        name="supplier"
        placeholder="Supplier"
        value={formData.supplier}
        onChange={handleChange}
      />

      <input
        type="text"
        name="chassis_number"
        placeholder="Chassis Number(VIN)"
        value={formData.chassis_number}
        onChange={handleChange}
      />

      <input
        type="text"
        name="engine_number"
        placeholder="Engine Number"
        value={formData.engine_number}
        onChange={handleChange}
      />

      <select name="status" value={formData.status} onChange={handleChange}>
        <option value="available">Available</option>
        <option value="reserved">Reserved</option>
        <option value="sold">Sold</option>
        <option value="upcoming">Upcoming</option>
        <option value="in_service">In Service</option>
        <option value="in_house">In House</option>
      </select>

      <select name="source" value={formData.source} onChange={handleChange}>
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
        />
      )}

      <label>
        <input
          type="checkbox"
          name="highlight_public"
          checked={formData.highlight_public}
          onChange={handleChange}
        />
        Highlight Public
      </label>
    </div>
  );
}

export default VehicleDetails;
