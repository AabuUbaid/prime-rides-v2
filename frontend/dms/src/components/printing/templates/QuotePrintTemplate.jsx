import PrintDocument from "../PrintDocument";

const QUOTATION_LOGO = "/prime_rides_logo_gold_trimmed.png";

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

  if (!Number.isFinite(number) || number === 0) {
    return number === 0 ? "-" : String(value);
  }

  return number.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function numericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function amountToWords(value) {
  const number = numericValue(value);
  const rounded = Math.round((number + Number.EPSILON) * 100) / 100;

  if (rounded === 0) {
    return "Zero";
  }

  const smallNumbers = [
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

  const tens = [
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

  function belowThousand(valueToConvert) {
    if (valueToConvert < 20) {
      return smallNumbers[valueToConvert];
    }

    if (valueToConvert < 100) {
      const tensValue = Math.floor(valueToConvert / 10);
      const remainder = valueToConvert % 10;
      return remainder
        ? `${tens[tensValue]}-${smallNumbers[remainder]}`
        : tens[tensValue];
    }

    const hundreds = Math.floor(valueToConvert / 100);
    const remainder = valueToConvert % 100;

    return remainder
      ? `${smallNumbers[hundreds]} Hundred ${belowThousand(remainder)}`
      : `${smallNumbers[hundreds]} Hundred`;
  }

  function wholeNumberToWords(valueToConvert) {
    if (valueToConvert === 0) {
      return "Zero";
    }

    let remainder = Math.floor(valueToConvert);
    const parts = [];
    const scales = [
      [1000000000, "Billion"],
      [1000000, "Million"],
      [1000, "Thousand"],
    ];

    for (const [scale, label] of scales) {
      if (remainder >= scale) {
        const scaled = Math.floor(remainder / scale);
        parts.push(`${belowThousand(scaled)} ${label}`);
        remainder %= scale;
      }
    }

    if (remainder > 0) {
      parts.push(belowThousand(remainder));
    }

    return parts.join(" ");
  }

  const whole = Math.floor(rounded);
  const fils = Math.round((rounded - whole) * 100);

  if (fils > 0) {
    return `UAE Dirhams ${wholeNumberToWords(whole)} and ${wholeNumberToWords(fils)} Fils Only`;
  }

  return `UAE Dirhams ${wholeNumberToWords(whole)} Only`;
}

function vehicleValueClass(value) {
  const length = String(value ?? "-").length;

  if (length >= 29) {
    return "vehicle-value--xs";
  }

  if (length >= 23) {
    return "vehicle-value--sm";
  }

  return "vehicle-value--regular";
}

function getAppliedExpenseTotal(expenses) {
  return expenses.reduce((total, expense) => {
    if (expense?.applies === false) {
      return total;
    }

    return total + numericValue(expense?.actual_amount);
  }, 0);
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
  const expenses = Array.isArray(quote.expenses) ? quote.expenses : [];

  const isFinance = quote.payment_method === "Finance";
  const isCash = quote.payment_method === "Cash";
  const isCompact = isCash && expenses.length >= 7;
  const hasDenseExpenses = expenses.length >= 9;

  const vehicleName = [vehicle.make, vehicle.model, vehicle.variant]
    .filter(Boolean)
    .join(" ");

  const companyName =
    company?.legal_entity_name || "Prime Rides Cars Trading LLC";
  const companyAddress = String(company?.showroom_address || "").trim();
  const companyPhone =
    company?.official_phone || company?.main_contact_mobile || "";
  const companyEmail = company?.corporate_email || "";

  const documentNumberLabel =
    documentType === "Proforma Invoice"
      ? "PROFORMA INVOICE #"
      : documentType === "Invoice"
        ? "INVOICE #"
        : "QUOTATION #";

  const purchaseType = isFinance ? "Vehicle Finance" : "Cash Purchase";

  /*
   * Only existing Quote print-contract values are consumed here.
   * No API/data-source changes are made in this template.
   *
   * Cash Quote current contract:
   * quote.price = vehicle base + VAT + applicable expenses.
   * Therefore the displayed components are derived only for rendering
   * because the current print endpoint does not expose component totals.
   *
   * Finance Quote current contract:
   * quote.price = historical vehicle amount for the quote,
   * finance.finance_amount = historical net finance amount.
   */
  const vatAmount = numericValue(isFinance ? finance.vat_amount : vat.amount);
  const appliedExpenseTotal = isCash
    ? getAppliedExpenseTotal(expenses)
    : numericValue(finance.expense_total);

  const totalPayable = isCash ? numericValue(quote.price) : null;
  const vehicleAmount = isCash
    ? Math.max(totalPayable - vatAmount - appliedExpenseTotal, 0)
    : numericValue(quote.price);

  const financeAmount = isFinance ? numericValue(finance.finance_amount) : null;

  const downPayment = isFinance ? numericValue(quote.down_payment) : 0;

  const vatRate = vatAmount > 0 ? "5%" : "-";

  const validityDays = validity.days ?? (isCash ? 7 : 30);

  const pageClasses = [
    "quote-page",
    isCompact ? "is-compact" : "",
    hasDenseExpenses ? "has-dense-expenses" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PrintDocument company={company} showHeader={false} showFooter={false}>
      <style>
        {`
          @page {
  size: 210mm 297mm;
  margin: 0;
}

.quote-page,
.quote-page *,
.quote-page *::before,
.quote-page *::after {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.quote-page {
  --black: #111111;
  --gold: #B8913A;
  --cream: #FAF5E8;
  --hairline: #E9DFC4;
  --ink: #1A1A1A;
  --muted-label: #777777;
  --muted: #888888;
  --body: #444444;
  --contact: #555555;
  --header-text: #BBBBBB;

  width: 794px;
  height: 1123px;
  min-height: 1123px;
  max-height: 1123px;
  margin: 0;
  padding: 0 36px 80px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: var(--ink);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  line-height: 1.2;
}

/* ---------- HEADER ---------- */
.quote-page .quote-header {
  position: relative;
  flex: 0 0 142px;
  width: calc(100% + 72px);
  height: 142px;
  margin: 0 -36px;
  background: var(--black);
  border-bottom: 4px solid var(--gold);
  overflow: hidden;
}

.quote-page .quote-logo {
  position: absolute;
  left: 36px;
  top: 30.5px;
  width: 189.8px;
  height: 78px;
  display: block;
  object-fit: contain;
  object-position: left center;
}

.quote-page .quote-company-block {
  position: absolute;
  left: 241.8px;
  top: 30px;
  width: 400px;
  max-width: 400px;
  overflow: hidden;
}

.quote-page .quote-company-name {
  color: var(--gold);
  font-family: "Times New Roman", Times, serif;
  font-size: 26px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: 1px;
  white-space: nowrap;
}

.quote-page .quote-company-name.is-long {
  font-size: 20px;
}

.quote-page .quote-company-meta {
  max-width: 440px;
  margin-top: 4px;
  color: var(--header-text);
  font-size: 11.5px;
  line-height: 16px;
  font-weight: 400;
}

.quote-page .quote-header-contact {
  margin-top: 4px;
  color: var(--header-text);
  font-size: 11.5px;
  line-height: 16px;
  white-space: nowrap;
}

/* ---------- TITLE ROW ---------- */
.quote-page .quote-title-row {
  flex: 0 0 46px;
  height: 46px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--gold);
}

.quote-page .quote-title {
  color: var(--gold);
  font-family: "Times New Roman", Times, serif;
  font-size: 30px;
  line-height: 1;
  font-weight: 400;
  font-style: italic;
}

.quote-page .quote-title-right {
  color: var(--black);
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12.9px;
  line-height: 1;
  font-weight: 400;
}

/* ---------- REFERENCE STRIP ---------- */
.quote-page .quote-reference-strip {
  flex: 0 0 49px;
  height: 49px;
  margin-top: 10px;
  display: grid;
  grid-template-columns: 148.5px 176.3px 148.5px 1fr;
  background: var(--cream);
  border-left: 3px solid var(--gold);
}

.quote-page .quote-reference-cell {
  padding: 8px 12px;
}

.quote-page .quote-reference-label {
  color: var(--gold);
  font-size: 10.5px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.58px;
}

.quote-page .quote-reference-value {
  margin-top: 3px;
  color: var(--ink);
  font-size: 14.9px;
  line-height: 1.1;
  font-weight: 700;
  white-space: nowrap;
}

/* ---------- PARTIES ---------- */
.quote-page .quote-parties {
  flex: 0 0 72px;
  height: 72px;
  margin-top: 0;
  padding-top: 15px;
}

.quote-page .quote-party-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
}

.quote-page .quote-party {
  height: 57px;
  border-bottom: 1px solid var(--gold);
  overflow: hidden;
}

.quote-page .quote-party-heading {
  color: var(--gold);
  font-size: 10.9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.65px;
  text-transform: uppercase;
}

.quote-page .quote-party-name {
  margin-top: 8px;
  color: var(--ink);
  font-size: 14.9px;
  line-height: 1.05;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quote-page .quote-party-meta {
  margin-top: 4px;
  color: var(--muted-label);
  font-size: 10.9px;
  line-height: 13px;
}

/* ---------- SECTIONS ---------- */
.quote-page .quote-section {
  flex: 0 0 auto;
  width: 100%;
  margin-top: 16px;
}

.quote-page .quote-vehicle-section {
  margin-top: 16px;
}

.quote-page .quote-section-bar {
  height: 30px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  background: var(--black);
  color: var(--gold);
  font-family: "Times New Roman", Times, serif;
  font-size: 12.9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* ---------- VEHICLE DETAILS ---------- */
.quote-page .quote-vehicle-row {
  width: 100%;
  display: grid;
  grid-template-columns: 110px 261px 90px 261px;
}

.quote-page .quote-vehicle-row.row-tall {
  min-height: 47px;
}

.quote-page .quote-vehicle-row.row-regular {
  min-height: 32px;
}

.quote-page .quote-vehicle-label,
.quote-page .quote-vehicle-value,
.quote-page .quote-vehicle-empty {
  min-width: 0;
  border-top: 1px solid var(--hairline);
}

.quote-page .quote-vehicle-row:last-child > * {
  border-bottom: 1px solid var(--hairline);
}

.quote-page .quote-vehicle-label {
  padding: 8px 12px;
  color: var(--muted-label);
  background: var(--cream);
  font-size: 12.9px;
  line-height: 15px;
  font-weight: 700;
}

.quote-page .quote-vehicle-value {
  padding: 8px 12px;
  color: var(--ink);
  background: #ffffff;
  font-size: 12.9px;
  line-height: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

.quote-page .quote-vehicle-value.vehicle-value--sm {
  font-size: 11.5px;
}

.quote-page .quote-vehicle-value.vehicle-value--xs {
  font-size: 10.5px;
}

.quote-page .quote-vehicle-empty {
  background: #ffffff;
}

/* ---------- PRICE TABLE ---------- */
.quote-page .quote-price-section {
  margin-top: 12px;
}

.quote-page .quote-price-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.quote-page .quote-price-table th {
  height: 31px;
  padding: 0 12px;
  background: var(--black);
  color: var(--gold);
  font-family: "Times New Roman", Times, serif;
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
}

.quote-page .quote-price-table th:nth-child(1) {
  width: 40%;
  text-align: left;
}

.quote-page .quote-price-table th:nth-child(2) {
  width: 20%;
  text-align: center;
}

.quote-page .quote-price-table th:nth-child(3) {
  width: 40%;
  text-align: right;
}

.quote-page .quote-price-table td {
  height: 30px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--hairline);
  color: var(--ink);
  background: #ffffff;
  font-size: 12.9px;
  line-height: 16px;
  font-weight: 400;
}

.quote-page .quote-price-rate {
  text-align: center;
}

.quote-page .quote-price-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.quote-page .quote-total-row td {
  height: 33px;
  padding-top: 5px;
  padding-bottom: 5px;
  background: var(--black);
  color: var(--gold);
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  line-height: 1;
  font-weight: 700;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}

.quote-page .quote-total-row .quote-price-amount {
  font-size: 16px;
}

/* ---------- EXPENSE SUMMARY ---------- */
.quote-page .quote-expense-section {
  margin-top: 12px;
}

.quote-page .quote-expense-heading {
  height: 30px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  background: var(--black);
  color: var(--gold);
  font-family: "Times New Roman", Times, serif;
  font-size: 12.9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.quote-page .quote-expense-header,
.quote-page .quote-expense-row {
  display: grid;
  grid-template-columns: 48% 20% 32%;
}

.quote-page .quote-expense-header {
  height: 27px;
  align-items: center;
  background: var(--black);
  color: var(--gold);
  font-family: "Times New Roman", Times, serif;
  font-size: 10.5px;
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
}

.quote-page .quote-expense-header > div,
.quote-page .quote-expense-row > div {
  padding: 0 12px;
}

.quote-page .quote-expense-header > div:nth-child(2),
.quote-page .quote-expense-row > div:nth-child(2),
.quote-page .quote-expense-header > div:nth-child(3),
.quote-page .quote-expense-row > div:nth-child(3) {
  text-align: right;
}

.quote-page .quote-expense-body {
  width: 100%;
}

.quote-page .quote-expense-row {
  height: 29px;
  align-items: center;
  border-top: 1px solid var(--hairline);
  color: var(--ink);
  font-size: 12.5px;
  line-height: 1;
}

.quote-page .quote-expense-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quote-page .quote-expense-status {
  color: var(--muted);
}

.quote-page .quote-expense-amount {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* ---------- AMOUNT IN WORDS ---------- */
.quote-page .quote-words-section {
  margin-top: 0;
}

.quote-page .quote-word-row {
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 24px;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}

.quote-page .quote-word-label {
  flex: 0 0 auto;
  color: var(--muted-label);
  font-size: 10.9px;
  line-height: 1;
  font-weight: 700;
}

.quote-page .quote-word-value {
  min-width: 0;
  color: var(--body);
  font-size: 12px;
  line-height: 1.2;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- TERMS + SIGNATURE (pinned above footer) ---------- */
.quote-page .quote-bottom {
  width: 100%;
  height: 59.3px;
  min-height: 59.3px;
  margin-top: auto;
  display: grid;
  grid-template-columns: 346px 346px;
  column-gap: 30px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.quote-page .quote-terms {
  height: 59.3px;
}

.quote-page .quote-terms-heading {
  padding-bottom: 4px;
  border-bottom: 1px solid var(--gold);
  color: var(--gold);
  font-size: 10.5px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.58px;
}

.quote-page .quote-terms-list {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  color: var(--body);
  font-size: 12px;
  line-height: 19px;
}

.quote-page .quote-terms-list li {
  margin: 0;
  padding: 0;
}

.quote-page .quote-signature {
  height: 59.3px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
}

.quote-page .quote-signature-space {
  position: relative;
  flex: 0 0 auto;
  height: 40.4px;
  min-height: 40.4px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
}

.quote-page .quote-seal-stamp {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  max-width: 300px;
  max-height: 100px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  z-index: 20;
}

.quote-page .quote-signature-caption {
  flex: 0 0 auto;
  padding-top: 7px;
  border-top: 1px solid var(--hairline);
  color: var(--muted);
  font-size: 10.9px;
  line-height: 1;
  text-align: center;
}

/* ---------- FOOTER ---------- */
.quote-page .quote-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 65px;
  margin: 0;
  padding: 0;
  overflow: visible;
  pointer-events: none;
}

.quote-page .quote-system-disclaimer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 66px;
  width: 100%;
  height: 12px;
  color: var(--muted);
  font-size: 9.5px;
  line-height: 12px;
  text-align: center;
  white-space: nowrap;
  z-index: 10;
}

.quote-page .quote-contact {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 50px;
  width: 100%;
  height: 15px;
  color: var(--contact);
  font-size: 11.5px;
  line-height: 15px;
  text-align: center;
  white-space: nowrap;
  z-index: 10;
}

.quote-page .quote-thank-you {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 40px;
  border-top: 4px solid var(--gold);
  background: var(--black);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
  font-family: "Times New Roman", Times, serif;
  font-size: 14px;
  line-height: 1;
  font-style: italic;
  letter-spacing: 3px;
  text-align: center;
  z-index: 1;
}

/* ---------- COMPACT MODE (7+ expense rows) ---------- */
.quote-page.is-compact .quote-price-table td {
  height: 28px;
  padding-top: 6px;
  padding-bottom: 6px;
}

.quote-page.is-compact .quote-expense-header {
  height: 24px;
}

.quote-page.is-compact .quote-expense-body {
  height: 192px;
  display: flex;
  flex-direction: column;
}

.quote-page.is-compact .quote-expense-row {
  flex: 1 1 0;
  height: auto;
  min-height: 0;
  font-size: 12px;
}

.quote-page.is-compact .quote-word-row {
  height: 30px;
  padding-top: 9px;
  padding-bottom: 9px;
}

/* 22px minimum gap + 59.3px content = 81.3px block */
.quote-page.is-compact .quote-bottom {
  height: 81.3px;
  min-height: 81.3px;
  padding-top: 22px;
}

/* 9+ rows: rows are under 22px tall */
.quote-page.has-dense-expenses .quote-expense-row {
  font-size: 11px;
}

/* ---------- PRINT: exactly one A4 page, no wrapper offset ---------- */
@media print {
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 210mm !important;
    height: 296mm !important;
    max-height: 296mm !important;
    border: 0 !important;
    background: #ffffff !important;
    overflow: hidden !important;
    font-family: Arial, Helvetica, sans-serif !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #root {
    margin: 0 !important;
    padding: 0 !important;
    width: 210mm !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    border: 0 !important;
    background: #ffffff !important;
    overflow: visible !important;
  }

  #root > *,
  .print-area,
  .print-document,
  .print-document > main {
    display: block !important;
    position: static !important;
    width: 210mm !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    box-shadow: none !important;
    background: #ffffff !important;
    overflow: visible !important;
    transform: none !important;
    filter: none !important;
    zoom: 1 !important;
  }

  .print-document {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }

  /* The quote leaves the normal flow, so wrapper padding can no longer
     push it down or sideways, and nothing can spill onto a second page. */
  .quote-page {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: auto !important;
    bottom: auto !important;
    margin: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    padding: 0 36px 80px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .quote-page .quote-footer {
    bottom: 0 !important;
    overflow: visible !important;
  }
}
        `}
      </style>

      <div className={pageClasses}>
        <header className="quote-header">
          <img src={QUOTATION_LOGO} alt="Prime Rides" className="quote-logo" />

          <div className="quote-company-block">
            <div
              className={`quote-company-name${
                companyName.length > 28 ? " is-long" : ""
              }`}
            >
              {companyName}
            </div>

            <div className="quote-company-meta">{companyAddress || "-"}</div>

            <div className="quote-header-contact">
              Tel: {companyPhone || "-"}
              {companyEmail ? ` | ${companyEmail}` : ""}
            </div>
          </div>
        </header>

        <div className="quote-title-row">
          <div className="quote-title">{documentType}</div>
          <div className="quote-title-right">{purchaseType}</div>
        </div>

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
              {company?.tax_registration_number || "-"}
            </div>
          </div>
        </section>

        <section className="quote-parties">
          <div className="quote-party-grid">
            <div className="quote-party">
              <div className="quote-party-heading">
                {isFinance ? "ADDRESS TO BANK (FINANCED BY)" : "PAYMENT METHOD"}
              </div>

              <div className="quote-party-name">
                {isFinance ? finance.bank_name || "-" : "Cash"}
              </div>

              {isFinance ? (
                finance.bank_address ? (
                  <div className="quote-party-meta">{finance.bank_address}</div>
                ) : null
              ) : null}
            </div>

            <div className="quote-party">
              <div className="quote-party-heading">CUSTOMER</div>
              <div className="quote-party-name">{customer.name || "-"}</div>
              <div className="quote-party-meta">
                {customer.mobile ? `Mobile: ${customer.mobile}` : ""}
              </div>
            </div>
          </div>
        </section>

        <section className="quote-section quote-vehicle-section">
          <div className="quote-section-bar">VEHICLE DETAILS</div>

          <div className="quote-vehicle-row row-tall">
            <div className="quote-vehicle-label">Make &amp; Model</div>
            <div
              className={`quote-vehicle-value ${vehicleValueClass(vehicleName)}`}
            >
              {vehicleName || "-"}
            </div>
            <div className="quote-vehicle-label">Year</div>
            <div className="quote-vehicle-value">{vehicle.year ?? "-"}</div>
          </div>

          <div className="quote-vehicle-row row-tall">
            <div className="quote-vehicle-label">Chassis No.</div>
            <div
              className={`quote-vehicle-value ${vehicleValueClass(
                vehicle.chassis_number,
              )}`}
            >
              {vehicle.chassis_number || "-"}
            </div>
            <div className="quote-vehicle-label">Engine No.</div>
            <div
              className={`quote-vehicle-value ${vehicleValueClass(
                vehicle.engine_number,
              )}`}
            >
              {vehicle.engine_number || "-"}
            </div>
          </div>

          <div className="quote-vehicle-row row-regular">
            <div className="quote-vehicle-label">Colour</div>
            <div className="quote-vehicle-value">{vehicle.colour || "-"}</div>
            <div className="quote-vehicle-empty" />
            <div className="quote-vehicle-empty" />
          </div>
        </section>

        <section className="quote-section quote-price-section">
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
                <td>Vehicle Amount</td>
                <td className="quote-price-rate">-</td>
                <td className="quote-price-amount">
                  {formatAmount(vehicleAmount)}
                </td>
              </tr>

              <tr>
                <td>VAT</td>
                <td className="quote-price-rate">{vatRate}</td>
                <td className="quote-price-amount">
                  {formatAmount(vatAmount)}
                </td>
              </tr>

              {isCash ? (
                <tr>
                  <td>Expense</td>
                  <td className="quote-price-rate">-</td>
                  <td className="quote-price-amount">
                    {formatAmount(appliedExpenseTotal)}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td>Down Payment</td>
                  <td className="quote-price-rate">20%</td>
                  <td className="quote-price-amount">
                    {formatAmount(downPayment)}
                  </td>
                </tr>
              )}

              <tr className="quote-total-row">
                <td colSpan="2">
                  {isFinance ? "NET FINANCE AMOUNT" : "TOTAL PAYABLE"}
                </td>
                <td className="quote-price-amount">
                  {isFinance
                    ? formatAmount(financeAmount)
                    : formatAmount(totalPayable)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {isCash && expenses.length > 0 ? (
          <section className="quote-section quote-expense-section">
            <div className="quote-expense-heading">EXPENSE SUMMARY</div>

            <div className="quote-expense-header">
              <div>EXPENSE</div>
              <div>STATUS</div>
              <div>AMOUNT (AED)</div>
            </div>

            <div className="quote-expense-body">
              {expenses.map((expense, index) => (
                <div
                  key={
                    expense.id ??
                    `${expense.name || "Expense"}-${expense.actual_amount}-${index}`
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
        ) : null}

        <section className="quote-section quote-words-section">
          <div className="quote-word-row">
            <div className="quote-word-label">Vehicle price in words</div>
            <div className="quote-word-value">
              {amountToWords(vehicleAmount)}
            </div>
          </div>
        </section>

        <section className="quote-bottom">
          <div className="quote-terms">
            {documentType === "Quotation" ? (
              <>
                <div className="quote-terms-heading">TERMS &amp; NOTES</div>
                <ul className="quote-terms-list">
                  <li>This quotation is valid for {validityDays} days only.</li>
                  <li>Any booking fee is non-refundable.</li>
                </ul>
              </>
            ) : null}
          </div>

          <div className="quote-signature">
            <div className="quote-signature-space">
              {includeSealStamp && printAssets.sealStamp ? (
                <img
                  src={printAssets.sealStamp}
                  alt="Company Seal & Stamp"
                  className="quote-seal-stamp"
                />
              ) : null}
            </div>

            <div className="quote-signature-caption">
              Authorised Signature & Stamp
            </div>
          </div>
        </section>

        {includeSealStamp && printAssets.sealStamp ? (
          <div className="quote-system-disclaimer">
            * This is a system generated document.
          </div>
        ) : null}

        <footer className="quote-footer">
          {includeSealStamp && printAssets.sealStamp ? (
            <div className="quote-system-disclaimer">
              * This is a system generated document.
            </div>
          ) : null}

          <div className="quote-contact">
            For any questions about this quotation, please contact{" "}
            {companyPhone || "-"}
            {companyEmail ? ` | ${companyEmail}` : ""}
          </div>
          <div className="quote-thank-you">Thank You For Your Business!</div>
        </footer>
      </div>
    </PrintDocument>
  );
}
