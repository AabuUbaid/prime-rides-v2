import PrintDocument from "../PrintDocument";
const PROFORMA_LOGO = "/prime_rides_logo_gold_trimmed.png";

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

function displayValue(value, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function numericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return number.toLocaleString("en-AE", {
    maximumFractionDigits: 0,
  });
}

function amountToWords(value) {
  const number = numericValue(value);
  const rounded = Math.round((number + Number.EPSILON) * 100) / 100;

  if (rounded === 0) {
    return "UAE Dirhams Zero Only";
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
    return `UAE Dirhams ${wholeNumberToWords(
      whole,
    )} and ${wholeNumberToWords(fils)} Fils Only`;
  }

  return `UAE Dirhams ${wholeNumberToWords(whole)} Only`;
}

function vehicleValueClass(value) {
  const length = String(value ?? "-").length;

  if (length >= 29) {
    return "proforma-vehicle-value--xs";
  }

  if (length >= 23) {
    return "proforma-vehicle-value--sm";
  }

  return "proforma-vehicle-value--regular";
}

function SectionBar({ children, rightText = "" }) {
  return (
    <div className="proforma-section-bar">
      <span>{children}</span>
      {rightText ? <span>{rightText}</span> : null}
    </div>
  );
}

function ReferenceCell({ label, value }) {
  return (
    <div className="proforma-reference-cell">
      <div className="proforma-reference-label">{label}</div>
      <div className="proforma-reference-value">{displayValue(value)}</div>
    </div>
  );
}

