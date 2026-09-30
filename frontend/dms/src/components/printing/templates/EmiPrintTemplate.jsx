function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "AED 0.00";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "AED 0.00";
  }

  return `AED ${numericValue.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAmountWithoutCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "0.00";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0.00";
  }

  return numericValue.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMileage(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return `${numericValue.toLocaleString("en-AE")} km`;
}

function numberToWordsBelowThousand(number) {
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

  if (number < 20) {
    return smallNumbers[number];
  }

  if (number < 100) {
    const tensValue = Math.floor(number / 10);
    const remainder = number % 10;

    return remainder
      ? `${tens[tensValue]}-${smallNumbers[remainder]}`
      : tens[tensValue];
  }

  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;

  return remainder
    ? `${smallNumbers[hundreds]} Hundred ${numberToWordsBelowThousand(
        remainder,
      )}`
    : `${smallNumbers[hundreds]} Hundred`;
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
    return `${numberToWords(whole)} Dirhams and ${numberToWords(
      fils,
    )} Fils Only`;
  }

  return `${numberToWords(whole)} Dirhams Only`;
}

function ReferenceCell({ label, value, last = false }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        padding: "5px 8px",
        borderRight: last ? "0" : "1px solid var(--line)",
        boxSizing: "border-box",
      }}
    >
      <div className="emi-print-ref-label">{label}</div>

      <div className="emi-print-ref-value">{displayValue(value)}</div>
    </div>
  );
}

function DetailCell({ label, value }) {
  return (
    <div className="emi-print-detail-cell">
      <div className="emi-print-detail-label">{label}</div>

      <div className="emi-print-detail-value">{displayValue(value)}</div>
    </div>
  );
}

function SectionBand({ title, rightText = "" }) {
  return (
    <div className="emi-print-section-band">
      <span>{title}</span>

      {rightText ? <span>{rightText}</span> : null}
    </div>
  );
}

function getExpenseDisplayName(expense) {
  if (expense?.name !== null && expense?.name !== undefined) {
    const name = String(expense.name).trim();

    if (name) {
      return name;
    }
  }

  if (expense?.expense_type !== null && expense?.expense_type !== undefined) {
    const type = String(expense.expense_type).trim();

    if (type) {
      return type;
    }
  }

  return "-";
}

export default function EmiPrintTemplate({
  emi,
  company,
  printAssets = {},
  includeSealStamp = false,
}) {
  if (!emi) {
    return null;
  }

  const expenses = Array.isArray(emi.expenses) ? emi.expenses : [];

  const vehicleName = [emi.vehicle_make, emi.vehicle_model, emi.vehicle_variant]
    .filter(Boolean)
    .join(" ");

  const tenureLabel =
    emi.tenure_years === null || emi.tenure_years === undefined
      ? "-"
      : `${emi.tenure_years} ${
          Number(emi.tenure_years) === 1 ? "Year" : "Years"
        }`;

  const financeAmount = emi.finance_amount;

  return (
    <>
      <style>
        {`
          :root {
            --navy: #1F2A6E;
            --light: #F2F4F8;
            --pale: #E4E8F5;
            --grey: #6B7280;
            --line: #D5D9E2;
            --text: #222222;
            --soft: #C9D0F5;
          }

          .emi-print-sheet {
            position: relative;
            width: 100%;
            height: 274mm;
            min-height: 274mm;
            max-height: 274mm;
            box-sizing: border-box;

            display: flex;
            flex-direction: column;

            font-family: Arial, Helvetica, sans-serif;
            color: var(--text);
            font-size: 8px;
            line-height: 1.25;

            overflow: visible;
          }

          .emi-print-main {
            flex: 0 0 auto;
            width: 100%;
          }

          .emi-print-sheet,
          .emi-print-sheet * {
            box-sizing: border-box;
          }

          .emi-print-header {
            display: grid;
            grid-template-columns: 135px 1fr 185px;
            column-gap: 12px;
            align-items: center;
            padding-bottom: 7px;
            border-bottom: 2px solid var(--navy);
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-logo {
            width: 135px;
            height: 69px;
            object-fit: contain;
            object-position: left center;
            display: block;
          }

          .emi-print-company-name {
            font-size: 18pt;
            line-height: 1.05;
            font-weight: 700;
            color: var(--navy);
          }

          .emi-print-company-meta {
            margin-top: 4px;
            font-size: 9pt;
            line-height: 1.25;
            color: var(--grey);
          }

          .emi-print-header-meta {
            text-align: right;
            font-size: 8.5pt;
            line-height: 1.7;
            color: var(--text);
          }

          .emi-print-header-meta strong {
            font-weight: 700;
          }

          .emi-print-title-band {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 28px;
            margin-top: 6px;
            padding: 0 10px;
            background: var(--navy);
            color: #ffffff;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-title {
            font-size: 16pt;
            line-height: 1;
            font-weight: 700;
          }

          .emi-print-title-side {
            font-size: 10pt;
            line-height: 1;
            font-weight: 400;
          }

          .emi-print-reference {
            display: flex;
            min-height: 38px;
            margin-top: 5px;
            background: var(--light);
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-ref-label {
            font-size: 7pt;
            line-height: 1.1;
            font-weight: 700;
            color: var(--grey);
            text-transform: uppercase;
          }

          .emi-print-ref-value {
            margin-top: 2px;
            font-size: 10pt;
            line-height: 1.1;
            font-weight: 700;
            color: var(--text);
            word-break: break-word;
          }

          .emi-print-hero {
            display: grid;
            grid-template-columns: 56% 44%;
            margin-top: 12px;
            border: 2px solid var(--navy);
            min-height: 86px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-hero-main {
            padding: 12px 16px;
            background: var(--navy);
            color: #ffffff;
          }

          .emi-print-hero-label {
            font-size: 9pt;
            line-height: 1.1;
            letter-spacing: 1px;
            font-weight: 700;
            color: var(--soft);
          }

          .emi-print-hero-amount {
            margin-top: 4px;
            font-size: 34px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: -0.5px;
            white-space: nowrap;
          }

          .emi-print-hero-amount small {
            font-size: 13px;
            vertical-align: middle;
            margin-right: 5px;
            font-weight: 700;
          }

          .emi-print-hero-sub {
            margin-top: 5px;
            font-size: 7.5pt;
            line-height: 1.25;
            color: var(--soft);
          }

          .emi-print-hero-side {
            display: grid;
            grid-template-rows: 1fr 1fr;
            background: #ffffff;
          }

          .emi-print-hero-side-item {
            padding: 8px 11px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .emi-print-hero-side-item + .emi-print-hero-side-item {
            border-top: 1px solid var(--line);
          }

          .emi-print-hero-side-label {
            font-size: 7pt;
            line-height: 1.1;
            font-weight: 700;
            color: var(--grey);
            text-transform: uppercase;
          }

          .emi-print-hero-side-value {
            margin-top: 3px;
            font-size: 12pt;
            line-height: 1.1;
            font-weight: 800;
            color: var(--navy);
          }

          .emi-print-two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 9px;
            margin-top: 7px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-column-title {
            padding-bottom: 3px;
            border-bottom: 1px solid var(--navy);
            font-size: 8pt;
            line-height: 1.15;
            font-weight: 700;
            color: var(--navy);
            text-transform: uppercase;
          }

          .emi-print-column-content {
            padding: 5px 6px 4px;
          }

          .emi-print-primary {
            font-size: 9pt;
            line-height: 1.2;
            font-weight: 700;
            color: var(--text);
          }

          .emi-print-secondary {
            margin-top: 2px;
            font-size: 7.5pt;
            line-height: 1.2;
            color: var(--grey);
          }

          .emi-print-section-band {
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 21px;
            margin-top: 7px;
            padding: 0 8px;
            background: var(--navy);
            color: #ffffff;
            font-size: 8pt;
            line-height: 1;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-detail-grid {
            display: grid;
            grid-template-columns: repeat(4, 25%);
            border-bottom: 1px solid var(--line);
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-detail-cell {
            min-width: 0;
            padding: 4px 7px;
            border-bottom: 1px solid var(--line);
          }

          .emi-print-detail-label {
            font-size: 6.8pt;
            line-height: 1.1;
            font-weight: 700;
            color: var(--grey);
            text-transform: uppercase;
          }

          .emi-print-detail-value {
            margin-top: 2px;
            font-size: 8pt;
            line-height: 1.15;
            font-weight: 700;
            color: var(--text);
            word-break: break-word;
          }

          .emi-print-breakdown-head {
            display: grid;
            grid-template-columns: 1fr 145px;
            background: var(--light);
            border-bottom: 1px solid var(--line);
          }

          .emi-print-breakdown-head span {
            padding: 4px 7px;
            font-size: 7pt;
            font-weight: 700;
            color: var(--grey);
            text-transform: uppercase;
          }

          .emi-print-breakdown-head span:last-child {
            text-align: right;
          }

          .emi-print-price-row {
            display: grid;
            grid-template-columns: 1fr 145px;
            border-bottom: 1px solid var(--line);
          }

          .emi-print-price-label,
          .emi-print-price-value {
            padding: 4px 7px;
            font-size: 8pt;
            line-height: 1.2;
          }

          .emi-print-price-value {
            text-align: right;
            font-weight: 700;
          }

          .emi-print-total-row {
            display: grid;
            grid-template-columns: 1fr 145px;
            background: var(--pale);
            border-bottom: 2px solid var(--navy);
          }

          .emi-print-total-label,
          .emi-print-total-value {
            padding: 5px 7px;
            font-size: 9pt;
            font-weight: 800;
            color: var(--navy);
          }

          .emi-print-total-value {
            text-align: right;
          }

          .emi-print-words {
            padding: 4px 7px;
            margin-top: 4px;
            background: var(--light);
            font-size: 7.5pt;
            line-height: 1.25;
            color: var(--grey);
          }

          .emi-print-words strong {
            color: var(--text);
            text-transform: uppercase;
          }

          .emi-print-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border-bottom: 1px solid var(--line);
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-summary-cell {
            padding: 6px 8px;
            background: var(--light);
          }

          .emi-print-summary-cell + .emi-print-summary-cell {
            border-left: 1px solid var(--line);
          }

          .emi-print-summary-cell:last-child {
            background: var(--pale);
          }

          .emi-print-summary-label {
            font-size: 7pt;
            line-height: 1.1;
            font-weight: 700;
            color: var(--grey);
            text-transform: uppercase;
          }

          .emi-print-summary-value {
            margin-top: 3px;
            font-size: 10pt;
            line-height: 1.1;
            font-weight: 800;
            color: var(--navy);
          }

          .emi-print-expenses {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 7.5pt;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-expenses th {
            padding: 4px 6px;
            background: var(--light);
            border-bottom: 1px solid var(--line);
            color: var(--grey);
            font-size: 7pt;
            font-weight: 700;
            text-align: left;
            text-transform: uppercase;
          }

          .emi-print-expenses td {
            padding: 4px 6px;
            border-bottom: 1px solid var(--line);
            vertical-align: top;
          }

          .emi-print-expenses th:nth-child(1),
          .emi-print-expenses td:nth-child(1) {
            width: 42%;
          }

          .emi-print-expenses th:nth-child(2),
          .emi-print-expenses td:nth-child(2) {
            width: 33%;
          }

          .emi-print-expenses th:nth-child(3),
          .emi-print-expenses td:nth-child(3) {
            width: 25%;
            text-align: right;
          }

          .emi-print-expense-name {
            font-weight: 700;
          }

          .emi-print-expense-amount {
            text-align: right;
            font-weight: 700;
            white-space: nowrap;
          }

          .emi-print-expenses-total {
            display: grid;
            grid-template-columns: 1fr 145px;
            background: var(--pale);
            border-bottom: 2px solid var(--navy);
          }

          .emi-print-expenses-total span,
          .emi-print-expenses-total strong {
            padding: 5px 7px;
            font-size: 8pt;
            font-weight: 800;
            color: var(--navy);
          }

          .emi-print-expenses-total strong {
            text-align: right;
          }

          .emi-print-bottom {
            flex-shrink: 0;

            display: grid;
            grid-template-columns: 1fr 145px;
            column-gap: 15px;
            align-items: end;

            margin-top: auto;
            padding-top: 7px;

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-note {
            padding: 6px 7px;
            background: var(--light);
            font-size: 7.2pt;
            line-height: 1.35;
            color: var(--grey);
          }

          .emi-print-note strong {
            color: var(--text);
          }

          .emi-print-signature {
            text-align: center;
            font-size: 7pt;
            color: var(--grey);
          }

          .emi-print-stamp {
            width: 145px;
            height: 60px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }

          .emi-print-stamp-spacer {
            height: 60px;
          }

          .emi-print-footer {
            flex-shrink: 0;

            margin-top: 4px;
            padding-top: 5px;
            border-top: 1px solid var(--line);

            text-align: center;
            font-size: 7pt;
            line-height: 1.35;
            color: var(--grey);

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .emi-print-thank-you {
            margin-top: 4px;
            height: 22px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: var(--navy);
            color: #ffffff;
            font-size: 8pt;
            font-weight: 700;
          }

            @page {
              size: A4 portrait;
              margin: 10mm;
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

              .emi-print-sheet {
                width: 100% !important;
                height: 274mm !important;
                min-height: 274mm !important;
                max-height: 274mm !important;
                display: flex !important;
                flex-direction: column !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }

              .emi-print-main {
                flex: 0 0 auto !important;
                width: 100% !important;
              }

              .emi-print-bottom {
                flex-shrink: 0 !important;
                margin-top: auto !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }

              .emi-print-footer {
                flex-shrink: 0 !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }

              .emi-print-expenses {
                width: 100% !important;
                border-collapse: collapse !important;
              }

              .emi-print-expenses thead {
                display: table-header-group !important;
              }

              .emi-print-expenses tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }

              .emi-print-header,
              .emi-print-reference,
              .emi-print-hero,
              .emi-print-two-column,
              .emi-print-detail-grid,
              .emi-print-summary,
              .emi-print-expenses {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
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
            }
        `}
      </style>

      <div className="emi-print-sheet">
        <div className="emi-print-main">
          {/* HEADER */}
          <header className="emi-print-header">
            <div>
              {printAssets.logo ? (
                <img src={printAssets.logo} alt="" className="emi-print-logo" />
              ) : null}
            </div>

            <div>
              <div className="emi-print-company-name">
                {displayValue(company?.legal_entity_name)}
              </div>

              <div className="emi-print-company-meta">
                {displayValue(company?.showroom_address)}
              </div>

              <div className="emi-print-company-meta">
                Tel: {displayValue(company?.main_contact_mobile)}
                {company?.corporate_email
                  ? ` | ${company.corporate_email}`
                  : ""}
              </div>
            </div>

            <div className="emi-print-header-meta">
              <div>
                <strong>EMI No:</strong> {displayValue(emi.emi_number)}
              </div>

              <div>
                <strong>Date:</strong> {formatDate(emi.created_at)}
              </div>
            </div>
          </header>

          {/* TITLE */}
          <div className="emi-print-title-band">
            <div className="emi-print-title">EMI Estimate</div>

            <div className="emi-print-title-side">Vehicle Finance</div>
          </div>

          {/* REFERENCE */}
          <div className="emi-print-reference">
            <ReferenceCell label="EMI Number" value={emi.emi_number} />
            <ReferenceCell label="Date" value={formatDate(emi.created_at)} />
            <ReferenceCell label="Customer" value={emi.customer_name} />
            <ReferenceCell label="Bank" value={emi.bank_name} last />
          </div>

          {/* HERO */}
          <section className="emi-print-hero">
            <div className="emi-print-hero-main">
              <div className="emi-print-hero-label">MONTHLY EMI</div>

              <div className="emi-print-hero-amount">
                <small>AED</small>
                {formatAmountWithoutCurrency(emi.monthly_emi)}
              </div>

              <div className="emi-print-hero-sub">
                per month ·{" "}
                {emi.tenure_years ? Number(emi.tenure_years) * 12 : "-"} months
                ({tenureLabel}) · {formatPercentage(emi.interest_rate)} p.a.
              </div>
            </div>

            <div className="emi-print-hero-side">
              <div className="emi-print-hero-side-item">
                <div className="emi-print-hero-side-label">Total Interest</div>

                <div className="emi-print-hero-side-value">
                  {formatCurrency(emi.total_interest)}
                </div>
              </div>

              <div className="emi-print-hero-side-item">
                <div className="emi-print-hero-side-label">Total Payable</div>

                <div className="emi-print-hero-side-value">
                  {formatCurrency(emi.total_payable)}
                </div>
              </div>
            </div>
          </section>

          {/* BANK + CUSTOMER */}
          <section className="emi-print-two-column">
            <div>
              <div className="emi-print-column-title">Bank (Financed By)</div>

              <div className="emi-print-column-content">
                <div className="emi-print-primary">
                  {displayValue(emi.bank_name)}
                </div>

                <div className="emi-print-secondary">
                  Interest Rate:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {formatPercentage(emi.interest_rate)}
                  </strong>
                </div>
              </div>
            </div>

            <div>
              <div className="emi-print-column-title">Customer</div>

              <div className="emi-print-column-content">
                <div className="emi-print-primary">
                  {displayValue(emi.customer_name)}
                </div>

                <div className="emi-print-secondary">
                  Mobile:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {displayValue(emi.customer_mobile)}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {/* VEHICLE */}
          <section>
            <SectionBand title="Vehicle Details" />

            <div className="emi-print-detail-grid">
              <DetailCell
                label="Stock ID"
                value={emi.vehicle_stock_id || "Manual Vehicle"}
              />

              <DetailCell label="Make & Model" value={vehicleName} />

              <DetailCell label="Year" value={emi.vehicle_year} />

              <DetailCell label="Colour" value={emi.vehicle_colour} />

              <DetailCell label="Variant" value={emi.vehicle_variant} />

              <DetailCell
                label="Mileage"
                value={formatMileage(emi.vehicle_mileage)}
              />

              <DetailCell
                label="Chassis No"
                value={emi.vehicle_chassis_number}
              />

              <DetailCell label="Engine No" value={emi.vehicle_engine_number} />
            </div>
          </section>

          {/* FINANCE BREAKDOWN */}
          <section>
            <SectionBand title="Finance Breakdown" rightText="Amount (AED)" />

            <div className="emi-print-breakdown-head">
              <span>Description</span>
              <span>Amount (AED)</span>
            </div>

            <div className="emi-print-price-row">
              <div className="emi-print-price-label">Vehicle Amount</div>

              <div className="emi-print-price-value">
                {formatAmountWithoutCurrency(emi.vehicle_price)}
              </div>
            </div>

            <div className="emi-print-price-row">
              <div className="emi-print-price-label">VAT</div>

              <div className="emi-print-price-value">
                {emi.vat_enabled
                  ? formatAmountWithoutCurrency(emi.vat_amount)
                  : "Not Applied"}
              </div>
            </div>

            <div className="emi-print-price-row">
              <div className="emi-print-price-label">Down Payment</div>

              <div className="emi-print-price-value">
                {formatAmountWithoutCurrency(emi.down_payment)}
              </div>
            </div>

            <div className="emi-print-total-row">
              <div className="emi-print-total-label">NET FINANCE AMOUNT</div>

              <div className="emi-print-total-value">
                {formatAmountWithoutCurrency(financeAmount)}
              </div>
            </div>

            <div className="emi-print-words">
              <strong>In Words</strong> {amountToWords(financeAmount)}
            </div>
          </section>

          {/* EMI SUMMARY */}
          <section>
            <SectionBand title="EMI Summary" />

            <div className="emi-print-summary">
              <div className="emi-print-summary-cell">
                <div className="emi-print-summary-label">Total Interest</div>

                <div className="emi-print-summary-value">
                  {formatCurrency(emi.total_interest)}
                </div>
              </div>

              <div className="emi-print-summary-cell">
                <div className="emi-print-summary-label">Total Payable</div>

                <div className="emi-print-summary-value">
                  {formatCurrency(emi.total_payable)}
                </div>
              </div>

              <div className="emi-print-summary-cell">
                <div className="emi-print-summary-label">Monthly EMI</div>

                <div className="emi-print-summary-value">
                  {formatCurrency(emi.monthly_emi)}
                </div>
              </div>
            </div>
          </section>

          {/* OTHER EXPENSES */}
          <section>
            <SectionBand title="Other Expenses" />

            {expenses.length > 0 ? (
              <table className="emi-print-expenses">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.map((expense, index) => {
                    const dynamicName =
                      displayValue(expense?.name) !== "-"
                        ? expense.name
                        : displayValue(expense?.expense_type);

                    return (
                      <tr
                        key={
                          expense?.id ??
                          `${expense?.expense_type || "expense"}-${index}`
                        }
                      >
                        <td className="emi-print-expense-name">
                          {dynamicName}
                        </td>

                        <td>{displayValue(expense?.description)}</td>

                        <td className="emi-print-expense-amount">
                          {formatCurrency(expense?.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="emi-print-words">
                No additional expenses recorded.
              </div>
            )}

            <div className="emi-print-expenses-total">
              <span>Other Expenses Total</span>

              <strong>{formatCurrency(emi.expense_total)}</strong>
            </div>
          </section>
        </div>

        {/* SIGNATURE + NOTE */}
        <section className="emi-print-bottom">
          <div className="emi-print-note">
            <strong>Finance Estimate</strong>
            <br />
            This EMI estimate is based on the saved finance information for this
            estimate.
          </div>

          <div className="emi-print-signature">
            {includeSealStamp && printAssets.sealStamp ? (
              <img
                src={printAssets.sealStamp}
                alt=""
                className="emi-print-stamp"
              />
            ) : (
              <div className="emi-print-stamp-spacer" />
            )}

            <div>Authorised Signature &amp; Stamp</div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="emi-print-footer">
          <div>
            For any questions, please contact{" "}
            {displayValue(company?.main_contact_mobile)}
            {company?.corporate_email ? ` | ${company.corporate_email}` : ""}
          </div>

          <div className="emi-print-thank-you">
            Thank You For Your Business!
          </div>
        </footer>
      </div>
    </>
  );
}
