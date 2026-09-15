import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getCar,
  deleteImage,
  reorderImages,
  bulkDeleteImages,
  setCoverImage,
} from "../../api/inventory";
import ExpenseList from "./components/ExpenseList";
import ExpenseForm from "./components/ExpenseForm";
import { createExpense, updateExpense, deleteExpense } from "../../api/expense";

function CarDetails() {
  const { user } = useAuth();
  const { id } = useParams();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedImageId, setDraggedImageId] = useState(null);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [brokenImageIds, setBrokenImageIds] = useState([]);

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
  }, [id]);

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
        {" "}
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
                  href={`${import.meta.env.VITE_URL}${car.possession_certificate}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 underline-offset-2 hover:text-amber-700 hover:underline "
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

      <h2 className="text-lg font-bold tracking-tight text-slate-900">
        Vehicle Images
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Manage vehicle photos, cover image, ordering, and selection.
      </p>

      {car.images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No images uploaded.
        </p>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-800">Gallery</h3>

          {selectedImageIds.length > 0 && (
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
                draggable
                onDragStart={() => handleDragStart(image.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(image.id)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                style={{ cursor: "grab" }}
              >
                <input
                  type="checkbox"
                  checked={selectedImageIds.includes(image.id)}
                  onChange={() => handleImageSelection(image.id)}
                  className="mb-2 h-4 w-4"
                />

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
                    src={`${import.meta.env.VITE_URL}${image.image}`}
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

                {!image.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCoverImage(image.id)}
                    className="mt-2 mr-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Set as Cover
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteImage(image.id)}
                  className="mt-2 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

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
