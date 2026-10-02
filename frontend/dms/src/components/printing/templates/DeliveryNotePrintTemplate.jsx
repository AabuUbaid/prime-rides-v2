import PrintDocument from "../PrintDocument";

function formatDate(value) {
  if (!value) {
    return "";
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

function formatQuantity(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toFixed(3);
}

function getVehicleDescription(deliveryNote) {
  return [
    deliveryNote?.vehicle_make,
    deliveryNote?.vehicle_model,
    deliveryNote?.vehicle_year,
    deliveryNote?.vehicle_colour,
    deliveryNote?.vehicle_chassis_number,
  ]
    .filter(
      (value) => value !== null && value !== undefined && String(value).trim(),
    )
    .map((value) => String(value).trim().toUpperCase())
    .join("/");
}

function getAddressLines(company) {
  const address = String(company?.showroom_address || "");

  return address
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function DeliveryNotePrintTemplate({
  deliveryNote,
  company,
  printAssets = {},
}) {
  if (!deliveryNote) {
    return null;
  }

  const addressLines = getAddressLines(company);
  const deliveryDate = formatDate(deliveryNote.delivery_date);
  const quantity = formatQuantity(deliveryNote.quantity);
  const description = getVehicleDescription(deliveryNote);
  const buyerName = String(deliveryNote.buyer_name || "").trim();
  const buyerSignature = String(deliveryNote.buyer_signature || "").trim();
  const buyerSignatureDate = formatDate(deliveryNote.buyer_signature_date);
  const companyName = String(
    company?.legal_entity_name || "PRIME RIDES ELECTRIC CARS TRADING L.L.C",
  ).trim();
  const taxRegistrationNumber = String(
    company?.tax_registration_number || "",
  ).trim();
  const workPhone = String(
    company?.official_phone || company?.main_contact_mobile || "",
  ).trim();
  const corporateEmail = String(company?.corporate_email || "").trim();

  return (
    <PrintDocument showHeader={false} showFooter={false}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0;
          }

          .delivery-note-print-page {
            box-sizing: border-box;
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            max-height: 297mm;
            margin: 0;
            padding: 0 11.2mm 0 16.5mm;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #ffffff;
            color: #333333;
            font-family: "Open Sans", "Noto Sans", Arial, sans-serif;
            font-size: 9pt;
            font-weight: 400;
            line-height: 1.15;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .delivery-note-print-page,
          .delivery-note-print-page * {
            box-sizing: border-box;
          }

          .delivery-note-title-block {
            padding-top: 20.5mm;
            text-align: right;
            color: #222222;
            flex: 0 0 auto;
          }

          .delivery-note-title {
            margin: 0;
            font-size: 28pt;
            font-weight: 300;
            line-height: 1.1;
            color: #222222;
            white-space: nowrap;
          }

          .delivery-note-number {
            margin-top: 1mm;
            font-size: 10pt;
            font-weight: 700;
            line-height: 1.1;
            color: #222222;
            white-space: nowrap;
          }

          .delivery-note-logo-wrap {
            flex: 0 0 auto;
            margin-top: 9.6mm;
            margin-left: 1mm;
            height: 14mm;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
          }

          .delivery-note-logo {
            display: block;
            width: 88mm;
            height: auto;
            max-height: 50mm;
            object-fit: contain;
            object-position: left top;
          }

          .delivery-note-company {
            flex: 0 0 auto;
            margin-top: 25mm;
            color: #333333;
          }

          .delivery-note-company-name {
            margin: 0;
            font-size: 10pt;
            font-weight: 700;
            line-height: 10.4pt;
            color: #333333;
            text-transform: uppercase;
          }

          .delivery-note-company-line {
            margin: 0;
            font-size: 9pt;
            font-weight: 400;
            line-height: 10.4pt;
            color: #333333;
            white-space: pre-wrap;
          }

          .delivery-note-company-address {
            margin: 0;
          }

          .delivery-note-deliver-row {
            flex: 0 0 auto;
            margin-top: 14mm;
            display: grid;
            grid-template-columns: 133.5mm minmax(0, 1fr);
            column-gap: 0;
            align-items: center;
            color: #333333;
          }

          .delivery-note-deliver-label {
            margin: 0;
            font-size: 10pt;
            font-weight: 400;
            line-height: 1.2;
          }

          .delivery-note-customer {
            margin-top: 0.4mm;
            font-size: 9pt;
            font-weight: 700;
            line-height: 1.2;
            color: #333333;
          }

          .delivery-note-date-wrap {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: center;
            column-gap: 2.5mm;
            min-width: 0;
            font-size: 10pt;
            line-height: 1.2;
          }

          .delivery-note-date-label {
            font-weight: 400;
            white-space: nowrap;
          }

          .delivery-note-date-value {
            min-width: 0;
            font-size: 9pt;
            font-weight: 400;
            line-height: 1.2;
            text-align: right;
            white-space: nowrap;
          }

          .delivery-note-table-wrap {
            flex: 0 0 auto;
            width: 100%;
            margin-top: 5.5mm;
          }

          .delivery-note-table {
            width: 100% !important;
            margin: 0;
            border-collapse: collapse;
            border-spacing: 0;
            border-bottom: 1px solid #b5b5b5;
            table-layout: fixed;
            color: #333333;
            font-family: "Open Sans", "Noto Sans", Arial, sans-serif;
          }

          .delivery-note-table col.delivery-note-col-index {
            width: 14mm;
          }

          .delivery-note-table col.delivery-note-col-description {
            width: auto;
          }

          .delivery-note-table col.delivery-note-col-qty {
            width: 28mm;
          }

          .delivery-note-table thead tr {
            height: 8.5mm;
          }

          .delivery-note-table thead th {
            height: 8.5mm;
            padding: 0;
            border: 0;
            background: #3c3c3c;
            color: #ffffff;
            font-size: 10pt;
            font-weight: 400;
            line-height: 1;
            vertical-align: middle;
          }

          .delivery-note-table thead th:nth-child(1) {
            text-align: center;
          }

          .delivery-note-table thead th:nth-child(2) {
            padding-left: 0;
            text-align: left;
          }

          .delivery-note-table thead th:nth-child(3) {
            padding-right: 3mm;
            text-align: right;
          }

          .delivery-note-table tbody tr {
            height: 13mm;
          }

          .delivery-note-table tbody td {
            height: 13mm;
            padding: 4mm 0 0 0;
            border: 0;
            font-size: 9.5pt;
            font-weight: 400;
            line-height: 1.15;
            vertical-align: top;
          }

          .delivery-note-table tbody td:nth-child(1) {
            padding-right: 0;
            text-align: center;
            color: #333333;
          }

          .delivery-note-table tbody td:nth-child(2) {
            color: #222222;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .delivery-note-table tbody td:nth-child(3) {
            padding-right: 3mm;
            text-align: right;
            color: #333333;
          }

          .delivery-note-qty-value {
            display: block;
            font-size: 9.5pt;
            font-weight: 400;
            line-height: 1.15;
            white-space: nowrap;
          }

          .delivery-note-unit {
            display: block;
            margin-top: 0.2mm;
            font-size: 7pt;
            font-weight: 400;
            line-height: 1.15;
            color: #555555;
            white-space: nowrap;
          }

          .delivery-note-notes {
            flex: 0 0 auto;
            margin-top: 15mm;
            color: #333333;
          }

          .delivery-note-notes-title {
            margin: 0;
            font-size: 10pt;
            font-weight: 400;
            line-height: 1.2;
          }

          .delivery-note-ack-title {
            margin: 3mm 0 0;
            font-size: 8pt;
            font-weight: 400;
            line-height: 1.2;
          }

          .delivery-note-ack-text {
            margin: 4.5mm 0 0;
            width: 100%;
            max-width: 100%;
            font-size: 7.5pt;
            font-weight: 400;
            line-height: 9pt;
            color: #333333;
          }

          .delivery-note-buyer-name {
            margin: 5mm 0 0;
            font-size: 7.5pt;
            font-weight: 400;
            line-height: 9pt;
            color: #333333;
          }

          .delivery-note-signature {
            margin: 6mm 0 0;
            font-size: 7.5pt;
            font-weight: 400;
            line-height: 9pt;
            color: #333333;
          }

          .delivery-note-signature-date {
            margin: 0;
            font-size: 7.5pt;
            font-weight: 400;
            line-height: 9pt;
            color: #333333;
          }

          .delivery-note-footer {
            flex: 0 0 16.5mm;
            width: 100%;
            margin-top: auto;
            color: #5b5fc7;
          }

          .delivery-note-footer-rule {
            width: 100%;
            height: 1px;
            margin: 0;
            background: #999999;
          }

          .delivery-note-page-number {
            margin-top: 4.2mm;
            padding-right: 0.2mm;
            font-size: 7pt;
            font-weight: 400;
            line-height: 1;
            color: #5b5fc7;
            text-align: right;
          }

          @media screen and (max-width: 850px) {
            .delivery-note-print-page {
              width: 210mm;
              margin: 0 auto;
            }
          }

          @media print {
            html,
            body,
            #root {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              min-height: 0 !important;
              background: #ffffff !important;
            }

            body {
              color: #333333 !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .delivery-note-print-page {
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              padding: 0 11.2mm 0 16.5mm !important;
              overflow: hidden !important;
              background: #ffffff !important;
            }

            .delivery-note-print-page img {
              max-width: 100% !important;
            }

            .delivery-note-print-page .delivery-note-table {
              width: 100% !important;
            }

            .delivery-note-print-page .delivery-note-table thead th,
            .delivery-note-print-page .delivery-note-table tbody td {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .delivery-note-print-page .delivery-note-title-block,
            .delivery-note-print-page .delivery-note-logo-wrap,
            .delivery-note-print-page .delivery-note-company,
            .delivery-note-print-page .delivery-note-deliver-row,
            .delivery-note-print-page .delivery-note-table-wrap,
            .delivery-note-print-page .delivery-note-notes,
            .delivery-note-print-page .delivery-note-footer {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      <div className="delivery-note-print-page">
        <section className="delivery-note-title-block">
          <h1 className="delivery-note-title">Delivery Note</h1>
          <div className="delivery-note-number">
            Delivery Note# {deliveryNote.delivery_note_number || ""}
          </div>
        </section>

        <div className="delivery-note-logo-wrap">
          {printAssets.logo ? (
            <img src={printAssets.logo} alt="" className="delivery-note-logo" />
          ) : null}
        </div>

        <section className="delivery-note-company">
          <div className="delivery-note-company-name">{companyName}</div>

          {addressLines.map((line, index) => (
            <div
              className="delivery-note-company-line delivery-note-company-address"
              key={`address-${index}`}
            >
              {line}
            </div>
          ))}

          {taxRegistrationNumber ? (
            <div className="delivery-note-company-line">
              TRN {taxRegistrationNumber}
            </div>
          ) : null}

          {workPhone ? (
            <div className="delivery-note-company-line">Work : {workPhone}</div>
          ) : null}

          {corporateEmail ? (
            <div className="delivery-note-company-line">{corporateEmail}</div>
          ) : null}
        </section>

        <section className="delivery-note-deliver-row">
          <div>
            <div className="delivery-note-deliver-label">Deliver To</div>
            <div className="delivery-note-customer">
              {deliveryNote.customer_name || ""}
            </div>
          </div>

          <div className="delivery-note-date-wrap">
            <span className="delivery-note-date-label">Date :</span>
            <span className="delivery-note-date-value">{deliveryDate}</span>
          </div>
        </section>

        <div className="delivery-note-table-wrap">
          <table className="delivery-note-table">
            <colgroup>
              <col className="delivery-note-col-index" />
              <col className="delivery-note-col-description" />
              <col className="delivery-note-col-qty" />
            </colgroup>

            <thead>
              <tr>
                <th>#</th>
                <th>Item &amp; Description</th>
                <th>Qty</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>1</td>
                <td>{description}</td>
                <td>
                  <span className="delivery-note-qty-value">{quantity}</span>
                  <span className="delivery-note-unit">
                    {deliveryNote.unit || ""}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="delivery-note-notes">
          <div className="delivery-note-notes-title">Notes</div>

          <div className="delivery-note-ack-title">Buyer Acknowledgment</div>

          <div className="delivery-note-ack-text">
            I, the undersigned Buyer hereby confirm that I have received the
            above-mentioned vehicle and have personally inspected and
            test-driven it to my satisfaction.
            <br />I acknowledge that the vehicle is used and is sold on an
            "as-is, where-is" basis. The vehicle’s condition, mileage, and all
            other relevant details have been explained to me and I have accepted
            the same at the time of delivery.
          </div>

          <div className="delivery-note-buyer-name">
            Buyer Name:{buyerName ? ` ${buyerName}` : ""}
          </div>

          <div className="delivery-note-signature">
            Signature:{buyerSignature ? ` ${buyerSignature}` : ""}
          </div>

          <div className="delivery-note-signature-date">
            Date:{buyerSignatureDate ? ` ${buyerSignatureDate}` : ""}
          </div>
        </section>

        <footer className="delivery-note-footer">
          <div className="delivery-note-footer-rule" />
          <div className="delivery-note-page-number">1</div>
        </footer>
      </div>
    </PrintDocument>
  );
}
