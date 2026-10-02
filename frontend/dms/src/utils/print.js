function sanitizePrintValue(value, fallback = "") {
  return String(value || fallback)
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ");
}

export function printDocument({
  customerName = "Customer",
  documentNumber = "Document",
  documentTitle = "",
}) {
  const previousTitle = document.title;

  const safeCustomerName = sanitizePrintValue(customerName, "Customer");

  const safeDocumentNumber = sanitizePrintValue(documentNumber, "Document");

  document.title = documentTitle || `${safeCustomerName}-${safeDocumentNumber}`;

  const restoreTitle = () => {
    document.title = previousTitle;

    window.removeEventListener("afterprint", restoreTitle);
  };

  window.addEventListener("afterprint", restoreTitle);

  window.print();
}

export function printInventoryVehicle(car) {
  const existingStyle = document.getElementById(
    "prime-rides-vehicle-print-style",
  );

  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement("style");

  style.id = "prime-rides-vehicle-print-style";

  style.textContent = `
    @page {
      size: 13.333in 7.5in;
      margin: 0;
    }

    @media print {
      html,
      body {
        width: 13.333in !important;
        height: 7.5in !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .inventory-vehicle-print-wrapper {
        display: block !important;
        position: absolute !important;

        left: 0 !important;
        top: 0 !important;

        width: 1280px !important;
        height: 720px !important;

        margin: 0 !important;
        padding: 0 !important;

        overflow: hidden !important;
      }

      .inventory-vehicle-print {
        width: 1280px !important;
        height: 720px !important;

        margin: 0 !important;
        padding: 0 !important;

        overflow: hidden !important;
      }
    }
  `;

  document.head.appendChild(style);

  const cleanup = () => {
    const activeStyle = document.getElementById(
      "prime-rides-vehicle-print-style",
    );

    if (activeStyle) {
      activeStyle.remove();
    }

    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  window.print();
}
