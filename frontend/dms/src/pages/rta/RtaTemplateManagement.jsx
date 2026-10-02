import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import {
  createRtaTemplate,
  getRtaTemplates,
  updateRtaTemplate,
} from "../../api/rta";

const TEMPLATE_TYPES = {
  PURCHASE: "PURCHASE",
  SALE: "SALE",
};

const PURCHASE_FIELDS = [
  ["authority_line_1", "Authority line 1"],
  ["authority_line_2", "Authority line 2"],
  ["greeting", "Greeting"],
  ["subject", "Subject"],
  ["paragraph_1", "Paragraph 1"],
  ["paragraph_2", "Paragraph 2"],
  ["paragraph_3", "Paragraph 3"],
  ["closing", "Closing"],
  ["company_label", "Company label"],
  ["trade_license_label", "Trade license label"],
  ["chassis_label", "Chassis label"],
  ["vehicle_label", "Vehicle label"],
  ["year_label", "Year label"],
  ["colour_label", "Colour / country label"],
  ["signature_label", "Signature label"],
  ["stamp_label", "Stamp label"],
];

const SALE_FIELDS = [
  ["authority_line_1", "Authority line 1"],
  ["authority_line_2", "Authority line 2"],
  ["authority_line_3", "Authority line 3"],
  ["subject", "Subject"],
  ["first_party_label", "First-party line"],
  ["second_party_label", "Second-party line"],
  ["paragraph_1", "Paragraph 1"],
  ["paragraph_2", "Paragraph 2"],
  ["closing", "Closing"],
  ["chassis_label", "Chassis label"],
  ["vehicle_label", "Vehicle label"],
  ["year_label", "Year label"],
  ["colour_label", "Colour / country label"],
  ["signature_label", "Signature label"],
  ["stamp_label", "Stamp label"],
];

const DEFAULT_CONTENT = {
  PURCHASE: {
    authority_line_1: "إلى سعادة / مدير إدارة الترخيص",
    authority_line_2: "هيئة الطرق والمواصلات",
    greeting: "تحية طيبة وبعد ،،،",
    subject: "الموضوع: عدم الممانعة لنقل المركبة أدناه إلى شركتنا / أو التسجيل",
    paragraph_1: "نحن، الموقعون أدناه / شركة {{company_name_ar}}.",
    paragraph_2:
      "نلتمس من سيادتكم التكرم بالموافقة على نقل المركبة المذكورة أدناه إلى شركتنا.",
    paragraph_3: "وذلك بعد استكمال الإجراءات اللازمة لدى دائرتكم الموقرة.",
    closing: "وتفضلوا بقبول فائق الاحترام والتقدير ،،،",
    company_label: "عن شركة",
    trade_license_label: "رخصة تجارية رقم ({{trade_license_number}})",
    chassis_label: "رقم الهيكل :",
    vehicle_label: "نوع المركبة :",
    year_label: "سنة الصنع :",
    colour_label: "بلد الصنع :",
    signature_label: "التوقيع:",
    stamp_label: "الختم:",
  },

  SALE: {
    authority_line_1: "إلى سعادة / مدير إدارة الترخيص",
    authority_line_2: "هيئة الطرق والمواصلات – دبي",
    authority_line_3: "المحترم",
    subject: "الموضوع: عقد بيع مركبة / أو التسجيل",
    first_party_label: "الطرف الأول (البائع): {{company_name_ar}}",
    second_party_label: "الطرف الثاني (المشتري):",
    paragraph_1:
      "نفيد سيادتكم نحن الموقع أدناه شركة {{company_name_ar}} بأننا قد قمنا ببيع المركبة الموضحة",
    paragraph_2:
      "أوصافها أدناه حسب الاتفاق المبرم بيننا، ولا مانع لدينا من نقل بيانات المركبة أو التسجيل",
    closing: "وتفضلوا بقبول فائق الاحترام والتقدير.",
    chassis_label: "رقم الهيكل :",
    vehicle_label: "نوع المركبة :",
    year_label: "سنة الصنع :",
    colour_label: "بلد الصنع :",
    signature_label: "التوقيع:",
    stamp_label: "الختم:",
  },
};

function normalizeTemplateList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  return [];
}

function mergeContent(type, content) {
  return {
    ...DEFAULT_CONTENT[type],
    ...(content && typeof content === "object" ? content : {}),
  };
}

