function displayValue(value, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAmountOrDash(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number === 0) {
    return "-";
  }

  return formatAmount(number);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

function numberToWordsBelowThousand(number) {
  const ones = [
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
    return ones[number];
  }

  if (number < 100) {
    const tensValue = Math.floor(number / 10);
    const remainder = number % 10;

    return remainder
      ? `${tens[tensValue]}-${ones[remainder]}`
      : tens[tensValue];
  }

  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;

  return remainder
    ? `${ones[hundreds]} Hundred ${numberToWordsBelowThousand(remainder)}`
    : `${ones[hundreds]} Hundred`;
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
    return `${numberToWords(
      whole,
    )} Dirhams and ${numberToWords(fils)} Fils Only`;
  }

  return `${numberToWords(whole)} Dirhams Only`;
}

function ReferenceCell({ label, value }) {
  return (
    <div className="cash-receipt-reference-cell">
      <div className="cash-receipt-ref-label">{label}</div>

      <div className="cash-receipt-ref-value">{displayValue(value)}</div>
    </div>
  );
}

function DetailCell({ label, value, labelCell = false }) {
  return (
    <div
      className={
        labelCell
          ? "cash-receipt-detail-cell cash-receipt-detail-label-cell"
          : "cash-receipt-detail-cell"
      }
    >
      {labelCell ? (
        <div className="cash-receipt-detail-label">{label}</div>
      ) : (
        <div className="cash-receipt-detail-value">{displayValue(value)}</div>
      )}
    </div>
  );
}

