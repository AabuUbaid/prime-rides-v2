import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  getCar,
  getVehicleDocuments,
  uploadVehicleDocument,
  deleteVehicleDocument,
  archiveVehicleDocument,
  downloadVehicleDocument,
  updateCar,
  deleteImage,
  reorderImages,
  bulkDeleteImages,
  setCoverImage,
} from "../../api/inventory";
import { resolveBackendUrl } from "../../api/url";
import ExpenseList from "./components/ExpenseList";
import ExpenseForm from "./components/ExpenseForm";
import { createExpense, updateExpense, deleteExpense } from "../../api/expense";

import { getApiErrorMessage } from "../../utils/errorMessage";

function CarDetails() {
  const { user } = useAuth();
  const { id } = useParams();

  const canManageVehicle = user?.role === "MASTER" || user?.role === "ADMIN";

  const isSalesStaff = user?.role === "SALES_STAFF";

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicleDocuments, setVehicleDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentType, setDocumentType] = useState("POSSESSION");
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState("");
  const [documentDeletingId, setDocumentDeletingId] = useState(null);
  const [documentDownloadingId, setDocumentDownloadingId] = useState(null);
  const [draggedImageId, setDraggedImageId] = useState(null);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [brokenImageIds, setBrokenImageIds] = useState([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [imagesUploading, setImagesUploading] = useState(false);

  async function loadVehicleDocuments() {
    try {
      setDocumentsLoading(true);

      const response = await getVehicleDocuments(id);

      setVehicleDocuments(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("LOAD VEHICLE DOCUMENTS FAILED:", error);
      setVehicleDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleVehicleDocumentUpload() {
    setDocumentUploadError("");

    if (!selectedDocumentFile) {
      setDocumentUploadError("Please select a document file.");
      return;
    }

    if (!documentType) {
      setDocumentUploadError("Please select a document type.");
      return;
    }

    setDocumentUploading(true);

    try {
      const uploadedDocument = await uploadVehicleDocument(
        id,
        documentType,
        selectedDocumentFile,
      );

      const carResponse = await getCar(id);

      setCar(carResponse.data);

      setSelectedDocumentFile(null);
      setDocumentType("POSSESSION");

      await loadVehicleDocuments();

      toast.success(
        documentType === "POSSESSION"
          ? "Possession certificate uploaded successfully."
          : "Vehicle document uploaded successfully.",
      );

      return uploadedDocument;
    } catch (error) {
      console.error("UPLOAD VEHICLE DOCUMENT FAILED:", error);

      let message = "Unable to upload vehicle document.";

      if (error?.cause && typeof error.cause === "object") {
        const firstFieldError = Object.values(error.cause)[0];

        if (Array.isArray(firstFieldError) && firstFieldError.length > 0) {
          message = firstFieldError[0];
        } else if (typeof firstFieldError === "string") {
          message = firstFieldError;
        }
      }

      setDocumentUploadError(
        message || error?.message || "Unable to upload vehicle document.",
      );
    } finally {
      setDocumentUploading(false);
    }
  }

  function canDeleteVehicleDocument(document) {
    if (user?.role === "MASTER") {
      return true;
    }

    if (document.is_archived) {
      return false;
    }

    if (
      !document.uploaded_by ||
      !user?.id ||
      String(document.uploaded_by) !== String(user.id)
    ) {
      return false;
    }

    return true;
  }

  async function handleUploadImages() {
    if (selectedImageFiles.length === 0 || imagesUploading) {
      return;
    }

    try {
      setImagesUploading(true);

      await updateCar(id, {
        images: selectedImageFiles,
      });

      const response = await getCar(id);
      setCar(response.data);

      setSelectedImageFiles([]);

      toast.success("Vehicle images uploaded successfully.");
    } catch (error) {
      console.error("UPLOAD VEHICLE IMAGES FAILED:", error);

      toast.error(
        getApiErrorMessage(error, "Unable to upload vehicle images."),
      );
    } finally {
      setImagesUploading(false);
    }
  }

  useEffect(() => {
    async function loadCar() {
      try {
        const response = await getCar(id);

        setCar(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    setBrokenImageIds([]);

    loadCar();
    if (!isSalesStaff) {
      loadVehicleDocuments();
    }
  }, [id, isSalesStaff]);

  const handleDeleteImage = async (imageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this image?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteImage(imageId);

      const response = await getCar(id);

      setCar(response.data);
    } catch (error) {
      console.error("DELETE IMAGE FAILED:", error);
    }
  };

  const handleSetCoverImage = async (imageId) => {
    try {
      await setCoverImage(imageId);

      const response = await getCar(id);

      setCar(response.data);
    } catch (error) {
      console.error("SET COVER IMAGE FAILED:", error);
    }
  };

  const handleUpdateExpense = async (expenseId, data) => {
    try {
      await updateExpense(expenseId, data);

      const response = await getCar(id);

      setCar(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) {
      return;
    }

    try {
      await deleteExpense(expenseId);

      const response = await getCar(id);

      setCar(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddExpense = async (expense) => {
    try {
      await createExpense(car.id, expense);

      const response = await getCar(id);

      setCar(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragStart = (imageId) => {
    setDraggedImageId(imageId);
  };

  const handleDrop = async (targetImageId) => {
    if (!draggedImageId || draggedImageId === targetImageId) {
      return;
    }

    const currentImages = [...car.images];

    const draggedIndex = currentImages.findIndex(
      (image) => image.id === draggedImageId,
    );

    const targetIndex = currentImages.findIndex(
      (image) => image.id === targetImageId,
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const reorderedImages = [...currentImages];

    const [draggedImage] = reorderedImages.splice(draggedIndex, 1);

    reorderedImages.splice(targetIndex, 0, draggedImage);

    const imageOrder = reorderedImages.map((image) => image.id);

    try {
      await reorderImages(id, imageOrder);

      const response = await getCar(id);

      setCar(response.data);
    } catch (error) {
      console.error("REORDER IMAGES FAILED:", error);
    } finally {
      setDraggedImageId(null);
    }
  };

  const handleImageSelection = (imageId) => {
    setSelectedImageIds((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      }

      return [...prev, imageId];
    });
  };

  const handleBulkDeleteImages = async () => {
    if (selectedImageIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedImageIds.length} selected image(s)?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await bulkDeleteImages(selectedImageIds);

      const response = await getCar(id);

      setCar(response.data);

      setSelectedImageIds([]);
    } catch (error) {
      console.error("BULK DELETE IMAGES FAILED:", error);
    }
  };

  async function handleDeleteVehicleDocument(document) {
    if (
      !window.confirm(
        `Delete "${document.original_filename || "this document"}"?`,
      )
    ) {
      return;
    }

    setDocumentDeletingId(document.id);

    try {
      await deleteVehicleDocument(document.id);

      toast.success("Vehicle document deleted successfully.");

      await loadVehicleDocuments();
    } catch (error) {
      console.error("DELETE VEHICLE DOCUMENT FAILED:", error);

      toast.error(
        getApiErrorMessage(error, "Unable to delete vehicle document."),
      );
    } finally {
      setDocumentDeletingId(null);
    }
  }

  async function handleArchiveVehicleDocument(document) {
    if (user?.role !== "MASTER") {
      return;
    }

    if (document.is_archived) {
      return;
    }

    const confirmed = window.confirm(
      `Archive "${document.original_filename || "this document"}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await archiveVehicleDocument(document.id);

      toast.success("Vehicle document archived successfully.");

      await loadVehicleDocuments();

      if (document.document_type === "POSSESSION") {
        const response = await getCar(id);
        setCar(response.data);
      }
    } catch (error) {
      console.error("ARCHIVE VEHICLE DOCUMENT FAILED:", error);

      toast.error(
        getApiErrorMessage(error, "Unable to archive vehicle document."),
      );
    }
  }

  async function handleDownloadVehicleDocument(vehicleDocument) {
    if (!vehicleDocument?.id || documentDownloadingId === vehicleDocument.id) {
      return;
    }

    setDocumentDownloadingId(vehicleDocument.id);

    try {
      const blob = await downloadVehicleDocument(vehicleDocument.id);

      if (!(blob instanceof Blob)) {
        throw new Error("The server did not return a valid document file.");
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = vehicleDocument.original_filename || "vehicle-document";
      anchor.style.display = "none";

      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);

      toast.success("Vehicle document download started.");
    } catch (error) {
      console.error("DOWNLOAD VEHICLE DOCUMENT FAILED:", error);

      toast.error(
        getApiErrorMessage(error, "Unable to download vehicle document."),
      );
    } finally {
      setDocumentDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

          <p className="text-sm font-medium text-slate-600">
            Loading vehicle...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Loading vehicle details and inventory records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
            Inventory
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Vehicle Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Vehicle information, pricing, images, and expenses.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <span className="font-mono text-xs font-semibold text-slate-700">
              {car.stock_id}
            </span>
          </div>
        </div>
      </div>
      <table className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <tbody>
          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Stock ID
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.stock_id}
            </td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Year
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">{car.year}</td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Make
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">{car.make}</td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Model
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.model}
            </td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Variant
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.variant}
            </td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Colour
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.colour}
            </td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Vehicle Type
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.vehicle_type || "-"}
            </td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Status
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.status}
            </td>
          </tr>

          {car.status === "in_service" && (
            <tr className="border-b border-slate-100 last:border-b-0">
              <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Location
              </th>
              <td className="px-4 py-3 font-medium text-slate-800">
                {car.service_location || "-"}
              </td>
            </tr>
          )}

          {user?.role === "MASTER" && (
            <tr className="border-b border-slate-100 last:border-b-0">
              <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Purchase Cost
              </th>
              <td className="px-4 py-3 font-medium text-slate-800">
                {car.purchase_cost ?? "-"}
              </td>
            </tr>
          )}

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Asking Price
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.asking_price ?? "-"}
            </td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Least Selling Price
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.least_selling_price ?? "-"}
            </td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Mileage
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.mileage ?? "-"}
            </td>
          </tr>

          {user?.role === "MASTER" && (
            <tr className="border-b border-slate-100 last:border-b-0">
              <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Actual Mileage
              </th>
              <td className="px-4 py-3 font-medium text-slate-800">
                {car.actual_mileage ?? "-"}
              </td>
            </tr>
          )}

          {user?.role === "MASTER" && (
            <tr className="border-b border-slate-100 last:border-b-0">
              <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Supplier
              </th>
              <td className="px-4 py-3 font-medium text-slate-800">
                {car.supplier || "-"}
              </td>
            </tr>
          )}

          {user?.role === "MASTER" && (
            <tr className="border-b border-slate-100 last:border-b-0">
              <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Source
              </th>
              <td className="px-4 py-3 font-medium text-slate-800">
                {car.source || "-"}
              </td>
            </tr>
          )}

          {user?.role === "MASTER" && car.source === "other" && (
            <tr className="border-b border-slate-100 last:border-b-0">
              <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Source Specify
              </th>
              <td className="px-4 py-3 font-medium text-slate-800">
                {car.source_specify || "-"}
              </td>
            </tr>
          )}

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Chassis Number
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.chassis_number || "-"}
            </td>
          </tr>

          <tr className="border-b border-slate-100 last:border-b-0">
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Engine Number
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.engine_number || "-"}
            </td>
          </tr>

          {user?.role === "MASTER" && (
            <tr className="border-b border-slate-100 last:border-b-0">
              <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Highlight Public
              </th>
              <td className="px-4 py-3 font-medium text-slate-800">
                {car.highlight_public ? "Yes" : "No"}
              </td>
            </tr>
          )}

          <tr>
            <th className="w-1/3 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
              Possession Certificate
            </th>
            <td className="px-4 py-3 font-medium text-slate-800">
              {car.possession_certificate ? (
                <a
                  href={resolveBackendUrl(car.possession_certificate)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 underline-offset-2 hover:text-amber-700 hover:underline"
                >
                  View Certificate
                </a>
              ) : (
                "-"
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {!isSalesStaff && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Vehicle Documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Documents associated with this vehicle.
            </p>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4">
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-end">
                <div>
                  <label
                    htmlFor="vehicle-document-type"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Document Type
                  </label>

                  <select
                    id="vehicle-document-type"
                    value={documentType}
                    onChange={(event) => {
                      setDocumentType(event.target.value);
                      setDocumentUploadError("");
                    }}
                    disabled={documentUploading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/15 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="POSSESSION">Possession</option>
                    <option value="MULKIYA">Mulkiya / Registration Card</option>
                    <option value="RTA_PASSING">RTA Passing</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vehicle-document-file"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Document File
                  </label>

                  <input
                    id="vehicle-document-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    disabled={documentUploading}
                    onChange={(event) => {
                      setSelectedDocumentFile(event.target.files?.[0] || null);
                      setDocumentUploadError("");
                    }}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />

                  {selectedDocumentFile && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Selected: {selectedDocumentFile.name}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVehicleDocumentUpload}
                  disabled={!selectedDocumentFile || documentUploading}
                  className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {documentUploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>

              {documentUploadError && (
                <p className="mt-3 text-sm font-medium text-rose-600">
                  {documentUploadError}
                </p>
              )}

              <p className="mt-3 text-xs text-slate-500">
                Supported files: PDF, JPG and PNG. Maximum size: 10 MB.
              </p>
            </div>
          </div>

          {documentsLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

              <p className="text-sm font-medium text-slate-600">
                Loading vehicle documents...
              </p>
            </div>
          ) : vehicleDocuments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
              No vehicle documents uploaded.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Document Type
                    </th>

                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      File Name
                    </th>

                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Uploaded By
                    </th>

                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Uploaded At
                    </th>

                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {vehicleDocuments.map((document) => (
                    <tr key={document.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {document.document_type_display ||
                          document.document_type ||
                          "-"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {document.original_filename || "-"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {document.uploaded_by_name || "-"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {document.uploaded_at
                          ? new Date(document.uploaded_at).toLocaleString(
                              "en-AE",
                            )
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {document.file_url ? (
                            <button
                              type="button"
                              onClick={() => {
                                window.open(
                                  document.file_url,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              View
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Unavailable
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadVehicleDocument(document)
                            }
                            disabled={documentDownloadingId === document.id}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {documentDownloadingId === document.id
                              ? "Downloading..."
                              : "Download"}
                          </button>

                          {user?.role === "MASTER" && !document.is_archived && (
                            <button
                              type="button"
                              onClick={() =>
                                handleArchiveVehicleDocument(document)
                              }
                              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            >
                              Archive
                            </button>
                          )}

                          {canDeleteVehicleDocument(document) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteVehicleDocument(document)
                              }
                              disabled={documentDeletingId === document.id}
                              className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {documentDeletingId === document.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <h2 className="text-lg font-bold tracking-tight text-slate-900">
        Vehicle Images
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Manage vehicle photos, cover image, ordering, and selection.
      </p>

      {canManageVehicle && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="vehicle-image-upload"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
              >
                Add Vehicle Images
              </label>

              <input
                id="vehicle-image-upload"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={imagesUploading}
                onChange={(event) => {
                  setSelectedImageFiles(Array.from(event.target.files || []));
                }}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
              />

              {selectedImageFiles.length > 0 && (
                <p className="mt-1.5 text-xs text-slate-500">
                  {selectedImageFiles.length} image
                  {selectedImageFiles.length === 1 ? "" : "s"} selected.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleUploadImages}
              disabled={selectedImageFiles.length === 0 || imagesUploading}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {imagesUploading ? "Uploading..." : "Upload Images"}
            </button>
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800">Gallery</h3>

      {canManageVehicle && selectedImageIds.length > 0 && (
        <button
          type="button"
          onClick={handleBulkDeleteImages}
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
        >
          Delete Selected ({selectedImageIds.length})
        </button>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {car.images.map((image) => (
          <div
            key={image.id}
            draggable={canManageVehicle}
            onDragStart={
              canManageVehicle ? () => handleDragStart(image.id) : undefined
            }
            onDragOver={
              canManageVehicle ? (e) => e.preventDefault() : undefined
            }
            onDrop={canManageVehicle ? () => handleDrop(image.id) : undefined}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
            style={{
              cursor: canManageVehicle ? "grab" : "default",
            }}
          >
            {canManageVehicle && (
              <input
                type="checkbox"
                checked={selectedImageIds.includes(image.id)}
                onChange={() => handleImageSelection(image.id)}
                className="mb-2 h-4 w-4"
              />
            )}

            {brokenImageIds.includes(image.id) ? (
              <div
                style={{
                  width: "150px",
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #ddd",
                  backgroundColor: "#f5f5f5",
                  color: "#777",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                Image unavailable
              </div>
            ) : (
              <img
                src={resolveBackendUrl(image.image)}
                alt="Vehicle"
                width="150"
                height="100"
                className="rounded-md"
                style={{
                  objectFit: "cover",
                }}
                onError={() => {
                  setBrokenImageIds((prev) =>
                    prev.includes(image.id) ? prev : [...prev, image.id],
                  );
                }}
              />
            )}

            {image.is_cover && (
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                Cover Image
              </p>
            )}

            {canManageVehicle && !image.is_cover && (
              <button
                type="button"
                onClick={() => handleSetCoverImage(image.id)}
                className="mt-2 mr-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Set as Cover
              </button>
            )}

            {canManageVehicle && (
              <button
                type="button"
                onClick={() => handleDeleteImage(image.id)}
                className="mt-2 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {user?.role === "MASTER" && (
        <>
          <ExpenseForm onAddExpense={handleAddExpense} />

          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Vehicle Expenses
          </h2>

          <ExpenseList
            expenses={car.expenses}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />

          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700">
            Expense Summary
          </h3>

          <p className="text-sm text-slate-600">
            Expense Count: {car.expense_summary?.expense_count ?? 0}
          </p>

          <p className="text-sm text-gray-700">
            Total Expenses: {car.expense_summary?.total_expenses ?? 0}
          </p>

          <p className="font-mono text-base font-bold text-slate-900">
            Net Cost: {car.expense_summary?.net_cost ?? 0}
          </p>
        </>
      )}
    </div>
  );
}

export default CarDetails;
