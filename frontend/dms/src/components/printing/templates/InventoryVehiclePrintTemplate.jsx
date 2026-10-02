const VEHICLE_PRINT_CSS = `
  @page {
    size: 13.333in 7.5in landscape;
    margin: 0;
  }

  @media print {
    html,
    body {
      width: 13.333in !important;
      height: 7.5in !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    body:has(.inventory-vehicle-print-wrapper) {
      margin: 0 !important;
      padding: 0 !important;
    }

    body:has(.inventory-vehicle-print-wrapper) * {
      visibility: hidden;
    }

    body:has(.inventory-vehicle-print-wrapper)
      .inventory-vehicle-print-wrapper,
    body:has(.inventory-vehicle-print-wrapper)
      .inventory-vehicle-print-wrapper * {
      visibility: visible;
    }

    body:has(.inventory-vehicle-print-wrapper)
      .inventory-vehicle-print-wrapper {
      display: block !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;

      width: 13.333in !important;
      height: 7.5in !important;

      margin: 0 !important;
      padding: 0 !important;

      overflow: hidden !important;
    }

    .inventory-vehicle-print {
      width: 1280px !important;
      height: 720px !important;

      margin: 0 !important;
      padding: 0 !important;

      position: relative !important;
      overflow: hidden !important;

      box-sizing: border-box !important;
    }
  }

  .inventory-vehicle-print-wrapper {
    display: none;
  }

  .inventory-vehicle-print {
    width: 1280px;
    height: 720px;

    margin: 0;
    padding: 0;

    position: relative;
    overflow: hidden;

    box-sizing: border-box;

    background: #ffffff;
    color: #1E1E1E;

    font-family: Arial, Helvetica, sans-serif;

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* =====================================================
     HEADER
     ===================================================== */

  .vehicle-print-header {
    position: absolute;
    left: 0;
    top: 0;

    width: 1280px;
    height: 115px;

    background: #1A2C5B;
  }

  .vehicle-print-number {
    position: absolute;
    left: 38px;
    top: 29px;

    width: 58px;
    height: 58px;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #D4AF37;
    color: #1A2C5B;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 16pt;
    font-weight: 700;
    line-height: 1;
  }

  .vehicle-print-vehicle-heading {
    position: absolute;
    left: 120px;
    top: 0;

    width: 600px;
    height: 115px;
  }

  .vehicle-print-make {
    position: absolute;
    left: 0;
    top: 16px;

    margin: 0;

    color: #AAC4FF;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 12pt;
    font-weight: 700;
    line-height: 1;

    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .vehicle-print-model {
    position: absolute;
    left: 0;
    top: 43px;

    margin: 0;

    color: #ffffff;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 28pt;
    font-weight: 700;
    line-height: 1;

    white-space: nowrap;
  }

  .vehicle-print-body-type {
    position: absolute;
    left: 768px;
    top: 36px;

    width: 154px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;

    background: #2A4A8A;
    color: #ffffff;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    font-weight: 700;
    line-height: 1;

    text-transform: uppercase;
    white-space: nowrap;

    overflow: hidden;
  }

  .vehicle-print-company {
    position: absolute;
    right: 42px;
    top: 0;

    width: 275px;
    height: 115px;

    text-align: right;
  }

  .vehicle-print-company-name {
    position: absolute;
    right: 0;
    top: 19px;

    color: #ffffff;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 18pt;
    font-weight: 700;
    line-height: 1;

    white-space: nowrap;
  }

  .vehicle-print-company-subtitle {
    position: absolute;
    right: 0;
    top: 60px;

    color: #AAC4FF;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    font-weight: 400;
    line-height: 1;

    letter-spacing: 2px;
    white-space: nowrap;
  }

  /* =====================================================
     MAIN AREA
     ===================================================== */

  .vehicle-print-main {
    position: absolute;
    left: 48px;
    top: 154px;

    width: 1184px;
    height: 403px;
  }

  /* =====================================================
     HERO PANEL
     ===================================================== */

  .vehicle-print-hero {
    position: absolute;
    left: 0;
    top: 0;

    width: 538px;
    height: 403px;

    box-sizing: border-box;

    overflow: hidden;
  }

  /* AVAILABLE */

  .vehicle-print-hero-available {
    background: #1A2C5B;
    border: none;
  }

  .vehicle-print-hero-available .vehicle-print-hero-label {
    color: #AAC4FF;
  }

  .vehicle-print-hero-label {
    position: absolute;
    left: 34px;
    top: 34px;

    margin: 0;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 12pt;
    font-weight: 700;
    line-height: 1;

    letter-spacing: 3px;
  }

  .vehicle-print-currency {
    position: absolute;
    left: 34px;
    top: 91px;

    color: #ffffff;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 22pt;
    font-weight: 700;
    line-height: 1;
  }

  .vehicle-print-price {
    position: absolute;
    left: 34px;
    top: 134px;

    width: 470px;
    height: 144px;

    display: flex;
    align-items: center;

    box-sizing: border-box;

    color: #D4AF37;

    font-family: "Arial Black", Arial, Helvetica, sans-serif;
    font-size: 66pt;
    font-weight: 900;
    line-height: 0.9;

    white-space: nowrap;
    overflow: hidden;
  }

  .vehicle-print-available-badge {
    position: absolute;
    left: 34px;
    top: 317px;

    width: 346px;
    height: 43px;

    display: flex;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;

    background: #1A7A3C;
    color: #ffffff;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    font-weight: 700;
    line-height: 1;

    white-space: nowrap;
  }

  /* BOOKED */

  .vehicle-print-hero-booked {
    background: #FFF4D6;
    border: 2px solid #D4AF37;
  }

  .vehicle-print-hero-booked .vehicle-print-hero-label {
    color: #8A6D0B;
  }

  .vehicle-print-booked {
    position: absolute;
    left: 34px;
    top: 115px;

    width: 466px;
    height: 154px;

    display: flex;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;

    color: #B8860B;

    font-family: "Arial Black", Arial, Helvetica, sans-serif;
    font-size: 54pt;
    font-weight: 900;
    line-height: 1;

    white-space: nowrap;
  }

  .vehicle-print-hero-booked .vehicle-print-status-subtitle {
    color: #8A6D0B;
  }

  /* COMING SOON */

  .vehicle-print-hero-coming-soon {
    background: #F0F2F5;
    border: 2px solid #1A2C5B;
  }

  .vehicle-print-hero-coming-soon .vehicle-print-hero-label {
    color: #6B7280;
  }

  .vehicle-print-coming-soon {
    position: absolute;
    left: 34px;
    top: 115px;

    width: 466px;
    height: 134px;

    display: flex;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;

    color: #1A2C5B;

    font-family: "Arial Black", Arial, Helvetica, sans-serif;
    font-size: 40pt;
    font-weight: 900;
    line-height: 1;

    white-space: nowrap;
  }

  .vehicle-print-hero-coming-soon .vehicle-print-status-subtitle {
    color: #6B7280;
  }

  .vehicle-print-status-subtitle {
    position: absolute;
    left: 34px;
    top: 307px;

    width: 470px;
    height: 30px;

    display: flex;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 12pt;
    font-weight: 400;
    line-height: 1;
  }

  /* =====================================================
     SPEC CARDS
     ===================================================== */

  .vehicle-print-spec-grid {
    position: absolute;
    left: 576px;
    top: 0;

    width: 607px;
    height: 403px;
  }

  .vehicle-print-spec-card {
    position: absolute;

    width: 294px;
    height: 192px;

    box-sizing: border-box;

    background: #F0F2F5;
    border: 1px solid #D5D9E2;

    overflow: hidden;
  }

  .vehicle-print-spec-card:nth-child(1) {
    left: 0;
    top: 0;
  }

  .vehicle-print-spec-card:nth-child(2) {
    left: 313px;
    top: 0;
  }

  .vehicle-print-spec-card:nth-child(3) {
    left: 0;
    top: 211px;
  }

  .vehicle-print-spec-card:nth-child(4) {
    left: 313px;
    top: 211px;
  }

  .vehicle-print-spec-label {
    position: absolute;
    left: 29px;
    top: 24px;

    color: #6B7280;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    font-weight: 700;
    line-height: 1;

    letter-spacing: 2px;
    white-space: nowrap;
  }

  .vehicle-print-spec-value {
    position: absolute;
    left: 29px;
    right: 29px;
    top: 67px;

    height: 96px;

    display: flex;
    align-items: center;

    box-sizing: border-box;

    color: #1E1E1E;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 30pt;
    font-weight: 700;
    line-height: 1;

    white-space: nowrap;
    overflow: hidden;
  }

  /* =====================================================
     PAYMENT STRIP
     ===================================================== */

  .vehicle-print-payment-strip {
    position: absolute;
    left: 48px;
    top: 595px;

    width: 1184px;
    height: 82px;

    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));

    box-sizing: border-box;

    background: #1A2C5B;
  }

  .vehicle-print-payment-item {
    display: flex;
    align-items: center;
    justify-content: center;

    color: #ffffff;

    font-family: Arial, Helvetica, sans-serif;
    font-size: 13pt;
    font-weight: 700;
    line-height: 1;

    text-align: center;
    white-space: nowrap;
  }
`;

