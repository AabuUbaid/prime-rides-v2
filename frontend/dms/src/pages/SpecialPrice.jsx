import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  createSpecialPriceRequest,
  decideSpecialPriceRequest,
  getSpecialPriceRequests,
} from "../api/specialPrice";

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Special Price</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage transaction-specific special price requests.
        </p>
      </div>

      {!isMaster && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Request Special Price
            </h2>
          </div>

          <form
            onSubmit={handleCreateRequest}
            className="grid gap-4 p-5 md:grid-cols-3"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Car ID
              </label>

              <input
                type="number"
                min="1"
                value={carId}
                onChange={(event) => setCarId(event.target.value)}
                placeholder="Vehicle ID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Requested Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={requestedPrice}
                onChange={(event) => setRequestedPrice(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            {isMaster ? "All Special Price Requests" : "My Requests"}
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">
            Loading special price requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No special price requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Requested By
                  </th>
                  {isMaster && (
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Decision
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {getCarLabel(request)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                      AED {formatCurrency(request.requested_price)}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {request.status || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                      {request.requested_by_name || "-"}
                    </td>

                    {isMaster && (
                      <td className="px-4 py-4">
                        {request.status === "pending" ? (
                          <div className="min-w-[280px] space-y-2">
                            <input
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
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />

                            <input
                              type="datetime-local"
                              value={expiresAt[request.id] || ""}
                              onChange={(event) =>
                                setExpiresAt((current) => ({
                                  ...current,
                                  [request.id]: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />

                            <input
                              type="text"
                              value={decisionNotes[request.id] || ""}
                              onChange={(event) =>
                                setDecisionNotes((current) => ({
                                  ...current,
                                  [request.id]: event.target.value,
                                }))
                              }
                              placeholder="Decision note (optional)"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDecision(request.id, "approve")
                                }
                                disabled={saving}
                                className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDecision(request.id, "decline")
                                }
                                disabled={saving}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            No action available
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
