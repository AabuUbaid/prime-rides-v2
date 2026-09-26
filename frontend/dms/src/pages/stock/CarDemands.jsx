import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import DataTable from "../../components/ui/DataTable";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {
  createCarDemand,
  deleteCarDemand,
  getCarDemandMatches,
  getCarDemands,
  linkCarDemandVehicles,
  unlinkCarDemandVehicles,
  updateCarDemand,
} from "../../api/carDemands";

import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "matched", label: "Matched" },
  { value: "closed", label: "Closed" },
];

function formatBudget(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return `AED ${Number(value).toLocaleString("en-AE")}`;
}

function getStatusClasses(status) {
  if (status === "matched") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "closed") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-emerald-50 text-emerald-700";
}

function CarDemands() {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const [editingDemand, setEditingDemand] = useState(null);

  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [demandForm, setDemandForm] = useState({
    customer_name: "",
    phone: "",
    make: "",
    model: "",
    year_from: "",
    year_to: "",
    budget: "",
    colour: "",
    notes: "",
  });

  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState("");

  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");

  const [unlinkingVehicleId, setUnlinkingVehicleId] = useState(null);
  const [unlinkError, setUnlinkError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function loadDemands() {
      setLoading(true);
      setError("");

      try {
        const response = await getCarDemands({
          search: searchQuery,
          status,
          page,
          page_size: pageSize,
        });

        setDemands(response?.data || []);
        setTotalCount(Number(response?.count) || 0);
      } catch (err) {
        console.error("Failed to load car demands:", err);

        setDemands([]);
        setTotalCount(0);
        setError(err.message || "Failed to load cars in demand.");
      } finally {
        setLoading(false);
      }
    }

    loadDemands();
  }, [searchQuery, status, page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  function canManageDemand(demand) {
    if (!user?.id || !demand) {
      return false;
    }

    if (user.role === "MASTER") {
      return true;
    }

    return (
      String(demand.created_by) === String(user.id) ||
      String(demand.agent) === String(user.id)
    );
  }

  const columns = [
    {
      key: "customer",
      label: "Customer",
      render: (demand) => (
        <div>
          <p className="font-medium text-slate-800">
            {demand.customer_name || "—"}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">{demand.phone || "—"}</p>
        </div>
      ),
    },
    {
      key: "vehicle",
      label: "Vehicle",
      render: (demand) => (
        <div>
          <p className="font-medium text-slate-800">
            {[demand.make, demand.model].filter(Boolean).join(" ") || "—"}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {demand.colour || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "year",
      label: "Year",
      render: (demand) =>
        demand.year_from !== null &&
        demand.year_from !== undefined &&
        demand.year_to !== null &&
        demand.year_to !== undefined
          ? `${demand.year_from} – ${demand.year_to}`
          : "—",
    },
    {
      key: "budget",
      label: "Budget",
      render: (demand) => formatBudget(demand.budget),
    },
    {
      key: "agent_name",
      label: "Agent",
      render: (demand) => demand.agent_name || "—",
    },
    {
      key: "matched_vehicle_count",
      label: "Matches",
      render: (demand) => demand.matched_vehicle_count ?? 0,
    },
    {
      key: "status",
      label: "Status",
      render: (demand) => (
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-1",
            "text-xs font-semibold capitalize",
            getStatusClasses(demand.status),
          ].join(" ")}
        >
          {demand.status || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (demand) =>
        demand.created_at
          ? new Date(demand.created_at).toLocaleDateString()
          : "—",
    },
    {
      key: "actions",
      label: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (demand) =>
        canManageDemand(demand) ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => openMatches(demand)}
            >
              Matches
            </Button>

            {demand.status !== "closed" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleCloseDemand(demand)}
              >
                Close
              </Button>
            )}
            {demand.status !== "closed" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={Pencil}
                onClick={() => openEditDemand(demand)}
              >
                Edit
              </Button>
            )}

            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => handleDeleteDemand(demand)}
            >
              Delete
            </Button>
          </div>
        ) : (
          "—"
        ),
    },
  ];

  function goToPage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    setPage(nextPage);
  }

  function resetDemandForm() {
    setDemandForm({
      customer_name: "",
      phone: "",
      make: "",
      model: "",
      year_from: "",
      year_to: "",
      budget: "",
      colour: "",
      notes: "",
    });

    setCreateError("");
    setEditingDemand(null);
  }

  async function handleCreateDemand() {
    setCreateLoading(true);
    setCreateError("");

    try {
      const payload = {
        customer_name: demandForm.customer_name.trim(),
        phone: demandForm.phone.trim(),
        make: demandForm.make.trim(),
        model: demandForm.model.trim(),
        year_from: Number(demandForm.year_from),
        year_to: Number(demandForm.year_to),
        colour: demandForm.colour.trim(),
      };

      if (demandForm.budget !== "") {
        payload.budget = Number(demandForm.budget);
      }

      if (demandForm.notes.trim()) {
        payload.notes = demandForm.notes.trim();
      }

      await createCarDemand(payload);

      setShowCreateModal(false);
      resetDemandForm();

      setPage(1);
      setSearchQuery(search.trim());

      const response = await getCarDemands({
        search: search.trim(),
        status,
        page: 1,
        page_size: pageSize,
      });

      setDemands(response?.data || []);
      setTotalCount(Number(response?.count) || 0);
    } catch (error) {
      const backendError = error?.cause;

      if (backendError && typeof backendError === "object") {
        const fieldErrors = Object.entries(backendError)
          .map(([field, messages]) => {
            const message = Array.isArray(messages)
              ? messages.join(", ")
              : String(messages);

            return `${field}: ${message}`;
          })
          .join(" ");

        setCreateError(
          fieldErrors || error.message || "Failed to create car demand.",
        );
      } else {
        setCreateError(error.message || "Failed to create car demand.");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleUpdateDemand() {
    if (!editingDemand?.id) {
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    try {
      const payload = {
        customer_name: demandForm.customer_name.trim(),
        phone: demandForm.phone.trim(),
        make: demandForm.make.trim(),
        model: demandForm.model.trim(),
        year_from: Number(demandForm.year_from),
        year_to: Number(demandForm.year_to),
        colour: demandForm.colour.trim(),
      };

      if (demandForm.budget !== "") {
        payload.budget = Number(demandForm.budget);
      } else {
        payload.budget = null;
      }

      payload.notes = demandForm.notes.trim();

      await updateCarDemand(editingDemand.id, payload);

      resetDemandForm();
      setShowCreateModal(false);

      const response = await getCarDemands({
        search: search.trim(),
        status,
        page,
        page_size: pageSize,
      });

      setDemands(response?.data || []);
      setTotalCount(Number(response?.count) || 0);
    } catch (error) {
      const backendError = error?.cause;

      if (backendError && typeof backendError === "object") {
        const fieldErrors = Object.entries(backendError)
          .map(([field, messages]) => {
            const message = Array.isArray(messages)
              ? messages.join(", ")
              : String(messages);

            return `${field}: ${message}`;
          })
          .join(" ");

        setCreateError(
          fieldErrors || error.message || "Failed to update car demand.",
        );
      } else {
        setCreateError(error.message || "Failed to update car demand.");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteDemand(demand) {
    if (!demand?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the demand for ${demand.customer_name || "this customer"}?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteCarDemand(demand.id);

      const response = await getCarDemands({
        search: search.trim(),
        status,
        page,
        page_size: pageSize,
      });

      const nextDemands = response?.data || [];
      const nextCount = Number(response?.count) || 0;

      if (nextDemands.length === 0 && page > 1) {
        setPage((currentPage) => currentPage - 1);
        return;
      }

      setDemands(nextDemands);
      setTotalCount(nextCount);
    } catch (error) {
      setError(error.message || "Failed to delete car demand.");
    }
  }

  async function handleCloseDemand(demand) {
    if (!demand?.id || demand.status === "closed") {
      return;
    }

    const confirmed = window.confirm(
      `Close the demand for ${demand.customer_name || "this customer"}?\n\nClosed demands cannot be reopened.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await updateCarDemand(demand.id, {
        status: "closed",
      });

      const response = await getCarDemands({
        search: searchQuery,
        status,
        page,
        page_size: pageSize,
      });

      const nextDemands = response?.data || [];
      const nextCount = Number(response?.count) || 0;

      if (nextDemands.length === 0 && page > 1) {
        setPage((currentPage) => currentPage - 1);
        return;
      }

      setDemands(nextDemands);
      setTotalCount(nextCount);
    } catch (error) {
      console.error("Failed to close car demand:", error);

      setError(error.message || "Failed to close the car demand.");
    }
  }

  function openEditDemand(demand) {
    setCreateError("");
    setEditingDemand(demand);
    setShowCreateModal(true);

    setDemandForm({
      customer_name: demand.customer_name || "",
      phone: demand.phone || "",
      make: demand.make || "",
      model: demand.model || "",
      year_from:
        demand.year_from !== null && demand.year_from !== undefined
          ? String(demand.year_from)
          : "",
      year_to:
        demand.year_to !== null && demand.year_to !== undefined
          ? String(demand.year_to)
          : "",
      budget:
        demand.budget !== null && demand.budget !== undefined
          ? String(demand.budget)
          : "",
      colour: demand.colour || "",
      notes: demand.notes || "",
    });
  }

  async function openMatches(demand) {
    setSelectedDemand(demand);
    setShowMatchesModal(true);
    setMatches([]);
    setMatchesError("");
    setSelectedVehicleIds([]);
    setLinkError("");
    setUnlinkError("");
    setMatchesLoading(true);

    try {
      const response = await getCarDemandMatches(demand.id);

      setMatches(response?.data || []);
    } catch (error) {
      console.error("Failed to load demand matches:", error);

      setMatchesError(error.message || "Failed to load matching vehicles.");
    } finally {
      setMatchesLoading(false);
    }
  }

  async function handleLinkSelectedVehicles() {
    if (!selectedDemand?.id || selectedVehicleIds.length === 0) {
      return;
    }

    setLinkLoading(true);
    setLinkError("");

    try {
      await linkCarDemandVehicles(selectedDemand.id, selectedVehicleIds);

      const response = await getCarDemands({
        search: searchQuery,
        status,
        page,
        page_size: pageSize,
      });

      setDemands(response?.data || []);
      setTotalCount(Number(response?.count) || 0);

      setSelectedVehicleIds([]);
      setMatches([]);
      setSelectedDemand(null);
      setShowMatchesModal(false);
    } catch (error) {
      console.error("Failed to link demand vehicles:", error);

      setLinkError(error.message || "Failed to link selected vehicles.");
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleUnlinkVehicle(vehicle) {
    if (!selectedDemand?.id || !vehicle?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Unlink ${vehicle.stock_id || "this vehicle"} from this demand?`,
    );

    if (!confirmed) {
      return;
    }

    setUnlinkingVehicleId(vehicle.id);
    setUnlinkError("");

    try {
      const response = await unlinkCarDemandVehicles(selectedDemand.id, [
        vehicle.id,
      ]);

      const updatedDemand = response?.data;

      if (updatedDemand) {
        setSelectedDemand(updatedDemand);
      }

      const matchesResponse = await getCarDemandMatches(selectedDemand.id);

      setMatches(matchesResponse?.data || []);

      const demandsResponse = await getCarDemands({
        search: searchQuery,
        status,
        page,
        page_size: pageSize,
      });

      setDemands(demandsResponse?.data || []);
      setTotalCount(Number(demandsResponse?.count) || 0);

      setSelectedVehicleIds((current) =>
        current.filter((id) => id !== vehicle.id),
      );
    } catch (error) {
      console.error("Failed to unlink demand vehicle:", error);

      setUnlinkError(error.message || "Failed to unlink the vehicle.");
    } finally {
      setUnlinkingVehicleId(null);
    }
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
              Cars in Demand
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer vehicle requirements and matching inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="text-xs font-medium text-slate-500">
                {totalCount} demands
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              icon={Plus}
              onClick={() => {
                resetDemandForm();
                setShowCreateModal(true);
              }}
            >
              New Demand
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customer, phone, make, or model..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 lg:max-w-md"
        />

        <div className="w-full lg:w-52">
          <Select
            id="demand_status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSearch("");
            setStatus("");
            setPage(1);
          }}
        >
          Clear
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

            <p className="text-sm font-medium text-slate-600">
              Loading cars in demand...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait while demand records are loaded.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={demands}
            getRowKey={(demand) => demand.id}
            emptyMessage="No cars in demand records found."
          />

          {totalPages > 1 && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, totalCount)} of {totalCount}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Previous
                </Button>

                <span className="px-2 text-xs font-medium text-slate-600">
                  Page {page} of {totalPages}
                </span>

                <Button
                  type="button"
                  variant="secondary"
                  disabled={page === totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-2 py-2 backdrop-blur-[2px] sm:px-4 sm:py-6">
          <div className="mx-auto flex min-h-full w-full items-center justify-center">
            <div className="flex max-h-[calc(100vh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl">
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingDemand ? "Edit Car Demand" : "New Car Demand"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {editingDemand
                      ? "Update the customer vehicle requirement."
                      : "Create a customer vehicle requirement."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetDemandForm();
                    setShowCreateModal(false);
                  }}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {createError && (
                  <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {createError}
                  </div>
                )}
                <div>
                  <div className="mb-5">
                    <h3 className="text-sm font-bold tracking-tight text-slate-900">
                      Customer Information
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Enter the customer details for this vehicle requirement.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Input
                      id="demand_customer_name"
                      label="Customer Name"
                      value={demandForm.customer_name}
                      onChange={(event) =>
                        setDemandForm((current) => ({
                          ...current,
                          customer_name: event.target.value,
                        }))
                      }
                      placeholder="Enter customer name"
                      required
                    />

                    <Input
                      id="demand_phone"
                      label="Phone"
                      type="tel"
                      inputMode="numeric"
                      value={demandForm.phone}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, "");

                        setDemandForm((current) => ({
                          ...current,
                          phone: value,
                        }));
                      }}
                      placeholder="Enter phone number"
                      required
                      helper="7–15 digits"
                    />
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <div className="mb-5">
                      <h3 className="text-sm font-bold tracking-tight text-slate-900">
                        Vehicle Requirement
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Specify the vehicle the customer is looking for.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <Input
                        id="demand_make"
                        label="Make"
                        value={demandForm.make}
                        onChange={(event) =>
                          setDemandForm((current) => ({
                            ...current,
                            make: event.target.value,
                          }))
                        }
                        placeholder="e.g. BMW"
                        required
                      />

                      <Input
                        id="demand_model"
                        label="Model"
                        value={demandForm.model}
                        onChange={(event) =>
                          setDemandForm((current) => ({
                            ...current,
                            model: event.target.value,
                          }))
                        }
                        placeholder="e.g. X5"
                        required
                      />

                      <Input
                        id="demand_year_from"
                        label="Year From"
                        type="number"
                        min="0"
                        value={demandForm.year_from}
                        onChange={(event) =>
                          setDemandForm((current) => ({
                            ...current,
                            year_from: event.target.value,
                          }))
                        }
                        placeholder="e.g. 2022"
                        required
                      />

                      <Input
                        id="demand_year_to"
                        label="Year To"
                        type="number"
                        min="0"
                        value={demandForm.year_to}
                        onChange={(event) =>
                          setDemandForm((current) => ({
                            ...current,
                            year_to: event.target.value,
                          }))
                        }
                        placeholder="e.g. 2025"
                        required
                      />

                      <Input
                        id="demand_budget"
                        label="Maximum Budget"
                        type="number"
                        min="0"
                        step="0.01"
                        value={demandForm.budget}
                        onChange={(event) =>
                          setDemandForm((current) => ({
                            ...current,
                            budget: event.target.value,
                          }))
                        }
                        placeholder="Enter maximum budget"
                        helper="Optional"
                      />

                      <Input
                        id="demand_colour"
                        label="Colour"
                        value={demandForm.colour}
                        onChange={(event) =>
                          setDemandForm((current) => ({
                            ...current,
                            colour: event.target.value,
                          }))
                        }
                        placeholder="e.g. White"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <div className="mb-5">
                      <h3 className="text-sm font-bold tracking-tight text-slate-900">
                        Notes
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Add any additional customer requirements.
                      </p>
                    </div>

                    <textarea
                      id="demand_notes"
                      rows={4}
                      value={demandForm.notes}
                      onChange={(event) =>
                        setDemandForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Enter additional requirements or customer notes..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 mt-6 flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={createLoading}
                    onClick={() => {
                      resetDemandForm();
                      setShowCreateModal(false);
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    loading={createLoading}
                    onClick={
                      editingDemand ? handleUpdateDemand : handleCreateDemand
                    }
                  >
                    {editingDemand ? "Save Changes" : "Create Demand"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMatchesModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-2 py-2 backdrop-blur-[2px] sm:px-4 sm:py-6">
          <div className="mx-auto flex min-h-full w-full items-center justify-center">
            <div className="flex max-h-[calc(100vh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl">
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Matching Vehicles
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedDemand
                      ? `${selectedDemand.customer_name} — ${selectedDemand.make} ${selectedDemand.model}`
                      : "Vehicles matching this demand"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowMatchesModal(false);
                    setSelectedDemand(null);
                    setMatches([]);
                    setMatchesError("");
                    setSelectedVehicleIds([]);
                    setLinkError("");
                    setUnlinkError("");
                  }}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {matchesLoading ? (
                  <div className="flex min-h-[25vh] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

                      <p className="text-sm font-medium text-slate-600">
                        Finding matching vehicles...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {unlinkError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        {unlinkError}
                      </div>
                    )}

                    <section>
                      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Linked Vehicles
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Vehicles currently linked to this customer demand.
                          </p>
                        </div>

                        <span className="text-xs font-medium text-slate-500">
                          {selectedDemand?.matched_vehicle_count ?? 0} linked
                        </span>
                      </div>

                      {selectedDemand?.matched_vehicles?.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {selectedDemand.matched_vehicles.map((vehicle) => (
                            <div
                              key={vehicle.id}
                              className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-mono text-sm font-bold text-amber-600">
                                    {vehicle.stock_id || "No Stock ID"}
                                  </p>

                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {[
                                      vehicle.year,
                                      vehicle.make,
                                      vehicle.model,
                                      vehicle.variant,
                                    ]
                                      .filter(Boolean)
                                      .join(" ") || "—"}
                                  </p>

                                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <p className="text-slate-400">Colour</p>
                                      <p className="mt-0.5 font-medium text-slate-700">
                                        {vehicle.colour || "—"}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-slate-400">
                                        Asking Price
                                      </p>
                                      <p className="mt-0.5 font-medium text-slate-700">
                                        {formatBudget(vehicle.asking_price)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {selectedDemand?.status !== "closed" && (
                                  <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    loading={unlinkingVehicleId === vehicle.id}
                                    disabled={unlinkingVehicleId !== null}
                                    onClick={() => handleUnlinkVehicle(vehicle)}
                                  >
                                    Unlink
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            No vehicles are currently linked.
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Select a matching vehicle below to link it to this
                            demand.
                          </p>
                        </div>
                      )}
                    </section>

                    {selectedDemand?.status !== "closed" && (
                      <section className="border-t border-slate-200 pt-7">
                        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              Available Matching Vehicles
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              Inventory vehicles that satisfy the current demand
                              criteria.
                            </p>
                          </div>
                        </div>

                        {(() => {
                          const linkedVehicleIds = new Set(
                            (selectedDemand?.matched_vehicles || []).map(
                              (vehicle) => vehicle.id,
                            ),
                          );

                          const availableMatches = matches.filter(
                            (vehicle) => !linkedVehicleIds.has(vehicle.id),
                          );

                          if (availableMatches.length === 0) {
                            return (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <p className="text-sm font-medium text-slate-700">
                                  No additional matching vehicles found.
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  All currently matching vehicles may already be
                                  linked.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {availableMatches.map((vehicle) => {
                                const isSelected = selectedVehicleIds.includes(
                                  vehicle.id,
                                );

                                return (
                                  <div
                                    key={vehicle.id}
                                    className={[
                                      "rounded-2xl border bg-white p-4 shadow-sm transition",
                                      isSelected
                                        ? "border-amber-400 ring-2 ring-amber-400/15"
                                        : "border-slate-200",
                                    ].join(" ")}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(event) => {
                                          setSelectedVehicleIds((current) => {
                                            if (event.target.checked) {
                                              return [...current, vehicle.id];
                                            }

                                            return current.filter(
                                              (id) => id !== vehicle.id,
                                            );
                                          });
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                                      />

                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                          <div>
                                            <p className="font-mono text-sm font-bold text-amber-600">
                                              {vehicle.stock_id ||
                                                "No Stock ID"}
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                              {[
                                                vehicle.year,
                                                vehicle.make,
                                                vehicle.model,
                                                vehicle.variant,
                                              ]
                                                .filter(Boolean)
                                                .join(" ") || "—"}
                                            </p>
                                          </div>

                                          <span className="inline-flex w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                                            {vehicle.status || "available"}
                                          </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                          <div>
                                            <p className="text-slate-400">
                                              Colour
                                            </p>

                                            <p className="mt-0.5 font-medium text-slate-700">
                                              {vehicle.colour || "—"}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-slate-400">
                                              Asking Price
                                            </p>

                                            <p className="mt-0.5 font-medium text-slate-700">
                                              {formatBudget(
                                                vehicle.asking_price,
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </section>
                    )}
                  </div>
                )}
              </div>

              {linkError && (
                <div className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:px-6">
                  {linkError}
                </div>
              )}

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                <p className="text-xs text-slate-500">
                  {selectedVehicleIds.length > 0
                    ? `${selectedVehicleIds.length} vehicle${
                        selectedVehicleIds.length === 1 ? "" : "s"
                      } selected`
                    : "Select vehicles to link to this demand."}
                </p>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={linkLoading}
                    onClick={() => {
                      setShowMatchesModal(false);
                      setSelectedDemand(null);
                      setMatches([]);
                      setMatchesError("");
                      setSelectedVehicleIds([]);
                      setLinkError("");
                      setUnlinkError("");
                    }}
                  >
                    Close
                  </Button>

                  {selectedDemand?.status !== "closed" && (
                    <Button
                      type="button"
                      variant="primary"
                      loading={linkLoading}
                      disabled={selectedVehicleIds.length === 0}
                      onClick={handleLinkSelectedVehicles}
                    >
                      Link Selected
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarDemands;
