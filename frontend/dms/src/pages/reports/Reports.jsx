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

import { getApiErrorMessage } from "../../utils/errorMessage";
import "./Reports.css";

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

function formatCount(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);
  return Number.isNaN(number)
    ? String(value)
    : number.toLocaleString("en-AE");
}

function formatLabel(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getReportParams(filters) {
  return {
    period: filters.period,
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
  };
}

function MetricCard({ label, value }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <span className="absolute inset-y-4 left-0 w-1 rounded-r bg-amber-400" />
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-bold tabular-nums text-slate-950 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function ReportBarChart({ title, rows, label, series }) {
  const chartRows = rows.map((row, index) => ({
    row,
    index,
    label: label(row),
    values: series.map((item) => {
      const rawValue = item.getValue(row);
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return null;
      }

      const value = Number(rawValue);
      return Number.isFinite(value) ? value : null;
    }),
  }));
  const maxValue = Math.max(
    0,
    ...chartRows.flatMap((row) =>
      row.values.map((value) => (value === null ? 0 : Math.abs(value))),
    ),
  );
  const hasValues = chartRows.some((row) =>
    row.values.some((value) => value !== null),
  );
  const colors = {
    amber: "bg-amber-500",
    blue: "bg-sky-500",
    slate: "bg-slate-500",
  };

  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {series.length > 1 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {series.map((item) => (
              <span
                key={item.key}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500"
              >
                <span
                  className={`h-2 w-2 rounded-full ${colors[item.color] || colors.amber}`}
                />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {!rows.length || !hasValues ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No chart data available.
        </p>
      ) : (
        <div className="space-y-4">
          {chartRows.map((chartRow) => (
            <div key={`${chartRow.label}-${chartRow.index}`}>
              <p className="mb-1.5 truncate text-xs font-medium text-slate-700">
                {chartRow.label}
              </p>
              <div className="space-y-1.5">
                {series.map((item, index) => {
                  const value = chartRow.values[index];
                  if (value === null) return null;
                  const width =
                    maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;

                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-3"
                      title={`${item.label}: ${item.format(value)}`}
                    >
                      <div
                        className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`${chartRow.label}: ${item.label}`}
                        aria-valuemin={0}
                        aria-valuemax={maxValue}
                        aria-valuenow={Math.abs(value)}
                      >
                        <div
                          className={`h-full rounded-full transition-[width] ${colors[item.color] || colors.amber}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700">
                        {item.format(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReportDonutChart({ title, rows, label, value, format }) {
  const colors = ["#f59e0b", "#0ea5e9", "#64748b", "#10b981", "#8b5cf6", "#f43f5e"];
  const segments = rows
    .map((row, index) => {
      const rawValue = value(row);
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return null;
      }

      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) return null;

      return {
        label: label(row),
        value: numericValue,
        color: colors[index % colors.length],
        index,
      };
    })
    .filter(Boolean);
  const total = segments.reduce(
    (sum, segment) => sum + Math.abs(segment.value),
    0,
  );
  const circumference = 2 * Math.PI * 38;
  let offset = 0;

  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <h3 className="mb-4 text-sm font-bold text-slate-900">{title}</h3>
      {segments.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No chart data available.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <svg
            className="h-36 w-36 shrink-0"
            viewBox="0 0 100 100"
            role="img"
            aria-label={title}
          >
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="12"
            />
            {total > 0 &&
              segments.map((segment) => {
                const length =
                  (Math.abs(segment.value) / total) * circumference;
                const dashOffset = -offset;
                offset += length;

                return (
                  <circle
                    key={`${segment.label}-${segment.index}`}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="12"
                    strokeDasharray={`${length} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 50 50)"
                  >
                    <title>
                      {segment.label}: {format(segment.value)}
                    </title>
                  </circle>
                );
              })}
            <text
              x="50"
              y="48"
              textAnchor="middle"
              className="fill-slate-500 text-[8px] font-semibold uppercase tracking-wide"
            >
              Breakdown
            </text>
            <text
              x="50"
              y="59"
              textAnchor="middle"
              className="fill-slate-900 text-[7px]"
            >
              {segments.length} groups
            </text>
          </svg>
          <ul className="grid w-full gap-2">
            {segments.map((segment) => (
              <li
                key={`${segment.label}-${segment.index}`}
                className="flex min-w-0 items-center justify-between gap-3 text-xs"
                title={`${segment.label}: ${format(segment.value)}`}
              >
                <span className="flex min-w-0 items-center gap-2 text-slate-600">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="truncate">{segment.label}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                  {format(segment.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const reportFilters = { period, dateFrom, dateTo };

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

  async function loadSalesReport(filters = reportFilters) {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getSalesReport(getReportParams(filters));

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
        toast.error(getApiErrorMessage(error, "Unable to load sales report."));
      } else {
        const message = error?.message || "Unable to load sales report.";

        setErrorMessage(message);
        toast.error(getApiErrorMessage(error, "Unable to load sales report."));
      }

      setSalesReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadInventoryReport(filters = reportFilters) {
    try {
      setInventoryLoading(true);

      const response = await getInventoryReport(getReportParams(filters));

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
        toast.error(
          getApiErrorMessage(error, "Unable to load inventory report."),
        );
      } else {
        const message = error?.message || "Unable to load inventory report.";

        setErrorMessage(message);
        toast.error(
          getApiErrorMessage(error, "Unable to load inventory report."),
        );
      }

      setInventoryReport(null);
    } finally {
      setInventoryLoading(false);
    }
  }

  async function loadCashReceiptsReport(filters = reportFilters) {
    try {
      setCashReceiptsLoading(true);

      const response = await getCashReceiptsReport(getReportParams(filters));

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
        toast.error(
          getApiErrorMessage(error, "Unable to load cash receipts report."),
        );
      } else {
        const message =
          error?.message || "Unable to load cash receipts report.";

        setErrorMessage(message);
        toast.error(
          getApiErrorMessage(error, "Unable to load cash receipts report."),
        );
      }

      setCashReceiptsReport(null);
    } finally {
      setCashReceiptsLoading(false);
    }
  }

  async function loadFinanceReport(filters = reportFilters) {
    try {
      setFinanceLoading(true);

      const response = await getFinanceReport(getReportParams(filters));

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
        toast.error(
          getApiErrorMessage(error, "Unable to load finance report."),
        );
      } else {
        const message = error?.message || "Unable to load finance report.";

        setErrorMessage(message);
        toast.error(
          getApiErrorMessage(error, "Unable to load finance report."),
        );
      }

      setFinanceReport(null);
    } finally {
      setFinanceLoading(false);
    }
  }

  async function loadVehicleAdditionsReport(filters = reportFilters) {
    try {
      setVehicleAdditionsLoading(true);

      const response = await getVehicleAdditionsReport(
        getReportParams(filters),
      );

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
        toast.error(
          getApiErrorMessage(error, "Unable to load vehicle additions report."),
        );
      } else {
        const message =
          error?.message || "Unable to load vehicle additions report.";

        setErrorMessage(message);
        toast.error(
          getApiErrorMessage(error, "Unable to load vehicle additions report."),
        );
      }

      setVehicleAdditionsReport(null);
    } finally {
      setVehicleAdditionsLoading(false);
    }
  }

  async function loadVehicleSalesReport(filters = reportFilters) {
    try {
      setVehicleSalesLoading(true);

      const response = await getVehicleSalesReport(getReportParams(filters));

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
        toast.error(
          getApiErrorMessage(error, "Unable to load vehicle sales report."),
        );
      } else {
        const message =
          error?.message || "Unable to load vehicle sales report.";

        setErrorMessage(message);
        toast.error(
          getApiErrorMessage(error, "Unable to load vehicle sales report."),
        );
      }

      setVehicleSalesReport(null);
    } finally {
      setVehicleSalesLoading(false);
    }
  }

  async function loadOperationalPerformanceReport(filters = reportFilters) {
    try {
      setOperationalPerformanceLoading(true);

      const response = await getOperationalPerformanceReport(
        getReportParams(filters),
      );

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
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to load operational performance report.",
          ),
        );
      } else {
        const message =
          error?.message || "Unable to load operational performance report.";

        setErrorMessage(message);
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to load operational performance report.",
          ),
        );
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

    const resetFilters = { period: "daily", dateFrom: "", dateTo: "" };
    loadSalesReport(resetFilters);
    loadInventoryReport(resetFilters);
    loadCashReceiptsReport(resetFilters);
    loadFinanceReport(resetFilters);
    loadVehicleAdditionsReport(resetFilters);
    loadVehicleSalesReport(resetFilters);
    loadOperationalPerformanceReport(resetFilters);
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
    <div className="reports-page min-h-screen bg-[#f5f6fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
            <BarChart3 size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Performance and financial reporting for your dealership.
            </p>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <BarChart3 size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Reporting period
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <div>
              <label
                htmlFor="sales-period"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Period
              </label>

              <select
                id="sales-period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
                aria-label="Date from"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
                aria-label="Date to"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              />
            </div>

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={loading}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Loading..." : "Apply"}
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                disabled={loading}
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Explicit dates override the selected period in the backend.
          </p>
        </section>

        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Sales Report
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Completed sales and grouped breakdowns for the selected period.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-sm text-slate-500">
              Loading sales report...
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : !salesReport ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            No sales report data available.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Total Sales"
                value={formatCount(summary.total_sales)}
              />
              <MetricCard
                label="Total Sales Value"
                value={formatCurrency(summary.total_sales_value)}
              />
              <MetricCard
                label="Average Sale Value"
                value={formatCurrency(summary.average_sale_value)}
              />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <ReportDonutChart
              title="Sales Value by Payment Method"
              rows={paymentMethods}
              label={(row) => formatLabel(row.payment_method)}
              value={(row) => row.total_value}
              format={formatCurrency}
            />
            <ReportBarChart
              title="Sales by Salesperson"
              rows={salespeople}
              label={(row) =>
                row.salesperson_name ||
                (row.salesperson_id != null
                  ? `Salesperson ${row.salesperson_id}`
                  : "Unassigned")
              }
              series={[
                {
                  key: "sales-count",
                  label: "Sales",
                  color: "blue",
                  getValue: (row) => row.count,
                  format: (value) => value.toLocaleString("en-AE"),
                },
              ]}
            />
            <ReportBarChart
              title="Sales by Branch"
              rows={branches}
              label={(row) =>
                row.car__branch_id != null
                  ? `Branch ${row.car__branch_id}`
                  : "Unassigned"
              }
              series={[
                {
                  key: "sales-count",
                  label: "Sales",
                  color: "slate",
                  getValue: (row) => row.count,
                  format: (value) => value.toLocaleString("en-AE"),
                },
              ]}
            />
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
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard
                  label="Total Vehicles"
                  value={formatCount(inventorySnapshotSummary.total_vehicles)}
                />
                <MetricCard
                  label="Inventory Value"
                  value={formatCurrency(inventorySnapshotSummary.inventory_value)}
                />
                <MetricCard
                  label="Total Purchase Cost"
                  value={formatCurrency(
                    inventorySnapshotSummary.total_purchase_cost,
                  )}
                />
                <MetricCard
                  label="Vehicles Added"
                  value={formatCount(inventoryAdditionsSummary.vehicles_added)}
                />
                <MetricCard
                  label="Asking Price Added"
                  value={formatCurrency(
                    inventoryAdditionsSummary.asking_price_total,
                  )}
                />
                <MetricCard
                  label="Purchase Cost Added"
                  value={formatCurrency(
                    inventoryAdditionsSummary.purchase_cost_total,
                  )}
                />
              </div>

              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <ReportDonutChart
                  title="Current Inventory by Status"
                  rows={inventoryByStatus}
                  label={(row) => formatLabel(row.status)}
                  value={(row) => row.count}
                  format={formatCount}
                />
                <ReportBarChart
                  title="Current Inventory by Branch"
                  rows={inventoryByBranch}
                  label={(row) =>
                    row.branch_id != null ? `Branch ${row.branch_id}` : "Unassigned"
                  }
                  series={[
                    {
                      key: "vehicles",
                      label: "Vehicles",
                      color: "blue",
                      getValue: (row) => row.count,
                      format: (value) => value.toLocaleString("en-AE"),
                    },
                  ]}
                />
                <ReportBarChart
                  title="Vehicle Additions by Source"
                  rows={inventoryBySource}
                  label={(row) => formatLabel(row.source)}
                  series={[
                    {
                      key: "vehicles",
                      label: "Vehicles",
                      color: "slate",
                      getValue: (row) => row.count,
                      format: (value) => value.toLocaleString("en-AE"),
                    },
                  ]}
                />
                <ReportBarChart
                  title="Vehicle Additions by Status"
                  rows={inventoryAdditionsByStatus}
                  label={(row) => formatLabel(row.status)}
                  series={[
                    {
                      key: "vehicles",
                      label: "Vehicles",
                      color: "amber",
                      getValue: (row) => row.count,
                      format: (value) => value.toLocaleString("en-AE"),
                    },
                  ]}
                />
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
                <MetricCard
                  label="Total Receipts"
                  value={formatCount(cashReceiptsSummary.receipt_count)}
                />
                <MetricCard
                  label="Total Receipt Amount"
                  value={formatCurrency(cashReceiptsSummary.total_amount)}
                />
              </div>

              <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <ReportBarChart
                  title="Receipts by Direction"
                  rows={cashReceiptsByDirection}
                  label={(row) => formatLabel(row.direction)}
                  series={[
                    {
                      key: "amount",
                      label: "Amount",
                      color: "amber",
                      getValue: (row) => row.total_amount,
                      format: formatCurrency,
                    },
                  ]}
                />
                <ReportBarChart
                  title="Receipts by Category"
                  rows={cashReceiptsByCategory}
                  label={(row) => formatLabel(row.category)}
                  series={[
                    {
                      key: "amount",
                      label: "Amount",
                      color: "blue",
                      getValue: (row) => row.total_amount,
                      format: formatCurrency,
                    },
                  ]}
                />
                <ReportBarChart
                  title="Receipts by Payment Method"
                  rows={cashReceiptsByPaymentMethod}
                  label={(row) => formatLabel(row.payment_method)}
                  series={[
                    {
                      key: "amount",
                      label: "Amount",
                      color: "slate",
                      getValue: (row) => row.total_amount,
                      format: formatCurrency,
                    },
                  ]}
                />
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
                <MetricCard
                  label="Applications"
                  value={formatCount(financeBankLoanSummary.applications)}
                />
                <MetricCard
                  label="Requested Finance"
                  value={formatCurrency(financeBankLoanSummary.requested_finance)}
                />
                <MetricCard
                  label="Approved Finance"
                  value={formatCurrency(financeBankLoanSummary.approved_finance)}
                />
              </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
              <ReportBarChart
                title="Bank Loans by Status"
                rows={financeBankLoansByStatus}
                label={(row) => formatLabel(row.status)}
                series={[
                  {
                    key: "loans",
                    label: "Loans",
                    color: "amber",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
              <ReportBarChart
                title="Applications by Status"
                rows={financeBankLoansByApplicationStatus}
                label={(row) => formatLabel(row.application_status)}
                series={[
                  {
                    key: "applications",
                    label: "Applications",
                    color: "blue",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
              <ReportBarChart
                title="Requested vs Approved by Bank"
                rows={financeBankLoansByBank}
                label={(row) => row.bank_name || "Unassigned"}
                series={[
                  {
                    key: "requested",
                    label: "Requested",
                    color: "amber",
                    getValue: (row) => row.requested_finance,
                    format: formatCurrency,
                  },
                  {
                    key: "approved",
                    label: "Approved",
                    color: "blue",
                    getValue: (row) => row.approved_finance,
                    format: formatCurrency,
                  },
                ]}
              />
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

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Deals"
                  value={formatCount(financeCashDealSummary.deals)}
                />
                <MetricCard
                  label="Selling Price"
                  value={formatCurrency(financeCashDealSummary.selling_price)}
                />
                <MetricCard
                  label="Advance Amount"
                  value={formatCurrency(financeCashDealSummary.advance_amount)}
                />
                <MetricCard
                  label="Balance Amount"
                  value={formatCurrency(financeCashDealSummary.balance_amount)}
                />
              </div>
            </div>

            <div className="mb-6">
              <ReportBarChart
                title="Cash Deals by Status"
                rows={financeCashDealsByStatus}
                label={(row) => formatLabel(row.status)}
                series={[
                  {
                    key: "deals",
                    label: "Deals",
                    color: "amber",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
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
              <MetricCard
                label="Vehicles Added"
                value={formatCount(vehicleAdditionsSummary.vehicles_added)}
              />
              <MetricCard
                label="Asking Price Total"
                value={formatCurrency(vehicleAdditionsSummary.asking_price_total)}
              />
              <MetricCard
                label="Purchase Cost Total"
                value={formatCurrency(vehicleAdditionsSummary.purchase_cost_total)}
              />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
              <ReportBarChart
                title="Vehicle Additions by Branch"
                rows={vehicleAdditionsByBranch}
                label={(row) =>
                  row.branch_id != null ? `Branch ${row.branch_id}` : "Unassigned"
                }
                series={[
                  {
                    key: "vehicles",
                    label: "Vehicles",
                    color: "amber",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
              <ReportBarChart
                title="Vehicle Additions by Source"
                rows={vehicleAdditionsBySource}
                label={(row) => formatLabel(row.source)}
                series={[
                  {
                    key: "vehicles",
                    label: "Vehicles",
                    color: "blue",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
              <ReportDonutChart
                title="Vehicle Additions by Status"
                rows={vehicleAdditionsByStatus}
                label={(row) => formatLabel(row.status)}
                value={(row) => row.count}
                format={formatCount}
              />
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
              <MetricCard
                label="Vehicles Sold"
                value={formatCount(vehicleSalesSummary.vehicles_sold)}
              />
              <MetricCard
                label="Total Sales Value"
                value={formatCurrency(vehicleSalesSummary.total_sales_value)}
              />
              <MetricCard
                label="Average Sale Value"
                value={formatCurrency(vehicleSalesSummary.average_sale_value)}
              />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
              <ReportBarChart
                title="Vehicle Sales by Branch"
                rows={vehicleSalesByBranch}
                label={(row) =>
                  row.car__branch_id != null
                    ? `Branch ${row.car__branch_id}`
                    : "Unassigned"
                }
                series={[
                  {
                    key: "sales-value",
                    label: "Sales value",
                    color: "amber",
                    getValue: (row) => row.total_value,
                    format: formatCurrency,
                  },
                ]}
              />
              <ReportBarChart
                title="Vehicle Sales by Payment Method"
                rows={vehicleSalesByPaymentMethod}
                label={(row) => formatLabel(row.payment_method)}
                series={[
                  {
                    key: "sales-value",
                    label: "Sales value",
                    color: "blue",
                    getValue: (row) => row.total_value,
                    format: formatCurrency,
                  },
                ]}
              />
              <ReportBarChart
                title="Vehicles Sold by Salesperson"
                rows={vehicleSalesBySalesperson}
                label={(row) =>
                  row.salesperson_name ||
                  (row.salesperson_id != null
                    ? `Salesperson ${row.salesperson_id}`
                    : "Unassigned")
                }
                series={[
                  {
                    key: "vehicles",
                    label: "Vehicles",
                    color: "slate",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
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
              <MetricCard
                label="Progressions Created"
                value={
                  operationalPerformanceCreatedSummary.progressions_created ??
                  0
                }
              />
              <MetricCard
                label="Progressions Completed"
                value={
                  formatCount(
                    operationalPerformanceCompleted.progressions_completed,
                  )
                }
              />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <ReportDonutChart
                title="Progressions by Status"
                rows={operationalPerformanceByStatus}
                label={(row) => formatLabel(row.status)}
                value={(row) => row.count}
                format={formatCount}
              />
              <ReportBarChart
                title="Progressions by Current Stage"
                rows={operationalPerformanceByStage}
                label={(row) => formatLabel(row.current_stage)}
                series={[
                  {
                    key: "progressions",
                    label: "Progressions",
                    color: "blue",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
              <ReportBarChart
                title="Progressions by Source Type"
                rows={operationalPerformanceBySourceType}
                label={(row) => formatLabel(row.source_type)}
                series={[
                  {
                    key: "progressions",
                    label: "Progressions",
                    color: "slate",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
              <ReportBarChart
                title="Progressions by Registration Emirate"
                rows={operationalPerformanceByRegistrationEmirate}
                label={(row) => formatLabel(row.registration_emirate)}
                series={[
                  {
                    key: "progressions",
                    label: "Progressions",
                    color: "amber",
                    getValue: (row) => row.count,
                    format: (value) => value.toLocaleString("en-AE"),
                  },
                ]}
              />
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
    </div>
  );
}
