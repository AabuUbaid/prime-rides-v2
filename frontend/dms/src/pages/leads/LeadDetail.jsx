import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  addLeadActivity,
  deleteLead,
  getLead,
  updateLead,
} from "../../api/leads";
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

export default function LeadDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const manage = user?.role === "MASTER" || user?.role === "ADMIN";

  const [lead, setLead] = useState(null);
  const [staff, setStaff] = useState([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const response = await getLead(id);
      const data = response?.data || response;

      setLead(data);

      const staffResponse = await getStaff().catch(() => ({
        data: [],
      }));

      setStaff(
        Array.isArray(staffResponse?.data)
          ? staffResponse.data
          : Array.isArray(staffResponse)
            ? staffResponse
            : [],
      );
    } catch (e) {
      toast.error(e?.message || "Unable to load lead.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save() {
    if (!lead) return;

    try {
      setSaving(true);

      const payload = {
        enquiry_source: lead.enquiry_source,
        enquiry_status: lead.enquiry_status,
        purpose: lead.purpose,
        notes: lead.notes,
        insurance: lead.insurance,
        type_of_car: lead.type_of_car,
        brand: lead.brand,
        mode_of_payment: lead.mode_of_payment,
        salary: lead.salary,
        date_of_birth: lead.date_of_birth,
        lead_from: lead.lead_from,
      };

      if (manage) {
        payload.assigned_to = lead.assigned_to?.id ?? lead.assigned_to ?? null;
      }

      await updateLead(id, payload);

      toast.success("Lead updated");

      await load();
    } catch (e) {
      toast.error(e?.message || "Unable to update lead.");
    } finally {
      setSaving(false);
    }
  }

  async function activity() {
    const value = note.trim();

    if (!value) return;

    try {
      await addLeadActivity(id, value);

      setNote("");

      toast.success("Activity recorded");

      await load();
    } catch (e) {
      toast.error(e?.message || "Unable to record activity.");
    }
  }

  async function remove() {
    if (user?.role !== "MASTER" || !window.confirm("Delete this lead?")) {
      return;
    }

    try {
      await deleteLead(id);
      window.location.href = "/leads";
    } catch (e) {
      toast.error(e?.message || "Unable to delete lead.");
    }
  }

  if (!lead) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Lead #{lead.id}</h1>

            <p className="mt-1 text-sm text-gray-500">
              {lead.customer_name || "Unnamed customer"} · {lead.phone_number}
            </p>
          </div>

          <Link
            to="/leads"
            className="rounded-lg border bg-white px-4 py-2 text-sm"
          >
            Back
          </Link>
        </div>

        <section className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2">
          {manage && (
            <label className="text-sm font-medium">
              Assigned Staff
              <select
                value={lead.assigned_to?.id ?? lead.assigned_to ?? ""}
                onChange={(e) =>
                  setLead({
                    ...lead,
                    assigned_to: e.target.value || null,
                  })
                }
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
              >
                <option value="">Unassigned</option>

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

          <label className="text-sm font-medium">
            Source
            <select
              value={lead.enquiry_source || ""}
              onChange={(e) =>
                setLead({
                  ...lead,
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
              value={lead.enquiry_status || ""}
              onChange={(e) =>
                setLead({
                  ...lead,
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

          <label className="text-sm font-medium md:col-span-2">
            Notes
            <textarea
              value={lead.notes || ""}
              onChange={(e) =>
                setLead({
                  ...lead,
                  notes: e.target.value,
                })
              }
              rows={5}
              className="mt-2 w-full rounded-lg border px-3 py-2.5"
            />
          </label>

          <div className="text-sm text-gray-600">
            Last activity:{" "}
            {lead.last_activity_at
              ? new Date(lead.last_activity_at).toLocaleString()
              : "-"}
            <div className="mt-2">
              Priority: <b>{lead.is_high_priority ? "High" : "Normal"}</b>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
            >
              {saving ? "Saving..." : "Save Lead"}
            </button>

            {user?.role === "MASTER" && (
              <button
                onClick={remove}
                className="ml-3 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Activity</h2>

          <div className="mt-3 flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Follow-up note"
              className="flex-1 rounded-lg border px-3 py-2.5 text-sm"
            />

            <button
              onClick={activity}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
            >
              Add
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {(lead.activities || []).map((a) => (
              <div key={a.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                <div>{a.note}</div>

                <div className="mt-1 text-xs text-gray-500">
                  {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
                </div>
              </div>
            ))}

            {!(lead.activities || []).length && (
              <div className="text-sm text-gray-500">
                No activities returned.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
