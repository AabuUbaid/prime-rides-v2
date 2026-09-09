import PrintDocument from "../PrintDocument";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB");
}

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "AED 0.00";
  }

  return `AED ${numericValue.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function QuotePrintTemplate({ quote }) {
  if (!quote) {
    return null;
  }

  const vehicleName = [
    quote.vehicle?.make,
    quote.vehicle?.model,
    quote.vehicle?.variant,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PrintDocument
      documentType="QUOTATION"
      documentNumber={quote.quote_number}
      date={formatDate(quote.date)}
      status={
        quote.status
          ? String(quote.status).toUpperCase()
          : ""
      }
    >
      <section className="print-section">
        <div className="print-section-title">
          Customer Details
        </div>

        <div className="print-grid-2">
          <div className="print-field">
            <div className="print-field-label">
              Customer Name
            </div>
            <div className="print-field-value">
              {quote.customer?.name || "-"}
            </div>
          </div>

          <div className="print-field">
            <div className="print-field-label">
              Mobile
            </div>
            <div className="print-field-value">
              {quote.customer?.mobile || "-"}
            </div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">
          Vehicle Details
        </div>

        <div className="print-grid-2">
          <div className="print-field">
            <div className="print-field-label">
              Vehicle
            </div>
            <div className="print-field-value">
              {vehicleName || "-"}
            </div>
          </div>

          <div className="print-field">
            <div className="print-field-label">
              Stock ID
            </div>
            <div className="print-field-value">
              {quote.vehicle?.stock_id || "-"}
            </div>
          </div>

          <div className="print-field">
            <div className="print-field-label">
              Year
            </div>
            <div className="print-field-value">
              {quote.vehicle?.year || "-"}
            </div>
          </div>

          <div className="print-field">
            <div className="print-field-label">
              Colour
            </div>
            <div className="print-field-value">
              {quote.vehicle?.colour || "-"}
            </div>
          </div>

          <div className="print-field">
            <div className="print-field-label">
              Mileage
            </div>
            <div className="print-field-value">
              {quote.vehicle?.mileage ?? "-"}
            </div>
          </div>

          <div className="print-field">
            <div className="print-field-label">
              Chassis Number
            </div>
            <div className="print-field-value">
              {quote.vehicle?.chassis || "-"}
            </div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">
          Quotation
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Vehicle Price</td>
              <td>{formatCurrency(quote.price)}</td>
            </tr>

            <tr>
              <td>Payment Method</td>
              <td>{quote.payment_method || "-"}</td>
            </tr>

            <tr>
              <td>Down Payment</td>
              <td>{formatCurrency(quote.down_payment)}</td>
            </tr>

            <tr>
              <td>Extra Down Payment</td>
              <td>
                {formatCurrency(quote.extra_down_payment)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <div className="print-signature">
          <div className="print-signature-line">
            Customer Signature
          </div>

          <div className="print-signature-line">
            Authorized Signature
          </div>
        </div>
      </section>
    </PrintDocument>
  );
}