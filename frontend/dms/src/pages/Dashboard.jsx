import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  ArrowUpRight,
  Car,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gauge,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  Wrench,
} from "lucide-react";

import KPICard from "../components/ui/KPICard";

import { getCars } from "../api/inventory";

import { getQuotes } from "../api/quotes";

import { getCashReceipts } from "../api/cashReceipts";

import { getEmiEstimates } from "../api/finance";

import { getProgressions } from "../api/progression";

import { getStaff } from "../api/staff";

import { formatAED } from "../utils/formatters";

/* =========================================================

   HELPERS

\========================================================= */

function getArray(response) {
  const body = response?.data ?? response;

  if (Array.isArray(body)) return body;

  if (Array.isArray(body?.results)) return body.results;

  if (Array.isArray(body?.data)) return body.data;

  return [];
}

function numberValue(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-AE").format(numberValue(value));
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",

    month: "short",
  }).format(date);
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()

    .toLowerCase();
}

function statusLabel(value) {
  if (!value) return "-";

  return String(value)
    .replaceAll("_", " ")

    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getVehicleName(vehicle) {
  return (
    [
      vehicle?.make || vehicle?.vehicle_make,

      vehicle?.model || vehicle?.vehicle_model,
    ]

      .filter(Boolean)

      .join(" ") || "Unknown Vehicle"
  );
}

function getVehicleVariant(vehicle) {
  return vehicle?.variant || vehicle?.vehicle_variant || vehicle?.trim || "-";
}

function getVehicleVin(vehicle) {
  return (
    vehicle?.vin ||
    vehicle?.chassis_number ||
    vehicle?.vehicle_chassis_number ||
    vehicle?.chassis ||
    null
  );
}

function getVehicleMileage(vehicle) {
  return (
    vehicle?.mileage ?? vehicle?.vehicle_mileage ?? vehicle?.odometer ?? null
  );
}

function getVehicleImage(vehicle) {
  const directImage =
    vehicle?.primary_image ||
    vehicle?.image_url ||
    vehicle?.image ||
    vehicle?.photo ||
    vehicle?.thumbnail ||
    vehicle?.cover_image;

  if (typeof directImage === "string") {
    return directImage;
  }

  if (directImage?.url) {
    return directImage.url;
  }

  if (directImage?.image) {
    return directImage.image;
  }

  const images =
    vehicle?.images ||
    vehicle?.photos ||
    vehicle?.media ||
    vehicle?.vehicle_images ||
    [];

  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];

    if (typeof first === "string") {
      return first;
    }

    return (
      first?.url ||
      first?.image_url ||
      first?.image ||
      first?.file ||
      first?.src ||
      null
    );
  }

  return null;
}

function getQuoteDate(quote) {
  return (
    quote?.sold_at ||
    quote?.updated_at ||
    quote?.created_at ||
    quote?.deposit_date ||
    null
  );
}

function getQuoteAmount(quote) {
  return numberValue(
    quote?.price ??
      quote?.emi_vehicle_price ??
      quote?.emi_total_payable ??
      quote?.total_amount,
  );
}

function getReceiptAmount(receipt) {
  return numberValue(
    receipt?.amount ?? receipt?.receipt_amount ?? receipt?.total_amount,
  );
}

function getReceiptDate(receipt) {
  return (
    receipt?.transaction_date ||
    receipt?.receipt_date ||
    receipt?.created_at ||
    null
  );
}

function getEmiAmount(emi) {
  return numberValue(
    emi?.monthly_emi ?? emi?.emi_amount ?? emi?.monthly_payment ?? emi?.emi,
  );
}

function getEmiDate(emi) {
  return emi?.created_at || emi?.updated_at || null;
}

function getMonthKey(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,

    "0",
  )}`;
}

function getCurrentMonthKey() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,

    "0",
  )}`;
}

function getProgressionDate(item) {
  return item?.updated_at || item?.created_at || null;
}

function getProgressionVehicle(item) {
  return (
    item?.vehicle_stock_id ||
    item?.stock_id ||
    item?.vehicle?.stock_id ||
    item?.car?.stock_id ||
    "-"
  );
}

function getProgressionCustomer(item) {
  return (
    item?.customer_name ||
    item?.customer?.name ||
    item?.customer?.customer_name ||
    "-"
  );
}

function getProgressionStage(item) {
  return item?.current_stage || item?.stage || item?.currentStage || "-";
}

