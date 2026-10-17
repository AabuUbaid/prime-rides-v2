function sanitizePrintValue(value, fallback = "") {
  return String(value || fallback)
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ");
}

function waitForPrintImage(image, timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (image.complete) {
      resolve();
      return;
    }

    let timeoutId;

    const finish = () => {
      window.clearTimeout(timeoutId);
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };

    image.addEventListener("load", finish);
    image.addEventListener("error", finish);

    timeoutId = window.setTimeout(finish, timeoutMs);

    // Handle an image that loads while listeners are being attached.
    if (image.complete) {
      finish();
    }
  }).then(async () => {
    if (
      image.complete &&
      image.naturalWidth > 0 &&
      typeof image.decode === "function"
    ) {
      try {
        await image.decode();
      } catch {
        // Don't block printing if an image cannot be decoded.
      }
    }
  });
}

function waitForPrintImages() {
  const images = Array.from(
    document.querySelectorAll(".print-area img"),
  );

  return Promise.all(images.map(waitForPrintImage));
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

  waitForPrintImages().then(() => {
    window.print();
  });
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
