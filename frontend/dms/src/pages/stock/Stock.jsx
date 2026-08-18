import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCars, bulkDeleteCars, bulkImportCars } from "../../api/inventory";

const INITIAL_FILTERS = {
  status: "",
  source: "",
  supplier: "",
  year: "",
  highlight_public: "",
  min_price: "",
  max_price: "",
  min_mileage: "",
  max_mileage: "",
};

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "upcoming", label: "Upcoming" },
  { value: "reserved", label: "Reserved" },
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

function Stock() {
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
  const [refreshKey, setRefreshKey] = useState(0);

  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const navigate = useNavigate();

  /*
   * Existing search debounce.
   *
   * Do not change this behavior.
   */
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
      selectedCars.includes(id)
    );

    if (allCurrentPageSelected) {
      setSelectedCars((currentSelected) =>
        currentSelected.filter(
          (id) => !currentPageIds.includes(id)
        )
      );
    } else {
      setSelectedCars((currentSelected) => [
        ...new Set([
          ...currentSelected,
          ...currentPageIds,
        ]),
      ]);
    }
  }

  async function handleBulkDelete() {
    if (selectedCars.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCars.length} vehicle(s)?`
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
    return <h2>Loading...</h2>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">
          Inventory
        </h1>

        {/* Search + Sorting */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500"
          />

          <button
            type="button"
            onClick={() => setSearch("")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100"
          >
            Clear
          </button>

          <select
            id="ordering"
            value={ordering}
            onChange={(e) => {
              setPage(1);
              setOrdering(e.target.value);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Bulk Import
          </button>
        </div>

        {importResult && (
  <div
    className={`mb-4 rounded-md border p-4 ${
      importResult.success
        ? "border-green-200 bg-green-50"
        : "border-red-200 bg-red-50"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p
          className={`font-medium ${
            importResult.success
              ? "text-green-800"
              : "text-red-800"
          }`}
        >
          {importResult.message}
        </p>

        {importResult.success && importResult.data && (
  <div className="mt-2 text-sm text-green-700">
    <p>
      Imported:{" "}
      <strong>
        {importResult.data.created_count}
      </strong>
    </p>

    <p>
      Skipped:{" "}
      <strong>
        {importResult.data.skipped_count}
      </strong>
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

        {selectedCars.length > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
            <span className="text-sm text-gray-700">
              {selectedCars.length} vehicle(s) selected
            </span>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete Selected
            </button>

            <button
              type="button"
              onClick={() => setSelectedCars([])}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowFilters((isVisible) => !isVisible)}
            className="mb-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {showFilters && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {/* Status */}
                <div>
                  <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">All</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label htmlFor="source" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Source
                  </label>
                  <select
                    id="source"
                    name="source"
                    value={filters.source}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
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
                  <label htmlFor="supplier" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Supplier
                  </label>
                  <input
                    id="supplier"
                    name="supplier"
                    type="text"
                    value={filters.supplier}
                    onChange={handleFilterChange}
                    placeholder="Supplier"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                {/* Year */}
                <div>
                  <label htmlFor="year" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                {/* Highlight */}
                <div>
                  <label htmlFor="highlight_public" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Highlight
                  </label>
                  <select
                    id="highlight_public"
                    name="highlight_public"
                    value={filters.highlight_public}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {/* Minimum price */}
                <div>
                  <label htmlFor="min_price" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                {/* Maximum price */}
                <div>
                  <label htmlFor="max_price" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                {/* Minimum mileage */}
                <div>
                  <label htmlFor="min_mileage" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>

                {/* Maximum mileage */}
                <div>
                  <label htmlFor="max_mileage" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>
              </div>

              {/* Filter actions */}
              <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Apply Filters
                </button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

      </div>


      {/* Inventory table */}
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={
                    cars.length > 0 &&
                    cars.every((car) => selectedCars.includes(car.id))
                  }
                  onChange={handleSelectAll}
                  aria-label="Select all vehicles"
                />
              </th>

              <th className="px-4 py-3 font-medium">Stock ID</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">Make</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium">Colour</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Mileage</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {cars.map((car) => (
              <tr
                key={car.id}
                className="border-b last:border-b-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedCars.includes(car.id)}
                    onChange={() => handleVehicleSelect(car.id)}
                    aria-label={`Select ${car.stock_id}`}
                  />
                </td>

                <td className="px-4 py-3">{car.stock_id}</td>
                <td className="px-4 py-3">{car.year}</td>
                <td className="px-4 py-3">{car.make}</td>
                <td className="px-4 py-3">{car.model}</td>
                <td className="px-4 py-3">{car.variant}</td>
                <td className="px-4 py-3">{car.colour}</td>
                <td className="px-4 py-3">{car.status}</td>
                <td className="px-4 py-3">
                  {car.asking_price ?? "-"}
                </td>
                <td className="px-4 py-3">
                  {car.mileage ?? "-"}
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    onClick={() => navigate(`/stock/${car.id}`)}
                    className="mr-2 text-sm text-gray-700 hover:underline"
                  >
                    👁️ View
                  </button>

                  <button
                    onClick={() => navigate(`/stock/${car.id}/edit`)}
                    className="text-sm text-gray-700 hover:underline"
                  >
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPage((currentPage) => currentPage - 1)}
          disabled={page === 1}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Previous
        </button>

        {getPaginationItems().map((item, index) => {
          if (item === "...") {
            return <span key={`ellipsis-${index}`}>...</span>;
          }

          return (
            <button
              key={item}
              type="button"
              onClick={() => setPage(item)}
              disabled={item === page}
              className={`rounded-md border px-3 py-1.5 ${item === page
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white hover:bg-gray-100"
                }`}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setPage((currentPage) => currentPage + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>

        <span className="ml-2 text-gray-500">
          Showing {cars.length} of {totalCount} vehicles
        </span>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
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
              <button
                type="button"
                onClick={() => {
                  setSelectedImportFile(null);
                  setShowImportModal(false);
                }}
                disabled={importing}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBulkImport}
                disabled={!selectedImportFile || importing}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Stock;
