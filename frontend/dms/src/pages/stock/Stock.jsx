import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  CarFront,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Printer,
  Share2Icon,
} from "lucide-react";

import {
  getCars,
  getCarBrands,
  getDashboardSummary,
  bulkDeleteCars,
  deleteAllCars,
  bulkImportCars,
} from "../../api/inventory";
import { getBranches, getCompanies } from "../../api/company";
import { resolveBackendUrl } from "../../api/url";
import { getInventoryStockOutputFields } from "../../utils/inventoryStockOutput";

import InventoryVehiclePrintTemplate from "../../components/printing/templates/InventoryVehiclePrintTemplate";
import { printInventoryVehicle } from "../../utils/print";
import InventoryStockPrintTemplate from "../../components/printing/templates/InventoryStockPrintTemplate";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";

const INITIAL_FILTERS = {
  status: "",
  make: "",
  vehicle_type: "",
  source: "",
  supplier: "",
  branch: "",
  year: "",
  highlight_public: "",
  min_price: "",
  max_price: "",
  min_mileage: "",
  max_mileage: "",
};

const VEHICLE_TYPE_LABELS = {
  sedan: "Sedan",
  suv: "SUV (Sport Utility Vehicle)",
  hatchback: "Hatchback",
  crossover: "Crossover",
  coupe: "Coupe",
  convertible: "Convertible",
  pickup_truck: "Pickup Truck",
  other: "Other",
};

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "upcoming", label: "Upcoming" },
  { value: "reserved", label: "Reserved" },
  { value: "booked", label: "Booked" },
  { value: "sold", label: "Sold" },
  { value: "in_service", label: "In Service" },
  { value: "in_house", label: "In House" },
];

