import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCar } from "../../api/inventory";
import ExpenseList from "./components/ExpenseList";
import ExpenseForm from "./components/ExpenseForm";
import { createExpense, updateExpense, deleteExpense } from "../../api/expense";

function CarDetails() {
  const { id } = useParams();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <h2>Loading...</h2>;
  }

  const coverImage =
    car.images.find((image) => image.is_cover) || car.images[0];

  const handleAddExpense = async (expense) => {
    try {
      const response = await createExpense(car.id, expense);

      setCar((prev) => ({
        ...prev,
        expenses: [...prev.expenses, response.data],
      }));
    } catch (error) {
      console.error(error);
    }
  };

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
          <h3>Cover Image</h3>

          <img
            src={`${import.meta.env.VITE_URL}${coverImage.image}`}
            alt="Cover"
            width="400"
          />
        </>
      )}

      <h3>Gallery</h3>

      <div>
        {car.images
          .filter((image) => image.id !== coverImage.id)
          .map((image) => (
            <img
              key={image.id}
              src={`${import.meta.env.VITE_URL}${image.image}`}
              alt="Vehicle"
              width="150"
            />
          ))}
      </div>
      <ExpenseForm onAddExpense={handleAddExpense} />
      <h2>Vehicle Expenses</h2>

      <ExpenseList
        expenses={car.expenses}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
      />
      <h3>
        Total Expenses:{" "}
        {(car.expenses ?? [])
          .reduce((total, expense) => total + Number(expense.amount), 0)
          .toFixed(2)}
      </h3>
    </div>
  );
}

export default CarDetails;
