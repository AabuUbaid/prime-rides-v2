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

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
    return `AED ${numberToWords(whole)} and ${numberToWords(fils)} Fils Only`;
  }

  return `AED ${numberToWords(whole)} Only`;
}

function getAddressLines(address) {
  const raw = String(address || "").trim();

  if (!raw) {
    return ["-", "", "", ""];
  }

  const newlineParts = raw
    .split(/\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (newlineParts.length > 1) {
    return newlineParts.slice(0, 4);
  }

  const commaParts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (commaParts.length >= 2) {
    const lines = [];
    let current = "";

    for (const part of commaParts) {
      const candidate = current ? `${current}, ${part}` : part;

      if (candidate.length > 52 && current) {
        lines.push(current);
        current = part;
      } else {
        current = candidate;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines.slice(0, 4);
  }

  return [raw];
}

function BodyRow({ row, zebra, label, value, amount }) {
  return (
    <div className={`proforma-body-row ${zebra ? "zebra" : ""}`}>
      <div className="proforma-label-cell">{label ? `${label} :` : ""}</div>
      <div className="proforma-value-cell">{value ?? ""}</div>
      <div className="proforma-row-amount">{amount ?? ""}</div>
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
  const addressLines = getAddressLines(company?.showroom_address);
  const vehicleName = [proforma.vehicle_make, proforma.vehicle_model]
    .filter(Boolean)
    .join(" ");

  const netFinance = proforma.net_finance;
  const vehiclePrice = proforma.vehicle_price;
  const downPayment = proforma.down_payment;

  const bodyRows = [
    { label: "", value: "", amount: "" },
    { label: "", value: "", amount: "" },

    {
      label: "Model & Maker",
      value: vehicleName,
    },

    {
      label: "Year",
      value: proforma.vehicle_year,
    },

    {
      label: "Chassis No",
      value: proforma.vehicle_chassis_number,
    },

    {
      label: "Engine Number",
      value: proforma.vehicle_engine_number,
    },

    {
      label: "Cost Of The Vehicle",
      value: "",
      amount: formatNumber(vehiclePrice),
    },

    { label: "", value: "", amount: "" },

    ...(isFinance
      ? [
          {
            label: "Down Payment Amount",
            value: "",
            amount: formatNumber(downPayment),
          },
        ]
      : []),

    { label: "", value: "", amount: "" },
    { label: "", value: "", amount: "" },
    { label: "", value: "", amount: "" },
  ];

  return (
    <PrintDocument company={company} showHeader={false} showFooter={false}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0;
          }

          :root {
            --bar: #3B5393;
            --head: #2B4A8E;
            --zebra: #F2F2F2;
            --box: #CDD3EA;
            --border: #000000;
          }

          .proforma-print-page,
          .proforma-print-page *,
          .proforma-print-page *::before,
          .proforma-print-page *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .proforma-print-page {
            position: relative;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #fff;
            color: #000;
            font-family: Tahoma, Verdana, Arial, sans-serif;
            font-weight: 700;
            font-size: 8pt;
            line-height: 1;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .proforma-frame {
            position: absolute;
            left: 17.5mm;
            top: 31.2mm;
            width: 173.8mm;
            height: 234.6mm;
            border: 1.3pt solid var(--border);
            overflow: hidden;
          }

          .proforma-header {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 19.2mm;
            border-bottom: 1.3pt solid var(--border);
          }

          .proforma-logo {
            position: absolute;
            left: 7mm;
            top: 3.1mm;
            width: 25.5mm;
            height: 13mm;
            object-fit: contain;
            object-position: left center;
          }

          .proforma-company-name {
            position: absolute;
            left: 52.3mm;
            top: 9.6mm;
            width: 83mm;
            color: var(--head);
            font-size: 12.3pt;
            line-height: 1;
            font-weight: 700;
            white-space: nowrap;
            transform: translateY(-50%);
          }

          .proforma-title {
            position: absolute;
            left: 50%;
            top: 23mm;
            width: 74mm;
            transform: translate(-50%, -50%);
            color: var(--head);
            font-size: 12.1pt;
            line-height: 1;
            font-weight: 700;
            text-align: center;
            text-decoration: underline;
            text-decoration-thickness: 0.9pt;
            text-underline-offset: 0.7mm;
            white-space: nowrap;
          }

          .proforma-address {
            position: absolute;
            left: 3.5mm;
            top: 25.72mm;
            width: 92mm;
            font-size: 8pt;
            line-height: 4.36mm;
            font-weight: 700;
            white-space: nowrap;
          }

          .proforma-address-line {
            height: 4.36mm;
          }

          .proforma-meta {
            position: absolute;
            left: 106mm;
            top: 30.0mm;
            width: 61mm;
            font-size: 7.9pt;
            line-height: 4.35mm;
            font-weight: 700;
          }

          .proforma-meta-row {
            display: grid;
            grid-template-columns: 39mm 22mm;
            align-items: center;
            height: 4.35mm;
          }

          .proforma-meta-label {
            text-align: right;
            padding-right: 2.4mm;
            white-space: nowrap;
          }

          .proforma-meta-value {
            text-align: center;
            white-space: nowrap;
          }

          .proforma-bar {
            position: absolute;
            left: 0;
            width: 76.1mm;
            height: 4.5mm;
            background: var(--bar);
            color: #fff;
            padding-left: 3.5mm;
            display: flex;
            align-items: center;
            font-size: 9.6pt;
            line-height: 1;
            font-weight: 700;
            white-space: nowrap;
          }

          .proforma-bank-bar {
            top: 56.3mm;
          }

          .proforma-customer-bar {
            top: 78mm;
          }

          .proforma-bank-details {
            position: absolute;
            left: 3.5mm;
            top: 65.1mm;
            font-size: 8pt;
            line-height: 4.2mm;
            font-weight: 700;
          }

          .proforma-customer-details {
            position: absolute;
            left: 3.5mm;
            top: 89.05mm;
            font-size: 8pt;
            line-height: 4.5mm;
            font-weight: 700;
            white-space: nowrap;
          }

          .proforma-customer-name {
            text-transform: uppercase;
          }

          .proforma-table-top-rule {
            position: absolute;
            left: 0;
            top: 102.4mm;
            width: 100%;
            height: 1.3pt;
            background: var(--border);
          }

          .proforma-table-header {
            position: absolute;
            left: 0;
            top: 102.9mm;
            width: 100%;
            height: 4.5mm;
            display: grid;
            grid-template-columns: 143.5mm 30.3mm;
            background: var(--bar);
            color: #fff;
            font-size: 9.6pt;
            line-height: 1;
            font-weight: 700;
          }

          .proforma-table-header-description {
            padding-left: 3.5mm;
            display: flex;
            align-items: center;
          }

          .proforma-table-header-amount {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .proforma-body {
            position: absolute;
            left: 0;
            top: 107.4mm;
            width: 100%;
            height: 56.7mm;
          }

          .proforma-body::after {
            content: "";
            position: absolute;
            left: 143.5mm;
            top: -4.5mm;
            width: 1.3pt;
            height: 61.2mm;
            background: var(--border);
          }

          .proforma-body-row {
            position: relative;
            display: grid;
            grid-template-columns: 81.4mm 62.1mm 30.3mm;
            width: 100%;
            height: 4.725mm;
            align-items: center;
            font-size: 8.5pt;
            line-height: 1;
            font-weight: 400;
          }

          .proforma-body-row.zebra {
            background: var(--zebra);
          }

          .proforma-label-cell {
            padding-right: 1.8mm;
            text-align: right;
            font-size: 8.7pt;
            font-weight: 700;
            white-space: nowrap;
          }

          .proforma-value-cell {
            padding-left: 1.7mm;
            padding-right: 1.5mm;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
          }

          .proforma-row-amount {
            padding-right: 2.1mm;
            text-align: right;
            white-space: nowrap;
            font-size: 8.8pt;
            font-weight: 400;
          }

          .proforma-table-bottom-rule {
            position: absolute;
            left: 0;
            top: 164.1mm;
            width: 100%;
            height: 1.3pt;
            background: var(--border);
          }

          .proforma-total-label {
            position: absolute;
            left: 43.7mm;
            top: 170.8mm;
            font-size: 8pt;
            font-weight: 700;
            white-space: nowrap;
          }

          .proforma-total-words {
            position: absolute;
            left: 32.4mm;
            top: 176mm;
            font-size: 8pt;
            font-weight: 700;
            white-space: nowrap;
          }

          .proforma-total-box {
            position: absolute;
            left: 143.5mm;
            width: 30.3mm;
            height: 5.2mm;
            background: var(--box);
            border: 0.6pt solid #555;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 2.1mm;
            font-size: 8.8pt;
            font-weight: 700;
            white-space: nowrap;
          }

          .proforma-net-box {
            top: 174.3mm;
          }

          .proforma-vehicle-label {
            position: absolute;
            left: 43.7mm;
            top: 189.7mm;
            font-size: 8pt;
            font-weight: 700;
            white-space: nowrap;
          }

          .proforma-vehicle-words {
            position: absolute;
            left: 31.9mm;
            top: 194.7mm;
            width: 67mm;
            font-size: 8pt;
            line-height: 4mm;
            font-weight: 700;
            white-space: normal;
            overflow-wrap: break-word;
          }

          .proforma-vehicle-box {
            top: 193.4mm;
          }

          .proforma-stamp {
            position: absolute;
            left: 100.7mm;
            top: 188.9mm;
            width: 40.2mm;
            height: 25.7mm;
            max-width: 40.2mm;
            max-height: 25.7mm;
            object-fit: contain;
            object-position: center center;
            z-index: 10;
            pointer-events: none;
          }

          .proforma-footer {
            position: absolute;
            left: 0;
            top: 215.75mm;
            width: 100%;
            text-align: center;
            font-weight: 700;
          }

          .proforma-footer-line-1,
          .proforma-footer-line-2 {
            font-size: 8pt;
            line-height: 4.7mm;
            white-space: nowrap;
          }

          .proforma-footer-line-3 {
            font-size: 10pt;
            line-height: 4.8mm;
            white-space: nowrap;
          }

          /* -----------------------------------------
   CASH PROFORMA LAYOUT
   ----------------------------------------- */

.proforma-print-page.is-cash .proforma-customer-bar {
  top: 56.3mm;
}

.proforma-print-page.is-cash .proforma-customer-details {
  top: 67.35mm;
}

.proforma-print-page.is-cash .proforma-table-top-rule {
  top: 80.7mm;
}

.proforma-print-page.is-cash .proforma-table-header {
  top: 81.2mm;
}

.proforma-print-page.is-cash .proforma-body {
  top: 85.7mm;
  height: 51.975mm;
}

.proforma-print-page.is-cash .proforma-body::after {
  height: 56.475mm;
}

.proforma-print-page.is-cash .proforma-table-bottom-rule {
  top: 137.675mm;
}

/* Cash does not have Net Finance.
   Vehicle Price occupies that summary area. */

.proforma-print-page.is-cash .proforma-vehicle-label {
  top: 144.375mm;
}

.proforma-print-page.is-cash .proforma-vehicle-words {
  top: 149.575mm;
}

.proforma-print-page.is-cash .proforma-vehicle-box {
  top: 147.875mm;
}

.proforma-print-page.is-cash .proforma-stamp {
  top: 143.375mm;
}

.proforma-print-page.is-cash .proforma-footer {
  top: 170.225mm;
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
              background: #fff !important;
            }

            body {
              font-family: Tahoma, Verdana, Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              overflow: visible !important;
            }

            .print-area,
            .print-document {
              display: block !important;
              position: static !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              border: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
            }

            .proforma-print-page {
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      <div
        className={`proforma-print-page ${
          isFinance ? "is-finance" : "is-cash"
        }`}
      >
        <div className="proforma-frame">
          <header className="proforma-header">
            {printAssets.logo ? (
              <img src={printAssets.logo} alt="" className="proforma-logo" />
            ) : null}

            <div className="proforma-company-name">
              {company?.legal_entity_name || "-"}
            </div>
          </header>

          <div className="proforma-title">Proforma Invoice</div>

          <div className="proforma-address">
            {addressLines.map((line, index) => (
              <div className="proforma-address-line" key={`address-${index}`}>
                {line}
              </div>
            ))}
            <div className="proforma-address-line">
              Work :{" "}
              {company?.official_phone || company?.main_contact_mobile || "-"}
            </div>
            <div className="proforma-address-line">
              E-mail : {company?.corporate_email || "-"}
            </div>
          </div>

          <div className="proforma-meta">
            <div className="proforma-meta-row">
              <div className="proforma-meta-label">DATE :</div>
              <div className="proforma-meta-value">
                {formatDate(proforma.proforma_date)}
              </div>
            </div>
            <div className="proforma-meta-row">
              <div className="proforma-meta-label">PRINV #</div>
              <div className="proforma-meta-value">
                {proforma.proforma_number || "-"}
              </div>
            </div>
            <div className="proforma-meta-row">
              <div className="proforma-meta-label">CUSTOMER ID :</div>
              <div className="proforma-meta-value">{customerId ?? "-"}</div>
            </div>
          </div>

          {isFinance && (
            <>
              <div className="proforma-bar proforma-bank-bar">
                BANK (Financed By)
              </div>

              <div className="proforma-bank-details">
                <div>{proforma.bank_financed_by || "-"}</div>

                <div>LPO No : {proforma.lpo || "-"}</div>
              </div>
            </>
          )}

          <div className="proforma-bar proforma-customer-bar">CUSTOMER</div>
          <div className="proforma-customer-details">
            <div className="proforma-customer-name">
              {proforma.customer_name || "-"}
            </div>
            <div>MOBILE : {proforma.customer_mobile || "-"}</div>
          </div>

          <div className="proforma-table-top-rule" />

          <div className="proforma-table-header">
            <div className="proforma-table-header-description">DESCRIPTION</div>
            <div className="proforma-table-header-amount">AMOUNT</div>
          </div>

          <div className="proforma-body">
            {bodyRows.map((row, index) => (
              <BodyRow
                key={`row-${index + 1}`}
                row={row}
                zebra={(index + 1) % 2 === 0}
                label={row.label}
                value={row.value}
                amount={row.amount}
              />
            ))}
          </div>

          <div className="proforma-table-bottom-rule" />

          {isFinance && (
            <>
              <div className="proforma-total-label">Net Finance Amount</div>

              <div className="proforma-total-words">
                {netFinance !== null && netFinance !== undefined
                  ? amountToWords(netFinance)
                  : "-"}
              </div>

              <div className="proforma-total-box proforma-net-box">
                {formatNumber(netFinance)}
              </div>
            </>
          )}

          <div className="proforma-vehicle-label">Vehicle Price</div>
          <div className="proforma-vehicle-words">
            {amountToWords(vehiclePrice)}
          </div>
          <div className="proforma-total-box proforma-vehicle-box">
            {formatNumber(vehiclePrice)}
          </div>

          {includeSealStamp && printAssets.sealStamp ? (
            <img
              src={printAssets.sealStamp}
              alt=""
              className="proforma-stamp"
            />
          ) : null}

          <footer className="proforma-footer">
            <div className="proforma-footer-line-1">
              If you have any questions about this price quote, please contact
            </div>
            <div className="proforma-footer-line-2">
              Phone :{" "}
              {company?.official_phone || company?.main_contact_mobile || "-"},
              E-mail : {company?.corporate_email || "-"}
            </div>
            <div className="proforma-footer-line-3">
              Thank You For Your Business!
            </div>
          </footer>
        </div>
      </div>
    </PrintDocument>
  );
}
