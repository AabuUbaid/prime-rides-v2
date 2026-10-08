import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getInsurance,
  updateInsuranceStatus,
  startInsuranceRenewal,
  updateInsuranceRenewalStatus,
  approveInsuranceRenewal,
} from "../../api/insurance";
import { getApiErrorMessage } from "../../utils/errorMessage";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatStatus(value) {
  if (!value) return "-";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClass(status) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "documents_pending":
      return "bg-amber-100 text-amber-700";
    case "applied":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getExpiryClass(status) {
  switch (status) {
    case "normal":
      return "bg-green-100 text-green-700";
    case "renewal_priority":
      return "bg-amber-100 text-amber-700";
    case "expiring_today":
      return "bg-orange-100 text-orange-700";
    case "expired":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 sm:text-right">
        {value ?? "-"}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </section>
  );
}

export default function InsuranceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [insurance, setInsurance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [policyNumber, setPolicyNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [remark, setRemark] = useState("");

  const [renewalRemark, setRenewalRemark] = useState("");
  const [renewalPolicyNumber, setRenewalPolicyNumber] = useState("");
  const [renewalExpiryDate, setRenewalExpiryDate] = useState("");

  async function loadInsurance() {
    try {
      setLoading(true);
      setError("");

      const response = await getInsurance(id);
      const data = response?.data ?? response;

      setInsurance(data || null);
      setPolicyNumber(data?.policy_number || "");
      setExpiryDate(data?.expiry_date || "");
      setRemark(data?.remark || "");
    } catch (err) {
      setInsurance(null);
      setError(err?.message || "Unable to load Insurance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsurance();
  }, [id]);

  async function handleStatusChange(applicationStatus) {
    try {
      setSaving(true);

      const response = await updateInsuranceStatus(id, {
        application_status: applicationStatus,
        policy_number:
          applicationStatus === "approved" ? policyNumber : undefined,
        expiry_date: applicationStatus === "approved" ? expiryDate : undefined,
        remark,
      });

      const data = response?.data ?? response;

      setInsurance(data || insurance);
      toast.success("Insurance status updated.");
      await loadInsurance();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Unable to update Insurance status."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStartRenewal() {
    try {
      setSaving(true);

      await startInsuranceRenewal(id);

      toast.success("Insurance renewal started.");
      await loadInsurance();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to start renewal."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRenewalStatus(status) {
    try {
      setSaving(true);

      await updateInsuranceRenewalStatus(id, {
        renewal_status: status,
        remark: renewalRemark,
      });

      toast.success("Renewal status updated.");
      await loadInsurance();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to update renewal status."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRenewalApproval() {
    if (!renewalPolicyNumber || !renewalExpiryDate) {
      toast.error(getApiErrorMessage(err, "Unable to approve renewal."));
      return;
    }

    try {
      setSaving(true);

      await approveInsuranceRenewal(id, {
        policy_number: renewalPolicyNumber,
        expiry_date: renewalExpiryDate,
        remark: renewalRemark,
      });

      toast.success("New Insurance policy approved.");
      setRenewalPolicyNumber("");
      setRenewalExpiryDate("");
      setRenewalRemark("");
      await loadInsurance();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to approve renewal."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading Insurance...
        </div>
      </div>
    );
  }

  if (error || !insurance) {
    return (
      <div className="p-6">
        <Link
          to="/finance/insurance"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Insurance
        </Link>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Insurance record not found."}
        </div>
      </div>
    );
  }

  const vehicleName = [
    insurance.vehicle_make,
    insurance.vehicle_model,
    insurance.vehicle_year,
    insurance.vehicle_colour,
  ]
    .filter(Boolean)
    .join(" ");

  const canMoveToDocuments = insurance.application_status === "applied";

  const canApprove = insurance.application_status === "documents_pending";

  const renewalEligible =
    insurance.application_status === "approved" &&
    insurance.days_remaining !== null &&
    insurance.days_remaining <= 30;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/finance/insurance"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Insurance
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            Insurance
          </h1>

          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                insurance.application_status,
              )}`}
            >
              {formatStatus(insurance.application_status)}
            </span>

            {insurance.expiry_status && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getExpiryClass(
                  insurance.expiry_status,
                )}`}
              >
                {formatStatus(insurance.expiry_status)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {insurance.application_status === "approved" && (
            <button
              type="button"
              onClick={() =>
                navigate(`/finance/proformas/new?insurance=${insurance.id}`)
              }
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create Proforma
            </button>
          )}

          {insurance.application_status === "approved" && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/finance/delivery-notes/new?insurance=${insurance.id}`,
                )
              }
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create Delivery Note
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/deals/${insurance.quote}`)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Open Quote
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Customer & Vehicle">
          <DetailRow label="Customer" value={insurance.customer_name} />
          <DetailRow label="Mobile" value={insurance.customer_mobile} />
          <DetailRow label="Vehicle" value={vehicleName} />
          <DetailRow label="Stock ID" value={insurance.vehicle_stock_id} />
          <DetailRow label="Chassis" value={insurance.vehicle_chassis_number} />
          <DetailRow label="Engine" value={insurance.vehicle_engine_number} />
          <DetailRow label="Mileage" value={insurance.vehicle_mileage} />
          <DetailRow label="Payment Method" value={insurance.payment_method} />
        </Section>

        <Section title="Policy">
          <DetailRow label="Policy Number" value={insurance.policy_number} />
          <DetailRow
            label="Expiry Date"
            value={formatDate(insurance.expiry_date)}
          />
          <DetailRow
            label="Days Remaining"
            value={
              insurance.days_remaining !== null &&
              insurance.days_remaining !== undefined
                ? insurance.days_remaining
                : "-"
            }
          />
          <DetailRow
            label="Expiry Status"
            value={formatStatus(insurance.expiry_status)}
          />
          <DetailRow
            label="Renewal Status"
            value={formatStatus(insurance.renewal_status)}
          />
          <DetailRow label="Remark" value={insurance.remark} />
        </Section>

        {insurance.application_status !== "APPROVED" && (
          <Section title="Application Workflow">
            {canMoveToDocuments && (
              <div className="py-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleStatusChange("documents_pending")}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Documents Pending"}
                </button>
              </div>
            )}

            {canApprove && (
              <div className="py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-500">
                      Policy Number
                    </label>
                    <input
                      value={policyNumber}
                      onChange={(event) => setPolicyNumber(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-500">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(event) => setExpiryDate(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm text-gray-500">
                    Remark
                  </label>
                  <textarea
                    value={remark}
                    onChange={(event) => setRemark(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleStatusChange("approved")}
                  className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Approving..." : "Approve Insurance"}
                </button>
              </div>
            )}
          </Section>
        )}

        {insurance.application_status === "approved" && (
          <Section title="Renewal">
            {!renewalEligible ? (
              <div className="py-5 text-sm text-gray-500">
                Renewal is not currently available.
              </div>
            ) : (
              <>
                {!insurance.renewal_status ? (
                  <div className="py-4">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleStartRenewal}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start Renewal
                    </button>
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      Current Renewal Status:{" "}
                      <strong>{formatStatus(insurance.renewal_status)}</strong>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-gray-500">
                          New Policy Number
                        </label>
                        <input
                          value={renewalPolicyNumber}
                          onChange={(event) =>
                            setRenewalPolicyNumber(event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-500">
                          New Expiry Date
                        </label>
                        <input
                          type="date"
                          value={renewalExpiryDate}
                          onChange={(event) =>
                            setRenewalExpiryDate(event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                        />
                      </div>
                    </div>

                    <textarea
                      value={renewalRemark}
                      onChange={(event) => setRenewalRemark(event.target.value)}
                      rows={3}
                      placeholder="Renewal remark"
                      className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      {insurance.renewal_status === "informed_customer" && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleRenewalStatus("applied_new")}
                          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          Applied New
                        </button>
                      )}

                      {insurance.renewal_status === "applied_new" && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleRenewalStatus("follow_up")}
                          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          Follow Up
                        </button>
                      )}

                      {insurance.renewal_status === "follow_up" && (
                        <>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              handleRenewalStatus("not_interested")
                            }
                            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Not Interested
                          </button>
                        </>
                      )}

                      {insurance.renewal_status === "follow_up" && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={handleRenewalApproval}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save New Policy"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        <Section title="Policy History">
          {Array.isArray(insurance.policy_cycles) &&
          insurance.policy_cycles.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {insurance.policy_cycles.map((cycle) => (
                <div key={cycle.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-900">
                      Cycle {cycle.cycle_number}
                    </div>

                    {cycle.is_active && (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-2 grid gap-2 text-sm text-gray-600 md:grid-cols-3">
                    <div>Policy: {cycle.policy_number || "-"}</div>
                    <div>Start: {formatDate(cycle.start_date)}</div>
                    <div>Expiry: {formatDate(cycle.expiry_date)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-5 text-sm text-gray-500">
              No policy history available.
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
