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
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  if (number === 0) {
    return "-";
  }

  return number.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

const SMALL_NUMBERS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function numberToWordsBelowThousand(number) {
  if (number < 20) {
    return SMALL_NUMBERS[number];
  }

  if (number < 100) {
    const tens = Math.floor(number / 10);
    const remainder = number % 10;

    return remainder ? `${TENS[tens]}-${SMALL_NUMBERS[remainder]}` : TENS[tens];
  }

  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;

  return remainder
    ? `${SMALL_NUMBERS[hundreds]} Hundred ${numberToWordsBelowThousand(
        remainder,
      )}`
    : `${SMALL_NUMBERS[hundreds]} Hundred`;
}

function numberToWords(number) {
  if (!Number.isFinite(number)) {
    return "";
  }

  if (number === 0) {
    return "Zero";
  }

  let remainder = Math.floor(number);
  const parts = [];

  const scales = [
    [1000000000, "Billion"],
    [1000000, "Million"],
    [1000, "Thousand"],
  ];

  for (const [scale, label] of scales) {
    if (remainder >= scale) {
      const scaled = Math.floor(remainder / scale);

      parts.push(`${numberToWordsBelowThousand(scaled)} ${label}`);

      remainder %= scale;
    }
  }

  if (remainder > 0) {
    parts.push(numberToWordsBelowThousand(remainder));
  }

  return parts.join(" ");
}

function amountToWords(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  const rounded = Math.round((number + Number.EPSILON) * 100) / 100;

  const whole = Math.floor(rounded);
  const fils = Math.round((rounded - whole) * 100);

  if (fils > 0) {
    return `UAE Dirhams ${numberToWords(
      whole,
    )} and ${numberToWords(fils)} Fils Only`;
  }

  return `UAE Dirhams ${numberToWords(whole)} Only`;
}

