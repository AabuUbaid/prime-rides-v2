import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { resolveBackendUrl } from "../../api/url";
import { getApiErrorMessage } from "../../utils/errorMessage";

import {
  deleteCustomer,
  deleteCustomerDocument,
  getCustomer,
  uploadCustomerDocument,
} from "../../api/customers";

const DOCUMENT_LABELS = {
  passport: "Passport",
  driving_license: "Driving License",
  emirates_id: "Emirates ID",
  bank_lpo: "Bank LPO",
  company_trade_license: "Company Trade License",
};

const DOCUMENT_CATEGORIES = [
  {
    value: "passport",
    label: "Passport",
  },
  {
    value: "driving_license",
    label: "Driving License",
  },
  {
    value: "emirates_id",
    label: "Emirates ID",
  },
  {
    value: "bank_lpo",
    label: "Bank LPO",
  },
  {
    value: "company_trade_license",
    label: "Company Trade License",
  },
];

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "AED 0.00";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return `AED ${String(value)}`;
  }

  return `AED ${number.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusLabel(status) {
  if (!status) {
    return "-";
  }

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDocumentUrl(documentPath) {
  if (!documentPath) {
    return "";
  }

  if (
    documentPath.startsWith("http://") ||
    documentPath.startsWith("https://")
  ) {
    return documentPath;
  }

  return resolveBackendUrl(documentPath);
}

function isImageDocument(path) {
  if (!path) {
    return false;
  }

  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path.split("?")[0]);
}

export default function CustomerDetail() {
  const { id } = useParams();

  const fileInputRef = useRef(null);

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [documentCategory, setDocumentCategory] = useState("driving_license");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  const loadCustomer = useCallback(async () => {
    if (!id) {
      toast.error("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await getCustomer(id);

      if (!response?.success || !response?.data) {
        throw new Error(response?.message || "Unable to load customer.");
      }

      setCustomer(response.data);
    } catch (error) {
      console.error("Failed to load customer:", error);

      toast.error(getApiErrorMessage(error, "Unable to load customer."));
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  useEffect(() => {
    if (
      customer?.customer_type !== "COMPANY" &&
      documentCategory === "company_trade_license"
    ) {
      setDocumentCategory("passport");
    }
  }, [customer, documentCategory]);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
  }

  function resetUploadForm() {
    setSelectedFile(null);
    setDocumentCategory("driving_license");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUploadDocument(event) {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a document.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("category", documentCategory);
      formData.append("document", selectedFile);

      const response = await uploadCustomerDocument(id, formData);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to upload document.");
      }

      toast.success(
        response.message || "Customer document uploaded successfully.",
      );

      resetUploadForm();

      await loadCustomer();
    } catch (error) {
      console.error("Document upload failed:", error);

      const backendErrors = error?.cause?.errors;

      if (Array.isArray(backendErrors)) {
        toast.error(backendErrors.join(" "));
      } else if (backendErrors && typeof backendErrors === "object") {
        const messages = Object.values(backendErrors).flat().filter(Boolean);

        toast.error(
          messages.length
            ? messages.join(" ")
            : error?.message || "Unable to upload document.",
        );
      } else {
        toast.error(getApiErrorMessage(error, "Unable to upload document."));
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(documentId) {
    const confirmed = window.confirm("Delete this customer document?");

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDocumentId(documentId);

      const response = await deleteCustomerDocument(id, documentId);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to delete document.");
      }

      toast.success(
        response.message || "Customer document deleted successfully.",
      );

      await loadCustomer();
    } catch (error) {
      console.error("Document deletion failed:", error);

      toast.error(getApiErrorMessage(error, "Unable to delete document."));
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function handleDeleteCustomer() {
    const confirmed = window.confirm(
      `Delete customer "${customer.customer_name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await deleteCustomer(id);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to delete customer.");
      }

      toast.success(response.message || "Customer deleted successfully.");

      window.location.href = "/customers";
    } catch (error) {
      console.error("Customer deletion failed:", error);

      toast.error(getApiErrorMessage(error, "Unable to delete customer."));

      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex min-h-64 max-w-6xl items-center justify-center">
          <div className="text-sm text-slate-500">Loading customer...</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const documents = Array.isArray(customer.documents) ? customer.documents : [];

  const quotes = Array.isArray(customer.quotes) ? customer.quotes : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/customers"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Back to customers"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {customer.customer_name || "-"}
              </h1>

              <p className="text-sm text-slate-500">Customer #{customer.id}</p>
            </div>
          </div>

          <Link
            to={`/customers/${id}/edit`}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={16} />
            Edit Customer
          </Link>

          <button
            type="button"
            onClick={handleDeleteCustomer}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Delete Customer
          </button>
        </div>

        <div className="grid gap-6">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Customer Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Customer Name
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {customer.customer_name || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Phone Number
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {customer.phone_number || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {customer.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Customer Type
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {customer.customer_type === "COMPANY"
                    ? "Company"
                    : "Individual"}
                </p>
              </div>

              {customer.customer_type === "COMPANY" && (
                <>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Company Name
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {customer.company_name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      TRN
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {customer.trn || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Trade License Number
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {customer.trade_license_number || "—"}
                    </p>
                  </div>
                </>
              )}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Created
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDate(customer.created_at)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Last Updated
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDate(customer.updated_at)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Upload size={19} className="text-slate-500" />

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Upload Customer Document
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Upload a Passport, Driving License, Emirates ID, Bank LPO,
                    or Company Trade License.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleUploadDocument}
              className="grid gap-4 p-5 sm:grid-cols-3"
            >
              <div>
                <label
                  htmlFor="document-category"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Document Type
                </label>

                <select
                  id="document-category"
                  value={documentCategory}
                  onChange={(event) => setDocumentCategory(event.target.value)}
                  disabled={uploading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  {DOCUMENT_CATEGORIES.filter(
                    (category) =>
                      category.value !== "company_trade_license" ||
                      customer.customer_type === "COMPANY",
                  ).map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="customer-document"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Document
                </label>

                <input
                  ref={fileInputRef}
                  id="customer-document"
                  type="file"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2.5 file:text-sm file:font-medium file:text-slate-700"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload size={16} />

                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">Documents</h2>

                <p className="mt-1 text-xs text-slate-500">
                  {documents.length} document
                  {documents.length === 1 ? "" : "s"}
                </p>
              </div>

              <FileText size={20} className="text-slate-400" />
            </div>

            {documents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <FileText size={32} className="mx-auto mb-3 text-slate-300" />

                <p className="text-sm text-slate-500">
                  No customer documents uploaded.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((document) => {
                  const documentUrl = getDocumentUrl(document.document);

                  return (
                    <div
                      key={document.id}
                      className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {isImageDocument(document.document) ? (
                            <img
                              src={documentUrl}
                              alt={
                                DOCUMENT_LABELS[document.category] ||
                                "Customer document"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText size={22} className="text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">
                            {DOCUMENT_LABELS[document.category] ||
                              document.category ||
                              "Document"}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Uploaded {formatDate(document.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {documentUrl && (
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={15} />
                            View
                          </a>
                        )}

                        {documentUrl && (
                          <a
                            href={documentUrl}
                            download
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Download size={15} />
                            Download
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(document.id)}
                          disabled={deletingDocumentId === document.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={15} />

                          {deletingDocumentId === document.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">Quote History</h2>

                <p className="mt-1 text-xs text-slate-500">
                  {quotes.length} quote
                  {quotes.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {quotes.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No quotes associated with this customer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Quote
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Payment
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Price
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900">
                            {quote.quote_number || `Quote #${quote.id}`}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {getStatusLabel(quote.status)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {quote.payment_method || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatCurrency(quote.price)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/deals/${quote.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            View Quote
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
