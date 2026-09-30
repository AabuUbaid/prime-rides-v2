import PrintDocument from "../PrintDocument";
import { INVENTORY_STOCK_OUTPUT_FIELDS } from "../../../utils/inventoryStockOutput";

const STATUS_LABELS = {
  available: "Available",
  upcoming: "Upcoming",
  reserved: "Reserved",
  booked: "Booked",
  sold: "Sold",
  in_service: "In Service",
  in_house: "In House",
};

const FIRST_PAGE_VEHICLES = 33;
const OTHER_PAGE_VEHICLES = 39;

function getStatusLabel(value) {
  return STATUS_LABELS[value] || value || "-";
}

function formatMileage(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `${number.toLocaleString("en-AE")} KM`;
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `AED ${number.toLocaleString("en-AE")}`;
}

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
    year: "2-digit",
  });
}

function formatFieldValue(car, fieldKey) {
  switch (fieldKey) {
    case "stock_id":
      return car.stock_id || "-";

    case "make":
      return car.make || "-";

    case "model":
      return car.model || "-";

    case "year":
      return car.year || "-";

    case "colour":
      return car.colour || "-";

    case "mileage":
      return formatMileage(car.mileage);

    case "asking_price":
      return car.status === "booked" ? "-" : formatPrice(car.asking_price);

    case "status":
      return getStatusLabel(car.status);

    case "chassis_number":
      return car.chassis_number || "-";

    case "date_added":
      return formatDate(car.date_added || car.created_at);

    case "least_selling_price":
      return formatPrice(car.least_selling_price);

    case "purchase_cost":
      return formatPrice(car.purchase_cost);

    case "engine_number":
      return car.engine_number || "-";

    case "expected_arrival":
      return formatDate(car.expected_arrival);

    case "total_cost":
      return formatPrice(car.total_cost);

    case "notes":
      return car.notes || "-";

    case "source":
      return car.source || "-";

    case "expenses_total":
      return formatPrice(car.expenses_total);

    case "est_margin":
      return formatPrice(car.est_margin);

    case "days_in_stock":
      return car.days_in_stock ?? "-";

    default:
      return "-";
  }
}

function getColumnClass(fieldKey) {
  switch (fieldKey) {
    case "stock_id":
      return "stock-col-stock-id";

    case "make":
      return "stock-col-make";

    case "model":
      return "stock-col-model";

    case "year":
      return "stock-col-year";

    case "chassis_number":
      return "stock-col-chassis";

    case "colour":
      return "stock-col-colour";

    case "mileage":
      return "stock-col-mileage";

    case "asking_price":
      return "stock-col-asking";

    case "least_selling_price":
      return "stock-col-least";

    case "status":
      return "stock-col-status";

    case "date_added":
      return "stock-col-date";

    default:
      return "stock-col-generic";
  }
}

