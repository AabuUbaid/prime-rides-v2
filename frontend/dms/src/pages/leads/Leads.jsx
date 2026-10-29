import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { createLead, getLeads } from "../../api/leads";
import { getStaff } from "../../api/staff";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/errorMessage";
import StatusBadge from "../../components/ui/StatusBadge";

const SOURCES = [
  "Direct",
  "Dubizzle",
  "Dubizzle (Import)",
  "Facebook",
  "Google Ads",
  "Import",
  "Instagram",
  "Insurance",
  "Interakt",
  "Referral",
  "Website",
  "WhatsApp",
];

const STATUSES = [
  "New",
  "Contacted",
  "Cash Deal",
  "Follow-Up / Negotiation",
  "Test Drive Booked",
  "Qualified",
  "4k Less",
  "Below 20k Budget",
  "Unqualified",
];

const EMPTY = {
  phone_number: "",
  customer_name: "",
  email: "",
  enquiry_source: "Direct",
  enquiry_status: "New",
  assigned_to: "",
  purpose: "",
  notes: "",
  insurance: "",
  type_of_car: "",
  brand: "",
  mode_of_payment: "",
  salary: "",
  date_of_birth: "",
  lead_from: "",
};

const rows = (r) =>
  Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];

export default function Leads() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const params = {
        search: search.trim() || undefined,
        enquiry_status: statusFilter || undefined,
        enquiry_source: sourceFilter || undefined,
        assigned_to: assignedFilter || undefined,
      };

      const [a, b] = await Promise.all([
        getLeads(params),
        getStaff().catch(() => ({ data: [] })),
      ]);

      setItems(rows(a));
      setStaff(rows(b));
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to load leads."));
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter, sourceFilter, assignedFilter]);

  async function save(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...form,
      };

      // Backend automatically assigns SALES_STAFF
      // to their own active Staff record.
      if (user?.role === "SALES_STAFF") {
        delete payload.assigned_to;
      }

      await createLead(payload);

      toast.success("Lead created");

      setForm(EMPTY);
      setShow(false);

      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to create lead."));
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setSourceFilter("");
    setAssignedFilter("");
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Leads</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sales Staff are automatically assigned their own leads by the
              backend.
            </p>
          </div>

          <button
            onClick={() => setShow((v) => !v)}
            className="inline-flex h-10 items-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400"
          >
            {show ? "Close" : "New Lead"}
          </button>
        </div>

        <div className="grid gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          >
            <option value="">All Sources</option>
            {SOURCES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          {user?.role !== "SALES_STAFF" ? (
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
            >
              <option value="">All Staff</option>

              {staff
                .filter((s) => s.status === "ACTIVE")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          )}

          {user?.role !== "SALES_STAFF" && (
            <div className="md:col-span-4">
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {show && (
          <form
            onSubmit={save}
            className="grid gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:grid-cols-3"
          >
            <label className="text-sm font-medium">
              Phone Number
              <input
                required
                value={form.phone_number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone_number: e.target.value,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>

            <label className="text-sm font-medium">
              Customer Name
              <input
                value={form.customer_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer_name: e.target.value,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>

            <label className="text-sm font-medium">
              Email
              <input
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>

            <label className="text-sm font-medium">
              Source
              <select
                value={form.enquiry_source}
                onChange={(e) =>
                  setForm({
                    ...form,
                    enquiry_source: e.target.value,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                {SOURCES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Status
              <select
                value={form.enquiry_status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    enquiry_status: e.target.value,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                {STATUSES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            {user?.role !== "SALES_STAFF" && (
              <label className="text-sm font-medium">
                Assigned Staff
                <select
                  value={form.assigned_to}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assigned_to: e.target.value,
                    })
                  }
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                >
                  <option value="">Select</option>

                  {staff
                    .filter((s) => s.status === "ACTIVE")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <label className="text-sm font-medium md:col-span-3">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
                rows={3}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </label>

            <div className="md:col-span-3">
              <button
                disabled={saving}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm text-slate-950"
              >
                {saving ? "Saving..." : "Create Lead"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Priority</th>
                  <th />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((x) => (
                  <tr key={x.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      {x.customer_name || "-"}
                      <div className="text-xs text-slate-500">
                        {x.phone_number}
                      </div>
                    </td>

                    <td className="px-4 py-3">{x.enquiry_source || "-"}</td>

                    <td className="px-4 py-3">
                      <StatusBadge status={x.enquiry_status}>
                        {x.enquiry_status || "-"}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-3">
                      {x.assigned_to_name || x.assigned_to?.name || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {x.is_high_priority ? "High" : "Normal"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/leads/${x.id}`}
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}

                {!items.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
