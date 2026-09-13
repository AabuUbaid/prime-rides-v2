import PrintDocument from "../PrintDocument";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DeliveryNotePrintTemplate({ deliveryNote }) {
  if (!deliveryNote) {
    return null;
  }

  const vehicleName = [
    deliveryNote.vehicle_make,
    deliveryNote.vehicle_model,
    deliveryNote.vehicle_year,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PrintDocument
      documentType="DELIVERY NOTE"
      documentNumber={deliveryNote.delivery_note_number}
      date={formatDate(deliveryNote.delivery_date)}
    >
      <section className="print-section">
        <div className="print-section-title">Customer Details</div>

        <div className="print-grid-2">
          <div>
            <strong>Customer</strong>
            <div>{deliveryNote.customer_name || "-"}</div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">Vehicle Details</div>

        <div className="print-grid-3">
          <div>
            <strong>Vehicle</strong>
            <div>{vehicleName || "-"}</div>
          </div>

          <div>
            <strong>Colour</strong>
            <div>{deliveryNote.vehicle_colour || "-"}</div>
          </div>

          <div>
            <strong>Mileage</strong>
            <div>
              {deliveryNote.vehicle_mileage !== null &&
              deliveryNote.vehicle_mileage !== undefined
                ? `${Number(deliveryNote.vehicle_mileage).toLocaleString(
                    "en-AE",
                  )} km`
                : "-"}
            </div>
          </div>

          <div>
            <strong>Chassis Number</strong>
            <div>{deliveryNote.vehicle_chassis_number || "-"}</div>
          </div>

          <div>
            <strong>Engine Number</strong>
            <div>{deliveryNote.vehicle_engine_number || "-"}</div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">Delivery</div>

        <table className="print-table">
          <tbody>
            <tr>
              <th>Quantity</th>
              <td>{deliveryNote.quantity}</td>
            </tr>

            <tr>
              <th>Unit</th>
              <td>{deliveryNote.unit}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <div className="print-section-title">Buyer Confirmation</div>

        <div className="print-grid-2">
          <div>
            <strong>Buyer Name</strong>
            <div>{deliveryNote.buyer_name || "-"}</div>
          </div>
        </div>

        <div className="print-signature">
          <div>
            <span>Buyer Signature</span>
          </div>

          <div>
            <span>Authorized Signature</span>
          </div>
        </div>
      </section>
    </PrintDocument>
  );
}
