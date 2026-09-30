import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { toast } from "react-toastify";

import {
  getCashReceiptsReport,
  getFinanceReport,
  getInventoryReport,
  getOperationalPerformanceReport,
  getSalesReport,
  getVehicleAdditionsReport,
  getVehicleSalesReport,
} from "../../api/reports";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `AED ${String(value)}`;
  }

  return `AED ${number.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatLabel(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Reports() {
  const [period, setPeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [cashReceiptsReport, setCashReceiptsReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [cashReceiptsLoading, setCashReceiptsLoading] = useState(false);
  const [financeReport, setFinanceReport] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  const [vehicleAdditionsReport, setVehicleAdditionsReport] = useState(null);
  const [vehicleAdditionsLoading, setVehicleAdditionsLoading] = useState(false);

  const [vehicleSalesReport, setVehicleSalesReport] = useState(null);
  const [vehicleSalesLoading, setVehicleSalesLoading] = useState(false);

  const [operationalPerformanceReport, setOperationalPerformanceReport] =
    useState(null);
  const [operationalPerformanceLoading, setOperationalPerformanceLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  async function loadSalesReport() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getSalesReport({
        period,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setSalesReport(response);
    } catch (error) {
      console.error("Failed to load sales report:", error);

      const backendErrors = error?.cause?.errors;

      if (backendErrors && typeof backendErrors === "object") {
        const messages = Object.values(backendErrors).flat().filter(Boolean);

        const message = messages.length
          ? messages.join(" ")
          : error?.message || "Unable to load sales report.";

        setErrorMessage(message);
        toast.error(message);
      } else {
        const message = error?.message || "Unable to load sales report.";

        setErrorMessage(message);
        toast.error(message);
      }

      setSalesReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadInventoryReport() {
    try {
      setInventoryLoading(true);

      const response = await getInventoryReport({
        period,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setInventoryReport(response);
    } catch (error) {
      console.error("Failed to load inventory report:", error);

      const backendErrors = error?.cause?.errors;

      if (backendErrors && typeof backendErrors === "object") {
        const messages = Object.values(backendErrors).flat().filter(Boolean);

        const message = messages.length
          ? messages.join(" ")
          : error?.message || "Unable to load inventory report.";

        setErrorMessage(message);
        toast.error(message);
      } else {
        const message = error?.message || "Unable to load inventory report.";

        setErrorMessage(message);
        toast.error(message);
      }

      setInventoryReport(null);
    } finally {
      setInventoryLoading(false);
    }
  }

  async function loadCashReceiptsReport() {
    try {
      setCashReceiptsLoading(true);

      const response = await getCashReceiptsReport({
        period,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setCashReceiptsReport(response);
    } catch (error) {
      console.error("Failed to load cash receipts report:", error);

      const backendErrors = error?.cause?.errors;

      if (backendErrors && typeof backendErrors === "object") {
        const messages = Object.values(backendErrors).flat().filter(Boolean);

        const message = messages.length
          ? messages.join(" ")
          : error?.message || "Unable to load cash receipts report.";

        setErrorMessage(message);
        toast.error(message);
      } else {
        const message =
          error?.message || "Unable to load cash receipts report.";

        setErrorMessage(message);
        toast.error(message);
      }

      setCashReceiptsReport(null);
    } finally {
      setCashReceiptsLoading(false);
    }
  }

  async function loadFinanceReport() {
    try {
      setFinanceLoading(true);

      const response = await getFinanceReport({
        period,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setFinanceReport(response);
    } catch (error) {
      console.error("Failed to load finance report:", error);

      const backendErrors = error?.cause?.errors;

      if (backendErrors && typeof backendErrors === "object") {
        const messages = Object.values(backendErrors).flat().filter(Boolean);

        const message = messages.length
          ? messages.join(" ")
          : error?.message || "Unable to load finance report.";

        setErrorMessage(message);
        toast.error(message);
      } else {
        const message = error?.message || "Unable to load finance report.";

        setErrorMessage(message);
        toast.error(message);
      }

      setFinanceReport(null);
    } finally {
      setFinanceLoading(false);
    }
  }

  async function loadVehicleAdditionsReport() {
    try {
      setVehicleAdditionsLoading(true);

      const response = await getVehicleAdditionsReport({
        period,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setVehicleAdditionsReport(response);
    } catch (error) {
      console.error("Failed to load vehicle additions report:", error);

      const backendErrors = error?.cause?.errors;

      if (backendErrors && typeof backendErrors === "object") {
        const messages = Object.values(backendErrors).flat().filter(Boolean);

        const message = messages.length
          ? messages.join(" ")
          : error?.message || "Unable to load vehicle additions report.";

        setErrorMessage(message);
        toast.error(message);
      } else {
        const message =
          error?.message || "Unable to load vehicle additions report.";

        setErrorMessage(message);
        toast.error(message);
      }

      setVehicleAdditionsReport(null);
    } finally {
      setVehicleAdditionsLoading(false);
    }
  }

  async function loadVehicleSalesReport() {
    try {
      setVehicleSalesLoading(true);

      const response = await getVehicleSalesReport({
        period,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setVehicleSalesReport(response);
    } catch (error) {
      console.error("Failed to load vehicle sales report:", error);

      const backendErrors = error?.cause?.errors;

      if (backendErrors && typeof backendErrors === "object") {
        const messages = Object.values(backendErrors).flat().filter(Boolean);

        const message = messages.length
          ? messages.join(" ")
          : error?.message || "Unable to load vehicle sales report.";

        setErrorMessage(message);
        toast.error(message);
      } else {
        const message =
          error?.message || "Unable to load vehicle sales report.";

        setErrorMessage(message);
        toast.error(message);
      }

      setVehicleSalesReport(null);
    } finally {
      setVehicleSalesLoading(false);
    }
  }

  async function loadOperationalPerformanceReport() {
    try {
      setOperationalPerformanceLoading(true);

      const response = await getOperationalPerformanceReport({
        period,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setOperationalPerformanceReport(response);
    } catch (error) {
      console.error("Failed to load operational performance report:", error);

      const backendErrors = error?.cause?.errors;

      if (backendErrors && typeof backendErrors === "object") {
        const messages = Object.values(backendErrors).flat().filter(Boolean);

        const message = messages.length
          ? messages.join(" ")
          : error?.message || "Unable to load operational performance report.";

        setErrorMessage(message);
        toast.error(message);
      } else {
        const message =
          error?.message || "Unable to load operational performance report.";

        setErrorMessage(message);
        toast.error(message);
      }

      setOperationalPerformanceReport(null);
    } finally {
      setOperationalPerformanceLoading(false);
    }
  }

  useEffect(() => {
    loadSalesReport();
    loadInventoryReport();
    loadCashReceiptsReport();
    loadFinanceReport();
    loadVehicleAdditionsReport();
    loadVehicleSalesReport();
    loadOperationalPerformanceReport();
  }, []);

  function handleApplyFilters() {
    loadSalesReport();
    loadInventoryReport();
    loadCashReceiptsReport();
    loadFinanceReport();
    loadVehicleAdditionsReport();
    loadVehicleSalesReport();
    loadOperationalPerformanceReport();
  }

  function handleResetFilters() {
    setPeriod("daily");
    setDateFrom("");
    setDateTo("");

    setTimeout(() => {
      loadSalesReport();
      loadInventoryReport();
      loadCashReceiptsReport();
      loadFinanceReport();
      loadVehicleAdditionsReport();
      loadVehicleSalesReport();
      loadOperationalPerformanceReport();
    }, 0);
  }

  const summary = salesReport?.summary || {};
  const paymentMethods = Array.isArray(salesReport?.by_payment_method)
    ? salesReport.by_payment_method
    : [];
  const salespeople = Array.isArray(salesReport?.by_salesperson)
    ? salesReport.by_salesperson
    : [];
  const branches = Array.isArray(salesReport?.by_branch)
    ? salesReport.by_branch
    : [];

  const cashReceiptsSummary = cashReceiptsReport?.summary || {};

  const cashReceiptsByDirection = Array.isArray(
    cashReceiptsReport?.by_direction,
  )
    ? cashReceiptsReport.by_direction
    : [];

  const cashReceiptsByCategory = Array.isArray(cashReceiptsReport?.by_category)
    ? cashReceiptsReport.by_category
    : [];

  const cashReceiptsByPaymentMethod = Array.isArray(
    cashReceiptsReport?.by_payment_method,
  )
    ? cashReceiptsReport.by_payment_method
    : [];

  const financeBankLoans = financeReport?.bank_loans || {};
  const financeBankLoanSummary = financeBankLoans?.summary || {};

  const financeBankLoansByStatus = Array.isArray(financeBankLoans?.by_status)
    ? financeBankLoans.by_status
    : [];

  const financeBankLoansByApplicationStatus = Array.isArray(
    financeBankLoans?.by_application_status,
  )
    ? financeBankLoans.by_application_status
    : [];

  const financeBankLoansByBank = Array.isArray(financeBankLoans?.by_bank)
    ? financeBankLoans.by_bank
    : [];

  const financeCashDeals = financeReport?.cash_deals || {};
  const financeCashDealSummary = financeCashDeals?.summary || {};

  const financeCashDealsByStatus = Array.isArray(financeCashDeals?.by_status)
    ? financeCashDeals.by_status
    : [];

  const vehicleAdditionsSummary = vehicleAdditionsReport?.summary || {};

  const vehicleAdditionsByBranch = Array.isArray(
    vehicleAdditionsReport?.by_branch,
  )
    ? vehicleAdditionsReport.by_branch
    : [];

  const vehicleAdditionsBySource = Array.isArray(
    vehicleAdditionsReport?.by_source,
  )
    ? vehicleAdditionsReport.by_source
    : [];

  const vehicleAdditionsByStatus = Array.isArray(
    vehicleAdditionsReport?.by_status,
  )
    ? vehicleAdditionsReport.by_status
    : [];

  const vehicleSalesSummary = vehicleSalesReport?.summary || {};

  const vehicleSalesByBranch = Array.isArray(vehicleSalesReport?.by_branch)
    ? vehicleSalesReport.by_branch
    : [];

  const vehicleSalesByPaymentMethod = Array.isArray(
    vehicleSalesReport?.by_payment_method,
  )
    ? vehicleSalesReport.by_payment_method
    : [];

  const vehicleSalesBySalesperson = Array.isArray(
    vehicleSalesReport?.by_salesperson,
  )
    ? vehicleSalesReport.by_salesperson
    : [];

  const operationalPerformanceCreated =
    operationalPerformanceReport?.created || {};

  const operationalPerformanceCreatedSummary =
    operationalPerformanceCreated?.summary || {};

  const operationalPerformanceByStatus = Array.isArray(
    operationalPerformanceCreated?.by_status,
  )
    ? operationalPerformanceCreated.by_status
    : [];

  const operationalPerformanceByStage = Array.isArray(
    operationalPerformanceCreated?.by_stage,
  )
    ? operationalPerformanceCreated.by_stage
    : [];

  const operationalPerformanceBySourceType = Array.isArray(
    operationalPerformanceCreated?.by_source_type,
  )
    ? operationalPerformanceCreated.by_source_type
    : [];

  const operationalPerformanceByRegistrationEmirate = Array.isArray(
    operationalPerformanceCreated?.by_registration_emirate,
  )
    ? operationalPerformanceCreated.by_registration_emirate
    : [];

  const operationalPerformanceCompleted =
    operationalPerformanceReport?.completed || {};

  const inventorySnapshot = inventoryReport?.current_snapshot || {};

  const inventorySnapshotSummary = inventorySnapshot?.summary || {};

  const inventoryByStatus = Array.isArray(inventorySnapshot?.by_status)
    ? inventorySnapshot.by_status
    : [];

  const inventoryByBranch = Array.isArray(inventorySnapshot?.by_branch)
    ? inventorySnapshot.by_branch
    : [];

  const inventoryAdditions = inventoryReport?.period_additions || {};

  const inventoryAdditionsSummary = inventoryAdditions?.summary || {};

  const inventoryBySource = Array.isArray(inventoryAdditions?.by_source)
    ? inventoryAdditions.by_source
    : [];

  const inventoryAdditionsByStatus = Array.isArray(
    inventoryAdditions?.by_status,
  )
    ? inventoryAdditions.by_status
    : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <BarChart3 size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>

            <p className="text-sm text-slate-500">
              Sales, inventory, finance, cash receipt, vehicle and operational
              reports.
            </p>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Sales Report
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Sales values and breakdowns returned directly by the backend.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label
                htmlFor="sales-period"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Period
              </label>

              <select
                id="sales-period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sales-date-from"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Date From
              </label>

              <input
                id="sales-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="sales-date-to"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Date To
              </label>

              <input
                id="sales-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={loading}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Loading..." : "Apply"}
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                disabled={loading}
                className="inline-flex h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Explicit dates override the selected period in the backend.
          </p>
        </section>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-sm text-slate-500">
              Loading sales report...
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : !salesReport ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            No sales report data available.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Sales
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {summary.total_sales ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Sales Value
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(summary.total_sales_value)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Average Sale Value
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(summary.average_sale_value)}
                </p>
              </div>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-3">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    By Payment Method
                  </h3>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No payment method data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Method
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sales
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Value
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {paymentMethods.map((row, index) => (
                          <tr key={`${row.payment_method}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {formatLabel(row.payment_method)}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.total_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    By Salesperson
                  </h3>
                </div>

                {salespeople.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No salesperson data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Salesperson ID
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sales
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Value
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {salespeople.map((row, index) => (
                          <tr key={`${row.salesperson_id}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {row.salesperson_name ?? "-"}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.total_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">By Branch</h3>
                </div>

                {branches.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No branch data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Branch ID
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sales
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Value
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {branches.map((row, index) => (
                          <tr key={`${row.car__branch_id}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {row.car__branch_id ?? "-"}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.total_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
              Reporting period:{" "}
              <span className="font-medium text-slate-700">
                {salesReport.date_from || "-"}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {salesReport.date_to || "-"}
              </span>
              {salesReport.date_field_note && (
                <span className="ml-2">{salesReport.date_field_note}</span>
              )}
            </div>
          </>
        )}
        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Inventory Report
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current inventory snapshot and vehicles added during the selected
              period.
            </p>
          </div>

          {inventoryLoading ? (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <div className="text-sm text-slate-500">
                Loading inventory report...
              </div>
            </div>
          ) : !inventoryReport ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
              No inventory report data available.
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Vehicles
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {inventorySnapshotSummary.total_vehicles ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Inventory Value
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(inventorySnapshotSummary.inventory_value)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Purchase Cost
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(
                      inventorySnapshotSummary.total_purchase_cost,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vehicles Added
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {inventoryAdditionsSummary.vehicles_added ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Asking Price Added
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(
                      inventoryAdditionsSummary.asking_price_total,
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Purchase Cost Added
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    inventoryAdditionsSummary.purchase_cost_total,
                  )}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      Current Inventory by Status
                    </h3>
                  </div>

                  {inventoryByStatus.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No inventory status data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Status
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Vehicles
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Asking Price
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {inventoryByStatus.map((row, index) => (
                            <tr key={`${row.status}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {formatLabel(row.status)}
                              </td>

                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.count ?? 0}
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                {formatCurrency(row.asking_price_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      Current Inventory by Branch
                    </h3>
                  </div>

                  {inventoryByBranch.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No branch inventory data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Branch ID
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Vehicles
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Asking Price
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {inventoryByBranch.map((row, index) => (
                            <tr key={`${row.branch_id}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {row.branch_id ?? "-"}
                              </td>

                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.count ?? 0}
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                {formatCurrency(row.asking_price_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      Period Additions by Source
                    </h3>
                  </div>

                  {inventoryBySource.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No source data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Source
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Vehicles
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {inventoryBySource.map((row, index) => (
                            <tr key={`${row.source}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {formatLabel(row.source)}
                              </td>

                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.count ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      Period Additions by Status
                    </h3>
                  </div>

                  {inventoryAdditionsByStatus.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No status data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Status
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Vehicles
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {inventoryAdditionsByStatus.map((row, index) => (
                            <tr key={`${row.status}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {formatLabel(row.status)}
                              </td>

                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.count ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
                Inventory report period:{" "}
                <span className="font-medium text-slate-700">
                  {inventoryReport.date_from || "-"}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {inventoryReport.date_to || "-"}
                </span>
              </div>
            </>
          )}
        </section>
        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Cash Receipts Report
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Cash receipts and payment breakdowns returned directly by the
              backend.
            </p>
          </div>

          {cashReceiptsLoading ? (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <div className="text-sm text-slate-500">
                Loading cash receipts report...
              </div>
            </div>
          ) : !cashReceiptsReport ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
              No cash receipts report data available.
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Receipts
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {cashReceiptsSummary.receipt_count ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Amount
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(cashReceiptsSummary.total_amount)}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      By Direction
                    </h3>
                  </div>

                  {cashReceiptsByDirection.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No direction data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Direction
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Receipts
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {cashReceiptsByDirection.map((row, index) => (
                            <tr key={`${row.direction}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {formatLabel(row.direction)}
                              </td>

                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.count ?? 0}
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                {formatCurrency(row.total_amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      By Category
                    </h3>
                  </div>

                  {cashReceiptsByCategory.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No category data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Category
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Receipts
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {cashReceiptsByCategory.map((row, index) => (
                            <tr key={`${row.category}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {formatLabel(row.category)}
                              </td>

                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.count ?? 0}
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                {formatCurrency(row.total_amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      By Payment Method
                    </h3>
                  </div>

                  {cashReceiptsByPaymentMethod.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No payment method data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Method
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Receipts
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {cashReceiptsByPaymentMethod.map((row, index) => (
                            <tr key={`${row.payment_method}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {formatLabel(row.payment_method)}
                              </td>

                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.count ?? 0}
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                {formatCurrency(row.total_amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
                Cash receipts reporting period:{" "}
                <span className="font-medium text-slate-700">
                  {cashReceiptsReport.date_from || "-"}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {cashReceiptsReport.date_to || "-"}
                </span>
              </div>
            </>
          )}
        </section>
      </div>
      <section className="mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Finance Report
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Bank loan and cash deal figures returned directly by the backend.
          </p>
        </div>

        {financeLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-sm text-slate-500">
              Loading finance report...
            </div>
          </div>
        ) : !financeReport ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
            No finance report data available.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="mb-3 text-base font-semibold text-slate-900">
                Bank Loans
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Applications
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {financeBankLoanSummary.applications ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Requested Finance
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(financeBankLoanSummary.requested_finance)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Approved Finance
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(financeBankLoanSummary.approved_finance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-3">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Bank Loans by Status
                  </h3>
                </div>

                {financeBankLoansByStatus.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No bank loan status data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Loans
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Requested
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Approved
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {financeBankLoansByStatus.map((row, index) => (
                          <tr key={`${row.status}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {formatLabel(row.status)}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.requested_finance)}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.approved_finance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Application Status
                  </h3>
                </div>

                {financeBankLoansByApplicationStatus.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No application status data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Application Status
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Applications
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {financeBankLoansByApplicationStatus.map(
                          (row, index) => (
                            <tr key={`${row.application_status}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {formatLabel(row.application_status)}
                              </td>

                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.count ?? 0}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">By Bank</h3>
                </div>

                {financeBankLoansByBank.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No bank data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bank
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Loans
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Requested
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Approved
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {financeBankLoansByBank.map((row, index) => (
                          <tr key={`${row.bank_name}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {row.bank_name || "-"}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.requested_finance)}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.approved_finance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-base font-semibold text-slate-900">
                Cash Deals
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Deals
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {financeCashDealSummary.deals ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Selling Price
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(financeCashDealSummary.selling_price)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Advance Amount
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(financeCashDealSummary.advance_amount)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Balance Amount
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(financeCashDealSummary.balance_amount)}
                  </p>
                </div>
              </div>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Cash Deals by Status
                </h3>
              </div>

              {financeCashDealsByStatus.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No cash deal status data.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Deals
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Selling Price
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Advance
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Balance
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {financeCashDealsByStatus.map((row, index) => (
                        <tr key={`${row.status}-${index}`}>
                          <td className="px-4 py-3 text-slate-700">
                            {formatLabel(row.status)}
                          </td>

                          <td className="px-4 py-3 text-right text-slate-700">
                            {row.count ?? 0}
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(row.selling_price)}
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(row.advance_amount)}
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(row.balance_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
              Finance reporting period:{" "}
              <span className="font-medium text-slate-700">
                {financeReport.date_from || "-"}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {financeReport.date_to || "-"}
              </span>
            </div>
          </>
        )}
      </section>
      <section className="mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Vehicle Additions Report
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Vehicles added during the selected period, using backend-reported
            purchase and asking values.
          </p>
        </div>

        {vehicleAdditionsLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-sm text-slate-500">
              Loading vehicle additions report...
            </div>
          </div>
        ) : !vehicleAdditionsReport ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
            No vehicle additions report data available.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vehicles Added
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {vehicleAdditionsSummary.vehicles_added ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Asking Price Total
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(vehicleAdditionsSummary.asking_price_total)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Purchase Cost Total
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(vehicleAdditionsSummary.purchase_cost_total)}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">By Branch</h3>
                </div>

                {vehicleAdditionsByBranch.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No branch data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Branch ID
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vehicles
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Purchase Cost
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Asking Price
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {vehicleAdditionsByBranch.map((row, index) => (
                          <tr key={`${row.branch_id}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {row.branch_id ?? "-"}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.purchase_cost_total)}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.asking_price_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">By Source</h3>
                </div>

                {vehicleAdditionsBySource.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No source data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Source
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vehicles
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {vehicleAdditionsBySource.map((row, index) => (
                          <tr key={`${row.source}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {formatLabel(row.source)}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">By Status</h3>
                </div>

                {vehicleAdditionsByStatus.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No status data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vehicles
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {vehicleAdditionsByStatus.map((row, index) => (
                          <tr key={`${row.status}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {formatLabel(row.status)}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
              Vehicle additions reporting period:{" "}
              <span className="font-medium text-slate-700">
                {vehicleAdditionsReport.date_from || "-"}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {vehicleAdditionsReport.date_to || "-"}
              </span>
            </div>
          </>
        )}
      </section>
      <section className="mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Vehicle Sales Report
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Completed vehicle sales based on the backend progression completion
            record.
          </p>
        </div>

        {vehicleSalesLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-sm text-slate-500">
              Loading vehicle sales report...
            </div>
          </div>
        ) : !vehicleSalesReport ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
            No vehicle sales report data available.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vehicles Sold
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {vehicleSalesSummary.vehicles_sold ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Sales Value
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(vehicleSalesSummary.total_sales_value)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Average Sale Value
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(vehicleSalesSummary.average_sale_value)}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">By Branch</h3>
                </div>

                {vehicleSalesByBranch.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No branch data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Branch ID
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vehicles
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sales Value
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {vehicleSalesByBranch.map((row, index) => (
                          <tr key={`${row.car__branch_id}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {row.car__branch_id ?? "-"}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.total_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    By Payment Method
                  </h3>
                </div>

                {vehicleSalesByPaymentMethod.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No payment method data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Method
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vehicles
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sales Value
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {vehicleSalesByPaymentMethod.map((row, index) => (
                          <tr key={`${row.payment_method}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {formatLabel(row.payment_method)}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.total_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    By Salesperson
                  </h3>
                </div>

                {vehicleSalesBySalesperson.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No salesperson data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Salesperson
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vehicles
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sales Value
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {vehicleSalesBySalesperson.map((row, index) => (
                          <tr key={`${row.salesperson_id}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {row.salesperson_name ?? "-"}
                            </td>

                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.count ?? 0}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(row.total_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
              Vehicle sales reporting period:{" "}
              <span className="font-medium text-slate-700">
                {vehicleSalesReport.date_from || "-"}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {vehicleSalesReport.date_to || "-"}
              </span>
              {vehicleSalesReport.date_field_note && (
                <span className="ml-2">
                  {vehicleSalesReport.date_field_note}
                </span>
              )}
            </div>
          </>
        )}
      </section>
      <section className="mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Operational Performance Report
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Progression activity and completion metrics returned directly by the
            backend.
          </p>
        </div>

        {operationalPerformanceLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-sm text-slate-500">
              Loading operational performance report...
            </div>
          </div>
        ) : !operationalPerformanceReport ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
            No operational performance report data available.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Progressions Created
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {operationalPerformanceCreatedSummary.progressions_created ??
                    0}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Progressions Completed
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {operationalPerformanceCompleted.progressions_completed ?? 0}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Progressions by Status
                  </h3>
                </div>

                {operationalPerformanceByStatus.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No status data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Progressions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {operationalPerformanceByStatus.map((row, index) => (
                          <tr key={`${row.status}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {formatLabel(row.status)}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {row.count ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Progressions by Current Stage
                  </h3>
                </div>

                {operationalPerformanceByStage.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No stage data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current Stage
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Progressions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {operationalPerformanceByStage.map((row, index) => (
                          <tr key={`${row.current_stage}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {formatLabel(row.current_stage)}
                            </td>

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {row.count ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Progressions by Source Type
                  </h3>
                </div>

                {operationalPerformanceBySourceType.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No source type data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Source Type
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Progressions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {operationalPerformanceBySourceType.map(
                          (row, index) => (
                            <tr key={`${row.source_type}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {formatLabel(row.source_type)}
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                {row.count ?? 0}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Progressions by Registration Emirate
                  </h3>
                </div>

                {operationalPerformanceByRegistrationEmirate.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">
                    No registration emirate data.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Registration Emirate
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Progressions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {operationalPerformanceByRegistrationEmirate.map(
                          (row, index) => (
                            <tr key={`${row.registration_emirate}-${index}`}>
                              <td className="px-4 py-3 text-slate-700">
                                {row.registration_emirate ?? "-"}
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                {row.count ?? 0}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
              Operational performance reporting period:{" "}
              <span className="font-medium text-slate-700">
                {operationalPerformanceReport.date_from || "-"}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {operationalPerformanceReport.date_to || "-"}
              </span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
