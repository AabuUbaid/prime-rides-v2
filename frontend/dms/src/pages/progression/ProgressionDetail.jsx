import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { getBalanceSheets } from "../../api/balanceSheets";
import { getInsurances, createInsurance } from "../../api/insurance";
import { getRtaRecords } from "../../api/rta";
import {
  advanceProgression,
  getProgression,
  updateProgression,
  getRegistrationDocuments,
  downloadRegistrationDocument,
} from "../../api/progression";
import { getProformas } from "../../api/proforma";
import { getDeliveryNotes } from "../../api/deliveryNotes";
import { useAuth } from "../../context/AuthContext";

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Fujairah",
  "Ras Al Khaimah",
  "Umm Al Quwain",
];

const DISPLAY_STAGES = [
  "evaluation",
  "passing",
  "insurance",
  "registration",
  "delivery_video",
  "completed",
];

const DISPLAY_LABELS = {
  evaluation: "Evaluation",
  passing: "Passing",
  insurance: "Insurance",
  registration: "Registration",
  delivery_video: "Delivery Video",
  completed: "Completed",
};

function getResponseData(response) {
  const body = response ?? {};

  return Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body?.results)
      ? body.results
      : Array.isArray(body)
        ? body
        : [];
}

/*
 * The backend has additional internal stages:
 *
 * evaluation
 * passing
 * dubai_passing
 * registration_passing
 * insurance
 * registration
 * delivery_video
 * completed
 *
 * The UI intentionally displays:
 *
 * Evaluation
 * Passing
 * Insurance
 * Registration
 * Delivery Video
 * Completed
 *
 * Therefore this function converts the backend current_stage
 * into the visible completed checklist.
 */
function getBackendCompletedStages(currentStage, insuranceApproved = false) {
  switch (currentStage) {
    case "passing":
    case "dubai_passing":
      return {
        evaluation: true,
      };

    case "registration_passing":
      return {
        evaluation: true,
        passing: true,
      };

    case "insurance":
      return {
        evaluation: true,
        passing: true,
        ...(insuranceApproved ? { insurance: true } : {}),
      };
    case "registration":
      return {
        evaluation: true,
        passing: true,
        insurance: true,
      };

    case "delivery_video":
      return {
        evaluation: true,
        passing: true,
        insurance: true,
        registration: true,
      };

    case "completed":
      return {
        evaluation: true,
        passing: true,
        insurance: true,
        registration: true,
        delivery_video: true,
        completed: true,
      };

    case "evaluation":
    default:
      return {};
  }
}

