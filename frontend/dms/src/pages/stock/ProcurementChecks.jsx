import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Pencil, Plus, X } from "lucide-react";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

import {
  createProcurementCheck,
  deleteProcurementCheck,
  getCars,
  getProcurementChecks,
  updateProcurementCheck,
} from "../../api/inventory";

function ProcurementChecks() {
  const { user } = useAuth();
  const [editingCheck, setEditingCheck] = useState(null);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [vehicleSource, setVehicleSource] = useState("inventory");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleResults, setVehicleResults] = useState([]);
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const vehicleSearchRequestRef = useRef(0);
  const [carStockIds, setCarStockIds] = useState({});

  const [manualVehicle, setManualVehicle] = useState({
    chassis_number: "",
    make: "",
    model: "",
  });

  const [inspectionForm, setInspectionForm] = useState({
    range_trim_code: "",
    model_year: "",
    engine: "",
    body_type: "",
    mileage: "",
    colour: "",
    recorded_accidents: "",
    no_accidents: false,
    condition_notes: "",
  });

  async function loadProcurementChecks() {
    setLoading(true);
    setError("");

    try {
      const response = await getProcurementChecks();

      if (Array.isArray(response)) {
        setChecks(response);
      } else {
        setChecks([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load procurement checks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProcurementChecks();
  }, []);

  useEffect(() => {
    const inventoryCarIds = [
      ...new Set(checks.map((check) => check.car).filter(Boolean)),
    ];

    if (inventoryCarIds.length === 0) {
      setCarStockIds({});
      return undefined;
    }

    let cancelled = false;

    async function loadStockIds() {
      try {
        const firstResponse = await getCars({
          page: 1,
          page_size: 100,
        });

        if (cancelled) {
          return;
        }

        const firstPageCars = firstResponse.data || [];
        const pageSize = firstPageCars.length || 100;
        const totalCount = Number(firstResponse.count) || firstPageCars.length;
        const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

        const stockIdMap = new Map();

        function collectCars(cars) {
          cars.forEach((car) => {
            if (car?.id && inventoryCarIds.includes(car.id) && car.stock_id) {
              stockIdMap.set(String(car.id), car.stock_id);
            }
          });
        }

        collectCars(firstPageCars);

        for (
          let page = 2;
          page <= totalPages && stockIdMap.size < inventoryCarIds.length;
          page += 1
        ) {
          const response = await getCars({
            page,
            page_size: pageSize,
          });

          if (cancelled) {
            return;
          }

          collectCars(response.data || []);
        }

        if (!cancelled) {
          setCarStockIds((current) => ({
            ...current,
            ...Object.fromEntries(stockIdMap),
          }));
        }
      } catch (error) {
        console.error("Failed to load inventory stock IDs:", error);

        if (!cancelled) {
          setCarStockIds((current) => ({
            ...current,
          }));
        }
      }
    }

    loadStockIds();

    return () => {
      cancelled = true;
    };
  }, [checks]);

  useEffect(() => {
    const requestId = ++vehicleSearchRequestRef.current;

    if (vehicleSource !== "inventory") {
      setVehicleResults([]);
      setVehicleSearchLoading(false);
      return undefined;
    }

    const searchTerm = vehicleSearch.trim();

    if (!searchTerm) {
      setVehicleResults([]);
      setVehicleSearchLoading(false);
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

        if (requestId !== vehicleSearchRequestRef.current) {
          return;
        }

        const existingCarIds = new Set(
          checks.filter((check) => check.car).map((check) => String(check.car)),
        );

        const results = (response.data || []).filter(
          (vehicle) => !existingCarIds.has(String(vehicle.id)),
        );

        setVehicleResults(results);
      } catch (error) {
        if (requestId !== vehicleSearchRequestRef.current) {
          return;
        }

        console.error("Vehicle search failed:", error);
        setVehicleResults([]);
      } finally {
        if (requestId === vehicleSearchRequestRef.current) {
          setVehicleSearchLoading(false);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [vehicleSearch, vehicleSource, checks]);

  const columns = [
    {
      key: "vehicle",
      label: "Stock ID",
      render: (check) => {
        if (!check.car) {
          return "Non-inventory";
        }

        return carStockIds[check.car] || "—";
      },
    },
    {
      key: "chassis_number",
      label: "Chassis",
      render: (check) => check.chassis_number || "—",
    },
    {
      key: "vehicle_details",
      label: "Vehicle",
      render: (check) => (
        <div>
          <p className="font-medium text-slate-800">
            {[check.make, check.model].filter(Boolean).join(" ") || "—"}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {check.range_trim_code || "No trim"}{" "}
            {check.model_year ? `• ${check.model_year}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "mileage",
      label: "Mileage",
      render: (check) =>
        check.mileage !== null && check.mileage !== undefined
          ? `${check.mileage.toLocaleString()} km`
          : "—",
    },
    {
      key: "accidents",
      label: "Accidents",
      render: (check) => {
        if (check.no_accidents) {
          return (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              No Accidents
            </span>
          );
        }

        if (
          check.recorded_accidents !== null &&
          check.recorded_accidents !== undefined
        ) {
          return (
            <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
              {check.recorded_accidents}{" "}
              {check.recorded_accidents === 1 ? "Accident" : "Accidents"}
            </span>
          );
        }

        return "Not recorded";
      },
    },
    {
      key: "condition",
      label: "Condition",
      render: (check) =>
        check.condition_notes ? (
          <span
            className="block max-w-[220px] truncate text-slate-600"
            title={check.condition_notes}
          >
            {check.condition_notes}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "created_at",
      label: "Checked",
      render: (check) =>
        check.created_at
          ? new Date(check.created_at).toLocaleDateString()
          : "—",
    },
    {
      key: "actions",
      label: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (check) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={Pencil}
            onClick={() => openEditModal(check)}
          >
            Edit
          </Button>

          {user?.role === "MASTER" && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleDeleteProcurementCheck(check)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  function openEditModal(check) {
    setCreateError("");
    setShowCreateModal(true);
    setEditingCheck(check);

    if (check.car) {
      setVehicleSource("inventory");

      setSelectedVehicle({
        id: check.car,
        stock_id: carStockIds[check.car] || "Loading...",
        year: check.model_year,
        make: check.make,
        model: check.model,
        variant: check.range_trim_code,
        mileage: check.mileage,
      });

      setVehicleSearch("");
      setVehicleResults([]);
    } else {
      setVehicleSource("manual");
      setSelectedVehicle(null);
      setVehicleSearch("");
      setVehicleResults([]);

      setManualVehicle({
        chassis_number: check.chassis_number || "",
        make: check.make || "",
        model: check.model || "",
      });
    }

    setInspectionForm({
      range_trim_code: check.range_trim_code || "",
      model_year:
        check.model_year !== null && check.model_year !== undefined
          ? String(check.model_year)
          : "",
      engine: check.engine || "",
      body_type: check.body_type || "",
      mileage:
        check.mileage !== null && check.mileage !== undefined
          ? String(check.mileage)
          : "",
      colour: check.colour || "",
      recorded_accidents:
        check.recorded_accidents !== null &&
        check.recorded_accidents !== undefined
          ? String(check.recorded_accidents)
          : "",
      no_accidents: Boolean(check.no_accidents),
      condition_notes: check.condition_notes || "",
    });
  }

  function resetCreateForm() {
    vehicleSearchRequestRef.current += 1;

    setEditingCheck(null);
    setVehicleSource("inventory");
    setVehicleSearch("");
    setVehicleResults([]);
    setVehicleSearchLoading(false);
    setSelectedVehicle(null);

    setManualVehicle({
      chassis_number: "",
      make: "",
      model: "",
    });

    setInspectionForm({
      range_trim_code: "",
      model_year: "",
      engine: "",
      body_type: "",
      mileage: "",
      colour: "",
      recorded_accidents: "",
      no_accidents: false,
      condition_notes: "",
    });

    setCreateError("");
  }

  function closeCreateModal() {
    if (createLoading) {
      return;
    }

    resetCreateForm();
    setShowCreateModal(false);
  }

  async function handleCreateProcurementCheck() {
    setCreateLoading(true);
    setCreateError("");

    try {
      if (vehicleSource === "inventory" && !selectedVehicle?.id) {
        throw new Error("Please select an inventory vehicle.");
      }

      if (
        vehicleSource === "manual" &&
        !manualVehicle.chassis_number.trim() &&
        !(manualVehicle.make.trim() && manualVehicle.model.trim())
      ) {
        throw new Error("Provide a chassis number or both make and model.");
      }

      const payload = {
        no_accidents: inspectionForm.no_accidents,
      };

      if (vehicleSource === "inventory") {
        payload.car = selectedVehicle.id;
      } else {
        if (manualVehicle.chassis_number.trim()) {
          payload.chassis_number = manualVehicle.chassis_number.trim();
        }

        if (manualVehicle.make.trim()) {
          payload.make = manualVehicle.make.trim();
        }

        if (manualVehicle.model.trim()) {
          payload.model = manualVehicle.model.trim();
        }

        if (inspectionForm.range_trim_code.trim()) {
          payload.range_trim_code = inspectionForm.range_trim_code.trim();
        }

        if (inspectionForm.model_year !== "") {
          payload.model_year = Number(inspectionForm.model_year);
        }

        if (inspectionForm.engine.trim()) {
          payload.engine = inspectionForm.engine.trim();
        }

        if (inspectionForm.body_type) {
          payload.body_type = inspectionForm.body_type;
        }

        if (inspectionForm.mileage !== "") {
          payload.mileage = Number(inspectionForm.mileage);
        }

        if (inspectionForm.colour.trim()) {
          payload.colour = inspectionForm.colour.trim();
        }
      }

      if (inspectionForm.recorded_accidents !== "") {
        payload.recorded_accidents = Number(inspectionForm.recorded_accidents);
      }

      if (inspectionForm.condition_notes.trim()) {
        payload.condition_notes = inspectionForm.condition_notes.trim();
      }

      await createProcurementCheck(payload);

      await loadProcurementChecks();

      resetCreateForm();
      setShowCreateModal(false);
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
          fieldErrors || error.message || "Failed to create procurement check.",
        );
      } else {
        setCreateError(error.message || "Failed to create procurement check.");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleUpdateProcurementCheck() {
    if (!editingCheck?.id) {
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    try {
      const payload = {
        no_accidents: inspectionForm.no_accidents,
      };

      if (editingCheck.car) {
        payload.car = editingCheck.car;
      } else {
        if (manualVehicle.chassis_number.trim()) {
          payload.chassis_number = manualVehicle.chassis_number.trim();
        }

        if (manualVehicle.make.trim()) {
          payload.make = manualVehicle.make.trim();
        }

        if (manualVehicle.model.trim()) {
          payload.model = manualVehicle.model.trim();
        }

        if (inspectionForm.range_trim_code.trim()) {
          payload.range_trim_code = inspectionForm.range_trim_code.trim();
        }

        if (inspectionForm.model_year !== "") {
          payload.model_year = Number(inspectionForm.model_year);
        }

        if (inspectionForm.engine.trim()) {
          payload.engine = inspectionForm.engine.trim();
        }

        if (inspectionForm.body_type) {
          payload.body_type = inspectionForm.body_type;
        }

        if (inspectionForm.mileage !== "") {
          payload.mileage = Number(inspectionForm.mileage);
        }

        if (inspectionForm.colour.trim()) {
          payload.colour = inspectionForm.colour.trim();
        }
      }

      if (inspectionForm.recorded_accidents !== "") {
        payload.recorded_accidents = Number(inspectionForm.recorded_accidents);
      } else {
        payload.recorded_accidents = null;
      }

      payload.condition_notes = inspectionForm.condition_notes.trim();

      await updateProcurementCheck(editingCheck.id, payload);

      await loadProcurementChecks();
      resetCreateForm();
      setShowCreateModal(false);
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
          fieldErrors || error.message || "Failed to update procurement check.",
        );
      } else {
        setCreateError(error.message || "Failed to update procurement check.");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteProcurementCheck(check) {
    if (!check?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this procurement check?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProcurementCheck(check.id);

      await loadProcurementChecks();
    } catch (error) {
      setError(error.message || "Failed to delete procurement check.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
            Inventory
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Procurement Checks
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review vehicle procurement inspection records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="text-xs font-medium text-slate-500">
                {checks.length} checks
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              New Procurement Check
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

            <p className="text-sm font-medium text-slate-600">
              Loading procurement checks...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait while records are loaded.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={checks}
          getRowKey={(check) => check.id}
          emptyMessage="No procurement checks have been recorded yet."
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-2 py-2 backdrop-blur-[2px] sm:px-4 sm:py-6">
          <div className="mx-auto flex min-h-full w-full items-center justify-center">
            <div className="flex max-h-[calc(100vh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl">
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingCheck
                      ? "Edit Procurement Check"
                      : "New Procurement Check"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {editingCheck
                      ? "Review and edit the procurement inspection record."
                      : "Create a new vehicle procurement inspection record."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
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
                      Vehicle Source
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Select an existing inventory vehicle or enter a
                      non-inventory vehicle.
                    </p>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="procurement_vehicle_source"
                        value="inventory"
                        checked={vehicleSource === "inventory"}
                        onChange={() => {
                          setVehicleSource("inventory");
                          setSelectedVehicle(null);
                          setVehicleSearch("");
                          setVehicleResults([]);
                          setManualVehicle({
                            chassis_number: "",
                            make: "",
                            model: "",
                          });
                        }}
                      />
                      Inventory Vehicle
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="procurement_vehicle_source"
                        value="manual"
                        checked={vehicleSource === "manual"}
                        onChange={() => {
                          setVehicleSource("manual");
                          setSelectedVehicle(null);
                          setVehicleSearch("");
                          setVehicleResults([]);
                        }}
                      />
                      Non-inventory Vehicle
                    </label>
                  </div>

                  {vehicleSource === "inventory" && (
                    <div>
                      <label
                        htmlFor="procurement_vehicle_search"
                        className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                      >
                        Search Inventory Vehicle
                      </label>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          id="procurement_vehicle_search"
                          type="text"
                          value={vehicleSearch}
                          onChange={(event) =>
                            setVehicleSearch(event.target.value)
                          }
                          placeholder="Search by stock ID, make, model, chassis, engine..."
                          className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                        />

                        <Button
                          type="button"
                          variant="secondary"
                          disabled={!vehicleSearch && !selectedVehicle}
                          onClick={() => {
                            vehicleSearchRequestRef.current += 1;
                            setVehicleSearch("");
                            setVehicleResults([]);
                            setVehicleSearchLoading(false);
                            setSelectedVehicle(null);
                          }}
                        >
                          Clear
                        </Button>
                      </div>

                      {vehicleSearchLoading && (
                        <p className="mt-2 text-xs text-slate-500">
                          Searching vehicles...
                        </p>
                      )}

                      {vehicleResults.length > 0 && (
                        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                          {vehicleResults.map((vehicle) => (
                            <button
                              key={vehicle.id}
                              type="button"
                              onClick={() => {
                                setSelectedVehicle(vehicle);
                                setVehicleSearch("");
                                setVehicleResults([]);
                              }}
                              className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                            >
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-mono text-sm font-bold text-amber-600">
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
                                </div>

                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                    {vehicle.mileage ?? "—"} km
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedVehicle && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                                Selected Inventory Vehicle
                              </p>

                              <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                                {selectedVehicle.stock_id || "No Stock ID"}
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                {[
                                  selectedVehicle.year,
                                  selectedVehicle.make,
                                  selectedVehicle.model,
                                  selectedVehicle.variant,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                vehicleSearchRequestRef.current += 1;
                                setSelectedVehicle(null);
                                setVehicleSearch("");
                                setVehicleResults([]);
                                setVehicleSearchLoading(false);
                              }}
                            >
                              Clear Selection
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {vehicleSource === "manual" && (
                    <div>
                      <div className="mb-5">
                        <h3 className="text-sm font-bold tracking-tight text-slate-900">
                          Vehicle Identification
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Provide a chassis number or both make and model.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <Input
                          id="procurement_chassis_number"
                          label="Chassis Number"
                          value={manualVehicle.chassis_number}
                          onChange={(event) =>
                            setManualVehicle((current) => ({
                              ...current,
                              chassis_number: event.target.value,
                            }))
                          }
                          placeholder="Enter chassis number"
                        />

                        <Input
                          id="procurement_make"
                          label="Make"
                          value={manualVehicle.make}
                          onChange={(event) =>
                            setManualVehicle((current) => ({
                              ...current,
                              make: event.target.value,
                            }))
                          }
                          placeholder="e.g. BMW"
                        />

                        <Input
                          id="procurement_model"
                          label="Model"
                          value={manualVehicle.model}
                          onChange={(event) =>
                            setManualVehicle((current) => ({
                              ...current,
                              model: event.target.value,
                            }))
                          }
                          placeholder="e.g. X5"
                        />
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        The backend requires either a chassis number or both
                        make and model.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <div className="mb-5">
                    <h3 className="text-sm font-bold tracking-tight text-slate-900">
                      Procurement Inspection
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Record the vehicle inspection information.
                    </p>
                  </div>

                  {vehicleSource === "inventory" ? (
                    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-medium text-blue-900">
                        Inventory vehicle details
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        Vehicle specifications such as chassis number, make,
                        model, trim, year, engine, body type, mileage, and
                        colour will be populated from the selected inventory
                        vehicle by the backend.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                          Vehicle Details
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <Input
                          id="procurement_range_trim_code"
                          label="Range / Trim Code"
                          value={inspectionForm.range_trim_code}
                          onChange={(event) =>
                            setInspectionForm((current) => ({
                              ...current,
                              range_trim_code: event.target.value,
                            }))
                          }
                          placeholder="Enter range or trim code"
                        />

                        <Input
                          id="procurement_model_year"
                          label="Model Year"
                          type="number"
                          min="0"
                          value={inspectionForm.model_year}
                          onChange={(event) =>
                            setInspectionForm((current) => ({
                              ...current,
                              model_year: event.target.value,
                            }))
                          }
                          placeholder="e.g. 2024"
                        />

                        <Input
                          id="procurement_engine"
                          label="Engine"
                          value={inspectionForm.engine}
                          onChange={(event) =>
                            setInspectionForm((current) => ({
                              ...current,
                              engine: event.target.value,
                            }))
                          }
                          placeholder="Enter engine information"
                        />

                        <Select
                          id="procurement_body_type"
                          label="Body Type"
                          value={inspectionForm.body_type}
                          onChange={(event) =>
                            setInspectionForm((current) => ({
                              ...current,
                              body_type: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select body type</option>
                          <option value="sedan">Sedan</option>
                          <option value="suv">SUV</option>
                          <option value="coupe">Coupe</option>
                          <option value="hatchback">Hatchback</option>
                          <option value="pickup">Pickup</option>
                          <option value="van">Van</option>
                          <option value="other">Other</option>
                        </Select>

                        <Input
                          id="procurement_mileage"
                          label="Mileage"
                          type="number"
                          min="0"
                          value={inspectionForm.mileage}
                          onChange={(event) =>
                            setInspectionForm((current) => ({
                              ...current,
                              mileage: event.target.value,
                            }))
                          }
                          placeholder="Enter mileage"
                        />

                        <Input
                          id="procurement_colour"
                          label="Colour"
                          value={inspectionForm.colour}
                          onChange={(event) =>
                            setInspectionForm((current) => ({
                              ...current,
                              colour: event.target.value,
                            }))
                          }
                          placeholder="Enter colour"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                        Accident Information
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        id="procurement_recorded_accidents"
                        label="Recorded Accidents"
                        type="number"
                        min="0"
                        disabled={inspectionForm.no_accidents}
                        value={inspectionForm.recorded_accidents}
                        onChange={(event) => {
                          const value = event.target.value;

                          setInspectionForm((current) => ({
                            ...current,
                            recorded_accidents: value,
                            no_accidents:
                              value !== "" ? false : current.no_accidents,
                          }));
                        }}
                        placeholder="Enter accident count"
                        helper={
                          inspectionForm.no_accidents
                            ? "Disabled because No Accidents is selected."
                            : "Enter the recorded accident count if applicable."
                        }
                      />

                      <label
                        className={[
                          "flex min-h-10 items-center gap-3 rounded-xl border px-3 py-3",
                          "text-sm text-slate-700 transition-colors",
                          inspectionForm.no_accidents
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200 bg-white",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={inspectionForm.no_accidents}
                          onChange={(event) => {
                            const checked = event.target.checked;

                            setInspectionForm((current) => ({
                              ...current,
                              no_accidents: checked,
                              recorded_accidents: checked
                                ? ""
                                : current.recorded_accidents,
                            }));
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                        />

                        <div>
                          <span className="font-medium">No Accidents</span>

                          <p
                            className={[
                              "mt-0.5 text-xs",
                              inspectionForm.no_accidents
                                ? "text-emerald-700"
                                : "text-slate-400",
                            ].join(" ")}
                          >
                            {inspectionForm.no_accidents
                              ? "Selected — no recorded accidents."
                              : "Not selected."}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="procurement_condition_notes"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Condition Notes
                    </label>

                    <textarea
                      id="procurement_condition_notes"
                      rows={4}
                      value={inspectionForm.condition_notes}
                      onChange={(event) =>
                        setInspectionForm((current) => ({
                          ...current,
                          condition_notes: event.target.value,
                        }))
                      }
                      placeholder="Enter inspection observations and condition notes..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 mt-6 flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={createLoading}
                    onClick={closeCreateModal}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    loading={createLoading}
                    onClick={
                      editingCheck
                        ? handleUpdateProcurementCheck
                        : handleCreateProcurementCheck
                    }
                  >
                    {editingCheck ? "Save Changes" : "Create Procurement Check"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcurementChecks;
