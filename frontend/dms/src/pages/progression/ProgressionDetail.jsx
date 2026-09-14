import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { getBalanceSheets } from "../../api/balanceSheets";
import { getInsurances } from "../../api/insurance";
import { getProgression, updateProgression } from "../../api/progression";
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

const STORAGE_PREFIX = "prime-rides-progression-checks";

function getStoredChecks(progressionId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${progressionId}`);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredChecks(progressionId, checks) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}:${progressionId}`,
      JSON.stringify(checks),
    );
  } catch {
    // Ignore localStorage failures.
  }
}

function getResponseData(response) {
  const body = response ?? {};

  return Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body)
      ? body
      : [];
}

function getBackendCompletedStages(currentStage) {
  if (currentStage === "completed") {
    return {
      evaluation: true,
      passing: true,
      insurance: true,
      registration: true,
      delivery_video: true,
      completed: true,
    };
  }

  if (currentStage === "delivery_video") {
    return {
      evaluation: true,
      passing: true,
      insurance: true,
      registration: true,
    };
  }

  if (currentStage === "registration") {
    return {
      evaluation: true,
      passing: true,
      insurance: true,
    };
  }

  if (currentStage === "insurance") {
    return {
      evaluation: true,
      passing: true,
    };
  }

  if (
    currentStage === "passing" ||
    currentStage === "dubai_passing" ||
    currentStage === "registration_passing"
  ) {
    return {
      evaluation: true,
    };
  }

  return {};
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

  const [checkedStages, setCheckedStages] = useState({});
  const [insuranceLoading, setInsuranceLoading] = useState(false);

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

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

      const backendChecks = getBackendCompletedStages(d?.current_stage);

      const savedChecks = getStoredChecks(id);

      setCheckedStages({
        ...backendChecks,
        ...savedChecks,
      });
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

      toast.success("Progression updated.");
    } catch (e) {
      toast.error(e?.message || "Unable to update Progression.");
    } finally {
      setSaving(false);
    }
  }

  function markStage(stage) {
    setCheckedStages((previous) => {
      const next = {
        ...previous,
        [stage]: true,
      };

      saveStoredChecks(id, next);

      return next;
    });
  }

  async function openInsurance() {
    if (!p?.quote) {
      navigate("/finance/insurance");
      return;
    }

    try {
      setInsuranceLoading(true);

      const response = await getInsurances({
        quote_id: p.quote,
      });

      const records = getResponseData(response);

      if (!records.length) {
        toast.info("No Insurance record was found for this customer/deal.");

        navigate(`/finance/insurance?quote_id=${encodeURIComponent(p.quote)}`);

        return;
      }

      const insurance = records[0];
      const status = String(
        insurance?.application_status || insurance?.status || "",
      ).toLowerCase();

      if (status === "approved") {
        markStage("insurance");
        toast.success("Insurance is already approved.");
        return;
      }

      if (insurance?.id) {
        navigate(`/finance/insurance/${insurance.id}`);
        return;
      }

      navigate(`/finance/insurance?quote_id=${encodeURIComponent(p.quote)}`);
    } catch (e) {
      toast.error(e?.message || "Unable to load the customer's Insurance.");
    } finally {
      setInsuranceLoading(false);
    }
  }

  async function openRegistration() {
    if (!p?.quote) {
      toast.error("Quote information is missing.");
      return;
    }

    try {
      setBalanceLoading(true);

      const response = await getBalanceSheets({
        quote_id: p.quote,
      });

      const records = getResponseData(response);
      const sheet = records[0] || null;

      setBalanceSheet(sheet);
      setShowBalanceModal(true);
    } catch (e) {
      toast.error(e?.message || "Unable to load the Balance Sheet.");
    } finally {
      setBalanceLoading(false);
    }
  }

  function confirmPassing() {
    if (!passingChecks.dubai || !passingChecks.emirate) {
      toast.error(
        `Both Dubai Passing and ${p.registration_emirate} Passing must be completed.`,
      );
      return;
    }

    markStage("passing");
    setShowPassingModal(false);

    toast.success("Passing marked complete.");
  }

  function handleStageClick(stage) {
    if (stage === "passing") {
      if (checkedStages.passing) {
        setCheckedStages((previous) => {
          const next = {
            ...previous,
            passing: false,
          };

          saveStoredChecks(id, next);

          return next;
        });

        return;
      }

      if (p.registration_emirate === "Dubai") {
        markStage("passing");
        toast.success("Passing marked complete.");
        return;
      }

      setPassingChecks({
        dubai: false,
        emirate: false,
      });

      setShowPassingModal(true);
      return;
    }

    if (stage === "insurance") {
      openInsurance();
      return;
    }

    if (stage === "registration") {
      openRegistration();
      return;
    }

    if (checkedStages[stage]) {
      setCheckedStages((previous) => {
        const next = {
          ...previous,
          [stage]: false,
        };

        saveStoredChecks(id, next);

        return next;
      });

      return;
    }

    markStage(stage);

    toast.success(`${DISPLAY_LABELS[stage]} marked complete.`);
  }

  function confirmRegistration() {
    if (!balanceSheet) {
      toast.error("Balance Sheet not found.");
      return;
    }

    if (balanceSheet.balance_status !== "settled") {
      toast.error(
        "Balance Sheet is not settled yet. Registration cannot be marked complete.",
      );
      return;
    }

    markStage("registration");
    setShowBalanceModal(false);

    toast.success("Registration marked complete.");
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
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">
                Progression Checklist
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                You can complete these in any order.
              </p>
            </div>

            <div className="text-xs text-gray-400">Click a stage to act</div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex min-w-[980px] items-center">
              {DISPLAY_STAGES.map((stage, index) => {
                const checked = Boolean(checkedStages[stage]);

                const isSpecial =
                  stage === "insurance" || stage === "registration";

                const isLoading =
                  stage === "insurance"
                    ? insuranceLoading
                    : stage === "registration"
                      ? balanceLoading
                      : false;

                return (
                  <div key={stage} className="flex flex-1 items-center">
                    <button
                      type="button"
                      onClick={() => !isLoading && handleStageClick(stage)}
                      disabled={isLoading}
                      className={`group flex items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                        isLoading
                          ? "cursor-wait opacity-60"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          checked
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-300 bg-white text-gray-400 group-hover:border-gray-500"
                        }`}
                      >
                        {checked ? (
                          <span className="text-sm font-bold">✓</span>
                        ) : (
                          <span className="h-3 w-3 rounded-sm border border-gray-300" />
                        )}
                      </span>

                      <span
                        className={`whitespace-nowrap text-sm font-medium ${
                          checked
                            ? "text-gray-900"
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
              disabled={saving}
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
                disabled={!passingChecks.dubai || !passingChecks.emirate}
                className="mt-3 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mark Passing Complete
              </button>
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
                    Settle the customer's Balance Sheet before marking
                    Registration complete.
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

                  <label
                    className={`flex items-center gap-3 rounded-xl border p-4 ${
                      balanceSheet.balance_status === "settled"
                        ? "cursor-pointer border-green-200 bg-green-50"
                        : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedStages.registration)}
                      disabled={balanceSheet.balance_status !== "settled"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          markStage("registration");
                          setShowBalanceModal(false);
                          toast.success("Registration marked complete.");
                        }
                      }}
                      className="h-5 w-5 rounded border-gray-300"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        Mark Registration Complete
                      </span>

                      <span className="mt-0.5 block text-xs text-gray-500">
                        Enabled only when the Balance Sheet is settled.
                      </span>
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