export default function ProformaPrintTemplate({
  proforma,
  company,
  customerId = null,
  printAssets = {},
  includeSealStamp = false,
}) {
  if (!proforma) {
    return null;
  }

  const isFinance = proforma.payment_type === "finance";

  const companyName =
    company?.legal_entity_name || "Prime Rides Cars Trading LLC";
  const companyAddress = String(company?.showroom_address || "").trim();
  const companyPhone =
    company?.official_phone || company?.main_contact_mobile || "";
  const companyEmail = company?.corporate_email || "";

  const vehicleName = [proforma.vehicle_make, proforma.vehicle_model]
    .filter(Boolean)
    .join(" ");

  const vehiclePrice = proforma.vehicle_price;
  const vatAmount = proforma.vat;
  const downPayment = proforma.down_payment;
  const netFinance = proforma.net_finance;

  const amountInWords = isFinance
    ? amountToWords(netFinance)
    : amountToWords(vehiclePrice);

  return (
    <PrintDocument company={company} showHeader={false} showFooter={false}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0;
          }

          .proforma-page,
          .proforma-page *,
          .proforma-page *::before,
          .proforma-page *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .proforma-page {
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

          .proforma-page *,
          .proforma-page *::before,
          .proforma-page *::after {
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          /* HEADER */

          .proforma-header {
            position: relative;

            flex: 0 0 142px;

            width: calc(100% + 72px);
            height: 142px;
            margin: 0 -36px;

            background: var(--black);
            border-bottom: 4px solid var(--gold);

            overflow: hidden;
          }

          .proforma-logo {
            position: absolute;
            left: 36px;
            top: 30.5px;

            width: 189.8px;
            height: 78px;

            display: block;
            object-fit: contain;
            object-position: left center;
          }

          .proforma-company-block {
            position: absolute;
            left: 241.8px;
            top: 30px;

            width: 400px;
            max-width: 400px;

            overflow: hidden;
          }

          .proforma-company-name {
            color: var(--gold);

            font-family: "Times New Roman", Times, serif;
            font-size: 26px;
            line-height: 1.1;
            font-weight: 700;
            letter-spacing: 1px;

            white-space: nowrap;
          }

          .proforma-company-name.is-long {
            font-size: 20px;
          }

          .proforma-company-meta {
            margin-top: 4px;
            color: var(--header-text);

            font-size: 11.5px;
            line-height: 16px;
          }

          .proforma-header-contact {
            margin-top: 4px;
            color: var(--header-text);

            font-size: 11.5px;
            line-height: 16px;

            white-space: nowrap;
          }

          /* TITLE */

          .proforma-title-row {
            flex: 0 0 46px;
            height: 46px;

            margin-top: 16px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            border-bottom: 1px solid var(--gold);
          }

          .proforma-title {
            color: var(--gold);

            font-family: "Times New Roman", Times, serif;
            font-size: 30px;
            line-height: 1;
            font-style: italic;
          }

          .proforma-title-right {
            color: var(--black);

            font-size: 12.9px;
            line-height: 1;
          }

          /* REFERENCE */

          .proforma-reference {
            flex: 0 0 49px;
            height: 49px;

            margin-top: 10px;

            display: grid;
            grid-template-columns: 148.5px 176.3px 148.5px 1fr;

            background: var(--cream);
            border-left: 3px solid var(--gold);
          }

          .proforma-reference-cell {
            padding: 8px 12px;
            min-width: 0;
          }

          .proforma-reference-label {
            color: var(--gold);

            font-size: 10.5px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: 0.58px;
          }

          .proforma-reference-value {
            margin-top: 3px;

            color: var(--ink);
            font-size: 14.9px;
            line-height: 1.1;
            font-weight: 700;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* PARTIES */

          .proforma-parties {
            height: 72px;
            margin-top: 0;
            padding-top: 15px;
          }

          .proforma-party-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 20px;
          }

          .proforma-party {
            height: 57px;

            border-bottom: 1px solid var(--gold);
            overflow: hidden;
          }

          .proforma-party-heading {
            color: var(--gold);

            font-size: 10.9px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: 0.65px;
            text-transform: uppercase;
          }

          .proforma-party-name {
            margin-top: 8px;

            color: var(--ink);
            font-size: 14.9px;
            line-height: 1.05;
            font-weight: 700;
          }

          .proforma-party-meta {
            margin-top: 4px;

            color: var(--muted-label);
            font-size: 10.9px;
            line-height: 13px;
          }

          /* SECTION */

          .proforma-section {
            width: 100%;
            margin-top: 16px;
          }

          .proforma-section-bar {
            height: 30px;
            padding: 0 12px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            background: var(--black);
            color: var(--gold);

            font-family: "Times New Roman", Times, serif;
            font-size: 12.9px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          /* VEHICLE */

          .proforma-vehicle-row {
            display: grid;
            grid-template-columns: 110px 261px 90px 261px;
          }

          .proforma-vehicle-row.tall {
            min-height: 47px;
          }

          .proforma-vehicle-row.regular {
            min-height: 32px;
          }

          .proforma-vehicle-label,
          .proforma-vehicle-value,
          .proforma-vehicle-empty {
            min-width: 0;
            border-top: 1px solid var(--hairline);
          }

          .proforma-vehicle-row:last-child > * {
            border-bottom: 1px solid var(--hairline);
          }

          .proforma-vehicle-label {
            padding: 8px 12px;

            color: var(--muted-label);
            background: var(--cream);

            font-size: 12.9px;
            line-height: 15px;
            font-weight: 700;
          }

          .proforma-vehicle-value {
            padding: 8px 12px;

            color: var(--ink);
            background: #ffffff;

            font-size: 12.9px;
            line-height: 15px;
            font-weight: 700;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .proforma-vehicle-value--sm {
            font-size: 11.5px;
          }

          .proforma-vehicle-value--xs {
            font-size: 10.5px;
          }

          /* COMMERCIAL SUMMARY */

          .proforma-summary {
            margin-top: 12px;
          }

          .proforma-summary-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .proforma-summary-table th {
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

          .proforma-summary-table th:first-child {
            width: 70%;
            text-align: left;
          }

          .proforma-summary-table th:last-child {
            width: 30%;
            text-align: right;
          }

          .proforma-summary-table td {
            height: 30px;
            padding: 7px 12px;

            border-bottom: 1px solid var(--hairline);

            color: var(--ink);
            background: #ffffff;

            font-size: 12.9px;
            line-height: 16px;
          }

          .proforma-summary-amount {
            text-align: right;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }

          .proforma-summary-total td {
            height: 33px;

            background: var(--black);
            color: var(--gold);

            font-family: "Times New Roman", Times, serif;
            font-size: 16px;
            line-height: 1;
            font-weight: 700;
          }

          /* WORDS */

          .proforma-words {
            height: 36px;

            padding: 0 12px;

            display: flex;
            align-items: center;
            gap: 24px;

            border-top: 1px solid var(--hairline);
            border-bottom: 1px solid var(--hairline);
          }

          .proforma-words-label {
            flex: 0 0 auto;

            color: var(--muted-label);

            font-size: 10.9px;
            line-height: 1;
            font-weight: 700;
          }

          .proforma-words-value {
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

          .proforma-bottom {
            width: 100%;
            min-height: 90px;

            margin-top: auto;

            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 30px;
          }

          .proforma-terms {
            min-width: 0;
          }

          .proforma-terms-heading {
            padding-bottom: 4px;

            border-bottom: 1px solid var(--gold);

            color: var(--gold);

            font-size: 10.5px;
            line-height: 1;
            font-weight: 700;
            letter-spacing: 0.58px;
          }

          .proforma-terms-list {
            margin: 6px 0 0;
            padding: 0;

            list-style: none;

            color: var(--body);

            font-size: 12px;
            line-height: 19px;
          }

          .proforma-signature {
            min-width: 0;

            height: 90px;

            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: stretch;
          }

          .proforma-signature-space {
            position: relative;

            height: 65px;
            min-height: 65px;

            display: flex;
            align-items: flex-end;
            justify-content: center;

            overflow: visible;
          }

          .proforma-seal-stamp {
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

          .proforma-signature-caption {
            padding-top: 7px;

            border-top: 1px solid var(--hairline);

            color: var(--muted);

            font-size: 10.9px;
            line-height: 1;

            text-align: center;
          }

          /* DISCLAIMER + FOOTER */

          .proforma-disclaimer {
            position: absolute;

            left: 0;
            right: 0;
            bottom: 72px;

            color: var(--muted);

            font-size: 10px;
            line-height: 14px;

            text-align: center;

            z-index: 10;
          }

          .proforma-footer {
            position: absolute;

            left: 0;
            right: 0;
            bottom: 0;

            width: 100%;
            height: 65px;
          }

          .proforma-contact {
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

          .proforma-thank-you {
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
              size: A4 portrait !important;
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

            .proforma-page {
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;

              margin: 0 !important;
              overflow: hidden !important;

              break-after: auto !important;
              page-break-after: auto !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      <div className="proforma-page">
        <header className="proforma-header">
          <img
            src={PROFORMA_LOGO}
            alt="Prime Rides"
            className="proforma-logo"
          />

          <div className="proforma-company-block">
            <div
              className={`proforma-company-name${
                companyName.length > 28 ? " is-long" : ""
              }`}
            >
              {companyName}
            </div>

            <div className="proforma-company-meta">{companyAddress || "-"}</div>

            <div className="proforma-header-contact">
              Tel: {companyPhone || "-"}
              {companyEmail ? ` | ${companyEmail}` : ""}
            </div>
          </div>
        </header>

        <div className="proforma-title-row">
          <div className="proforma-title">Proforma Invoice</div>
          <div className="proforma-title-right">
            {isFinance ? "Vehicle Finance" : "Cash Purchase"}
          </div>
        </div>

        <section className="proforma-reference">
          <ReferenceCell
            label="PROFORMA INVOICE #"
            value={proforma.proforma_number}
          />

          <ReferenceCell
            label="DATE"
            value={formatDate(proforma.proforma_date)}
          />

          <ReferenceCell label="CUSTOMER ID" value={customerId} />

          <ReferenceCell label="TRN" value={company?.tax_registration_number} />
        </section>

        <section className="proforma-parties">
          <div className="proforma-party-grid">
            <div className="proforma-party">
              <div className="proforma-party-heading">
                {isFinance ? "BANK (FINANCED BY)" : "PAYMENT METHOD"}
              </div>

              <div className="proforma-party-name">
                {isFinance ? displayValue(proforma.bank_financed_by) : "Cash"}
              </div>

              <div className="proforma-party-meta">
                {isFinance
                  ? `LPO: ${displayValue(proforma.lpo)}`
                  : "Payment required as per agreed terms."}
              </div>
            </div>

            <div className="proforma-party">
              <div className="proforma-party-heading">CUSTOMER</div>

              <div className="proforma-party-name">
                {displayValue(proforma.customer_name)}
              </div>

              <div className="proforma-party-meta">
                Mobile: {displayValue(proforma.customer_mobile)}
              </div>
            </div>
          </div>
        </section>

        <section className="proforma-section">
          <SectionBar>VEHICLE DETAILS</SectionBar>

          <div className="proforma-vehicle-row tall">
            <div className="proforma-vehicle-label">Make &amp; Model</div>
            <div
              className={`proforma-vehicle-value ${vehicleValueClass(
                vehicleName,
              )}`}
            >
              {vehicleName || "-"}
            </div>

            <div className="proforma-vehicle-label">Year</div>
            <div className="proforma-vehicle-value">
              {displayValue(proforma.vehicle_year)}
            </div>
          </div>

          <div className="proforma-vehicle-row tall">
            <div className="proforma-vehicle-label">Chassis No.</div>
            <div
              className={`proforma-vehicle-value ${vehicleValueClass(
                proforma.vehicle_chassis_number,
              )}`}
            >
              {displayValue(proforma.vehicle_chassis_number)}
            </div>

            <div className="proforma-vehicle-label">Engine No.</div>
            <div
              className={`proforma-vehicle-value ${vehicleValueClass(
                proforma.vehicle_engine_number,
              )}`}
            >
              {displayValue(proforma.vehicle_engine_number)}
            </div>
          </div>

          <div className="proforma-vehicle-row regular">
            <div className="proforma-vehicle-label">Mileage</div>
            <div className="proforma-vehicle-value">
              {proforma.vehicle_mileage === null ||
              proforma.vehicle_mileage === undefined ||
              proforma.vehicle_mileage === ""
                ? "-"
                : `${Number(proforma.vehicle_mileage).toLocaleString(
                    "en-AE",
                  )} km`}
            </div>

            <div className="proforma-vehicle-label">Quote</div>
            <div className="proforma-vehicle-value">
              {displayValue(proforma.quote)}
            </div>
          </div>
        </section>

        <section className="proforma-section proforma-summary">
          <SectionBar rightText="AMOUNT (AED)">
            {isFinance ? "FINANCE BREAKDOWN" : "PRICE SUMMARY"}
          </SectionBar>

          <table className="proforma-summary-table">
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th>AMOUNT</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Vehicle Price</td>
                <td className="proforma-summary-amount">
                  {formatAmount(vehiclePrice)}
                </td>
              </tr>

              <tr>
                <td>VAT</td>
                <td className="proforma-summary-amount">
                  {formatAmount(vatAmount)}
                </td>
              </tr>

              {isFinance ? (
                <tr>
                  <td>Down Payment</td>
                  <td className="proforma-summary-amount">
                    {formatAmount(downPayment)}
                  </td>
                </tr>
              ) : null}

              {isFinance ? (
                <tr className="proforma-summary-total">
                  <td>NET FINANCE AMOUNT</td>
                  <td className="proforma-summary-amount">
                    {formatAmount(netFinance)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="proforma-section">
          <div className="proforma-words">
            <div className="proforma-words-label">
              {isFinance
                ? "NET FINANCE AMOUNT IN WORDS"
                : "VEHICLE PRICE IN WORDS"}
            </div>

            <div className="proforma-words-value">{amountInWords}</div>
          </div>
        </section>

        <section className="proforma-bottom">
          <div className="proforma-terms">
            <div className="proforma-terms-heading">TERMS &amp; NOTES</div>

            <ul className="proforma-terms-list">
              <li>All amounts are stated in AED.</li>
              <li>
                This proforma reflects the saved vehicle and payment
                information.
              </li>
            </ul>
          </div>

          <div className="proforma-signature">
            <div className="proforma-signature-space">
              {includeSealStamp && printAssets.sealStamp ? (
                <img
                  src={printAssets.sealStamp}
                  alt="Company Seal & Stamp"
                  className="proforma-seal-stamp"
                />
              ) : null}
            </div>

            <div className="proforma-signature-caption">
              Authorised Signature &amp; Stamp
            </div>
          </div>
        </section>

        {includeSealStamp && printAssets.sealStamp ? (
          <div className="proforma-disclaimer">
            * This is a system generated document.
          </div>
        ) : null}

        <footer className="proforma-footer">
          <div className="proforma-contact">
            For any questions about this proforma, please contact{" "}
            {companyPhone || "-"}
            {companyEmail ? ` | ${companyEmail}` : ""}
          </div>

          <div className="proforma-thank-you">Thank You For Your Business!</div>
        </footer>
      </div>
    </PrintDocument>
  );
}
