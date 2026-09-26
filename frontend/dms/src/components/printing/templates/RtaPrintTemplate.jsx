import PrintDocument from "../PrintDocument";

const RECORD_TYPE_LABELS = {
  PURCHASE: "Purchase RTA",
  SALE: "Sale RTA",
};

function PrintField({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-gray-900">
        {value || "-"}
      </div>
    </div>
  );
}

export default function RtaPrintTemplate({ record, showSupplier = false }) {
  const documentType =
    RECORD_TYPE_LABELS[record?.record_type] ||
    record?.record_type ||
    "RTA Record";

  return (
    <PrintDocument
      documentType={documentType}
      documentNumber={`RTA-${record?.id || "-"}`}
      date={record?.rta_date}
      status={record?.status}
    >
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 border-b border-gray-300 pb-2 text-base font-semibold">
            Record Information
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <PrintField label="Record Type" value={documentType} />

            <PrintField
              label="RTA Reference"
              value={record?.rta_reference_number}
            />

            <PrintField label="Quote" value={record?.quote} />

            <PrintField label="RTA Date" value={record?.rta_date} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 border-b border-gray-300 pb-2 text-base font-semibold">
            Parties
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <PrintField
                label="First Party"
                value={record?.first_party_name}
              />

              <div className="mt-3">
                <PrintField label="Role" value={record?.first_party_role} />
              </div>

              <div className="mt-3">
                <PrintField
                  label="Signatory"
                  value={record?.first_party_signatory_name}
                />
              </div>
            </div>

            <div>
              <PrintField
                label="Second Party"
                value={record?.second_party_name}
              />

              <div className="mt-3">
                <PrintField label="Role" value={record?.second_party_role} />
              </div>

              <div className="mt-3">
                <PrintField
                  label="Mobile"
                  value={record?.second_party_mobile}
                />
              </div>

              <div className="mt-3">
                <PrintField
                  label="Signatory"
                  value={record?.second_party_signatory_name}
                />
              </div>
            </div>
          </div>
        </section>

        {record?.record_type === "PURCHASE" && showSupplier && (
          <section>
            <h2 className="mb-3 border-b border-gray-300 pb-2 text-base font-semibold">
              Supplier
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <PrintField label="Supplier Name" value={record?.supplier_name} />

              <PrintField
                label="Supplier Mobile"
                value={record?.supplier_mobile}
              />

              <PrintField
                label="Trade License"
                value={record?.supplier_trade_license_number}
              />

              <PrintField label="Address" value={record?.supplier_address} />
            </div>
          </section>
        )}

        {record?.record_type === "SALE" && (
          <section>
            <h2 className="mb-3 border-b border-gray-300 pb-2 text-base font-semibold">
              Sale Customer
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <PrintField label="Customer ID" value={record?.customer} />

              <PrintField label="Customer" value={record?.second_party_name} />

              <PrintField
                label="Customer Mobile"
                value={record?.second_party_mobile}
              />

              <PrintField label="Quote" value={record?.quote} />
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 border-b border-gray-300 pb-2 text-base font-semibold">
            Vehicle
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <PrintField label="Stock ID" value={record?.vehicle_stock_id} />

            <PrintField label="Make" value={record?.vehicle_make} />

            <PrintField label="Model" value={record?.vehicle_model} />

            <PrintField label="Variant" value={record?.vehicle_variant} />

            <PrintField label="Vehicle Type" value={record?.vehicle_type} />

            <PrintField label="Year" value={record?.vehicle_year} />

            <PrintField label="Colour" value={record?.vehicle_colour} />

            <PrintField
              label="Chassis Number"
              value={record?.vehicle_chassis_number}
            />

            <PrintField
              label="Engine Number"
              value={record?.vehicle_engine_number}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 border-b border-gray-300 pb-2 text-base font-semibold">
            Company and Branch
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <PrintField label="Company" value={record?.company_legal_name} />

            <PrintField
              label="Trade License"
              value={record?.trade_license_number}
            />

            <PrintField
              label="Company Address"
              value={record?.company_address}
            />

            <PrintField label="Branch" value={record?.branch} />
          </div>
        </section>

        {record?.notes && (
          <section>
            <h2 className="mb-3 border-b border-gray-300 pb-2 text-base font-semibold">
              Notes
            </h2>

            <div className="whitespace-pre-wrap text-sm text-gray-900">
              {record.notes}
            </div>
          </section>
        )}
      </div>
    </PrintDocument>
  );
}
