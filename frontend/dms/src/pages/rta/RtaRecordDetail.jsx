import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getRtaRecord,
  getRtaDocuments,
  uploadRtaDocument,
  downloadRtaDocument,
  deleteRtaDocument,
} from "../../api/rta";

import { getApiErrorMessage } from "../../utils/errorMessage";

const RECORD_TYPE_LABELS = {
  PURCHASE: "Purchase",
  SALE: "Sale",
};

const STATUS_LABELS = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  SIGNED: "Signed",
  SUBMITTED: "Submitted",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-medium text-gray-900">{value || "-"}</div>
    </div>
  );
}

export default function RtaRecordDetail() {
  const { id } = useParams();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState("OTHER");
  const [uploading, setUploading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setDocumentsLoading(true);

      const [recordResponse, documentsResponse] = await Promise.all([
        getRtaRecord(id),
        getRtaDocuments(id),
      ]);

      setRecord(recordResponse);

      const documentData = documentsResponse?.data ?? documentsResponse;

      setDocuments(
        Array.isArray(documentData)
          ? documentData
          : Array.isArray(documentData?.results)
            ? documentData.results
            : [],
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to load RTA record."));
    } finally {
      setLoading(false);
      setDocumentsLoading(false);
    }
  }

  async function handleDocumentDownload(document) {
    try {
      const blob = await downloadRtaDocument(document.id);

      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = url;
      link.download =
        document.original_filename ||
        `${document.document_type || "rta-document"}`;

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to download RTA document."));
    }
  }

  async function handleDocumentDelete(document) {
    const confirmed = window.confirm(
      `Delete "${document.original_filename || "this document"}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteRtaDocument(document.id);

      toast.success("RTA document deleted successfully.");

      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to delete RTA document."));
    }
  }

  async function handleDocumentUpload(event) {
    event.preventDefault();

    if (!uploadFile) {
      toast.error("Please select a document.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const maxFileSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(uploadFile.type)) {
      toast.error("Only PDF, JPEG, PNG, and WEBP files are allowed.");
      return;
    }

    if (uploadFile.size > maxFileSize) {
      toast.error("Document size must not exceed 10 MB.");
      return;
    }

    try {
      setUploading(true);

      await uploadRtaDocument(id, uploadFile, uploadType);

      toast.success("RTA document uploaded successfully.");

      setUploadFile(null);
      setUploadType("OTHER");

      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Unable to upload RTA document."));
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  if (!record) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          RTA record could not be loaded.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              RTA Record #{record.id}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {RECORD_TYPE_LABELS[record.record_type] ||
                record.record_type ||
                "-"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/rta/${record.id}/print`}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Print RTA
            </Link>

            <Link
              to="/rta"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to RTA
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Record Information</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Field
              label="Record Type"
              value={
                RECORD_TYPE_LABELS[record.record_type] || record.record_type
              }
            />

            <Field
              label="Status"
              value={STATUS_LABELS[record.status] || record.status}
            />

            <Field label="RTA Date" value={record.rta_date} />
            <Field label="Quote" value={record.quote} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Parties</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                First Party
              </div>

              <div className="mt-2 font-semibold text-gray-900">
                {record.first_party_name || "-"}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                {record.first_party_role || "-"}
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Second Party
              </div>

              <div className="mt-2 font-semibold text-gray-900">
                {record.second_party_name || "-"}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                {record.second_party_role || "-"}
              </div>

              {record.second_party_mobile && (
                <div className="mt-1 text-sm text-gray-500">
                  {record.second_party_mobile}
                </div>
              )}
            </div>
          </div>
        </section>

        {record.record_type === "PURCHASE" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Purchase Supplier</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Supplier Name" value={record.supplier_name} />
              <Field label="Supplier Mobile" value={record.supplier_mobile} />
              <Field
                label="Trade License Number"
                value={record.supplier_trade_license_number}
              />
              <Field label="Address" value={record.supplier_address} />
            </div>
          </section>
        )}

        {record.record_type === "SALE" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Sale Customer</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Customer ID" value={record.customer} />
              <Field
                label="Customer Name"
                value={
                  record.second_party_role === "Customer"
                    ? record.second_party_name
                    : ""
                }
              />
              <Field
                label="Customer Mobile"
                value={record.second_party_mobile}
              />
              <Field label="Quote" value={record.quote} />
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Vehicle Snapshot</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Stock ID" value={record.vehicle_stock_id} />
            <Field label="Make" value={record.vehicle_make} />
            <Field label="Model" value={record.vehicle_model} />
            <Field label="Variant" value={record.vehicle_variant} />
            <Field label="Vehicle Type" value={record.vehicle_type} />
            <Field label="Year" value={record.vehicle_year} />
            <Field label="Colour" value={record.vehicle_colour} />
            <Field
              label="Country of Manufacture"
              value={record.vehicle_country_of_manufacture}
            />
            <Field
              label="Chassis Number"
              value={record.vehicle_chassis_number}
            />
            <Field label="Engine Number" value={record.vehicle_engine_number} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Company and Branch</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Company" value={record.company_legal_name} />
            <Field label="Trade License" value={record.trade_license_number} />
            <Field label="Company Address" value={record.company_address} />
            <Field label="Company ID" value={record.company} />
            <Field label="Branch ID" value={record.branch} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">RTA Details</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="RTA Reference Number"
              value={record.rta_reference_number}
            />
            <Field
              label="First-Party Signatory"
              value={record.first_party_signatory_name}
            />
            <Field
              label="Second-Party Signatory"
              value={record.second_party_signatory_name}
            />
            <Field label="Created At" value={record.created_at} />
            <Field label="Updated At" value={record.updated_at} />
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-500">Notes</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
              {record.notes || "-"}
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-gray-900">RTA Documents</h2>

            <form
              onSubmit={handleDocumentUpload}
              className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Document Type
                  </label>

                  <select
                    value={uploadType}
                    onChange={(event) => setUploadType(event.target.value)}
                    disabled={uploading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="SUPPLIER_DOCUMENT">Supplier Document</option>
                    <option value="PURCHASE_AGREEMENT">
                      Purchase Agreement
                    </option>
                    <option value="SALE_AGREEMENT">Sale Agreement</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    File
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(event) =>
                      setUploadFile(event.target.files?.[0] || null)
                    }
                    disabled={uploading}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                PDF, JPEG, PNG, or WEBP. Maximum 10 MB.
              </p>
            </form>

            {!documentsLoading && (
              <span className="text-sm text-gray-500">
                {documents.length} document{documents.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {documentsLoading ? (
            <div className="mt-4 text-sm text-gray-500">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
              No RTA documents uploaded.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {document.original_filename ||
                        document.document_type ||
                        "Document"}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      {document.document_type || "-"}
                    </div>
                  </div>
                  <div
                    key={document.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {document.original_filename ||
                          document.document_type ||
                          "Document"}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {document.document_type || "-"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDocumentDownload(document)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDocumentDelete(document)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
