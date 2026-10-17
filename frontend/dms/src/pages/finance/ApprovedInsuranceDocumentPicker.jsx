import { useEffect, useState } from "react";
import { getCustomers, getCustomer } from "../../api/customers";
import { getInsurances } from "../../api/insurance";
import { getApiErrorMessage } from "../../utils/errorMessage";

function getResponseBody(response) {
    const body = response?.data ?? response;
    return body?.data ?? body;
}

function getResponseRows(response) {
    const body = getResponseBody(response);

    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.results)) return body.results;

    return [];
}

function getTotalPages(response) {
    return Number(
        response?.pagination?.total_pages ??
        response?.data?.pagination?.total_pages ??
        1,
    );
}

export default function ApprovedInsuranceDocumentPicker({
    documentLabel,
    onClose,
    onApproved,
}) {
    const [customers, setCustomers] = useState([]);
    const [customerId, setCustomerId] = useState("");
    const [quotes, setQuotes] = useState([]);
    const [quoteId, setQuoteId] = useState("");

    const [customersLoading, setCustomersLoading] = useState(true);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [checkingInsurance, setCheckingInsurance] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadCustomers() {
            try {
                const firstResponse = await getCustomers({
                    page: 1,
                    page_size: 100,
                });

                const allCustomers = getResponseRows(firstResponse);
                const totalPages = getTotalPages(firstResponse);

                if (totalPages > 1) {
                    const otherResponses = await Promise.all(
                        Array.from({ length: totalPages - 1 }, (_, index) =>
                            getCustomers({
                                page: index + 2,
                                page_size: 100,
                            }),
                        ),
                    );

                    allCustomers.push(
                        ...otherResponses.flatMap(getResponseRows),
                    );
                }

                if (active) {
                    setCustomers(allCustomers);
                }
            } catch (err) {
                if (active) {
                    setError(
                        getApiErrorMessage(err, "Unable to load customers."),
                    );
                }
            } finally {
                if (active) {
                    setCustomersLoading(false);
                }
            }
        }

        loadCustomers();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function loadCustomerQuotes() {
            if (!customerId) {
                setQuotes([]);
                setQuotesLoading(false);
                return;
            }

            try {
                setQuotesLoading(true);
                setQuotes([]);
                setQuoteId("");
                setError("");

                const response = await getCustomer(customerId);
                const customer = getResponseBody(response);

                if (active) {
                    setQuotes(
                        Array.isArray(customer?.quotes) ? customer.quotes : [],
                    );
                }
            } catch (err) {
                if (active) {
                    setError(
                        getApiErrorMessage(err, "Unable to load customer quotes."),
                    );
                }
            } finally {
                if (active) {
                    setQuotesLoading(false);
                }
            }
        }

        loadCustomerQuotes();

        return () => {
            active = false;
        };
    }, [customerId]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!customerId) {
            setError("Please select a customer.");
            return;
        }

        if (!quoteId) {
            setError("Please select a quote.");
            return;
        }

        try {
            setCheckingInsurance(true);

            const response = await getInsurances({
                quote_id: quoteId,
                page_size: 100,
            });

            const insurances = getResponseRows(response);

            const approvedInsurance = insurances.find(
                (insurance) =>
                    String(insurance.quote) === String(quoteId) &&
                    String(insurance.application_status).toLowerCase() ===
                    "approved",
            );

            if (!approvedInsurance) {
                setError("Insurance not approved.");
                return;
            }

            onApproved(approvedInsurance);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Unable to verify insurance approval.",
                ),
            );
        } finally {
            setCheckingInsurance(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900">
                    Create {documentLabel}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Select a customer and quote. Insurance must be approved.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Customer
                        </label>

                        <select
                            value={customerId}
                            disabled={customersLoading}
                            onChange={(event) => {
                                setCustomerId(event.target.value);
                                setQuoteId("");
                                setQuotes([]);
                                setError("");
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                {customersLoading
                                    ? "Loading customers..."
                                    : "Select customer"}
                            </option>

                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.customer_name || `Customer #${customer.id}`}
                                    {customer.phone_number
                                        ? ` — ${customer.phone_number}`
                                        : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Quote / Deal
                        </label>

                        <select
                            value={quoteId}
                            disabled={!customerId || quotesLoading || quotes.length === 0}
                            onChange={(event) => {
                                setQuoteId(event.target.value);
                                setError("");
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                {!customerId
                                    ? "Select customer first"
                                    : quotesLoading
                                        ? "Loading quotes..."
                                        : quotes.length === 0
                                            ? "No quotes found"
                                            : "Select quote"}
                            </option>

                            {quotes.map((quote) => (
                                <option key={quote.id} value={quote.id}>
                                    {quote.quote_number || `Quote #${quote.id}`}
                                    {" — "}
                                    {quote.payment_method || "-"}
                                    {" — "}
                                    {quote.status || "-"}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                !customerId ||
                                !quoteId ||
                                customersLoading ||
                                quotesLoading ||
                                checkingInsurance
                            }
                            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {checkingInsurance ? "Checking..." : "Continue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}