export default function CashReceiptPrintTemplate({
  receipt,
  company = {},
  printAssets = {},
}) {
  if (!receipt) {
    return null;
  }

  const vehicleName = [
    receipt.vehicle_make,
    receipt.vehicle_model,
    receipt.vehicle_variant,
  ]
    .filter(Boolean)
    .join(" ");

  const customerName = displayValue(receipt.customer_name);

  const amount = receipt.amount;

  /*
   * IMPORTANT:
   * These values must come from the backend.
   * Do NOT calculate balance in React.
   */
  const vehiclePrice =
    receipt.vehicle_price ?? receipt.quote_vehicle_price ?? receipt.quote_price;

  const previouslyReceived =
    receipt.previously_received ??
    receipt.total_received_before ??
    receipt.amount_received_before;

  const balanceDue = receipt.balance_due ?? receipt.remaining_balance;

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

          .cash-receipt-sheet {
            width: 100%;
            height: 274mm;
            min-height: 274mm;
            max-height: 274mm;
            box-sizing: border-box;

            display: flex;
            flex-direction: column;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            color: var(--text);
            font-size: 9pt;
            line-height: 1.25;

            overflow: hidden;
          }

          .cash-receipt-main {
            flex: 0 0 auto;
            width: 100%;
          }

          .cash-receipt-sheet,
          .cash-receipt-sheet * {
            box-sizing: border-box;
          }

          /* HEADER */

          .cash-receipt-header {
            display: grid;
            grid-template-columns: 135px 1fr;
            column-gap: 12px;
            align-items: center;

            padding-bottom: 7px;

            border-bottom: 2px solid var(--navy);

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-logo {
            width: 135px;
            height: 69px;
            object-fit: contain;
            object-position: left center;
            display: block;
          }

          .cash-receipt-company-name {
            font-size: 18pt;
            line-height: 1.05;
            font-weight: 700;
            color: var(--navy);
          }

          .cash-receipt-company-address {
            margin-top: 5px;
            font-size: 9pt;
            line-height: 1.25;
            color: var(--grey);
          }

          .cash-receipt-company-contact {
            margin-top: 2px;
            font-size: 9pt;
            line-height: 1.25;
            color: var(--grey);
          }

          /* TITLE */

          .cash-receipt-title-band {
            display: flex;
            justify-content: space-between;
            align-items: center;

            height: 28px;

            margin-top: 8px;
            padding: 0 10px;

            background: var(--navy);
            color: #ffffff;

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-title {
            font-size: 16pt;
            line-height: 1;
            font-weight: 700;
          }

          .cash-receipt-title-side {
            font-size: 10pt;
            line-height: 1;
            font-weight: 400;
          }

          /* REFERENCE */

          .cash-receipt-reference {
            display: flex;

            height: 46px;

            margin-top: 5px;

            background: var(--light);

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-reference-cell {
            flex: 1 1 0;
            min-width: 0;

            padding: 7px 10px;

            border-right: 1px solid var(--line);
          }

          .cash-receipt-reference-cell:last-child {
            border-right: 0;
          }

          .cash-receipt-ref-label {
            font-size: 7pt;
            line-height: 1.1;
            font-weight: 700;
            color: var(--grey);
            text-transform: uppercase;
          }

          .cash-receipt-ref-value {
            margin-top: 4px;

            font-size: 11pt;
            line-height: 1.1;
            font-weight: 700;
            color: var(--text);

            word-break: break-word;
          }

          /* AMOUNT HERO */

          .cash-receipt-hero {
            display: grid;
            grid-template-columns: 58% 42%;

            margin-top: 14px;

            border: 2px solid var(--navy);

            min-height: 91px;

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-hero-main {
            padding: 14px 18px;

            background: var(--navy);
            color: #ffffff;
          }

          .cash-receipt-hero-label {
            font-size: 9pt;
            line-height: 1.1;

            letter-spacing: 1px;

            font-weight: 700;

            color: var(--soft);
          }

          .cash-receipt-hero-amount {
            margin-top: 4px;

            font-size: 34pt;
            line-height: 1.15;

            font-weight: 700;

            white-space: nowrap;
          }

          .cash-receipt-hero-amount small {
            font-size: 15pt;
            font-weight: 400;
            margin-right: 5px;
          }

          .cash-receipt-hero-sub {
            margin-top: 4px;

            font-size: 9pt;
            line-height: 1.25;

            color: var(--soft);
          }

          .cash-receipt-hero-side {
            display: grid;
            grid-template-rows: 1fr 1fr;
          }

          .cash-receipt-hero-side-item {
            padding: 11px 16px;

            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .cash-receipt-hero-side-item:first-child {
            background: var(--pale);
            border-bottom: 2px solid #ffffff;
          }

          .cash-receipt-hero-side-item:last-child {
            background: var(--light);
          }

          .cash-receipt-side-label {
            font-size: 7pt;
            line-height: 1.1;
            font-weight: 700;
            color: var(--grey);
            text-transform: uppercase;
          }

          .cash-receipt-side-value {
            margin-top: 3px;

            font-size: 14pt;
            line-height: 1.1;
            font-weight: 700;

            color: var(--navy);
          }

          /* WORDS */

          .cash-receipt-words {
            height: 30px;

            display: flex;
            align-items: center;

            padding-left: 10px;

            border-bottom: 1px solid var(--line);

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-words-label {
            margin-right: 8px;

            font-size: 8pt;
            font-weight: 700;

            color: var(--grey);
          }

          .cash-receipt-words-value {
            font-size: 9pt;
            font-style: italic;
          }

          /* CUSTOMER / REFERENCE */

          .cash-receipt-two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 8px;

            margin-top: 16px;

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-column-heading {
            padding-bottom: 4px;

            margin-bottom: 6px;

            border-bottom: 1px solid var(--navy);

            font-size: 9pt;
            line-height: 1.1;
            font-weight: 700;

            color: var(--navy);

            text-transform: uppercase;
          }

          .cash-receipt-column-primary {
            padding-left: 10px;

            font-size: 11pt;
            line-height: 1.2;
            font-weight: 700;
          }

          .cash-receipt-column-secondary {
            margin-top: 3px;
            padding-left: 10px;

            font-size: 9.5pt;
            line-height: 1.2;

            color: var(--grey);
          }

          .cash-receipt-column-secondary strong {
            color: var(--text);
            font-weight: 700;
          }

          /* SECTION BAR */

          .cash-receipt-section-bar {
            display: flex;
            align-items: center;

            height: 26px;

            margin-top: 16px;

            padding: 0 10px;

            background: var(--navy);
            color: #ffffff;

            font-size: 10pt;
            line-height: 1;
            font-weight: 700;

            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* VEHICLE */

          .cash-receipt-detail-grid {
            display: grid;
            grid-template-columns: 25% 25% 25% 25%;

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-detail-cell {
            min-width: 0;

            height: 24px;

            display: flex;
            align-items: center;

            padding: 0 10px;

            border-bottom: 1px solid var(--line);
          }

          .cash-receipt-detail-label-cell {
            background: var(--light);
          }

          .cash-receipt-detail-label {
            font-size: 7pt;
            line-height: 1.1;

            font-weight: 700;

            color: var(--grey);

            text-transform: uppercase;
          }

          .cash-receipt-detail-value {
            font-size: 10pt;
            line-height: 1.1;

            font-weight: 700;

            color: var(--text);

            word-break: break-word;
          }

          /* PAYMENT SUMMARY */

          .cash-receipt-summary-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            height: 26px;

            margin-top: 16px;

            padding: 0 10px;

            background: var(--navy);
            color: #ffffff;

            font-size: 10pt;
            font-weight: 700;
          }

          .cash-receipt-summary-row {
            display: grid;
            grid-template-columns: 1fr 150px;

            height: 24px;

            border-bottom: 1px solid var(--line);

            font-size: 10pt;
          }

          .cash-receipt-summary-label,
          .cash-receipt-summary-value {
            display: flex;
            align-items: center;

            padding: 0 10px;
          }

          .cash-receipt-summary-value {
            justify-content: flex-end;

            font-weight: 700;
          }

          .cash-receipt-balance {
            display: grid;
            grid-template-columns: 1fr 150px;

            height: 33px;

            background: var(--pale);

            color: var(--navy);

            border-top: 1px solid var(--navy);
            border-bottom: 2px solid var(--navy);

            font-weight: 700;
          }

          .cash-receipt-balance-label,
          .cash-receipt-balance-value {
            display: flex;
            align-items: center;

            padding: 0 10px;
          }

          .cash-receipt-balance-label {
            font-size: 11pt;
          }

          .cash-receipt-balance-value {
            justify-content: flex-end;
            font-size: 12pt;
          }

          /* BOTTOM */

          .cash-receipt-bottom {
            margin-top: auto;

            padding-top: 10px;

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-bottom-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;

            column-gap: 20px;
          }

          .cash-receipt-heading {
            padding-bottom: 4px;

            margin-bottom: 6px;

            border-bottom: 1px solid var(--navy);

            font-size: 9pt;
            line-height: 1.1;
            font-weight: 700;

            color: var(--navy);

            text-transform: uppercase;
          }

          .cash-receipt-notes {
            font-size: 9pt;
            line-height: 1.7;

            color: #444444;
          }

          .cash-receipt-stamp {
            width: 145px;
            height: 93px;

            object-fit: contain;

            display: block;

            margin: 0 auto;
          }

          .cash-receipt-stamp-spacer {
            width: 145px;
            height: 93px;

            margin: 0 auto;
          }

          .cash-receipt-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;

            column-gap: 20px;

            margin-top: 6px;
          }

          .cash-receipt-signature {
            padding-top: 4px;

            border-top: 1px solid var(--line);

            text-align: center;

            font-size: 8pt;

            color: var(--grey);
          }

          /* FOOTER */

          .cash-receipt-footer {
            flex-shrink: 0;

            margin-top: 22px;

            text-align: center;

            font-size: 8.5pt;
            line-height: 1.3;

            color: var(--grey);

            break-inside: avoid;
            page-break-inside: avoid;
          }

          .cash-receipt-thank-you {
            display: flex;
            justify-content: center;
            align-items: center;

            height: 26px;

            margin-top: 8px;

            background: var(--navy);
            color: #ffffff;

            font-size: 11pt;
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
              font-family:
                Arial,
                Helvetica,
                sans-serif !important;

              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;

              overflow: visible !important;
            }

            .cash-receipt-sheet {
              width: 100% !important;

              height: 274mm !important;
              min-height: 274mm !important;
              max-height: 274mm !important;

              display: flex !important;
              flex-direction: column !important;

              margin: 0 !important;
              padding: 0 !important;

              overflow: hidden !important;

              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .cash-receipt-main {
              flex: 0 0 auto !important;
            }

            .cash-receipt-bottom {
              margin-top: auto !important;

              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .cash-receipt-footer {
              flex-shrink: 0 !important;

              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .print-area {
              display: block !important;
              position: static !important;

              width: 100% !important;
              height: auto !important;

              margin: 0 !important;
              padding: 0 !important;

              background: #ffffff !important;
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
            }
          }
        `}
      </style>

      <div className="cash-receipt-sheet">
        <div className="cash-receipt-main">
          {/* HEADER */}

          <header className="cash-receipt-header">
            <div>
              {printAssets.logo ? (
                <img
                  src={printAssets.logo}
                  alt=""
                  className="cash-receipt-logo"
                />
              ) : null}
            </div>

            <div>
              <div className="cash-receipt-company-name">
                {displayValue(company?.legal_entity_name)}
              </div>

              <div className="cash-receipt-company-address">
                {displayValue(company?.showroom_address)}
              </div>

              <div className="cash-receipt-company-contact">
                Tel: {displayValue(company?.main_contact_mobile)}
                {company?.corporate_email
                  ? ` | ${company.corporate_email}`
                  : ""}
              </div>
            </div>
          </header>

          {/* TITLE */}

          <div className="cash-receipt-title-band">
            <div className="cash-receipt-title">Cash Receipt</div>

            <div className="cash-receipt-title-side">Payment Received</div>
          </div>

          {/* REFERENCE STRIP */}

          <div className="cash-receipt-reference">
            <ReferenceCell label="Receipt #" value={receipt.receipt_number} />

            <ReferenceCell
              label="Date"
              value={formatDate(receipt.transaction_date)}
            />

            <ReferenceCell label="Customer ID" value={receipt.customer} />

            <ReferenceCell
              label="TRN"
              value={
                receipt.customer_trn ??
                receipt.trn ??
                receipt.customer_tax_number
              }
            />
          </div>

          {/* AMOUNT HERO */}

          <section className="cash-receipt-hero">
            <div className="cash-receipt-hero-main">
              <div className="cash-receipt-hero-label">AMOUNT RECEIVED</div>

              <div className="cash-receipt-hero-amount">
                <small>AED</small>
                {formatAmount(amount)}
              </div>

              <div className="cash-receipt-hero-sub">
                {displayValue(receipt.category, "Payment")}
                {" · "}
                {displayValue(receipt.payment_method, "Cash")}
                {" · against Quotation "}
                {displayValue(receipt.quote_number, "-")}
              </div>
            </div>

            <div className="cash-receipt-hero-side">
              <div className="cash-receipt-hero-side-item">
                <div className="cash-receipt-side-label">PAYMENT TYPE</div>

                <div className="cash-receipt-side-value">
                  {displayValue(receipt.category)}
                </div>
              </div>

              <div className="cash-receipt-hero-side-item">
                <div className="cash-receipt-side-label">PAYMENT METHOD</div>

                <div className="cash-receipt-side-value">
                  {displayValue(receipt.payment_method)}
                </div>
              </div>
            </div>
          </section>

          {/* AMOUNT IN WORDS */}

          <div className="cash-receipt-words">
            <span className="cash-receipt-words-label">IN WORDS</span>

            <span className="cash-receipt-words-value">
              {amountToWords(amount)}
            </span>
          </div>

          {/* RECEIVED FROM / REFERENCE */}

          <section className="cash-receipt-two-column">
            <div>
              <div className="cash-receipt-column-heading">RECEIVED FROM</div>

              <div className="cash-receipt-column-primary">{customerName}</div>

              <div className="cash-receipt-column-secondary">
                Mobile: <strong>{displayValue(receipt.customer_mobile)}</strong>
              </div>
            </div>

            <div>
              <div className="cash-receipt-column-heading">REFERENCE</div>

              <div className="cash-receipt-column-primary">
                {displayValue(receipt.reference)}
              </div>

              <div className="cash-receipt-column-secondary">
                Description:{" "}
                <strong>{displayValue(receipt.description)}</strong>
              </div>
            </div>
          </section>

          {/* VEHICLE DETAILS */}

          <section>
            <div className="cash-receipt-section-bar">VEHICLE DETAILS</div>

            <div className="cash-receipt-detail-grid">
              <DetailCell label="Make & Model" labelCell />

              <DetailCell value={vehicleName} />

              <DetailCell label="Year" labelCell />

              <DetailCell value={receipt.vehicle_year} />

              <DetailCell label="Chassis No." labelCell />

              <DetailCell value={receipt.vehicle_chassis_number} />

              <DetailCell label="Engine No." labelCell />

              <DetailCell value={receipt.vehicle_engine_number} />

              <DetailCell label="Colour" labelCell />

              <DetailCell value={receipt.vehicle_colour} />

              <div className="cash-receipt-detail-cell" />
              <div className="cash-receipt-detail-cell" />
            </div>
          </section>

          {/* PAYMENT SUMMARY */}

          <section>
            <div className="cash-receipt-summary-header">
              <span>PAYMENT SUMMARY</span>

              <span>AMOUNT (AED)</span>
            </div>

            <div className="cash-receipt-summary-row">
              <div className="cash-receipt-summary-label">Vehicle Price</div>

              <div className="cash-receipt-summary-value">
                {formatAmountOrDash(vehiclePrice)}
              </div>
            </div>

            <div className="cash-receipt-summary-row">
              <div className="cash-receipt-summary-label">
                Previously Received
              </div>

              <div className="cash-receipt-summary-value">
                {formatAmountOrDash(previouslyReceived)}
              </div>
            </div>

            <div className="cash-receipt-summary-row">
              <div className="cash-receipt-summary-label">
                Amount Received (this receipt)
              </div>

              <div className="cash-receipt-summary-value">
                {formatAmountOrDash(amount)}
              </div>
            </div>

            <div className="cash-receipt-balance">
              <div className="cash-receipt-balance-label">BALANCE DUE</div>

              <div className="cash-receipt-balance-value">
                {formatAmountOrDash(balanceDue)}
              </div>
            </div>
          </section>
        </div>

        {/* BOTTOM */}

        <section className="cash-receipt-bottom">
          <div className="cash-receipt-bottom-grid">
            <div>
              <div className="cash-receipt-heading">TERMS & NOTES</div>

              <div className="cash-receipt-notes">
                <div>
                  1. This receipt confirms the amount received against the
                  referenced quotation.
                </div>

                <div>2. Please retain this receipt for your records.</div>

                <div>3. All amounts are stated in AED.</div>
              </div>
            </div>

            <div>
              {printAssets.sealStamp ? (
                <img
                  src={printAssets.sealStamp}
                  alt=""
                  className="cash-receipt-stamp"
                />
              ) : (
                <div className="cash-receipt-stamp-spacer" />
              )}
            </div>
          </div>

          <div className="cash-receipt-signatures">
            <div className="cash-receipt-signature">Customer Signature</div>

            <div className="cash-receipt-signature">
              Authorised Signature &amp; Stamp
            </div>
          </div>
        </section>

        {/* FOOTER */}

        <footer className="cash-receipt-footer">
          <div>
            For any questions, please contact{" "}
            {displayValue(company?.main_contact_mobile)}
            {company?.corporate_email ? ` | ${company.corporate_email}` : ""}
          </div>

          <div className="cash-receipt-thank-you">
            Thank You For Your Business!
          </div>
        </footer>
      </div>
    </>
  );
}
