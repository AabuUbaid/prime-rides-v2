import { useEffect, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import {
  getAttendance,
  getStaff,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "../../api/staff";
function Attendance() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 25,
    total_pages: 1,
    count: 0,
  });

  const emptyForm = {
    staff: "",
    attendance_date: "",
    status: "PRESENT",
    check_in: "",
    check_out: "",
    notes: "",
  };

  const [staffList, setStaffList] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttendance = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await getAttendance({
        page,
        page_size: 25,
      });

      setRows(Array.isArray(response?.data) ? response.data : []);

      setPagination({
        page: response?.pagination?.page ?? page,
        page_size: response?.pagination?.page_size ?? 25,
        total_pages: response?.pagination?.total_pages ?? 1,
        count: response?.pagination?.count ?? 0,
      });
    } catch (err) {
      setRows([]);
      setError(err?.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await getStaff();

      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setStaffList(rows);
    } catch (err) {
      setStaffList([]);
      setFormError(err?.message || "Failed to load staff.");
    }
  };

  useEffect(() => {
    loadAttendance(1);
    loadStaff();
  }, []);

  const formatTime = (value) => {
    if (!value) return "—";
    return value.slice(0, 5);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        staff: Number(form.staff),
        attendance_date: form.attendance_date,
        status: form.status,
        check_in: form.check_in || "",
        check_out: form.check_out || "",
        notes: form.notes || "",
      };

      if (editingId) {
        await updateAttendance(editingId, payload);
      } else {
        await createAttendance(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowCreate(false);

      await loadAttendance(pagination.page);
    } catch (err) {
      setFormError(
        err?.message ||
          `Failed to ${editingId ? "update" : "create"} attendance.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setForm({
      staff: String(row.staff ?? ""),
      attendance_date: row.attendance_date ?? "",
      status: row.status ?? "PRESENT",
      check_in: row.check_in ? row.check_in.slice(0, 5) : "",
      check_out: row.check_out ? row.check_out.slice(0, 5) : "",
      notes: row.notes ?? "",
    });

    setEditingId(row.id);
    setFormError("");
    setShowCreate(true);
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Delete attendance record for ${row.staff_name || `Staff #${row.staff}`} on ${row.attendance_date}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(row.id);
      setError("");

      await deleteAttendance(row.id);

      await loadAttendance(pagination.page);
    } catch (err) {
      setError(err?.message || "Failed to delete attendance.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">Staff attendance records</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setFormError("");
              setShowCreate(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
          >
            <Plus size={16} />
            Add Attendance
          </button>

          <button
            type="button"
            onClick={() => loadAttendance(pagination.page)}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Staff
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Check In
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Check Out
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Notes
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {row.staff_name || `Staff #${row.staff}`}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {row.attendance_date || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {row.status || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {formatTime(row.check_in)}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {formatTime(row.check_out)}
                    </td>

                    <td className="max-w-xs px-4 py-4 text-sm text-slate-700">
                      {row.notes || "—"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          disabled={deletingId === row.id}
                          className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id}
                          className="rounded-xl border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === row.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <div className="text-sm text-slate-500">
            {pagination.count} record
            {pagination.count === 1 ? "" : "s"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAttendance(pagination.page - 1)}
              disabled={loading || pagination.page <= 1}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="px-2 text-sm text-slate-600">
              Page {pagination.page} of {pagination.total_pages}
            </span>

            <button
              type="button"
              onClick={() => loadAttendance(pagination.page + 1)}
              disabled={loading || pagination.page >= pagination.total_pages}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingId ? "Edit Attendance" : "Add Attendance"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId
                    ? "Update the attendance record."
                    : "Create a staff attendance record."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-6">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Staff
                  </label>

                  <select
                    name="staff"
                    value={form.staff}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  >
                    <option value="">Select staff</option>

                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || `Staff #${staff.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Attendance Date
                  </label>

                  <input
                    type="date"
                    name="attendance_date"
                    value={form.attendance_date}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">Leave</option>
                    <option value="HOLIDAY">Holiday</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Check In
                  </label>

                  <input
                    type="time"
                    name="check_in"
                    value={form.check_in}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Check Out
                  </label>

                  <input
                    type="time"
                    name="check_out"
                    value={form.check_out}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Attendance"
                      : "Create Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;