export default function QuotePrintTemplate({
  quote,
  company,
  printAssets = {},
  includeSealStamp = false,
  documentType = "Quotation",
}) {
  if (!quote) {
    return null;
  }

  const customer = quote.customer || {};
  const vehicle = quote.vehicle || {};
  const finance = quote.finance || {};
  const vat = quote.vat || {};
  const validity = quote.validity || {};

  const isFinance = quote.payment_method === "Finance";
  const isCash = quote.payment_method === "Cash";

  const vehicleName = [vehicle.make, vehicle.model, vehicle.variant]
    .filter(Boolean)
    .join(" ");

  const expenses = Array.isArray(quote.expenses) ? quote.expenses : [];

  /*
   * Financial values remain backend-authoritative.
   * No totals are calculated in this component.
   */
  const vehicleAmount = quote.price;
  const downPayment = quote.down_payment;
  const financeAmount = finance.finance_amount;

  /*
   * Preserve any backend-provided down-payment percentage.
   * Finance requires 20% according to the print specification.
   */
  const downPaymentRate = isFinance ? "20%" : "-";

  /*
   * Cash VAT comes from the existing backend VAT data.
   * We do not calculate VAT in React.
   */
  const cashVatAmount = vat.amount;

  /*
   * Use an existing backend total when available.
   * Fall back to the existing quote price rather than
   * calculating a new total in React.
   */
  const cashTotalPayable =
    quote.total_payable ?? quote.total_amount ?? quote.amount ?? vehicleAmount;

  const validityDays = validity.days ?? (isCash ? 7 : 30);

  const documentNumberLabel =
    documentType === "Proforma Invoice"
      ? "PROFORMA INVOICE #"
      : documentType === "Invoice"
        ? "INVOICE #"
        : "QUOTATION #";

  const purchaseType = isFinance ? "Vehicle Finance" : "Cash Purchase";

  const customerAddress =
    customer.address || customer.address_line || customer.full_address || "";

  const bankAddress = finance.bank_address || finance.address || "";

  const companyPhone =
    company?.official_phone || company?.main_contact_mobile || "";

  const companyWebsite = company?.website || company?.website_url || "";

  return (
    <PrintDocument company={company} showHeader={false} showFooter={false}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          :root {
            --navy: #1F2A6E;
            --light: #F2F4F8;
            --pale: #E4E8F5;
            --grey: #6B7280;
            --line: #D5D9E2;
            --text: #222222;
          }

          .quote-print-page {
            width: 100%;
            height: 277mm;
            max-height: 277mm;
            overflow: hidden;
            box-sizing: border-box;

            display: flex;
            flex-direction: column;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size: 9px;
            line-height: 1.35;
            color: var(--text);
            background: #ffffff;

            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .quote-print-page *,
          .quote-print-page *::before,
          .quote-print-page *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .quote-section {
            margin-top: 9px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /*
           * ======================================================
           * HEADER
           * ======================================================
           */

          .quote-header {
            display: grid;
            grid-template-columns: 20% 56% 24%;
            align-items: start;

            min-height: 69px;
            padding-bottom: 7px;

            border-bottom: 2px solid var(--navy);
          }

          .quote-logo-wrap {
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            height: 69px;
          }

          .quote-logo {
            width: 135px;
            height: 69px;
            object-fit: contain;
            object-position: left center;
          }

          .quote-company {
            padding-left: 5px;
          }

          .quote-company-name {
            color: var(--navy);
            font-size: 18pt;
            line-height: 1.1;
            font-weight: 700;
          }

          .quote-company-meta {
            margin-top: 4px;
            color: var(--grey);
            font-size: 9pt;
            line-height: 1.3;
          }

          .quote-header-right {
            text-align: right;
            color: var(--grey);
            font-size: 9px;
          }

          /*
           * ======================================================
           * TITLE BAND
           * ======================================================
           */

          .quote-title-band {
            display: flex;
            align-items: center;
            justify-content: space-between;

            height: 28px;
            padding: 0 10px;
            margin-top: 8px;

            background: var(--navy);
            color: #ffffff;
          }

          .quote-title {
            font-size: 16pt;
            line-height: 1;
            font-weight: 700;
          }

          .quote-title-right {
            font-size: 10pt;
            line-height: 1;
            font-weight: 400;
          }

          /*
           * ======================================================
           * REFERENCE STRIP
           * ======================================================
           */

          .quote-reference-strip {
            display: grid;
            grid-template-columns: 20% 28% 18% 28%;

            background: var(--light);
          }

          .quote-reference-cell {
            min-height: 49px;
            padding: 7px 10px;
          }

          .quote-reference-label {
            color: var(--grey);
            font-size: 8pt;
            line-height: 1;
            font-weight: 700;
            text-transform: uppercase;
          }

          .quote-reference-value {
            margin-top: 5px;

            color: var(--text);
            font-size: 11pt;
            line-height: 1.1;
            font-weight: 700;

            min-height: 12px;
          }

          /*
           * ======================================================
           * BANK / CUSTOMER
           * ======================================================
           */

          .quote-party-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 12px;
          }

          .quote-party-heading {
            padding-bottom: 5px;

            color: var(--navy);
            font-size: 9pt;
            line-height: 1;
            font-weight: 700;

            border-bottom: 1px solid var(--navy);
          }

          .quote-party-name {
            margin-top: 6px;

            color: var(--text);
            font-size: 11pt;
            line-height: 1.2;
            font-weight: 700;
          }

          .quote-party-meta {
            margin-top: 4px;

            min-height: 14px;

            color: var(--grey);
            font-size: 10px;
            line-height: 1.35;
          }

          /*
           * ======================================================
           * VEHICLE DETAILS
           * ======================================================
           */

          .quote-section-bar {
            display: flex;
            align-items: center;

            height: 26px;
            padding: 0 10px;

            background: var(--navy);
            color: #ffffff;

            font-size: 10pt;
            line-height: 1;
            font-weight: 700;
          }

          .quote-vehicle-row {
            display: grid;
            grid-template-columns: 20% 28% 18% 28%;

            min-height: 22px;
            height: 22px;
          }

          .quote-vehicle-label {
            display: flex;
            align-items: center;

            padding: 0 10px;

            background: var(--light);
            color: var(--grey);

            font-size: 9pt;
            font-weight: 700;
          }

          .quote-vehicle-value {
            display: flex;
            align-items: center;

            min-width: 0;
            padding: 0 10px;

            color: var(--text);
            font-size: 10pt;
            font-weight: 700;

            border-bottom: 1px solid var(--line);
          }

          .quote-vehicle-empty {
            border-bottom: 1px solid var(--line);
          }

          /*
           * ======================================================
           * PRICE TABLE
           * ======================================================
           */

          .quote-price-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .quote-price-table th {
            height: 26px;
            padding: 0 10px;

            background: var(--navy);
            color: #ffffff;

            font-size: 10pt;
            font-weight: 700;
          }

          .quote-price-table th:nth-child(1) {
            width: 52%;
            text-align: left;
          }

          .quote-price-table th:nth-child(2) {
            width: 20%;
            text-align: center;
          }

          .quote-price-table th:nth-child(3) {
            width: 28%;
            text-align: right;
          }

          .quote-price-table td {
            height: 24px;
            padding: 0 10px;

            border-bottom: 1px solid var(--line);

            color: var(--text);
            font-size: 10pt;
          }

          .quote-price-description {
            text-align: left;
          }

          .quote-price-rate {
            text-align: center;
          }

          .quote-price-amount {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .quote-total-row td {
            height: 33px;

            background: var(--pale);
            color: var(--navy);

            border-top: 1px solid var(--navy);
            border-bottom: 2px solid var(--navy);
          }

          .quote-total-row .quote-price-description {
            font-size: 11pt;
            font-weight: 700;
          }

          .quote-total-row .quote-price-amount {
            font-size: 12pt;
            font-weight: 700;
          }

          .quote-expense-summary {
  page-break-inside: avoid;
  break-inside: avoid;
}

.quote-expense-heading {
  height: 24px;
  display: flex;
  align-items: center;

  padding: 0 10px;

  background: var(--navy);
  color: #ffffff;

  font-size: 10pt;
  font-weight: 700;
}

.quote-expense-table {
  width: 100%;
}

.quote-expense-header,
.quote-expense-row {
  display: grid;
  grid-template-columns: 52% 20% 28%;
}

.quote-expense-header {
  min-height: 22px;
  align-items: center;

  background: var(--light);
  color: var(--grey);

  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
}

.quote-expense-header > div,
.quote-expense-row > div {
  padding: 0 10px;
}

.quote-expense-row {
  min-height: 22px;
  align-items: center;

  border-bottom: 1px solid var(--line);

  color: var(--text);
  font-size: 9pt;
}

.quote-expense-status {
  color: var(--grey);
  text-align: center;
}

.quote-expense-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

          /*
           * ======================================================
           * AMOUNT IN WORDS
           * ======================================================
           */

          .quote-words {
            width: 100%;
          }

          .quote-word-row {
            display: grid;
            grid-template-columns: 22% 78%;

            min-height: 28px;

            border-bottom: 1px solid var(--line);
          }

          .quote-word-label {
            display: flex;
            align-items: center;

            padding: 3px 10px;

            color: var(--grey);
            font-size: 8pt;
            font-weight: 700;
          }

          .quote-word-value {
            display: flex;
            align-items: center;

            padding: 3px 10px;

            color: var(--text);
            font-size: 9pt;
            font-style: italic;
          }

          /*
           * ======================================================
           * TERMS + STAMP
           * ======================================================
           */

          .quote-terms-stamp {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;

            margin-top: 9px;

            page-break-inside: avoid;
            break-inside: avoid;
          }

          .quote-terms-heading {
            padding-bottom: 5px;

            color: var(--navy);
            font-size: 9pt;
            line-height: 1;
            font-weight: 700;

            border-bottom: 1px solid var(--navy);
          }

          .quote-terms-list {
            margin: 5px 0 0;
            padding-left: 18px;

            color: #444444;
            font-size: 9pt;
            line-height: 1.6;
          }

          .quote-terms-list li {
            padding-left: 2px;
          }

          .quote-stamp-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 117px;
  position: relative;
  top: 8px;
}

          .quote-stamp-image-wrap {
            display: flex;
            align-items: center;
            justify-content: center;

            width: 100%;
            height: 93px;
          }

          .quote-stamp-image {
            width: 145px;
            height: 93px;
            object-fit: contain;
          }

          .quote-stamp-placeholder {
            width: 145px;
            height: 93px;
          }

          .quote-stamp-caption {
            width: 100%;
            padding-top: 4px;

            border-top: 1px solid var(--line);

            color: var(--grey);
            font-size: 8pt;
            line-height: 1.2;
            text-align: center;
          }

          /*
           * ======================================================
           * FOOTER
           * ======================================================
           */

          .quote-footer {
            margin-top: auto;

            page-break-inside: avoid;
            break-inside: avoid;
          }

          .quote-contact {
            padding-top: 5px;

            color: var(--grey);
            font-size: 9pt;
            line-height: 1.35;
            text-align: center;
          }

          .quote-thank-you {
            display: flex;
            align-items: center;
            justify-content: center;

            height: 26px;
            margin-top: 7px;

            background: var(--navy);
            color: #ffffff;

            font-size: 11pt;
            font-weight: 700;
            text-align: center;
          }
        `}
      </style>

      <div className="quote-print-page">
        {/* ======================================================
            HEADER
        ====================================================== */}
        <header className="quote-header">
          <div className="quote-logo-wrap">
            {printAssets.logo && (
              <img src={printAssets.logo} alt="" className="quote-logo" />
            )}
          </div>

          <div className="quote-company">
            <div className="quote-company-name">
              {company?.legal_entity_name || "-"}
            </div>

            <div className="quote-company-meta">
              {company?.showroom_address || "-"}
            </div>

            <div className="quote-company-meta">
              Tel: {companyPhone || "-"}
              {companyWebsite ? `  |  ${companyWebsite}` : ""}
            </div>
          </div>

          <div className="quote-header-right">
            {company?.corporate_email && <div>{company.corporate_email}</div>}
          </div>
        </header>

        {/* ======================================================
            TITLE BAND
        ====================================================== */}
        <div className="quote-title-band">
          <div className="quote-title">{documentType}</div>

          <div className="quote-title-right">{purchaseType}</div>
        </div>

        {/* ======================================================
            REFERENCE STRIP
        ====================================================== */}
        <section className="quote-reference-strip">
          <div className="quote-reference-cell">
            <div className="quote-reference-label">{documentNumberLabel}</div>

            <div className="quote-reference-value">
              {quote.quote_number || "-"}
            </div>
          </div>

          <div className="quote-reference-cell">
            <div className="quote-reference-label">DATE</div>

            <div className="quote-reference-value">
              {formatDate(quote.date)}
            </div>
          </div>

          <div className="quote-reference-cell">
            <div className="quote-reference-label">CUSTOMER ID</div>

            <div className="quote-reference-value">{customer.id ?? "-"}</div>
          </div>

          <div className="quote-reference-cell">
            <div className="quote-reference-label">TRN</div>

            <div className="quote-reference-value">
              {company?.tax_registration_number || ""}
            </div>
          </div>
        </section>

        {/* ======================================================
            BANK / CUSTOMER
        ====================================================== */}
        <section className="quote-section">
          <div className="quote-party-grid">
            <div>
              <div className="quote-party-heading">
                {isFinance ? "BANK (FINANCED BY)" : "PAYMENT METHOD"}
              </div>

              <div className="quote-party-name">
                {isFinance ? finance.bank_name || "-" : "Cash"}
              </div>

              <div className="quote-party-meta">
                {isFinance ? bankAddress || "\u00A0" : "\u00A0"}
              </div>
            </div>

            <div>
              <div className="quote-party-heading">CUSTOMER</div>

              <div className="quote-party-name">{customer.name || "-"}</div>

              <div className="quote-party-meta">
                {customer.mobile ? `Mobile: ${customer.mobile}` : "\u00A0"}
              </div>

              <div className="quote-party-meta">
                {customerAddress || "\u00A0"}
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            VEHICLE DETAILS
        ====================================================== */}
        <section className="quote-section">
          <div className="quote-section-bar">VEHICLE DETAILS</div>

          <div className="quote-vehicle-row">
            <div className="quote-vehicle-label">Make &amp; Model</div>

            <div className="quote-vehicle-value">{vehicleName || "-"}</div>

            <div className="quote-vehicle-label">Year</div>

            <div className="quote-vehicle-value">{vehicle.year ?? "-"}</div>
          </div>

          <div className="quote-vehicle-row">
            <div className="quote-vehicle-label">Chassis No.</div>

            <div className="quote-vehicle-value">
              {vehicle.chassis_number || "-"}
            </div>

            <div className="quote-vehicle-label">Engine No.</div>

            <div className="quote-vehicle-value">
              {vehicle.engine_number || "-"}
            </div>
          </div>

          <div className="quote-vehicle-row">
            <div className="quote-vehicle-label">Colour</div>

            <div className="quote-vehicle-value">{vehicle.colour || "-"}</div>

            <div className="quote-vehicle-empty" />
            <div className="quote-vehicle-empty" />
          </div>
        </section>

        {/* ======================================================
            PRICE TABLE
        ====================================================== */}
        <section className="quote-section">
          <table className="quote-price-table">
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th>RATE</th>
                <th>AMOUNT (AED)</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="quote-price-description">Vehicle Amount</td>

                <td className="quote-price-rate">-</td>

                <td className="quote-price-amount">
                  {formatAmount(vehicleAmount)}
                </td>
              </tr>

              <tr>
                <td className="quote-price-description">VAT</td>

                <td className="quote-price-rate">{isCash ? "5%" : "-"}</td>

                <td className="quote-price-amount">
                  {isCash ? formatAmount(cashVatAmount) : "-"}
                </td>
              </tr>

              <tr>
                <td className="quote-price-description">Down Payment</td>

                <td className="quote-price-rate">
                  {isFinance ? downPaymentRate : "-"}
                </td>

                <td className="quote-price-amount">
                  {isFinance ? formatAmount(downPayment) : "-"}
                </td>
              </tr>

              <tr className="quote-total-row">
                <td colSpan="2" className="quote-price-description">
                  {isFinance ? "NET FINANCE AMOUNT" : "TOTAL PAYABLE"}
                </td>

                <td className="quote-price-amount">
                  {isFinance
                    ? formatAmount(financeAmount)
                    : formatAmount(cashTotalPayable)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {isCash && expenses.length > 0 && (
          <section className="quote-section quote-expense-summary">
            <div className="quote-expense-heading">EXPENSE SUMMARY</div>

            <div className="quote-expense-table">
              <div className="quote-expense-header">
                <div>EXPENSE</div>
                <div>STATUS</div>
                <div>AMOUNT (AED)</div>
              </div>

              {expenses.map((expense) => (
                <div
                  key={expense.id ?? `${expense.name}-${expense.actual_amount}`}
                  className="quote-expense-row"
                >
                  <div className="quote-expense-name">
                    {expense.name || "Expense"}
                  </div>

                  <div className="quote-expense-status">
                    {expense.applies === false ? "Not Applied" : "Applied"}
                  </div>

                  <div className="quote-expense-amount">
                    {formatAmount(expense.actual_amount)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ======================================================
            AMOUNT IN WORDS
        ====================================================== */}
        <section className="quote-section quote-words">
          <div className="quote-word-row">
            <div className="quote-word-label">Vehicle price in words</div>

            <div className="quote-word-value">
              {amountToWords(vehicleAmount)}
            </div>
          </div>

          {isFinance && (
            <div className="quote-word-row">
              <div className="quote-word-label">Net finance in words</div>

              <div className="quote-word-value">
                {hasValue(financeAmount) ? amountToWords(financeAmount) : "-"}
              </div>
            </div>
          )}
        </section>

        {/* ======================================================
            TERMS + STAMP
        ====================================================== */}
        <section className="quote-terms-stamp">
          <div>
            {documentType === "Quotation" && (
              <>
                <div className="quote-terms-heading">TERMS &amp; NOTES</div>

                <ol className="quote-terms-list">
                  <li>This quotation is valid for {validityDays} days only.</li>

                  <li>Any booking fee is non-refundable.</li>
                </ol>
              </>
            )}
          </div>

          <div className="quote-stamp-column">
            <div className="quote-stamp-image-wrap">
              {includeSealStamp && printAssets.sealStamp ? (
                <img
                  src={printAssets.sealStamp}
                  alt=""
                  className="quote-stamp-image"
                />
              ) : (
                <div className="quote-stamp-placeholder" />
              )}
            </div>

            <div className="quote-stamp-caption">
              Authorised Signature &amp; Stamp
            </div>
          </div>
        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}
        <footer className="quote-footer">
          <div className="quote-contact">
            For any questions about this quotation, please contact{" "}
            {companyPhone || "-"}
            {company?.corporate_email ? `  |  ${company.corporate_email}` : ""}
            {companyWebsite ? `  |  ${companyWebsite}` : ""}
          </div>

          <div className="quote-thank-you">Thank You For Your Business!</div>
        </footer>
      </div>
    </PrintDocument>
  );
}
