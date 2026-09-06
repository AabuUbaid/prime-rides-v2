import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { deleteEmi, getEmi } from "../../api/finance";
import { useAuth } from "../../context/AuthContext";

function getResponseData(response) {
    if (
        response &&
        Object.prototype.hasOwnProperty.call(
            response,
            "data",
        )
    ) {
        return response.data;
    }

    return response;
}

function getApiMessage(error) {
    const errors = error?.cause?.errors;

    if (
        errors &&
        typeof errors === "object" &&
        !Array.isArray(errors)
    ) {
        if (errors.non_field_errors) {
            return Array.isArray(errors.non_field_errors)
                ? errors.non_field_errors.join(" ")
                : String(errors.non_field_errors);
        }

        const firstError = Object.values(errors)[0];

        if (Array.isArray(firstError)) {
            return firstError.join(" ");
        }

        if (firstError) {
            return String(firstError);
        }
    }

    return (
        error?.cause?.message ||
        error?.message ||
        "Failed to load EMI details."
    );
}

function formatCurrency(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "-";
    }

    return `AED ${numericValue.toLocaleString("en-AE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatPercentage(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "-";
    }

    return `${numericValue.toFixed(2)}%`;
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-AE", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function displayValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    return String(value);
}

function DetailItem({ label, value, valueClassName = "" }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
            </p>

            <p
                className={`mt-1 break-words text-sm font-medium text-gray-900 ${valueClassName}`}
            >
                {value}
            </p>
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                    {title}
                </h2>
            </div>

            <div className="p-5">
                {children}
            </div>
        </section>
    );
}

function PrintSectionTitle({ title }) {
    return (
        <div className="mb-2 border-b border-gray-300 pb-1">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-900">
                {title}
            </h2>
        </div>
    );
}

function PrintGrid({ children, columns = 2 }) {
    return (
        <div
            className={
                columns === 3
                    ? "grid grid-cols-3 gap-x-5 gap-y-2"
                    : "grid grid-cols-2 gap-x-6 gap-y-2"
            }
        >
            {children}
        </div>
    );
}

function PrintField({ label, value }) {
    return (
        <div className="min-w-0">
            <div className="text-[7px] font-medium uppercase tracking-wide text-gray-500">
                {label}
            </div>

            <div className="mt-0.5 break-words text-[9px] font-semibold leading-tight text-gray-900">
                {displayValue(value)}
            </div>
        </div>
    );
}

function PrintSummary({
    label,
    value,
    highlight = false,
}) {
    return (
        <div
            className={`px-3 py-2 ${
                highlight ? "bg-gray-100" : "bg-white"
            }`}
        >
            <div className="text-[7px] font-medium uppercase tracking-wide text-gray-500">
                {label}
            </div>

            <div className="mt-0.5 text-[12px] font-bold leading-tight text-gray-900">
                {value}
            </div>
        </div>
    );
}

function EmiDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [emi, setEmi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);

    const isMaster = user?.role === "MASTER";

    useEffect(() => {
        let isMounted = true;

        async function loadEmi() {
            try {
                setLoading(true);
                setError("");

                const response = await getEmi(id);
                const data = getResponseData(response);

                if (!isMounted) {
                    return;
                }

                if (!data || typeof data !== "object") {
                    throw new Error(
                        "EMI record was not returned by the server.",
                    );
                }

                setEmi(data);
            } catch (requestError) {
                console.error(
                    "Failed to load EMI details:",
                    requestError,
                );

                if (!isMounted) {
                    return;
                }

                const message = getApiMessage(requestError);

                setError(message);
                setEmi(null);
                toast.error(message);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadEmi();

        return () => {
            isMounted = false;
        };
    }, [id]);

    async function handleDelete() {
        if (!isMaster || deleting) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete ${emi?.emi_number || "this EMI"}?\n\nThis action cannot be undone.`,
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);

            const response = await deleteEmi(id);

            if (
                response &&
                response.success === false
            ) {
                throw new Error(
                    response.message ||
                        "Failed to delete EMI.",
                );
            }

            toast.success(
                response?.message ||
                    "EMI sheet deleted successfully.",
            );

            navigate("/finance/emi/list");
        } catch (deleteError) {
            console.error(
                "Failed to delete EMI:",
                deleteError,
            );

            const message =
                deleteError?.cause?.message ||
                deleteError?.message ||
                "Failed to delete EMI.";

            toast.error(message);
        } finally {
            setDeleting(false);
        }
    }

    function handlePrint() {
    const previousTitle = document.title;

    const customerName = String(
        emi?.customer_name || "Customer",
    )
        .trim()
        .replace(/[<>:"/\\|?*]+/g, "")
        .replace(/\s+/g, " ");

    const emiNumber = String(
        emi?.emi_number || "EMI",
    )
        .trim()
        .replace(/[<>:"/\\|?*]+/g, "");

    document.title = `${customerName}-${emiNumber}`;

    const restoreTitle = () => {
        document.title = previousTitle;
        window.removeEventListener(
            "afterprint",
            restoreTitle,
        );
    };

    window.addEventListener(
        "afterprint",
        restoreTitle,
    );

    window.print();
}

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="border-b bg-white">
                    <div className="mx-auto max-w-7xl px-6 py-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Prime Rides
                        </h1>

                        <p className="text-sm text-gray-500">
                            Dealer Management System
                        </p>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-6 py-8">
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

                        <p className="mt-4 text-sm text-gray-600">
                            Loading EMI details...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !emi) {
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

                        <Link
                            to="/finance/emi/list"
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Back to EMI Estimates
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-6 py-8">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                        <h2 className="text-base font-semibold text-red-800">
                            Unable to load EMI
                        </h2>

                        <p className="mt-2 text-sm text-red-700">
                            {error ||
                                "The requested EMI record could not be found."}
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const vehicleDescription = [
        emi.vehicle_make,
        emi.vehicle_model,
        emi.vehicle_variant,
    ]
        .filter(Boolean)
        .join(" ");

    const expenses = Array.isArray(emi.expenses)
        ? emi.expenses
        : [];

    const statusLabel =
        String(emi.status || "unknown")
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                (character) =>
                    character.toUpperCase(),
            );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* =====================================================
                NORMAL SCREEN UI
                Hidden completely when printing.
               ===================================================== */}
            <div className="no-print-screen">
                <header className="border-b bg-white">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Prime Rides
                            </h1>

                            <p className="text-sm text-gray-500">
                                Dealer Management System
                            </p>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
                    {/* Page heading */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {displayValue(
                                        emi.emi_number,
                                    )}
                                </h2>

                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                        emi.status ===
                                        "active"
                                            ? "bg-green-100 text-green-700"
                                            : emi.status ===
                                                "cancelled"
                                              ? "bg-red-100 text-red-700"
                                              : "bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    {statusLabel}
                                </span>
                            </div>
                        </div>

                        <div className="no-print flex flex-wrap items-center gap-3">
                            <Link
                                to="/finance/emi/list"
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Back to EMI Estimates
                            </Link>

                            <button
                                type="button"
                                onClick={handlePrint}
                                disabled={!emi}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Print EMI
                            </button>

                            {isMaster && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleting
                                        ? "Deleting..."
                                        : "Delete EMI"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Customer */}
                    <SectionCard title="Customer">
                        <div className="grid gap-4 md:grid-cols-2">
                            <DetailItem
                                label="Customer Name"
                                value={displayValue(
                                    emi.customer_name,
                                )}
                            />

                            <DetailItem
                                label="Mobile"
                                value={displayValue(
                                    emi.customer_mobile,
                                )}
                            />
                        </div>
                    </SectionCard>

                    {/* Vehicle */}
                    <SectionCard title="Vehicle Snapshot">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailItem
                                label="Stock ID"
                                value={displayValue(
                                    emi.vehicle_stock_id,
                                )}
                            />

                            <DetailItem
                                label="Make"
                                value={displayValue(
                                    emi.vehicle_make,
                                )}
                            />

                            <DetailItem
                                label="Model"
                                value={displayValue(
                                    emi.vehicle_model,
                                )}
                            />

                            <DetailItem
                                label="Variant"
                                value={displayValue(
                                    emi.vehicle_variant,
                                )}
                            />

                            <DetailItem
                                label="Year"
                                value={displayValue(
                                    emi.vehicle_year,
                                )}
                            />

                            <DetailItem
                                label="Colour"
                                value={displayValue(
                                    emi.vehicle_colour,
                                )}
                            />

                            <DetailItem
                                label="Mileage"
                                value={
                                    emi.vehicle_mileage ===
                                        null ||
                                    emi.vehicle_mileage ===
                                        undefined ||
                                    emi.vehicle_mileage ===
                                        ""
                                        ? "-"
                                        : `${Number(
                                              emi.vehicle_mileage,
                                          ).toLocaleString(
                                              "en-AE",
                                          )} km`
                                }
                            />

                            <DetailItem
                                label="Chassis Number"
                                value={displayValue(
                                    emi.vehicle_chassis_number,
                                )}
                            />

                            <DetailItem
                                label="Engine Number"
                                value={displayValue(
                                    emi.vehicle_engine_number,
                                )}
                            />
                        </div>

                        {vehicleDescription && (
                            <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Vehicle
                                </p>

                                <p className="mt-1 text-base font-semibold text-gray-900">
                                    {vehicleDescription}
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* Financing */}
                    <SectionCard title="Financing">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailItem
                                label="Bank"
                                value={displayValue(
                                    emi.bank_name,
                                )}
                            />

                            <DetailItem
                                label="Interest Rate"
                                value={formatPercentage(
                                    emi.interest_rate,
                                )}
                            />

                            <DetailItem
                                label="Manual Rate Used"
                                value={
                                    emi.manual_rate_used
                                        ? "Yes"
                                        : "No"
                                }
                            />

                            <DetailItem
                                label="Vehicle Price"
                                value={formatCurrency(
                                    emi.vehicle_price,
                                )}
                            />

                            <DetailItem
                                label="VAT"
                                value={
                                    emi.vat_enabled
                                        ? formatCurrency(
                                              emi.vat_amount,
                                          )
                                        : "Not Applied"
                                }
                            />

                            <DetailItem
                                label="Price After VAT"
                                value={formatCurrency(
                                    emi.price_after_vat,
                                )}
                            />

                            <DetailItem
                                label="Down Payment"
                                value={formatCurrency(
                                    emi.down_payment,
                                )}
                            />

                            <DetailItem
                                label="Finance Amount"
                                value={formatCurrency(
                                    emi.finance_amount,
                                )}
                                valueClassName="text-base"
                            />

                            <DetailItem
                                label="Tenure"
                                value={
                                    emi.tenure_years ===
                                        null ||
                                    emi.tenure_years ===
                                        undefined
                                        ? "-"
                                        : `${emi.tenure_years} ${Number(
                                              emi.tenure_years,
                                          ) === 1
                                              ? "Year"
                                              : "Years"}`
                                }
                            />
                        </div>
                    </SectionCard>

                    {/* EMI Result */}
                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <h2 className="text-base font-semibold text-gray-900">
                                EMI Summary
                            </h2>
                        </div>

                        <div className="grid gap-4 p-5 md:grid-cols-3">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Total Interest
                                </p>

                                <p className="mt-2 text-xl font-bold text-gray-900">
                                    {formatCurrency(
                                        emi.total_interest,
                                    )}
                                </p>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Total Payable
                                </p>

                                <p className="mt-2 text-xl font-bold text-gray-900">
                                    {formatCurrency(
                                        emi.total_payable,
                                    )}
                                </p>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Monthly EMI
                                </p>

                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {formatCurrency(
                                        emi.monthly_emi,
                                    )}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Expenses */}
                    <SectionCard title="Expenses">
                        {expenses.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                                <p className="text-sm text-gray-500">
                                    No individual expenses were saved
                                    for this EMI.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Type
                                            </th>

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Name
                                            </th>

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Description
                                            </th>

                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {expenses.map(
                                            (
                                                expense,
                                                index,
                                            ) => (
                                                <tr
                                                    key={
                                                        expense.id ??
                                                        `${expense.expense_type}-${index}`
                                                    }
                                                >
                                                    <td className="px-4 py-4 text-sm text-gray-700">
                                                        {displayValue(
                                                            expense.expense_type,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                        {displayValue(
                                                            expense.name,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-gray-700">
                                                        {displayValue(
                                                            expense.description,
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold text-gray-900">
                                                        {formatCurrency(
                                                            expense.amount,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-5 flex items-center justify-end border-t border-gray-200 pt-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">
                                    Other Expenses Total
                                </p>

                                <p className="mt-1 text-lg font-bold text-gray-900">
                                    {formatCurrency(
                                        emi.expense_total,
                                    )}
                                </p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Bottom navigation */}
                    <div className="flex justify-end">
                        <Link
                            to="/finance/emi/list"
                            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Back to EMI Estimates
                        </Link>
                    </div>
                </main>
            </div>

            {/* =====================================================
                PRINT-ONLY A4 DOCUMENT
               ===================================================== */}
            <div className="print-area">
                <div className="emi-print-page">
                    {/* Header */}
                    <header className="emi-print-header">
                        <div>
                            <div className="emi-print-company">
                                PRIME RIDES ELECTRIC CARS TRADING LLC
                            </div>

                            <div className="emi-print-document-title">
                                EMI ESTIMATE
                            </div>

                            <div className="emi-print-address">
                                Office No-BC 01, Jams Logistic Village,
                                Al Qusais Industrial Area, Dubai, UAE
                            </div>

                            <div className="emi-print-contact">
                                +971 4 503 2201 · sales@primeridesuae.com
                            </div>
                        </div>

                        <div className="emi-print-meta">
                            <div>
                                <span>EMI Number</span>
                                <strong>
                                    {displayValue(
                                        emi.emi_number,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Date</span>
                                <strong>
                                    {formatDate(
                                        emi.created_at,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong>
                                    {statusLabel}
                                </strong>
                            </div>
                        </div>
                    </header>

                    {/* Customer */}
                    <section className="emi-print-section">
                        <PrintSectionTitle title="Customer" />

                        <PrintGrid columns={2}>
                            <PrintField
                                label="Customer Name"
                                value={
                                    emi.customer_name
                                }
                            />

                            <PrintField
                                label="Mobile"
                                value={
                                    emi.customer_mobile
                                }
                            />
                        </PrintGrid>
                    </section>

                    {/* Vehicle */}
                    <section className="emi-print-section">
                        <PrintSectionTitle title="Vehicle" />

                        <PrintGrid columns={3}>
                            <PrintField
                                label="Stock ID"
                                value={
                                    emi.vehicle_stock_id ||
                                    "Manual Vehicle"
                                }
                            />

                            <PrintField
                                label="Make"
                                value={emi.vehicle_make}
                            />

                            <PrintField
                                label="Model"
                                value={emi.vehicle_model}
                            />

                            <PrintField
                                label="Variant"
                                value={emi.vehicle_variant}
                            />

                            <PrintField
                                label="Year"
                                value={emi.vehicle_year}
                            />

                            <PrintField
                                label="Colour"
                                value={emi.vehicle_colour}
                            />

                            <PrintField
                                label="Mileage"
                                value={
                                    emi.vehicle_mileage !==
                                        null &&
                                    emi.vehicle_mileage !==
                                        undefined &&
                                    emi.vehicle_mileage !==
                                        ""
                                        ? `${Number(
                                              emi.vehicle_mileage,
                                          ).toLocaleString(
                                              "en-AE",
                                          )} km`
                                        : "-"
                                }
                            />

                            <PrintField
                                label="Chassis Number"
                                value={
                                    emi.vehicle_chassis_number
                                }
                            />

                            <PrintField
                                label="Engine Number"
                                value={
                                    emi.vehicle_engine_number
                                }
                            />
                        </PrintGrid>
                    </section>

                    {/* Financing */}
                    <section className="emi-print-section">
                        <PrintSectionTitle title="Financing" />

                        <PrintGrid columns={3}>
                            <PrintField
                                label="Bank"
                                value={emi.bank_name}
                            />

                            <PrintField
                                label="Interest Rate"
                                value={formatPercentage(
                                    emi.interest_rate,
                                )}
                            />

                            <PrintField
                                label="Manual Rate Used"
                                value={
                                    emi.manual_rate_used
                                        ? "Yes"
                                        : "No"
                                }
                            />

                            <PrintField
                                label="Vehicle Price"
                                value={formatCurrency(
                                    emi.vehicle_price,
                                )}
                            />

                            <PrintField
                                label="VAT"
                                value={
                                    emi.vat_enabled
                                        ? formatCurrency(
                                              emi.vat_amount,
                                          )
                                        : "Not Applied"
                                }
                            />

                            <PrintField
                                label="Price After VAT"
                                value={formatCurrency(
                                    emi.price_after_vat,
                                )}
                            />

                            <PrintField
                                label="Down Payment"
                                value={formatCurrency(
                                    emi.down_payment,
                                )}
                            />

                            <PrintField
                                label="Finance Amount"
                                value={formatCurrency(
                                    emi.finance_amount,
                                )}
                            />

                            <PrintField
                                label="Tenure"
                                value={
                                    emi.tenure_years !==
                                        null &&
                                    emi.tenure_years !==
                                        undefined
                                        ? `${emi.tenure_years} ${
                                              Number(
                                                  emi.tenure_years,
                                              ) === 1
                                                  ? "Year"
                                                  : "Years"
                                          }`
                                        : "-"
                                }
                            />
                        </PrintGrid>
                    </section>

                    {/* EMI Summary */}
                    <section className="emi-print-section">
                        <PrintSectionTitle title="EMI Summary" />

                        <div className="grid grid-cols-3 overflow-hidden border border-gray-300">
                            <PrintSummary
                                label="Total Interest"
                                value={formatCurrency(
                                    emi.total_interest,
                                )}
                            />

                            <PrintSummary
                                label="Total Payable"
                                value={formatCurrency(
                                    emi.total_payable,
                                )}
                            />

                            <PrintSummary
                                label="Monthly EMI"
                                value={formatCurrency(
                                    emi.monthly_emi,
                                )}
                                highlight
                            />
                        </div>
                    </section>

                    {/* Applied Finance Configuration */}
                    <section className="emi-print-section">
                        <PrintSectionTitle title="Applied Finance Configuration" />

                        <PrintGrid columns={3}>
                            <PrintField
                                label="Evaluation"
                                value={
                                    emi.evaluation_name
                                        ? `${emi.evaluation_name} — ${formatCurrency(
                                              emi.evaluation_amount,
                                          )}`
                                        : formatCurrency(
                                              emi.evaluation_amount,
                                          )
                                }
                            />

                            <PrintField
                                label="Bank Processing"
                                value={formatCurrency(
                                    emi.bank_processing_amount,
                                )}
                            />

                            <PrintField
                                label="Insurance"
                                value={
                                    emi.insurance_band_name
                                        ? `${emi.insurance_band_name} — ${formatCurrency(
                                              emi.insurance_amount,
                                          )}`
                                        : formatCurrency(
                                              emi.insurance_amount,
                                          )
                                }
                            />

                            <PrintField
                                label="Registration"
                                value={formatCurrency(
                                    emi.registration_amount,
                                )}
                            />

                            <PrintField
                                label="RTA"
                                value={formatCurrency(
                                    emi.rta_amount,
                                )}
                            />

                            <PrintField
                                label="Service Package"
                                value={
                                    emi.service_package_name
                                        ? `${emi.service_package_name} — ${formatCurrency(
                                              emi.service_package_amount,
                                          )}`
                                        : formatCurrency(
                                              emi.service_package_amount,
                                          )
                                }
                            />
                        </PrintGrid>
                    </section>

                    {/* Expenses */}
                    <section className="emi-print-section">
                        <PrintSectionTitle title="Other Expenses" />

                        {expenses.length > 0 ? (
                            <table className="emi-print-expense-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th className="text-right">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {expenses.map(
                                        (
                                            expense,
                                            index,
                                        ) => (
                                            <tr
                                                key={
                                                    expense.id ??
                                                    `${expense.expense_type}-${index}`
                                                }
                                            >
                                                <td>
                                                    {displayValue(
                                                        expense.expense_type,
                                                    )}
                                                </td>

                                                <td>
                                                    {displayValue(
                                                        expense.name,
                                                    )}
                                                </td>

                                                <td>
                                                    {displayValue(
                                                        expense.description,
                                                    )}
                                                </td>

                                                <td className="text-right font-semibold">
                                                    {formatCurrency(
                                                        expense.amount,
                                                    )}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div className="emi-print-no-expenses">
                                No additional expenses recorded.
                            </div>
                        )}

                        <div className="emi-print-expense-total">
                            <span>
                                Other Expenses Total
                            </span>

                            <strong>
                                {formatCurrency(
                                    emi.expense_total,
                                )}
                            </strong>
                        </div>
                    </section>

                    {/* Future seal / signature area */}
                    <section className="emi-print-signature-placeholder">
                        <div>
                            <div className="emi-print-signature-line" />

                            <div className="emi-print-signature-label">
                                Authorized Signature
                            </div>
                        </div>

                        <div className="emi-print-seal-placeholder">
                            Company Seal
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="emi-print-footer">
                        <div>
                            Prime Rides Electric Cars Trading LLC
                        </div>

                        <div>
                            Office No-BC 01, Jams Logistic Village,
                            Al Qusais Industrial Area, Dubai, UAE
                        </div>

                        <div>
                            Page 1 of 1
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default EmiDetail;