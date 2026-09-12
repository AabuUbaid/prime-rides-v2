import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getBanks } from "../../api/finance";
import { getBankLoans } from "../../api/bankLoans";

const DECISION_STATUSES = [
    { value: "", label: "All Decisions" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const APPLICATION_STATUSES = [
    { value: "", label: "All Application Statuses" },
    { value: "not_submitted", label: "Not Submitted" },
    { value: "documents_collection", label: "Documents Collection" },
    { value: "applied", label: "Applied" },
    { value: "payslip_pending", label: "Payslip Pending" },
    {
        value: "email_phone_verification",
        label: "Email / Phone Verification",
    },
    { value: "advance_paid", label: "Advance Paid" },
    { value: "waiting_dda", label: "Waiting DDA" },
    { value: "registration", label: "Registration" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "completed", label: "Completed" },
    { value: "change_of_car", label: "Change of Car" },
];

const PRIORITIES = [
    { value: "", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];

function getResponseData(response) {
    const data = response?.data ?? response;

    if (Array.isArray(data)) {
        return {
            items: data,
            count: data.length,
            next: null,
            previous: null,
        };
    }

    if (Array.isArray(data?.results)) {
        return {
            items: data.results,
            count: data.count ?? data.results.length,
            next: data.next ?? null,
            previous: data.previous ?? null,
        };
    }

    return {
        items: [],
        count: 0,
        next: null,
        previous: null,
    };
}

function formatCurrency(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return String(value);
    }

    return new Intl.NumberFormat("en-AE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatStatus(value) {
    if (!value) {
        return "-";
    }

    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
            character.toUpperCase(),
        );
}

function BankLoans() {
    const [bankLoans, setBankLoans] = useState([]);
    const [banks, setBanks] = useState([]);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [bank, setBank] = useState("");
    const [priority, setPriority] = useState("");
    const [applicationStatus, setApplicationStatus] =
        useState("");

    const [loading, setLoading] = useState(true);
    const [banksLoading, setBanksLoading] =
        useState(true);
    const [error, setError] = useState("");
    const [banksError, setBanksError] = useState("");
    const requestSequenceRef = useRef(0);

    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
    });

    useEffect(() => {
    const requestSequence =
        ++requestSequenceRef.current;

    async function loadBankLoans() {
        try {
            setLoading(true);
            setError("");

            const params = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            if (status) {
                params.status = status;
            }

            if (bank) {
                params.bank = bank;
            }

            if (priority) {
                params.priority = priority;
            }

            if (applicationStatus) {
                params.application_status =
                    applicationStatus;
            }

            const response =
                await getBankLoans(params);

            // Ignore stale responses from older
            // filter requests.
            if (
                requestSequence !==
                requestSequenceRef.current
            ) {
                return;
            }

            const result =
                getResponseData(response);

            setBankLoans(result.items);

            setPagination({
                count: result.count,
                next: result.next,
                previous: result.previous,
            });
        } catch (err) {
            // Ignore errors from stale requests.
            if (
                requestSequence !==
                requestSequenceRef.current
            ) {
                return;
            }

            console.error(
                "Failed to load bank loans:",
                err,
            );

            setError(
                err?.message ||
                    "Failed to load bank loans.",
            );

            setBankLoans([]);

            setPagination({
                count: 0,
                next: null,
                previous: null,
            });
        } finally {
            if (
                requestSequence ===
                requestSequenceRef.current
            ) {
                setLoading(false);
            }
        }
    }

    loadBankLoans();
}, [
    search,
    status,
    bank,
    priority,
    applicationStatus,
]);

    useEffect(() => {
        async function loadBanks() {
            try {
                setBanksLoading(true);
                setBanksError("");

                const response = await getBanks();

                const data =
                    response?.data ?? response;

                setBanks(
                    Array.isArray(data)
                        ? data
                        : Array.isArray(
                              data?.results,
                          )
                          ? data.results
                          : [],
                );
            } catch (err) {
                console.error(
                    "Failed to load finance banks:",
                    err,
                );

                setBanks([]);

                setBanksError(
                    err?.message ||
                    "Failed to load banks.",
                );
            } finally {
                setBanksLoading(false);
            }
        }

        loadBanks();
    }, []);

    const hasFilters =
        search ||
        status ||
        bank ||
        priority ||
        applicationStatus;

    function clearFilters() {
        setSearch("");
        setStatus("");
        setBank("");
        setPriority("");
        setApplicationStatus("");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Prime Rides
                        </h1>

                        <p className="text-sm text-gray-500">
                            Dealer Management System
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/dashboard"
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Bank Loan Tracker
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Track finance applications,
                        decisions, and application progress.
                    </p>
                </div>

                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div>
                            <label
                                htmlFor="bank-loan-search"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Search
                            </label>

                            <input
                                id="bank-loan-search"
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value,
                                    )
                                }
                                placeholder="Customer, quote, vehicle, chassis..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="bank-loan-status"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Decision Status
                            </label>

                            <select
                                id="bank-loan-status"
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            >
                                {DECISION_STATUSES.map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="bank-loan-bank"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Bank
                            </label>

                            <select
                                id="bank-loan-bank"
                                value={bank}
                                onChange={(event) =>
                                    setBank(
                                        event.target.value,
                                    )
                                }
                                disabled={banksLoading}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100"
                            >
                                <option value="">
                                    {banksLoading
                                        ? "Loading banks..."
                                        : "All Banks"}
                                </option>

                                {banks.map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.name}
                                    </option>
                                ))}
                            </select>

                            {banksError && (
                                <p className="mt-1 text-xs text-red-600">
                                    {banksError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="bank-loan-priority"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Priority
                            </label>

                            <select
                                id="bank-loan-priority"
                                value={priority}
                                onChange={(event) =>
                                    setPriority(
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            >
                                {PRIORITIES.map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="bank-loan-application-status"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Application Status
                            </label>

                            <select
                                id="bank-loan-application-status"
                                value={
                                    applicationStatus
                                }
                                onChange={(event) =>
                                    setApplicationStatus(
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            >
                                {APPLICATION_STATUSES.map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-4 text-sm font-medium text-gray-700 hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Loading bank loans...
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                        <p className="text-sm text-red-700">
                            {error}
                        </p>
                    </div>
                )}

                {!loading &&
                    !error &&
                    bankLoans.length === 0 && (
                        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <p className="text-sm text-gray-500">
                                No bank loan applications
                                found.
                            </p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    bankLoans.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Customer
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Vehicle
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Bank
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Requested
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Approved
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Decision
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Application
                                        </th>

                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Priority
                                        </th>

                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {bankLoans.map(
                                        (loan) => (
                                            <tr
                                                key={
                                                    loan.id
                                                }
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">
                                                        {loan.customer_name ||
                                                            loan.customer
                                                                ?.name ||
                                                            "-"}
                                                    </div>

                                                    <div className="text-xs text-gray-500">
                                                        {loan.customer_mobile ||
                                                            loan.customer
                                                                ?.mobile ||
                                                            ""}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-900">
                                                        {loan.vehicle_make ||
                                                            loan.car?.make ||
                                                            "-"}{" "}
                                                        {loan.vehicle_model ||
                                                            loan.car?.model ||
                                                            ""}
                                                    </div>

                                                    <div className="text-xs text-gray-500">
                                                        {loan.vehicle_stock_id ||
                                                            loan.car?.stock_id ||
                                                            loan.vehicle_chassis_number ||
                                                            "-"}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {loan.bank_name ||
                                                        loan.bank
                                                            ?.name ||
                                                        "-"}
                                                </td>

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {formatCurrency(
                                                        loan.requested_finance,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {formatCurrency(
                                                        loan.approved_finance,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                        {formatStatus(
                                                            loan.status,
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {formatStatus(
                                                        loan.application_status,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {formatStatus(
                                                        loan.priority,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        to={`/finance/bank-loans/${loan.id}`}
                                                        className="text-sm font-medium text-gray-900 hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    bankLoans.length > 0 && (
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                            <span>
                                {pagination.count}{" "}
                                application
                                {pagination.count === 1
                                    ? ""
                                    : "s"}
                            </span>

                            {(pagination.next ||
                                pagination.previous) && (
                                <span>
                                    Pagination is
                                    provided by the
                                    backend response.
                                </span>
                            )}
                        </div>
                    )}
            </main>
        </div>
    );
}

export default BankLoans;