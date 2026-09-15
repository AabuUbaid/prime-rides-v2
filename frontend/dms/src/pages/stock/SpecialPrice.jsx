import { useEffect, useState } from "react";
import { Check, Clock3, DollarSign, FileText, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

import {
  createSpecialPriceRequest,
  decideSpecialPriceRequest,
  getSpecialPriceRequests,
} from "../../api/specialPrice";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import StatusBadge from "../../components/ui/StatusBadge";

function unwrapData(response) {
  return response?.data ?? response;
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function getCarLabel(request) {
  const car = request?.car;

  if (typeof car === "string") {
    return car;
  }

  return (
    car?.stock_id ||
    request?.car_stock_id ||
    `Vehicle #${request?.car || request?.car_id || "-"}`
  );
}

export default function SpecialPrice() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [carId, setCarId] = useState("");
  const [requestedPrice, setRequestedPrice] = useState("");

  const [approvedPrices, setApprovedPrices] = useState({});
  const [expiresAt, setExpiresAt] = useState({});
  const [decisionNotes, setDecisionNotes] = useState({});

  const isMaster = user?.role === "MASTER";

  async function loadRequests() {
    try {
      setLoading(true);

      const response = await getSpecialPriceRequests();
      const data = unwrapData(response);

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || "Unable to load special price requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleCreateRequest(event) {
    event.preventDefault();

    if (!carId) {
      toast.error("Car ID is required.");
      return;
    }

    if (!requestedPrice) {
      toast.error("Requested price is required.");
      return;
    }

    try {
      setSaving(true);

      await createSpecialPriceRequest({
        car_id: Number(carId),
        requested_price: requestedPrice,
      });

      toast.success("Special price request created.");

      setCarId("");
      setRequestedPrice("");

      await loadRequests();
    } catch (err) {
      toast.error(
        err?.message || "Unable to create the special price request.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDecision(requestId, action) {
    if (!requestId) {
      return;
    }

    const payload = {
      action,
      decision_note: decisionNotes[requestId] || "",
    };

    if (action === "approve") {
      const approvedPrice = approvedPrices[requestId];
      const expiry = expiresAt[requestId];

      if (!approvedPrice) {
        toast.error("Approved price is required.");
        return;
      }

      if (!expiry) {
        toast.error("Expiry date/time is required.");
        return;
      }

      payload.approved_price = approvedPrice;
      payload.expires_at = new Date(expiry).toISOString();
    }

    try {
      setSaving(true);

      await decideSpecialPriceRequest(requestId, payload);

      toast.success(
        action === "approve"
          ? "Special price approved."
          : "Special price declined.",
      );

      await loadRequests();
    } catch (err) {
      toast.error(
        err?.message || "Unable to process the special price request.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="mb-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
                Inventory
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Special Price
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage transaction-specific special price requests.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
            <FileText size={15} className="text-slate-400" />

            <span className="text-xs font-medium text-slate-500">
              {requests.length} request
              {requests.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {/* Request form */}
      {!isMaster && (
        <Card
          className="mb-6"
          title="Request Special Price"
          description="Submit a transaction-specific price request for a vehicle."
        >
          <form
            onSubmit={handleCreateRequest}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]"
          >
            <Input
              id="special-price-car-id"
              label="Car ID"
              type="number"
              min="1"
              value={carId}
              onChange={(event) => setCarId(event.target.value)}
              placeholder="Vehicle ID"
            />

            <Input
              id="special-price-requested-price"
              label="Requested Price"
              type="number"
              min="0"
              step="0.01"
              value={requestedPrice}
              onChange={(event) => setRequestedPrice(event.target.value)}
              placeholder="0.00"
            />

            <div className="flex items-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={saving}
                icon={DollarSign}
                className="w-full lg:w-auto lg:min-w-[170px]"
              >
                {saving ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Requests */}
      <Card
        title={isMaster ? "All Special Price Requests" : "My Requests"}
        description={
          isMaster
            ? "Review, approve, or decline special price requests."
            : "Track the status of your submitted special price requests."
        }
        noPadding
      >
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

              <p className="text-sm font-medium text-slate-600">
                Loading special price requests...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while the latest requests are loaded.
              </p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileText size={20} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-800">
                No special price requests
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                There are currently no special price requests to display.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Requested
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Requested By
                  </th>

                  {isMaster && (
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Decision
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    {/* Vehicle */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                          <CarIcon />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {getCarLabel(request)}
                          </p>

                          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            Vehicle
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Requested price */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-amber-500" />

                        <span className="font-mono text-sm font-semibold text-slate-800">
                          AED {formatCurrency(request.requested_price)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 align-top">
                      <StatusBadge status={request.status || "-"} />
                    </td>

                    {/* Requested by */}
                    <td className="px-5 py-4 align-top">
                      <p className="text-sm font-medium text-slate-700">
                        {request.requested_by_name || "-"}
                      </p>
                    </td>

                    {/* Decision */}
                    {isMaster && (
                      <td className="px-5 py-4 align-top">
                        {request.status === "pending" ? (
                          <div className="min-w-[310px] max-w-[380px] space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div>
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                Approval Details
                              </p>

                              <div className="space-y-2">
                                <Input
                                  id={`approved-price-${request.id}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={approvedPrices[request.id] || ""}
                                  onChange={(event) =>
                                    setApprovedPrices((current) => ({
                                      ...current,
                                      [request.id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Approved price"
                                />

                                <Input
                                  id={`expires-at-${request.id}`}
                                  type="datetime-local"
                                  value={expiresAt[request.id] || ""}
                                  onChange={(event) =>
                                    setExpiresAt((current) => ({
                                      ...current,
                                      [request.id]: event.target.value,
                                    }))
                                  }
                                />

                                <Input
                                  id={`decision-note-${request.id}`}
                                  type="text"
                                  value={decisionNotes[request.id] || ""}
                                  onChange={(event) =>
                                    setDecisionNotes((current) => ({
                                      ...current,
                                      [request.id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Decision note (optional)"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="success"
                                size="sm"
                                loading={saving}
                                icon={Check}
                                onClick={() =>
                                  handleDecision(request.id, "approve")
                                }
                              >
                                Approve
                              </Button>

                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={saving}
                                icon={X}
                                onClick={() =>
                                  handleDecision(request.id, "decline")
                                }
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock3 size={14} />

                            <span>No action available</span>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function CarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 17h14" />
      <path d="M6 17a2 2 0 1 0 4 0" />
      <path d="M14 17a2 2 0 1 0 4 0" />
      <path d="M4 17v-3.5a2 2 0 0 1 1.5-1.94l1.5-.38 1.5-4.18h8l1.5 4.18 1.5.38A2 2 0 0 1 20 13.5V17" />
      <path d="M8 11h8" />
    </svg>
  );
}
