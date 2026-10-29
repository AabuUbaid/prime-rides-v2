import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  HelpCircle,
  Info,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatusBadge from "../../components/ui/StatusBadge";

import {
  approveProcurementCheck,
  assignProcurementInspector,
  createProcurementCheck,
  deleteProcurementCheck,
  getCars,
  getProcurementCheck,
  getProcurementChecks,
  releaseProcurementCheck,
  submitProcurementFindings,
  updateProcurementCheck,
} from "../../api/inventory";

// 13-Panel Paint Inspection Mapping with stable identifiers & display names
const INSPECTION_PANELS = [
  { id: "hood", label: "Hood / Bonnet", location: "Front" },
  { id: "roof", label: "Roof Panel", location: "Top" },
  { id: "trunk", label: "Trunk / Tailgate", location: "Rear" },
  { id: "frontBumper", label: "Front Bumper", location: "Front" },
  { id: "rearBumper", label: "Rear Bumper", location: "Rear" },
  { id: "frontLeftFender", label: "Front Left Fender", location: "Left Side" },
  { id: "frontRightFender", label: "Front Right Fender", location: "Right Side" },
  { id: "frontLeftDoor", label: "Front Left Door", location: "Left Side" },
  { id: "frontRightDoor", label: "Front Right Door", location: "Right Side" },
  { id: "rearLeftDoor", label: "Rear Left Door", location: "Left Side" },
  { id: "rearRightDoor", label: "Rear Right Door", location: "Right Side" },
  { id: "rearLeftQuarter", label: "Rear Left Quarter Panel", location: "Left Side" },
  { id: "rearRightQuarter", label: "Rear Right Quarter Panel", location: "Right Side" },
];

function getPaintClassification(microns) {
  if (microns === null || microns === undefined || microns === "") {
    return {
      status: "unmeasured",
      label: "Unmeasured",
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      pillClass: "border-slate-300 bg-slate-50 text-slate-600",
    };
  }

  const num = Number(microns);
  if (isNaN(num)) {
    return {
      status: "unmeasured",
      label: "Invalid",
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      pillClass: "border-slate-300 bg-slate-50 text-slate-600",
    };
  }

  if (num < 150) {
    return {
      status: "original",
      label: "Factory Original (<150 µm)",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pillClass: "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold",
    };
  }

  if (num <= 250) {
    return {
      status: "respray",
      label: "Cosmetic Respray (150-250 µm)",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      pillClass: "border-amber-300 bg-amber-50 text-amber-800 font-semibold",
    };
  }

  return {
    status: "filler",
    label: "Body Filler / Heavy (>250 µm)",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    pillClass: "border-purple-300 bg-purple-50 text-purple-800 font-semibold",
  };
}

// 9 Comprehensive Multi-System Checkpoint Categories
const CHECKPOINT_CATEGORIES = [
  {
    id: "body_frame",
    name: "1. Body & Frame Structure",
    icon: ShieldCheck,
    items: [
      "Chassis main rails & crossmembers alignment",
      "A, B, C pillar structural integrity & factory pinch welds",
      "Underbody floor pan, wheel tubs & crumple zones",
      "Radiator core support & firewall seam sealer integrity",
    ],
  },
  {
    id: "engine_drivetrain",
    name: "2. Engine & Drivetrain Performance",
    icon: Gauge,
    items: [
      "Cold start & idle stability",
      "Engine oil quality, viscosity & absence of sludge/metal particles",
      "Transmission gear engagement, shifting smoothness & torque converter",
      "Cooling system pressure, radiator & hose condition",
      "Accessory belts, pulleys, tensioners & alternators",
    ],
  },
  {
    id: "steering_suspension",
    name: "3. Steering, Suspension & Underbody",
    icon: Wrench,
    items: [
      "Steering rack, tie rod ends & boots condition",
      "Shock absorbers, struts & coil springs damping",
      "Suspension control arm bushings & ball joints",
      "CV axle shafts, half-shaft boots & universal joints",
    ],
  },
  {
    id: "braking_system",
    name: "4. Braking System & Hydraulics",
    icon: AlertCircle,
    items: [
      "Front brake pad friction material thickness & rotor condition",
      "Rear brake pad/shoe thickness & drum/rotor wear",
      "ABS hydraulic actuator & wheel speed sensor readiness",
      "Hydraulic brake line hoses & fluid moisture boiling point",
    ],
  },
  {
    id: "tyres_wheels",
    name: "5. Wheels & Tyres Diagnostics",
    icon: Layers,
    items: [
      "Tire tread depth symmetry & wear pattern inspection",
      "Tire DOT manufacture dates & absence of dry rot/cracks",
      "Alloy wheel rim runout & absence of structural cracks or welds",
    ],
  },
  {
    id: "electrical_obd",
    name: "6. Electrical, Battery & Computer OBD-II Diagnostics",
    icon: FileText,
    items: [
      "OBD-II diagnostic trouble code (DTC) scan & emissions readiness monitors",
      "12V battery health, cold cranking amps (CCA) & terminal condition",
      "Alternator charging voltage output under full electrical load",
      "Exterior lighting, headlights, brake lights & turn signals",
    ],
  },
  {
    id: "interior_safety",
    name: "7. Interior Electronics & Safety Systems",
    icon: ShieldAlert,
    items: [
      "SRS Airbag system warning light sequence & seatbelt pretensioners",
      "HVAC air conditioning cooling delta-T temperature differential",
      "Power windows, central locking & side mirrors operation",
      "Infotainment display, instrument cluster & audio system",
    ],
  },
  {
    id: "accident_flood",
    name: "8. Accident, Structural Impact & Flood Submersion Assessment",
    icon: AlertTriangle,
    items: [
      "Pillar & rocker panel seam weld factory consistency",
      "Absence of structural pulling clamp marks on underbody pinch welds",
      "Under-carpet silt, sand, rust or moisture waterline indicators",
      "Fuse box, wiring loom & seat rail rust or submersion residue",
    ],
  },
  {
    id: "road_test",
    name: "9. Road Test & Operational Verification",
    icon: CheckCircle2,
    items: [
      "Straight-line tracking & steering wheel alignment at speed",
      "Powertrain acceleration response under load",
      "High-speed braking stability & absence of pedal pulsation",
      "Noise, vibration, and harshness (NVH) audit over road irregularities",
    ],
  },
];

