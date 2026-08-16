import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCars } from "../../api/inventory";

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

  const navigate = useNavigate();

  /*
   * Existing search debounce.
   *
   * Do not change this behavior.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
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
        });

        setCars(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, [searchQuery, appliedFilters]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleApplyFilters() {
    setAppliedFilters({
      ...filters,
    });
  }

  function handleResetFilters() {
    const resetFilters = {
      ...INITIAL_FILTERS,
    };

    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
  }

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>Inventory</h1>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search vehicles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button type="button" onClick={() => setSearch("")}>
          Clear
        </button>
      </div>

      {/* Filters */}
      <div>
        <button
          type="button"
          onClick={() => setShowFilters((isVisible) => !isVisible)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {showFilters && (
          <div>
            {/* Status */}
            <div>
              <label htmlFor="status">Status</label>

              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
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
              <label htmlFor="source">Source</label>

              <select
                id="source"
                name="source"
                value={filters.source}
                onChange={handleFilterChange}
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
              <label htmlFor="supplier">Supplier</label>

              <input
                id="supplier"
                name="supplier"
                type="text"
                value={filters.supplier}
                onChange={handleFilterChange}
                placeholder="Supplier"
              />
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year">Year</label>

              <input
                id="year"
                name="year"
                type="number"
                min="1900"
                value={filters.year}
                onChange={handleFilterChange}
                placeholder="Year"
              />
            </div>

            {/* Highlight */}
            <div>
              <label htmlFor="highlight_public">Highlight</label>

              <select
                id="highlight_public"
                name="highlight_public"
                value={filters.highlight_public}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Minimum price */}
            <div>
              <label htmlFor="min_price">Min Price (AED)</label>

              <input
                id="min_price"
                name="min_price"
                type="number"
                min="0"
                value={filters.min_price}
                onChange={handleFilterChange}
                placeholder="Min price"
              />
            </div>

            {/* Maximum price */}
            <div>
              <label htmlFor="max_price">Max Price (AED)</label>

              <input
                id="max_price"
                name="max_price"
                type="number"
                min="0"
                value={filters.max_price}
                onChange={handleFilterChange}
                placeholder="Max price"
              />
            </div>

            {/* Minimum mileage */}
            <div>
              <label htmlFor="min_mileage">Min Mileage (km)</label>

              <input
                id="min_mileage"
                name="min_mileage"
                type="number"
                min="0"
                value={filters.min_mileage}
                onChange={handleFilterChange}
                placeholder="Min mileage"
              />
            </div>

            {/* Maximum mileage */}
            <div>
              <label htmlFor="max_mileage">Max Mileage (km)</label>

              <input
                id="max_mileage"
                name="max_mileage"
                type="number"
                min="0"
                value={filters.max_mileage}
                onChange={handleFilterChange}
                placeholder="Max mileage"
              />
            </div>

            {/* Filter actions */}
            <div>
              <button type="button" onClick={handleApplyFilters}>
                Apply Filters
              </button>

              <button type="button" onClick={handleResetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory table */}
      <table>
        <thead>
          <tr>
            <th>Stock ID</th>
            <th>Year</th>
            <th>Make</th>
            <th>Model</th>
            <th>Variant</th>
            <th>Colour</th>
            <th>Status</th>
            <th>Price</th>
            <th>Mileage</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              <td>{car.stock_id}</td>
              <td>{car.year}</td>
              <td>{car.make}</td>
              <td>{car.model}</td>
              <td>{car.variant}</td>
              <td>{car.colour}</td>
              <td>{car.status}</td>
              <td>{car.asking_price ?? "-"}</td>
              <td>{car.mileage ?? "-"}</td>

              <td>
                <button onClick={() => navigate(`/stock/${car.id}`)}>
                  👁️View
                </button>

                <button onClick={() => navigate(`/stock/${car.id}/edit`)}>
                  ✏️Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Stock;
