function SubmitSection({ saving, handleSubmit, handleDelete }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
      <button
        type="button"
        onClick={handleDelete}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        Delete Vehicle
      </button>

      <button
        type="submit"
        disabled={saving}
        onClick={handleSubmit}
        className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Vehicle"}
      </button>
    </div>
  );
}

export default SubmitSection;