export default function RtaTemplateManagement({ company }) {
  const companyId = company?.id;

  const [templates, setTemplates] = useState([]);
  const [selectedType, setSelectedType] = useState(TEMPLATE_TYPES.PURCHASE);
  const [content, setContent] = useState(mergeContent(TEMPLATE_TYPES.PURCHASE));
  const [templateId, setTemplateId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fields = useMemo(
    () =>
      selectedType === TEMPLATE_TYPES.PURCHASE ? PURCHASE_FIELDS : SALE_FIELDS,
    [selectedType],
  );

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) =>
          template.record_type === selectedType &&
          String(template.company) === String(companyId),
      ) || null,
    [templates, selectedType, companyId],
  );

  async function loadTemplates() {
    if (!companyId) {
      setTemplates([]);
      return;
    }

    try {
      setLoading(true);

      const response = await getRtaTemplates({
        company_id: companyId,
      });

      setTemplates(normalizeTemplateList(response));
    } catch (error) {
      toast.error(error?.message || "Unable to load RTA templates.");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  function loadEditorFromSelection() {
    const template = selectedTemplate;

    if (!template) {
      setTemplateId(null);
      setContent(mergeContent(selectedType));
      return;
    }

    setTemplateId(template.id);
    setContent(mergeContent(selectedType, template.content));
  }

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [companyId, isOpen]);

  useEffect(() => {
    loadEditorFromSelection();
  }, [selectedTemplate, selectedType]);

  function updateField(field, value) {
    setContent((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!companyId) {
      toast.error("Company profile is not available.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        company: companyId,
        record_type: selectedType,
        content,
        is_active: true,
      };

      if (templateId) {
        await updateRtaTemplate(templateId, {
          record_type: selectedType,
          content,
          is_active: true,
        });

        toast.success(
          `${selectedType === "PURCHASE" ? "Purchase" : "Sale"} RTA template updated.`,
        );
      } else {
        await createRtaTemplate(payload);

        toast.success(
          `${selectedType === "PURCHASE" ? "Purchase" : "Sale"} RTA template created.`,
        );
      }

      await loadTemplates();
    } catch (error) {
      toast.error(error?.message || "Unable to save RTA template.");
    } finally {
      setSaving(false);
    }
  }

  if (!companyId) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
      >
        <div>
          <div className="text-base font-bold text-slate-900">
            RTA Document Templates
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Edit the approved static wording used by Purchase and Sale RTA
            documents.
          </div>
        </div>

        <span className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen ? (
        <Card
          title="RTA Document Templates"
          description="Page geometry and print positions remain controlled by the print renderer."
          className="mt-4"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={
                  selectedType === TEMPLATE_TYPES.PURCHASE
                    ? "primary"
                    : "secondary"
                }
                onClick={() => setSelectedType(TEMPLATE_TYPES.PURCHASE)}
              >
                Purchase RTA
              </Button>

              <Button
                type="button"
                size="sm"
                variant={
                  selectedType === TEMPLATE_TYPES.SALE ? "primary" : "secondary"
                }
                onClick={() => setSelectedType(TEMPLATE_TYPES.SALE)}
              >
                Sale RTA
              </Button>
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Loading RTA template...
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map(([field, label]) => (
                  <div key={field}>
                    <label
                      htmlFor={`rta-template-${field}`}
                      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                    >
                      {label}
                    </label>

                    <textarea
                      id={`rta-template-${field}`}
                      value={content[field] ?? ""}
                      onChange={(event) =>
                        updateField(field, event.target.value)
                      }
                      rows={field.startsWith("paragraph_") ? 3 : 2}
                      dir="rtl"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                    />

                    {(field === "paragraph_1" ||
                      field === "paragraph_2" ||
                      field === "first_party_label" ||
                      field === "second_party_label") && (
                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        Dynamic placeholders such as{" "}
                        <code className="rounded bg-slate-100 px-1 py-0.5">
                          {"{{company_name_ar}}"}
                        </code>{" "}
                        can be used. They will be replaced from the Company/RTA
                        data when the document is printed.
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => loadEditorFromSelection()}
                    disabled={saving}
                  >
                    Reset
                  </Button>

                  <Button type="button" onClick={handleSave} loading={saving}>
                    {templateId ? "Update Template" : "Save Template"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
