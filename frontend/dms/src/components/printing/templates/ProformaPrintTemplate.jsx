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

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "AED 0.00";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `AED ${String(value)}`;
  }

  return `AED ${number.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ProformaPrintTemplate({ proforma }) {
  if (!proforma) {
    return null;
  }

  const isFinance = proforma.payment_type === "finance";

  const vehicleName = [
    proforma.vehicle_make,
    proforma.vehicle_model,
    proforma.vehicle_year,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PrintDocument
      documentType="PROFORMA INVOICE"
      documentNumber={proforma.proforma_number}
      date={formatDate(proforma.proforma_date)}
    >
      <section className="print-section">
        <div className="print-section-title">Customer Details</div>

        <div className="print-grid-2">
          <div>
            <strong>Name</strong>
            <div>{proforma.customer_name || "-"}</div>
          </div>

          <div>
            <strong>Mobile</strong>
            <div>{proforma.customer_mobile || "-"}</div>
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
            <strong>Year</strong>
            <div>{proforma.vehicle_year || "-"}</div>
          </div>

          <div>
            <strong>Mileage</strong>
            <div>
              {proforma.vehicle_mileage !== null &&
              proforma.vehicle_mileage !== undefined
                ? `${Number(proforma.vehicle_mileage).toLocaleString(
                    "en-AE",
                  )} km`
                : "-"}
            </div>
          </div>

          <div>
            <strong>Chassis Number</strong>
            <div>{proforma.vehicle_chassis_number || "-"}</div>
          </div>

          <div>
            <strong>Engine Number</strong>
            <div>{proforma.vehicle_engine_number || "-"}</div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">Proforma</div>

        <table className="print-table">
          <tbody>
            <tr>
              <th>Payment Type</th>
              <td>{isFinance ? "Finance" : "Cash"}</td>
            </tr>

            {isFinance && (
              <>
                <tr>
                  <th>Bank / Financed By</th>
                  <td>{proforma.bank_financed_by || "-"}</td>
                </tr>

                <tr>
                  <th>LPO Number</th>
                  <td>{proforma.lpo || "-"}</td>
                </tr>
              </>
            )}

            <tr>
              <th>Vehicle Price</th>
              <td>{formatCurrency(proforma.vehicle_price)}</td>
            </tr>

            {isFinance && (
              <>
                <tr>
                  <th>Down Payment</th>
                  <td>{formatCurrency(proforma.down_payment)}</td>
                </tr>

                <tr>
                  <th>Net Finance</th>
                  <td>{formatCurrency(proforma.net_finance)}</td>
                </tr>
              </>
            )}

            <tr>
              <th>VAT</th>
              <td>{formatCurrency(proforma.vat)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <div className="print-signature">
          <div>
            <span>Customer Signature</span>
          </div>

          <div>
            <span>Authorized Signature</span>
          </div>
        </div>
      </section>
    </PrintDocument>
  );
}
