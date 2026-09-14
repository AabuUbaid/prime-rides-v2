import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { createLead, getLeads } from "../../api/leads";
import { getStaff } from "../../api/staff";
import { useAuth } from "../../context/AuthContext";

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
      toast.error(e?.message || "Unable to load leads.");
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
      toast.error(e?.message || "Unable to create lead.");
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Leads</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sales Staff are automatically assigned their own leads by the
              backend.
            </p>
          </div>

          <button
            onClick={() => setShow((v) => !v)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
          >
            {show ? "Close" : "New Lead"}
          </button>
        </div>

        <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="rounded-lg border px-3 py-2.5"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border px-3 py-2.5"
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
            className="rounded-lg border px-3 py-2.5"
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
              className="rounded-lg border px-3 py-2.5"
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
              className="rounded-lg border bg-white px-3 py-2.5 text-sm"
            >
              Clear Filters
            </button>
          )}

          {user?.role !== "SALES_STAFF" && (
            <div className="md:col-span-4">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border bg-white px-3 py-2 text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {show && (
          <form
            onSubmit={save}
            className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-3"
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
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
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
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
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
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
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
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
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
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
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
                  className="mt-2 w-full rounded-lg border px-3 py-2.5"
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
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
              />
            </label>

            <div className="md:col-span-3">
              <button
                disabled={saving}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
              >
                {saving ? "Saving..." : "Create Lead"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Priority</th>
                  <th />
                </tr>
              </thead>

              <tbody className="divide-y">
                {items.map((x) => (
                  <tr key={x.id}>
                    <td className="px-4 py-3">
                      {x.customer_name || "-"}
                      <div className="text-xs text-gray-500">
                        {x.phone_number}
                      </div>
                    </td>

                    <td className="px-4 py-3">{x.enquiry_source || "-"}</td>

                    <td className="px-4 py-3">{x.enquiry_status || "-"}</td>

                    <td className="px-4 py-3">
                      {x.assigned_to_name || x.assigned_to?.name || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {x.is_high_priority ? "High" : "Normal"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link to={`/leads/${x.id}`} className="font-medium">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}

                {!items.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-gray-500"
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
