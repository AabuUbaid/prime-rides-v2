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
      toast.error(e?.message || "Unable to load staff.");
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
      toast.error(e?.message || "Unable to save staff.");
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
      toast.error(e?.message || "Unable to update status.");
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Staff Management</h1>
            <p className="mt-1 text-sm text-gray-500">
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
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
            >
              Add Staff
            </button>
          )}
        </div>
        {show && (
          <form
            onSubmit={save}
            className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-3"
          >
            {[
              ["name", "Name"],
              ["phone", "Phone"],
              ["join_date", "Join Date"],
              ["base_salary", "Base Salary"],
              ["visa_expiry", "Visa Expiry"],
              ["leave_balance", "Leave Balance"],
            ].map(([k, l]) => (
              <label key={k} className="text-sm font-medium">
                {l}
                <input
                  required={k === "name"}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  type={
                    k.includes("date")
                      ? "date"
                      : k === "base_salary" || k === "leave_balance"
                        ? "number"
                        : "text"
                  }
                  className="mt-2 w-full rounded-lg border px-3 py-2.5"
                />
              </label>
            ))}
            <label className="text-sm font-medium">
              Job Role
              <select
                value={form.job_role}
                onChange={(e) => setForm({ ...form, job_role: e.target.value })}
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
              >
                {ROLES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
              />
            </label>
            <div className="md:col-span-3 flex gap-2">
              <button
                disabled={saving}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
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
                  <tr key={s.id}>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.job_role}</td>
                    <td className="px-4 py-3">{s.phone || "-"}</td>
                    <td className="px-4 py-3">{s.status}</td>
                    <td className="px-4 py-3 text-right">
                      {edit && (
                        <button
                          onClick={() => {
                            setEditing(s.id);
                            setForm({ ...EMPTY, ...s });
                            setShow(true);
                          }}
                          className="mr-3 font-medium"
                        >
                          Edit
                        </button>
                      )}
                      <Link
                        to={`/staff/${s.id}/performance`}
                        className="font-medium"
                      >
                        Performance
                      </Link>
                      {edit && (
                        <button
                          onClick={() => toggle(s)}
                          className="ml-3 text-red-600"
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
