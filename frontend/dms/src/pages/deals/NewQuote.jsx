import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { createQuote } from "../../api/quotes";
import { getCar, getCars } from "../../api/inventory";
import {
  calculateEmi,
  getBanks,
  getEmi,
  getEmiEstimates,
  getExpensePresets,
  getInsuranceBands,
  getServicePackages,
} from "../../api/finance";

import { useAuth } from "../../context/AuthContext";
import {
  getSpecialPriceRequests,
  createSpecialPriceRequest,
} from "../../api/specialPrice";
const SOURCE_STOCK = "stock";
const SOURCE_SAVED_EMI = "saved_emi";

function getApiData(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

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

function getVehicleName(item) {
  return [
    item?.make || item?.vehicle_make,
    item?.model || item?.vehicle_model,
    item?.variant || item?.vehicle_variant,
  ]
    .filter(Boolean)
    .join(" ");
}

function getCustomerName(emi) {
  return emi?.customer_name || emi?.customer?.customer_name || "";
}

function getCustomerMobile(emi) {
  return emi?.customer_mobile || emi?.customer?.phone_number || "";
}

function getEmiVehicleName(emi) {
  return [emi?.vehicle_make, emi?.vehicle_model, emi?.vehicle_variant]
    .filter(Boolean)
    .join(" ");
}

function isReservedVehicle(car) {
  return (
    String(car?.status || "")
      .trim()
      .toLowerCase() === "reserved"
  );
}

function getExpenseType(preset) {
  return preset?.expense_type || preset?.type || "";
}

function getExpenseName(preset) {
  return (
    preset?.name || preset?.expense_name || getExpenseType(preset) || "Expense"
  );
}

function normalizeConditionValue(value) {
  if (value === true || value === "true") {
    return "true";
  }

  if (value === false || value === "false") {
    return "false";
  }

  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getConditionKey(preset) {
  return String(preset?.condition_key ?? "").trim();
}

function getConditionValue(preset) {
  return normalizeConditionValue(preset?.condition_value);
}

export default function NewQuote() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [source, setSource] = useState(SOURCE_STOCK);

  const [specialPriceRequests, setSpecialPriceRequests] = useState([]);
  const [selectedSpecialPriceRequestId, setSelectedSpecialPriceRequestId] =
    useState("");
  const [loadingSpecialPrices, setLoadingSpecialPrices] = useState(false);
  const [requestingSpecialPrice, setRequestingSpecialPrice] = useState(false);
  const [specialPriceRequested, setSpecialPriceRequested] = useState("");

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleResults, setVehicleResults] = useState([]);
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false);

  const [selectedCar, setSelectedCar] = useState(null);
  const [emiSheets, setEmiSheets] = useState([]);
  const [expensePresets, setExpensePresets] = useState([]);
  const [insuranceBands, setInsuranceBands] = useState([]);
  const [servicePackages, setServicePackages] = useState([]);

  // Stock/Cash calculation state. The Saved EMI workflow below is
  // intentionally kept separate and uses its historical EMI snapshot.
  const [cashBankId, setCashBankId] = useState("");
  const [stockCalculation, setStockCalculation] = useState(null);
  const [calculatingStock, setCalculatingStock] = useState(false);
  const [drivingLicense, setDrivingLicense] = useState(true);
  const [vatEnabled, setVatEnabled] = useState(true);
  const [selectedServicePackageId, setSelectedServicePackageId] = useState("");

  const [selectedCarId, setSelectedCarId] = useState("");

  const [selectedEmiId, setSelectedEmiId] = useState("");

  const [selectedEmi, setSelectedEmi] = useState(null);

  const [loadingEmiDetail, setLoadingEmiDetail] = useState(false);

  const [customerName, setCustomerName] = useState("");

  const [customerMobile, setCustomerMobile] = useState("");

  const [price, setPrice] = useState("");

  const [extraDownPayment, setExtraDownPayment] = useState("");

  const [depositDate, setDepositDate] = useState("");

  const [selectedExpenses, setSelectedExpenses] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [loadingCarDetail, setLoadingCarDetail] = useState(false);

  function isExpensePresetDisabled(preset) {
    const conditionKey = getConditionKey(preset);
    const conditionValue = getConditionValue(preset);

    if (!conditionKey || conditionValue === "") {
      return false;
    }

    const controllingPreset = expensePresets.find(
      (candidate) => getExpenseType(candidate) === conditionKey,
    );

    if (!controllingPreset) {
      return false;
    }

    const controllerSelected = selectedExpenses.some(
      (expense) => String(expense.id) === String(controllingPreset.id),
    );

    if (!controllerSelected) {
      return false;
    }

    return conditionValue === "false";
  }
  /*
   * -------------------------------------------------------
   * Initial data
   * -------------------------------------------------------
   *
   * We load:
   * - Inventory cars
   * - Saved EMI list
   * - Active quote expense presets
   *
   * Expense presets are only shown for Cash/Stock quotes.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");

        const [
          emiResponse,
          expenseResponse,
          banksResponse,
          insuranceResponse,
          servicePackageResponse,
        ] = await Promise.all([
          getEmiEstimates(),
          getExpensePresets({
            active_only: true,
          }),
          getBanks(),
          getInsuranceBands({
            active_only: true,
          }),
          getServicePackages({
            active_only: true,
          }),
        ]);

        if (cancelled) {
          return;
        }

        setEmiSheets(getApiData(emiResponse));
        setExpensePresets(getApiData(expenseResponse));

        setInsuranceBands(getApiData(insuranceResponse));
        setServicePackages(getApiData(servicePackageResponse));

        const banks = getApiData(banksResponse);
        const cashBank = banks.find((bank) => bank?.is_cash === true);

        if (cashBank) {
          setCashBankId(String(cashBank.id));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load quote options.");
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSpecialPriceRequests() {
      try {
        setLoadingSpecialPrices(true);

        const response = await getSpecialPriceRequests();
        const data = getApiData(response);

        if (cancelled) {
          return;
        }

        setSpecialPriceRequests(data);
      } catch (err) {
        if (!cancelled) {
          setSpecialPriceRequests([]);
          console.error("Special price requests failed:", err);
        }
      } finally {
        if (!cancelled) {
          setLoadingSpecialPrices(false);
        }
      }
    }

    loadSpecialPriceRequests();

    return () => {
      cancelled = true;
    };
  }, [selectedCarId, selectedEmiId]);

  const applicableInsuranceBand = (() => {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
      return null;
    }

    return (
      (insuranceBands || []).find((band) => {
        const minimum = Number(band?.minimum_vehicle_price ?? 0);
        const maximumRaw = band?.maximum_vehicle_price;
        const maximum =
          maximumRaw === null || maximumRaw === undefined || maximumRaw === ""
            ? null
            : Number(maximumRaw);

        return (
          numericPrice >= minimum &&
          (maximum === null || numericPrice <= maximum)
        );
      }) || null
    );
  })();

  const selectedServicePackage =
    (servicePackages || []).find(
      (item) => String(item?.id) === String(selectedServicePackageId),
    ) || null;

  const quoteVehicleStockId =
    source === SOURCE_STOCK
      ? selectedCar?.stock_id || selectedCar?.vehicle_stock_id || ""
      : selectedEmi?.vehicle_stock_id || "";

  const usableSpecialPriceRequests = (specialPriceRequests || []).filter(
    (request) => {
      if (String(request?.status || "").toLowerCase() !== "approved") {
        return false;
      }

      if (!quoteVehicleStockId) {
        return false;
      }

      return (
        String(request?.car_stock_id || "").trim() ===
          String(quoteVehicleStockId).trim() ||
        String(request?.car?.stock_id || "").trim() ===
          String(quoteVehicleStockId).trim()
      );
    },
  );

  const selectedSpecialPriceRequest =
    usableSpecialPriceRequests.find(
      (request) => String(request.id) === String(selectedSpecialPriceRequestId),
    ) || null;

  const selectedApprovedSpecialPrice =
    selectedSpecialPriceRequest?.approved_price ?? null;

  const isSelectedExpenseType = (expenseType) =>
    selectedExpenses.some((expense) => getExpenseType(expense) === expenseType);

  const addOrRemoveSpecialExpense = (expenseType, expenseData) => {
    setSelectedExpenses((current) => {
      const exists = current.some(
        (expense) => getExpenseType(expense) === expenseType,
      );

      if (exists) {
        return current.filter(
          (expense) => getExpenseType(expense) !== expenseType,
        );
      }

      return [...current, expenseData];
    });
  };

  /*
   * -------------------------------------------------------
   * Source switching
   * -------------------------------------------------------
   */
  const handleSourceChange = (nextSource) => {
    if (nextSource === source) {
      return;
    }

    setSource(nextSource);

    setSelectedCarId("");
    setSelectedEmiId("");
    setSelectedEmi(null);
    setSelectedSpecialPriceRequestId("");

    setCustomerName("");
    setCustomerMobile("");
    setPrice("");
    setExtraDownPayment("");
    setDepositDate("");

    setSelectedExpenses([]);
    setStockCalculation(null);
    setDrivingLicense(true);
    setVatEnabled(true);
    setSelectedServicePackageId("");
    setError("");
  };

  /*
   * -------------------------------------------------------
   * Stock selection
   * -------------------------------------------------------
   */
  const handleStockVehicleSelect = async (carId) => {
    setSelectedCarId(carId);
    setSelectedSpecialPriceRequestId("");
    setError("");

    if (!carId) {
      setSelectedCar(null);
      setPrice("");
      setStockCalculation(null);
      return;
    }

    try {
      setLoadingCarDetail(true);

      const response = await getCar(carId);
      const vehicle = response?.data || response;

      if (!vehicle) {
        throw new Error("Vehicle details were not returned.");
      }

      if (isReservedVehicle(vehicle)) {
        throw new Error(
          "This vehicle is reserved and cannot be used for a new Quote.",
        );
      }

      setSelectedCar(vehicle);

      const vehiclePrice = vehicle.asking_price ?? "";

      setPrice(vehiclePrice !== "" ? String(vehiclePrice) : "");

      setVehicleSearch("");
      setVehicleResults([]);
      setStockCalculation(null);
    } catch (err) {
      setSelectedCar(null);
      setSelectedCarId("");
      setSelectedSpecialPriceRequestId("");
      setPrice("");
      setVehicleSearch("");

      setError(err?.message || "Unable to load the selected vehicle.");
    } finally {
      setLoadingCarDetail(false);
    }
  };

  /*
   * -------------------------------------------------------
   * Stock/Cash authoritative calculation
   * -------------------------------------------------------
   *
   * Stock quotes are Cash only, but their VAT and selected
   * expense amounts still come from the backend Finance engine.
   * We use the configured Cash bank only to access the same
   * authoritative Finance calculation/resolution code. No EMI
   * record is created or modified.
   */
  useEffect(() => {
    if (source !== SOURCE_STOCK) {
      return;
    }

    const numericPrice = Number(price);

    if (
      !selectedCarId ||
      !cashBankId ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setStockCalculation(null);
      return;
    }

    let cancelled = false;

    async function calculateStockQuote() {
      try {
        setCalculatingStock(true);

        const response = await calculateEmi({
          vehicle_price: numericPrice,
          vat_enabled: vatEnabled,
          down_payment: 0,
          tenure_years: 1,
          bank_id: Number(cashBankId),
          include_other_expenses: true,
          expenses: selectedExpenses.map((expense) => ({
            expense_type: getExpenseType(expense),
          })),
          driving_license: drivingLicense,
          service_package_selected: Boolean(selectedServicePackageId),
          service_package_id: selectedServicePackageId
            ? Number(selectedServicePackageId)
            : null,
          auto_apply_conditional_expenses: false,
        });

        if (cancelled) {
          return;
        }

        const calculation = unwrapData(response);

        if (response?.success === false || !calculation) {
          throw new Error(
            response?.message || "Unable to calculate stock quotation.",
          );
        }

        setStockCalculation(calculation);
      } catch (err) {
        if (!cancelled) {
          setStockCalculation(null);
          setError(err?.message || "Unable to calculate stock quotation.");
        }
      } finally {
        if (!cancelled) {
          setCalculatingStock(false);
        }
      }
    }

    calculateStockQuote();

    return () => {
      cancelled = true;
    };
  }, [
    source,
    selectedCarId,
    cashBankId,
    price,
    selectedExpenses,
    drivingLicense,
    vatEnabled,
    selectedServicePackageId,
  ]);

  useEffect(() => {
    const searchTerm = vehicleSearch.trim();

    if (!searchTerm) {
      setVehicleResults([]);
      setVehicleSearchLoading(false);
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setVehicleSearchLoading(true);

        const response = await getCars({
          search: searchTerm,
          page: 1,
          page_size: 8,
        });

        if (cancelled) {
          return;
        }

        const results = getApiData(response);

        setVehicleResults(
          results.filter((vehicle) => !isReservedVehicle(vehicle)),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Vehicle search failed:", error);

          setVehicleResults([]);
        }
      } finally {
        if (!cancelled) {
          setVehicleSearchLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [vehicleSearch]);

  useEffect(() => {
    if (!selectedSpecialPriceRequest) {
      if (
        selectedCar?.asking_price !== undefined &&
        selectedCar?.asking_price !== null
      ) {
        setPrice(String(selectedCar.asking_price));
      }
      return;
    }

    if (
      selectedApprovedSpecialPrice !== null &&
      selectedApprovedSpecialPrice !== undefined &&
      selectedApprovedSpecialPrice !== ""
    ) {
      setPrice(String(selectedApprovedSpecialPrice));
    }
  }, [selectedSpecialPriceRequest, selectedApprovedSpecialPrice, selectedCar]);

  const stockVatAmount = stockCalculation?.vat_amount ?? "0";

  const stockPriceAfterVat = stockCalculation?.price_after_vat ?? "";

  const stockExpenseRows = Array.isArray(stockCalculation?.expenses)
    ? stockCalculation.expenses
    : [];

  const stockExpenseTotal = stockCalculation?.expense_total ?? "0";

  const stockFinalTotal =
    stockPriceAfterVat !== ""
      ? Number(stockPriceAfterVat) + Number(stockExpenseTotal || 0)
      : null;

  /*
   * -------------------------------------------------------
   * Saved EMI selection
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * The dropdown response is not assumed to contain the
   * complete historical EMI snapshot.
   *
   * When the user selects an EMI, we call:
   *
   * GET /finance/emi/<id>/
   *
   * and use THAT response as the historical source.
   */
  const handleSavedEmiChange = async (event) => {
    const emiId = event.target.value;

    setSelectedEmiId(emiId);
    setSelectedEmi(null);
    setSelectedSpecialPriceRequestId("");
    setCustomerName("");
    setCustomerMobile("");
    setPrice("");
    setError("");

    if (!emiId) {
      setLoadingEmiDetail(false);
      return;
    }

    try {
      setLoadingEmiDetail(true);

      const response = await getEmi(emiId);

      const emi = unwrapData(response);

      if (!emi) {
        throw new Error("Saved EMI details were not returned.");
      }

      setSelectedEmi(emi);
    } catch (err) {
      setError(err?.message || "Unable to load the selected EMI.");
    } finally {
      setLoadingEmiDetail(false);
    }
  };

  /*
   * -------------------------------------------------------
   * Derive historical Saved EMI values
   * -------------------------------------------------------
   *
   * These are DISPLAY values and submission values.
   * They are not recalculated.
   */
  const financeCustomerName = getCustomerName(selectedEmi);

  const financeCustomerMobile = getCustomerMobile(selectedEmi);

  const financePrice =
    selectedEmi?.price ??
    selectedEmi?.vehicle_price ??
    selectedEmi?.emi_vehicle_price ??
    "";

  const savedEmiDownPayment =
    selectedEmi?.down_payment ?? selectedEmi?.emi_down_payment ?? "";

  const financeAmount =
    selectedEmi?.finance_amount ?? selectedEmi?.emi_finance_amount ?? "";

  const financeBank =
    selectedEmi?.bank_name ?? selectedEmi?.emi_bank_name ?? "";

  const financeRate =
    selectedEmi?.interest_rate ?? selectedEmi?.emi_interest_rate ?? "";

  const financeTenure =
    selectedEmi?.tenure ??
    selectedEmi?.tenure_years ??
    selectedEmi?.tenure_years_count ??
    selectedEmi?.emi_tenure_years ??
    "";

  const financeInterest =
    selectedEmi?.total_interest ?? selectedEmi?.emi_total_interest ?? "";

  const financePayable =
    selectedEmi?.total_payable ?? selectedEmi?.emi_total_payable ?? "";

  const financeMonthlyEmi =
    selectedEmi?.monthly_emi ?? selectedEmi?.emi_monthly_emi ?? "";

  const financeVatAmount =
    selectedEmi?.vat_amount ?? selectedEmi?.emi_vat_amount ?? "";

  const financeExpenseTotal =
    selectedEmi?.expense_total ?? selectedEmi?.emi_expense_total ?? "";

  const financeVehicleName = getEmiVehicleName(selectedEmi);

  /*
   * -------------------------------------------------------
   * Cash quote expenses
   * -------------------------------------------------------
   */
  const handleExpenseToggle = (preset) => {
    const presetId = String(preset.id);
    const conditionKey = getConditionKey(preset);
    const conditionValue = getConditionValue(preset);

    setSelectedExpenses((current) => {
      const exists = current.some((expense) => String(expense.id) === presetId);

      if (exists) {
        return current.filter((expense) => String(expense.id) !== presetId);
      }

      const withoutConflictingPreset = conditionKey
        ? current.filter((expense) => {
            const originalPreset = expensePresets.find(
              (item) => String(item.id) === String(expense.id),
            );

            if (!originalPreset) {
              return true;
            }

            if (getConditionKey(originalPreset) !== conditionKey) {
              return true;
            }

            return getConditionValue(originalPreset) === conditionValue;
          })
        : current;

      return [...withoutConflictingPreset, preset];
    });
  };

  const handleSpecialPriceRequest = async () => {
    if (!selectedCarId) {
      toast.error("Please select a stock vehicle first.");
      return;
    }

    const requestedPrice = Number(specialPriceRequested);

    if (!Number.isFinite(requestedPrice) || requestedPrice <= 0) {
      toast.error("Enter a valid requested Special Price.");
      return;
    }

    if (
      selectedCar?.least_selling_price !== undefined &&
      selectedCar?.least_selling_price !== null &&
      requestedPrice >= Number(selectedCar.least_selling_price)
    ) {
      toast.error(
        "Special Price enquiry is only required below the Least Selling Price.",
      );
      return;
    }

    try {
      setRequestingSpecialPrice(true);
      setError("");

      const response = await createSpecialPriceRequest({
        car_id: selectedCarId,
        requested_price: String(requestedPrice),
      });

      const createdRequest = response?.data || response;

      setSpecialPriceRequests((current) => [createdRequest, ...current]);

      setSpecialPriceRequested("");
      toast.success("Special Price enquiry sent to Master.");
    } catch (err) {
      const message = err?.message || "Unable to submit Special Price enquiry.";

      setError(message);
      toast.error(message);
    } finally {
      setRequestingSpecialPrice(false);
    }
  };

  /*
   * -------------------------------------------------------
   * Validation
   * -------------------------------------------------------
   */

  const validateCashQuote = () => {
    if (!selectedCarId) {
      return "Please select a stock vehicle.";
    }

    if (!customerName.trim()) {
      return "Customer name is required.";
    }

    if (!customerMobile.trim()) {
      return "Customer mobile is required.";
    }

    if (!price) {
      return "Price is required.";
    }

    if (selectedCar && isReservedVehicle(selectedCar)) {
      return "This vehicle is reserved and cannot be used for a new Quote.";
    }

    if (!cashBankId) {
      return "Cash calculation is not configured. Please configure an active Cash bank.";
    }

    if (isSelectedExpenseType("insurance") && !applicableInsuranceBand) {
      return "No active insurance band is configured for this vehicle price.";
    }

    if (selectedServicePackageId && !selectedServicePackage) {
      return "The selected Service Package is no longer available.";
    }

    if (selectedSpecialPriceRequestId) {
      if (!selectedSpecialPriceRequest) {
        return "The selected special price approval is no longer available.";
      }

      if (
        selectedApprovedSpecialPrice === null ||
        selectedApprovedSpecialPrice === undefined ||
        selectedApprovedSpecialPrice === ""
      ) {
        return "The approved special price amount is not available.";
      }
    }

    if (calculatingStock || !stockCalculation) {
      return "Please wait for the quotation calculation to finish.";
    }

    return "";
  };

  const validateSavedEmiQuote = () => {
    if (!selectedEmiId) {
      return "Please select a saved EMI calculation.";
    }

    if (!selectedEmi) {
      return "Please wait for the saved EMI details to finish loading.";
    }

    if (!financeCustomerName.trim()) {
      return "The saved EMI does not contain a customer name.";
    }

    if (!financeCustomerMobile.trim()) {
      return "The saved EMI does not contain a customer mobile number.";
    }

    if (!financePrice) {
      return "The saved EMI does not contain a vehicle price.";
    }

    if (selectedSpecialPriceRequestId) {
      if (!selectedSpecialPriceRequest) {
        return "The selected special price approval is no longer available.";
      }

      if (
        selectedApprovedSpecialPrice === null ||
        selectedApprovedSpecialPrice === undefined ||
        selectedApprovedSpecialPrice === ""
      ) {
        return "The approved special price amount is not available.";
      }
    }

    return "";
  };

  /*
   * -------------------------------------------------------
   * Create Quote
   * -------------------------------------------------------
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.id) {
      toast.error("Your user account could not be identified.");
      return;
    }

    const validationError =
      source === SOURCE_STOCK ? validateCashQuote() : validateSavedEmiQuote();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      let payload;

      /*
       * CASH / STOCK
       *
       * Current inventory vehicle + customer input.
       * Payment method is fixed to Cash.
       */
      if (source === SOURCE_STOCK) {
        payload = {
          source: SOURCE_STOCK,
          car_id: selectedCarId,
          customer_name: customerName.trim(),
          customer_mobile: customerMobile.trim(),
          salesperson_id: user.id,
          price: String(price),
          payment_method: "Cash",
          vat_enabled: vatEnabled,
          vat_amount: stockVatAmount,
          special_price_request_id: selectedSpecialPriceRequestId || null,
        };

        if (depositDate) {
          payload.deposit_date = depositDate;
        }

        if (stockExpenseRows.length > 0) {
          payload.expenses = stockExpenseRows.map((expense) => ({
            expense_type: expense.expense_type,
            name: expense.name || expense.expense_type || "Expense",
            description: expense.description || "",
            estimated_min: expense.amount,
            estimated_max: expense.amount,
            actual_amount: expense.amount,
            applies: true,
          }));
        }
      } else {
        /*
         * FINANCE / SAVED EMI
         *
         * Historical values come from the selected
         * EmiSheet.
         *
         * Current Finance Master settings are never
         * consulted here.
         *
         * We still send customer_name, customer_mobile,
         * and price because the CURRENT backend serializer
         * requires them, while the backend service uses
         * the saved EMI as the historical source.
         */
        payload = {
          source: SOURCE_SAVED_EMI,
          emi_sheet_id: Number(selectedEmiId),

          customer_name: financeCustomerName.trim(),

          customer_mobile: financeCustomerMobile.trim(),
          salesperson_id: user.id,

          price: String(financePrice),

          payment_method: "Finance",
          vat_enabled: Boolean(
            selectedEmi?.vat_enabled ?? selectedEmi?.emi_vat_enabled,
          ),

          vat_amount:
            selectedEmi?.vat_amount ?? selectedEmi?.emi_vat_amount ?? "0.00",
          special_price_request_id: selectedSpecialPriceRequestId || null,
        };

        if (extraDownPayment !== "") {
          payload.extra_down_payment = extraDownPayment;
        }

        if (depositDate) {
          payload.deposit_date = depositDate;
        }

        /*
         * DO NOT send:
         *
         * car_id
         * selected expense presets
         * new EMI calculation inputs
         *
         * The saved EmiSheet is the Finance source.
         */
      }

      const response = await createQuote(payload);

      if (response?.success === false) {
        throw new Error(response.message || "Quote creation failed.");
      }

      const createdQuote = response?.data || response;

      toast.success("Quote created successfully.");

      if (createdQuote?.id) {
        navigate(`/deals/${createdQuote.id}`);
      } else {
        navigate("/deals");
      }
    } catch (err) {
      const message = err?.message || "Unable to create quote.";

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

          <p className="text-sm font-medium text-slate-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/deals"
          className="text-sm font-semibold text-slate-500 transition hover:text-amber-600"
        >
          ← Back to Deals
        </Link>

        <div className="mt-4 mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-600">
            Sales & Customers
          </span>
        </div>

        <h1 className="text-2xl font-mono tracking-tight text-slate-900">
          New Quote
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create a Cash quotation from stock or a Finance quotation from a saved
          EMI.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sale Type */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-mono tracking-tight text-slate-900">
              Sale Type
            </h2>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSourceChange(SOURCE_STOCK)}
              className={`rounded-2xl border p-5 text-left transition-all ${
                source === SOURCE_STOCK
                  ? "border-amber-400 bg-amber-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-base font-semibold text-gray-900">
                Cash Sale
              </div>

              <div className="mt-1 text-sm text-gray-500">
                Select an available vehicle from inventory and create a Cash
                quotation.
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSourceChange(SOURCE_SAVED_EMI)}
              className={`rounded-2xl border p-5 text-left transition-all ${
                source === SOURCE_SAVED_EMI
                  ? "border-amber-400 bg-amber-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="text-base font-semibold text-gray-900">
                Finance Sale
              </div>

              <div className="mt-1 text-sm text-gray-500">
                Select a saved EMI and use its historical Finance information.
              </div>
            </button>
          </div>
        </section>

        {/* ================================================= */}
        {/* CASH SALE                                        */}
        {/* ================================================= */}
        {source === SOURCE_STOCK && (
          <>
            {/* Vehicle */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-mono tracking-tight text-slate-900">
                  Vehicle
                </h2>
              </div>

              <div className="p-5">
                <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                  Stock Vehicle
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={vehicleSearch}
                    onChange={(event) => {
                      setVehicleSearch(event.target.value);

                      if (selectedCar) {
                        setSelectedCar(null);
                        setSelectedCarId("");
                        setSelectedSpecialPriceRequestId("");
                        setPrice("");
                        setStockCalculation(null);
                      }
                    }}
                    placeholder="Search by stock ID, make, model, chassis, engine..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />

                  {vehicleSearchLoading && (
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Searching vehicles...
                    </p>
                  )}

                  {!vehicleSearchLoading &&
                    vehicleSearch.trim() &&
                    vehicleResults.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">
                        No vehicles found.
                      </p>
                    )}

                  {vehicleResults.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {vehicleResults.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => handleStockVehicleSelect(vehicle.id)}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-mono text-sm font-mono text-amber-600">
                                {vehicle.stock_id || "No Stock ID"}
                              </p>

                              <p className="text-sm text-slate-600">
                                {[
                                  vehicle.year,
                                  vehicle.make,
                                  vehicle.model,
                                  vehicle.variant,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              </p>

                              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                {vehicle.chassis_number ||
                                  vehicle.vehicle_chassis_number ||
                                  "No chassis number"}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="font-mono text-sm font-mono text-slate-900">
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

                {selectedCar && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {getVehicleName(selectedCar) || "Selected Vehicle"}
                    </div>

                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400">
                          Stock ID
                        </div>

                        <div className="font-mono text-sm font-semibold text-slate-800">
                          {selectedCar.stock_id ||
                            selectedCar.vehicle_stock_id ||
                            "-"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400">
                          Asking Price
                        </div>

                        <div className="font-mono text-sm font-semibold text-slate-800">
                          {formatCurrency(selectedCar.asking_price)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400">
                          Chassis
                        </div>

                        <div className="font-mono text-sm font-semibold text-slate-800">
                          {selectedCar.chassis_number ||
                            selectedCar.vehicle_chassis_number ||
                            "-"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400">
                          Engine
                        </div>

                        <div className="font-mono text-sm font-semibold text-slate-800">
                          {selectedCar.engine_number ||
                            selectedCar.vehicle_engine_number ||
                            "-"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400">
                          Status
                        </div>

                        <div className="font-mono text-sm font-semibold text-slate-800">
                          {selectedCar.status || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Customer */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-mono tracking-tight text-slate-900">
                  Customer
                </h2>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                    Customer Name
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Enter customer name"
                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                    Mobile
                  </label>

                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(event) => setCustomerMobile(event.target.value)}
                    placeholder="Enter mobile number"
                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
                  />
                </div>
              </div>
            </section>

            {/* Commercial */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-mono tracking-tight text-slate-900">
                  Commercial Details
                </h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  VAT and expense amounts are calculated from the backend
                  Finance Master.
                </p>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                    Vehicle Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder={
                      loadingCarDetail ? "Loading vehicle price..." : "0.00"
                    }
                    disabled={loadingCarDetail || !selectedCarId}
                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                    Payment Method
                  </label>

                  <div className="flex rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Cash
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                    Deposit Date
                  </label>

                  <input
                    type="date"
                    value={depositDate}
                    onChange={(event) => setDepositDate(event.target.value)}
                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
                  />
                </div>
              </div>
            </section>

            {/* Special Price */}
            {/* Special Price */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-mono tracking-tight text-slate-900">
                  Special Price
                </h2>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Request Master approval for a transaction-specific price below
                  the vehicle's Least Selling Price.
                </p>
              </div>

              <div className="p-5 space-y-5">
                {loadingSpecialPrices ? (
                  <div className="text-sm text-gray-500">
                    Loading special price requests...
                  </div>
                ) : usableSpecialPriceRequests.length > 0 ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                        Approved Special Price
                      </label>

                      <select
                        value={selectedSpecialPriceRequestId}
                        onChange={(event) =>
                          setSelectedSpecialPriceRequestId(event.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                      >
                        <option value="">Use standard vehicle price</option>

                        {usableSpecialPriceRequests.map((request) => (
                          <option key={request.id} value={request.id}>
                            Request #{request.id} — AED{" "}
                            {formatCurrency(request.approved_price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedSpecialPriceRequest && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Requested
                            </div>
                            <div className="font-mono text-sm font-bold text-slate-900">
                              AED{" "}
                              {formatCurrency(
                                selectedSpecialPriceRequest.requested_price,
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Approved
                            </div>
                            <div className="font-mono text-sm font-bold text-slate-900">
                              AED {formatCurrency(selectedApprovedSpecialPrice)}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Expires
                            </div>
                            <div className="font-mono text-sm font-bold text-slate-900">
                              {selectedSpecialPriceRequest.expires_at
                                ? new Date(
                                    selectedSpecialPriceRequest.expires_at,
                                  ).toLocaleString()
                                : "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    No approved special price is available for this vehicle.
                  </div>
                )}

                {selectedCar && (
                  <div className="border-t border-gray-200 pt-5">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Enquire Master for Special Price
                    </h3>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      This request is for this vehicle only and does not change
                      its inventory asking price.
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                          Current Asked Price
                        </label>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
                          AED {formatCurrency(selectedCar.asking_price)}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                          Least Selling Price
                        </label>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
                          AED {formatCurrency(selectedCar.least_selling_price)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                        Requested Price
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={specialPriceRequested}
                        onChange={(event) =>
                          setSpecialPriceRequested(event.target.value)
                        }
                        placeholder="Enter requested price"
                        className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSpecialPriceRequest}
                      disabled={requestingSpecialPrice || !selectedCarId}
                      className="mt-4 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {requestingSpecialPrice ? "Sending..." : "Enquire Master"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Quote Expenses */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-mono tracking-tight text-slate-900">
                  Other Expenses
                </h2>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Select any applicable Master-configured expenses. The backend
                  resolves the actual amount.
                </p>
              </div>

              <div className="p-5">
                {expensePresets.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No active expense presets available.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {expensePresets
                      .filter((preset) => {
                        const type = getExpenseType(preset);

                        return ![
                          "bank_process",
                          "bank_processing",
                          "insurance",
                          "service_package",
                        ].includes(type);
                      })
                      .map((preset) => {
                        const selected = selectedExpenses.some(
                          (expense) => String(expense.id) === String(preset.id),
                        );

                        const disabled = isExpensePresetDisabled(preset);

                        const expenseType = getExpenseType(preset);

                        return (
                          <label
                            key={preset.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                              selected
                                ? "border-amber-400 bg-amber-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }${
                              disabled
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={disabled}
                              onChange={() => handleExpenseToggle(preset)}
                              className="mt-1"
                            />

                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {getExpenseName(preset)}
                              </div>

                              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                {expenseType || "Configured expense"}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        VAT
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Apply the backend-configured VAT rate to this stock
                        quotation.
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={vatEnabled}
                        onChange={(event) =>
                          setVatEnabled(event.target.checked)
                        }
                      />
                      VAT Enabled
                    </label>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                      isSelectedExpenseType("insurance")
                        ? "border-amber-400 bg-amber-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelectedExpenseType("insurance")}
                      disabled={!applicableInsuranceBand}
                      onChange={() => {
                        if (!applicableInsuranceBand) {
                          return;
                        }

                        addOrRemoveSpecialExpense("insurance", {
                          id: "special-insurance",
                          expense_type: "insurance",
                          name: applicableInsuranceBand.name || "Insurance",
                          description:
                            "Insurance resolved from the applicable Master band.",
                          estimated_min: applicableInsuranceBand.amount,
                          estimated_max: applicableInsuranceBand.amount,
                          applies: true,
                        });
                      }}
                      className="mt-1"
                    />

                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Insurance
                      </div>

                      {applicableInsuranceBand ? (
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          {applicableInsuranceBand.name ||
                            "Applicable insurance band"}
                          {" — "}
                          {formatCurrency(applicableInsuranceBand.amount)}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-red-500">
                          No active insurance band covers this vehicle price.
                        </div>
                      )}
                    </div>
                  </label>

                  <div>
                    <label
                      htmlFor="service_package"
                      className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500"
                    >
                      Service Package
                    </label>

                    <select
                      id="service_package"
                      value={selectedServicePackageId}
                      onChange={(event) => {
                        setSelectedServicePackageId(event.target.value);
                        setStockCalculation(null);
                      }}
                      className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    >
                      <option value="">No Service Package</option>

                      {(servicePackages || []).map((packageItem) => (
                        <option key={packageItem.id} value={packageItem.id}>
                          {packageItem.name} — AED{" "}
                          {formatCurrency(packageItem.amount)}
                        </option>
                      ))}
                    </select>

                    {selectedServicePackage && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        {selectedServicePackage.description ||
                          "Selected Service Package"}
                      </p>
                    )}
                  </div>
                </div>

                {isSelectedExpenseType("insurance") && (
                  <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 text-sm font-medium text-gray-900">
                      Insurance Options
                    </div>

                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={drivingLicense}
                        onChange={(event) =>
                          setDrivingLicense(event.target.checked)
                        }
                      />
                      Customer has a driving licence
                    </label>

                    {!drivingLicense &&
                      applicableInsuranceBand?.no_license_surcharge !==
                        undefined && (
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          No-licence surcharge:{" "}
                          {formatCurrency(
                            applicableInsuranceBand.no_license_surcharge,
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </section>

            {/* Cash Quote Calculation */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-mono tracking-tight text-slate-900">
                  Quote Calculation
                </h2>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  VAT is applied by the backend at the configured VAT rate.
                  Expense amounts are also resolved by the backend.
                </p>
              </div>

              <div className="p-5">
                {calculatingStock ? (
                  <div className="text-sm text-gray-500">
                    Calculating quotation...
                  </div>
                ) : stockCalculation ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          Vehicle Price
                        </div>
                        <div className="mt-1 font-mono text-base font-bold text-slate-900">
                          {formatCurrency(stockCalculation.vehicle_price)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          VAT
                        </div>
                        <div className="mt-1 font-mono text-base font-bold text-slate-900">
                          {formatCurrency(stockVatAmount)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          Price After VAT
                        </div>
                        <div className="mt-1 font-mono text-base font-bold text-slate-900">
                          {formatCurrency(stockPriceAfterVat)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                          Expense Total
                        </div>
                        <div className="mt-1 font-mono text-base font-bold text-slate-900">
                          {formatCurrency(stockExpenseTotal)}
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
                        Selected Expenses
                      </div>

                      {stockExpenseRows.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {stockExpenseRows.map((expense, index) => (
                            <div
                              key={expense.expense_type || expense.id || index}
                              className="flex items-center justify-between px-4 py-3"
                            >
                              <span className="text-sm text-gray-700">
                                {expense.name ||
                                  expense.expense_type ||
                                  "Expense"}
                              </span>

                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(expense.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-4 text-sm text-gray-500">
                          No additional expenses selected.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-4 text-white shadow-sm ">
                      <span className="text-sm font-medium">
                        Final Quotation Amount
                      </span>

                      <span className="font-mono text-xl font-bold text-amber-400">
                        {formatCurrency(stockFinalTotal)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Select a vehicle and enter the price to calculate the
                    quotation.
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* ================================================= */}
        {/* FINANCE SALE                                     */}
        {/* ================================================= */}
        {source === SOURCE_SAVED_EMI && (
          <>
            {/* Saved EMI selector */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-mono tracking-tight text-slate-900">
                  Saved EMI
                </h2>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Select the historical EMI record to use for this Finance
                  quotation.
                </p>
              </div>

              <div className="p-5">
                <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                  Saved EMI Calculation
                </label>

                <select
                  value={selectedEmiId}
                  onChange={handleSavedEmiChange}
                  disabled={loadingEmiDetail}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 disabled:bg-gray-100"
                >
                  <option value="">Select saved EMI</option>

                  {emiSheets.map((emi) => (
                    <option key={emi.id} value={emi.id}>
                      {getCustomerName(emi) ||
                        getEmiVehicleName(emi) ||
                        `EMI #${emi.id}`}
                      {" — "}
                      {formatCurrency(emi.price ?? emi.vehicle_price)}
                    </option>
                  ))}
                </select>

                {loadingEmiDetail && (
                  <div className="mt-3 text-sm text-gray-500">
                    Loading saved EMI details...
                  </div>
                )}
              </div>
            </section>

            {selectedEmi && (
              <>
                {/* Historical Customer */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-mono tracking-tight text-slate-900">
                      Customer
                    </h2>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Historical customer information from the saved EMI.
                    </p>
                  </div>

                  <div className="grid gap-5 p-5 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-sm text-gray-500">
                        Customer Name
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
                        {financeCustomerName || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-sm text-gray-500">Mobile</div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
                        {financeCustomerMobile || "-"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Historical Vehicle */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-mono tracking-tight text-slate-900">
                      Vehicle
                    </h2>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Historical vehicle information from the saved EMI.
                    </p>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Vehicle
                      </div>

                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {financeVehicleName || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Stock ID
                      </div>

                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {selectedEmi.vehicle_stock_id || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Chassis
                      </div>

                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {selectedEmi.vehicle_chassis_number || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Engine
                      </div>

                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {selectedEmi.vehicle_engine_number || "-"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Special Price */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-mono tracking-tight text-slate-900">
                      Special Price
                    </h2>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Use an approved transaction-specific special price for
                      this vehicle.
                    </p>
                  </div>

                  <div className="p-5">
                    {loadingSpecialPrices ? (
                      <div className="text-sm text-gray-500">
                        Loading approved special prices...
                      </div>
                    ) : usableSpecialPriceRequests.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        No approved special price is available for this vehicle.
                      </div>
                    ) : (
                      <>
                        <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                          Approved Special Price
                        </label>

                        <select
                          value={selectedSpecialPriceRequestId}
                          onChange={(event) =>
                            setSelectedSpecialPriceRequestId(event.target.value)
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                        >
                          <option value="">Use saved EMI price</option>

                          {usableSpecialPriceRequests.map((request) => (
                            <option key={request.id} value={request.id}>
                              Request #{request.id} — AED{" "}
                              {formatCurrency(request.approved_price)}
                            </option>
                          ))}
                        </select>

                        {selectedSpecialPriceRequest && (
                          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                  Requested
                                </div>
                                <div className="font-mono text-sm font-bold text-slate-900">
                                  AED{" "}
                                  {formatCurrency(
                                    selectedSpecialPriceRequest.requested_price,
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                  Approved
                                </div>
                                <div className="font-mono text-sm font-bold text-slate-900">
                                  AED{" "}
                                  {formatCurrency(selectedApprovedSpecialPrice)}
                                </div>
                              </div>

                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                  Expires
                                </div>
                                <div className="font-mono text-sm font-bold text-slate-900">
                                  {selectedSpecialPriceRequest.expires_at
                                    ? new Date(
                                        selectedSpecialPriceRequest.expires_at,
                                      ).toLocaleString()
                                    : "-"}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </section>

                {/* Historical Finance */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-mono tracking-tight text-slate-900">
                      Finance Summary
                    </h2>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Historical values. No new Finance calculation is performed
                      here.
                    </p>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Vehicle Price
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(financePrice)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Payment Method
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        Finance
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Bank
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {financeBank || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Interest Rate
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {financeRate || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        VAT Amount
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(financeVatAmount)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Down Payment
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(savedEmiDownPayment)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Finance Amount
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(financeAmount)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Tenure
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {financeTenure || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Total Interest
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(financeInterest)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Total Payable
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(financePayable)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Monthly EMI
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(financeMonthlyEmi)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Finance Expenses
                      </div>

                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(financeExpenseTotal)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Quote-level details */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-mono tracking-tight text-slate-900">
                      Quote Details
                    </h2>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Finance information above comes from the historical EMI.
                      Only Quote-level values can be entered here.
                    </p>
                  </div>

                  <div className="grid gap-5 p-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                        Payment Method
                      </label>

                      <div className="flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800">
                        Finance
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                        Price
                      </label>

                      <div className="flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800">
                        {formatCurrency(financePrice)}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                        Extra Down Payment
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={extraDownPayment}
                        onChange={(event) =>
                          setExtraDownPayment(event.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500">
                        Deposit Date
                      </label>

                      <input
                        type="date"
                        value={depositDate}
                        onChange={(event) => setDepositDate(event.target.value)}
                        className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
                      />
                    </div>
                  </div>
                </section>

                {/* Historical finance expenses */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-mono tracking-tight text-slate-900">
                      Historical Finance Expenses
                    </h2>

                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      These belong to the saved EMI and are displayed for
                      reference only.
                    </p>
                  </div>

                  <div className="p-5">
                    {Array.isArray(selectedEmi.expenses) &&
                    selectedEmi.expenses.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {selectedEmi.expenses.map((expense, index) => (
                          <div
                            key={expense.id ?? index}
                            className="flex items-center justify-between py-3"
                          >
                            <span className="text-sm text-gray-700">
                              {expense.name ||
                                expense.expense_name ||
                                expense.expense_type ||
                                "Expense"}
                            </span>

                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(
                                expense.amount ??
                                  expense.actual_amount ??
                                  expense.estimated_min,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No historical finance expenses recorded.
                      </p>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/deals"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              submitting ||
              loadingEmiDetail ||
              (source === SOURCE_SAVED_EMI && !selectedEmi) ||
              (source === SOURCE_STOCK &&
                (calculatingStock || !stockCalculation))
            }
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating Quote..." : "Create Quote"}
          </button>
        </div>
      </form>
    </div>
  );
}
