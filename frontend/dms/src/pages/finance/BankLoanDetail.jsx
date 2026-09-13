import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  getBankLoan,
  getBankLoanFollowUps,
  updateBankLoanStatus,
  updateBankLoanApplicationStatus,
  updateBankLoanFinance,
  updateBankLoanPriority,
  createBankLoanFollowUp,
  updateBankLoanApplicationInfo,
  createBankLoanForNewBank,
} from "../../api/bankLoans";

import { getBanks } from "../../api/finance";
const DECISION_STATUSES = ["pending", "approved", "rejected"];

const APPLICATION_STATUSES = [
  "not_submitted",
  "documents_collection",
  "applied",
  "payslip_pending",
  "email_phone_verification",
  "advance_paid",
  "waiting_dda",
  "registration",
  "approved",
  "rejected",
  "completed",
  "change_of_car",
];

const PRIORITIES = ["low", "medium", "high"];

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getDetail(response) {
  return response?.data ?? response;
}

function BankLoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [decisionStatus, setDecisionStatus] = useState("");
  const [applicationStatus, setApplicationStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [banks, setBanks] = useState([]);
  const [newBankId, setNewBankId] = useState("");
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [requestedFinance, setRequestedFinance] = useState("");
  const [approvedFinance, setApprovedFinance] = useState("");

  const [applicationNumber, setApplicationNumber] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [relationshipManager, setRelationshipManager] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [expectedApprovalDate, setExpectedApprovalDate] = useState("");
  const [applicationRemark, setApplicationRemark] = useState("");

  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [followUps, setFollowUps] = useState([]);

  async function loadBanks() {
    try {
      setLoadingBanks(true);

      const response = await getBanks();

      const data = Array.isArray(response?.data) ? response.data : [];

      setBanks(data);
    } catch (err) {
      console.error("Failed to load banks:", err);
      toast.error(err?.message || "Failed to load banks.");
    } finally {
      setLoadingBanks(false);
    }
  }

  async function loadLoan() {
    try {
      setLoading(true);
      setError("");

      const [loanResponse, followUpResponse] = await Promise.all([
        getBankLoan(id),
        getBankLoanFollowUps(id),
      ]);

      const data = getDetail(loanResponse);

      setLoan(data);

      setDecisionStatus(data?.status ?? "");
      setApplicationStatus(data?.application_status ?? "");
      setPriority(data?.priority ?? "");

      setRequestedFinance(data?.requested_finance ?? "");
      setApprovedFinance(data?.approved_finance ?? "");

      setApplicationNumber(data?.application_number ?? "");
      setBankReference(data?.bank_reference ?? "");
      setRelationshipManager(data?.relationship_manager ?? "");
      setApplicationDate(data?.application_date ?? "");
      setExpectedApprovalDate(data?.expected_approval_date ?? "");
      setApplicationRemark(data?.remark ?? "");

      setFollowUps(
        Array.isArray(followUpResponse)
          ? followUpResponse
          : (followUpResponse?.data ?? []),
      );
    } catch (err) {
      console.error("Failed to load bank loan:", err);

      setError(err?.message || "Failed to load bank loan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoan();
    loadBanks();
  }, [id]);

  async function saveDecisionStatus() {
    try {
      setSaving(true);

      await updateBankLoanStatus(id, decisionStatus);

      await loadLoan();
      toast.success("Decision status updated.");
    } catch (err) {
      toast.error(err?.message || "Failed to update decision status.");
    } finally {
      setSaving(false);
    }
  }

  async function saveApplicationStatus() {
    try {
      setSaving(true);

      await updateBankLoanApplicationStatus(id, applicationStatus);

      await loadLoan();
      toast.success("Application status updated.");
    } catch (err) {
      toast.error(err?.message || "Failed to update application status.");
    } finally {
      setSaving(false);
    }
  }

  async function savePriority() {
    try {
      setSaving(true);

      await updateBankLoanPriority(id, priority);

      await loadLoan();
      toast.success("Priority updated.");
    } catch (err) {
      toast.error(err?.message || "Failed to update priority.");
    } finally {
      setSaving(false);
    }
  }

  async function saveFinance() {
    try {
      setSaving(true);

      await updateBankLoanFinance(id, {
        requested_finance: requestedFinance,
        approved_finance: approvedFinance,
      });

      await loadLoan();
      toast.success("Finance details updated.");
    } catch (err) {
      toast.error(err?.message || "Failed to update finance details.");
    } finally {
      setSaving(false);
    }
  }

  async function saveApplicationInfo(event) {
    event.preventDefault();

    try {
      setSaving(true);

      await updateBankLoanApplicationInfo(id, {
        application_number: applicationNumber,
        bank_reference: bankReference,
        relationship_manager: relationshipManager,
        application_date: applicationDate || null,
        expected_approval_date: expectedApprovalDate || null,
        remark: applicationRemark,
      });

      await loadLoan();
      toast.success("Application information updated.");
    } catch (err) {
      toast.error(err?.message || "Failed to update application information.");
    } finally {
      setSaving(false);
    }
  }

  async function changeBank() {
    if (decisionStatus !== "rejected") {
      toast.error("Change Bank is available only for rejected bank loans.");
      return;
    }

    if (!newBankId) {
      toast.error("Please select a bank.");
      return;
    }

    const currentBankId = loan?.bank_id ?? loan?.bank?.id ?? "";

    if (currentBankId && String(currentBankId) === String(newBankId)) {
      toast.error("Please select a different bank.");
      return;
    }

    try {
      setSaving(true);

      const response = await createBankLoanForNewBank(id, newBankId);

      const data = response?.data ?? response;

      const newLoanId =
        data?.id ??
        data?.bank_loan_id ??
        data?.bankLoan?.id ??
        data?.bank_loan?.id;

      toast.success("New bank loan created.");

      if (newLoanId) {
        navigate(`/finance/bank-loans/${newLoanId}`);
        return;
      }

      await loadLoan();
      setNewBankId("");
    } catch (err) {
      toast.error(
        err?.message || "Failed to create bank loan for the new bank.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addFollowUp(event) {
    event.preventDefault();

    if (!followUpNote.trim()) {
      toast.error("Follow-up note is required.");
      return;
    }

    try {
      setSaving(true);

      await createBankLoanFollowUp(id, {
        note: followUpNote.trim(),
        follow_up_date: followUpDate || null,
      });

      setFollowUpNote("");
      setFollowUpDate("");

      await loadLoan();
      toast.success("Follow-up added.");
    } catch (err) {
      toast.error(err?.message || "Failed to add follow-up.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl rounded-lg border border-gray-200 bg-white p-6">
          Loading bank loan...
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/finance/bank-loans"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            ← Back to Bank Loans
          </Link>

          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
            {error || "Bank loan not found."}
          </div>
        </div>
      </div>
    );
  }

  const customerName = loan.customer_name || loan.customer?.name || "-";

  const customerMobile = loan.customer_mobile || loan.customer?.mobile || "-";

  const vehicleName = [
    loan.vehicle_make || loan.car?.make || "",
    loan.vehicle_model || loan.car?.model || "",
    loan.vehicle_variant || loan.car?.variant || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              to="/finance/bank-loans"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              ← Back to Bank Loans
            </Link>

            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              Bank Loan #{loan.id}
            </h1>

            <p className="mt-1 text-sm text-gray-500">{customerName}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/finance/bank-loans")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Customer
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{customerName}</dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Mobile
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{customerMobile}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Vehicle Snapshot
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Vehicle
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicleName || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Stock ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {loan.vehicle_stock_id || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Year
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {loan.vehicle_year || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Colour
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {loan.vehicle_colour || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Mileage
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {loan.vehicle_mileage ?? "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Chassis
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {loan.vehicle_chassis_number || "-"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">
                  Engine
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {loan.vehicle_engine_number || "-"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Decision Status
                </label>

                <select
                  value={decisionStatus}
                  onChange={(event) => setDecisionStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {DECISION_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {formatValue(option)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={saving}
                  onClick={saveDecisionStatus}
                  className="mt-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Save
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Application Status
                </label>

                <select
                  value={applicationStatus}
                  onChange={(event) => setApplicationStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {APPLICATION_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {formatValue(option)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={saving}
                  onClick={saveApplicationStatus}
                  className="mt-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Save
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {PRIORITIES.map((option) => (
                    <option key={option} value={option}>
                      {formatValue(option)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={saving}
                  onClick={savePriority}
                  className="mt-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Finance
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Requested Finance
                </label>

                <input
                  type="number"
                  value={requestedFinance}
                  onChange={(event) => setRequestedFinance(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Approved Finance
                </label>

                <input
                  type="number"
                  value={approvedFinance}
                  onChange={(event) => setApprovedFinance(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Selling Price
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(loan.selling_price)}
                </p>

                <p className="mt-3 text-xs font-medium uppercase text-gray-500">
                  Evaluation
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(loan.evaluation)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={saveFinance}
              className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Save Finance
            </button>
          </section>
        </div>

        {decisionStatus === "rejected" && (
          <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Change Bank
            </h2>

            <p className="mb-4 text-sm text-gray-600">
              This bank loan was rejected. Select another bank to create a new
              bank-loan application for the same deal.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Current Bank
                </label>

                <div className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                  {loan?.bank_name || loan?.bank?.name || loan?.bank || "-"}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  New Bank
                </label>

                <select
                  value={newBankId}
                  onChange={(event) => setNewBankId(event.target.value)}
                  disabled={saving || loadingBanks}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingBanks ? "Loading banks..." : "Select a bank"}
                  </option>

                  {banks
                    .filter((bank) => {
                      const currentBankId =
                        loan?.bank_id ?? loan?.bank?.id ?? "";

                      return (
                        !currentBankId ||
                        String(bank.id) !== String(currentBankId)
                      );
                    })
                    .map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={changeBank}
                  disabled={saving || loadingBanks || !newBankId}
                  className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Change Bank"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Application Information
          </h2>

          <form
            onSubmit={saveApplicationInfo}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Application Number
              </label>

              <input
                type="text"
                value={applicationNumber}
                onChange={(event) => setApplicationNumber(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bank Reference
              </label>

              <input
                type="text"
                value={bankReference}
                onChange={(event) => setBankReference(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Relationship Manager
              </label>

              <input
                type="text"
                value={relationshipManager}
                onChange={(event) => setRelationshipManager(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Application Date
              </label>

              <input
                type="date"
                value={applicationDate || ""}
                onChange={(event) => setApplicationDate(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Expected Approval Date
              </label>

              <input
                type="date"
                value={expectedApprovalDate || ""}
                onChange={(event) =>
                  setExpectedApprovalDate(event.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Remark
              </label>

              <textarea
                value={applicationRemark}
                onChange={(event) => setApplicationRemark(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Save Application Information
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Follow-ups
          </h2>

          <form
            onSubmit={addFollowUp}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Note
              </label>

              <textarea
                value={followUpNote}
                onChange={(event) => setFollowUpNote(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Enter follow-up note..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Follow-up Date
              </label>

              <input
                type="date"
                value={followUpDate}
                onChange={(event) => setFollowUpDate(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={saving}
                className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Add Follow-up
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {followUps.length === 0 && (
              <p className="text-sm text-gray-500">No follow-ups recorded.</p>
            )}

            {followUps.map((followUp) => (
              <div
                key={followUp.id}
                className="rounded-md border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-gray-900">
                    {followUp.note || "-"}
                  </p>

                  <span className="text-xs text-gray-500">
                    {followUp.follow_up_date || "-"}
                  </span>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Added by:{" "}
                  <span className="font-medium text-gray-700">
                    {followUp.created_by_name || "-"}
                  </span>
                  {" · "}
                  {followUp.created_at
                    ? new Date(followUp.created_at).toLocaleString()
                    : "-"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default BankLoanDetail;
