import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getQuote, getQuotes } from "../../api/quotes";
import { getCar, getCars } from "../../api/inventory";

import { createRtaRecord } from "../../api/rta";
import { advanceProgression } from "../../api/progression";
import { getBranches, getCompanies } from "../../api/company";

function getResponseData(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) {
    return response.data;
  }

  return response;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function RtaRecordCreate() {
  const navigate = useNavigate();
  const { carId, quoteId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const progressionId = searchParams.get("progression_id");
  const purchaseRoute = Boolean(carId);
  const saleRoute = Boolean(quoteId);
  const routeLocked = purchaseRoute || saleRoute;

  const [saving, setSaving] = useState(false);
  const [recordType, setRecordType] = useState(saleRoute ? "SALE" : "PURCHASE");
  const [rtaDate, setRtaDate] = useState(getTodayDate());

  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [purchaseCar, setPurchaseCar] = useState(null);
  const [purchaseCarLoading, setPurchaseCarLoading] = useState(true);

  const [purchaseVehicles, setPurchaseVehicles] = useState([]);
  const [selectedPurchaseCarId, setSelectedPurchaseCarId] = useState("");

  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchLoading, setBranchLoading] = useState(false);

  const [rtaReferenceNumber, setRtaReferenceNumber] = useState("");
  const [firstPartySignatoryName, setFirstPartySignatoryName] = useState("");
  const [secondPartySignatoryName, setSecondPartySignatoryName] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function handleQuoteChange(event) {
    const quoteId = event.target.value;

    setSelectedQuoteId(quoteId);
    setSelectedQuote(null);

    if (!quoteId) {
      return;
    }

    setQuoteLoading(true);
    setError("");

    try {
      const response = await getQuote(quoteId);
      const data = getResponseData(response);

      setSelectedQuote(data && typeof data === "object" ? data : null);
    } catch (e) {
      setError(e?.message || "Unable to load the selected quote.");
    } finally {
      setQuoteLoading(false);
    }
  }

  function handleRecordTypeChange(event) {
    if (routeLocked) {
      return;
    }

    const value = event.target.value;

    setRecordType(value);

    if (value === "SALE") {
      // Sale-specific state is handled by the quote selection effect.
    } else {
      setSelectedQuoteId("");
      setSelectedQuote(null);
      setQuoteLoading(false);
    }
  }

  useEffect(() => {
    async function loadFormData() {
      setLoading(true);
      setError("");

      try {
        const requests = [getCompanies()];

        if (recordType === "SALE") {
          requests.unshift(getQuotes());
        }

        const responses = await Promise.all(requests);

        let companiesResponse;
        let quotesResponse;

        if (recordType === "SALE") {
          [quotesResponse, companiesResponse] = responses;
        } else {
          [companiesResponse] = responses;
        }

        const companiesData = getResponseData(companiesResponse);

        const normalizedCompanies = Array.isArray(companiesData)
          ? companiesData
          : Array.isArray(companiesData?.results)
            ? companiesData.results
            : Array.isArray(companiesData?.data)
              ? companiesData.data
              : companiesData?.id
                ? [companiesData]
                : [];

        setCompanies(normalizedCompanies);

        const defaultCompany =
          normalizedCompanies.find((company) => company?.is_active !== false) ||
          normalizedCompanies[0];

        if (defaultCompany?.id) {
          setSelectedCompanyId(String(defaultCompany.id));
        }

        if (recordType === "SALE") {
          const quotesData = getResponseData(quotesResponse);

          setQuotes(
            Array.isArray(quotesData)
              ? quotesData
              : Array.isArray(quotesData?.results)
                ? quotesData.results
                : [],
          );
        } else {
          setQuotes([]);
        }
      } catch (e) {
        setError(e?.message || "Unable to load RTA form data.");
      } finally {
        setLoading(false);
      }
    }

    loadFormData();
  }, [recordType]);

  useEffect(() => {
    if (recordType !== "PURCHASE") {
      setPurchaseVehicles([]);
      setSelectedPurchaseCarId("");
      setPurchaseCar(null);
      setPurchaseCarLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPurchaseVehicles() {
      setPurchaseCarLoading(true);
      setError("");

      try {
        if (purchaseRoute) {
          const response = await getCar(carId);
          const data = getResponseData(response);

          const loadedCar = data && typeof data === "object" ? data : null;

          if (!cancelled) {
            setPurchaseVehicles(loadedCar ? [loadedCar] : []);
            setSelectedPurchaseCarId(loadedCar?.id ? String(loadedCar.id) : "");
            setPurchaseCar(loadedCar);
          }

          return;
        }

        const response = await getCars({
          page_size: 100,
        });

        const data = getResponseData(response);

        const vehicles = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (!cancelled) {
          setPurchaseVehicles(vehicles);
          setSelectedPurchaseCarId("");
          setPurchaseCar(null);
        }
      } catch (e) {
        if (!cancelled) {
          setPurchaseVehicles([]);
          setSelectedPurchaseCarId("");
          setPurchaseCar(null);
          setError(e?.message || "Unable to load inventory vehicles.");
        }
      } finally {
        if (!cancelled) {
          setPurchaseCarLoading(false);
        }
      }
    }

    loadPurchaseVehicles();

    return () => {
      cancelled = true;
    };
  }, [recordType, carId, purchaseRoute]);

  useEffect(() => {
    if (!saleRoute) {
      return;
    }

    setSelectedQuoteId(quoteId || "");
  }, [quoteId, saleRoute]);

  useEffect(() => {
    if (recordType !== "SALE" || !selectedQuoteId) {
      setSelectedQuote(null);
      return;
    }

    let cancelled = false;

    async function loadSelectedQuote() {
      setQuoteLoading(true);
      setError("");

      try {
        const response = await getQuote(selectedQuoteId);
        const data = getResponseData(response);

        if (!cancelled) {
          setSelectedQuote(data && typeof data === "object" ? data : null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Unable to load the selected quote.");
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }

    loadSelectedQuote();

    return () => {
      cancelled = true;
    };
  }, [recordType, selectedQuoteId]);

  const selectedBranch = branches.find(
    (branch) => String(branch.id) === String(selectedBranchId),
  );

  useEffect(() => {
    if (!selectedCompanyId) {
      return;
    }

    let cancelled = false;

    async function loadCompanyBranches() {
      setBranchLoading(true);
      setError("");

      try {
        const response = await getBranches(selectedCompanyId);
        const data = getResponseData(response);

        if (!cancelled) {
          const normalizedBranches = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data?.data)
                ? data.data
                : [];

          setBranches(normalizedBranches);
        }
      } catch (e) {
        if (!cancelled) {
          setBranches([]);
          setError(
            e?.message || "Unable to load branches for the selected company.",
          );
        }
      } finally {
        if (!cancelled) {
          setBranchLoading(false);
        }
      }
    }

    loadCompanyBranches();

    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  function handlePurchaseVehicleChange(event) {
    const value = event.target.value;

    setSelectedPurchaseCarId(value);
    setError("");

    if (!value) {
      setPurchaseCar(null);
      return;
    }

    const selectedVehicle =
      purchaseVehicles.find(
        (vehicle) => String(vehicle.id) === String(value),
      ) || null;

    setPurchaseCar(selectedVehicle);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const resolvedCompany =
      companies.find(
        (company) => String(company.id) === String(selectedCompanyId),
      ) ||
      companies.find((company) => company?.is_active !== false) ||
      companies[0];

    const resolvedCompanyId = resolvedCompany?.id;

    if (!resolvedCompanyId) {
      setError("Unable to load the company configuration.");
      return;
    }

    if (recordType === "PURCHASE") {
      if (!selectedPurchaseCarId) {
        setError("Please select an inventory vehicle.");
        return;
      }

      if (!purchaseCar) {
        setError("Unable to load the selected inventory vehicle.");
        return;
      }
    }

    if (recordType === "SALE") {
      if (!selectedQuoteId || !selectedQuote) {
        setError("Please select a quote for the sale RTA.");
        return;
      }

      if (!selectedQuote.car_id) {
        setError("The selected quote is not linked to a vehicle.");
        return;
      }

      if (!selectedQuote.customer_id) {
        setError("The selected quote is not linked to a customer.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        record_type: recordType,
        rta_date: rtaDate,
        company: resolvedCompanyId,
        branch: selectedBranchId || null,
        rta_reference_number: rtaReferenceNumber.trim(),
        first_party_signatory_name: firstPartySignatoryName.trim(),
        second_party_signatory_name: secondPartySignatoryName.trim(),
        notes: notes.trim(),
      };

      if (recordType === "PURCHASE") {
        payload.car = selectedPurchaseCarId;
      }

      if (recordType === "SALE") {
        payload.quote = selectedQuoteId;
        payload.car = selectedQuote.car_id;
        payload.customer = selectedQuote.customer_id;
      }

      const response = await createRtaRecord(payload);
      const createdRecord = getResponseData(response);

      if (!createdRecord?.id) {
        throw new Error("The server returned an invalid RTA record response.");
      }

      if (recordType === "SALE" && progressionId) {
        await advanceProgression(progressionId);
        navigate(`/progression/${progressionId}`);
        return;
      }

      navigate(`/rta/${createdRecord.id}`);

      navigate(`/rta/${createdRecord.id}`);
    } catch (e) {
      setError(e?.message || "Unable to create the RTA record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create RTA Record</h1>

          <p className="text-sm text-gray-500">
            Prepare a Purchase or Sale RTA record.
          </p>
        </div>

        <Link to="/rta" className="rounded border px-4 py-2 text-sm">
          Back to RTA Records
        </Link>
      </div>

      {loading && (
        <div className="rounded border bg-white p-6">
          Loading RTA form data...
        </div>
      )}

      {!loading && error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="rounded border bg-white p-6">
            <h2 className="text-lg font-semibold">Record Information</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Record Type
                </label>

                <select
                  value={recordType}
                  onChange={handleRecordTypeChange}
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="PURCHASE">Purchase</option>

                  <option value="SALE">Sale</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  RTA Date
                </label>

                <input
                  type="date"
                  value={rtaDate}
                  onChange={(event) => setRtaDate(event.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              {recordType === "SALE" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Quote
                  </label>

                  <select
                    value={selectedQuoteId}
                    onChange={handleQuoteChange}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="">Select a quote</option>

                    {quotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        {quote.quote_number || quote.id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Purchase Vehicle
                  </label>

                  <select
                    value={selectedPurchaseCarId}
                    onChange={handlePurchaseVehicleChange}
                    disabled={purchaseCarLoading || purchaseRoute}
                    className="w-full rounded border px-3 py-2 disabled:bg-gray-100"
                  >
                    <option value="">
                      {purchaseCarLoading
                        ? "Loading inventory..."
                        : "Select inventory vehicle"}
                    </option>

                    {purchaseVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.stock_id || vehicle.id}
                        {" — "}
                        {vehicle.make || ""} {vehicle.model || ""}
                        {vehicle.variant ? ` • ${vehicle.variant}` : ""}
                      </option>
                    ))}
                  </select>

                  {!purchaseCarLoading && !purchaseVehicles.length && (
                    <p className="mt-2 text-xs text-gray-500">
                      No inventory vehicles are currently available.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">Branch</label>

                <select
                  value={selectedBranchId}
                  onChange={(event) => setSelectedBranchId(event.target.value)}
                  disabled={!selectedCompanyId || branchLoading}
                  className="w-full rounded border px-3 py-2 disabled:bg-gray-100"
                >
                  <option value="">
                    {branchLoading ? "Loading branches..." : "Select a branch"}
                  </option>

                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name || branch.branch_name || branch.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {recordType === "SALE" && quoteLoading && (
              <p className="mt-3 text-sm text-gray-500">
                Loading quote details...
              </p>
            )}

            {recordType === "SALE" && selectedQuote && (
              <div className="mt-6 border-t pt-5">
                <h3 className="text-sm font-semibold">Selected Quote</h3>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Quote</p>

                    <p className="text-sm font-medium">
                      {selectedQuote.quote_number || selectedQuote.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Vehicle ID</p>

                    <p className="text-sm font-medium">
                      {selectedQuote.car_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>

                    <p className="text-sm font-medium">
                      {selectedQuote.customer_id || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Customer</p>

                    <p className="text-sm font-medium">
                      {selectedQuote.customer_name || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {recordType === "SALE" && (
            <div className="rounded border bg-white p-6">
              <h2 className="text-lg font-semibold">Sale Customer</h2>

              {!selectedQuote ? (
                <p className="mt-3 text-sm text-gray-500">
                  Select a quote to load the customer.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>

                    <p className="mt-1 text-sm font-medium">
                      {selectedQuote.customer_name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Customer Mobile</p>

                    <p className="mt-1 text-sm font-medium">
                      {selectedQuote.customer_mobile || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>

                    <p className="mt-1 text-sm font-medium">
                      {selectedQuote.customer_id || "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded border bg-white p-6">
            <div>
              <h2 className="text-lg font-semibold">Purchase Vehicle</h2>

              <p className="mt-1 text-sm text-gray-500">
                Vehicle selected from Add Stock.
              </p>
            </div>

            {recordType === "PURCHASE" ? (
              purchaseCarLoading ? (
                <p className="mt-3 text-sm text-gray-500">
                  Loading vehicle information...
                </p>
              ) : !purchaseCar ? (
                <p className="mt-3 text-sm text-red-600">
                  Unable to load the inventory vehicle.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Stock ID</p>

                    <p className="mt-1 text-sm font-medium">
                      {purchaseCar.stock_id ||
                        purchaseCar.vehicle_stock_id ||
                        purchaseCar.id ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Make</p>

                    <p className="mt-1 text-sm font-medium">
                      {purchaseCar.make || purchaseCar.vehicle_make || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Model</p>

                    <p className="mt-1 text-sm font-medium">
                      {purchaseCar.model || purchaseCar.vehicle_model || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Variant</p>

                    <p className="mt-1 text-sm font-medium">
                      {purchaseCar.variant ||
                        purchaseCar.vehicle_variant ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Chassis Number</p>

                    <p className="mt-1 text-sm font-medium">
                      {purchaseCar.chassis_number ||
                        purchaseCar.vehicle_chassis_number ||
                        "—"}
                    </p>
                  </div>
                </div>
              )
            ) : !selectedQuote ? (
              <p className="mt-3 text-sm text-gray-500">
                Select a quote to view the vehicle information.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Stock ID</p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedQuote.vehicle_stock_id || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Make</p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedQuote.vehicle_make || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Model</p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedQuote.vehicle_model || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Variant</p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedQuote.vehicle_variant || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Chassis Number</p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedQuote.vehicle_chassis_number || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Quote Number</p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedQuote.quote_number || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded border bg-white p-6">
            <h2 className="text-lg font-semibold">Branch</h2>

            <div className="mt-4">
              <p className="text-xs text-gray-500">Branch</p>

              <p className="mt-1 text-sm font-medium">
                {selectedBranch
                  ? selectedBranch.name ||
                    selectedBranch.branch_name ||
                    selectedBranch.id
                  : "—"}
              </p>
            </div>
          </div>

          {recordType === "SALE" && (
            <div className="rounded border bg-white p-6">
              <h2 className="text-lg font-semibold">RTA Details</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    RTA Reference Number
                  </label>

                  <input
                    type="text"
                    value={rtaReferenceNumber}
                    onChange={(event) =>
                      setRtaReferenceNumber(event.target.value)
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="Enter RTA reference number"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    First Party Signatory Name
                  </label>

                  <input
                    type="text"
                    value={firstPartySignatoryName}
                    onChange={(event) =>
                      setFirstPartySignatoryName(event.target.value)
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="Enter first party signatory name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Second Party Signatory Name
                  </label>

                  <input
                    type="text"
                    value={secondPartySignatoryName}
                    onChange={(event) =>
                      setSecondPartySignatoryName(event.target.value)
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="Enter second party signatory name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Notes
                  </label>

                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    className="w-full rounded border px-3 py-2"
                    placeholder="Enter any RTA notes"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link to="/rta" className="rounded border px-4 py-2 text-sm">
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded bg-gray-900 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create RTA Record"}
            </button>
          </div>

          <div className="rounded border bg-white p-6">
            {recordType === "SALE" ? (
              <p className="text-sm text-gray-600">
                Quotes loaded: {quotes.length}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Purchase vehicle: {purchaseCar ? "Loaded" : "Not loaded"}
              </p>
            )}

            <p className="mt-2 text-sm text-gray-600">
              Companies loaded: {companies.length}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Branches loaded: {branches.length}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