const SOURCE_OPTIONS = [
  { value: "own_purchase", label: "Own Purchase" },
  { value: "fly_wheel", label: "Fly Wheel" },
  { value: "park_and_sale", label: "Park and Sale" },
  { value: "auction", label: "Auction" },
  { value: "trade_in", label: "Trade In" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest First" },
  { value: "created_at", label: "Oldest First" },
  { value: "asking_price", label: "Price: Low → High" },
  { value: "-asking_price", label: "Price: High → Low" },
  { value: "year", label: "Year: Oldest → Newest" },
  { value: "-year", label: "Year: Newest → Oldest" },
  { value: "mileage", label: "Mileage: Low → High" },
  { value: "-mileage", label: "Mileage: High → Low" },
  { value: "stock_id", label: "Stock ID: A → Z" },
  { value: "-stock_id", label: "Stock ID: Z → A" },
];

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

const getVehicleTypeLabel = (value) =>
  VEHICLE_TYPE_LABELS[value] || value || "-";

const getStatusLabel = (value) => STATUS_LABELS[value] || value || "-";

function Stock() {
  const { user } = useAuth();
  const isMaster = user?.role === "MASTER";
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cars, setCars] = useState([]);
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

  const [ordering, setOrdering] = useState("-created_at");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const [inventorySummary, setInventorySummary] = useState({
    total_vehicles: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    upcoming: 0,
  });

  const [selectedCars, setSelectedCars] = useState([]);
  const [shareCar, setShareCar] = useState(null);
  const [shareImageIndex, setShareImageIndex] = useState(0);
  const [shareOutputFields, setShareOutputFields] = useState([]);
  const [selectedShareOutputFields, setSelectedShareOutputFields] = useState(
    [],
  );
  const [printCar, setPrintCar] = useState(null);

  const [showStockOutputModal, setShowStockOutputModal] = useState(false);
  const [stockOutputFields, setStockOutputFields] = useState([]);
  const [selectedStockOutputFields, setSelectedStockOutputFields] = useState(
    [],
  );

  const [printStockConfig, setPrintStockConfig] = useState(null);
  const [printingStock, setPrintingStock] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingAll, setDeletingAll] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadInventorySummary() {
      try {
        const response = await getDashboardSummary();

        setInventorySummary(
          response?.data || {
            total_vehicles: 0,
            available: 0,
            reserved: 0,
            sold: 0,
            upcoming: 0,
          },
        );
      } catch (error) {
        console.error("Failed to load inventory summary:", error);
      }
    }

    loadInventorySummary();
  }, [refreshKey]);

  useEffect(() => {
    async function loadBrands() {
      try {
        const response = await getCarBrands();
        setBrands(response.data || []);
      } catch (error) {
        console.error("Failed to load vehicle brands:", error);
        setBrands([]);
      }
    }

    loadBrands();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      try {
        setCompanyLoading(true);

        const response = await getCompanies();

        const data = response?.data ?? response;

        if (!cancelled) {
          setCompany(data && typeof data === "object" ? data : null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load company information:", error);
          setCompany(null);
        }
      } finally {
        if (!cancelled) {
          setCompanyLoading(false);
        }
      }
    }

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMaster) {
      setBranches([]);
      return;
    }

    async function loadBranches() {
      try {
        const response = await getBranches();

        setBranches(
          Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : [],
        );
      } catch (error) {
        console.error("Failed to load company branches:", error);

        setBranches([]);
      }
    }

    loadBranches();
  }, [isMaster]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  /*
   * Load inventory whenever:
   *
   * - searchQuery changes
   * - applied filters change
   *
   * Filtering remains server-side.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCars() {
      setIsFetching(true);

      try {
        const response = await getCars({
          search: searchQuery,
          ...appliedFilters,
          ordering,
          page,
          page_size: pageSize,
        });

        if (cancelled) {
          return;
        }

        setCars(response.data || []);
        setTotalCount(response.pagination?.count || 0);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load inventory:", error);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
          setLoading(false);
        }
      }
    }

    loadCars();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, appliedFilters, ordering, page, pageSize, refreshKey]);

  function getImageUrl(imagePath) {
    if (!imagePath) return null;

    return resolveBackendUrl(imagePath);
  }

  function getShareImages(car) {
    const images = car?.images || [];

    const coverImage =
      images.find((image) => image.is_cover) || images[0] || null;

    const remainingImages = images.filter(
      (image) => image.id !== coverImage?.id,
    );

    return [coverImage, ...remainingImages]
      .filter(Boolean)
      .map((image) => getImageUrl(image.image));
  }

  function formatShareFieldValue(car, fieldKey) {
    switch (fieldKey) {
      case "stock_id":
        return car.stock_id ? `Stock ID: ${car.stock_id}` : null;

      case "make":
        return car.make ? `Make: ${car.make}` : null;

      case "model":
        return car.model ? `Model: ${car.model}` : null;

      case "year":
        return car.year ? `Year: ${car.year}` : null;

      case "colour":
        return car.colour ? `Colour: ${car.colour}` : null;

      case "mileage":
        return car.mileage !== null &&
          car.mileage !== undefined &&
          car.mileage !== ""
          ? `Mileage: ${Number(car.mileage).toLocaleString("en-AE")} km`
          : null;

      case "asking_price":
        return car.status === "booked"
          ? null
          : car.asking_price !== null &&
              car.asking_price !== undefined &&
              car.asking_price !== ""
            ? `Asking Price: AED ${Number(car.asking_price).toLocaleString(
                "en-AE",
              )}`
            : null;

      case "status":
        return car.status ? `Status: ${getStatusLabel(car.status)}` : null;

      case "chassis_number":
        return car.chassis_number ? `Chassis No: ${car.chassis_number}` : null;

      case "date_added":
        return car.date_added || car.created_at
          ? `Date Added: ${new Date(
              car.date_added || car.created_at,
            ).toLocaleDateString("en-GB")}`
          : null;

      case "least_selling_price":
        return car.least_selling_price !== null &&
          car.least_selling_price !== undefined &&
          car.least_selling_price !== ""
          ? `Least Selling Price: AED ${Number(
              car.least_selling_price,
            ).toLocaleString("en-AE")}`
          : null;

      case "engine_number":
        return car.engine_number ? `Engine No: ${car.engine_number}` : null;

      case "expected_arrival":
        return car.expected_arrival
          ? `Expected Arrival: ${new Date(
              car.expected_arrival,
            ).toLocaleDateString("en-GB")}`
          : null;

      default:
        return null;
    }
  }

  function buildShareText(car, selectedFields) {
    return [
      `${car.make || ""} ${car.model || ""}`.trim(),
      ...selectedFields
        .map((fieldKey) => formatShareFieldValue(car, fieldKey))
        .filter(Boolean),
    ].join("\n");
  }

  async function handleShareVehicle(car) {
    if (selectedShareOutputFields.length === 0) {
      window.alert("Select at least one field to share.");
      return;
    }

    const shareText = buildShareText(car, selectedShareOutputFields);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${car.make || ""} ${car.model || ""}`.trim(),
          text: shareText,
        });

        return;
      }

      await navigator.clipboard.writeText(shareText);
      window.alert("Vehicle details copied to clipboard.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Vehicle sharing failed:", error);
      }
    }
  }

  function handlePrintVehicle(car) {
    setPrintCar(car);
    setTimeout(() => {
      printInventoryVehicle(car);
    }, 0);
  }

  function openStockOutputModal() {
    const allowedFields = getInventoryStockOutputFields(user?.role);

    setStockOutputFields(allowedFields);
    setSelectedStockOutputFields(allowedFields.map((field) => field.key));
    setShowStockOutputModal(true);
  }

  function toggleStockOutputField(fieldKey) {
    setSelectedStockOutputFields((current) =>
      current.includes(fieldKey)
        ? current.filter((key) => key !== fieldKey)
        : [...current, fieldKey],
    );
  }

  function selectAllStockOutputFields() {
    setSelectedStockOutputFields(stockOutputFields.map((field) => field.key));
  }

  function clearAllStockOutputFields() {
    setSelectedStockOutputFields([]);
  }

  function openVehicleShare(car) {
    const shareExcludedFields = new Set([
      "purchase_cost",
      "total_cost",
      "expenses_total",
      "est_margin",
      "days_in_stock",
      "source",
      "notes",
    ]);

    const allowedFields = getInventoryStockOutputFields(user?.role).filter(
      (field) => !shareExcludedFields.has(field.key),
    );

    setShareOutputFields(allowedFields);
    setSelectedShareOutputFields(allowedFields.map((field) => field.key));

    setShareCar(car);
    setShareImageIndex(0);
  }

  function toggleShareOutputField(fieldKey) {
    setSelectedShareOutputFields((current) =>
      current.includes(fieldKey)
        ? current.filter((key) => key !== fieldKey)
        : [...current, fieldKey],
    );
  }

  function selectAllShareOutputFields() {
    setSelectedShareOutputFields(shareOutputFields.map((field) => field.key));
  }

  function clearAllShareOutputFields() {
    setSelectedShareOutputFields([]);
  }

  async function handleGenerateStockPrint() {
    if (selectedStockOutputFields.length === 0) {
      window.alert("Select at least one field to print.");
      return;
    }

    if (!company) {
      window.alert("Company information is not available.");
      return;
    }

    try {
      setPrintingStock(true);

      const printPageSize = 100;
      let currentPage = 1;
      let allCars = [];

      while (true) {
        const response = await getCars({
          search: searchQuery,
          ...appliedFilters,
          ordering,
          page: currentPage,
          page_size: printPageSize,
        });

        const pageCars = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.results)
            ? response.results
            : Array.isArray(response)
              ? response
              : [];

        if (pageCars.length === 0) {
          break;
        }

        allCars = [...allCars, ...pageCars];

        if (!response?.pagination?.next) {
          break;
        }

        currentPage += 1;
      }

      if (!allCars.length) {
        window.alert("No inventory vehicles are available for printing.");
        return;
      }

      const previousTitle = document.title;

      const companyName = company.legal_entity_name || "Company";

      const printDate = new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");

      document.title = `${companyName} - Stock List - ${printDate}`;

      const restoreTitle = () => {
        document.title = previousTitle;
        window.removeEventListener("afterprint", restoreTitle);
      };

      window.addEventListener("afterprint", restoreTitle);

      setShowStockOutputModal(false);

      setPrintStockConfig({
        cars: allCars,
        selectedFields: [...selectedStockOutputFields],
        company,
      });

      setTimeout(() => {
        window.print();
      }, 150);
    } catch (error) {
      console.error("Failed to prepare stock print:", error);

      window.alert(
        error?.message || "Unable to prepare the stock list for printing.",
      );
    } finally {
      setPrintingStock(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedCars.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCars.length} vehicle(s)?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await bulkDeleteCars(selectedCars);

      setSelectedCars([]);
      setRefreshKey((current) => current + 1);

      if (page > 1 && cars.length === selectedCars.length) {
        setPage((currentPage) => currentPage - 1);
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error("Bulk vehicle deletion failed:", error);
      alert("Failed to delete selected vehicles.");
    }
  }

  async function handleDeleteAllCars() {
    if (!isMaster || deletingAll) {
      return;
    }

    const confirmed = window.confirm(
      "Delete ALL inventory vehicles?\n\nThis is an irreversible operation. All vehicles that are not protected by existing backend relationships will be deleted.\n\nContinue?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAll(true);

      const response = await deleteAllCars();

      if (!response?.success) {
        throw new Error(response?.message || "Unable to delete all inventory.");
      }

      const deletedCount = Number(response?.deleted_count || 0);

      setSelectedCars([]);
      setPage(1);
      setRefreshKey((current) => current + 1);

      window.alert(
        response?.message ||
          `Inventory cleared successfully. ${deletedCount} vehicle(s) deleted.`,
      );
    } catch (error) {
      console.error("Delete all inventory failed:", error);

      const backendMessage =
        error?.cause?.message ||
        error?.message ||
        "Unable to delete all inventory.";

      window.alert(backendMessage);
    } finally {
      setDeletingAll(false);
    }
  }

  async function handleBulkImport() {
    if (!selectedImportFile) {
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const response = await bulkImportCars(selectedImportFile);

      console.log("Bulk import response:", response);

      setImportResult(response);

      setSelectedImportFile(null);
      setShowImportModal(false);

      setRefreshKey((value) => value + 1);
    } catch (error) {
      console.error("Bulk vehicle import failed:", error);

      setImportResult({
        success: false,
        message: error.message || "Failed to import vehicles.",
        data: null,
      });
    } finally {
      setImporting(false);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleApplyFilters() {
    setPage(1);

    setAppliedFilters({
      ...filters,
    });
  }

  function handleResetFilters() {
    const resetFilters = {
      ...INITIAL_FILTERS,
    };

    setPage(1);
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;

  const endItem = Math.min(page * pageSize, totalCount);

  function getPaginationItems() {
    const items = [];

    if (totalPages <= 7) {
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        items.push(pageNumber);
      }

      return items;
    }

    items.push(1);

    if (page > 4) {
      items.push("...");
    }

    const startPage = Math.max(2, page - 2);
    const endPage = Math.min(totalPages - 1, page + 2);

    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
      items.push(pageNumber);
    }

    if (page < totalPages - 3) {
      items.push("...");
    }

    items.push(totalPages);

    return items;
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

          <p className="text-sm font-medium text-slate-600">
            Loading inventory...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait while vehicles are loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">
                Core Operations
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Vehicle Inventory
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Manage the complete Prime Rides vehicle inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isMaster && (
              <>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowImportModal(true)}
                >
                  Bulk Import
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDeleteAllCars}
                  disabled={deletingAll || loading}
                >
                  {deletingAll ? "Deleting All..." : "Delete All Inventory"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Inventory summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Total Vehicles
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {inventorySummary.total_vehicles}
            </p>

            <p className="mt-1 text-xs text-slate-400">Complete inventory</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
              Available
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-900">
              {inventorySummary.available}
            </p>

            <p className="mt-1 text-xs text-emerald-700/60">Ready for sale</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">
              Reserved
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-amber-900">
              {inventorySummary.reserved}
            </p>

            <p className="mt-1 text-xs text-amber-700/60">Currently reserved</p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">
              Upcoming
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-blue-900">
              {inventorySummary.upcoming}
            </p>

            <p className="mt-1 text-xs text-blue-700/60">Incoming vehicles</p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600">
              Sold
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-violet-900">
              {inventorySummary.sold}
            </p>

            <p className="mt-1 text-xs text-violet-700/60">Completed stock</p>
          </div>
        </div>
      </div>
      {/* Search + Sorting */}
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            placeholder="Search stock ID, make, model, variant, chassis..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSearch("")}
          >
            Clear
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowFilters((isVisible) => !isVisible)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      {importResult && (
        <div
          className={[
            "mb-5 rounded-2xl border p-4 shadow-sm",
            importResult.success ? "text-emerald-800" : "text-rose-800",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className={`font-medium ${
                  importResult.success ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                {importResult.message}
              </p>

              {importResult.success && importResult.data && (
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Imported: <strong>{importResult.data.created_count}</strong>
                  </p>

                  <p>
                    Skipped: <strong>{importResult.data.skipped_count}</strong>
                  </p>

                  {importResult.data.errors?.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 font-medium text-gray-800">
                        Skipped Rows
                      </p>

                      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 font-medium text-gray-700">
                                Row
                              </th>

                              <th className="px-3 py-2 font-medium text-gray-700">
                                Field
                              </th>

                              <th className="px-3 py-2 font-medium text-gray-700">
                                Value
                              </th>

                              <th className="px-3 py-2 font-medium text-gray-700">
                                Reason
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {importResult.data.errors.map((error, index) => (
                              <tr
                                key={`${error.row}-${error.field}-${index}`}
                                className="border-b border-gray-100 last:border-b-0"
                              >
                                <td className="px-3 py-2 text-gray-800">
                                  {error.row}
                                </td>

                                <td className="px-3 py-2 text-gray-800">
                                  {error.field || "—"}
                                </td>

                                <td className="px-3 py-2 text-gray-800">
                                  {error.value === null ||
                                  error.value === undefined ||
                                  error.value === ""
                                    ? "—"
                                    : String(error.value)}
                                </td>

                                <td className="px-3 py-2 text-gray-700">
                                  {error.message}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setImportResult(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isMaster && selectedCars.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-slate-700">
            {selectedCars.length} vehicle(s) selected
          </span>
          <Button type="button" variant="danger" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSelectedCars([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        {showFilters && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                >
                  <option value="">All</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Brand */}
              <div>
                <label
                  htmlFor="make"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Brand
                </label>

                <select
                  id="make"
                  name="make"
                  value={filters.make}
                  onChange={handleFilterChange}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                >
                  <option value="">All Brands</option>

                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              {/* Vehicle Type */}
              <div>
                <label
                  htmlFor="vehicle_type"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Vehicle Type
                </label>

                <select
                  id="vehicle_type"
                  name="vehicle_type"
                  value={filters.vehicle_type}
                  onChange={handleFilterChange}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                >
                  <option value="">All Types</option>

                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV (Sport Utility Vehicle)</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="crossover">Crossover</option>
                  <option value="coupe">Coupe</option>
                  <option value="convertible">Convertible</option>
                  <option value="pickup_truck">Pickup Truck</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {/* Source */}
              {isMaster && (
                <>
                  <div>
                    <label
                      htmlFor="source"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Source
                    </label>
                    <select
                      id="source"
                      name="source"
                      value={filters.source}
                      onChange={handleFilterChange}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    >
                      <option value="">All</option>
                      {SOURCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label
                      htmlFor="supplier"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Supplier
                    </label>
                    <input
                      id="supplier"
                      name="supplier"
                      type="text"
                      value={filters.supplier}
                      onChange={handleFilterChange}
                      placeholder="Supplier"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="branch"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Branch
                    </label>

                    <select
                      id="branch"
                      name="branch"
                      value={filters.branch}
                      onChange={handleFilterChange}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    >
                      <option value="">All Branches</option>

                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Highlight */}
                  <div>
                    <label
                      htmlFor="highlight_public"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Highlight
                    </label>
                    <select
                      id="highlight_public"
                      name="highlight_public"
                      value={filters.highlight_public}
                      onChange={handleFilterChange}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </>
              )}
              {/* Year */}
              <div>
                <label
                  htmlFor="year"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Year
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="1900"
                  value={filters.year}
                  onChange={handleFilterChange}
                  placeholder="Year"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
              {/* Minimum price */}
              <div>
                <label
                  htmlFor="min_price"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Min Price (AED)
                </label>
                <input
                  id="min_price"
                  name="min_price"
                  type="number"
                  min="0"
                  value={filters.min_price}
                  onChange={handleFilterChange}
                  placeholder="Min price"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
              {/* Maximum price */}
              <div>
                <label
                  htmlFor="max_price"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Max Price (AED)
                </label>
                <input
                  id="max_price"
                  name="max_price"
                  type="number"
                  min="0"
                  value={filters.max_price}
                  onChange={handleFilterChange}
                  placeholder="Max price"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
              {/* Minimum mileage */}
              <div>
                <label
                  htmlFor="min_mileage"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Min Mileage (km)
                </label>
                <input
                  id="min_mileage"
                  name="min_mileage"
                  type="number"
                  min="0"
                  value={filters.min_mileage}
                  onChange={handleFilterChange}
                  placeholder="Min mileage"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
              {/* Maximum mileage */}
              <div>
                <label
                  htmlFor="max_mileage"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Max Mileage (km)
                </label>
                <input
                  id="max_mileage"
                  name="max_mileage"
                  type="number"
                  min="0"
                  value={filters.max_mileage}
                  onChange={handleFilterChange}
                  placeholder="Max mileage"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </div>
            {/* Filter actions */}
            <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="primary"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* List toolbar */}
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {isMaster && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <input
                    type="checkbox"
                    checked={
                      cars.length > 0 &&
                      cars.every((car) => selectedCars.includes(car.id))
                    }
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedCars((previous) => [
                          ...new Set([
                            ...previous,
                            ...cars.map((car) => car.id),
                          ]),
                        ]);
                      } else {
                        setSelectedCars((previous) =>
                          previous.filter(
                            (id) => !cars.some((car) => car.id === id),
                          ),
                        );
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  Select all
                </label>
              )}

              <span className="text-xs font-semibold text-slate-600">
                Showing {startItem}-{endItem} of {totalCount}
              </span>

              <span className="hidden h-4 w-px bg-slate-200 sm:block" />

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                All Vehicles
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                icon={Printer}
                disabled={cars.length === 0 || companyLoading || !company}
                onClick={openStockOutputModal}
              >
                {companyLoading ? "Loading Company..." : "Print Stock"}
              </Button>

              <select
                id="inventory-ordering"
                value={ordering}
                onChange={(event) => {
                  setPage(1);
                  setOrdering(event.target.value);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <div className="min-w-[1050px]">
            {/* Header */}
            <div className="grid grid-cols-[36px_minmax(220px,1.7fr)_70px_110px_100px_75px_105px_130px_150px] items-center border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <div />

              <div>Vehicle</div>

              <div>Year</div>

              <div>Stock ID</div>

              <div>Mileage</div>

              <div>Age</div>

              <div>Status</div>

              <div>Price</div>

              <div className="text-right">Actions</div>
            </div>

            {/* Rows */}
            {cars.length > 0 ? (
              cars.map((car) => {
                const imagePath =
                  car.images?.find((image) => image.is_cover)?.image ||
                  car.images?.[0]?.image ||
                  null;

                const imageUrl = imagePath
                  ? resolveBackendUrl(imagePath)
                  : null;

                const isSelected = selectedCars.includes(car.id);

                return (
                  <div
                    key={car.id}
                    className="group grid grid-cols-[36px_minmax(220px,1.7fr)_70px_110px_100px_75px_105px_130px_150px] items-center border-b border-slate-100 px-4 transition-colors last:border-b-0 hover:bg-slate-50"
                  >
                    {/* Selection */}
                    <div>
                      {isMaster && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedCars((previous) =>
                              isSelected
                                ? previous.filter((id) => id !== car.id)
                                : [...previous, car.id],
                            );
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                        />
                      )}
                    </div>

                    {/* Vehicle */}
                    <div className="flex min-w-0 items-center gap-3 py-2.5">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${car.make || ""} ${car.model || ""}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] font-semibold uppercase text-slate-400">
                            No image
                          </div>
                        )}

                        <span
                          className={[
                            "absolute inset-y-0 left-0 w-1",
                            car.is_aged_90_plus
                              ? "bg-amber-500"
                              : "bg-slate-300",
                          ].join(" ")}
                        />
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/stock/${car.id}`)}
                          className="block max-w-full truncate text-left text-sm font-bold text-slate-900 hover:text-amber-600"
                        >
                          {car.make} {car.model}
                        </button>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {car.variant || "No variant specified"}
                        </p>
                      </div>
                    </div>

                    {/* Year */}
                    <div className="text-sm font-medium text-slate-700">
                      {car.year || "-"}
                    </div>

                    {/* Stock ID */}
                    <div>
                      <span className="font-mono text-xs font-semibold text-amber-600">
                        {car.stock_id || "-"}
                      </span>

                      {car.colour && (
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {car.colour}
                        </p>
                      )}
                    </div>

                    {/* Mileage */}
                    <div className="text-sm text-slate-600">
                      {car.mileage !== null && car.mileage !== undefined
                        ? `${Number(car.mileage).toLocaleString("en-AE")} km`
                        : "-"}
                    </div>

                    {/* Age */}
                    <div>
                      <span
                        className={[
                          "inline-flex min-w-[46px] justify-center rounded-full px-2.5 py-1 text-[10px] font-bold",
                          car.stock_age_days >= 90
                            ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
                            : car.stock_age_days >= 60
                              ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200"
                              : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {car.stock_age_days ?? "-"}d
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <StatusBadge status={car.status}>
                        {getStatusLabel(car.status)}
                      </StatusBadge>
                    </div>

                    {/* Price */}
                    <div className="text-sm font-semibold text-slate-900">
                      {car.status === "booked"
                        ? "-"
                        : car.asking_price
                          ? `AED ${Number(car.asking_price).toLocaleString("en-AE")}`
                          : "-"}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        className="h-8 w-8 !shrink-0 !p-0"
                        title="View vehicle"
                        onClick={() => navigate(`/stock/${car.id}`)}
                      >
                        <span className="sr-only">View</span>
                      </Button>

                      {isMaster && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          className="h-8 w-8 !shrink-0 !p-0"
                          title="Edit vehicle"
                          onClick={() => navigate(`/stock/${car.id}/edit`)}
                        >
                          <span className="sr-only">Edit</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={Share2Icon}
                        className="h-8 w-8 !shrink-0 !p-0"
                        title="Share vehicle"
                        onClick={() => {
                          openVehicleShare(car);
                        }}
                      >
                        <span className="sr-only">Share</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={Printer}
                        className="h-8 w-8 !shrink-0 !p-0"
                        title="Print vehicle"
                        onClick={() => handlePrintVehicle(car)}
                      >
                        <span className="sr-only">Print</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-16 text-center">
                <CarFront
                  size={42}
                  strokeWidth={1.5}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 text-base font-bold text-slate-800">
                  No vehicles found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or inventory filters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile / tablet list */}
        <div className="lg:hidden">
          {cars.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {cars.map((car) => {
                const imagePath =
                  car.images?.find((image) => image.is_cover)?.image ||
                  car.images?.[0]?.image ||
                  null;

                const imageUrl = imagePath
                  ? resolveBackendUrl(imagePath)
                  : null;

                const isSelected = selectedCars.includes(car.id);

                return (
                  <div
                    key={car.id}
                    className="p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      {isMaster && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedCars((previous) =>
                              isSelected
                                ? previous.filter((id) => id !== car.id)
                                : [...previous, car.id],
                            );
                          }}
                          className="mt-4 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                        />
                      )}

                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${car.make || ""} ${car.model || ""}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] font-semibold uppercase text-slate-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/stock/${car.id}`)}
                              className="truncate text-left text-sm font-bold text-slate-900 hover:text-amber-600"
                            >
                              {car.make} {car.model}
                            </button>

                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {car.variant || "No variant specified"}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                            {car.stock_age_days ?? "-"}d
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500">
                          <span>{car.year || "-"}</span>

                          <span className="font-mono text-amber-600">
                            {car.stock_id || "-"}
                          </span>

                          <span>
                            {car.mileage !== null && car.mileage !== undefined
                              ? `${Number(car.mileage).toLocaleString("en-AE")} km`
                              : "-"}
                          </span>

                          <StatusBadge status={car.status}>
                            {getStatusLabel(car.status)}
                          </StatusBadge>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-slate-900">
                            {car.status === "booked"
                              ? "-"
                              : car.asking_price
                                ? `AED ${Number(car.asking_price).toLocaleString("en-AE")}`
                                : "-"}
                          </span>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              icon={Eye}
                              onClick={() => navigate(`/stock/${car.id}`)}
                            >
                              <span className="sr-only">View</span>
                            </Button>

                            {isMaster && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                icon={Pencil}
                                onClick={() =>
                                  navigate(`/stock/${car.id}/edit`)
                                }
                              >
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              icon={Share2Icon}
                              onClick={() => {
                                openVehicleShare(car);
                              }}
                            >
                              <span className="sr-only">Share</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <CarFront
                size={42}
                strokeWidth={1.5}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-base font-bold text-slate-800">
                No vehicles found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or other inventory filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Result count */}
        <div className="text-xs text-slate-500">
          Showing
          <span className="font-medium text-gray-900">
            {startItem}-{endItem}
          </span>
          of <span className="font-semibold text-slate-800">{totalCount}</span>{" "}
          vehicles
        </div>
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1">
            {/* Previous */}
            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            {/* Page numbers */}
            {getPaginationItems().map((item, index) => {
              if (item === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-9 min-w-9 items-center justify-center px-1 text-sm text-gray-400"
                  >
                    ...
                  </span>
                );
              }

              const isCurrentPage = item === page;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  disabled={isCurrentPage}
                  aria-current={isCurrentPage ? "page" : undefined}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition ${
                    isCurrentPage
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              );
            })}

            {/* Next */}
            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => Math.min(totalPages, currentPage + 1))
              }
              disabled={page >= totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </div>

      {showStockOutputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Customize Stock Output
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the fields to include in the stock print/share output.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockOutputModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleGenerateStockPrint}
                  disabled={
                    selectedStockOutputFields.length === 0 || printingStock
                  }
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Printer size={16} className="mr-2 inline-block" />
                  {printingStock ? "Preparing..." : "Generate & Print"}
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Available Fields
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllStockOutputFields}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={clearAllStockOutputFields}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {stockOutputFields.map((field) => {
                  const checked = selectedStockOutputFields.includes(field.key);

                  return (
                    <label
                      key={field.key}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStockOutputField(field.key)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {field.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {!stockOutputFields.length && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No stock output fields are available for your role.
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  {selectedStockOutputFields.length} of{" "}
                  {stockOutputFields.length} fields selected
                </p>

                <button
                  type="button"
                  onClick={() => setShowStockOutputModal(false)}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {shareCar && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="my-3 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:my-4 sm:max-h-[calc(100dvh-2rem)]">
            {(() => {
              const shareImages = getShareImages(shareCar);
              const currentImage =
                shareImages[shareImageIndex] || shareImages[0] || null;

              return (
                <>
                  {/* Header */}
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {shareCar.make} {shareCar.model}
                      </h2>

                      <p className="text-sm text-gray-500">
                        {shareCar.variant || "Vehicle details"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShareCar(null)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close share preview"
                    >
                      ×
                    </button>
                  </div>

                  {/* Photo carousel */}
                  <div className="relative bg-gray-100">
                    <div className="h-48 w-full overflow-hidden sm:h-56 md:h-60 lg:h-64">
                      {currentImage ? (
                        <img
                          src={currentImage}
                          alt={`${shareCar.make} ${shareCar.model}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          <CarFront size={56} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    {shareImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setShareImageIndex(
                              (currentIndex) =>
                                (currentIndex - 1 + shareImages.length) %
                                shareImages.length,
                            )
                          }
                          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShareImageIndex(
                              (currentIndex) =>
                                (currentIndex + 1) % shareImages.length,
                            )
                          }
                          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white"
                          aria-label="Next photo"
                        >
                          <ChevronRight size={18} />
                        </button>

                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                          {shareImages.map((_, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setShareImageIndex(index)}
                              className={`h-2 w-2 rounded-full transition ${
                                index === shareImageIndex
                                  ? "w-5 bg-white"
                                  : "bg-white/60"
                              }`}
                              aria-label={`Show photo ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Share customization */}
                  <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Customize Shared Details
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          Select the fields to include when sharing this
                          vehicle.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllShareOutputFields}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          All
                        </button>

                        <button
                          type="button"
                          onClick={clearAllShareOutputFields}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {shareOutputFields.map((field) => {
                        const checked = selectedShareOutputFields.includes(
                          field.key,
                        );

                        return (
                          <label
                            key={field.key}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:bg-slate-100"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleShareOutputField(field.key)}
                              className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                            />

                            <span className="text-sm font-medium text-slate-700">
                              {field.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Preview
                      </p>

                      <div className="mt-3 max-h-48 overflow-y-auto whitespace-pre-line break-words rounded-lg bg-white p-4 text-sm leading-6 text-slate-700 sm:max-h-56">
                        {buildShareText(shareCar, selectedShareOutputFields)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleShareVehicle(shareCar)}
                      disabled={selectedShareOutputFields.length === 0}
                      className="sticky bottom-0 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:static"
                    >
                      <Share2Icon size={18} />
                      Share Vehicle
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Import Vehicles
              </h2>

              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="text-xl text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Upload an Excel or CSV file containing vehicle inventory data.
            </p>

            <input
              type="file"
              accept=".xlsx,.csv"
              disabled={importing}
              onChange={(event) => {
                setSelectedImportFile(event.target.files?.[0] || null);
              }}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />

            {selectedImportFile && (
              <p className="mt-3 text-sm text-gray-600">
                Selected: {selectedImportFile.name}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="primary"
                loading={importing}
                onClick={handleBulkImport}
                disabled={!selectedImportFile}
              >
                {importing ? "Importing..." : "Import"}
              </Button>

              <Button
                type="button"
                variant="primary"
                loading={importing}
                onClick={handleBulkImport}
                disabled={!selectedImportFile}
              >
                {importing ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {printCar && (
        <div className="inventory-vehicle-print-wrapper">
          <InventoryVehiclePrintTemplate car={printCar} />
        </div>
      )}

      {printStockConfig && (
        <div className="inventory-stock-print-wrapper">
          <InventoryStockPrintTemplate
            cars={printStockConfig.cars}
            selectedFields={printStockConfig.selectedFields}
            company={printStockConfig.company}
          />
        </div>
      )}
    </div>
  );
}

export default Stock;
