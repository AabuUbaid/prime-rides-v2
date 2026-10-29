import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  activateStaff,
  createStaff,
  deleteStaff,
  getStaff,
  updateStaff,
} from "../../api/staff";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/errorMessage";
import StatusBadge from "../../components/ui/StatusBadge";

const ROLES = [
  "SALES_EXECUTIVE",
  "PROCUREMENT",
  "ACCOUNTS",
  "ADMIN",
  "MANAGER",
];
const EMPTY = {
  name: "",
  phone: "",
  join_date: "",
  job_role: "SALES_EXECUTIVE",
  base_salary: "",
  visa_expiry: "",
  leave_balance: "0",
  notes: "",
  status: "ACTIVE",
};
const rows = (r) =>
  Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
export default function Staff() {
  const { user } = useAuth();
  const edit = user?.role === "MASTER";
  const [items, setItems] = useState([]),
    [form, setForm] = useState(EMPTY),
    [editing, setEditing] = useState(null),
    [show, setShow] = useState(false),
    [saving, setSaving] = useState(false);
  async function load() {
    try {
      setItems(rows(await getStaff()));
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to load staff."));
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    try {
      setSaving(true);
      const p = {
        ...form,
        base_salary: form.base_salary === "" ? null : form.base_salary,
        leave_balance: form.leave_balance === "" ? 0 : form.leave_balance,
      };
      editing ? await updateStaff(editing, p) : await createStaff(p);
      toast.success(editing ? "Staff updated" : "Staff created");
      setForm(EMPTY);
      setEditing(null);
      setShow(false);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to save staff."));
    } finally {
      setSaving(false);
    }
  }
  async function toggle(s) {
    try {
      if (s.status === "ACTIVE") await deleteStaff(s.id);
      else await activateStaff(s.id);
      toast.success("Staff status updated");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to update status."));
    }
  }
  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Staff Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Employee records are separate from RBAC roles.
            </p>
          </div>
          {edit && (
            <button
              onClick={() => {
                setForm(EMPTY);
                setEditing(null);
                setShow(true);
              }}
              className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
            >
              Add Staff
            </button>
          )}
        </div>
        {show && (
          <form
            onSubmit={save}
            className="grid gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:grid-cols-3"
          >
            {[
              ["name", "Name"],
              ["phone", "Phone"],
              ["join_date", "Join Date"],
              ["base_salary", "Base Salary"],
              ["visa_expiry", "Visa Expiry"],
              ["leave_balance", "Leave Balance"],
            ].map(([k, l]) => (
              <label key={k} className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {l}
                <input
                  required={k === "name"}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  type={
                    k === "join_date" || k === "visa_expiry"
                      ? "date"
                      : k === "base_salary" || k === "leave_balance"
                        ? "number"
                        : "text"
                  }
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </label>
            ))}
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Job Role
              <select
                value={form.job_role}
                onChange={(e) => setForm({ ...form, job_role: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                {ROLES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 md:col-span-2">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>
            <div className="md:col-span-3 flex gap-2">
              <button
                disabled={saving}
                className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Job Role</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.job_role}</td>
                    <td className="px-4 py-3">{s.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={s.status}
                        variant={s.status === "ACTIVE" ? "success" : "neutral"}
                      >
                        {s.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {edit && (
                        <button
                          onClick={() => {
                            setEditing(s.id);
                            setForm({ ...EMPTY, ...s });
                            setShow(true);
                          }}
                          className="mr-2 inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      )}
                      <Link
                        to={`/staff/${s.id}/performance`}
                        className="mr-2 inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Performance
                      </Link>
                      {edit && (
                        <button
                          onClick={() => toggle(s)}
                          className={`inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold shadow-sm transition ${
                            s.status === "ACTIVE"
                              ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                              : "border-amber-500 bg-amber-500 text-slate-950 hover:bg-amber-400"
                          }`}
                        >
                          {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
