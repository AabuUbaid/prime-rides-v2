function PricingInformation({ formData, handleChange }) {
  return (
    <div>
      <h2>Pricing Information</h2>

      <input
        type="number"
        name="purchase_cost"
        placeholder="Purchase Cost"
        min="0"
        step={1}
        value={formData.purchase_cost ?? ""}
        onChange={handleChange}
      />

      <input
        type="number"
        name="asking_price"
        placeholder="Asking Price"
        value={formData.asking_price ?? ""}
        onChange={handleChange}
      />

      <input
        type="number"
        name="least_selling_price"
        placeholder="Least Selling Price"
        min="0"
        step={1}
        value={formData.least_selling_price ?? ""}
        onChange={handleChange}
      />
    </div>
  );
}

export default PricingInformation;