function formatBodyType(value) {
  if (!value) {
    return "TBA";
  }

  return String(value).trim().replace(/_/g, " ").toUpperCase();
}

function formatMileage(value) {
  if (value === null || value === undefined || value === "") {
    return "TBA";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "TBA";
  }

  return `${number.toLocaleString("en-AE")} km`;
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "TBA";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "TBA";
  }

  return number.toLocaleString("en-AE");
}

function getChassisCode(value) {
  if (!value) {
    return "TBA";
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return "TBA";
  }

  return normalized.slice(-4);
}

function getVehiclePrintVariant(status) {
  if (status === "available") {
    return "available";
  }

  if (status === "upcoming") {
    return "coming-soon";
  }

  return "booked";
}

export default function InventoryVehiclePrintTemplate({ car }) {
  if (!car) {
    return null;
  }

  const variant = getVehiclePrintVariant(car.status);

  const make = car.make || "TBA";
  const model = car.model || "TBA";
  const bodyType = formatBodyType(car.vehicle_type);

  const year = car.year || "TBA";
  const mileage = formatMileage(car.mileage);
  const colour = car.colour || "TBA";
  const chassisCode = getChassisCode(car.chassis_number);

  return (
    <>
      <style>{VEHICLE_PRINT_CSS}</style>

      <div className="inventory-vehicle-print-wrapper">
        <div className="inventory-vehicle-print">
          {/* HEADER */}
          <header className="vehicle-print-header">
            <div className="vehicle-print-number">01</div>

            <div className="vehicle-print-vehicle-heading">
              <div className="vehicle-print-make">{make}</div>

              <div className="vehicle-print-model">{model}</div>
            </div>

            <div className="vehicle-print-body-type">{bodyType}</div>

            <div className="vehicle-print-company">
              <div className="vehicle-print-company-name">PRIME RIDES</div>

              <div className="vehicle-print-company-subtitle">
                CARS TRADING LLC
              </div>
            </div>
          </header>

          {/* MAIN */}
          <main className="vehicle-print-main">
            {/* HERO */}
            <section
              className={`vehicle-print-hero vehicle-print-hero-${variant}`}
            >
              {variant === "available" && (
                <>
                  <div className="vehicle-print-hero-label">OUR PRICE</div>

                  <div className="vehicle-print-currency">AED</div>

                  <div className="vehicle-print-price">
                    {formatPrice(car.asking_price)}
                  </div>

                  <div className="vehicle-print-available-badge">
                    BEST PRICE GUARANTEED
                  </div>
                </>
              )}

              {variant === "booked" && (
                <>
                  <div className="vehicle-print-hero-label">STATUS</div>

                  <div className="vehicle-print-booked">BOOKED</div>

                  <div className="vehicle-print-status-subtitle">
                    Reserved for a customer
                  </div>
                </>
              )}

              {variant === "coming-soon" && (
                <>
                  <div className="vehicle-print-hero-label">STATUS</div>

                  <div className="vehicle-print-coming-soon">COMING SOON</div>

                  <div className="vehicle-print-status-subtitle">
                    Expected soon
                  </div>
                </>
              )}
            </section>

            {/* SPECIFICATIONS */}
            <section className="vehicle-print-spec-grid">
              <div className="vehicle-print-spec-card">
                <div className="vehicle-print-spec-label">MODEL YEAR</div>

                <div className="vehicle-print-spec-value">{year}</div>
              </div>

              <div className="vehicle-print-spec-card">
                <div className="vehicle-print-spec-label">MILEAGE (KM)</div>

                <div className="vehicle-print-spec-value">{mileage}</div>
              </div>

              <div className="vehicle-print-spec-card">
                <div className="vehicle-print-spec-label">COLOUR</div>

                <div className="vehicle-print-spec-value">{colour}</div>
              </div>

              <div className="vehicle-print-spec-card">
                <div className="vehicle-print-spec-label">CHASSIS CODE</div>

                <div className="vehicle-print-spec-value">{chassisCode}</div>
              </div>
            </section>
          </main>

          {/* PAYMENT */}
          <section className="vehicle-print-payment-strip">
            <div className="vehicle-print-payment-item">💵 CASH</div>

            <div className="vehicle-print-payment-item">📱 TABBY</div>

            <div className="vehicle-print-payment-item">🛍️ TAMARA</div>

            <div className="vehicle-print-payment-item">🏦 BANK LOAN</div>

            <div className="vehicle-print-payment-item">✅ ALL ACCEPTED</div>
          </section>
        </div>
      </div>
    </>
  );
}
