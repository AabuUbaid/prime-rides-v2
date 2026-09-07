export default function PrintDocument({
  documentType,
  documentNumber,
  date,
  status,
  children,
}) {
  return (
    <div className="print-area">
      <div className="print-document">
        <header className="print-header">
          <div>
            <div className="print-company">
              PRIME RIDES ELECTRIC CARS TRADING LLC
            </div>

            <div className="print-document-title">{documentType}</div>

            <div className="print-company-details">
              Office No-BC 01, Jams Logistic Village, Al Qusais Industrial Area,
              Dubai, UAE
              <br />
              +971 4 503 2201 · sales@primeridesuae.com
            </div>
          </div>

          <div className="print-meta">
            <div>
              <strong>No:</strong> {documentNumber || "-"}
            </div>

            <div>
              <strong>Date:</strong> {date || "-"}
            </div>

            {status ? (
              <div>
                <strong>Status:</strong> {status}
              </div>
            ) : null}
          </div>
        </header>

        <main>{children}</main>

        <footer className="print-footer">
          <div>
            <strong>Prime Rides Electric Cars Trading LLC</strong>
          </div>

          <div>
            Office No-BC 01, Jams Logistic Village, Al Qusais Industrial Area,
            Dubai, UAE
          </div>

          <div>Authorized Document</div>
        </footer>
      </div>
    </div>
  );
}
