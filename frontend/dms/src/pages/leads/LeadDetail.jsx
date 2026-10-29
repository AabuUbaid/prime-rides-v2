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

import { getApiErrorMessage } from "../../utils/errorMessage";

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
      toast.error(getApiErrorMessage(e, "Unable to load lead."));
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
      toast.error(getApiErrorMessage(e, "Unable to update lead."));
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
      toast.error(getApiErrorMessage(e, "Unable to record activity."));
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
      toast.error(getApiErrorMessage(e, "Unable to delete lead."));
    }
  }

  if (!lead) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Lead #{lead.id}</h1>

            <p className="mt-1 text-sm text-slate-500">
              {lead.customer_name || "Unnamed customer"} · {lead.phone_number}
            </p>
          </div>

          <Link
            to="/leads"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Back
          </Link>
        </div>

        <section className="grid gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:grid-cols-2">
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
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
              value={lead.enquiry_status || ""}
              onChange={(e) =>
                setLead({
                  ...lead,
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
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
            />
          </label>

          <div className="text-sm text-slate-600">
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
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm text-slate-950"
            >
              {saving ? "Saving..." : "Save Lead"}
            </button>

            {user?.role === "MASTER" && (
              <button
                onClick={remove}
                className="ml-3 rounded-xl border border-rose-300 px-4 py-2 text-sm text-rose-700"
              >
                Delete
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <h2 className="font-semibold">Activity</h2>

          <div className="mt-3 flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Follow-up note"
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
            />

            <button
              onClick={activity}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm text-slate-950"
            >
              Add
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {(lead.activities || []).map((a) => (
              <div key={a.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <div>{a.note}</div>

                <div className="mt-1 text-xs text-slate-500">
                  {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
                </div>
              </div>
            ))}

            {!(lead.activities || []).length && (
              <div className="text-sm text-slate-500">
                No activities returned.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
