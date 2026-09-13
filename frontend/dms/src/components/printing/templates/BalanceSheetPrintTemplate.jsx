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

function formatStatus(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDirection(value) {
  if (value === "customer_payment") {
    return "Customer Payment";
  }

  if (value === "company_on_behalf") {
    return "Company On Behalf";
  }

  return formatStatus(value);
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export default function BalanceSheetPrintTemplate({ balanceSheet }) {
  if (!balanceSheet) {
    return null;
  }

  const transactions = Array.isArray(balanceSheet.transactions)
    ? balanceSheet.transactions
    : [];

  const vehicleName = [
    balanceSheet.vehicle_make,
    balanceSheet.vehicle_model,
    balanceSheet.vehicle_variant,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PrintDocument
      documentType="BALANCE SHEET"
      documentNumber={balanceSheet.quote_number}
      date={formatDate(balanceSheet.created_at)}
      status={formatStatus(balanceSheet.balance_status)}
    >
      <section className="print-section">
        <div className="print-section-title">Customer Details</div>

        <div className="print-grid-2">
          <div>
            <strong>Customer Name</strong>
            <div>{displayValue(balanceSheet.customer_name)}</div>
          </div>

          <div>
            <strong>Mobile</strong>
            <div>{displayValue(balanceSheet.customer_mobile)}</div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">Deal Details</div>

        <div className="print-grid-3">
          <div>
            <strong>Quote</strong>
            <div>
              {displayValue(balanceSheet.quote_number || balanceSheet.quote)}
            </div>
          </div>

          <div>
            <strong>Payment Method</strong>
            <div>{displayValue(balanceSheet.payment_method)}</div>
          </div>

          <div>
            <strong>Quote Status</strong>
            <div>{displayValue(balanceSheet.quote_status)}</div>
          </div>

          <div>
            <strong>Agent</strong>
            <div>{displayValue(balanceSheet.agent_name)}</div>
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
            <strong>Stock ID</strong>
            <div>{displayValue(balanceSheet.vehicle_stock_id)}</div>
          </div>

          <div>
            <strong>Year</strong>
            <div>{displayValue(balanceSheet.vehicle_year)}</div>
          </div>

          <div>
            <strong>Colour</strong>
            <div>{displayValue(balanceSheet.vehicle_colour)}</div>
          </div>

          <div className="col-span-2">
            <strong>Chassis Number</strong>
            <div>{displayValue(balanceSheet.vehicle_chassis_number)}</div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">Financial Position</div>

        <table className="print-table">
          <tbody>
            <tr>
              <th>Selling Price</th>
              <td>{formatCurrency(balanceSheet.selling_price)}</td>
            </tr>

            <tr>
              <th>Evaluation</th>
              <td>{formatCurrency(balanceSheet.evaluation)}</td>
            </tr>

            <tr>
              <th>Total Received</th>
              <td>{formatCurrency(balanceSheet.total_received)}</td>
            </tr>

            <tr>
              <th>Total Spent</th>
              <td>{formatCurrency(balanceSheet.total_spent)}</td>
            </tr>
          </tbody>
        </table>

        <div className="print-total">
          <div>
            <span>Net Difference</span>
            <strong>{formatCurrency(balanceSheet.net_difference)}</strong>
          </div>

          <div>
            <span>Balance Status</span>
            <strong>{formatStatus(balanceSheet.balance_status)}</strong>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">Transaction History</div>

        {transactions.length > 0 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Date</th>
                <th>Direction</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{displayValue(transaction.receipt_number)}</td>

                  <td>{formatDate(transaction.transaction_date)}</td>

                  <td>{formatDirection(transaction.direction)}</td>

                  <td>{displayValue(transaction.category)}</td>

                  <td>{formatCurrency(transaction.amount)}</td>

                  <td>{displayValue(transaction.payment_method)}</td>

                  <td>{displayValue(transaction.description)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="print-field-value">No transactions recorded.</div>
        )}
      </section>

      <section className="print-signature">
        <div className="print-signature-line">Authorized Signature</div>

        <div className="print-signature-line">Company Seal</div>
      </section>
    </PrintDocument>
  );
}
