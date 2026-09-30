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
  );
}
