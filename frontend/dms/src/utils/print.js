function sanitizePrintValue(value, fallback = "") {
  return String(value || fallback)
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ");
}

export function printDocument({
  customerName = "Customer",
  documentNumber = "Document",
}) {
  const previousTitle = document.title;

  const safeCustomerName = sanitizePrintValue(customerName, "Customer");

  const safeDocumentNumber = sanitizePrintValue(documentNumber, "Document");

  document.title = `${safeCustomerName}-${safeDocumentNumber}`;

  const restoreTitle = () => {
    document.title = previousTitle;

    window.removeEventListener("afterprint", restoreTitle);
  };

  window.addEventListener("afterprint", restoreTitle);

  window.print();
}

export function printInventoryVehicle(car) {
  window.print();

  return car;
}
