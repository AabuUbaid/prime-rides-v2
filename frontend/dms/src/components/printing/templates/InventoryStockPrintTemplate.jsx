import PrintDocument from "../PrintDocument";

function getImageUrl(imagePath) {
  if (!imagePath) return null;

  return imagePath.startsWith("http")
    ? imagePath
    : `http://localhost:8000${imagePath}`;
}

function getCoverImage(car) {
  const images = car?.images || [];

  return (
    images.find((image) => image.is_cover)?.image || images[0]?.image || null
  );
}

function getVehicleTypeLabel(value) {
  const labels = {
    sedan: "Sedan",
    suv: "SUV (Sport Utility Vehicle)",
    hatchback: "Hatchback",
    crossover: "Crossover",
    coupe: "Coupe",
    convertible: "Convertible",
    pickup_truck: "Pickup Truck",
    other: "Other",
  };

  return labels[value] || value || "-";
}

function getStatusLabel(value) {
  const labels = {
    available: "Available",
    upcoming: "Upcoming",
    reserved: "Reserved",
    booked: "Booked",
    sold: "Sold",
    in_service: "In Service",
    in_house: "In House",
  };

  return labels[value] || value || "-";
}

function formatMileage(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${Number(value).toLocaleString("en-AE")} km`;
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `AED ${Number(value).toLocaleString("en-AE")}`;
}

export default function InventoryStockPrintTemplate({ cars = [] }) {
  return (
    <PrintDocument documentNumber="Inventory">
      <div className="inventory-stock-print">
        <h1 className="inventory-stock-print-title">Vehicle Stock</h1>

        <div className="inventory-stock-print-grid">
          {cars.map((car) => {
            const coverImage = getImageUrl(getCoverImage(car));

            return (
              <div key={car.id} className="inventory-stock-print-card">
                <div className="inventory-stock-print-image">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={`${car.make || ""} ${car.model || ""}`}
                    />
                  ) : (
                    <div className="inventory-stock-print-image-empty">
                      No Image
                    </div>
                  )}
                </div>

                <div className="inventory-stock-print-content">
                  <div className="inventory-stock-print-stock-id">
                    {car.stock_id || "-"}
                  </div>

                  <h2>
                    {[car.make, car.model, car.variant]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </h2>

                  <div className="inventory-stock-print-status">
                    {getStatusLabel(car.status)}
                  </div>

                  <div className="inventory-stock-print-details">
                    <div>
                      <span>Year</span>
                      <strong>{car.year || "-"}</strong>
                    </div>

                    <div>
                      <span>Vehicle Type</span>
                      <strong>{getVehicleTypeLabel(car.vehicle_type)}</strong>
                    </div>

                    <div>
                      <span>Mileage</span>
                      <strong>{formatMileage(car.mileage)}</strong>
                    </div>

                    <div>
                      <span>Colour</span>
                      <strong>{car.colour || "-"}</strong>
                    </div>
                  </div>

                  {car.status !== "booked" && (
                    <div className="inventory-stock-print-price">
                      {formatPrice(car.asking_price)}
                    </div>
                  )}

                  {car.status === "upcoming" && (
                    <div className="inventory-stock-print-coming-soon">
                      COMING SOON
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PrintDocument>
  );
}
