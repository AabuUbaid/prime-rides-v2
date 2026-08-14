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
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>Vehicle Details</h1>

      <table>
        <tbody>
          <tr>
            <th>Stock ID</th>
            <td>{car.stock_id}</td>
          </tr>

          <tr>
            <th>Year</th>
            <td>{car.year}</td>
          </tr>

          <tr>
            <th>Make</th>
            <td>{car.make}</td>
          </tr>

          <tr>
            <th>Model</th>
            <td>{car.model}</td>
          </tr>

          <tr>
            <th>Variant</th>
            <td>{car.variant}</td>
          </tr>

          <tr>
            <th>Colour</th>
            <td>{car.colour}</td>
          </tr>

          <tr>
            <th>Status</th>
            <td>{car.status}</td>
          </tr>

          <tr>
            <th>Purchase Cost</th>
            <td>{car.purchase_cost ?? "-"}</td>
          </tr>

          <tr>
            <th>Asking Price</th>
            <td>{car.asking_price ?? "-"}</td>
          </tr>

          <tr>
            <th>Least Selling Price</th>
            <td>{car.least_selling_price ?? "-"}</td>
          </tr>

          <tr>
            <th>Mileage</th>
            <td>{car.mileage ?? "-"}</td>
          </tr>

          <tr>
            <th>Supplier</th>
            <td>{car.supplier || "-"}</td>
          </tr>

          <tr>
            <th>Source</th>
            <td>{car.source}</td>
          </tr>

          <tr>
            <th>Chassis Number</th>
            <td>{car.chassis_number || "-"}</td>
          </tr>

          <tr>
            <th>Engine Number</th>
            <td>{car.engine_number || "-"}</td>
          </tr>

          <tr>
            <th>Highlight Public</th>
            <td>{car.highlight_public ? "Yes" : "No"}</td>
          </tr>

          <tr>
            <th>Possession Certificate</th>
            <td>
              {car.possession_certificate ? (
                <a
                  href={`${import.meta.env.VITE_URL}${car.possession_certificate}`}
                  target="_blank"
                  rel="noreferrer"
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

      <h2>Vehicle Images</h2>

      {car.images.length === 0 ? (
        <p>No images uploaded.</p>
      ) : (
        <>
          <h3>Gallery</h3>

          {selectedImageIds.length > 0 && (
            <button type="button" onClick={handleBulkDeleteImages}>
              Delete Selected ({selectedImageIds.length})
            </button>
          )}

          <div
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
                />

                <img
                  src={`${import.meta.env.VITE_URL}${image.image}`}
                  alt="Vehicle"
                  width="150"
                />

                {image.is_cover && (
                  <p>
                    <strong>Cover Image</strong>
                  </p>
                )}

                {!image.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCoverImage(image.id)}
                  >
                    Set as Cover
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteImage(image.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <ExpenseForm onAddExpense={handleAddExpense} />

      <h2>Vehicle Expenses</h2>

      <ExpenseList
        expenses={car.expenses}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      <h3>Expense Summary</h3>

      <p>Expense Count: {car.expense_summary?.expense_count ?? 0}</p>

      <p>Total Expenses: {car.expense_summary?.total_expenses ?? 0}</p>

      <p>Net Cost: {car.expense_summary?.net_cost ?? 0}</p>
    </div>
  );
}

export default CarDetails;
