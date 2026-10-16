
import PrintDocument from "../PrintDocument";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-GB");
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);

  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function displayValue(value) {
  return value === null || value === undefined || value === ""
    ? "-"
    : String(value);
}

function formatStatus(value) {
  return displayValue(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function CompanyHeader({ company }) {
  const name = company?.legal_entity_name || "Prime Rides";
  const address = company?.showroom_address;
  const phone = company?.official_phone || company?.main_contact_mobile;
  const email = company?.corporate_email;

  return (
    <header className="balance-sheet-company-header">
      <h1>{name}</h1>
      {address && <p>{address}</p>}
      <div className="balance-sheet-company-contact">
        {phone && <span>Tel: {phone}</span>}
        {email && <span>{email}</span>}
      </div>
    </header>
  );
}

function Section({ title, children }) {
  return (
    <section className="print-section">
      <h2 className="print-section-title">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div className="balance-sheet-field">
      <strong>{label}</strong>
      <span>{displayValue(value)}</span>
    </div>
  );
}

export default function BalanceSheetPrintTemplate({
  balanceSheet,
  company,
}) {
  if (!balanceSheet) return null;

  const transactions = Array.isArray(balanceSheet.transactions)
    ? balanceSheet.transactions
    : [];

  const breakdown = Array.isArray(balanceSheet.spent_breakdown)
    ? balanceSheet.spent_breakdown
    : [];

  const vehicle = [
    balanceSheet.vehicle_make,
    balanceSheet.vehicle_model,
    balanceSheet.vehicle_variant,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PrintDocument company={company} showHeader={false} showFooter={false}>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        .balance-sheet-print {
          color: #222;
          background: #fff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }

        .balance-sheet-company-header {
          text-align: center;
          padding: 0 0 12px;
          margin-bottom: 16px;
          border-bottom: 2px solid #222;
        }

        .balance-sheet-company-header h1 {
          font-size: 21px;
          margin: 0 0 5px;
        }

        .balance-sheet-company-header p {
          margin: 3px 0;
        }

        .balance-sheet-company-contact {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px 18px;
        }

        .balance-sheet-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .balance-sheet-title h2 {
          font-size: 18px;
          margin: 0;
        }

        .balance-sheet-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 18px;
        }

        .balance-sheet-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-wrap: anywhere;
        }

        .balance-sheet-field strong {
          color: #555;
          font-size: 10px;
          text-transform: uppercase;
        }

        .balance-sheet-print .print-section {
          margin: 0 0 14px;
          break-inside: avoid;
        }

        .balance-sheet-print .print-section-title {
          font-size: 12px;
          margin: 0 0 8px;
          padding: 6px 8px;
          background: #eee;
          border-bottom: 1px solid #ccc;
          font-weight: 700;
        }

        .balance-sheet-print .print-table {
          width: 100%;
          border-collapse: collapse;
        }

        .balance-sheet-print .print-table th,
        .balance-sheet-print .print-table td {
          padding: 6px 8px;
          border: 1px solid #ddd;
          text-align: left;
          vertical-align: top;
          overflow-wrap: anywhere;
        }

        .balance-sheet-print .print-table th {
          background: #f5f5f5;
        }

        .balance-sheet-print .amount {
          text-align: right !important;
          white-space: nowrap;
        }

        .balance-sheet-summary {
          margin-top: 10px;
          border: 1px solid #ccc;
          padding: 10px;
        }

        .balance-sheet-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 0;
        }

        .balance-sheet-summary-row:last-child {
          border-top: 1px solid #bbb;
          margin-top: 5px;
          padding-top: 8px;
          font-size: 14px;
          font-weight: 700;
        }

        @media print {
          .balance-sheet-print .print-section {
            break-inside: avoid;
          }

          .balance-sheet-print .print-table tr {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="balance-sheet-print">
        <CompanyHeader company={company} />

        <div className="balance-sheet-title">
          <div>
            <h2>Balance Sheet</h2>
            <div>Reference: {displayValue(balanceSheet.quote_number)}</div>
          </div>
          <div>
            <div>Date: {formatDate(balanceSheet.created_at)}</div>
            <div>Status: {formatStatus(balanceSheet.balance_status)}</div>
          </div>
        </div>

        <Section title="Customer Details">
          <div className="balance-sheet-grid">
            <Field label="Customer" value={balanceSheet.customer_name} />
            <Field label="Mobile" value={balanceSheet.customer_mobile} />
          </div>
        </Section>

        <Section title="Deal Details">
          <div className="balance-sheet-grid">
            <Field label="Quote" value={balanceSheet.quote_number} />
            <Field label="Payment Method" value={balanceSheet.payment_method} />
            <Field label="Quote Status" value={balanceSheet.quote_status} />
            <Field label="Agent" value={balanceSheet.agent_name} />
          </div>
        </Section>

        <Section title="Vehicle Details">
          <div className="balance-sheet-grid">
            <Field label="Vehicle" value={vehicle} />
            <Field label="Stock ID" value={balanceSheet.vehicle_stock_id} />
            <Field label="Year" value={balanceSheet.vehicle_year} />
            <Field label="Colour" value={balanceSheet.vehicle_colour} />
            <Field
              label="Chassis Number"
              value={balanceSheet.vehicle_chassis_number}
            />
            <Field label="Evaluation" value={formatCurrency(balanceSheet.evaluation)} />
          </div>
        </Section>

        <Section title="Financial Position">
          <table className="print-table">
            <tbody>
              <tr>
                <th>Selling Price</th>
                <td className="amount">
                  {formatCurrency(balanceSheet.selling_price)}
                </td>
              </tr>
              <tr>
                <th>Total Received</th>
                <td className="amount">
                  {formatCurrency(balanceSheet.total_received)}
                </td>
              </tr>
              <tr>
                <th>Total Spent</th>
                <td className="amount">
                  {formatCurrency(balanceSheet.total_spent)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="balance-sheet-summary">
            <div className="balance-sheet-summary-row">
              <span>Net Difference</span>
              <span>{formatCurrency(balanceSheet.net_difference)}</span>
            </div>
            <div className="balance-sheet-summary-row">
              <span>Balance Status</span>
              <span>{formatStatus(balanceSheet.balance_status)}</span>
            </div>
          </div>
        </Section>

        <Section title="Spent Breakdown">
          {breakdown.length ? (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, index) => (
                  <tr key={`${item.type || "item"}-${index}`}>
                    <td>{displayValue(item.narration)}</td>
                    <td className="amount">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No spent breakdown available.</p>
          )}
        </Section>

        <Section title="Transaction History">
          {transactions.length ? (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Date</th>
                  <th>Direction</th>
                  <th>Category</th>
                  <th className="amount">Amount</th>
                  <th>Payment Method</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td>{displayValue(item.receipt_number)}</td>
                    <td>{formatDate(item.transaction_date)}</td>
                    <td>
                      {formatStatus(item.direction)}
                      {item.is_reversal ? " (Reversal)" : ""}
                    </td>
                    <td>{displayValue(item.category)}</td>
                    <td className="amount">{formatCurrency(item.amount)}</td>
                    <td>{displayValue(item.payment_method)}</td>
                    <td>{displayValue(item.description)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No transactions recorded.</p>
          )}
        </Section>
      </div>
    </PrintDocument>
  );
}
