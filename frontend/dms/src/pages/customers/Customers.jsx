import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus, RefreshCw, Upload, UserRound } from "lucide-react";
import { toast } from "react-toastify";

import { getCustomers, importCustomers } from "../../api/customers";
import { getApiErrorMessage } from "../../utils/errorMessage";

function getCustomerName(customer) {
  return customer?.customer_name || customer?.name || "-";
}

function getCustomerPhone(customer) {
  return customer?.phone_number || customer?.phone || "-";
}

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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const importFileInputRef = useRef(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getCustomers({
        search,
        page,
        page_size: pageSize,
      });

      if (!response) {
        throw new Error("Unable to load customers.");
      }

      const data = response?.data ?? response;

      if (Array.isArray(data)) {
        setCustomers(data);
        setTotalCount(data.length);
        setHasNextPage(false);
        setHasPreviousPage(false);
      } else {
        setCustomers(Array.isArray(data?.results) ? data.results : []);

        setTotalCount(Number(data?.count ?? 0));

        setHasNextPage(Boolean(data?.next));

        setHasPreviousPage(Boolean(data?.previous));
      }
    } catch (error) {
      console.error("Failed to load customers:", error);

      toast.error(getApiErrorMessage(error, "Unable to load customers."));
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  function handleImportFileChange(event) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedImportFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are supported.");
      event.target.value = "";
      setSelectedImportFile(null);
      return;
    }

    setSelectedImportFile(file);
  }

  async function handleImportCustomers() {
    if (!selectedImportFile) {
      toast.error("Please select a CSV file.");
      return;
    }

    try {
      setImporting(true);

      const formData = new FormData();

      formData.append("file", selectedImportFile);

      const response = await importCustomers(formData);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to import customers.");
      }

      const data = response?.data || {};

      const importedCount = Number(data.imported_count || 0);

      const failedCount = Number(data.failed_count || 0);

      const duplicateCount = Number(data.duplicate_count || 0);

      toast.success(
        `Customer import completed. Imported: ${importedCount}, Failed: ${failedCount}, Duplicates: ${duplicateCount}.`,
      );

      setSelectedImportFile(null);

      if (importFileInputRef.current) {
        importFileInputRef.current.value = "";
      }

      await loadCustomers();

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        console.warn("Customer CSV import row errors:", data.errors);
      }

      if (Array.isArray(data.duplicates) && data.duplicates.length > 0) {
        console.info("Customer CSV import duplicates:", data.duplicates);
      }
    } catch (error) {
      console.error("Customer CSV import failed:", error);

      toast.error(getApiErrorMessage(error, "Unable to import customers."));
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <UserRound size={20} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Customers
                </h1>

                <p className="text-sm text-slate-500">
                  Manage customer records and history.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={importFileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportFileChange}
              className="hidden"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, phone or email..."
              className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            <button
              type="button"
              onClick={
                selectedImportFile
                  ? handleImportCustomers
                  : () => {
                      importFileInputRef.current?.click();
                    }
              }
              disabled={importing || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload size={16} />

              {importing
                ? "Importing..."
                : selectedImportFile
                  ? "Import CSV"
                  : "Import CSV"}
            </button>

            <button
              type="button"
              onClick={loadCustomers}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <Link
              to="/customers/new"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              New Customer
            </Link>
          </div>
          {selectedImportFile && (
            <div className="mt-2 text-right text-xs text-slate-500">
              Selected CSV:{" "}
              <span className="font-medium text-slate-700">
                {selectedImportFile.name}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm text-slate-500">
              {loading
                ? "Loading customers..."
                : `${totalCount} customer${totalCount === 1 ? "" : "s"}`}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-sm text-slate-500">Loading customers...</div>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <UserRound size={36} className="mb-3 text-slate-300" />

              <h2 className="text-base font-semibold text-slate-800">
                No customers found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create your first customer to get started.
              </p>

              <Link
                to="/customers/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus size={16} />
                New Customer
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {getCustomerName(customer)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {getCustomerPhone(customer)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(customer.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={15} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {!loading && totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            disabled={!hasPreviousPage}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-slate-500">
            Page {page}
            {" · "}
            {totalCount} total
          </span>

          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