function getProgressionPayment(item) {
  const source = normalizeStatus(
    item?.source_type ||
      item?.payment_method ||
      item?.quote?.payment_method ||
      "",
  );

  if (source === "finance") return "Finance";

  if (source === "cash") return "Cash";

  return statusLabel(source) || "-";
}

function getSalespersonId(quote) {
  return (
    quote?.salesperson_id ||
    quote?.salesperson?.id ||
    quote?.salesperson ||
    null
  );
}

function getSalespersonName(quote) {
  return (
    quote?.salesperson_name ||
    quote?.salesperson?.name ||
    quote?.salesperson?.full_name ||
    quote?.salesperson?.username ||
    "Sales Staff"
  );
}

function getStaffId(staff) {
  return (
    staff?.id || staff?.staff_id || staff?.user_id || staff?.user?.id || null
  );
}

function getStaffName(staff) {
  return (
    staff?.name ||
    staff?.full_name ||
    staff?.user_name ||
    staff?.username ||
    staff?.user?.name ||
    staff?.user?.full_name ||
    staff?.user?.username ||
    "Staff Member"
  );
}

function getInitials(name) {
  if (!name) return "S";

  return String(name)
    .split(" ")

    .filter(Boolean)

    .slice(0, 2)

    .map((part) => part.charAt(0).toUpperCase())

    .join("");
}

/* =========================================================

   SMALL COMPONENTS

\========================================================= */

