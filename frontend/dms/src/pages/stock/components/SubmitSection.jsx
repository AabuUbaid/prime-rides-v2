function SubmitSection({ saving, handleSubmit, handleDelete }) {
  return (
    <div>
      <button type="button" onClick={handleDelete}>
        Delete Vehicle
      </button>

      <button type="submit" disabled={saving} onClick={handleSubmit}>
        {saving ? "Saving..." : "Save Vehicle"}
      </button>
    </div>
  );
}

export default SubmitSection;
