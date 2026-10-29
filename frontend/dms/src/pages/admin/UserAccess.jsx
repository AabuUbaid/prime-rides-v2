import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  activateUserAccess,
  changeUserPassword,
  createUserAccess,
  deactivateUserAccess,
  getUserAccess,
  getUserAccessMember,
  updateUserAccess,
} from "../../api/userAccess";
import { getStaff } from "../../api/staff";
import { getApiErrorMessage } from "../../utils/errorMessage";
import StatusBadge from "../../components/ui/StatusBadge";
const EMPTY = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "SALES_STAFF",
  staff_id: "",
  is_active: true,
};
const rows = (r) =>
  Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];
export default function UserAccess() {
  const [items, setItems] = useState([]),
    [staff, setStaff] = useState([]),
    [form, setForm] = useState(EMPTY),
    [editing, setEditing] = useState(null),
    [saving, setSaving] = useState(false);
  async function load() {
    try {
      setItems(rows(await getUserAccess()));
      setStaff(rows(await getStaff()));
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to load User Access."));
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    if (!editing && form.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        const p = { ...form };
        delete p.password;

        if (p.role === "MASTER") {
          delete p.staff_id;
        }

        await updateUserAccess(editing, p);
      } else {
        const p = { ...form };

        if (p.role === "MASTER") {
          delete p.staff_id;
        }

        await createUserAccess(p);
      }
      toast.success(editing ? "User updated" : "User created");
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to save user."));
    } finally {
      setSaving(false);
    }
  }
  async function toggle(x) {
    try {
      if (x.is_active) await deactivateUserAccess(x.id);
      else await activateUserAccess(x.id);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to change user status."));
    }
  }
  async function password(x) {
    const p = window.prompt("New password (minimum 8 characters):");
    if (!p) return;
    try {
      await changeUserPassword(x.id, p);
      toast.success("Password changed");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to change password"));
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">User Access Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            MASTER-only access administration.
          </p>
        </div>
        <form
          onSubmit={save}
          className="grid gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:grid-cols-3"
        >
          {[
            ["email", "Email"],
            ["first_name", "First Name"],
            ["last_name", "Last Name"],
            ["phone", "Phone"],
            ["password", "Password"],
          ].map(([k, l]) => (
            <label key={k} className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              {l}
              <input
                type={k === "password" ? "password" : "text"}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                required={!editing && (k === "email" || k === "password")}
              />
            </label>
          ))}
          <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            Role
            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                  staff_id: e.target.value === "MASTER" ? "" : form.staff_id,
                })
              }
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
            >
              <option>MASTER</option>
              <option>ADMIN</option>
              <option>SALES_STAFF</option>
            </select>
          </label>
          {form.role !== "MASTER" && (
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Staff
              <select
                value={form.staff_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    staff_id: e.target.value,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                <option value="">No linked staff</option>

                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
            />{" "}
            Active
          </label>
          <div className="md:col-span-3">
            <button
              disabled={saving}
              className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
            >
              {saving ? "Saving..." : editing ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((x) => (
                  <tr key={x.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {x.first_name} {x.last_name}
                      </div>
                      <div className="text-xs text-slate-500">{x.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {x.role}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {x.staff_name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={x.is_active ? "active" : "inactive"}
                        variant={x.is_active ? "cyan" : "neutral"}
                      >
                        {x.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await getUserAccessMember(x.id);
                              const user = response?.data || response;

                              setEditing(user.id);

                              setForm({
                                ...EMPTY,
                                ...user,
                                password: "",
                                staff_id:
                                  user.role === "MASTER"
                                    ? ""
                                    : user.staff_id || "",
                              });
                            } catch (e) {
                              toast.error(
                                getApiErrorMessage(e, "Unable to load user."),
                              );
                            }
                          }}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => password(x)}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Password
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(x)}
                          className={`inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold shadow-sm transition ${
                            x.is_active
                              ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          {x.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
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
