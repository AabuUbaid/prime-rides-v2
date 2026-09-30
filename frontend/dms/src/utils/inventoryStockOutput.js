const ALL_ROLES = ["MASTER", "ADMIN", "SALES_STAFF"];

export const INVENTORY_STOCK_OUTPUT_FIELDS = [
  {
    key: "stock_id",
    label: "Stock ID",
    roles: ALL_ROLES,
  },
  {
    key: "make",
    label: "Make",
    roles: ALL_ROLES,
  },
  {
    key: "model",
    label: "Model",
    roles: ALL_ROLES,
  },
  {
    key: "year",
    label: "Year",
    roles: ALL_ROLES,
  },
  {
    key: "colour",
    label: "Colour",
    roles: ALL_ROLES,
  },
  {
    key: "mileage",
    label: "Mileage",
    roles: ALL_ROLES,
  },
  {
    key: "asking_price",
    label: "Asking Price",
    roles: ALL_ROLES,
  },
  {
    key: "status",
    label: "Status",
    roles: ALL_ROLES,
  },
  {
    key: "chassis_number",
    label: "Chassis No",
    roles: ["MASTER", "ADMIN"],
  },
  {
    key: "date_added",
    label: "Date Added",
    roles: ["MASTER", "ADMIN"],
  },
  {
    key: "least_selling_price",
    label: "Least Selling Price",
    roles: ["MASTER"],
  },
  {
    key: "purchase_cost",
    label: "Purchase Cost",
    roles: ["MASTER"],
  },
  {
    key: "engine_number",
    label: "Engine No",
    roles: ["MASTER"],
  },
  {
    key: "expected_arrival",
    label: "Expected Arrival",
    roles: ["MASTER"],
  },
  {
    key: "total_cost",
    label: "Total Cost",
    roles: ["MASTER"],
  },
  {
    key: "notes",
    label: "Notes",
    roles: ["MASTER"],
  },
  {
    key: "source",
    label: "Source",
    roles: ["MASTER"],
  },
  {
    key: "expenses_total",
    label: "Expenses Total",
    roles: ["MASTER"],
  },
  {
    key: "est_margin",
    label: "Est. Margin",
    roles: ["MASTER"],
  },
  {
    key: "days_in_stock",
    label: "Days in Stock",
    roles: ["MASTER"],
  },
];

export function getInventoryStockOutputFields(role) {
  return INVENTORY_STOCK_OUTPUT_FIELDS.filter((field) =>
    field.roles.includes(role),
  );
}
