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
    key: "least_selling_price",
    label: "Least Selling Price",
    roles: ALL_ROLES,
  },
  {
    key: "status",
    label: "Status",
    roles: ALL_ROLES,
    defaultSelected: false
  },
  {
    key: "chassis_number",
    label: "Chassis No",
    roles: ["MASTER", "ADMIN"],
  },
  {
    key: "engine_number",
    label: "Engine No",
    roles: ["MASTER", "ADMIN"],
  },
  {
    key: "date_added",
    label: "Date Added",
    roles: ["MASTER", "ADMIN"],
    defaultSelected: false
  },
  {
    key: "purchase_cost",
    label: "Purchase Cost",
    roles: ["MASTER"],
    defaultSelected: false
  },
  {
    key: "total_cost",
    label: "Total Cost",
    roles: ["MASTER"],
    defaultSelected: false
  },
  {
    key: "notes",
    label: "Notes",
    roles: ["MASTER"],
    defaultSelected: false
  },
  {
    key: "source",
    label: "Source",
    roles: ["MASTER"],
    defaultSelected: false
  },
  {
    key: "expenses_total",
    label: "Expenses Total",
    roles: ["MASTER"],
    defaultSelected: false
  },
  {
    key: "est_margin",
    label: "Est. Margin",
    roles: ["MASTER"],
    defaultSelected: false
  },
  {
    key: "days_in_stock",
    label: "Days in Stock",
    roles: ALL_ROLES,
    defaultSelected: false
  },
];

export function getInventoryStockOutputFields(role) {
  return INVENTORY_STOCK_OUTPUT_FIELDS.filter((field) =>
    field.roles.includes(role),
  );
}