function SectionHeading({ eyebrow, title, description, href, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {eyebrow}
          </p>
        )}

        <h2 className="text-lg font-black tracking-tight text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </div>

      {href && (
        <Link
          to={href}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-950"
        >
          {action || "View All"}

          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon = Package, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-300" />

      <p className="mt-3 text-sm font-semibold text-slate-600">{title}</p>

      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function ProgressBar({ value, max }) {
  const percentage =
    max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-slate-900 transition-all duration-700"
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
}

/* =========================================================

   DASHBOARD

\========================================================= */

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [cars, setCars] = useState([]);

  const [quotes, setQuotes] = useState([]);

  const [receipts, setReceipts] = useState([]);

  const [emiEstimates, setEmiEstimates] = useState([]);

  const [progressions, setProgressions] = useState([]);

  const [staff, setStaff] = useState([]);

  const [errors, setErrors] = useState([]);

  /* =======================================================

     LOAD DATA

  \======================================================= */

  async function loadAllInventory() {
    const pageSize = 100;

    const firstResponse = await getCars({
      page: 1,
      page_size: pageSize,
    });

    const firstCars = getArray(firstResponse);

    const total = Number(
      firstResponse?.pagination?.count ??
        firstResponse?.data?.pagination?.count ??
        firstCars.length,
    );

    const allCars = [...firstCars];

    const totalPages = Math.ceil(total / pageSize);

    for (let page = 2; page <= totalPages; page += 1) {
      const response = await getCars({
        page,
        page_size: pageSize,
      });

      const pageCars = getArray(response);

      allCars.push(...pageCars);
    }

    return allCars;
  }

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);

      const results = await Promise.allSettled([
        loadAllInventory(),
        getQuotes({
          status: "all",

          page: 1,

          page_size: 1000,
        }),

        getCashReceipts({
          page: 1,

          page_size: 1000,
        }),

        getEmiEstimates({
          page: 1,

          page_size: 1000,
        }),

        getProgressions(),

        getStaff(),
      ]);

      if (!active) return;

      const failed = [];

      if (results[0].status === "fulfilled") {
        setCars(results[0].value);
      } else {
        setCars([]);
        failed.push("Inventory");
      }

      if (results[1].status === "fulfilled") {
        setQuotes(getArray(results[1].value));
      } else {
        setQuotes([]);

        failed.push("Sales");
      }

      if (results[2].status === "fulfilled") {
        setReceipts(getArray(results[2].value));
      } else {
        setReceipts([]);

        failed.push("Receipts");
      }

      if (results[3].status === "fulfilled") {
        setEmiEstimates(getArray(results[3].value));
      } else {
        setEmiEstimates([]);

        failed.push("EMI");
      }

      if (results[4].status === "fulfilled") {
        setProgressions(getArray(results[4].value));
      } else {
        setProgressions([]);

        failed.push("Progression");
      }

      if (results[5].status === "fulfilled") {
        setStaff(getArray(results[5].value));
      } else {
        setStaff([]);

        failed.push("Staff");
      }

      setErrors(failed);

      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================

     INVENTORY

  \======================================================= */

  const inventoryStats = useMemo(() => {
    const stats = {
      total: cars.length,

      available: 0,

      reserved: 0,

      booked: 0,

      sold: 0,

      upcoming: 0,

      inHouse: 0,

      inService: 0,

      highlighted: 0,

      inventoryValue: 0,

      purchaseCost: 0,
    };

    cars.forEach((car) => {
      const status = normalizeStatus(car?.status);

      if (status === "available") {
        stats.available += 1;
      }

      if (status === "reserved") {
        stats.reserved += 1;
      }

      if (status === "booked") {
        stats.booked += 1;
      }

      if (status === "sold") {
        stats.sold += 1;
      }

      if (status === "upcoming") {
        stats.upcoming += 1;
      }

      if (status === "in_house") {
        stats.inHouse += 1;
      }

      if (status === "in_service") {
        stats.inService += 1;
      }

      if (car?.highlight_public === true) {
        stats.highlighted += 1;
      }

      stats.inventoryValue += numberValue(car?.asking_price);

      stats.purchaseCost += numberValue(car?.purchase_cost);
    });

    return stats;
  }, [cars]);

  /* =======================================================

     INVENTORY DONUT

  \======================================================= */

  const inventoryGradient = useMemo(() => {
    if (inventoryStats.total <= 0) {
      return "conic-gradient(#334155 0deg 360deg)";
    }

    const parts = [
      {
        value: inventoryStats.available,

        color: "#10b981",
      },

      {
        value: inventoryStats.reserved,

        color: "#f59e0b",
      },

      {
        value: inventoryStats.booked,

        color: "#3b82f6",
      },

      {
        value: inventoryStats.sold,

        color: "#ef4444",
      },

      {
        value: inventoryStats.inService,

        color: "#8b5cf6",
      },

      {
        value: inventoryStats.inHouse,

        color: "#06b6d4",
      },

      {
        value: inventoryStats.upcoming,

        color: "#64748b",
      },
    ];

    let current = 0;

    const segments = [];

    parts.forEach((part) => {
      if (part.value <= 0) return;

      const degrees = (part.value / inventoryStats.total) * 360;

      segments.push(`${part.color} ${current}deg ${current + degrees}deg`);

      current += degrees;
    });

    if (current < 360) {
      segments.push(`#334155 ${current}deg 360deg`);
    }

    return `conic-gradient(${segments.join(", ")})`;
  }, [inventoryStats]);

  /* =======================================================

     LATEST AVAILABLE VEHICLES

  \======================================================= */

  const latestVehicles = useMemo(() => {
    return [...cars]

      .filter((vehicle) => normalizeStatus(vehicle?.status) === "available")

      .sort(
        (a, b) =>
          new Date(b?.created_at || b?.updated_at || 0) -
          new Date(a?.created_at || a?.updated_at || 0),
      )

      .slice(0, 12);
  }, [cars]);

  /* =======================================================

     CURRENT MONTH

  \======================================================= */

  const currentMonthKey = getCurrentMonthKey();

  const currentMonthName = new Intl.DateTimeFormat("en-AE", {
    month: "long",

    year: "numeric",
  }).format(new Date());

  const currentMonthSales = quotes.filter(
    (quote) =>
      normalizeStatus(quote?.status) === "sold" &&
      getMonthKey(getQuoteDate(quote)) === currentMonthKey,
  );

  const currentMonthDeals = quotes.filter(
    (quote) =>
      normalizeStatus(quote?.status) === "booked" &&
      getMonthKey(getQuoteDate(quote)) === currentMonthKey,
  );

  const currentMonthReceipts = receipts.filter(
    (receipt) =>
      normalizeStatus(receipt?.direction) === "customer_payment" &&
      receipt?.is_reversal !== true &&
      normalizeStatus(receipt?.status) !== "reversed" &&
      getMonthKey(getReceiptDate(receipt)) === currentMonthKey,
  );

  const currentMonthEmi = emiEstimates.filter(
    (emi) => getMonthKey(getEmiDate(emi)) === currentMonthKey,
  );

  const currentMonthSalesValue = currentMonthSales.reduce(
    (total, quote) => total + getQuoteAmount(quote),

    0,
  );

  const currentMonthDealsValue = currentMonthDeals.reduce(
    (total, quote) => total + getQuoteAmount(quote),

    0,
  );

  const currentMonthReceiptValue = currentMonthReceipts.reduce(
    (total, receipt) => total + getReceiptAmount(receipt),

    0,
  );

  const currentMonthEmiValue = currentMonthEmi.reduce(
    (total, emi) => total + getEmiAmount(emi),

    0,
  );

  /* =======================================================

     FINANCIAL

  \======================================================= */

  const totalSalesValue = quotes

    .filter((quote) => normalizeStatus(quote?.status) === "sold")

    .reduce((total, quote) => total + getQuoteAmount(quote), 0);

  const totalReceipts = receipts

    .filter(
      (receipt) =>
        normalizeStatus(receipt?.direction) === "customer_payment" &&
        receipt?.is_reversal !== true &&
        normalizeStatus(receipt?.status) !== "reversed",
    )

    .reduce((total, receipt) => total + getReceiptAmount(receipt), 0);

  const totalEmi = emiEstimates.reduce(
    (total, emi) => total + getEmiAmount(emi),

    0,
  );

  const financialTotal = totalSalesValue + totalReceipts + totalEmi;

  const financialSegments = [
    {
      label: "Sales",

      value: totalSalesValue,

      color: "#0f172a",

      dot: "bg-slate-900",
    },

    {
      label: "Customer Receipts",

      value: totalReceipts,

      color: "#10b981",

      dot: "bg-emerald-500",
    },

    {
      label: "EMI",

      value: totalEmi,

      color: "#3b82f6",

      dot: "bg-blue-500",
    },
  ];

  const financialGradient = useMemo(() => {
    if (financialTotal <= 0) {
      return "conic-gradient(#e2e8f0 0deg 360deg)";
    }

    let current = 0;

    const segments = financialSegments

      .filter((item) => item.value > 0)

      .map((item) => {
        const degrees = (item.value / financialTotal) * 360;

        const result = `${item.color} ${current}deg ${current + degrees}deg`;

        current += degrees;

        return result;
      });

    return `conic-gradient(${segments.join(", ")})`;
  }, [financialTotal, financialSegments]);

  /* =======================================================

     PROGRESSION

  \======================================================= */

  const ongoingProgressions = useMemo(() => {
    return progressions

      .filter((item) => {
        const status = normalizeStatus(item?.status);

        return status === "active" || status === "blocked";
      })

      .sort(
        (a, b) =>
          new Date(getProgressionDate(b)) - new Date(getProgressionDate(a)),
      )

      .slice(0, 5);
  }, [progressions]);

  const progressionStages = [
    "evaluation",

    "passing",

    "dubai_passing",

    "registration_passing",

    "insurance",

    "registration",

    "delivery_video",
  ];

  const progressionCounts = progressionStages.map((stage) => ({
    stage,

    count: progressions.filter(
      (item) =>
        normalizeStatus(item?.status) === "active" &&
        normalizeStatus(item?.current_stage) === stage,
    ).length,
  }));

  /* =======================================================

     STAFF

  \======================================================= */

  const staffPerformance = useMemo(() => {
    const map = new Map();

    quotes

      .filter((quote) => normalizeStatus(quote?.status) === "sold")

      .forEach((quote) => {
        const id = getSalespersonId(quote);

        if (!id) return;

        const key = String(id);

        if (!map.has(key)) {
          map.set(key, {
            id: key,

            name: getSalespersonName(quote),

            sales: 0,

            value: 0,
          });
        }

        const row = map.get(key);

        row.sales += 1;

        row.value += getQuoteAmount(quote);
      });

    staff.forEach((member) => {
      const id = getStaffId(member);

      if (!id) return;

      const key = String(id);

      if (map.has(key)) {
        map.get(key).name = getStaffName(member);
      }
    });

    return [...map.values()]

      .sort((a, b) => {
        if (b.sales !== a.sales) {
          return b.sales - a.sales;
        }

        return b.value - a.value;
      })

      .slice(0, 5);
  }, [quotes, staff]);

  const maxStaffSales = Math.max(
    ...staffPerformance.map((item) => item.sales),

    1,
  );

  /* =======================================================

     BUSINESS METRICS

  \======================================================= */

  const businessMetrics = [
    {
      label: "Sales",

      value: currentMonthSalesValue,

      count: currentMonthSales.length,

      icon: TrendingUp,

      bg: "bg-blue-50",

      text: "text-blue-600",
    },

    {
      label: "Open Deals",

      value: currentMonthDealsValue,

      count: currentMonthDeals.length,

      icon: Package,

      bg: "bg-amber-50",

      text: "text-amber-600",
    },

    {
      label: "Receipts",

      value: currentMonthReceiptValue,

      count: currentMonthReceipts.length,

      icon: Receipt,

      bg: "bg-emerald-50",

      text: "text-emerald-600",
    },

    {
      label: "EMI",

      value: currentMonthEmiValue,

      count: currentMonthEmi.length,

      icon: WalletCards,

      bg: "bg-violet-50",

      text: "text-violet-600",
    },
  ];

  const businessMax = Math.max(...businessMetrics.map((item) => item.value), 1);

  /* =======================================================

     LOADING

  \======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-bold text-slate-700">
            Preparing Prime Rides
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Loading your dealership command center...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================

     PAGE

  \======================================================= */

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="mx-auto max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {/* =================================================

            HEADER

        \================================================= */}

        <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />

                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Prime Rides · Live Operations
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
              Command Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Your dealership at a glance — inventory, sales, finance and
              vehicle operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Current Period
              </p>

              <p className="mt-1 text-sm font-black text-slate-800">
                {currentMonthName}
              </p>
            </div>
          </div>
        </header>

        {/* =================================================

            ERROR

        \================================================= */}

        {errors.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Clock3 className="h-4 w-4 shrink-0 text-amber-600" />

              <p className="text-xs font-medium text-amber-800">
                Some dashboard data could not be loaded: {errors.join(", ")}.
              </p>
            </div>
          </div>
        )}

        {/* =================================================

            KPI STRIP

        \================================================= */}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          <KPICard
            label="Total Vehicles"
            value={formatNumber(inventoryStats.total)}
            icon={Car}
            accent="cyan"
          />

          <KPICard
            label="Available"
            value={formatNumber(inventoryStats.available)}
            icon={CheckCircle2}
            accent="emerald"
          />

          <KPICard
            label="Reserved"
            value={formatNumber(inventoryStats.reserved)}
            icon={Package}
            accent="amber"
          />

          <KPICard
            label="Booked"
            value={formatNumber(inventoryStats.booked)}
            icon={Receipt}
            accent="blue"
          />

          <KPICard
            label="Sold"
            value={formatNumber(inventoryStats.sold)}
            icon={ShieldCheck}
            accent="rose"
          />
        </section>

        {/* =================================================
          INVENTORY COMMAND CENTER
      ================================================= */}

        <section className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Inventory Command Center
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Vehicle Inventory
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Current stock position across the dealership.
                </p>
              </div>

              <Link
                to="/stock"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Open Inventory
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-center">
              {/* INVENTORY CIRCLE */}
              <div className="rounded-[24px] bg-[#090d14] p-6 sm:p-8">
                <div className="flex flex-col items-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Total Inventory
                  </p>

                  <div
                    className="relative mt-5 flex h-56 w-56 items-center justify-center rounded-full"
                    style={{ background: inventoryGradient }}
                  >
                    <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-[#090d14] shadow-[inset_0_0_30px_rgba(255,255,255,0.03)]">
                      <span className="text-5xl font-black tracking-tight text-white">
                        {formatNumber(inventoryStats.total)}
                      </span>
                      <span className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Vehicles
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <p className="text-xs font-bold text-white">
                      Complete dealership inventory
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Live vehicle stock distribution
                    </p>
                  </div>
                </div>
              </div>

              {/* INVENTORY COUNTS */}
              <div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "Available",
                      value: inventoryStats.available,
                      dot: "bg-emerald-500",
                      bg: "bg-emerald-50",
                    },
                    {
                      label: "Reserved",
                      value: inventoryStats.reserved,
                      dot: "bg-amber-500",
                      bg: "bg-amber-50",
                    },
                    {
                      label: "Booked",
                      value: inventoryStats.booked,
                      dot: "bg-blue-500",
                      bg: "bg-blue-50",
                    },
                    {
                      label: "Sold",
                      value: inventoryStats.sold,
                      dot: "bg-red-500",
                      bg: "bg-red-50",
                    },
                    {
                      label: "In Service",
                      value: inventoryStats.inService,
                      dot: "bg-violet-500",
                      bg: "bg-violet-50",
                    },
                    {
                      label: "In House",
                      value: inventoryStats.inHouse,
                      dot: "bg-cyan-500",
                      bg: "bg-cyan-50",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="group rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg}`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
                          />
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-200 transition group-hover:translate-x-0.5 group-hover:text-slate-400" />
                      </div>
                      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                        {item.label}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-3xl font-black tracking-tight text-slate-950">
                          {formatNumber(item.value)}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {item.value === 1 ? "Vehicle" : "Vehicles"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Inventory Value
                    </p>
                    <p className="mt-1 text-base font-black text-slate-950">
                      {formatAED(inventoryStats.inventoryValue)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                      Available Now
                    </p>
                    <p className="mt-1 text-base font-black text-emerald-700">
                      {formatNumber(inventoryStats.available)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================

            TODAY'S PULSE

        \================================================= */}

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Active Progressions
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {
                progressions.filter(
                  (item) => normalizeStatus(item?.status) === "active",
                ).length
              }
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Vehicles in workflow
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Current Month Sales
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {formatAED(currentMonthSalesValue)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              {currentMonthSales.length} completed sales
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Open Deals
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {formatNumber(currentMonthDeals.length)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              {formatAED(currentMonthDealsValue)} pipeline
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Customer Receipts
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {formatAED(currentMonthReceiptValue)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              {currentMonthReceipts.length} receipts
            </p>
          </div>
        </section>

        {/* =================================================

            PROGRESSION

        \================================================= */}

        <section className="mt-8">
          <SectionHeading
            eyebrow="Operations"
            title="Vehicle Progression"
            description="Live view of vehicles moving through the delivery workflow."
            href="/progression"
            action="View Progression"
          />

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto p-5 sm:p-7">
              <div className="min-w-[850px]">
                <div className="relative">
                  <div className="absolute left-[4%] right-[4%] top-5 h-px bg-slate-200" />

                  <div className="relative grid grid-cols-7 gap-3">
                    {progressionCounts.map((item) => (
                      <div key={item.stage} className="relative text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow-sm">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              item.count > 0 ? "bg-slate-900" : "bg-slate-300"
                            }`}
                          />
                        </div>

                        <p className="mt-4 truncate text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {statusLabel(item.stage)}
                        </p>

                        <p className="mt-1 text-2xl font-black text-slate-950">
                          {item.count}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                          {item.count === 1 ? "vehicle" : "vehicles"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between px-5 py-4 sm:px-7">
                <div>
                  <p className="text-xs font-black text-slate-700">
                    Active Vehicles
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Latest ongoing progressions
                  </p>
                </div>

                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">
                  {
                    progressions.filter(
                      (item) => normalizeStatus(item?.status) === "active",
                    ).length
                  }{" "}
                  Active
                </span>
              </div>

              {ongoingProgressions.length === 0 ? (
                <div className="px-5 pb-5 sm:px-7 sm:pb-7">
                  <EmptyState
                    icon={Clock3}
                    title="No active progressions"
                    description="Vehicles entering the workflow will appear here."
                  />
                </div>
              ) : (
                <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 sm:px-7 sm:pb-7 lg:grid-cols-5">
                  {ongoingProgressions.map((item) => (
                    <div
                      key={
                        item?.id ||
                        `${getProgressionVehicle(item)}-${getProgressionDate(
                          item,
                        )}`
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-900">
                            {getProgressionVehicle(item)}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-slate-400">
                            {getProgressionCustomer(item)}
                          </p>
                        </div>

                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                      </div>

                      <div className="mt-4">
                        <span className="inline-flex rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">
                          {statusLabel(getProgressionStage(item))}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[9px] font-medium text-slate-400">
                          {getProgressionPayment(item)}
                        </span>

                        <span className="text-[9px] text-slate-400">
                          {formatDate(getProgressionDate(item))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =================================================

            LATEST AVAILABLE VEHICLES

        \================================================= */}

        <section className="mt-8">
          <SectionHeading
            eyebrow="Showroom"
            title="Latest Available Vehicles"
            description="The newest vehicles currently ready for sale."
            href="/stock"
            action="View Inventory"
          />

          {latestVehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No available vehicles"
              description="New available vehicles will appear here."
            />
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {latestVehicles.map((vehicle) => {
                const image = getVehicleImage(vehicle);

                const name = getVehicleName(vehicle);

                const variant = getVehicleVariant(vehicle);

                const vin = getVehicleVin(vehicle);

                const mileage = getVehicleMileage(vehicle);

                return (
                  <Link
                    key={vehicle?.id}
                    to={`/stock/${vehicle?.id}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                  >
                    <div className="relative flex h-24 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 sm:h-36 lg:h-48">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          loading="lazy"
                          className="h-full w-full object-contain p-1.5 transition duration-500 group-hover:scale-105 sm:p-3 lg:p-5"
                        />
                      ) : (
                        <Car className="h-10 w-10 text-slate-200 sm:h-16 sm:w-16 lg:h-20 lg:w-20" />
                      )}

                      <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-1.5 py-1 text-[7px] font-bold text-white shadow-sm sm:px-2.5 sm:text-[9px]">
                          <span className="h-1 w-1 rounded-full bg-white sm:h-1.5 sm:w-1.5" />
                          Available
                        </span>
                      </div>

                      <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 sm:right-3 sm:top-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
                          <ArrowUpRight className="h-3.5 w-3.5 text-slate-700" />
                        </span>
                      </div>
                    </div>

                    <div className="p-2 sm:p-3.5 lg:p-4">
                      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                        <span className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[7px] font-bold text-slate-500 sm:px-2 sm:py-1 sm:text-[9px]">
                          {vehicle?.year || "-"}
                        </span>

                        {variant !== "-" && (
                          <span className="min-w-0 truncate rounded-md bg-slate-900 px-1.5 py-0.5 text-[7px] font-bold text-white sm:px-2 sm:py-1 sm:text-[9px]">
                            {variant}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 truncate text-[10px] font-black tracking-tight text-slate-900 sm:mt-3 sm:text-sm lg:text-base">
                        {name}
                      </h3>

                      <div className="mt-1.5 space-y-0.5 sm:mt-2 sm:space-y-1">
                        <p className="truncate text-[7px] text-slate-400 sm:text-[10px] lg:text-xs">
                          VIN{" "}
                          <span className="font-medium text-slate-500">
                            {vin || "-"}
                          </span>
                        </p>

                        <p className="truncate text-[7px] text-slate-400 sm:text-[10px] lg:text-xs">
                          Mileage{" "}
                          <span className="font-medium text-slate-500">
                            {mileage !== null &&
                            mileage !== undefined &&
                            mileage !== ""
                              ? `${formatNumber(mileage)} km`
                              : "-"}
                          </span>
                        </p>
                      </div>

                      <div className="mt-3 border-t border-slate-100 pt-2.5 sm:mt-4 sm:pt-3">
                        <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400 sm:text-[9px]">
                          Asking Price
                        </p>

                        <p className="mt-0.5 truncate text-[11px] font-black tracking-tight text-slate-950 sm:text-base lg:text-xl">
                          {formatAED(vehicle?.asking_price || 0)}
                        </p>

                        <div className="mt-2 hidden items-center justify-between text-[9px] font-bold text-slate-400 lg:flex">
                          <span>View vehicle</span>

                          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1 group-hover:text-slate-900" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================

            MONTHLY BUSINESS PERFORMANCE

        \================================================= */}

        <section className="mt-8">
          <SectionHeading
            eyebrow="Performance"
            title="Monthly Business Performance"
            description={`Current business activity for ${currentMonthName}.`}
          />

          <div className="grid gap-4 xl:grid-cols-[1fr_310px]">
            {/* GRAPH */}

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-black text-slate-700">
                    Business Activity
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Current month comparison
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Total Activity
                  </p>

                  <p className="mt-0.5 text-sm font-black text-slate-900">
                    {formatAED(
                      currentMonthSalesValue +
                        currentMonthDealsValue +
                        currentMonthReceiptValue +
                        currentMonthEmiValue,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex h-72 items-end gap-3 sm:gap-6">
                {businessMetrics.map((item) => {
                  const Icon = item.icon;

                  const height =
                    businessMax > 0
                      ? Math.max(
                          item.value > 0 ? 5 : 1,

                          (item.value / businessMax) * 100,
                        )
                      : 0;

                  return (
                    <div
                      key={item.label}
                      className="flex min-w-0 flex-1 flex-col items-center"
                    >
                      <div className="mb-3 text-center">
                        <p className="truncate text-[10px] font-black text-slate-800 sm:text-xs">
                          {formatAED(item.value)}
                        </p>

                        <p className="mt-0.5 text-[9px] text-slate-400">
                          {item.count} records
                        </p>
                      </div>

                      <div className="flex h-48 w-full max-w-24 items-end rounded-2xl bg-slate-50 p-1">
                        <div
                          className="relative w-full overflow-hidden rounded-xl bg-slate-900 transition-all duration-700"
                          style={{
                            height: `${height}%`,
                          }}
                        >
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-slate-400" />

                        <span className="truncate text-[9px] font-bold text-slate-500 sm:text-[10px]">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SIDE METRICS */}

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black text-slate-700">Current Month</p>

              <p className="mt-1 text-[10px] text-slate-400">
                Key business indicators
              </p>

              <div className="mt-5 space-y-3">
                {businessMetrics.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-100 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.text}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-bold text-slate-600">
                              {item.label}
                            </p>

                            <p className="text-xs font-black text-slate-900">
                              {formatAED(item.value)}
                            </p>
                          </div>

                          <div className="mt-2">
                            <ProgressBar value={item.value} max={businessMax} />
                          </div>

                          <p className="mt-1.5 text-[9px] text-slate-400">
                            {item.count} records
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================

            FINANCIAL + STAFF

        \================================================= */}

        <section className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          {/* FINANCIAL */}

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Finance"
              title="Financial Overview"
              description="Overall financial activity from available records."
            />

            <div className="grid items-center gap-8 md:grid-cols-[280px_1fr]">
              <div className="flex justify-center">
                <div className="relative h-60 w-60">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: financialGradient,
                    }}
                  />

                  <div className="absolute inset-[8px] rounded-full bg-white" />

                  <div className="absolute inset-[48px] flex flex-col items-center justify-center rounded-full bg-slate-50">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Total
                    </span>

                    <span className="mt-1 text-xl font-black tracking-tight text-slate-900">
                      {formatAED(financialTotal)}
                    </span>

                    <span className="mt-1 text-[9px] text-slate-400">
                      financial activity
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {financialSegments.map((segment) => {
                  const percentage =
                    financialTotal > 0
                      ? Math.round((segment.value / financialTotal) * 100)
                      : 0;

                  return (
                    <div
                      key={segment.label}
                      className="rounded-2xl border border-slate-100 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${segment.dot}`}
                          />

                          <span className="text-xs font-bold text-slate-600">
                            {segment.label}
                          </span>
                        </div>

                        <span className="text-sm font-black text-slate-900">
                          {formatAED(segment.value)}
                        </span>
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${segment.dot}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <div className="mt-1.5 flex justify-between">
                        <span className="text-[9px] text-slate-400">Share</span>

                        <span className="text-[9px] font-bold text-slate-500">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STAFF */}

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Team"
              title="Top Performers"
              description="Sales performance leaderboard."
              href="/staff"
              action="View Staff"
            />

            {staffPerformance.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No sales data"
                description="Staff performance will appear once sales are recorded."
              />
            ) : (
              <div className="space-y-4">
                {staffPerformance.map((member, index) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                          index === 0
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-700">
                        {getInitials(member.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-black text-slate-800">
                            {member.name}
                          </p>

                          <p className="text-xs font-black text-slate-900">
                            {member.sales} sales
                          </p>
                        </div>

                        <div className="mt-2">
                          <ProgressBar
                            value={member.sales}
                            max={maxStaffSales}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[9px] text-slate-400">
                        Sales value
                      </span>

                      <span className="text-xs font-black text-slate-700">
                        {formatAED(member.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================

            FOOTER QUICK STATS

        \================================================= */}

        <section className="mt-5 grid grid-cols-2 gap-3 pb-8 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Available
                </p>

                <p className="mt-0.5 text-lg font-black text-slate-900">
                  {formatNumber(inventoryStats.available)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Monthly Sales
                </p>

                <p className="mt-0.5 text-lg font-black text-slate-900">
                  {formatAED(currentMonthSalesValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Package className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Open Deals
                </p>

                <p className="mt-0.5 text-lg font-black text-slate-900">
                  {formatNumber(currentMonthDeals.length)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <WalletCards className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  EMI Activity
                </p>

                <p className="mt-0.5 text-lg font-black text-slate-900">
                  {formatAED(currentMonthEmiValue)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
