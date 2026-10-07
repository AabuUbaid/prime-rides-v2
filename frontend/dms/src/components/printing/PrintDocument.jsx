export default function PrintDocument({
  documentType,
  documentNumber,
  date,
  status,
  company = {},
  showHeader = true,
  showFooter = true,
  children,
}) {
  const companyName = company?.legal_entity_name || "Company Name";
  const companyAddress = company?.showroom_address || "-";
  const companyMobile = company?.main_contact_mobile || "-";

  return (
    <>
      <style>
        {`
          @media print {
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-height: 0 !important;
    background: #ffffff !important;
  }

  body * {
    visibility: hidden !important;
  }

  .print-area,
  .print-area * {
    visibility: visible !important;
  }

  .print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }

  .print-document {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }
}
        `}
      </style>

      <div className="print-area">
        <div className="print-document">
          {showHeader && (
            <header className="print-header">
              <div>
                <div className="print-company">{companyName}</div>

                {documentType ? (
                  <div className="print-document-title">{documentType}</div>
                ) : null}

                <div className="print-company-details">
                  {companyAddress}
                  <br />
                  {companyMobile}
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
          )}

          <main>{children}</main>

          {showFooter && (
            <footer className="print-footer">
              <div>
                <strong>{companyName}</strong>
              </div>

              <div>{companyAddress}</div>

              <div>Authorized Document</div>
            </footer>
          )}
        </div>
      </div>
    </>
  );
}