export default function ProgressionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const manage = user?.role === "MASTER" || user?.role === "ADMIN";

  const [p, setP] = useState(null);

  const [form, setForm] = useState({
    registration_emirate: "",
    remark: "",
  });

  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const [checkedStages, setCheckedStages] = useState({});

  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [insuranceRecord, setInsuranceRecord] = useState(null);

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  const [saleRtaRecord, setSaleRtaRecord] = useState(null);

  const [registrationDocumentsLoading, setRegistrationDocumentsLoading] =
    useState(false);
  const [registrationDocuments, setRegistrationDocuments] = useState(null);
  const [showRegistrationDocumentsModal, setShowRegistrationDocumentsModal] =
    useState(false);

  const [downloadingRegistrationDocument, setDownloadingRegistrationDocument] =
    useState("");

  const [deliveryDocumentsLoading, setDeliveryDocumentsLoading] =
    useState(false);

  const [proformaRecord, setProformaRecord] = useState(null);
  const [deliveryNoteRecord, setDeliveryNoteRecord] = useState(null);

  const [showDeliveryCompletionModal, setShowDeliveryCompletionModal] =
    useState(false);

  const [showPassingModal, setShowPassingModal] = useState(false);

  const [passingChecks, setPassingChecks] = useState({
    dubai: false,
    emirate: false,
  });

  async function load() {
    try {
      const d = (await getProgression(id))?.data;

      setP(d);

      setForm({
        registration_emirate: d?.registration_emirate || "",
        remark: d?.remark || "",
      });

      let insuranceApproved = false;

      if (d?.quote) {
        try {
          const insuranceResponse = await getInsurances({
            quote_id: d.quote,
          });

          const insuranceRecords = getResponseData(insuranceResponse);

          const insurance =
            insuranceRecords.find(
              (record) => String(record.quote) === String(d.quote),
            ) || null;

          setInsuranceRecord(insurance);

          const insuranceStatus = String(
            insurance?.application_status || insurance?.status || "unknown",
          ).toLowerCase();

          insuranceApproved =
            insuranceStatus === "approved" || insuranceStatus === "completed";
        } catch {
          setInsuranceRecord(null);
        }
      }

      setCheckedStages(
        getBackendCompletedStages(d?.current_stage, insuranceApproved),
      );
    } catch (e) {
      toast.error(e?.message || "Unable to load Progression.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save() {
    try {
      setSaving(true);

      const response = await updateProgression(id, form);
      const updated = response?.data;

      setP(updated);

      const insuranceStatus = String(
        insuranceRecord?.application_status ||
          insuranceRecord?.status ||
          "unknown",
      ).toLowerCase();

      setCheckedStages(
        getBackendCompletedStages(
          updated?.current_stage,
          insuranceStatus === "approved" || insuranceStatus === "completed",
        ),
      );

      toast.success("Progression updated.");
    } catch (e) {
      toast.error(e?.message || "Unable to update Progression.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * Backend is the source of truth.
   *
   * This function advances exactly one backend stage.
   */
  async function advanceStage(payload = {}) {
    try {
      setAdvancing(true);

      const response = await advanceProgression(id, payload);

      const updated = response?.data;

      if (!updated) {
        throw new Error("Progression response is missing.");
      }

      setP(updated);

      setForm({
        registration_emirate: updated?.registration_emirate || "",
        remark: updated?.remark || "",
      });

      let insuranceApproved = false;

      if (updated?.quote) {
        try {
          const insuranceResponse = await getInsurances({
            quote_id: updated.quote,
          });

          const insuranceRecords = getResponseData(insuranceResponse);

          const insurance =
            insuranceRecords.find(
              (record) => String(record.quote) === String(updated.quote),
            ) || null;

          setInsuranceRecord(insurance);

          const insuranceStatus = String(
            insurance?.application_status || insurance?.status || "unknown",
          ).toLowerCase();

          insuranceApproved =
            insuranceStatus === "approved" || insuranceStatus === "completed";
        } catch {
          insuranceApproved = false;
        }
      }

      setCheckedStages(
        getBackendCompletedStages(updated?.current_stage, insuranceApproved),
      );

      return updated;
    } catch (e) {
      toast.error(e?.message || "Unable to advance Progression.");

      return null;
    } finally {
      setAdvancing(false);
    }
  }

  /*
   * Evaluation
   */
  async function handleEvaluation() {
    if (p?.current_stage !== "evaluation") {
      return;
    }

    if (!p?.registration_emirate) {
      toast.error(
        "Select the Registration Emirate before completing Evaluation.",
      );
      return;
    }

    const updated = await advanceStage();

    if (updated) {
      toast.success("Evaluation completed.");
    }
  }

  /*
   * Passing
   *
   * Dubai:
   *   Passing -> Insurance
   *
   * Non-Dubai:
   *   Evaluation -> Dubai Passing
   *   Dubai Passing -> Registration Passing
   *   Registration Passing -> Insurance
   *
   * We keep the two-check confirmation UI for
   * the non-Dubai route.
   */
  async function confirmPassing() {
    if (!passingChecks.dubai || !passingChecks.emirate) {
      toast.error(
        `Both Dubai Passing and ${p.registration_emirate} Passing must be completed.`,
      );
      return;
    }

    if (p.current_stage === "dubai_passing") {
      const first = await advanceStage();

      if (!first) {
        return;
      }

      const second = await advanceStage();

      if (!second) {
        return;
      }

      setShowPassingModal(false);

      toast.success("Passing completed.");

      return;
    }

    if (p.current_stage === "registration_passing") {
      const updated = await advanceStage();

      if (!updated) {
        return;
      }

      setShowPassingModal(false);

      toast.success("Passing completed.");
    }
  }

  /*
   * Insurance
   */
  async function openInsurance() {
    if (!p?.quote) {
      toast.error("Quote information is missing.");
      return;
    }

    try {
      setInsuranceLoading(true);

      const response = await getInsurances({
        quote_id: p.quote,
      });

      const records = getResponseData(response);

      const insurance =
        records.find((record) => String(record.quote) === String(p.quote)) ||
        null;

      setInsuranceRecord(insurance);
      setShowInsuranceModal(false);

      // -------------------------------------------------
      // Existing Insurance
      // -------------------------------------------------
      if (insurance?.id) {
        navigate(`/finance/insurance/${insurance.id}`);
        return;
      }

      // -------------------------------------------------
      // Insurance does not exist yet
      // Create it directly from this Quote
      // -------------------------------------------------
      const createResponse = await createInsurance(p.quote);

      if (createResponse?.success === false) {
        throw new Error(
          createResponse.message || "Unable to create Insurance.",
        );
      }

      const createdInsurance = createResponse?.data ?? createResponse;

      const insuranceId = createdInsurance?.id;

      if (!insuranceId) {
        throw new Error(
          "Insurance was created but no Insurance ID was returned.",
        );
      }

      setInsuranceRecord(createdInsurance);

      toast.success("Insurance created successfully.");

      navigate(`/finance/insurance/${insuranceId}`);
    } catch (e) {
      toast.error(e?.message || "Unable to open the customer's Insurance.");
    } finally {
      setInsuranceLoading(false);
    }
  }

  function getInsuranceStatus() {
    if (!insuranceRecord) {
      return "not_created";
    }

    return String(
      insuranceRecord.application_status || insuranceRecord.status || "unknown",
    ).toLowerCase();
  }

  function getInsuranceStatusLabel() {
    const status = getInsuranceStatus();

    const labels = {
      not_created: "Not Created",
      pending: "Pending",
      draft: "Draft",
      submitted: "Submitted",
      under_review: "Under Review",
      approved: "Approved",
      rejected: "Rejected",
      cancelled: "Cancelled",
      completed: "Completed",
    };

    return labels[status] || status;
  }

  function getInsuranceStatusClass() {
    const status = getInsuranceStatus();

    if (status === "approved" || status === "completed") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "rejected" || status === "cancelled") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (status === "not_created") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  function goToInsurance() {
    setShowInsuranceModal(false);

    if (insuranceRecord?.id) {
      navigate(`/finance/insurance/${insuranceRecord.id}`);
      return;
    }

    navigate(`/finance/insurance?quote_id=${encodeURIComponent(p.quote)}`);
  }

  async function handleInsuranceContinue() {
    const status = getInsuranceStatus();

    if (status === "approved") {
      setShowInsuranceModal(false);

      if (p.current_stage === "insurance") {
        const updated = await advanceStage();

        if (updated) {
          toast.success(
            "Insurance approved. Progression moved to Registration.",
          );
        }
      }

      return;
    }

    goToInsurance();
  }

  /*
   * Registration
   */
  async function openRegistrationDocuments() {
    if (!p?.quote) {
      toast.error("Quote information is missing.");
      return;
    }

    if (p.current_stage !== "insurance" && p.current_stage !== "registration") {
      toast.error("Registration is not available at the current stage.");
      return;
    }

    try {
      setRegistrationDocumentsLoading(true);

      if (p.current_stage === "insurance") {
        const insuranceResponse = await getInsurances({
          quote_id: p.quote,
        });

        const insuranceRecords = getResponseData(insuranceResponse);

        const insurance =
          insuranceRecords.find(
            (record) => String(record.quote) === String(p.quote),
          ) || null;

        setInsuranceRecord(insurance);

        const insuranceStatus = String(
          insurance?.application_status || insurance?.status || "unknown",
        ).toLowerCase();

        if (insuranceStatus !== "approved" && insuranceStatus !== "completed") {
          toast.error(
            "Insurance must be approved before Registration can proceed.",
          );
          return;
        }
      }

      const response = await getRegistrationDocuments(id);

      setRegistrationDocuments(response);
      setShowRegistrationDocumentsModal(true);
    } catch (e) {
      toast.error(
        e?.message || "Unable to load the Registration Preparation checklist.",
      );
    } finally {
      setRegistrationDocumentsLoading(false);
    }
  }

  async function openRegistrationBalanceSheet() {
    if (!p?.quote) {
      toast.error("Quote information is missing.");
      return;
    }

    try {
      setBalanceLoading(true);

      const [balanceResponse, rtaResponse] = await Promise.all([
        getBalanceSheets({
          quote_id: p.quote,
        }),
        getRtaRecords({
          quote_id: p.quote,
          record_type: "SALE",
        }),
      ]);

      const balanceRecords = getResponseData(balanceResponse);
      const rtaRecords = getResponseData(rtaResponse);

      const sheet = balanceRecords[0] || null;
      const saleRta = rtaRecords[0] || null;

      setBalanceSheet(sheet);
      setSaleRtaRecord(saleRta);
      setShowBalanceModal(true);
    } catch (e) {
      toast.error(e?.message || "Unable to load the Balance Sheet.");
    } finally {
      setBalanceLoading(false);
    }
  }

  function continueFromRegistrationDocuments() {
    if (!registrationDocuments?.registration_documents_ready) {
      toast.error("Required registration documents are still missing.");
      return;
    }

    setShowRegistrationDocumentsModal(false);
    openRegistrationBalanceSheet();
  }

  async function handleRegistrationDocumentDownload(document) {
    if (!document?.id || !document?.source) {
      toast.error("Document information is incomplete.");
      return;
    }

    const loadingKey = `${document.source}:${document.id}`;

    try {
      setDownloadingRegistrationDocument(loadingKey);

      const blob = await downloadRegistrationDocument(
        id,
        document.source,
        document.id,
      );

      if (!(blob instanceof Blob)) {
        throw new Error("Invalid document response.");
      }

      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");

      anchor.href = url;
      anchor.download =
        `${document.file_name || document.document_label || "document"}`.replace(
          /\.[^/.]+$/,
          "",
        ) + ".pdf";

      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e?.message || "Unable to download the document.");
    } finally {
      setDownloadingRegistrationDocument("");
    }
  }

  /*
   * Registration completion.
   *
   * Backend itself performs the Balance Sheet
   * gate again, so this is safe even if the
   * frontend data is stale.
   */
  function continueToRtaSale() {
    if (!balanceSheet) {
      toast.error("Balance Sheet not found.");
      return;
    }

    if (balanceSheet.balance_status !== "settled") {
      toast.error(
        "Balance Sheet is not settled yet. Complete the Balance Sheet before opening the RTA Sale.",
      );
      return;
    }

    if (!p?.quote) {
      toast.error("Quote information is missing.");
      return;
    }

    setShowBalanceModal(false);

    navigate(
      `/rta/sale/${encodeURIComponent(
        p.quote,
      )}?progression_id=${encodeURIComponent(id)}`,
    );
  }

  async function markRegistrationCompleted() {
    if (!saleRtaRecord?.id) {
      toast.error("Sale RTA record not found.");
      return;
    }

    const updated = await advanceStage();

    if (updated) {
      setShowBalanceModal(false);
      toast.success("Registration completed.");
    }
  }
  /*
   * Delivery Video -> Completed
   */
  async function openDeliveryCompletionModal() {
    if (p?.current_stage !== "delivery_video") {
      return;
    }

    if (!p?.quote) {
      toast.error("Quote information is missing.");
      return;
    }

    try {
      setDeliveryDocumentsLoading(true);

      let insurance = insuranceRecord;

      if (!insurance?.id) {
        const insuranceResponse = await getInsurances({
          quote_id: p.quote,
        });

        const insuranceRecords = getResponseData(insuranceResponse);

        insurance =
          insuranceRecords.find(
            (record) => String(record.quote) === String(p.quote),
          ) || null;

        setInsuranceRecord(insurance);
      }

      const [proformaResponse, deliveryNoteResponse] = await Promise.all([
        getProformas({
          quote_id: p.quote,
        }),
        getDeliveryNotes({
          quote_id: p.quote,
        }),
      ]);

      const proformas = getResponseData(proformaResponse);

      const deliveryNotes = getResponseData(deliveryNoteResponse);

      const proforma =
        proformas.find((record) => String(record.quote) === String(p.quote)) ||
        null;

      const deliveryNote =
        deliveryNotes.find(
          (record) => String(record.quote) === String(p.quote),
        ) || null;

      setProformaRecord(proforma);
      setDeliveryNoteRecord(deliveryNote);
      setShowDeliveryCompletionModal(true);
    } catch (e) {
      toast.error(e?.message || "Unable to load Delivery Video requirements.");
    } finally {
      setDeliveryDocumentsLoading(false);
    }
  }

  async function handleStageClick(stage) {
    if (advancing || insuranceLoading || balanceLoading) {
      return;
    }

    /*
     * Only the backend current_stage can determine
     * which action is currently valid.
     */

    if (stage === "evaluation") {
      await handleEvaluation();
      return;
    }

    if (stage === "passing") {
      /*
       * Dubai route:
       * evaluation -> passing
       * passing -> insurance
       */
      if (p.current_stage === "passing") {
        const updated = await advanceStage();

        if (updated) {
          toast.success("Passing completed.");
        }

        return;
      }

      /*
       * Non-Dubai route.
       *
       * Backend may currently be at either
       * Dubai Passing or Registration Passing.
       */
      if (
        p.current_stage === "dubai_passing" ||
        p.current_stage === "registration_passing"
      ) {
        setPassingChecks({
          dubai: false,
          emirate: false,
        });

        setShowPassingModal(true);

        return;
      }

      return;
    }

    if (stage === "insurance") {
      await openInsurance();
      return;
    }

    if (stage === "registration") {
      await openRegistrationDocuments();
      return;
    }

    if (stage === "delivery_video") {
      await openDeliveryCompletionModal();
      return;
    }
    if (stage === "completed") {
      return;
    }
  }

  const backendStageLabel = useMemo(() => {
    if (!p?.current_stage) {
      return "-";
    }

    if (
      p.current_stage === "dubai_passing" ||
      p.current_stage === "registration_passing"
    ) {
      return "Passing";
    }

    return DISPLAY_LABELS[p.current_stage] || p.current_stage;
  }, [p]);

  const activeDisplayStage = useMemo(() => {
    if (!p?.current_stage) {
      return null;
    }

    if (
      p.current_stage === "dubai_passing" ||
      p.current_stage === "registration_passing"
    ) {
      return "passing";
    }

    return p.current_stage;
  }, [p]);

  if (!p) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Progression #{p.id}</h1>

            <p className="mt-1 text-sm text-gray-500">
              Quote {p.quote_number || p.quote || "-"}
            </p>
          </div>

          <Link
            to="/progression"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back
          </Link>
        </div>

        <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-4">
          <div>
            <small className="text-xs text-gray-500">Vehicle</small>
            <div className="mt-1 font-medium">{p.vehicle_stock_id || "-"}</div>
          </div>

          <div>
            <small className="text-xs text-gray-500">Customer</small>
            <div className="mt-1 font-medium">{p.customer_name || "-"}</div>
          </div>

          <div>
            <small className="text-xs text-gray-500">Seller</small>
            <div className="mt-1 font-medium">{p.seller_name || "-"}</div>
          </div>

          <div>
            <small className="text-xs text-gray-500">Bank / Payment</small>
            <div className="mt-1 font-medium">
              {p.bank_name || p.payment_method || "-"}
            </div>
          </div>

          <div>
            <small className="text-xs text-gray-500">Selling Price</small>
            <div className="mt-1 font-medium">AED {p.selling_price ?? "-"}</div>
          </div>

          <div>
            <small className="text-xs text-gray-500">
              Registration Emirate
            </small>
            <div className="mt-1 font-medium">
              {p.registration_emirate || "-"}
            </div>
          </div>

          <div>
            <small className="text-xs text-gray-500">Current Stage</small>
            <div className="mt-1 font-medium">{backendStageLabel}</div>
          </div>

          <div>
            <small className="text-xs text-gray-500">Status</small>
            <div
              className={`mt-1 font-medium ${
                p.status === "active"
                  ? "text-green-700"
                  : p.status === "completed"
                    ? "text-blue-700"
                    : "text-gray-600"
              }`}
            >
              {p.status || "-"}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">
                Progression Checklist
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Each action is persisted by the backend Progression state
                machine.
              </p>
            </div>

            <div className="text-xs text-gray-400">
              {advancing ? "Updating..." : `Current: ${backendStageLabel}`}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex min-w-[980px] items-center">
              {DISPLAY_STAGES.map((stage, index) => {
                const checked = Boolean(checkedStages[stage]);

                const isCurrent = activeDisplayStage === stage;

                const isSpecial =
                  stage === "insurance" || stage === "registration";

                const isLoading =
                  stage === "insurance"
                    ? insuranceLoading
                    : stage === "registration"
                      ? registrationDocumentsLoading
                      : advancing;

                const canAct =
                  !isLoading &&
                  !(p.status !== "active" && stage !== "completed");

                return (
                  <div key={stage} className="flex flex-1 items-center">
                    <button
                      type="button"
                      onClick={() => canAct && handleStageClick(stage)}
                      disabled={!canAct}
                      className={`group flex items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                        !canAct
                          ? "cursor-not-allowed opacity-50"
                          : isLoading
                            ? "cursor-wait opacity-60"
                            : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          checked
                            ? "border-gray-900 bg-gray-900 text-white"
                            : isCurrent
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : "border-gray-300 bg-white text-gray-400 group-hover:border-gray-500"
                        }`}
                      >
                        {checked ? (
                          <span className="text-sm font-bold">✓</span>
                        ) : isCurrent ? (
                          <span className="h-3 w-3 rounded-full bg-blue-600" />
                        ) : (
                          <span className="h-3 w-3 rounded-sm border border-gray-300" />
                        )}
                      </span>

                      <span
                        className={`whitespace-nowrap text-sm font-medium ${
                          checked
                            ? "text-gray-900"
                            : isCurrent
                              ? "text-blue-700"
                              : isSpecial
                                ? "text-blue-600 group-hover:text-blue-700"
                                : "text-gray-500"
                        }`}
                      >
                        {DISPLAY_LABELS[stage]}
                      </span>
                    </button>

                    {index < DISPLAY_STAGES.length - 1 && (
                      <div
                        className={`mx-2 h-px flex-1 ${
                          checked ? "bg-gray-900" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Registration Emirate
              <select
                disabled={!manage || saving}
                value={form.registration_emirate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    registration_emirate: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-gray-500"
              >
                <option value="">Select</option>

                {EMIRATES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700">
              Remark
              <textarea
                disabled={!manage || saving}
                value={form.remark}
                onChange={(e) =>
                  setForm({
                    ...form,
                    remark: e.target.value,
                  })
                }
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-500"
              />
            </label>
          </div>

          {manage && (
            <button
              type="button"
              onClick={save}
              disabled={saving || advancing}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Details"}
            </button>
          )}
        </section>
      </div>

      {showPassingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Passing Requirements
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {p.registration_emirate} registration requires both passing
                    checks.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassingModal(false)}
                  className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-3 px-6 py-6">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  passingChecks.dubai
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={passingChecks.dubai}
                  onChange={(e) =>
                    setPassingChecks((previous) => ({
                      ...previous,
                      dubai: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-gray-300"
                />

                <div>
                  <div className="font-medium text-gray-900">Dubai Passing</div>

                  <div className="text-xs text-gray-500">
                    Required first passing check
                  </div>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  passingChecks.emirate
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={passingChecks.emirate}
                  onChange={(e) =>
                    setPassingChecks((previous) => ({
                      ...previous,
                      emirate: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-gray-300"
                />

                <div>
                  <div className="font-medium text-gray-900">
                    {p.registration_emirate} Passing
                  </div>

                  <div className="text-xs text-gray-500">
                    Required registration-emirate passing check
                  </div>
                </div>
              </label>

              <button
                type="button"
                onClick={confirmPassing}
                disabled={
                  !passingChecks.dubai || !passingChecks.emirate || advancing
                }
                className="mt-3 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {advancing ? "Updating..." : "Mark Passing Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Insurance Status
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Check the customer's insurance application before continuing
                    the Progression.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInsuranceModal(false)}
                  className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div
                className={`rounded-xl border p-4 ${getInsuranceStatusClass()}`}
              >
                <div className="text-xs font-medium uppercase tracking-wide">
                  Current Status
                </div>

                <div className="mt-1 text-lg font-semibold">
                  {getInsuranceStatusLabel()}
                </div>
              </div>

              {!insuranceRecord && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-medium text-amber-800">
                    Insurance has not been created for this deal.
                  </div>

                  <div className="mt-1 text-xs text-amber-700">
                    Open Insurance to create or manage the application.
                  </div>
                </div>
              )}

              {insuranceRecord && (
                <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
                  {insuranceRecord.insurance_company && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Insurance Company</span>
                      <span className="font-medium text-gray-900">
                        {insuranceRecord.insurance_company}
                      </span>
                    </div>
                  )}

                  {insuranceRecord.policy_number && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Policy Number</span>
                      <span className="font-medium text-gray-900">
                        {insuranceRecord.policy_number}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInsuranceModal(false)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleInsuranceContinue}
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  {getInsuranceStatus() === "approved"
                    ? "Continue Progression"
                    : insuranceRecord
                      ? "Open Insurance"
                      : "Create Insurance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRegistrationDocumentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Prepare Items for Registration
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Required registration documents for this customer and
                    vehicle.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Possession Certificate and RTA Passing are required for all
                    customers. Company Trade License is additionally required
                    for company customers. Passport and other customer documents
                    are optional.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegistrationDocumentsModal(false)}
                  className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {(registrationDocuments?.required_documents || []).map(
                  (document) => (
                    <div
                      key={document.key}
                      className={`rounded-xl border p-4 ${
                        document.available
                          ? "border-green-200 bg-green-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {document.label}
                          </div>

                          <div
                            className={`mt-1 text-xs font-medium ${
                              document.available
                                ? "text-green-700"
                                : "text-amber-700"
                            }`}
                          >
                            {document.available ? "Available" : "Missing"}
                          </div>
                        </div>

                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            document.available
                              ? "bg-green-600 text-white"
                              : "bg-amber-200 text-amber-800"
                          }`}
                        >
                          {document.available ? "✓" : "!"}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {registrationDocuments?.documents?.filter(
                (document) => document.download_available,
              ).length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Available Documents
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Download each available document individually as a PDF.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {registrationDocuments.documents
                      .filter((document) => document.download_available)
                      .map((document) => {
                        const loadingKey = `${document.source}:${document.id}`;
                        const isDownloading =
                          downloadingRegistrationDocument === loadingKey;

                        return (
                          <div
                            key={loadingKey}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900">
                                {document.document_label ||
                                  document.document_type}
                              </div>

                              <div className="mt-1 truncate text-xs text-gray-500">
                                {document.file_name || "Document"}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleRegistrationDocumentDownload(document)
                              }
                              disabled={isDownloading}
                              className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDownloading
                                ? "Downloading..."
                                : "Download PDF"}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {registrationDocuments?.missing_documents?.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-semibold text-amber-800">
                    Missing registration documents
                  </div>

                  <div className="mt-2 text-sm text-amber-700">
                    {registrationDocuments.missing_documents
                      .map((document) => document.label)
                      .join(", ")}
                  </div>
                </div>
              )}

              {registrationDocuments?.registration_documents_ready ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="text-sm font-semibold text-green-800">
                    Registration documents are ready.
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-700">
                    Registration preparation is not complete yet.
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-white pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegistrationDocumentsModal(false)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={continueFromRegistrationDocuments}
                  disabled={
                    !registrationDocuments?.registration_documents_ready
                  }
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue to Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Registration Balance Sheet
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Settle the customer's Balance Sheet before opening the RTA
                    Sale.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {!balanceSheet ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">
                    No Balance Sheet was found for this deal.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/finance/balance-sheets?quote_id=${encodeURIComponent(
                          p.quote,
                        )}`,
                      )
                    }
                    className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Open Balance Sheets
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">Customer</div>

                      <div className="mt-1 font-medium text-gray-900">
                        {balanceSheet.customer_name || p.customer_name || "-"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">Quote</div>

                      <div className="mt-1 font-medium text-gray-900">
                        {balanceSheet.quote_number ||
                          p.quote_number ||
                          p.quote ||
                          "-"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="text-xs text-gray-500">
                        Net Difference
                      </div>

                      <div className="mt-1 font-medium text-gray-900">
                        AED {balanceSheet.net_difference ?? "-"}
                      </div>
                    </div>

                    <div
                      className={`rounded-xl p-4 ${
                        balanceSheet.balance_status === "settled"
                          ? "bg-green-50"
                          : "bg-amber-50"
                      }`}
                    >
                      <div className="text-xs text-gray-500">
                        Balance Status
                      </div>

                      <div
                        className={`mt-1 font-semibold ${
                          balanceSheet.balance_status === "settled"
                            ? "text-green-700"
                            : "text-amber-700"
                        }`}
                      >
                        {balanceSheet.balance_status === "settled"
                          ? "Settled"
                          : balanceSheet.balance_status ===
                              "customer_receivable"
                            ? "Customer Receivable"
                            : balanceSheet.balance_status === "customer_payable"
                              ? "Customer Payable"
                              : balanceSheet.balance_status || "-"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/finance/balance-sheets/${balanceSheet.id}`)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Open Balance Sheet
                  </button>

                  {saleRtaRecord ? (
                    <button
                      type="button"
                      onClick={markRegistrationCompleted}
                      disabled={
                        balanceSheet.balance_status !== "settled" || advancing
                      }
                      className="w-full rounded-xl bg-green-700 px-4 py-3 text-left text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="block text-sm font-semibold">
                        {advancing
                          ? "Marking Registration Completed..."
                          : "Mark Registration Completed"}
                      </span>

                      <span className="mt-1 block text-xs text-green-100">
                        Sale RTA already exists. Complete the Registration stage
                        for this progression.
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={continueToRtaSale}
                      disabled={
                        balanceSheet.balance_status !== "settled" || advancing
                      }
                      className="w-full rounded-xl bg-gray-900 px-4 py-3 text-left text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="block text-sm font-semibold">
                        Continue to RTA Sale
                      </span>

                      <span className="mt-1 block text-xs text-gray-300">
                        Open the Sale RTA form with the transaction details
                        pre-filled.
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showDeliveryCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Complete Delivery Video
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Both commercial documents must be created before this
                    Progression can be completed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeliveryCompletionModal(false)}
                  className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div
                className={`rounded-xl border p-4 ${
                  proformaRecord
                    ? "border-green-200 bg-green-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-gray-900">Proforma</div>

                    <div
                      className={`mt-1 text-xs font-medium ${
                        proformaRecord ? "text-green-700" : "text-amber-700"
                      }`}
                    >
                      {proformaRecord
                        ? `Created — ${proformaRecord.proforma_number || ""}`
                        : "Not created"}
                    </div>
                  </div>

                  {proformaRecord ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/finance/proformas/${proformaRecord.id}`)
                      }
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!insuranceRecord?.id}
                      onClick={() =>
                        navigate(
                          `/finance/proformas/new?insurance=${encodeURIComponent(
                            insuranceRecord.id,
                          )}&return_to=${encodeURIComponent(
                            `/progression/${id}`,
                          )}`,
                        )
                      }
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Create Proforma
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  deliveryNoteRecord
                    ? "border-green-200 bg-green-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      Delivery Note
                    </div>

                    <div
                      className={`mt-1 text-xs font-medium ${
                        deliveryNoteRecord ? "text-green-700" : "text-amber-700"
                      }`}
                    >
                      {deliveryNoteRecord
                        ? `Created — ${
                            deliveryNoteRecord.delivery_note_number || ""
                          }`
                        : "Not created"}
                    </div>
                  </div>

                  {deliveryNoteRecord ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/finance/delivery-notes/${deliveryNoteRecord.id}`,
                        )
                      }
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!insuranceRecord?.id}
                      onClick={() =>
                        navigate(
                          `/finance/delivery-notes/new?insurance=${encodeURIComponent(
                            insuranceRecord.id,
                          )}&return_to=${encodeURIComponent(
                            `/progression/${id}`,
                          )}`,
                        )
                      }
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Create Delivery Note
                    </button>
                  )}
                </div>
              </div>

              {!proformaRecord || !deliveryNoteRecord ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Create both Proforma and Delivery Note before completing the
                  Delivery Video stage.
                </div>
              ) : (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  Both required documents have been created. Delivery Video can
                  now be completed.
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowDeliveryCompletionModal(false)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>

              <button
                type="button"
                disabled={
                  advancing ||
                  deliveryDocumentsLoading ||
                  !proformaRecord ||
                  !deliveryNoteRecord
                }
                onClick={async () => {
                  const updated = await advanceStage();

                  if (updated) {
                    setShowDeliveryCompletionModal(false);

                    toast.success("Delivery Video completed successfully.");
                  }
                }}
                className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {advancing ? "Completing..." : "Complete Delivery Video"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