export default function InventoryStockPrintTemplate({
  cars = [],
  selectedFields = [],
  company = {},
}) {
  const selectedFieldDefinitions = INVENTORY_STOCK_OUTPUT_FIELDS.filter(
    (field) => {
      if (!selectedFields.includes(field.key)) {
        return false;
      }

      return cars.some((car) => formatFieldValue(car, field.key) !== "-");
    },
  );

  const generatedDate = new Date().toLocaleDateString("en-US");

  const pages = [];

  if (cars.length > 0) {
    pages.push(cars.slice(0, FIRST_PAGE_VEHICLES));

    for (
      let start = FIRST_PAGE_VEHICLES;
      start < cars.length;
      start += OTHER_PAGE_VEHICLES
    ) {
      pages.push(cars.slice(start, start + OTHER_PAGE_VEHICLES));
    }
  }

  return (
    <PrintDocument
      // documentType="STOCK LIST"
      documentNumber="Stock List"
      date={generatedDate}
      company={company}
    >
      <div className="inventory-stock-pdf">
        <style>
          {`
            .inventory-stock-pdf {
              width: 100%;
              padding: 0;
              margin: 0;
              background: #ffffff;
              color: #111111;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8px;
            }

            .inventory-stock-pdf-header {
              display: grid;
              grid-template-columns: 18% 64% 18%;
              align-items: center;
              min-height: 25px;
              background: #000000;
              color: #ffffff;
              border: 1px solid #000000;
            }

            .inventory-stock-pdf-brand {
              padding: 4px 5px;
              font-size: 7px;
              font-weight: 700;
              line-height: 1;
              text-transform: uppercase;
              letter-spacing: 0.2px;
            }

            .inventory-stock-pdf-company {
              padding: 4px 3px;
              text-align: center;
              font-size: 10px;
              font-weight: 700;
              line-height: 1;
              text-transform: uppercase;
            }

            .inventory-stock-pdf-date {
              padding: 4px 5px;
              text-align: right;
              font-size: 8px;
              font-weight: 700;
            }

            .inventory-stock-pdf-table th,
            .inventory-stock-pdf-table td {
              border: 1px solid #666666;
              padding: 2px 3px;
              height: 17px;
              line-height: 1.05;
              vertical-align: middle;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .inventory-stock-pdf-table th {
              background: #d9ead3;
              text-align: center;
              font-size: 7px;
              font-weight: 800;
            }

            .inventory-stock-pdf-table tbody tr:nth-child(even) td {
              background: #d9d9d9;
            }

            .inventory-stock-pdf-table tbody tr:nth-child(odd) td {
              background: #ffffff;
            }

            .inventory-stock-pdf-table td {
              font-size: 7px;
              font-weight: 600;
              text-align: center;
            }

            .inventory-stock-pdf-table td.stock-col-make,
            .inventory-stock-pdf-table td.stock-col-model {
              text-align: left;
            }

            .inventory-stock-pdf-table td.stock-col-stock-id {
              text-align: left;
              font-weight: 700;
            }

            .inventory-stock-pdf-table .blank-row td {
              height: 16px;
              background: #d9d9d9;
            }

            .inventory-stock-pdf-table .blank-row:nth-child(even) td {
              background: #ffffff;
            }

            @page {
  size: A4 landscape;
  margin: 8mm 8mm 18mm 8mm;
}

            @media print {
              .inventory-stock-pdf {
                width: 100%;
              }

              .inventory-stock-pdf-header {
  break-inside: avoid;
}

.inventory-stock-pdf-table {
  break-inside: auto;
}

.inventory-stock-pdf-table thead {
  display: table-header-group;
}

.inventory-stock-pdf-table tbody {
  display: table-row-group;
}

            @page {
  size: A4 landscape;
  margin: 8mm 8mm 18mm 8mm;
}

.inventory-stock-print-wrapper .print-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  padding: 4px 0;
  border-top: 1px solid #777777;
  background: #ffffff;
  color: #333333;
  font-size: 7px;
  line-height: 1.15;
  text-align: center;
}

.inventory-stock-print-wrapper .print-footer > div {
  margin: 1px 0;
}

.inventory-stock-pages {
  width: 100%;
}

.inventory-stock-print-page {
  width: 100%;
  margin: 0;
  padding: 0;
}

.inventory-stock-print-page-break {
  break-after: page;
  page-break-after: always;
}

.inventory-stock-pdf-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.inventory-stock-pdf-table th,
.inventory-stock-pdf-table td {
  border: 1px solid #666666;
  padding: 2px 3px;
  height: 17px;
  line-height: 1.05;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inventory-stock-pdf-table th {
  background: #d9ead3;
  text-align: center;
  font-size: 7px;
  font-weight: 800;
}

.inventory-stock-pdf-table tbody tr:nth-child(even) td {
  background: #d9d9d9;
}

.inventory-stock-pdf-table tbody tr:nth-child(odd) td {
  background: #ffffff;
}

.inventory-stock-pdf-table td {
  font-size: 7px;
  font-weight: 600;
  text-align: center;
}

.inventory-stock-pdf-table td.stock-col-make,
.inventory-stock-pdf-table td.stock-col-model {
  text-align: left;
}

.inventory-stock-pdf-table td.stock-col-stock-id {
  text-align: left;
  font-weight: 700;
}

.inventory-stock-title-row th {
  height: 20px;
  padding: 3px 5px;
  background: #000000;
  color: #ffffff;
  border-color: #000000;
}

.inventory-stock-title-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
}

@media print {
  .inventory-stock-pdf {
    width: 100%;
  }

  .inventory-stock-print-page {
    width: 100%;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .inventory-stock-print-page-break {
    break-after: page;
    page-break-after: always;
  }

  .inventory-stock-pdf-table {
    width: 100%;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .inventory-stock-pdf-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .inventory-stock-pdf-table thead {
    display: table-header-group;
  }
}
          `}
        </style>

        <div className="inventory-stock-pages">
          {pages.map((pageCars, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === pages.length - 1;

            return (
              <section
                key={`stock-print-page-${pageIndex}`}
                className={[
                  "inventory-stock-print-page",
                  isLastPage ? "" : "inventory-stock-print-page-break",
                ].join(" ")}
              >
                <table className="inventory-stock-pdf-table">
                  {isFirstPage && (
                    <thead>
                      <tr className="inventory-stock-title-row">
                        <th colSpan={selectedFieldDefinitions.length}>
                          <div className="inventory-stock-title-content">
                            <span>
                              {company?.legal_entity_name || "Company"}
                            </span>

                            <span>{generatedDate}</span>
                          </div>
                        </th>
                      </tr>

                      <tr>
                        {selectedFieldDefinitions.map((field) => (
                          <th key={field.key}>{field.label}</th>
                        ))}
                      </tr>
                    </thead>
                  )}

                  {!isFirstPage && (
                    <thead>
                      <tr>
                        {selectedFieldDefinitions.map((field) => (
                          <th key={field.key}>{field.label}</th>
                        ))}
                      </tr>
                    </thead>
                  )}

                  <tbody>
                    {pageCars.map((car) => (
                      <tr key={car.id}>
                        {selectedFieldDefinitions.map((field) => (
                          <td
                            key={`${car.id}-${field.key}`}
                            className={getColumnClass(field.key)}
                            title={String(formatFieldValue(car, field.key))}
                          >
                            {formatFieldValue(car, field.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>

        <div className="inventory-stock-pdf-header">
          {/* <div className="inventory-stock-pdf-brand">PRIME RIDES</div> */}

          <div className="inventory-stock-pdf-company">
            {company?.legal_entity_name || "Company"}
          </div>

          <div className="inventory-stock-pdf-date">{generatedDate}</div>
        </div>
      </div>
    </PrintDocument>
  );
}
