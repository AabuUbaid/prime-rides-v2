function SubmitSection({ saving, handleSubmit, handleDelete }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={handleDelete}
        className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
      >
        Delete Vehicle
      </button>

      <button
        type="submit"
        disabled={saving}
        onClick={handleSubmit}
        className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Vehicle"}
      </button>
    </div>
  );
}

export default SubmitSection;
