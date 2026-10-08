import PrintDocument from "../PrintDocument";

const CASH_RECEIPT_LOGO = "/prime_rides_logo_gold_trimmed.png";

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

function formatDirection(value) {
  if (value === "customer_payment") {
    return "Customer Payment";
  }

  if (value === "company_on_behalf") {
    return "Company on Behalf";
  }

  return value || "-";
}

export default function CashReceiptPrintTemplate({
  receipt,
  company,
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

  const companyName =
    company?.legal_entity_name || "Prime Rides Cars Trading LLC";

  const companyAddress = String(company?.showroom_address || "").trim();

  const companyPhone =
    company?.official_phone || company?.main_contact_mobile || "";

  const companyEmail = company?.corporate_email || "";

  // const vehiclePrice =
  //   receipt.vehicle_price ?? receipt.quote_vehicle_price ?? receipt.quote_price;

  // const previouslyReceived =
  //   receipt.previously_received ??
  //   receipt.total_received_before ??
  //   receipt.amount_received_before;

  // const balanceDue = receipt.balance_due ?? receipt.remaining_balance;

  return (
    <PrintDocument company={company} showHeader={false} showFooter={false}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0;
          }

          .cash-receipt-page,
          .cash-receipt-page *,
          .cash-receipt-page *::before,
          .cash-receipt-page *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .cash-receipt-page {
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

          .cash-receipt-page *,
          .cash-receipt-page *::before,
          .cash-receipt-page *::after {
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          /* HEADER */

          .cash-receipt-page .cash-header {
            position: relative;
            flex: 0 0 142px;

            width: calc(100% + 72px);
            height: 142px;
            margin: 0 -36px;

            background: var(--black);
            border-bottom: 4px solid var(--gold);
            overflow: hidden;
          }

          .cash-receipt-page .cash-logo {
            position: absolute;
            left: 36px;
            top: 30.5px;

            width: 189.8px;
            height: 78px;

            display: block;
            object-fit: contain;
            object-position: left center;
          }

          .cash-receipt-page .cash-company-block {
            position: absolute;
            left: 241.8px;
            top: 30px;

            width: 400px;
            max-width: 400px;

            overflow: hidden;
          }

          .cash-receipt-page .cash-company-name {
            color: var(--gold);

            font-family: "Times New Roman", Times, serif;
            font-size: 26px;
            line-height: 1.1;
            font-weight: 700;
            letter-spacing: 1px;

            white-space: nowrap;
          }

          .cash-receipt-page .cash-company-name.is-long {
            font-size: 20px;
          }

          .cash-receipt-page .cash-company-meta {
            margin-top: 4px;
            color: var(--header-text);

            font-size: 11.5px;
            line-height: 16px;
          }

          .cash-receipt-page .cash-header-contact {
            margin-top: 4px;
            color: var(--header-text);

            font-size: 11.5px;
            line-height: 16px;

            white-space: nowrap;
          }

          /* TITLE */

          .cash-receipt-page .cash-title-row {
            flex: 0 0 46px;
            height: 46px;

            margin-top: 16px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            border-bottom: 1px solid var(--gold);
          }

          .cash-receipt-page .cash-title {
            color: var(--gold);

            font-family: "Times New Roman", Times, serif;
            font-size: 30px;
            line-height: 1;
            font-style: italic;
          }

          .cash-receipt-page .cash-title-right {
            color: var(--black);

            font-size: 12.9px;
            line-height: 1;
          }

          /* REFERENCE */

          .cash-receipt-page .cash-reference {
            flex: 0 0 49px;
            height: 49px;

            margin-top: 10px;

            display: grid;
            grid-template-columns: 148.5px 176.3px 148.5px 1fr;

            background: var(--cream);
            border-left: 3px solid var(--gold);
          }

          .cash-receipt-page .cash-reference-cell {
            padding: 8px 12px;
          }

          .cash-receipt-page .cash-reference-label {
            color: var(--gold);

            font-size: 10.5px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: 0.58px;
          }

          .cash-receipt-page .cash-reference-value {
            margin-top: 3px;

            color: var(--ink);
            font-size: 14.9px;
            line-height: 1.1;
            font-weight: 700;

            white-space: nowrap;
          }

          /* TWO COLUMNS */

          .cash-receipt-page .cash-parties {
            height: 72px;
            margin-top: 0;
            padding-top: 15px;
          }

          .cash-receipt-page .cash-party-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 20px;
          }

          .cash-receipt-page .cash-party {
            height: 57px;

            border-bottom: 1px solid var(--gold);
            overflow: hidden;
          }

          .cash-receipt-page .cash-party-heading {
            color: var(--gold);

            font-size: 10.9px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: 0.65px;
            text-transform: uppercase;
          }

          .cash-receipt-page .cash-party-name {
            margin-top: 8px;

            color: var(--ink);
            font-size: 14.9px;
            line-height: 1.05;
            font-weight: 700;
          }

          .cash-receipt-page .cash-party-meta {
            margin-top: 4px;

            color: var(--muted-label);
            font-size: 10.9px;
            line-height: 13px;
          }

          /* SECTION BAR */

          .cash-receipt-page .cash-section {
            width: 100%;
            margin-top: 16px;
          }

          .cash-receipt-page .cash-section-bar {
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

          /* PAYMENT DETAILS */

          .cash-receipt-page .cash-payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
          }

          .cash-receipt-page .cash-payment-cell {
            min-width: 0;
            min-height: 44px;

            padding: 7px 12px;

            border-top: 1px solid var(--hairline);
            border-right: 1px solid var(--hairline);
          }

          .cash-receipt-page .cash-payment-cell:last-child {
            border-right: 0;
          }

          .cash-receipt-page .cash-payment-label {
            color: var(--muted-label);

            font-size: 9.5px;
            line-height: 1;
            font-weight: 700;
            text-transform: uppercase;
          }

          .cash-receipt-page .cash-payment-value {
            margin-top: 5px;

            color: var(--ink);
            font-size: 12px;
            line-height: 15px;
            font-weight: 700;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* VEHICLE */

          .cash-receipt-page .cash-vehicle-row {
            display: grid;
            grid-template-columns: 110px 261px 90px 261px;
          }

          .cash-receipt-page .cash-vehicle-row.tall {
            min-height: 47px;
          }

          .cash-receipt-page .cash-vehicle-row.regular {
            min-height: 32px;
          }

          .cash-receipt-page .cash-vehicle-label,
          .cash-receipt-page .cash-vehicle-value,
          .cash-receipt-page .cash-vehicle-empty {
            min-width: 0;

            border-top: 1px solid var(--hairline);
          }

          .cash-receipt-page .cash-vehicle-row:last-child > * {
            border-bottom: 1px solid var(--hairline);
          }

          .cash-receipt-page .cash-vehicle-label {
            padding: 8px 12px;

            color: var(--muted-label);
            background: var(--cream);

            font-size: 12.9px;
            line-height: 15px;
            font-weight: 700;
          }

          .cash-receipt-page .cash-vehicle-value {
            padding: 8px 12px;

            color: var(--ink);
            background: #ffffff;

            font-size: 12.9px;
            line-height: 15px;
            font-weight: 700;

            white-space: nowrap;
            overflow: hidden;
          }

          /* PAYMENT SUMMARY */

          .cash-receipt-page .cash-summary {
            margin-top: 12px;
          }

          .cash-receipt-page .cash-summary-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .cash-receipt-page .cash-summary-table th {
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

          .cash-receipt-page .cash-summary-table th:first-child {
            width: 60%;
            text-align: left;
          }

          .cash-receipt-page .cash-summary-table th:last-child {
            width: 40%;
            text-align: right;
          }

          .cash-receipt-page .cash-summary-table td {
            height: 30px;
            padding: 7px 12px;

            border-bottom: 1px solid var(--hairline);

            color: var(--ink);
            background: #ffffff;

            font-size: 12.9px;
            line-height: 16px;
          }

          .cash-receipt-page .cash-summary-amount {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          // .cash-receipt-page .cash-balance-row td {
          //   height: 33px;

          //   background: var(--black);
          //   color: var(--gold);

          //   font-family: "Times New Roman", Times, serif;
          //   font-size: 16px;
          //   line-height: 1;
          //   font-weight: 700;
          // }

          /* WORDS */

          .cash-receipt-page .cash-words {
            height: 36px;

            padding: 0 12px;

            display: flex;
            align-items: center;
            gap: 24px;

            border-top: 1px solid var(--hairline);
            border-bottom: 1px solid var(--hairline);
          }

          .cash-receipt-page .cash-words-label {
            flex: 0 0 auto;

            color: var(--muted-label);

            font-size: 10.9px;
            line-height: 1;
            font-weight: 700;
          }

          .cash-receipt-page .cash-words-value {
            min-width: 0;

            color: var(--body);

            font-size: 12px;
            line-height: 1.2;
            font-style: italic;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* BOTTOM */

          .cash-receipt-page .cash-bottom {
            width: 100%;
            height: 59.3px;
            min-height: 59.3px;

            margin-top: auto;

            display: grid;
            grid-template-columns: 346px 346px;
            column-gap: 30px;
          }

          .cash-receipt-page .cash-terms-heading {
            padding-bottom: 4px;

            border-bottom: 1px solid var(--gold);

            color: var(--gold);

            font-size: 10.5px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: 0.58px;
          }

          .cash-receipt-page .cash-terms-list {
            margin: 6px 0 0;
            padding: 0;

            list-style: none;

            color: var(--body);

            font-size: 12px;
            line-height: 19px;
          }

          .cash-receipt-page .cash-stamp-signature {
            height: 59.3px;

            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: stretch;
          }

          .cash-receipt-page .cash-stamp-space {
            flex: 1 1 auto;
            min-height: 0;

            display: flex;
            align-items: flex-end;
            justify-content: center;

            overflow: visible;
          }

          .cash-receipt-page .cash-stamp-space img {
            max-width: 220px;
            max-height: 70px;

            width: auto;
            height: auto;

            object-fit: contain;
            display: block;

            position: relative;
            top: -12px;
          }

          .cash-receipt-page .cash-signature-caption {
            padding-top: 7px;

            border-top: 1px solid var(--hairline);

            color: var(--muted);

            font-size: 10.9px;
            line-height: 1;

            text-align: center;
          }

          /* FOOTER */

          .cash-receipt-page .cash-footer {
            position: absolute;

            left: 0;
            right: 0;
            bottom: 0;

            width: 100%;
            height: 65px;
          }

          .cash-receipt-page .cash-contact {
            position: absolute;

            left: 0;
            right: 0;
            bottom: 50px;

            height: 15px;

            color: var(--contact);

            font-size: 11.5px;
            line-height: 15px;

            text-align: center;
            white-space: nowrap;
          }

          .cash-receipt-page .cash-thank-you {
            position: absolute;

            left: 0;
            right: 0;
            bottom: 0;

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
          }

          @media print {
            @page {
              size: 210mm 297mm;
              margin: 0 !important;
            }

            html,
            body,
            #root,
            #root > * {
              width: 210mm !important;
              height: 297mm !important;
              min-width: 210mm !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 0 !important;
              background: #ffffff !important;
              overflow: hidden !important;
            }

            .print-area,
            .print-document {
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              border: 0 !important;
              box-shadow: none !important;
            }

            .cash-receipt-page {
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              overflow: hidden !important;
            }
          }
        `}
      </style>

      <div className="cash-receipt-page">
        <header className="cash-header">
          <img
            src={CASH_RECEIPT_LOGO}
            alt="Prime Rides"
            className="cash-logo"
          />

          <div className="cash-company-block">
            <div
              className={`cash-company-name${
                companyName.length > 28 ? " is-long" : ""
              }`}
            >
              {companyName}
            </div>

            <div className="cash-company-meta">{companyAddress || "-"}</div>

            <div className="cash-header-contact">
              Tel: {companyPhone || "-"}
              {companyEmail ? ` | ${companyEmail}` : ""}
            </div>
          </div>
        </header>

        <div className="cash-title-row">
          <div className="cash-title">Cash Receipt</div>
          <div className="cash-title-right">Payment Received</div>
        </div>

        <section className="cash-reference">
          <div className="cash-reference-cell">
            <div className="cash-reference-label">RECEIPT #</div>
            <div className="cash-reference-value">
              {receipt.receipt_number || "-"}
            </div>
          </div>

          <div className="cash-reference-cell">
            <div className="cash-reference-label">DATE</div>
            <div className="cash-reference-value">
              {formatDate(receipt.transaction_date)}
            </div>
          </div>

          <div className="cash-reference-cell">
            <div className="cash-reference-label">CUSTOMER ID</div>
            <div className="cash-reference-value">
              {receipt.customer ?? "-"}
            </div>
          </div>

          <div className="cash-reference-cell">
            <div className="cash-reference-label">TRN</div>
            <div className="cash-reference-value">
              {receipt.customer_trn ??
                receipt.trn ??
                receipt.customer_tax_number ??
                "-"}
            </div>
          </div>
        </section>

        <section className="cash-parties">
          <div className="cash-party-grid">
            <div className="cash-party">
              <div className="cash-party-heading">RECEIVED FROM</div>

              <div className="cash-party-name">{customerName}</div>

              <div className="cash-party-meta">
                Mobile: <strong>{displayValue(receipt.customer_mobile)}</strong>
              </div>
            </div>

            <div className="cash-party">
              <div className="cash-party-heading">REFERENCE</div>

              <div className="cash-party-name">
                {displayValue(receipt.reference)}
              </div>

              <div className="cash-party-meta">
                Description:{" "}
                <strong>{displayValue(receipt.description)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="cash-section">
          <div className="cash-section-bar">PAYMENT DETAILS</div>

          <div className="cash-payment-grid">
            <div className="cash-payment-cell">
              <div className="cash-payment-label">Payment Type</div>
              <div className="cash-payment-value">
                {displayValue(receipt.category)}
              </div>
            </div>

            <div className="cash-payment-cell">
              <div className="cash-payment-label">Payment Method</div>
              <div className="cash-payment-value">
                {displayValue(receipt.payment_method)}
              </div>
            </div>

            <div className="cash-payment-cell">
              <div className="cash-payment-label">Direction</div>
              <div className="cash-payment-value">
                {formatDirection(receipt.direction)}
              </div>
            </div>

            <div className="cash-payment-cell">
              <div className="cash-payment-label">Quotation</div>
              <div className="cash-payment-value">
                {displayValue(receipt.quote_number)}
              </div>
            </div>
          </div>
        </section>

        <section className="cash-section">
          <div className="cash-section-bar">VEHICLE DETAILS</div>

          <div className="cash-vehicle-row tall">
            <div className="cash-vehicle-label">Make &amp; Model</div>
            <div className="cash-vehicle-value">{vehicleName || "-"}</div>

            <div className="cash-vehicle-label">Year</div>
            <div className="cash-vehicle-value">
              {receipt.vehicle_year ?? "-"}
            </div>
          </div>

          <div className="cash-vehicle-row tall">
            <div className="cash-vehicle-label">Chassis No.</div>
            <div className="cash-vehicle-value">
              {displayValue(receipt.vehicle_chassis_number)}
            </div>

            <div className="cash-vehicle-label">Engine No.</div>
            <div className="cash-vehicle-value">
              {displayValue(receipt.vehicle_engine_number)}
            </div>
          </div>

          <div className="cash-vehicle-row regular">
            <div className="cash-vehicle-label">Colour</div>
            <div className="cash-vehicle-value">
              {displayValue(receipt.vehicle_colour)}
            </div>

            <div className="cash-vehicle-empty" />
            <div className="cash-vehicle-empty" />
          </div>
        </section>

        <section className="cash-summary">
          <table className="cash-summary-table">
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th>AMOUNT (AED)</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Amount Paid</td>
                <td className="cash-summary-amount">
                  {formatAmountOrDash(receipt.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="cash-section">
          <div className="cash-words">
            <div className="cash-words-label">AMOUNT IN WORDS</div>

            <div className="cash-words-value">
              {amountToWords(receipt.amount)}
            </div>
          </div>
        </section>

        <section className="cash-bottom">
          <div>
            <div className="cash-terms-heading">TERMS &amp; NOTES</div>

            <ul className="cash-terms-list">
              <li>
                1. This receipt confirms the amount received against the
                referenced quotation.
              </li>
              <li>2. Please retain this receipt for your records.</li>
              <li>3. All amounts are stated in AED.</li>
            </ul>
          </div>

          <div className="cash-stamp-signature">
            <div className="cash-stamp-space">
              {printAssets.sealStamp ? (
                <img src={printAssets.sealStamp} alt="Company Seal & Stamp" />
              ) : null}
            </div>

            <div className="cash-signature-caption">
              Authorised Signature &amp; Stamp
            </div>
          </div>
        </section>

        <footer className="cash-footer">
          {/* <div className="cash-contact">
            For any questions, please contact {companyPhone || "-"}
            {companyEmail ? ` | ${companyEmail}` : ""}
          </div> */}

          <div className="cash-thank-you">Thank You For Your Business!</div>
        </footer>
      </div>
    </PrintDocument>
  );
}