const WORKFLOW_TABS = [
  { key: "all", label: "All Checks" },
  { key: "awaiting_assignment", label: "Awaiting Assignment" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending_review", label: "Awaiting Review" },
  { key: "approved", label: "Approved" },
  { key: "released", label: "Released" },
];

function ProcurementChecks() {
  const { user } = useAuth();
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [carStockIds, setCarStockIds] = useState({});

  // Filter & Search State
  const [activeWorkflowTab, setActiveWorkflowTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Workbench Modal State
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("vehicle_booking");
  const [isRecordLoading, setIsRecordLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  // Record Data
  const [currentCheckId, setCurrentCheckId] = useState(null);
  const [vehicleSource, setVehicleSource] = useState("inventory");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleResults, setVehicleResults] = useState([]);
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const vehicleSearchRequestRef = useRef(0);

  // Form State
  const [vehicleForm, setVehicleForm] = useState({
    chassis_number: "",
    make: "",
    model: "",
    range_trim_code: "",
    model_year: "",
    engine: "",
    body_type: "",
    mileage: "",
    colour: "",
    marketplace_reference_code: "",
  });

  const [procurementDetails, setProcurementDetails] = useState({
    recorded_accidents: "",
    no_accidents: false,
    condition_notes: "",
  });

  const [assignmentData, setAssignmentData] = useState({
    assigned_inspector: "",
    inspection_date: "",
    inspection_time: "",
    workflow_state: "pending_assignment",
  });

  const [paintData, setPaintData] = useState({});
  const [checkpointsData, setCheckpointsData] = useState({});
  const [tyresData, setTyresData] = useState({
    front_left: { depth_mm: "", dot_code: "", condition: "good" },
    front_right: { depth_mm: "", dot_code: "", condition: "good" },
    rear_left: { depth_mm: "", dot_code: "", condition: "good" },
    rear_right: { depth_mm: "", dot_code: "", condition: "good" },
    spare: { depth_mm: "", dot_code: "", present: true },
  });

  const [accidentFloodData, setAccidentFloodData] = useState({
    structural_damage_observed: "no",
    structural_damage_notes: "",
    flood_submersion_indicators: "no",
    flood_notes: "",
    airbags_deployed_indicated: "no",
    chassis_pulling_clamp_marks: "none_detected",
    assessment_limitations: "Standard visual and electronic non-destructive assessment performed.",
  });

  const [signOffData, setSignOffData] = useState({
    overall_score: "",
    inspector_recommendations: "",
    is_approved_by_master: false,
    approved_at: null,
    is_released_to_customer: false,
    released_at: null,
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

  // Map inventory vehicle stock IDs
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
        const firstResponse = await getCars({ page: 1, page_size: 100 });
        if (cancelled) return;

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
          const response = await getCars({ page, page_size: pageSize });
          if (cancelled) return;
          collectCars(response.data || []);
        }

        if (!cancelled) {
          setCarStockIds(Object.fromEntries(stockIdMap));
        }
      } catch (error) {
        console.error("Failed to load inventory stock IDs:", error);
      }
    }

    loadStockIds();

    return () => {
      cancelled = true;
    };
  }, [checks]);

  // Debounced inventory search for vehicle selection
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

        if (requestId !== vehicleSearchRequestRef.current) return;

        const existingCarIds = new Set(
          checks
            .filter((check) => check.car && (!currentCheckId || check.id !== currentCheckId))
            .map((check) => String(check.car)),
        );

        const results = (response.data || []).filter(
          (vehicle) => !existingCarIds.has(String(vehicle.id)),
        );

        setVehicleResults(results);
      } catch (error) {
        if (requestId !== vehicleSearchRequestRef.current) return;
        console.error("Vehicle search failed:", error);
        setVehicleResults([]);
      } finally {
        if (requestId === vehicleSearchRequestRef.current) {
          setVehicleSearchLoading(false);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [vehicleSearch, vehicleSource, checks, currentCheckId]);

  // Open Workbench Modal (fresh fetch from backend)
  async function openWorkbenchModal(check = null) {
    setActionMessage({ type: "", text: "" });
    setActiveModalTab("vehicle_booking");
    setIsWorkbenchOpen(true);

    if (!check) {
      // New check creation
      setCurrentCheckId(null);
      setVehicleSource("inventory");
      setSelectedVehicle(null);
      setVehicleSearch("");
      setVehicleResults([]);
      setVehicleForm({
        chassis_number: "",
        make: "",
        model: "",
        range_trim_code: "",
        model_year: "",
        engine: "",
        body_type: "",
        mileage: "",
        colour: "",
        marketplace_reference_code: "",
      });
      setProcurementDetails({
        recorded_accidents: "",
        no_accidents: false,
        condition_notes: "",
      });
      setAssignmentData({
        assigned_inspector: "",
        inspection_date: "",
        inspection_time: "",
        workflow_state: "pending_assignment",
      });
      setPaintData({});
      setCheckpointsData({});
      setTyresData({
        front_left: { depth_mm: "", dot_code: "", condition: "good" },
        front_right: { depth_mm: "", dot_code: "", condition: "good" },
        rear_left: { depth_mm: "", dot_code: "", condition: "good" },
        rear_right: { depth_mm: "", dot_code: "", condition: "good" },
        spare: { depth_mm: "", dot_code: "", present: true },
      });
      setAccidentFloodData({
        structural_damage_observed: "no",
        structural_damage_notes: "",
        flood_submersion_indicators: "no",
        flood_notes: "",
        airbags_deployed_indicated: "no",
        chassis_pulling_clamp_marks: "none_detected",
        assessment_limitations: "Standard visual and electronic non-destructive assessment performed.",
      });
      setSignOffData({
        overall_score: "",
        inspector_recommendations: "",
        is_approved_by_master: false,
        approved_at: null,
        is_released_to_customer: false,
        released_at: null,
      });
      return;
    }

    // Editing existing check: fetch fresh authoritative record
    setCurrentCheckId(check.id);
    setIsRecordLoading(true);

    try {
      const fullRecord = await getProcurementCheck(check.id);
      populateFormFromRecord(fullRecord);
    } catch (err) {
      console.error("Failed to fetch full procurement check:", err);
      // Fall back to table row record if network hiccup
      populateFormFromRecord(check);
      setActionMessage({
        type: "warning",
        text: "Could not load full online record. Editing local cache.",
      });
    } finally {
      setIsRecordLoading(false);
    }
  }

  function populateFormFromRecord(rec) {
    if (rec.car) {
      setVehicleSource("inventory");
      setSelectedVehicle({
        id: rec.car,
        stock_id: carStockIds[rec.car] || "Loading...",
        year: rec.model_year,
        make: rec.make,
        model: rec.model,
        variant: rec.range_trim_code,
        mileage: rec.mileage,
      });
    } else {
      setVehicleSource("manual");
      setSelectedVehicle(null);
    }

    setVehicleForm({
      chassis_number: rec.chassis_number || "",
      make: rec.make || "",
      model: rec.model || "",
      range_trim_code: rec.range_trim_code || "",
      model_year: rec.model_year !== null && rec.model_year !== undefined ? String(rec.model_year) : "",
      engine: rec.engine || "",
      body_type: rec.body_type || "",
      mileage: rec.mileage !== null && rec.mileage !== undefined ? String(rec.mileage) : "",
      colour: rec.colour || "",
      marketplace_reference_code: rec.marketplace_reference_code || "",
    });

    setProcurementDetails({
      recorded_accidents:
        rec.recorded_accidents !== null && rec.recorded_accidents !== undefined
          ? String(rec.recorded_accidents)
          : "",
      no_accidents: Boolean(rec.no_accidents),
      condition_notes: rec.condition_notes || "",
    });

    setAssignmentData({
      assigned_inspector: rec.assigned_inspector || "",
      inspection_date: rec.inspection_date || "",
      inspection_time: rec.inspection_time || "",
      workflow_state: rec.workflow_state || "pending_assignment",
    });

    setPaintData(rec.paint_thickness_data || {});
    setCheckpointsData(rec.checkpoints_data || {});
    if (rec.tyres_data && Object.keys(rec.tyres_data).length > 0) {
      setTyresData(rec.tyres_data);
    }
    if (rec.accident_flood_assessment && Object.keys(rec.accident_flood_assessment).length > 0) {
      setAccidentFloodData(rec.accident_flood_assessment);
    }

    setSignOffData({
      overall_score:
        rec.overall_score !== null && rec.overall_score !== undefined
          ? String(rec.overall_score)
          : "",
      inspector_recommendations: rec.inspector_recommendations || "",
      is_approved_by_master: Boolean(rec.is_approved_by_master),
      approved_at: rec.approved_at || null,
      is_released_to_customer: Boolean(rec.is_released_to_customer),
      released_at: rec.released_at || null,
    });
  }

  function closeWorkbenchModal() {
    if (saveLoading) return;
    setIsWorkbenchOpen(false);
  }

  // Save current form state (draft or updates)
  async function handleSaveCurrentRecord() {
    setSaveLoading(true);
    setActionMessage({ type: "", text: "" });

    try {
      if (vehicleSource === "inventory" && !selectedVehicle?.id) {
        throw new Error("Please select an inventory vehicle.");
      }

      if (
        vehicleSource === "manual" &&
        !vehicleForm.chassis_number.trim() &&
        !(vehicleForm.make.trim() && vehicleForm.model.trim())
      ) {
        throw new Error("Provide a chassis number or both make and model.");
      }

      const payload = {
        no_accidents: procurementDetails.no_accidents,
        condition_notes: procurementDetails.condition_notes.trim(),
        assigned_inspector: assignmentData.assigned_inspector.trim(),
        inspection_date: assignmentData.inspection_date || null,
        inspection_time: assignmentData.inspection_time.trim(),
        workflow_state: assignmentData.workflow_state || "pending_assignment",
        marketplace_reference_code: vehicleForm.marketplace_reference_code.trim(),
        paint_thickness_data: paintData,
        checkpoints_data: checkpointsData,
        tyres_data: tyresData,
        accident_flood_assessment: accidentFloodData,
        inspector_recommendations: signOffData.inspector_recommendations.trim(),
      };

      if (procurementDetails.recorded_accidents !== "") {
        payload.recorded_accidents = Number(procurementDetails.recorded_accidents);
      } else {
        payload.recorded_accidents = null;
      }

      if (signOffData.overall_score !== "") {
        payload.overall_score = Number(signOffData.overall_score);
      } else {
        payload.overall_score = null;
      }

      if (vehicleSource === "inventory") {
        payload.car = selectedVehicle.id;
      } else {
        payload.car = null;
        if (vehicleForm.chassis_number.trim()) payload.chassis_number = vehicleForm.chassis_number.trim();
        if (vehicleForm.make.trim()) payload.make = vehicleForm.make.trim();
        if (vehicleForm.model.trim()) payload.model = vehicleForm.model.trim();
        if (vehicleForm.range_trim_code.trim()) payload.range_trim_code = vehicleForm.range_trim_code.trim();
        if (vehicleForm.model_year !== "") payload.model_year = Number(vehicleForm.model_year);
        if (vehicleForm.engine.trim()) payload.engine = vehicleForm.engine.trim();
        if (vehicleForm.body_type) payload.body_type = vehicleForm.body_type;
        if (vehicleForm.mileage !== "") payload.mileage = Number(vehicleForm.mileage);
        if (vehicleForm.colour.trim()) payload.colour = vehicleForm.colour.trim();
      }

      let updatedCheck;
      if (currentCheckId) {
        updatedCheck = await updateProcurementCheck(currentCheckId, payload);
        setActionMessage({
          type: "success",
          text: "Inspection record and workbench findings saved successfully.",
        });
      } else {
        updatedCheck = await createProcurementCheck(payload);
        setCurrentCheckId(updatedCheck.id);
        setActionMessage({
          type: "success",
          text: "New procurement inspection check created successfully.",
        });
      }

      await loadProcurementChecks();
    } catch (err) {
      console.error("Save error:", err);
      setActionMessage({
        type: "error",
        text: err.message || "Failed to save inspection record.",
      });
    } finally {
      setSaveLoading(false);
    }
  }

  // Lifecycle Transitions
  async function handleStateTransition(targetState) {
    if (!currentCheckId) {
      setActionMessage({ type: "error", text: "Please save the record first before transitioning status." });
      return;
    }

    setSaveLoading(true);
    setActionMessage({ type: "", text: "" });

    try {
      if (targetState === "assigned") {
        const inspector = assignmentData.assigned_inspector.trim();
        if (!inspector) {
          throw new Error("Please enter an inspector name in the Inspector tab first.");
        }
        await assignProcurementInspector(currentCheckId, { assigned_inspector: inspector });
        setAssignmentData((cur) => ({ ...cur, workflow_state: "assigned" }));
      } else if (targetState === "in_progress") {
        await updateProcurementCheck(currentCheckId, { workflow_state: "in_progress" });
        setAssignmentData((cur) => ({ ...cur, workflow_state: "in_progress" }));
      } else if (targetState === "pending_review") {
        await submitProcurementFindings(currentCheckId, {
          overall_score: signOffData.overall_score ? Number(signOffData.overall_score) : null,
          paint_thickness_data: paintData,
          checkpoints_data: checkpointsData,
          tyres_data: tyresData,
          accident_flood_assessment: accidentFloodData,
          inspector_recommendations: signOffData.inspector_recommendations,
        });
        setAssignmentData((cur) => ({ ...cur, workflow_state: "pending_review" }));
      } else if (targetState === "approved") {
        await approveProcurementCheck(currentCheckId);
        setAssignmentData((cur) => ({ ...cur, workflow_state: "approved" }));
        setSignOffData((cur) => ({
          ...cur,
          is_approved_by_master: true,
          approved_at: new Date().toISOString(),
        }));
      } else if (targetState === "released") {
        await releaseProcurementCheck(currentCheckId);
        setAssignmentData((cur) => ({ ...cur, workflow_state: "released" }));
        setSignOffData((cur) => ({
          ...cur,
          is_approved_by_master: true,
          is_released_to_customer: true,
          released_at: new Date().toISOString(),
        }));
      }

      await loadProcurementChecks();
      setActionMessage({
        type: "success",
        text: `Inspection state successfully updated to "${targetState.replace(/_/g, " ").toUpperCase()}".`,
      });
    } catch (err) {
      console.error("Transition error:", err);
      setActionMessage({
        type: "error",
        text: err.message || `Failed to transition state to ${targetState}.`,
      });
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDeleteProcurementCheck(check) {
    if (!check?.id) return;
    const confirmed = window.confirm(`Are you sure you want to delete procurement check PC-#${check.id}?`);
    if (!confirmed) return;

    try {
      await deleteProcurementCheck(check.id);
      await loadProcurementChecks();
    } catch (error) {
      setError(error.message || "Failed to delete procurement check.");
    }
  }

  // Filtered checks computation
  const filteredChecks = useMemo(() => {
    return checks.filter((check) => {
      // 1. Workflow tab filter
      const state = (check.workflow_state || "pending_assignment").toLowerCase();
      if (activeWorkflowTab === "awaiting_assignment") {
        if (!["pending_assignment", "pending", "draft", ""].includes(state)) return false;
      } else if (activeWorkflowTab === "in_progress") {
        if (!["assigned", "in_progress"].includes(state)) return false;
      } else if (activeWorkflowTab === "pending_review") {
        if (state !== "pending_review") return false;
      } else if (activeWorkflowTab === "approved") {
        if (state !== "approved") return false;
      } else if (activeWorkflowTab === "released") {
        if (state !== "released") return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const refMatch = `pc-#${check.id}`.toLowerCase().includes(query) || String(check.id).includes(query);
        const bookingMatch = (check.marketplace_reference_code || "").toLowerCase().includes(query);
        const makeModelMatch = `${check.make || ""} ${check.model || ""}`.toLowerCase().includes(query);
        const chassisMatch = (check.chassis_number || "").toLowerCase().includes(query);
        const inspectorMatch = (check.assigned_inspector || "").toLowerCase().includes(query);
        const stockMatch = String(carStockIds[check.car] || "").toLowerCase().includes(query);

        if (!refMatch && !bookingMatch && !makeModelMatch && !chassisMatch && !inspectorMatch && !stockMatch) {
          return false;
        }
      }

      return true;
    });
  }, [checks, activeWorkflowTab, searchQuery, carStockIds]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const counts = {
      all: checks.length,
      awaiting_assignment: 0,
      in_progress: 0,
      pending_review: 0,
      approved: 0,
      released: 0,
    };

    checks.forEach((c) => {
      const st = (c.workflow_state || "pending_assignment").toLowerCase();
      if (["pending_assignment", "pending", "draft", ""].includes(st)) counts.awaiting_assignment++;
      else if (["assigned", "in_progress"].includes(st)) counts.in_progress++;
      else if (st === "pending_review") counts.pending_review++;
      else if (st === "approved") counts.approved++;
      else if (st === "released") counts.released++;
    });

    return counts;
  }, [checks]);

  // Table Columns
  const columns = [
    {
      key: "id",
      label: "Check Ref",
      render: (check) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800">PC-#{check.id}</span>
          {check.marketplace_reference_code && (
            <p className="mt-0.5 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
              {check.marketplace_reference_code}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "vehicle",
      label: "Vehicle",
      render: (check) => (
        <div>
          <p className="font-medium text-slate-900">
            {[check.model_year, check.make, check.model].filter(Boolean).join(" ") || "Unnamed Vehicle"}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{check.range_trim_code || "No trim"}</span>
            <span>•</span>
            {check.car ? (
              <span className="font-medium text-amber-700">Stock #{carStockIds[check.car] || check.car}</span>
            ) : (
              <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] text-slate-600">Non-inventory</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "chassis_number",
      label: "Chassis / VIN",
      render: (check) => (
        <span className="font-mono text-xs text-slate-700">
          {check.chassis_number || <span className="text-slate-400 italic">Not provided</span>}
        </span>
      ),
    },
    {
      key: "inspector",
      label: "Inspector",
      render: (check) => (
        <div>
          <p className="text-xs font-medium text-slate-800">
            {check.assigned_inspector || <span className="text-amber-600 italic">Unassigned</span>}
          </p>
          {check.inspection_date && (
            <p className="text-[11px] text-slate-400">
              {check.inspection_date} {check.inspection_time ? `at ${check.inspection_time}` : ""}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Workflow State",
      render: (check) => {
        const state = check.workflow_state || "pending_assignment";
        return (
          <StatusBadge status={state}>
            {state.replace(/_/g, " ")}
          </StatusBadge>
        );
      },
    },
    {
      key: "score",
      label: "Score",
      render: (check) => {
        if (check.overall_score !== null && check.overall_score !== undefined) {
          const num = Number(check.overall_score);
          const badgeClass =
            num >= 8.5
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : num >= 7.0
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-rose-50 text-rose-700 border-rose-200";

          return (
            <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold ${badgeClass}`}>
              {num.toFixed(1)} / 10
            </span>
          );
        }
        return <span className="text-xs text-slate-400">Not rated</span>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (check) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={ClipboardCheck}
            onClick={() => openWorkbenchModal(check)}
          >
            Workbench
          </Button>

          {user?.role === "MASTER" && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => handleDeleteProcurementCheck(check)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
            Inventory & Technical QA
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Procurement Vehicle Inspections
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Authoritative DMS procurement checks, 13-panel paint density scans, and multi-system QA verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              icon={RefreshCw}
              onClick={loadProcurementChecks}
              loading={loading}
            >
              Refresh
            </Button>

            <Button
              type="button"
              variant="primary"
              icon={Plus}
              onClick={() => openWorkbenchModal(null)}
            >
              New Procurement Check
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Checks</span>
          <p className="mt-1 text-2xl font-black text-slate-900">{tabCounts.all}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Awaiting Assign</span>
          <p className="mt-1 text-2xl font-black text-amber-800">{tabCounts.awaiting_assignment}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">In Progress</span>
          <p className="mt-1 text-2xl font-black text-blue-800">{tabCounts.in_progress}</p>
        </div>
        <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3.5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Awaiting Review</span>
          <p className="mt-1 text-2xl font-black text-purple-800">{tabCounts.pending_review}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Approved</span>
          <p className="mt-1 text-2xl font-black text-emerald-800">{tabCounts.approved}</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Released</span>
          <p className="mt-1 text-2xl font-black text-indigo-800">{tabCounts.released}</p>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
          {WORKFLOW_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveWorkflowTab(tab.key)}
              className={[
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeWorkflowTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              <span>{tab.label}</span>
              <span
                className={[
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  activeWorkflowTab === tab.key ? "bg-slate-100 text-slate-800" : "bg-slate-200/60 text-slate-500",
                ].join(" ")}
              >
                {tabCounts[tab.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, VIN, make, inspector..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
            <p className="text-sm font-medium text-slate-600">Loading procurement checks...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredChecks}
          getRowKey={(check) => check.id}
          emptyMessage={
            searchQuery
              ? "No procurement checks match your search query."
              : "No procurement checks found in this category."
          }
        />
      )}

      {/* FULL TECHNICAL INSPECTION WORKBENCH MODAL */}
      {isWorkbenchOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 px-2 py-2 backdrop-blur-sm sm:px-4 sm:py-6">
          <div className="mx-auto flex min-h-full w-full items-center justify-center">
            <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Modal Top Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                    <ClipboardCheck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {currentCheckId
                          ? `Procurement Inspection Workbench — PC-#${currentCheckId}`
                          : "New Vehicle Procurement Check"}
                      </h2>
                      {assignmentData.workflow_state && (
                        <StatusBadge status={assignmentData.workflow_state}>
                          {assignmentData.workflow_state.replace(/_/g, " ")}
                        </StatusBadge>
                      )}
                      {signOffData.overall_score && (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Rating: {signOffData.overall_score} / 10
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {[vehicleForm.model_year, vehicleForm.make, vehicleForm.model].filter(Boolean).join(" ") ||
                        "New Vehicle Form"}
                      {vehicleForm.chassis_number ? ` • VIN: ${vehicleForm.chassis_number}` : ""}
                      {vehicleForm.marketplace_reference_code ? ` • Booking: ${vehicleForm.marketplace_reference_code}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeWorkbenchModal}
                  disabled={saveLoading}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status & Feedback Banner */}
              {actionMessage.text && (
                <div
                  className={[
                    "flex items-center gap-2 px-6 py-2.5 text-xs font-medium border-b",
                    actionMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : actionMessage.type === "warning"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-rose-50 text-rose-800 border-rose-200",
                  ].join(" ")}
                >
                  {actionMessage.type === "success" ? (
                    <CheckCircle2 size={16} />
                  ) : actionMessage.type === "warning" ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Modal Tabs Navigation */}
              <div className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-6">
                {[
                  { id: "vehicle_booking", label: "Vehicle & Booking", icon: FileText },
                  { id: "declaration", label: "Accidents & Notes", icon: AlertTriangle },
                  { id: "inspector", label: "Inspector & Schedule", icon: UserCheck },
                  { id: "paint_scan", label: "13-Panel Paint Scan", icon: Layers },
                  { id: "checkpoints", label: "9-System Checklist", icon: Wrench },
                  { id: "sign_off", label: "Review & Release", icon: Award },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeModalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveModalTab(tab.id)}
                      className={[
                        "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold transition-colors",
                        isActive
                          ? "border-amber-500 text-amber-600"
                          : "border-transparent text-slate-500 hover:text-slate-800",
                      ].join(" ")}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Body Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isRecordLoading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
                      <p className="text-xs text-slate-500">Loading complete inspection record...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: VEHICLE & BOOKING INFORMATION */}
                    {activeModalTab === "vehicle_booking" && (
                      <div className="space-y-6">
                        {/* Vehicle Source Selector */}
                        <div>
                          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Vehicle Sourcing
                          </label>
                          <div className="grid grid-cols-2 gap-3 max-w-md">
                            <label
                              className={[
                                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-semibold transition",
                                vehicleSource === "inventory"
                                  ? "border-amber-400 bg-amber-50/50 text-amber-900"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              <input
                                type="radio"
                                name="vehicle_source"
                                value="inventory"
                                checked={vehicleSource === "inventory"}
                                onChange={() => setVehicleSource("inventory")}
                                className="text-amber-500 focus:ring-amber-400"
                              />
                              <span>Existing DMS Inventory</span>
                            </label>

                            <label
                              className={[
                                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-semibold transition",
                                vehicleSource === "manual"
                                  ? "border-amber-400 bg-amber-50/50 text-amber-900"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              <input
                                type="radio"
                                name="vehicle_source"
                                value="manual"
                                checked={vehicleSource === "manual"}
                                onChange={() => setVehicleSource("manual")}
                                className="text-amber-500 focus:ring-amber-400"
                              />
                              <span>Non-Inventory Vehicle</span>
                            </label>
                          </div>
                        </div>

                        {/* Inventory Vehicle Lookup */}
                        {vehicleSource === "inventory" && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                              Search Showroom Inventory
                            </label>
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input
                                type="text"
                                value={vehicleSearch}
                                onChange={(e) => setVehicleSearch(e.target.value)}
                                placeholder="Search inventory by Stock ID, Make, Model, or Chassis..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                              />
                            </div>

                            {vehicleSearchLoading && (
                              <p className="mt-2 text-xs text-slate-500">Searching inventory...</p>
                            )}

                            {vehicleResults.length > 0 && (
                              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                {vehicleResults.map((car) => (
                                  <button
                                    key={car.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedVehicle(car);
                                      setVehicleForm({
                                        chassis_number: car.chassis_number || "",
                                        make: car.make || "",
                                        model: car.model || "",
                                        range_trim_code: car.variant || "",
                                        model_year: car.year ? String(car.year) : "",
                                        engine: car.engine_number || "",
                                        body_type: car.vehicle_type || "",
                                        mileage: car.mileage ? String(car.mileage) : "",
                                        colour: car.colour || "",
                                        marketplace_reference_code: vehicleForm.marketplace_reference_code,
                                      });
                                      setVehicleResults([]);
                                      setVehicleSearch("");
                                    }}
                                    className="flex w-full items-center justify-between border-b border-slate-100 p-3 text-left text-xs hover:bg-amber-50/50"
                                  >
                                    <div>
                                      <p className="font-bold text-slate-800">
                                        {[car.year, car.make, car.model].filter(Boolean).join(" ")}
                                      </p>
                                      <p className="text-[11px] text-slate-500">
                                        Stock #{car.stock_id || car.id} • Chassis: {car.chassis_number || "N/A"}
                                      </p>
                                    </div>
                                    <span className="font-semibold text-amber-600">Select</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {selectedVehicle && (
                              <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                                <div>
                                  <span className="font-bold">Linked Inventory Car:</span> Stock #{selectedVehicle.stock_id || selectedVehicle.id} (
                                  {[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(" ")})
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedVehicle(null)}
                                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                >
                                  Change
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vehicle Identity Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <Input
                            id="v_chassis"
                            label="Chassis Number / VIN"
                            value={vehicleForm.chassis_number}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, chassis_number: e.target.value }))}
                            placeholder="e.g. JN1TANT32Z00..."
                          />
                          <Input
                            id="v_make"
                            label="Make *"
                            value={vehicleForm.make}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, make: e.target.value }))}
                            placeholder="e.g. Nissan, Toyota, Porsche"
                          />
                          <Input
                            id="v_model"
                            label="Model *"
                            value={vehicleForm.model}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, model: e.target.value }))}
                            placeholder="e.g. Patrol, Land Cruiser"
                          />
                          <Input
                            id="v_trim"
                            label="Trim / Variant"
                            value={vehicleForm.range_trim_code}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, range_trim_code: e.target.value }))}
                            placeholder="e.g. Platinum V8, GTS, SE"
                          />
                          <Input
                            id="v_year"
                            label="Model Year"
                            type="number"
                            value={vehicleForm.model_year}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, model_year: e.target.value }))}
                            placeholder="e.g. 2023"
                          />
                          <Select
                            id="v_body_type"
                            label="Body Type"
                            value={vehicleForm.body_type}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, body_type: e.target.value }))}
                          >
                            <option value="">Select body type</option>
                            <option value="suv">SUV</option>
                            <option value="sedan">Sedan</option>
                            <option value="coupe">Coupe</option>
                            <option value="hatchback">Hatchback</option>
                            <option value="pickup">Pickup</option>
                            <option value="van">Van</option>
                            <option value="other">Other</option>
                          </Select>
                          <Input
                            id="v_engine"
                            label="Engine Spec"
                            value={vehicleForm.engine}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, engine: e.target.value }))}
                            placeholder="e.g. 5.6L V8 400HP, 4.0L Twin-Turbo"
                          />
                          <Input
                            id="v_mileage"
                            label="Odometer Mileage (km)"
                            type="number"
                            min="0"
                            value={vehicleForm.mileage}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, mileage: e.target.value }))}
                            placeholder="e.g. 42500"
                          />
                          <Input
                            id="v_colour"
                            label="Exterior Colour"
                            value={vehicleForm.colour}
                            onChange={(e) => setVehicleForm((c) => ({ ...c, colour: e.target.value }))}
                            placeholder="e.g. Pearl White, Jet Black"
                          />
                        </div>

                        {/* Marketplace Booking Linkage */}
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                            Marketplace Booking Linkage
                          </h4>
                          <p className="mt-0.5 text-xs text-indigo-700">
                            Connect this procurement check to an authenticated customer booking code.
                          </p>
                          <div className="mt-3 max-w-sm">
                            <Input
                              id="v_booking_ref"
                              label="Marketplace Reference Code"
                              value={vehicleForm.marketplace_reference_code}
                              onChange={(e) =>
                                setVehicleForm((c) => ({ ...c, marketplace_reference_code: e.target.value }))
                              }
                              placeholder="e.g. PR-INS-2026-5172"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: ACCIDENT DECLARATION & NOTES */}
                    {activeModalTab === "declaration" && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                            Seller / Customer Accident Declaration
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Record initial seller declarations. The actual structural assessment is determined via the 13-panel paint and frame inspection.
                          </p>

                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input
                              id="dec_accidents"
                              label="Recorded Previous Accidents"
                              type="number"
                              min="0"
                              value={procurementDetails.recorded_accidents}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProcurementDetails((c) => ({
                                  ...c,
                                  recorded_accidents: val,
                                  no_accidents: val !== "" && Number(val) > 0 ? false : c.no_accidents,
                                }));
                              }}
                              placeholder="Enter count (e.g. 0, 1, 2)"
                              disabled={procurementDetails.no_accidents}
                              helper={
                                procurementDetails.no_accidents
                                  ? "Disabled because No Accidents is declared."
                                  : "Enter confirmed historical claim count."
                              }
                            />

                            <label
                              className={[
                                "flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition",
                                procurementDetails.no_accidents
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                  : "border-slate-200 bg-white text-slate-700",
                              ].join(" ")}
                            >
                              <input
                                type="checkbox"
                                checked={procurementDetails.no_accidents}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setProcurementDetails((c) => ({
                                    ...c,
                                    no_accidents: checked,
                                    recorded_accidents: checked ? "0" : c.recorded_accidents,
                                  }));
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                              />
                              <div>
                                <span className="font-semibold">Declared Zero Previous Accidents</span>
                                <p className="text-xs text-slate-500">
                                  {procurementDetails.no_accidents
                                    ? "Customer/seller declares vehicle has no accident history."
                                    : "Not selected."}
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Condition Notes */}
                        <div>
                          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            General Condition Notes & Staff Remarks
                          </label>
                          <textarea
                            rows={5}
                            value={procurementDetails.condition_notes}
                            onChange={(e) =>
                              setProcurementDetails((c) => ({ ...c, condition_notes: e.target.value }))
                            }
                            placeholder="Enter general vehicle intake notes, customer requests, or handover remarks..."
                            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 3: INSPECTOR ASSIGNMENT & WORKFLOW */}
                    {activeModalTab === "inspector" && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                            Technician Assignment & Scheduling
                          </h4>
                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Input
                              id="ins_name"
                              label="Assigned Certified Inspector"
                              value={assignmentData.assigned_inspector}
                              onChange={(e) =>
                                setAssignmentData((c) => ({ ...c, assigned_inspector: e.target.value }))
                              }
                              placeholder="e.g. Eng. Tariq Al-Mansoor (QC Senior)"
                            />
                            <Input
                              id="ins_date"
                              label="Scheduled Inspection Date"
                              type="date"
                              value={assignmentData.inspection_date}
                              onChange={(e) =>
                                setAssignmentData((c) => ({ ...c, inspection_date: e.target.value }))
                              }
                            />
                            <Input
                              id="ins_time"
                              label="Scheduled Inspection Time"
                              type="time"
                              value={assignmentData.inspection_time}
                              onChange={(e) =>
                                setAssignmentData((c) => ({ ...c, inspection_time: e.target.value }))
                              }
                            />
                          </div>
                        </div>

                        {/* Lifecycle Status & Step Transitions */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                          <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                            Inspection Lifecycle Controls
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Current Status:{" "}
                            <span className="font-bold text-slate-800">
                              {assignmentData.workflow_state.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2.5">
                            {assignmentData.workflow_state === "pending_assignment" && (
                              <Button
                                type="button"
                                variant="primary"
                                icon={UserCheck}
                                loading={saveLoading}
                                onClick={() => handleStateTransition("assigned")}
                              >
                                Confirm Inspector Assignment
                              </Button>
                            )}

                            {assignmentData.workflow_state === "assigned" && (
                              <Button
                                type="button"
                                variant="primary"
                                icon={Wrench}
                                loading={saveLoading}
                                onClick={() => handleStateTransition("in_progress")}
                              >
                                Start Physical Inspection
                              </Button>
                            )}

                            {assignmentData.workflow_state === "in_progress" && (
                              <Button
                                type="button"
                                variant="primary"
                                icon={Send}
                                loading={saveLoading}
                                onClick={() => handleStateTransition("pending_review")}
                              >
                                Submit Findings for QA Review
                              </Button>
                            )}

                            {assignmentData.workflow_state === "pending_review" && user?.role === "MASTER" && (
                              <Button
                                type="button"
                                variant="primary"
                                icon={ShieldCheck}
                                loading={saveLoading}
                                onClick={() => handleStateTransition("approved")}
                              >
                                Authorize Master Approval
                              </Button>
                            )}

                            {assignmentData.workflow_state === "approved" && user?.role === "MASTER" && (
                              <Button
                                type="button"
                                variant="primary"
                                icon={Award}
                                loading={saveLoading}
                                onClick={() => handleStateTransition("released")}
                              >
                                Release Certified Report to Customer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: 13-PANEL PAINT DENSITY SCAN */}
                    {activeModalTab === "paint_scan" && (
                      <div className="space-y-6">
                        {/* Calibration Disclaimer Banner */}
                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
                          <Info className="shrink-0 text-amber-600 mt-0.5" size={18} />
                          <div>
                            <span className="font-bold">Disclosure & Gauge Calibration Policy:</span>
                            <p className="mt-0.5 text-amber-800">
                              Coating thickness measurements indicate surface paint and refinishing depth measured with a calibrated magnetic/eddy-current gauge. Coating thickness alone does not prove or disprove a specific accident, structural collision, or mechanical repair history. All findings reflect visible and measurable conditions at the time of inspection.
                            </p>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <span className="font-bold text-slate-700">Gauge Reference:</span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Factory Original (&lt;150 µm)
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Cosmetic Respray (150 - 250 µm)
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-purple-800 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-purple-500" />
                            Body Filler / Repair (&gt;250 µm)
                          </span>
                        </div>

                        {/* 13 Panels Grid */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {INSPECTION_PANELS.map((panel) => {
                            const val = paintData[panel.id]?.thickness_microns ?? "";
                            const note = paintData[panel.id]?.notes ?? "";
                            const classification = getPaintClassification(val);

                            return (
                              <div
                                key={panel.id}
                                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-slate-300"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">{panel.label}</span>
                                  <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
                                    {panel.location}
                                  </span>
                                </div>

                                <div className="mt-2.5 flex items-center gap-2">
                                  <div className="relative w-28">
                                    <input
                                      type="number"
                                      min="0"
                                      max="3000"
                                      value={val}
                                      onChange={(e) => {
                                        const newThickness = e.target.value;
                                        setPaintData((c) => ({
                                          ...c,
                                          [panel.id]: {
                                            ...(c[panel.id] || {}),
                                            thickness_microns: newThickness,
                                            status: getPaintClassification(newThickness).status,
                                          },
                                        }));
                                      }}
                                      placeholder="0"
                                      className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-right font-mono text-xs font-bold text-slate-800 focus:border-amber-400 focus:outline-none"
                                    />
                                    <span className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                      µm
                                    </span>
                                  </div>

                                  <div
                                    className={`flex-1 rounded-lg border px-2 py-1 text-center text-[10px] truncate ${classification.pillClass}`}
                                  >
                                    {classification.label}
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  value={note}
                                  onChange={(e) => {
                                    const newNote = e.target.value;
                                    setPaintData((c) => ({
                                      ...c,
                                      [panel.id]: {
                                        ...(c[panel.id] || {}),
                                        notes: newNote,
                                      },
                                    }));
                                  }}
                                  placeholder="Observations (e.g. factory clear coat)"
                                  className="mt-2 h-7 w-full rounded-md border border-slate-100 bg-slate-50/60 px-2 text-[11px] text-slate-600 focus:border-amber-400 focus:bg-white focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB 5: 9-SYSTEM CHECKLIST */}
                    {activeModalTab === "checkpoints" && (
                      <div className="space-y-6">
                        {CHECKPOINT_CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          const catData = checkpointsData[cat.id] || {};
                          const catStatus = catData.status || "not_tested";
                          const catNotes = catData.notes || "";

                          return (
                            <div key={cat.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                                    <Icon size={18} />
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                                </div>

                                {/* Status Radio Buttons */}
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                  {[
                                    { val: "pass", label: "Pass", color: "emerald" },
                                    { val: "attention", label: "Attention", color: "amber" },
                                    { val: "fail", label: "Fail", color: "rose" },
                                    { val: "not_tested", label: "Not Tested", color: "slate" },
                                  ].map((opt) => (
                                    <button
                                      key={opt.val}
                                      type="button"
                                      onClick={() => {
                                        setCheckpointsData((c) => ({
                                          ...c,
                                          [cat.id]: {
                                            ...(c[cat.id] || {}),
                                            status: opt.val,
                                          },
                                        }));
                                      }}
                                      className={[
                                        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                                        catStatus === opt.val
                                          ? opt.val === "pass"
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                            : opt.val === "attention"
                                            ? "border-amber-300 bg-amber-50 text-amber-800"
                                            : opt.val === "fail"
                                            ? "border-rose-300 bg-rose-50 text-rose-800"
                                            : "border-slate-300 bg-slate-100 text-slate-800"
                                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                                      ].join(" ")}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Checklist Items Scope */}
                              <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                                {cat.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Category Notes Input */}
                              <div className="mt-3">
                                <input
                                  type="text"
                                  value={catNotes}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCheckpointsData((c) => ({
                                      ...c,
                                      [cat.id]: {
                                        ...(c[cat.id] || {}),
                                        notes: val,
                                      },
                                    }));
                                  }}
                                  placeholder="Inspector observations, fault codes or defect details for this system..."
                                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none transition focus:border-amber-400"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* TAB 6: REVIEW, SCORING & RELEASE SIGN-OFF */}
                    {activeModalTab === "sign_off" && (
                      <div className="space-y-6">
                        {/* Overall Rating Score */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                          <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                            Overall Condition Score Rating
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Certified 10-point scale based on mechanical health, paint readings, and diagnostic status.
                          </p>

                          <div className="mt-4 flex items-center gap-4">
                            <div className="w-36">
                              <Input
                                id="overall_score_input"
                                label="Score (0.0 to 10.0)"
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                value={signOffData.overall_score}
                                onChange={(e) =>
                                  setSignOffData((c) => ({ ...c, overall_score: e.target.value }))
                                }
                                placeholder="8.8"
                              />
                            </div>

                            <div className="pt-4">
                              {signOffData.overall_score ? (
                                <span className="inline-flex items-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                                  {Number(signOffData.overall_score) >= 8.5
                                    ? "Certified Excellent Condition"
                                    : Number(signOffData.overall_score) >= 7.0
                                    ? "Good Mechanical Condition"
                                    : "Attention / Remedial Required"}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">Enter overall calculated score above</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inspector Recommendations */}
                        <div>
                          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Professional Recommendations & Maintenance Outlook
                          </label>
                          <textarea
                            rows={4}
                            value={signOffData.inspector_recommendations}
                            onChange={(e) =>
                              setSignOffData((c) => ({ ...c, inspector_recommendations: e.target.value }))
                            }
                            placeholder="e.g. Vehicle shows factory original paint on all primary structural panels. Brake pads have 80% remaining life. Oil service recommended in 5,000 km."
                            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                          />
                        </div>

                        {/* Master Quality Review Sign-Off */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                          <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                            Master QA Approval & Customer Release Gates
                          </h4>

                          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">1. Master QA Review</span>
                                {signOffData.is_approved_by_master ? (
                                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {signOffData.approved_at
                                  ? `Approved at ${new Date(signOffData.approved_at).toLocaleString()}`
                                  : "Requires authorized Master review before customer release."}
                              </p>
                              {user?.role === "MASTER" && !signOffData.is_approved_by_master && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="mt-3 w-full"
                                  onClick={() => handleStateTransition("approved")}
                                  loading={saveLoading}
                                >
                                  Authorize Master Approval
                                </Button>
                              )}
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">2. Customer Report Release</span>
                                {signOffData.is_released_to_customer ? (
                                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                    Released
                                  </span>
                                ) : (
                                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                    Unreleased
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {signOffData.released_at
                                  ? `Released at ${new Date(signOffData.released_at).toLocaleString()}`
                                  : "Unreleased reports remain strictly gated from customer download."}
                              </p>
                              {user?.role === "MASTER" && !signOffData.is_released_to_customer && (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  className="mt-3 w-full"
                                  onClick={() => handleStateTransition("released")}
                                  loading={saveLoading}
                                >
                                  Release to Customer
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <div className="text-xs text-slate-500">
                  {currentCheckId ? `Check ID: PC-#${currentCheckId}` : "New Record (unsaved)"}
                </div>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="secondary" onClick={closeWorkbenchModal} disabled={saveLoading}>
                    Close
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    loading={saveLoading}
                    onClick={handleSaveCurrentRecord}
                  >
                    Save Findings & Record
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
