function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return `AED ${numericValue.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercentage(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return `${numericValue.toFixed(2)}%`;
}

function PrintSectionTitle({ title }) {
  return <div className="print-section-title">{title}</div>;
}

function PrintField({ label, value }) {
  return (
    <div className="print-field">
      <div className="print-field-label">{label}</div>

      <div className="print-field-value">{displayValue(value)}</div>
    </div>
  );
}

function PrintGrid({ children, columns = 2 }) {
  return (
    <div className={columns === 3 ? "print-grid-3" : "print-grid-2"}>
      {children}
    </div>
  );
}

function PrintSummary({ label, value, highlight = false }) {
  return (
    <div className={highlight ? "print-total-row--strong" : "print-total-row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function EmiPrintTemplate({ emi }) {
  const expenses = Array.isArray(emi?.expenses) ? emi.expenses : [];

  return (
    <>
      {/* Customer */}
      <section className="print-section">
        <PrintSectionTitle title="Customer" />

        <PrintGrid columns={2}>
          <PrintField label="Customer Name" value={emi?.customer_name} />

          <PrintField label="Mobile" value={emi?.customer_mobile} />
        </PrintGrid>
      </section>

      {/* Vehicle */}
      <section className="print-section">
        <PrintSectionTitle title="Vehicle" />

        <PrintGrid columns={3}>
          <PrintField
            label="Stock ID"
            value={emi?.vehicle_stock_id || "Manual Vehicle"}
          />

          <PrintField label="Make" value={emi?.vehicle_make} />

          <PrintField label="Model" value={emi?.vehicle_model} />

          <PrintField label="Variant" value={emi?.vehicle_variant} />

          <PrintField label="Year" value={emi?.vehicle_year} />

          <PrintField label="Colour" value={emi?.vehicle_colour} />

          <PrintField
            label="Mileage"
            value={
              emi?.vehicle_mileage !== null &&
              emi?.vehicle_mileage !== undefined &&
              emi?.vehicle_mileage !== ""
                ? `${Number(emi.vehicle_mileage).toLocaleString("en-AE")} km`
                : "-"
            }
          />

          <PrintField
            label="Chassis Number"
            value={emi?.vehicle_chassis_number}
          />

          <PrintField
            label="Engine Number"
            value={emi?.vehicle_engine_number}
          />
        </PrintGrid>
      </section>

      {/* Financing */}
      <section className="print-section">
        <PrintSectionTitle title="Financing" />

        <PrintGrid columns={3}>
          <PrintField label="Bank" value={emi?.bank_name} />

          <PrintField
            label="Interest Rate"
            value={formatPercentage(emi?.interest_rate)}
          />

          <PrintField
            label="Manual Rate Used"
            value={emi?.manual_rate_used ? "Yes" : "No"}
          />

          <PrintField
            label="Vehicle Price"
            value={formatCurrency(emi?.vehicle_price)}
          />

          <PrintField
            label="VAT"
            value={
              emi?.vat_enabled ? formatCurrency(emi?.vat_amount) : "Not Applied"
            }
          />

          <PrintField
            label="Price After VAT"
            value={formatCurrency(emi?.price_after_vat)}
          />

          <PrintField
            label="Down Payment"
            value={formatCurrency(emi?.down_payment)}
          />

          <PrintField
            label="Finance Amount"
            value={formatCurrency(emi?.finance_amount)}
          />

          <PrintField
            label="Tenure"
            value={
              emi?.tenure_years !== null && emi?.tenure_years !== undefined
                ? `${emi.tenure_years} ${
                    Number(emi.tenure_years) === 1 ? "Year" : "Years"
                  }`
                : "-"
            }
          />
        </PrintGrid>
      </section>

      {/* EMI Summary */}
      <section className="print-section">
        <PrintSectionTitle title="EMI Summary" />

        <div className="print-total">
          <PrintSummary
            label="Total Interest"
            value={formatCurrency(emi?.total_interest)}
          />

          <PrintSummary
            label="Total Payable"
            value={formatCurrency(emi?.total_payable)}
          />

          <PrintSummary
            label="Monthly EMI"
            value={formatCurrency(emi?.monthly_emi)}
            highlight
          />
        </div>
      </section>

      {/* Applied Finance Configuration */}
      <section className="print-section">
        <PrintSectionTitle title="Applied Finance Configuration" />

        <PrintGrid columns={3}>
          <PrintField
            label="Evaluation"
            value={
              emi?.evaluation_name
                ? `${emi.evaluation_name} — ${formatCurrency(
                    emi.evaluation_amount,
                  )}`
                : formatCurrency(emi?.evaluation_amount)
            }
          />

          <PrintField
            label="Bank Processing"
            value={formatCurrency(emi?.bank_processing_amount)}
          />

          <PrintField
            label="Insurance"
            value={
              emi?.insurance_band_name
                ? `${emi.insurance_band_name} — ${formatCurrency(
                    emi.insurance_amount,
                  )}`
                : formatCurrency(emi?.insurance_amount)
            }
          />

          <PrintField
            label="Registration"
            value={formatCurrency(emi?.registration_amount)}
          />

          <PrintField label="RTA" value={formatCurrency(emi?.rta_amount)} />

          <PrintField
            label="Service Package"
            value={
              emi?.service_package_name
                ? `${emi.service_package_name} — ${formatCurrency(
                    emi.service_package_amount,
                  )}`
                : formatCurrency(emi?.service_package_amount)
            }
          />
        </PrintGrid>
      </section>

      {/* Other Expenses */}
      <section className="print-section">
        <PrintSectionTitle title="Other Expenses" />

        {expenses.length > 0 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((expense, index) => (
                <tr key={expense.id ?? `${expense.expense_type}-${index}`}>
                  <td>{displayValue(expense.expense_type)}</td>

                  <td>{displayValue(expense.name)}</td>

                  <td>{displayValue(expense.description)}</td>

                  <td className="text-right font-semibold">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="print-field-value">
            No additional expenses recorded.
          </div>
        )}

        <div className="print-total">
          <PrintSummary
            label="Other Expenses Total"
            value={formatCurrency(emi?.expense_total)}
            highlight
          />
        </div>
      </section>

      {/* Signature */}
      <section className="print-signature">
        <div className="print-signature-line">Authorized Signature</div>

        <div className="print-signature-line">Company Seal</div>
      </section>
    </>
  );
}
