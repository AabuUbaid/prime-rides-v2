import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
    return <h2 className="p-6 text-xl font-semibold text-gray-900">Loading...</h2>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Vehicle Details
      </h1>

      <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
        <tbody>
          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Stock ID
            </th>
            <td className="px-4 py-3 text-gray-900">{car.stock_id}</td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Year
            </th>
            <td className="px-4 py-3 text-gray-900">{car.year}</td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Make
            </th>
            <td className="px-4 py-3 text-gray-900">{car.make}</td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Model
            </th>
            <td className="px-4 py-3 text-gray-900">{car.model}</td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Variant
            </th>
            <td className="px-4 py-3 text-gray-900">{car.variant}</td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Colour
            </th>
            <td className="px-4 py-3 text-gray-900">{car.colour}</td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Status
            </th>
            <td className="px-4 py-3 text-gray-900">{car.status}</td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Purchase Cost
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.purchase_cost ?? "-"}
            </td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Asking Price
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.asking_price ?? "-"}
            </td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Least Selling Price
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.least_selling_price ?? "-"}
            </td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Mileage
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.mileage ?? "-"}
            </td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Supplier
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.supplier || "-"}
            </td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Source
            </th>
            <td className="px-4 py-3 text-gray-900">{car.source}</td>
          </tr>

          {car.source === "other" && (
            <tr className="border-b border-gray-100">
              <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
                Source Specify
              </th>
              <td className="px-4 py-3 text-gray-900">
                {car.source_specify || "-"}
              </td>
            </tr>
          )}

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Chassis Number
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.chassis_number || "-"}
            </td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Engine Number
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.engine_number || "-"}
            </td>
          </tr>

          <tr className="border-b border-gray-100">
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Highlight Public
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.highlight_public ? "Yes" : "No"}
            </td>
          </tr>

          <tr>
            <th className="w-1/3 bg-gray-50 px-4 py-3 text-left font-medium text-gray-600">
              Possession Certificate
            </th>
            <td className="px-4 py-3 text-gray-900">
              {car.possession_certificate ? (
                <a
                  href={`${import.meta.env.VITE_URL}${car.possession_certificate}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
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

      <h2 className="text-xl font-semibold text-gray-900">
        Vehicle Images
      </h2>

      {car.images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No images uploaded.
        </p>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-800">
            Gallery
          </h3>

          {selectedImageIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDeleteImages}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete Selected ({selectedImageIds.length})
            </button>
          )}

          <div
            className="mt-4"
            style={{
              display: "flex",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            {car.images.map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(image.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(image.id)}
                className="rounded-lg bg-white shadow-sm transition hover:shadow-md"
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  cursor: "grab",
                }}
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
                        prev.includes(image.id)
                          ? prev
                          : [...prev, image.id],
                      );
                    }}
                  />
                )}

                {image.is_cover && (
                  <p className="mt-2 text-sm font-semibold text-green-700">
                    Cover Image
                  </p>
                )}

                {!image.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCoverImage(image.id)}
                    className="mt-2 mr-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Set as Cover
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteImage(image.id)}
                  className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <ExpenseForm onAddExpense={handleAddExpense} />

      <h2 className="text-xl font-semibold text-gray-900">
        Vehicle Expenses
      </h2>

      <ExpenseList
        expenses={car.expenses}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      <h3 className="text-lg font-semibold text-gray-800">
        Expense Summary
      </h3>

      <p className="text-sm text-gray-700">
        Expense Count: {car.expense_summary?.expense_count ?? 0}
      </p>

      <p className="text-sm text-gray-700">
        Total Expenses: {car.expense_summary?.total_expenses ?? 0}
      </p>

      <p className="text-sm font-semibold text-gray-900">
        Net Cost: {car.expense_summary?.net_cost ?? 0}
      </p>
    </div>
  );
}

export default CarDetails;