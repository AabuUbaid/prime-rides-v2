import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DataTable from "../../components/ui/DataTable";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatusBadge from "../../components/ui/StatusBadge";

import {
  createBranch,
  createCompanyDocument,
  deleteCompanyDocument,
  downloadCompanyDocument,
  getBranches,
  getCompanies,
  getCompanyDocuments,
  updateBranch,
  updateCompany,
} from "../../api/company";

import RtaTemplateManagement from "../rta/RtaTemplateManagement";

const EMPTY_COMPANY_FORM = {
  legal_entity_name: "",
  legal_entity_name_ar: "",
  trade_license_number: "",
  trade_license_expiry_date: "",
  tax_registration_number: "",
  showroom_address: "",
  main_contact_mobile: "",
  corporate_email: "",
  official_phone: "",
  emirate: "",
  default_currency: "AED",
  default_regional_spec: "GCC Specs (Standard)",
  is_active: true,
};

const EMPTY_BRANCH_FORM = {
  name: "",
  address: "",
  contact_mobile: "",
  is_active: true,
};

function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);

  const [companyDocuments, setCompanyDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [documentDeletingId, setDocumentDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyFieldErrors, setCompanyFieldErrors] = useState({});

  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH_FORM);
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchFieldErrors, setBranchFieldErrors] = useState({});

  async function loadData() {
    try {
      setLoading(true);

      const companyResponse = await getCompanies();

      const normalizedCompanies = Array.isArray(companyResponse)
        ? companyResponse
        : companyResponse
          ? [companyResponse]
          : [];

      setCompanies(normalizedCompanies);

      const branchResponse = await getBranches();

      setBranches(Array.isArray(branchResponse) ? branchResponse : []);
    } catch (error) {
      toast.error(error?.message || "Unable to load company information.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanyDocuments() {
    try {
      setDocumentsLoading(true);

      const response = await getCompanyDocuments();

      setCompanyDocuments(Array.isArray(response) ? response : []);
    } catch (error) {
      toast.error(error?.message || "Unable to load company documents.");
      setCompanyDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleCompanyDocumentUpload(event) {
    event.preventDefault();

    if (!documentType) {
      toast.error("Select a document type.");
      return;
    }

    if (!documentFile) {
      toast.error("Select a document file.");
      return;
    }

    const imageDocumentTypes = ["Logo", "Seal & Stamp"];

    if (
      imageDocumentTypes.includes(documentType) &&
      !documentFile.type.startsWith("image/")
    ) {
      toast.error(`${documentType} must be an image file.`);
      return;
    }

    setDocumentSaving(true);

    try {
      await createCompanyDocument({
        name: documentType,
        file: documentFile,
      });

      toast.success(`${documentType} uploaded successfully.`);

      setDocumentType("");
      setDocumentFile(null);

      const fileInput = document.getElementById("company-document-file");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadCompanyDocuments();
    } catch (error) {
      toast.error(error?.message || "Unable to upload company document.");
    } finally {
      setDocumentSaving(false);
    }
  }

  async function handleCompanyDocumentDelete(document) {
    const confirmed = window.confirm(
      `Delete "${document.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDocumentDeletingId(document.id);

    try {
      await deleteCompanyDocument(document.id);

      toast.success("Company document deleted successfully.");

      await loadCompanyDocuments();
    } catch (error) {
      toast.error(error?.message || "Unable to delete company document.");
    } finally {
      setDocumentDeletingId(null);
    }
  }

  async function handleCompanyDocumentView(document) {
    const viewerWindow = window.open("", "_blank");

    if (!viewerWindow) {
      toast.error("Please allow pop-ups to view the document.");
      return;
    }

    try {
      const blob = await downloadCompanyDocument(document.id);

      const url = window.URL.createObjectURL(blob);

      viewerWindow.location.href = url;

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (error) {
      viewerWindow.close();

      toast.error(error?.message || "Unable to open company document.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadCompanyDocuments();
  }, []);

  function openEditCompany(company) {
    setEditingCompany(company);

    setCompanyForm({
      legal_entity_name: company.legal_entity_name ?? "",
      legal_entity_name_ar: company.legal_entity_name_ar ?? "",
      trade_license_number: company.trade_license_number ?? "",
      trade_license_expiry_date: company.trade_license_expiry_date ?? "",
      tax_registration_number: company.tax_registration_number ?? "",
      showroom_address: company.showroom_address ?? "",
      main_contact_mobile: company.main_contact_mobile ?? "",
      corporate_email: company.corporate_email ?? "",
      official_phone: company.official_phone ?? "",
      emirate: company.emirate ?? "",
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
      legal_entity_name_ar: companyForm.legal_entity_name_ar.trim(),
      trade_license_number: companyForm.trade_license_number.trim(),
      trade_license_expiry_date: companyForm.trade_license_expiry_date || null,
      tax_registration_number: companyForm.tax_registration_number.trim(),
      showroom_address: companyForm.showroom_address.trim(),
      main_contact_mobile: companyForm.main_contact_mobile.trim(),
      corporate_email: companyForm.corporate_email.trim(),
      official_phone: companyForm.official_phone.trim(),
      emirate: companyForm.emirate.trim(),
      default_currency: companyForm.default_currency.trim(),
      default_regional_spec: companyForm.default_regional_spec.trim(),
      is_active: companyForm.is_active,
    };

    setCompanySaving(true);
    setCompanyFieldErrors({});

    try {
      await updateCompany(editingCompany.id, payload);
      toast.success("Company profile updated successfully.");

      closeCompanyForm();
      await loadData();
    } catch (error) {
      const fieldErrors = extractCompanyFieldErrors(error);

      setCompanyFieldErrors(fieldErrors);

      toast.error(error?.message || "Unable to update company profile.");
    } finally {
      setCompanySaving(false);
    }
  }

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );

  function openCreateBranch() {
    setEditingBranch(null);
    setBranchForm(EMPTY_BRANCH_FORM);
    setBranchFieldErrors({});
    setShowBranchForm(true);
  }

  function openEditBranch(branch) {
    setEditingBranch(branch);

    setBranchForm({
      name: branch.name ?? "",
      address: branch.address ?? "",
      contact_mobile: branch.contact_mobile ?? "",
      is_active: Boolean(branch.is_active),
    });

    setBranchFieldErrors({});
    setShowBranchForm(true);
  }

  function closeBranchForm() {
    if (branchSaving) {
      return;
    }

    setShowBranchForm(false);
    setEditingBranch(null);
    setBranchForm(EMPTY_BRANCH_FORM);
    setBranchFieldErrors({});
  }

  function handleBranchChange(event) {
    const { name, value, type, checked } = event.target;

    setBranchForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setBranchFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function saveBranch(event) {
    event.preventDefault();

    setBranchSaving(true);
    setBranchFieldErrors({});

    const payload = {
      name: branchForm.name.trim(),
      address: branchForm.address.trim(),
      contact_mobile: branchForm.contact_mobile.trim(),
      is_active: branchForm.is_active,
    };

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, payload);
        toast.success("Branch updated successfully.");
      } else {
        await createBranch(payload);
        toast.success("Branch created successfully.");
      }

      closeBranchForm();
      await loadData();
    } catch (error) {
      const fieldErrors = extractCompanyFieldErrors(error);

      setBranchFieldErrors(fieldErrors);

      toast.error(
        error?.message ||
          (editingBranch
            ? "Unable to update branch."
            : "Unable to create branch."),
      );
    } finally {
      setBranchSaving(false);
    }
  }

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
            Company Profile
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage the registered legal entity, compliance information, company
            documents, and branches.
          </p>
        </div>

        {/* Company management */}
        <div className="space-y-6">
          <Card
            title="Legal Entity"
            description="Registered company identity, regulatory information, contact details, and defaults."
            actions={
              companies.length === 1 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openEditCompany(companies[0])}
                >
                  Edit Profile
                </Button>
              ) : null
            }
          >
            {showCompanyForm ? (
              <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50/30 p-5">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Edit Company Profile
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
                    label="Trade License Name"
                    value={companyForm.legal_entity_name}
                    onChange={handleCompanyChange}
                    error={companyFieldErrors.legal_entity_name?.toString()}
                    required
                  />

                  <Input
                    id="legal_entity_name_ar"
                    name="legal_entity_name_ar"
                    label="Trade License Name (Arabic)"
                    value={companyForm.legal_entity_name_ar}
                    onChange={handleCompanyChange}
                    error={companyFieldErrors.legal_entity_name_ar?.toString()}
                  />

                  <Input
                    id="trade_license_number"
                    name="trade_license_number"
                    label="Trade License Number"
                    value={companyForm.trade_license_number}
                    onChange={handleCompanyChange}
                    error={companyFieldErrors.trade_license_number?.toString()}
                  />

                  <Input
                    id="trade_license_expiry_date"
                    name="trade_license_expiry_date"
                    type="date"
                    label="Trade License Expiry Date"
                    value={companyForm.trade_license_expiry_date}
                    onChange={handleCompanyChange}
                    error={companyFieldErrors.trade_license_expiry_date?.toString()}
                  />

                  <Input
                    id="tax_registration_number"
                    name="tax_registration_number"
                    label="TRN"
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
                    id="official_phone"
                    name="official_phone"
                    label="Official Phone"
                    value={companyForm.official_phone}
                    onChange={handleCompanyChange}
                    error={companyFieldErrors.official_phone?.toString()}
                  />

                  <Input
                    id="corporate_email"
                    name="corporate_email"
                    type="email"
                    label="Corporate Email"
                    value={companyForm.corporate_email}
                    onChange={handleCompanyChange}
                    error={companyFieldErrors.corporate_email?.toString()}
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

                  <Select
                    id="emirate"
                    name="emirate"
                    label="Emirate"
                    value={companyForm.emirate}
                    onChange={handleCompanyChange}
                    error={companyFieldErrors.emirate?.toString()}
                  >
                    <option value="">Select Emirate</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                  </Select>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="showroom_address"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Registered Showroom / Office Address
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

                    <Button type="submit" loading={companySaving}>
                      Save Company Profile
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-6">
                {loading ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    Loading company profile...
                  </div>
                ) : companies.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    Company profile is not available.
                  </div>
                ) : (
                  (() => {
                    const company = companies[0];

                    return (
                      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Trade License Name
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.legal_entity_name || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Trade License Name (Arabic)
                          </p>
                          <p
                            className="mt-1 text-sm font-semibold text-slate-900"
                            dir="rtl"
                          >
                            {company.legal_entity_name_ar || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Trade License Number
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.trade_license_number || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Trade License Expiry Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.trade_license_expiry_date
                              ? new Date(
                                  company.trade_license_expiry_date,
                                ).toLocaleDateString("en-GB")
                              : "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            TRN
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.tax_registration_number || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Main Contact Mobile
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.main_contact_mobile || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Official Phone
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.official_phone || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Corporate Email
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 break-all">
                            {company.corporate_email || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Emirate
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.emirate || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Default Currency
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.default_currency || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Regional Specification
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.default_regional_spec || "-"}
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Registered Showroom / Office Address
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                            {company.showroom_address || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Status
                          </p>
                          <div className="mt-2">
                            <StatusBadge
                              status={company.is_active ? "active" : "inactive"}
                              variant={
                                company.is_active ? "success" : "neutral"
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </Card>

          {companies.length > 0 ? (
            <RtaTemplateManagement company={companies[0]} />
          ) : null}

          <Card
            title="Company Documents"
            description="Store the company's legal, tax, and official seal documents."
          >
            <form
              onSubmit={handleCompanyDocumentUpload}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  id="company-document-type"
                  name="company-document-type"
                  label="Document Type"
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                >
                  <option value="">Select document type</option>
                  <option value="Logo">Logo</option>
                  <option value="Trade License">Trade License</option>
                  <option value="TRN Certificate">TRN Certificate</option>
                  <option value="Seal & Stamp">Seal & Stamp</option>
                </Select>

                <div>
                  <label
                    htmlFor="company-document-file"
                    className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Document File
                  </label>

                  <input
                    id="company-document-file"
                    type="file"
                    accept={
                      documentType === "Logo" || documentType === "Seal & Stamp"
                        ? "image/png,image/jpeg,image/webp"
                        : ".pdf,image/png,image/jpeg,image/webp"
                    }
                    onChange={(event) =>
                      setDocumentFile(event.target.files?.[0] || null)
                    }
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    {documentType === "Logo" || documentType === "Seal & Stamp"
                      ? "PNG, JPEG, or WebP image only."
                      : "PDF, PNG, JPEG, or WebP."}
                  </p>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" loading={documentSaving}>
                    Upload Document
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              {documentsLoading ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Loading company documents...
                </div>
              ) : companyDocuments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                  No company documents uploaded yet.
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: "name",
                      label: "Document",
                      cellClassName: "font-semibold text-slate-900",
                    },
                    {
                      key: "uploaded_by_name",
                      label: "Uploaded By",
                    },
                    {
                      key: "uploaded_at",
                      label: "Uploaded At",
                      render: (document) =>
                        document.uploaded_at
                          ? new Date(document.uploaded_at).toLocaleString()
                          : "-",
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      headerClassName: "text-right",
                      cellClassName: "text-right",
                      render: (document) => (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompanyDocumentView(document)}
                          >
                            View
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCompanyDocumentDelete(document)
                            }
                            disabled={documentDeletingId === document.id}
                          >
                            {documentDeletingId === document.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  rows={companyDocuments}
                  getRowKey={(document) => document.id}
                  emptyMessage="No company documents uploaded yet."
                />
              )}
            </div>
          </Card>

          {/* Branch management */}
          <Card
            title="Branches"
            description="Manage branches belonging to the registered companies."
            actions={
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="button" size="sm" onClick={openCreateBranch}>
                  Add Branch
                </Button>
              </div>
            }
          >
            {showBranchForm && (
              <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50/30 p-5">
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingBranch ? "Edit Branch" : "Add Branch"}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the branch's operating information. The branch is
                    automatically associated with the registered company.
                  </p>
                </div>

                <form
                  onSubmit={saveBranch}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <Input
                    id="branch-name"
                    name="name"
                    label="Branch Name"
                    value={branchForm.name}
                    onChange={handleBranchChange}
                    error={branchFieldErrors.name?.toString()}
                    required
                  />

                  <Input
                    id="branch-contact"
                    name="contact_mobile"
                    label="Contact Mobile"
                    value={branchForm.contact_mobile}
                    onChange={handleBranchChange}
                    error={branchFieldErrors.contact_mobile?.toString()}
                  />

                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={branchForm.is_active}
                      onChange={handleBranchChange}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    Active
                  </label>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="branch-address"
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      Address
                    </label>

                    <textarea
                      id="branch-address"
                      name="address"
                      value={branchForm.address}
                      onChange={handleBranchChange}
                      rows={3}
                      className={[
                        "w-full rounded-xl border bg-white px-3 py-2.5",
                        "text-sm text-slate-800 placeholder:text-slate-400",
                        "transition-colors focus:border-amber-400 focus:outline-none",
                        "focus:ring-2 focus:ring-amber-400/15",
                        branchFieldErrors.address
                          ? "border-rose-300"
                          : "border-slate-200",
                      ].join(" ")}
                    />

                    {branchFieldErrors.address && (
                      <p className="mt-1 text-xs font-medium text-rose-600">
                        {branchFieldErrors.address.toString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeBranchForm}
                      disabled={branchSaving}
                    >
                      Cancel
                    </Button>

                    <Button type="submit" loading={branchSaving}>
                      {editingBranch ? "Update Branch" : "Create Branch"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

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
                  {
                    key: "actions",
                    label: "Actions",
                    headerClassName: "text-right",
                    cellClassName: "text-right",
                    render: (branch) => (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditBranch(branch)}
                      >
                        Edit
                      </Button>
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
