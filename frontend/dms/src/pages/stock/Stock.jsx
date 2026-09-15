import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gauge,
  MapPin,
  Pencil,
  Printer,
  Share2Icon,
} from "lucide-react";

import {
  getCars,
  getCarBrands,
  bulkDeleteCars,
  bulkImportCars,
} from "../../api/inventory";
import { resolveBackendUrl } from "../../api/url";

import PrintButton from "../../components/printing/PrintButton";
import InventoryVehiclePrintTemplate from "../../components/printing/templates/InventoryVehiclePrintTemplate";
import { printInventoryVehicle } from "../../utils/print";
import InventoryStockPrintTemplate from "../../components/printing/templates/InventoryStockPrintTemplate";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatusBadge from "../../components/ui/StatusBadge";

const INITIAL_FILTERS = {
  status: "",
  make: "",
  vehicle_type: "",
  source: "",
  supplier: "",
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
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

  const [ordering, setOrdering] = useState("-created_at");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedCars, setSelectedCars] = useState([]);
  const [shareCar, setShareCar] = useState(null);
  const [shareImageIndex, setShareImageIndex] = useState(0);
  const [printCar, setPrintCar] = useState(null);
  const [printStock, setPrintStock] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const navigate = useNavigate();
  const carouselRef = useRef(null);

  /*
   * Existing search debounce.
   *
   * Do not change this behavior.
   */

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;

    const scrollAmount = carouselRef.current.clientWidth * 0.85;

    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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
    async function loadCars() {
      try {
        const response = await getCars({
          search: searchQuery,
          ...appliedFilters,
          ordering,
          page,
          page_size: pageSize,
        });

        setCars(response.data);
        setTotalCount(response.count);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadCars();
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

  async function handleShareVehicle(car) {
    const shareText = [
      `${car.make || ""} ${car.model || ""}`.trim(),
      car.variant ? car.variant : null,
      car.vehicle_type ? getVehicleTypeLabel(car.vehicle_type) : null,
      car.year ? `Year: ${car.year}` : null,
      car.colour ? `Colour: ${car.colour}` : null,
      car.mileage !== null && car.mileage !== undefined
        ? `Mileage: ${Number(car.mileage).toLocaleString("en-AE")} km`
        : null,
      car.status ? `Status: ${getStatusLabel(car.status)}` : null,
      car.status === "booked"
        ? null
        : car.asking_price
          ? `Price: AED ${Number(car.asking_price).toLocaleString("en-AE")}`
          : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${car.make || ""} ${car.model || ""}`.trim(),
          text: shareText,
        });

        return;
      }

      await navigator.clipboard.writeText(shareText);
      alert("Vehicle details copied to clipboard.");
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

  function handlePrintStock() {
    setPrintStock(true);

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setPrintStock(false);
      }, 100);
    }, 0);
  }

  function handleVehicleSelect(vehicleId) {
    setSelectedCars((currentSelected) => {
      if (currentSelected.includes(vehicleId)) {
        return currentSelected.filter((id) => id !== vehicleId);
      }

      return [...currentSelected, vehicleId];
    });
  }

  function handleSelectAll() {
    const currentPageIds = cars.map((car) => car.id);

    const allCurrentPageSelected = currentPageIds.every((id) =>
      selectedCars.includes(id),
    );

    if (allCurrentPageSelected) {
      setSelectedCars((currentSelected) =>
        currentSelected.filter((id) => !currentPageIds.includes(id)),
      );
    } else {
      setSelectedCars((currentSelected) => [
        ...new Set([...currentSelected, ...currentPageIds]),
      ]);
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
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
            Core Operations
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage vehicle stock, pricing, status, and availability.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-slate-500">
              {totalCount} vehicles
            </span>
          </div>
        </div>
      </div>
      {/* Search + Sorting */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
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
            icon={Printer}
            disabled={cars.length === 0}
            onClick={handlePrintStock}
          >
            Print Stock
          </Button>

          <select
            id="ordering"
            value={ordering}
            onChange={(e) => {
              setPage(1);
              setOrdering(e.target.value);
            }}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isMaster && (
        <div className="mb-5">
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowImportModal(true)}
          >
            Bulk Import
          </Button>
        </div>
      )}

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
        <Button
          type="button"
          variant="secondary"
          className="mb-4"
          onClick={() => setShowFilters((isVisible) => !isVisible)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>

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

      {/* Inventory carousel */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          {cars.length > 0 ? (
            <>
              {/* Carousel controls */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMaster && (
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={
                          cars.length > 0 &&
                          cars.every((car) => selectedCars.includes(car.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCars((prev) => [
                              ...new Set([
                                ...prev,
                                ...cars.map((car) => car.id),
                              ]),
                            ]);
                          } else {
                            setSelectedCars((prev) =>
                              prev.filter(
                                (id) => !cars.some((car) => car.id === id),
                              ),
                            );
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Select page
                    </label>
                  )}
                  <span className="text-sm text-gray-500">
                    {cars.length} vehicle{cars.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollCarousel("left")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                    aria-label="Previous vehicles"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollCarousel("right")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
                    aria-label="Next vehicles"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Horizontal carousel */}
              <div
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto scroll-smooth pb-5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {cars.map((car) => {
                  const imagePath =
                    car.images?.find((image) => image.is_cover)?.image ||
                    car.images?.[0]?.image ||
                    null;

                  const coverImage = resolveBackendUrl(imagePath);

                  const isSelected = selectedCars.includes(car.id);

                  return (
                    <div
                      key={car.id}
                      className="group min-w-[300px] max-w-[300px] flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] sm:min-w-[320px] sm:max-w-[320px]"
                    >
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden bg-slate-100">
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt={`${car.make} ${car.model}`}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                            <CarFront size={52} strokeWidth={1.5} />
                          </div>
                        )}

                        {/* Selection */}
                        {isMaster && (
                          <div className="absolute left-3 top-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedCars((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== car.id)
                                    : [...prev, car.id],
                                );
                              }}
                              className="h-5 w-5 rounded border-gray-300 bg-white text-blue-600 shadow focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {/* Status */}
                        <div className="absolute right-3 top-3">
                          <StatusBadge status={car.status}>
                            {getStatusLabel(car.status)}
                          </StatusBadge>
                        </div>
                      </div>

                      {/* Card content */}
                      <div className="p-4">
                        {/* Stock ID */}
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">
                          {car.stock_id}
                        </div>

                        {/* Vehicle name */}
                        <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">
                          {car.make} {car.model}
                        </h3>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {car.variant || "No variant specified"}
                        </p>

                        {/* Vehicle details */}
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />
                            <span>{car.year || "-"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-600">
                            <CarFront size={15} className="text-slate-400" />
                            <span className="truncate">
                              {getVehicleTypeLabel(car.vehicle_type)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-600">
                            <Gauge size={15} className="text-slate-400" />
                            <span>{car.mileage ?? "-"} km</span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="h-[15px] w-[15px] rounded-full border border-gray-300" />
                            <span className="truncate">
                              {car.colour || "-"}
                            </span>
                          </div>
                        </div>

                        {/* Service location */}
                        {car.status === "in_service" && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={15} className="text-gray-400" />
                            <span className="truncate">
                              {car.service_location || "Location not specified"}
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                            Asking Price
                          </p>
                          <p className="mt-1 font-mono text-xl font-bold tracking-tight text-slate-900">
                            AED
                            {Number(car.asking_price || 0).toLocaleString(
                              "en-AE",
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div
                          className={`mt-4 grid gap-2 ${
                            isMaster ? "grid-cols-3" : "grid-cols-2"
                          }`}
                        >
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            onClick={() => navigate(`/stock/${car.id}`)}
                          >
                            View
                          </Button>

                          {isMaster && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              icon={Pencil}
                              onClick={() => navigate(`/stock/${car.id}/edit`)}
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={Share2Icon}
                            onClick={() => {
                              setShareCar(car);
                              setShareImageIndex(0);
                            }}
                          >
                            Share
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={Printer}
                            onClick={() => handlePrintVehicle(car)}
                          >
                            Print
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <CarFront
                size={48}
                strokeWidth={1.5}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 text-base font-bold text-slate-800">
                No vehicles found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
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

      {shareCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {(() => {
              const shareImages = getShareImages(shareCar);
              const currentImage =
                shareImages[shareImageIndex] || shareImages[0] || null;

              return (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
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
                    <div className="h-72 w-full overflow-hidden">
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

                  {/* Vehicle information */}
                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs text-gray-500">Vehicle Type</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {getVehicleTypeLabel(shareCar.vehicle_type)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Year</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {shareCar.year || "-"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Mileage</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {shareCar.mileage !== null &&
                          shareCar.mileage !== undefined
                            ? `${Number(shareCar.mileage).toLocaleString("en-AE")} km`
                            : "-"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Colour</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {shareCar.colour || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Status</span>

                        <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                          {getStatusLabel(shareCar.status)}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    {shareCar.status !== "booked" && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Asking Price</p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          AED{" "}
                          {Number(shareCar.asking_price || 0).toLocaleString(
                            "en-AE",
                          )}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleShareVehicle(shareCar)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
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

      {printStock && (
        <div className="inventory-stock-print-wrapper">
          <InventoryStockPrintTemplate cars={cars} />
        </div>
      )}
    </div>
  );
}

export default Stock;
