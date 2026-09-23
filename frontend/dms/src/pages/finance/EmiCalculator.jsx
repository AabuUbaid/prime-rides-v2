import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { getCars, getCar } from "../../api/inventory";
import {
  createSpecialPriceRequest,
  getSpecialPriceRequests,
} from "../../api/specialPrice";
import {
  getBanks,
  getExpensePresets,
  getServicePackages,
  calculateEmi,
  saveEmiSheet,
} from "../../api/finance";
import ExpenseList from "./components/ExpenseList";
import { formatAED } from "../../utils/formatters";

function EmiCalculator() {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleResults, setVehicleResults] = useState([]);
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleLoading, setSelectedVehicleLoading] = useState(false);
  const [vehicleSource, setVehicleSource] = useState("inventory");

  const [manualVehicle, setManualVehicle] = useState({
    make: "",
    model: "",
    variant: "",
    year: "",
    colour: "",
    mileage: "",
    chassis_number: "",
    engine_number: "",
  });

  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [customInterestEnabled, setCustomInterestEnabled] = useState(false);

  const [vehiclePrice, setVehiclePrice] = useState("");
  const [specialPriceRequesting, setSpecialPriceRequesting] = useState(false);
  const [specialPriceRequestStatus, setSpecialPriceRequestStatus] =
    useState("");
  const [approvedSpecialPriceRequests, setApprovedSpecialPriceRequests] =
    useState([]);
  const [selectedSpecialPriceRequestId, setSelectedSpecialPriceRequestId] =
    useState("");
  const [specialPriceLoading, setSpecialPriceLoading] = useState(false);
  const [downPayment, setDownPayment] = useState("");
  const [tenureYears, setTenureYears] = useState("");
  const [customInterestRate, setCustomInterestRate] = useState("");

  const [includeOtherExpenses, setIncludeOtherExpenses] = useState(false);
  const [selectedExpenseTypes, setSelectedExpenseTypes] = useState([]);
  const [expensePresets, setExpensePresets] = useState([]);
  const [expensePresetsLoading, setExpensePresetsLoading] = useState(true);

  const [drivingLicense, setDrivingLicense] = useState(false);
  const [servicePackages, setServicePackages] = useState([]);
  const [selectedServicePackageId, setSelectedServicePackageId] = useState("");
  const [calculationResult, setCalculationResult] = useState(null);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [calculationError, setCalculationError] = useState("");

  useEffect(() => {
    const searchTerm = vehicleSearch.trim();
    if (!searchTerm) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setVehicleSearchLoading(true);

        const response = await getCars({
          search: searchTerm,
          page: 1,
          page_size: 8,
        });

        setVehicleResults(response.data || []);
      } catch (error) {
        console.error("Vehicle search failed:", error);
        setVehicleResults([]);
      } finally {
        setVehicleSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [vehicleSearch]);

  useEffect(() => {
    async function loadBanks() {
      try {
        setBanksLoading(true);

        const response = await getBanks();

        setBanks(response.data || response || []);
      } catch (error) {
        console.error("Failed to load finance banks:", error);
        setBanks([]);
      } finally {
        setBanksLoading(false);
      }
    }

    loadBanks();
  }, []);

  useEffect(() => {
    async function loadExpensePresets() {
      try {
        setExpensePresetsLoading(true);

        const response = await getExpensePresets({
          active_only: true,
        });

        setExpensePresets(response.data || response || []);
      } catch (error) {
        console.error("Failed to load finance expense presets:", error);

        setExpensePresets([]);
      } finally {
        setExpensePresetsLoading(false);
      }
    }

    loadExpensePresets();
  }, []);

  useEffect(() => {
    async function loadServicePackages() {
      try {
        const response = await getServicePackages({
          active_only: true,
        });

        setServicePackages(response.data || response || []);
      } catch (error) {
        console.error("Failed to load service packages:", error);
        setServicePackages([]);
      }
    }

    loadServicePackages();
  }, []);

  useEffect(() => {
    async function loadApprovedSpecialPrices() {
      if (vehicleSource !== "inventory" || !selectedVehicle?.id) {
        setApprovedSpecialPriceRequests([]);
        setSelectedSpecialPriceRequestId("");
        return;
      }

      try {
        setSpecialPriceLoading(true);

        const response = await getSpecialPriceRequests();
        const requests = response?.data || response || [];

        const approved = Array.isArray(requests)
          ? requests.filter(
              (request) =>
                String(request.car) === String(selectedVehicle.id) &&
                request.status === "approved",
            )
          : [];

        setApprovedSpecialPriceRequests(approved);

        if (approved.length === 0) {
          setSelectedSpecialPriceRequestId("");
        }
      } catch (error) {
        console.error("Failed to load approved Special Prices:", error);
        setApprovedSpecialPriceRequests([]);
        setSelectedSpecialPriceRequestId("");
      } finally {
        setSpecialPriceLoading(false);
      }
    }

    loadApprovedSpecialPrices();
  }, [vehicleSource, selectedVehicle]);

  async function handleVehicleSelect(vehicleId) {
    try {
      setSelectedVehicleLoading(true);

      const response = await getCar(vehicleId);

      const vehicle = response.data || response;

      setSelectedVehicle(vehicle);
      setVehiclePrice(vehicle.asking_price ?? "");
      setApprovedSpecialPriceRequests([]);
      setSelectedSpecialPriceRequestId("");
      setSpecialPriceRequestStatus("");
      setVehicleSearch("");
      setVehicleResults([]);
    } catch (error) {
      console.error("Failed to load selected vehicle:", error);
    } finally {
      setSelectedVehicleLoading(false);
    }
  }

  const selectedBank = banks.find(
    (bank) => String(bank.id) === String(selectedBankId),
  );

  const isCashBank = selectedBank?.is_cash === true;

  async function handleSpecialPriceRequest() {
    if (vehicleSource !== "inventory" || !selectedVehicle) {
      return;
    }

    const requestedPrice = Number(vehiclePrice);
    const leastSellingPrice = Number(selectedVehicle.least_selling_price);

    if (!Number.isFinite(requestedPrice) || requestedPrice <= 0) {
      setCalculationError("Enter a valid vehicle price.");
      return;
    }

    if (
      Number.isFinite(leastSellingPrice) &&
      requestedPrice >= leastSellingPrice
    ) {
      setCalculationError(
        "Special Price enquiry is only required below the Least Selling Price.",
      );
      return;
    }

    try {
      setSpecialPriceRequesting(true);
      setCalculationError("");

      await createSpecialPriceRequest({
        car_id: selectedVehicle.id,
        requested_price: String(requestedPrice),
      });

      setSpecialPriceRequestStatus(
        "Special Price enquiry sent to Master for approval.",
      );
    } catch (error) {
      setSpecialPriceRequestStatus("");
      setCalculationError(
        error.message || "Unable to submit Special Price enquiry.",
      );
    } finally {
      setSpecialPriceRequesting(false);
    }
  }

  async function handleCalculateEmi() {
    setCalculationError("");

    const customerName =
      document.getElementById("customer_name")?.value.trim() || "";

    const customerMobile =
      document.getElementById("customer_mobile")?.value.trim() || "";

    if (!customerName || !customerMobile) {
      setCalculationError("Customer name and mobile are required.");
      return;
    }

    if (!vehiclePrice || Number(vehiclePrice) < 20000) {
      setCalculationError("Vehicle price must be at least AED 20,000.");
      return;
    }

    if (
      vehicleSource === "inventory" &&
      selectedVehicle &&
      Number.isFinite(Number(selectedVehicle.least_selling_price)) &&
      Number(vehiclePrice) < Number(selectedVehicle.least_selling_price) &&
      user?.role !== "MASTER"
    ) {
      if (!selectedSpecialPriceRequestId) {
        setCalculationError(
          "This price is below the Least Selling Price. Select an approved Master Special Price first.",
        );
        return;
      }

      const selectedApproval = approvedSpecialPriceRequests.find(
        (request) =>
          String(request.id) === String(selectedSpecialPriceRequestId),
      );

      if (!selectedApproval) {
        setCalculationError(
          "The selected Special Price approval is no longer available.",
        );
        return;
      }

      if (Number(vehiclePrice) !== Number(selectedApproval.approved_price)) {
        setCalculationError(
          "Vehicle price must match the approved Special Price amount.",
        );
        return;
      }
    }

    if (vehicleSource === "inventory" && !selectedVehicle) {
      setCalculationError("Please select an inventory vehicle.");
      return;
    }

    if (vehicleSource === "manual") {
      if (
        !manualVehicle.make.trim() ||
        !manualVehicle.model.trim() ||
        !manualVehicle.year ||
        !manualVehicle.colour.trim() ||
        !manualVehicle.mileage ||
        !manualVehicle.chassis_number.trim() ||
        !manualVehicle.engine_number.trim()
      ) {
        setCalculationError("Please complete all manual vehicle fields.");
        return;
      }
    }

    if (!selectedBankId) {
      setCalculationError("Please select a bank.");
      return;
    }

    if (!downPayment) {
      setCalculationError("Please enter the down payment.");
      return;
    }

    if (!tenureYears) {
      setCalculationError("Please select the tenure.");
      return;
    }

    try {
      setCalculationLoading(true);

      const payload = {
        customer_name: customerName,
        customer_mobile: customerMobile,
        vehicle_price: Number(vehiclePrice),
        vat_enabled: true,
        down_payment: Number(downPayment),
        tenure_years: Number(tenureYears),
        bank_id: Number(selectedBankId),
        include_other_expenses: includeOtherExpenses,
        expenses: selectedExpenseTypes.map((expenseType) => ({
          expense_type: expenseType,
        })),
        driving_license: drivingLicense,
        service_package_selected: Boolean(selectedServicePackageId),
        service_package_id: selectedServicePackageId
          ? Number(selectedServicePackageId)
          : null,
      };

      if (vehicleSource === "inventory") {
        payload.car_id = selectedVehicle.id;
      } else {
        payload.manual_vehicle = {
          make: manualVehicle.make.trim(),
          model: manualVehicle.model.trim(),
          variant: manualVehicle.variant.trim(),
          year: Number(manualVehicle.year),
          colour: manualVehicle.colour.trim(),
          mileage: Number(manualVehicle.mileage),
          chassis_number: manualVehicle.chassis_number.trim(),
          engine_number: manualVehicle.engine_number.trim(),
        };
      }

      if (!isCashBank && customInterestEnabled && customInterestRate) {
        payload.manual_interest_rate = Number(customInterestRate);
      }

      console.log("EMI calculation payload:", payload);

      const response = await calculateEmi(payload);

      console.log("EMI calculation response:", response);

      setCalculationResult(response.data || response);
    } catch (error) {
      console.error("EMI calculation failed:", error);
      setCalculationResult(null);
      setCalculationError(error.message || "Failed to calculate EMI.");
    } finally {
      setCalculationLoading(false);
    }
  }

  async function handleSaveEmi() {
    if (!calculationResult) {
      setCalculationError("Please calculate the EMI before saving.");
      return;
    }

    setCalculationError("");

    const customerName =
      document.getElementById("customer_name")?.value.trim() || "";

    const customerMobile =
      document.getElementById("customer_mobile")?.value.trim() || "";

    if (!customerName || !customerMobile) {
      setCalculationError("Customer name and mobile are required.");
      return;
    }

    try {
      setCalculationLoading(true);

      const payload = {
        customer_name: customerName,
        customer_mobile: customerMobile,
        vehicle_price: Number(vehiclePrice),
        vat_enabled: true,
        down_payment: Number(downPayment),
        tenure_years: Number(tenureYears),
        bank_id: Number(selectedBankId),
        special_price_request_id: selectedSpecialPriceRequestId || null,
        include_other_expenses: includeOtherExpenses,
        expenses: selectedExpenseTypes.map((expenseType) => ({
          expense_type: expenseType,
        })),
        driving_license: drivingLicense,
        service_package_selected: Boolean(selectedServicePackageId),
        service_package_id: selectedServicePackageId
          ? Number(selectedServicePackageId)
          : null,
      };

      if (vehicleSource === "inventory") {
        payload.car_id = selectedVehicle.id;
      } else {
        payload.manual_vehicle = {
          make: manualVehicle.make.trim(),
          model: manualVehicle.model.trim(),
          variant: manualVehicle.variant.trim(),
          year: Number(manualVehicle.year),
          colour: manualVehicle.colour.trim(),
          mileage: Number(manualVehicle.mileage),
          chassis_number: manualVehicle.chassis_number.trim(),
          engine_number: manualVehicle.engine_number.trim(),
        };
      }

      if (!isCashBank && customInterestEnabled && customInterestRate) {
        payload.manual_interest_rate = Number(customInterestRate);
      }

      console.log("EMI save payload:", payload);

      const response = await saveEmiSheet(payload);

      console.log("EMI save response:", response);

      if (response && response.success === false) {
        throw new Error(response.message || "Failed to save EMI estimate.");
      }

      const savedEmi = response?.data || response;

      if (!savedEmi?.id) {
        throw new Error(
          "EMI was saved, but the saved record ID was not returned.",
        );
      }

      setCalculationResult(savedEmi);

      navigate(`/finance/emi/${savedEmi.id}`);
    } catch (error) {
      console.error("EMI save failed:", error);

      setCalculationError(error.message || "Failed to save EMI estimate.");
    } finally {
      setCalculationLoading(false);
    }
  }

  function handleExpenseToggle(expenseType) {
    setIncludeOtherExpenses(true);

    setSelectedExpenseTypes((current) => {
      if (current.includes(expenseType)) {
        return current.filter((type) => type !== expenseType);
      }

      return [...current, expenseType];
    });
  }

  const visibleExpensePresets = expensePresets.filter((preset) => {
    if (preset.calculation_type !== "conditional") {
      return true;
    }

    const selectedConditionalPresets = expensePresets.filter(
      (item) =>
        selectedExpenseTypes.includes(item.expense_type) &&
        item.calculation_type === "conditional",
    );

    if (selectedConditionalPresets.length === 0) {
      return true;
    }

    if (selectedExpenseTypes.includes(preset.expense_type)) {
      return true;
    }

    const isRelatedToSelection = selectedConditionalPresets.some(
      (selectedPreset) => {
        const selectedKey = String(selectedPreset.condition_key || "")
          .trim()
          .toLowerCase();

        const selectedType = String(selectedPreset.expense_type || "")
          .trim()
          .toLowerCase();

        const presetKey = String(preset.condition_key || "")
          .trim()
          .toLowerCase();

        const presetType = String(preset.expense_type || "")
          .trim()
          .toLowerCase();

        return (
          (selectedKey && selectedKey === presetKey) ||
          (selectedKey && selectedKey === presetType) ||
          (presetKey && presetKey === selectedType)
        );
      },
    );

    return !isRelatedToSelection;
  });
  function buildExpenseDescription(preset) {
    if (preset.amount === null || preset.amount === undefined) {
      return "";
    }

    return `AED ${preset.amount}`;
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              to="/finance/emi/list"
              className="text-sm font-semibold text-slate-500 transition hover:text-amber-600"
            >
              ← Back to EMI List
            </Link>

            <div className="mt-4 mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-600">
                Sales & Customers
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            EMI Calculator
          </h2>

          <p cclassName="mt-1 text-sm text-slate-500">
            Prepare a finance estimate for a customer and vehicle.
          </p>
        </div>

        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="mb-5">
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Customer
              </h3>

              <p cclassName="mt-1 text-sm text-slate-500">
                Enter the customer details for this finance estimate.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="customer_name"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Customer Name
                </label>

                <input
                  id="customer_name"
                  type="text"
                  placeholder="Enter customer name"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="customer_mobile"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Customer Mobile
                </label>

                <input
                  id="customer_mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </div>
          </section>

          {/* Vehicle */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="mb-5">
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Vehicle
              </h3>

              <p cclassName="mt-1 text-sm text-slate-500">
                Select an existing inventory vehicle or enter a manual vehicle.
              </p>

              <div className="mb-5 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="vehicle_source"
                    value="inventory"
                    checked={vehicleSource === "inventory"}
                    onChange={() => {
                      setVehicleSource("inventory");
                      setSelectedVehicle(null);
                      setVehiclePrice("");
                      setVehicleSearch("");
                      setVehicleResults([]);
                      setManualVehicle({
                        make: "",
                        model: "",
                        variant: "",
                        year: "",
                        colour: "",
                        mileage: "",
                        chassis_number: "",
                        engine_number: "",
                      });
                    }}
                  />
                  Inventory Vehicle
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="vehicle_source"
                    value="manual"
                    checked={vehicleSource === "manual"}
                    onChange={() => {
                      setVehicleSource("manual");
                      setSelectedVehicle(null);
                      setVehiclePrice("");
                      setVehicleSearch("");
                      setVehicleResults([]);
                    }}
                  />
                  Manual Vehicle
                </label>
              </div>
            </div>

            {vehicleSource === "inventory" && (
              <>
                <div className="mb-5">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Vehicle Search
                  </label>

                  <input
                    type="text"
                    value={vehicleSearch}
                    onChange={(event) => setVehicleSearch(event.target.value)}
                    placeholder="Search by stock ID, make, model, chassis, engine..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                  />

                  {vehicleSearchLoading && (
                    <p className="mt-2 text-xs text-gray-500">
                      Searching vehicles...
                    </p>
                  )}

                  {vehicleResults.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {vehicleResults.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => handleVehicleSelect(vehicle.id)}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-mono text-sm font-bold text-amber-600">
                                {vehicle.stock_id || "No Stock ID"}
                              </p>

                              <p className="text-sm text-gray-600">
                                {[
                                  vehicle.year,
                                  vehicle.make,
                                  vehicle.model,
                                  vehicle.variant,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="font-mono text-sm font-bold text-slate-900">
                                AED {vehicle.asking_price ?? "—"}
                              </p>

                              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                {vehicle.mileage ?? "—"} km
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {vehicleSource === "manual" && (
              <div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="manual_make"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Make
                    </label>

                    <input
                      id="manual_make"
                      type="text"
                      value={manualVehicle.make}
                      onChange={(event) =>
                        setManualVehicle((current) => ({
                          ...current,
                          make: event.target.value,
                        }))
                      }
                      placeholder="e.g. BMW"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manual_model"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Model
                    </label>

                    <input
                      id="manual_model"
                      type="text"
                      value={manualVehicle.model}
                      onChange={(event) =>
                        setManualVehicle((current) => ({
                          ...current,
                          model: event.target.value,
                        }))
                      }
                      placeholder="e.g. X5"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manual_variant"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Variant
                    </label>

                    <input
                      id="manual_variant"
                      type="text"
                      value={manualVehicle.variant}
                      onChange={(event) =>
                        setManualVehicle((current) => ({
                          ...current,
                          variant: event.target.value,
                        }))
                      }
                      placeholder="e.g. xDrive40i"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manual_year"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Year
                    </label>

                    <input
                      id="manual_year"
                      type="number"
                      min="1900"
                      value={manualVehicle.year}
                      onChange={(event) =>
                        setManualVehicle((current) => ({
                          ...current,
                          year: event.target.value,
                        }))
                      }
                      placeholder="e.g. 2024"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manual_colour"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Colour
                    </label>

                    <input
                      id="manual_colour"
                      type="text"
                      value={manualVehicle.colour}
                      onChange={(event) =>
                        setManualVehicle((current) => ({
                          ...current,
                          colour: event.target.value,
                        }))
                      }
                      placeholder="e.g. Black"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manual_mileage"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Mileage
                    </label>

                    <input
                      id="manual_mileage"
                      type="number"
                      min="0"
                      value={manualVehicle.mileage}
                      onChange={(event) =>
                        setManualVehicle((current) => ({
                          ...current,
                          mileage: event.target.value,
                        }))
                      }
                      placeholder="e.g. 25000"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manual_chassis_number"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Chassis Number
                    </label>

                    <input
                      id="manual_chassis_number"
                      type="text"
                      value={manualVehicle.chassis_number}
                      onChange={(event) =>
                        setManualVehicle((current) => ({
                          ...current,
                          chassis_number: event.target.value,
                        }))
                      }
                      placeholder="Enter chassis number"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="manual_engine_number"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Engine Number
                    </label>

                    <input
                      id="manual_engine_number"
                      type="text"
                      value={manualVehicle.engine_number}
                      onChange={(event) =>
                        setManualVehicle((current) => ({
                          ...current,
                          engine_number: event.target.value,
                        }))
                      }
                      placeholder="Enter engine number"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>
                </div>

                <div className="mt-5 max-w-md">
                  <label
                    htmlFor="manual_vehicle_price"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Vehicle Price
                  </label>

                  <input
                    id="manual_vehicle_price"
                    type="number"
                    min="20000"
                    value={vehiclePrice}
                    onChange={(event) => setVehiclePrice(event.target.value)}
                    placeholder="Enter vehicle price"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Manual vehicle details will be used instead of an inventory
                  vehicle.
                </p>
              </div>
            )}

            {selectedVehicleLoading && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-gray-500">
                  Loading vehicle details...
                </p>
              </div>
            )}

            {selectedVehicle && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Selected Vehicle
                      </p>

                      <p className="mt-1 font-mono text-base font-bold text-amber-600">
                        {selectedVehicle.stock_id || "—"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVehicle(null);
                        setVehiclePrice("");
                        setVehicleSearch("");
                        setVehicleResults([]);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-900"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Make
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedVehicle.make || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Model
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedVehicle.model || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Variant
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedVehicle.variant || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Year
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedVehicle.year || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Colour
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedVehicle.colour || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Mileage
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedVehicle.mileage ?? "—"} km
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Chassis Number
                      </p>
                      <p className="mt-1 break-all text-sm font-medium text-gray-900">
                        {selectedVehicle.chassis_number || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Engine Number
                      </p>
                      <p className="mt-1 break-all text-sm font-medium text-gray-900">
                        {selectedVehicle.engine_number || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vehicle_price"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Vehicle Price
                    </label>

                    <input
                      id="vehicle_price"
                      type="number"
                      min="20000"
                      value={vehiclePrice}
                      onChange={(event) => setVehiclePrice(event.target.value)}
                      placeholder="Enter vehicle price"
                      className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
                    />
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      <p>
                        Original Asking Price:{" "}
                        <span className="font-medium text-gray-700">
                          AED {selectedVehicle?.asking_price ?? "—"}
                        </span>
                      </p>
                    </div>
                    {vehicleSource === "inventory" &&
                      selectedVehicle &&
                      Number.isFinite(
                        Number(selectedVehicle.least_selling_price),
                      ) &&
                      Number(vehiclePrice) <
                        Number(selectedVehicle.least_selling_price) &&
                      user?.role !== "MASTER" && (
                        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
                          <p className="text-sm font-medium text-green-900">
                            Master Approval
                          </p>

                          {specialPriceLoading ? (
                            <p className="mt-2 text-xs text-green-800">
                              Checking approved Special Prices...
                            </p>
                          ) : approvedSpecialPriceRequests.length > 0 ? (
                            <>
                              <label
                                htmlFor="approved_special_price"
                                className="mt-3 mb-1 block text-xs font-medium text-green-900"
                              >
                                Approved Special Price
                              </label>

                              <select
                                id="approved_special_price"
                                value={selectedSpecialPriceRequestId}
                                onChange={(event) => {
                                  const requestId = event.target.value;

                                  setSelectedSpecialPriceRequestId(requestId);

                                  const approval =
                                    approvedSpecialPriceRequests.find(
                                      (request) =>
                                        String(request.id) ===
                                        String(requestId),
                                    );

                                  if (approval) {
                                    setVehiclePrice(approval.approved_price);
                                    setCalculationError("");
                                  }
                                }}
                                className="w-full rounded-md border border-green-300 bg-white px-3 py-2 text-sm text-gray-900"
                              >
                                <option value="">
                                  Select approved Special Price
                                </option>

                                {approvedSpecialPriceRequests.map((request) => (
                                  <option key={request.id} value={request.id}>
                                    AED {request.approved_price}
                                  </option>
                                ))}
                              </select>

                              {selectedSpecialPriceRequestId && (
                                <p className="mt-2 text-xs text-green-800">
                                  Master-approved price selected. The EMI
                                  vehicle price has been set to the approved
                                  amount.
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="mt-2 text-xs text-green-800">
                              No approved Special Price is currently available
                              for this vehicle.
                            </p>
                          )}
                        </div>
                      )}
                    {Number.isFinite(
                      Number(selectedVehicle?.least_selling_price),
                    ) &&
                      Number(vehiclePrice) <
                        Number(selectedVehicle.least_selling_price) && (
                        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                          <p className="text-sm font-medium text-amber-900">
                            Special Price Approval Required
                          </p>

                          <p className="mt-1 text-xs text-amber-800">
                            This price is below the vehicle's Least Selling
                            Price. Submit the requested price to Master for
                            approval.
                          </p>

                          <button
                            type="button"
                            onClick={handleSpecialPriceRequest}
                            disabled={specialPriceRequesting}
                            className="mt-3 rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {specialPriceRequesting
                              ? "Sending Enquiry..."
                              : "Enquire Master"}
                          </button>

                          {specialPriceRequestStatus && (
                            <p className="mt-2 text-xs font-medium text-amber-900">
                              {specialPriceRequestStatus}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </>
            )}

            {!selectedVehicle &&
              !vehicleSearchLoading &&
              vehicleSearch.trim() &&
              vehicleResults.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">No vehicles found.</p>
              )}
          </section>

          {/* Financing */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="mb-5">
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Financing
              </h3>

              <p cclassName="mt-1 text-sm text-slate-500">
                Configure the finance terms for the estimate.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label
                  htmlFor="down_payment"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Down Payment
                </label>

                <input
                  id="down_payment"
                  type="number"
                  min="0"
                  value={downPayment}
                  onChange={(event) => setDownPayment(event.target.value)}
                  placeholder="AED"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="tenure"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Tenure
                </label>

                <select
                  id="tenure"
                  value={tenureYears}
                  onChange={(event) => setTenureYears(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                >
                  <option value="" disabled>
                    Select tenure
                  </option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="4">4 Years</option>
                  <option value="5">5 Years</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="bank"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Bank
                </label>

                <select
                  id="bank"
                  value={selectedBankId}
                  onChange={(event) => {
                    setSelectedBankId(event.target.value);
                    setCustomInterestEnabled(false);
                    setCustomInterestRate("");
                  }}
                  disabled={banksLoading}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {banksLoading ? "Loading banks..." : "Select bank"}
                  </option>

                  {!banksLoading &&
                    banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                </select>

                {isCashBank && (
                  <p className="mt-2 text-xs text-gray-500">
                    Cash purchase selected. Bank interest and custom interest
                    are not applicable.
                  </p>
                )}
              </div>
            </div>

            {!isCashBank && selectedBankId && (
              <div className="mt-5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={customInterestEnabled}
                    onChange={(event) =>
                      setCustomInterestEnabled(event.target.checked)
                    }
                  />
                  Use Custom Interest Rate
                </label>

                {customInterestEnabled && (
                  <div className="mt-3">
                    <label
                      htmlFor="manual_interest_rate"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Custom Interest Rate
                    </label>

                    <input
                      id="manual_interest_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customInterestRate}
                      onChange={(event) =>
                        setCustomInterestRate(event.target.value)
                      }
                      placeholder="Enter custom rate"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 md:max-w-md"
                    />

                    <p className="mt-1 text-xs text-gray-500">
                      This rate applies only to this EMI estimate and does not
                      change the bank's default rate.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Expenses */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="mb-5">
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Expenses & Additional Charges
              </h3>

              <p cclassName="mt-1 text-sm text-slate-500">
                Select the charges to include in this finance estimate.
              </p>
            </div>

            {/* Dynamic Expense Presets */}
            <div>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={includeOtherExpenses}
                  onChange={(event) => {
                    const checked = event.target.checked;

                    setIncludeOtherExpenses(checked);

                    if (!checked) {
                      setSelectedExpenseTypes([]);
                    }
                  }}
                />

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Include Other Expenses
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    Select from the active Expense Presets configured in Finance
                    Master.
                  </p>
                </div>
              </label>

              {includeOtherExpenses && (
                <div className="mt-4">
                  {expensePresetsLoading ? (
                    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        Loading expense presets...
                      </p>
                    </div>
                  ) : visibleExpensePresets.length > 0 ? (
                    <ExpenseList
                      options={visibleExpensePresets.map((preset) => ({
                        key: preset.id,
                        value: preset.expense_type,
                        label: preset.name,
                        description: buildExpenseDescription(preset),
                      }))}
                      selectedTypes={selectedExpenseTypes}
                      onToggle={handleExpenseToggle}
                      disabled={expensePresetsLoading}
                    />
                  ) : (
                    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        No active Expense Presets are currently configured.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Finance Charges */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  Main Finance Charges
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Insurance */}
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedExpenseTypes.includes("insurance")}
                    onChange={() => {
                      setIncludeOtherExpenses(true);
                      handleExpenseToggle("insurance");
                    }}
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Insurance
                    </p>

                    {selectedExpenseTypes.includes("insurance") && (
                      <label className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={drivingLicense}
                          onChange={(event) =>
                            setDrivingLicense(event.target.checked)
                          }
                          className="h-4 w-4"
                        />
                        Customer has Driving Licence
                      </label>
                    )}
                  </div>
                </label>

                {/* Bank Processing */}
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedExpenseTypes.includes("bank_process")}
                    onChange={() => handleExpenseToggle("bank_process")}
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Bank Processing
                    </p>
                  </div>
                </label>

                {/* Service Package */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <label
                    htmlFor="service_package"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Service Package
                  </label>

                  <select
                    id="service_package"
                    value={selectedServicePackageId}
                    onChange={(event) =>
                      setSelectedServicePackageId(event.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                  >
                    <option value="">No Service Package</option>

                    {servicePackages.map((packageItem) => (
                      <option key={packageItem.id} value={packageItem.id}>
                        {packageItem.name} — AED {packageItem.amount}
                      </option>
                    ))}
                  </select>

                  {selectedServicePackageId && (
                    <p className="mt-2 text-xs text-gray-500">
                      The selected package and amount are resolved again by the
                      backend.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
          {/* Results */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Vehicle Price
              </p>

              <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                {calculationResult?.vehicle_price
                  ? `${formatAED(calculationResult.vehicle_price)}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                VAT Amount
              </p>

              <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                {calculationResult?.vat_amount
                  ? `${formatAED(calculationResult.vat_amount)}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Price After VAT
              </p>

              <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                {calculationResult?.price_after_vat
                  ? `${formatAED(calculationResult.price_after_vat)}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Finance Amount
              </p>

              <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                {calculationResult?.finance_amount
                  ? `${formatAED(calculationResult.finance_amount)}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Interest Rate
              </p>

              <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                {calculationResult?.interest_rate
                  ? `${calculationResult.interest_rate}%`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Total Interest
              </p>

              <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                {calculationResult?.total_interest
                  ? `${formatAED(calculationResult.total_interest)}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Total Payable
              </p>

              <p className="mt-2 font-mono text-xl font-bold text-slate-900">
                {calculationResult?.total_payable
                  ? `${formatAED(calculationResult.total_payable)}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Monthly EMI
              </p>

              <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                {calculationResult?.monthly_emi
                  ? `${formatAED(calculationResult.monthly_emi)}`
                  : "—"}
              </p>
            </div>
          </div>

          {calculationResult && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="mb-5">
                <h3 className="text-sm font-bold tracking-tight text-slate-900">
                  Applied Expenses
                </h3>

                <p cclassName="mt-1 text-sm text-slate-500">
                  Expenses resolved from the current Finance Master
                  configuration.
                </p>
              </div>

              {calculationResult.expenses?.length > 0 ? (
                <div className="space-y-3">
                  {calculationResult.expenses.map((expense, index) => (
                    <div
                      key={`${expense.expense_type}-${index}`}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {expense.name || expense.expense_type}
                        </p>

                        {expense.description && (
                          <p className="mt-1 text-xs text-gray-500">
                            {expense.description}
                          </p>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-gray-900">
                        AED {expense.amount}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-gray-900">
                      Other Expenses Total
                    </p>

                    <p className="text-base font-bold text-gray-900">
                      AED {calculationResult.expense_total ?? "0.00"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    No additional expenses were applied.
                  </p>
                </div>
              )}
            </section>
          )}

          {calculationError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-red-700">{calculationError}</p>
            </div>
          )}
          {/* Actions */}
          <section className="flex flex-wrap justify-end gap-3">
            <Link
              to="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleCalculateEmi}
              disabled={calculationLoading}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {calculationLoading ? "Calculating..." : "Calculate EMI"}
            </button>

            <button
              type="button"
              onClick={handleSaveEmi}
              disabled={calculationLoading || !calculationResult}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {calculationLoading ? "Saving..." : "Save EMI"}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default EmiCalculator;
