import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCars } from "../../api/inventory";

function Stock() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCars() {
      try {
        const response = await getCars();

        setCars(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>Inventory</h1>
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
