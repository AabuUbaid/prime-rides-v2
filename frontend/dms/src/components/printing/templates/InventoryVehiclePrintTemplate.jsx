import PrintDocument from "../PrintDocument";
import { resolveBackendUrl } from "../../../api/url";

function getImageUrl(imagePath) {
  if (!imagePath) return null;

  return resolveBackendUrl(imagePath);
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

function getLastFour(value) {
  if (!value) return "-";

  const normalized = String(value).trim();

  if (!normalized) return "-";

  return normalized.slice(-4);
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

export default function InventoryVehiclePrintTemplate({ car }) {
  if (!car) {
    return null;
  }

  const coverImage = getImageUrl(getCoverImage(car));
  const status = car.status;

  const showPrice = status !== "booked" && status !== "upcoming";

  return (
    <PrintDocument
      customerName={`${car.make || ""} ${car.model || ""}`.trim()}
      documentNumber={car.stock_id || ""}
    >
      <div className="inventory-vehicle-print">
        {/* Main photo */}
        <div className="inventory-vehicle-print-image">
          {coverImage ? (
            <img
              src={coverImage}
              alt={`${car.make || ""} ${car.model || ""}`.trim()}
            />
          ) : (
            <div className="inventory-vehicle-print-image-empty">
              No vehicle image available
            </div>
          )}
        </div>

        {/* Vehicle heading */}
        <div className="inventory-vehicle-print-header">
          <div className="inventory-vehicle-print-make">{car.make || "-"}</div>

          <div className="inventory-vehicle-print-model">
            {car.model || "-"}
          </div>

          {car.variant && (
            <div className="inventory-vehicle-print-variant">{car.variant}</div>
          )}

          <div className="inventory-vehicle-print-type">
            {getVehicleTypeLabel(car.vehicle_type)}
          </div>
        </div>

        {/* Status / pricing */}
        <div className="inventory-vehicle-print-status">
          <span>Status</span>

          <strong>{getStatusLabel(status)}</strong>
        </div>

        {status === "upcoming" && (
          <div className="inventory-vehicle-print-coming-soon">COMING SOON</div>
        )}

        {showPrice && (
          <div className="inventory-vehicle-print-price">
            <span>Asking Price</span>
            <strong>{formatPrice(car.asking_price)}</strong>
          </div>
        )}

        {/* Vehicle information */}
        <div className="inventory-vehicle-print-info">
          <div>
            <span>Vehicle Information</span>
            <strong>
              {[car.make, car.model, car.variant].filter(Boolean).join(" ") ||
                "-"}
            </strong>
          </div>

          <div>
            <span>Vehicle Type</span>
            <strong>{getVehicleTypeLabel(car.vehicle_type)}</strong>
          </div>

          <div>
            <span>Year</span>
            <strong>{car.year || "-"}</strong>
          </div>

          <div>
            <span>Colour</span>
            <strong>{car.colour || "-"}</strong>
          </div>

          <div>
            <span>Mileage</span>
            <strong>{formatMileage(car.mileage)}</strong>
          </div>

          <div>
            <span>Chassis</span>
            <strong>{getLastFour(car.chassis_number)}</strong>
          </div>
        </div>
      </div>
    </PrintDocument>
  );
}
