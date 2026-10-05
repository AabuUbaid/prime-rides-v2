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
  /*
   * Cash Quote:
   * quote.price is VAT-inclusive.
   * Recover the original VAT-exclusive vehicle price,
   * calculate 5% VAT on that base price, then add
   * any applied expenses to the final payable amount.
   */
  const downPayment = Number(quote.down_payment || 0);

  const financeAmount = Number(finance.finance_amount || 0);

  const inclusiveCashPrice = Number(quote.price || 0);

  const cashVehicleAmount = isCash
    ? inclusiveCashPrice / 1.05
    : inclusiveCashPrice;

  const cashVatAmount = isCash ? cashVehicleAmount * 0.05 : 0;

  const appliedExpenseTotal = isCash
    ? expenses.reduce((total, expense) => {
        if (expense?.applies === false) {
          return total;
        }

        return total + Number(expense?.actual_amount || 0);
      }, 0)
    : 0;

  const vehicleAmount = isFinance ? inclusiveCashPrice : cashVehicleAmount;

  const downPaymentRate = isFinance ? "20%" : "-";

  const cashTotalPayable =
    cashVehicleAmount + cashVatAmount + appliedExpenseTotal;

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

  const companyAddress = String(company?.showroom_address || "").trim();

  const isLongCompanyAddress =
    companyAddress.length > 90 || /\n/.test(companyAddress);

  return (
    <PrintDocument company={company} showHeader={false} showFooter={false}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0;
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
  width: 210mm !important;
  height: 296mm !important;
  min-height: 296mm !important;
  max-height: 296mm !important;

  box-sizing: border-box !important;

  display: flex !important;
  flex-direction: column !important;

  margin: 0 !important;
  padding: 10mm !important;

  overflow: hidden !important;

  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

          .quote-print-main {
            flex: 0 0 auto;
            width: 100%;
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

  min-height: 28px;
  height: auto;
  align-items: stretch;
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

          .quote-print-bottom {
            flex-shrink: 0;
            margin-top: auto;
            width: 100%;
            break-inside: avoid;
            page-break-inside: avoid;
          }

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
  top: -64px;
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
           * LONG COMPANY ADDRESS COMPRESSION
           * ======================================================
           */

        

          

          .quote-print-page--long-address .quote-company-meta {
            margin-top: 2px;
            line-height: 1.18;
          }

          .quote-print-page--long-address .quote-section {
            margin-top: 7px;
          }

          .quote-print-page--long-address .quote-reference-cell {
            min-height: 45px;
            padding-top: 5px;
            padding-bottom: 5px;
          }

          .quote-print-page--long-address .quote-party-name {
            margin-top: 4px;
          }

          .quote-print-page--long-address .quote-party-meta {
            margin-top: 2px;
            min-height: 12px;
          }

          .quote-print-page--long-address .quote-section-bar {
            height: 24px;
          }

          .quote-print-page--long-address .quote-vehicle-row {
            min-height: 21px;
            height: 21px;
          }

          .quote-print-page--long-address .quote-price-table th {
            height: 24px;
          }

          .quote-print-page--long-address .quote-price-table td {
            height: 22px;
          }

          .quote-print-page--long-address .quote-total-row td {
            height: 30px;
          }

          .quote-print-page--long-address .quote-expense-heading {
            height: 22px;
          }

          .quote-print-page--long-address .quote-expense-header {
            min-height: 20px;
          }

          .quote-print-page--long-address .quote-expense-row {
            min-height: 20px;
          }

          .quote-print-page--long-address .quote-word-row {
            min-height: 25px;
          }

          .quote-print-page--long-address .quote-terms-stamp {
            margin-top: 6px;
          }

          .quote-print-page--long-address .quote-terms-list {
            line-height: 1.35;
            margin-top: 4px;
          }

          .quote-print-page--long-address .quote-stamp-column {
            min-height: 96px;
          }
            .quote-print-page--long-address .quote-stamp-column {
  top: -64px;
}

          .quote-print-page--long-address .quote-stamp-image-wrap {
            height: 82px;
          }

          .quote-print-page--long-address .quote-stamp-placeholder,
          .quote-print-page--long-address .quote-stamp-image {
            height: 82px;
          }

          /*
           * ======================================================
           * FOOTER
           * ======================================================
           */

          .quote-footer {
  position: absolute;

  left: 10mm;
  right: 10mm;
  bottom: 10mm;

  width: auto;
  height: 11mm;

  margin: 0;
  padding: 0;

  display: block;

  overflow: hidden;

  page-break-inside: avoid;
  break-inside: avoid;
}

          .quote-contact {
  position: absolute;

  left: 0;
  right: 0;
  bottom: 28px;

  width: 100%;
  height: 12px;

  margin: 0;
  padding: 0;

  color: var(--grey);
  font-size: 9pt;
  line-height: 12px;

  text-align: center;
  white-space: nowrap;
}

          .quote-thank-you {
  position: absolute;

  left: 0;
  right: 0;
  bottom: 0;

  width: 100%;
  height: 26px;

  margin: 0;
  padding: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background: var(--navy);
  color: #ffffff;

  font-size: 11pt;
  font-weight: 700;
  line-height: 1;

  text-align: center;

  page-break-inside: avoid;
  break-inside: avoid;
}

          @media print {
            html,
            body,
            #root {
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            body {
              font-family: Arial, Helvetica, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              overflow: visible !important;
            }

            .print-area {
              display: block !important;
              position: static !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: visible !important;
            }

            .print-document {
              display: block !important;
              position: static !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              border: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
            }

            .quote-print-page {
  width: 210mm !important;
  height: 296mm !important;
  min-height: 296mm !important;
  max-height: 296mm !important;

  box-sizing: border-box !important;

  display: flex !important;
  flex-direction: column !important;

  margin: 0 !important;
  padding: 10mm !important;
f
  overflow: hidden !important;

  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

            .quote-print-main {
              flex: 0 0 auto !important;
              width: 100% !important;
            }

            .quote-print-bottom {
              flex-shrink: 0 !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            @media print {
  .quote-footer {
  position: absolute !important;

  left: 10mm !important;
  right: 10mm !important;
  bottom: 10mm !important;

  width: auto !important;
  height: 11mm !important;

  margin: 0 !important;
  padding: 0 !important;

  display: block !important;

  overflow: hidden !important;

  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

.quote-contact {
  position: absolute !important;

  left: 0 !important;
  right: 0 !important;
  bottom: 28px !important;

  width: 100% !important;
  height: 12px !important;

  margin: 0 !important;
  padding: 0 !important;

  line-height: 12px !important;
  white-space: nowrap !important;
}

.quote-thank-you {
  position: absolute !important;

  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;

  width: 100% !important;
  height: 26px !important;

  margin: 0 !important;
  padding: 0 !important;

  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

}

            

            
          }
        `}
      </style>

      <div
        className={`quote-print-page${
          isLongCompanyAddress ? " quote-print-page--long-address" : ""
        }`}
      >
        <div className="quote-print-main">
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

                {isCash && (
                  <tr>
                    <td className="quote-price-description">VAT</td>

                    <td className="quote-price-rate">
                      {cashVatAmount > 0 ? "5%" : "-"}
                    </td>

                    <td className="quote-price-amount">
                      {cashVatAmount > 0 ? formatAmount(cashVatAmount) : "-"}
                    </td>
                  </tr>
                )}

                {isCash && appliedExpenseTotal > 0 && (
                  <tr>
                    <td className="quote-price-description">Expense</td>
                    <td className="quote-price-rate">-</td>
                    <td className="quote-price-amount">
                      {formatAmount(appliedExpenseTotal)}
                    </td>
                  </tr>
                )}

                {isFinance && (
                  <tr>
                    <td className="quote-price-description">Down Payment</td>

                    <td className="quote-price-rate">{downPaymentRate}</td>

                    <td className="quote-price-amount">
                      {formatAmount(downPayment)}
                    </td>
                  </tr>
                )}

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
                    key={
                      expense.id ?? `${expense.name}-${expense.actual_amount}`
                    }
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
        </div>

        {/* ======================================================
            TERMS + STAMP
        ====================================================== */}
        <section className="quote-print-bottom">
          <div className="quote-terms-stamp">
            <div>
              {documentType === "Quotation" && (
                <>
                  <div className="quote-terms-heading">TERMS &amp; NOTES</div>

                  <ol className="quote-terms-list">
                    <li>
                      This quotation is valid for {validityDays} days only.
                    </li>

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
