import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DataTable from "../../components/ui/DataTable";
import Input from "../../components/ui/Input";
import StatusBadge from "../../components/ui/StatusBadge";

import {
    createCompany,
    getBranches,
    getCompanies,
    updateCompany,
} from "../../api/company";

const EMPTY_COMPANY_FORM = {
    legal_entity_name: "",
    tax_registration_number: "",
    showroom_address: "",
    main_contact_mobile: "",
    default_currency: "AED",
    default_regional_spec: "GCC Specs (Standard)",
    is_active: true,
};

function CompanyManagement() {

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCompanyForm, setShowCompanyForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
    const [companySaving, setCompanySaving] = useState(false);
    const [companyFieldErrors, setCompanyFieldErrors] = useState({});

    async function loadData() {
        try {
            setLoading(true);

            const [companyResponse, branchResponse] = await Promise.all([
                getCompanies(),
                getBranches(),
            ]);

            setCompanies(Array.isArray(companyResponse) ? companyResponse : []);
            setBranches(Array.isArray(branchResponse) ? branchResponse : []);
        } catch (error) {
            toast.error(error?.message || "Unable to load company information.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function openCreateCompany() {
        setEditingCompany(null);
        setCompanyForm(EMPTY_COMPANY_FORM);
        setCompanyFieldErrors({});
        setShowCompanyForm(true);
    }

    function openEditCompany(company) {
        setEditingCompany(company);

        setCompanyForm({
            legal_entity_name: company.legal_entity_name ?? "",
            tax_registration_number: company.tax_registration_number ?? "",
            showroom_address: company.showroom_address ?? "",
            main_contact_mobile: company.main_contact_mobile ?? "",
            default_currency: company.default_currency ?? "AED",
            default_regional_spec:
                company.default_regional_spec ?? "GCC Specs (Standard)",
            is_active: Boolean(company.is_active),
        });

        setCompanyFieldErrors({});
        setShowCompanyForm(true);
    }

    function closeCompanyForm() {
        if (companySaving) {
            return;
        }

        setShowCompanyForm(false);
        setEditingCompany(null);
        setCompanyForm(EMPTY_COMPANY_FORM);
        setCompanyFieldErrors({});
    }

    function handleCompanyChange(event) {
        const { name, value, type, checked } = event.target;

        setCompanyForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));

        setCompanyFieldErrors((current) => {
            if (!current[name]) {
                return current;
            }

            const next = { ...current };
            delete next[name];
            return next;
        });
    }

    function extractCompanyFieldErrors(error) {
        if (
            error?.cause &&
            typeof error.cause === "object" &&
            !Array.isArray(error.cause)
        ) {
            return error.cause;
        }

        try {
            const parsed = JSON.parse(error?.message || "");

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            // Keep general error handling below.
        }

        return {};
    }

    async function saveCompany(event) {
        event.preventDefault();

        if (!companyForm.legal_entity_name.trim()) {
            setCompanyFieldErrors({
                legal_entity_name: "Company name is required.",
            });
            return;
        }

        const payload = {
            legal_entity_name: companyForm.legal_entity_name.trim(),
            tax_registration_number: companyForm.tax_registration_number.trim(),
            showroom_address: companyForm.showroom_address.trim(),
            main_contact_mobile: companyForm.main_contact_mobile.trim(),
            default_currency: companyForm.default_currency.trim(),
            default_regional_spec: companyForm.default_regional_spec.trim(),
            is_active: companyForm.is_active,
        };

        setCompanySaving(true);
        setCompanyFieldErrors({});

        try {
            if (editingCompany) {
                await updateCompany(editingCompany.id, payload);
                toast.success("Company updated successfully.");
            } else {
                await createCompany(payload);
                toast.success("Company created successfully.");
            }

            closeCompanyForm();
            await loadData();
        } catch (error) {
            const fieldErrors = extractCompanyFieldErrors(error);

            setCompanyFieldErrors(fieldErrors);

            toast.error(
                error?.message ||
                (editingCompany
                    ? "Unable to update company."
                    : "Unable to create company."),
            );
        } finally {
            setCompanySaving(false);
        }
    }

    const companyMap = useMemo(
        () => new Map(companies.map((company) => [company.id, company])),
        [companies],
    );

    return (
        <div className="min-h-screen bg-[#f5f6fa]">
            <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Page heading */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-600">
                            Management
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        Company & Branches
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage company information and its operating branches.
                    </p>
                </div>

                {/* Company management */}
                <div className="space-y-6">
                    <Card
                        title="Companies"
                        description="Manage registered company information and active status."
                        actions={
                            <Button
                                type="button"
                                size="sm"
                                onClick={openCreateCompany}
                            >
                                Add Company
                            </Button>
                        }
                    >

                        {showCompanyForm && (
                            <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50/30 p-5">
                                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            {editingCompany ? "Edit Company" : "Add Company"}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Enter the company information used by Prime Rides.
                                        </p>
                                    </div>
                                </div>

                                <form
                                    onSubmit={saveCompany}
                                    className="grid gap-4 md:grid-cols-2"
                                >
                                    <Input
                                        id="legal_entity_name"
                                        name="legal_entity_name"
                                        label="Legal Entity Name"
                                        value={companyForm.legal_entity_name}
                                        onChange={handleCompanyChange}
                                        error={companyFieldErrors.legal_entity_name?.toString()}
                                        required
                                    />

                                    <Input
                                        id="tax_registration_number"
                                        name="tax_registration_number"
                                        label="Tax Registration Number"
                                        value={companyForm.tax_registration_number}
                                        onChange={handleCompanyChange}
                                        error={companyFieldErrors.tax_registration_number?.toString()}
                                    />

                                    <Input
                                        id="main_contact_mobile"
                                        name="main_contact_mobile"
                                        label="Main Contact Mobile"
                                        value={companyForm.main_contact_mobile}
                                        onChange={handleCompanyChange}
                                        error={companyFieldErrors.main_contact_mobile?.toString()}
                                    />

                                    <Input
                                        id="default_currency"
                                        name="default_currency"
                                        label="Default Currency"
                                        value={companyForm.default_currency}
                                        onChange={handleCompanyChange}
                                        error={companyFieldErrors.default_currency?.toString()}
                                    />

                                    <Input
                                        id="default_regional_spec"
                                        name="default_regional_spec"
                                        label="Default Regional Spec"
                                        value={companyForm.default_regional_spec}
                                        onChange={handleCompanyChange}
                                        error={companyFieldErrors.default_regional_spec?.toString()}
                                    />

                                    <div className="md:col-span-2">
                                        <label
                                            htmlFor="showroom_address"
                                            className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                                        >
                                            Showroom Address
                                        </label>

                                        <textarea
                                            id="showroom_address"
                                            name="showroom_address"
                                            value={companyForm.showroom_address}
                                            onChange={handleCompanyChange}
                                            rows={3}
                                            className={[
                                                "w-full rounded-xl border bg-white px-3 py-2.5",
                                                "text-sm text-slate-800 placeholder:text-slate-400",
                                                "transition-colors focus:border-amber-400 focus:outline-none",
                                                "focus:ring-2 focus:ring-amber-400/15",
                                                companyFieldErrors.showroom_address
                                                    ? "border-rose-300"
                                                    : "border-slate-200",
                                            ].join(" ")}
                                        />

                                        {companyFieldErrors.showroom_address && (
                                            <p className="mt-1 text-xs font-medium text-rose-600">
                                                {companyFieldErrors.showroom_address.toString()}
                                            </p>
                                        )}
                                    </div>

                                    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={companyForm.is_active}
                                            onChange={handleCompanyChange}
                                            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                                        />

                                        Active
                                    </label>

                                    <div className="flex items-center justify-end gap-2 md:col-span-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={closeCompanyForm}
                                            disabled={companySaving}
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                            type="submit"
                                            loading={companySaving}
                                        >
                                            {editingCompany ? "Update Company" : "Create Company"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {loading ? (
                            <div className="py-12 text-center text-sm text-slate-400">
                                Loading companies...
                            </div>
                        ) : (
                            <DataTable
                                columns={[
                                    {
                                        key: "legal_entity_name",
                                        label: "Company",
                                        cellClassName: "font-semibold text-slate-900",
                                    },
                                    {
                                        key: "tax_registration_number",
                                        label: "Tax Registration",
                                    },
                                    {
                                        key: "main_contact_mobile",
                                        label: "Contact",
                                    },
                                    {
                                        key: "default_currency",
                                        label: "Currency",
                                    },
                                    {
                                        key: "default_regional_spec",
                                        label: "Regional Spec",
                                    },
                                    {
                                        key: "is_active",
                                        label: "Status",
                                        render: (company) => (
                                            <StatusBadge
                                                status={company.is_active ? "active" : "inactive"}
                                                variant={company.is_active ? "success" : "neutral"}
                                            />
                                        ),
                                    },

                                    {
                                        key: "actions",
                                        label: "Actions",
                                        headerClassName: "text-right",
                                        cellClassName: "text-right",
                                        render: (company) => (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditCompany(company)}
                                            >
                                                Edit
                                            </Button>
                                        ),
                                    },

                                ]}
                                rows={companies}
                                getRowKey={(company) => company.id}
                                emptyMessage="No companies found."
                            />
                        )}
                    </Card>

                    {/* Branch management */}
                    <Card
                        title="Branches"
                        description="Manage branches belonging to the registered companies."
                    >
                        {loading ? (
                            <div className="py-12 text-center text-sm text-slate-400">
                                Loading branches...
                            </div>
                        ) : (
                            <DataTable
                                columns={[
                                    {
                                        key: "name",
                                        label: "Branch",
                                        cellClassName: "font-semibold text-slate-900",
                                    },
                                    {
                                        key: "company",
                                        label: "Company",
                                        render: (branch) =>
                                            companyMap.get(branch.company)?.legal_entity_name || "-",
                                    },
                                    {
                                        key: "address",
                                        label: "Address",
                                    },
                                    {
                                        key: "contact_mobile",
                                        label: "Contact",
                                    },
                                    {
                                        key: "is_active",
                                        label: "Status",
                                        render: (branch) => (
                                            <StatusBadge
                                                status={branch.is_active ? "active" : "inactive"}
                                                variant={branch.is_active ? "success" : "neutral"}
                                            />
                                        ),
                                    },
                                ]}
                                rows={branches}
                                getRowKey={(branch) => branch.id}
                                emptyMessage="No branches found."
                            />
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}

export default CompanyManagement;