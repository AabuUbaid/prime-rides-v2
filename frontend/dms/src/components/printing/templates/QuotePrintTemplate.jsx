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

function hasAmount(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const number = Number(value);

  return Number.isFinite(number) && number !== 0;
}

function normalizeExpenses(expenses) {
  if (!Array.isArray(expenses)) {
    return [];
  }

  return expenses.filter((expense) => {
    if (!expense) {
      return false;
    }

    const amount = Number(expense.actual_amount);

    return (
      expense.applies !== false ||
      (Number.isFinite(amount) && amount !== 0) ||
      expense.name ||
      expense.description
    );
  });
}

function getExpenseLabel(expense) {
  return expense?.name || expense?.expense_type || "Internal Expense";
}

function getExpenseDescription(expense) {
  return expense?.description || "-";
}

function getExpenseAmount(expense) {
  if (
    expense?.actual_amount !== null &&
    expense?.actual_amount !== undefined &&
    expense?.actual_amount !== ""
  ) {
    return formatCurrency(expense.actual_amount);
  }

  if (
    expense?.estimated_min !== null &&
    expense?.estimated_min !== undefined &&
    expense?.estimated_min !== ""
  ) {
    return formatCurrency(expense.estimated_min);
  }

  return "AED 0.00";
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

  const paymentMethod = quote.payment_method || "-";
  const isCash = paymentMethod === "Cash";
  const isFinance = paymentMethod === "Finance";

  const vehiclePrice = Number(quote.price || 0);
  const downPayment = Number(quote.down_payment || 0);
  const extraDownPayment = Number(quote.extra_down_payment || 0);

  /*
   * Quote price is the backend-controlled commercial amount.
   * Do not add VAT again to quote.price.
   *
   * CASH:
   * Total = Quote Price - Advance Amount - Extra Down Payment
   *
   * FINANCE:
   * Total = Quote Price - Down Payment - Extra Down Payment
   */
  const cashVatEnabled = quote?.vat?.enabled === true;
  const cashVatAmount = Number(quote?.vat?.amount || 0);

  const financeBank = isFinance ? quote?.finance?.bank_name || "-" : null;

  const totalAmount = vehiclePrice - downPayment - extraDownPayment;

  const expenses = normalizeExpenses(quote.expenses);

  return (
    <PrintDocument
      documentType="QUOTATION"
      documentNumber={quote.quote_number}
      date={formatDate(quote.date)}
      status={quote.status ? String(quote.status).toUpperCase() : ""}
    >
      <section className="print-section">
        <div className="print-section-title">Customer Details</div>

        <div className="print-grid-2">
          <div>
            <strong>Name</strong>
            <div>{quote.customer?.name || "-"}</div>
          </div>

          <div>
            <strong>Mobile</strong>
            <div>{quote.customer?.mobile || "-"}</div>
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
            <div>{quote.vehicle?.stock_id || "-"}</div>
          </div>

          <div>
            <strong>Year</strong>
            <div>{quote.vehicle?.year || "-"}</div>
          </div>

          <div>
            <strong>Colour</strong>
            <div>{quote.vehicle?.colour || "-"}</div>
          </div>

          <div>
            <strong>Mileage</strong>
            <div>
              {quote.vehicle?.mileage !== null &&
              quote.vehicle?.mileage !== undefined
                ? `${Number(quote.vehicle.mileage).toLocaleString("en-AE")} km`
                : "-"}
            </div>
          </div>

          <div>
            <strong>Chassis Number</strong>
            <div>{quote.vehicle?.chassis_number || "-"}</div>
          </div>

          <div>
            <strong>Engine Number</strong>
            <div>{quote.vehicle?.engine_number || "-"}</div>
          </div>
        </div>
      </section>

      <section className="print-section">
        <div className="print-section-title">Quotation</div>

        <table className="print-table">
          <tbody>
            {isCash && (
              <>
                <tr>
                  <th>Vehicle Price</th>
                  <td>{formatCurrency(vehiclePrice)}</td>
                </tr>

                {cashVatEnabled && (
                  <tr>
                    <th>VAT</th>
                    <td>{formatCurrency(cashVatAmount)}</td>
                  </tr>
                )}
              </>
            )}

            {isFinance && (
              <tr>
                <th>Vehicle Price (Inclusive of VAT)</th>
                <td>{formatCurrency(vehiclePrice)}</td>
              </tr>
            )}

            <tr>
              <th>Payment Method</th>
              <td>{paymentMethod}</td>
            </tr>

            {isFinance && (
              <tr>
                <th>Bank</th>
                <td>{financeBank}</td>
              </tr>
            )}

            <tr>
              <th>{isCash ? "Advance Amount" : "Down Payment"}</th>
              <td>{formatCurrency(downPayment)}</td>
            </tr>

            {hasAmount(quote.extra_down_payment) && (
              <tr>
                <th>Extra Down Payment</th>
                <td>{formatCurrency(extraDownPayment)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="print-total">
          <span>Total Amount</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>
      </section>

      {expenses.length > 0 && (
        <section className="print-section">
          <div className="print-section-title">Internal Expenses</div>

          <table className="print-table">
            <thead>
              <tr>
                <th>Expense</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((expense, index) => (
                <tr
                  key={`${expense.expense_type || "expense"}-${
                    expense.id || index
                  }`}
                >
                  <td>{getExpenseLabel(expense)}</td>
                  <td>{getExpenseDescription(expense)}</td>
                  <td>{getExpenseAmount(expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

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
