import { Globe2, Mail, Phone } from "lucide-react";

const ACCENT = "#0070C0";

const ARABIC_FONT = 'Arial, "Segoe UI", Tahoma, sans-serif';

const BODY_FONT = 'Arial, "Segoe UI", Tahoma, sans-serif';

const DEFAULT_PURCHASE_CONTENT = {
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
};

const DEFAULT_SALE_CONTENT = {
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
};

function display(value, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function getVehicleName(record) {
  const value = [record?.vehicle_make, record?.vehicle_model]
    .filter(Boolean)
    .join(" ");

  return value || "-";
}

function getArabicCompanyName(company) {
  return (
    company?.legal_entity_name_ar ||
    company?.arabic_legal_entity_name ||
    company?.company_name_ar ||
    company?.name_ar ||
    company?.arabic_name ||
    ""
  );
}

function getEnglishCompanyName(company) {
  return (
    company?.legal_entity_name || company?.company_name || company?.name || ""
  );
}

function getTradeLicense(company) {
  return company?.trade_license_number || company?.license_number || "";
}

function getCompanyAddress(company) {
  return company?.showroom_address || company?.address || "";
}

function getCompanyEmail(company) {
  return company?.corporate_email || company?.email || "";
}

function getCompanyPhone(company) {
  return (
    company?.official_phone ||
    company?.main_contact_mobile ||
    company?.phone ||
    ""
  );
}

function getCompanyWebsite(company) {
  return company?.website || company?.website_url || "www.primeridesuae.com";
}

function formatDate(value, type) {
  if (!value) {
    return "-";
  }

  const raw = String(value);

  if (type === "PURCHASE") {
    const parts = raw.split("-");

    if (parts.length === 3) {
      const [year, month, day] = parts;

      const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];

      const monthIndex = Number(month) - 1;

      if (months[monthIndex]) {
        return `${day}.${months[monthIndex]}.${year}`;
      }
    }
  }

  if (type === "SALE") {
    const parts = raw.split("-");

    if (parts.length === 3) {
      const [year, month, day] = parts;

      return `${Number(month)}/${Number(day)}/${year}`;
    }
  }

  return raw;
}

function interpolateTemplate(value, { company, record }) {
  if (value === null || value === undefined) {
    return "";
  }

  const arabicCompanyName = getArabicCompanyName(company);

  const englishCompanyName = getEnglishCompanyName(company);

  const tradeLicense = getTradeLicense(company);

  const companyAddress = getCompanyAddress(company);

  const companyEmail = getCompanyEmail(company);

  const companyPhone = getCompanyPhone(company);

  const companyWebsite = getCompanyWebsite(company);

  const buyerName = record?.second_party_name || record?.customer_name || "";

  const chassis = record?.vehicle_chassis_number || "";

  const vehicle = getVehicleName(record);

  const year = record?.vehicle_year || "";

  const colour = record?.vehicle_colour || "";

  const stockId = record?.vehicle_stock_id || "";

  const replacements = {
    "{{company_name_ar}}": arabicCompanyName,
    "{{company_name_en}}": englishCompanyName,
    "{{trade_license_number}}": tradeLicense,
    "{{company_address}}": companyAddress,
    "{{company_email}}": companyEmail,
    "{{company_phone}}": companyPhone,
    "{{company_website}}": companyWebsite,
    "{{buyer_name}}": buyerName,
    "{{customer_name}}": buyerName,
    "{{chassis}}": chassis,
    "{{vehicle}}": vehicle,
    "{{vehicle_name}}": vehicle,
    "{{year}}": year,
    "{{colour}}": colour,
    "{{stock_id}}": stockId,
  };

  let result = String(value);

  Object.entries(replacements).forEach(([placeholder, replacement]) => {
    result = result.replaceAll(placeholder, display(replacement, ""));
  });

  return result;
}

function getTemplateContent(record, template, company) {
  const defaultContent =
    record?.record_type === "SALE"
      ? DEFAULT_SALE_CONTENT
      : DEFAULT_PURCHASE_CONTENT;

  const savedContent =
    template?.content && typeof template.content === "object"
      ? template.content
      : {};

  const merged = {
    ...defaultContent,
    ...savedContent,
  };

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [
      key,
      interpolateTemplate(value, {
        company,
        record,
      }),
    ]),
  );
}

function PrintLine({
  children,
  top,
  right,
  left,
  width,
  fontSize = "10.5pt",
  fontWeight = 500,
  fontFamily = BODY_FONT,
  color = "#111111",
  textAlign = "right",
  direction = "rtl",
  whiteSpace = "normal",
  lineHeight = 1.55,
  className = "",
}) {
  return (
    <div
      className={`rta-line ${className}`}
      dir={direction}
      style={{
        top: `${top}mm`,
        right: right === undefined ? undefined : `${right}mm`,
        left: left === undefined ? undefined : `${left}mm`,
        width: width === undefined ? undefined : `${width}mm`,
        fontSize,
        fontWeight,
        fontFamily,
        color,
        textAlign,
        direction,
        whiteSpace,
        lineHeight,
      }}
    >
      {children}
    </div>
  );
}

function Footer({ company }) {
  const phone = getCompanyPhone(company);
  const email = getCompanyEmail(company);
  const website = getCompanyWebsite(company);
  const address = getCompanyAddress(company);

  return (
    <div className="rta-footer">
      <div className="rta-footer-row rta-footer-row-top">
        <div className="rta-footer-item">
          <Phone size={13} strokeWidth={2} className="rta-footer-icon" />
          <span>{display(phone, "+971 4 503 2201")}</span>
        </div>

        <div className="rta-footer-item">
          <Mail size={13} strokeWidth={2} className="rta-footer-icon" />
          <span>{display(email, "info@primeridesuae.com")}</span>
        </div>

        <div className="rta-footer-item">
          <Globe2 size={13} strokeWidth={2} className="rta-footer-icon" />
          <span>{display(website, "www.primeridesuae.com")}</span>
        </div>
      </div>
      <div className="rta-footer-row rta-footer-row-bottom">
        <div className="rta-footer-item">
          <span>
            {display(
              address,
              "Jams Logistic Village Al Qusais Industrial Area - 01, Dubai - UAE",
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function SharedStyles() {
  return (
    <style>
      {`
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }

        html,
        body,
        #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          min-width: 0 !important;
          background: #ffffff !important;
        }

        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media screen {
          body {
            background: #e5e7eb;
          }

          .rta-print-page {
            margin: 0 auto;
          }
        }

        @media print {
          html,
          body,
          #root {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-width: 0 !important;
            background: #ffffff !important;
          }

          .rta-print-page {
            margin: 0 !important;
            box-shadow: none !important;
          }
        }

        .rta-print-page {
          position: relative;

          width: 210mm;
          height: 297mm;

          min-width: 210mm;
          min-height: 297mm;

          max-width: 210mm;
          max-height: 297mm;

          margin: 0 auto;
          padding: 0;

          overflow: hidden;

          background: #ffffff;
          color: #111111;

          box-sizing: border-box;

          direction: rtl;

          font-family: ${BODY_FONT};

          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .rta-print-page *,
        .rta-print-page *::before,
        .rta-print-page *::after {
          box-sizing: border-box;
        }

        .rta-line {
          position: absolute;
          margin: 0;
          padding: 0;
        }

        /* =====================================================
           EXACT COMMON HEADER STYLE
        ===================================================== */

        .rta-logo {
  position: absolute;

  left: 8.5mm;
  top: 3.5mm;

  width: 47mm;
  height:32mm;

  object-fit: contain;
  object-position: left center;

  display: block;
}

        .rta-header-arabic {
  position: absolute;

  top: 5mm;
  right: 11mm;

  width: 157mm;

  font-family: Arial, Helvetica, sans-serif;

  font-size: 16pt;
  line-height: 1.1;

  font-weight: 700;

  direction: rtl;
  text-align: center;

  white-space: nowrap;
}

.rta-header-english {
  position: absolute;

  top: 14.2mm;
  right: 11mm;

  width: 157mm;

  font-family: Arial, Helvetica, sans-serif;

  font-size: 20pt;
  line-height: 1;

  font-weight: 700;

  direction: ltr;
  text-align: center;

  white-space: nowrap;
}
        .rta-header-rule {
  position: absolute;

  left: 10mm;
  right: 10mm;

  top: 25.5mm;

  border-top: 0.35mm solid #333333;
}

        /* =====================================================
           NORMAL BODY TEXT
        ===================================================== */

        .rta-normal {
          font-family: ${ARABIC_FONT};

          font-size: 10.6pt;
          line-height: 1.62;

          font-weight: 500;

          color: #111111;

          direction: rtl;
          text-align: right;
        }

        .rta-heading {
          font-family: ${ARABIC_FONT};

          font-size: 11pt;
          line-height: 1.55;

          font-weight: 600;

          color: #111111;

          direction: rtl;
          text-align: right;
        }

        .rta-dynamic {
          color: ${ACCENT};

          font-family: Arial, Helvetica, sans-serif;

          font-weight: 700;

          direction: ltr;

          unicode-bidi: plaintext;
        }

        /* =====================================================
           VEHICLE VALUES
        ===================================================== */

        .rta-vehicle-label {
          font-family: ${ARABIC_FONT};

          font-size: 10.4pt;
          line-height: 1.45;

          font-weight: 500;

          color: #111111;

          direction: rtl;
          text-align: right;
        }

        .rta-vehicle-value {
          font-family: Arial, Helvetica, sans-serif;

          font-size: 11pt;
          line-height: 1.25;

          font-weight: 700;

          color: ${ACCENT};

          direction: ltr;
          text-align: right;

          unicode-bidi: plaintext;
        }

        /* =====================================================
           SIGNATURE / STAMP
        ===================================================== */

        .rta-signature {
          position: absolute;

          right: 24mm;

          font-family: ${ARABIC_FONT};

          font-size: 10pt;

          line-height: 1.4;

          font-weight: 500;

          color: #111111;

          direction: rtl;
          text-align: right;

          white-space: nowrap;
        }

        /* =====================================================
           FOOTER
           NO DECORATIVE POLYGON / NO BLUE DESIGN
        ===================================================== */

        .rta-footer {
  position: absolute;

  left: 10mm;
  right: 10mm;
  bottom: 5mm;

  height: 20mm;

  padding: 3mm 6mm 2.5mm;

  background: #0070C0;

  font-family: Arial, Helvetica, sans-serif;
  color: #ffffff;

  direction: ltr;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}

.rta-footer-row {
  display: flex;
  align-items: center;

  width: 100%;

  white-space: nowrap;
}

.rta-footer-row-top {
  height: 6mm;
  flex: 0 0 6mm;

  justify-content: flex-start;

  gap: 18mm;
}

.rta-footer-row-bottom {
  height: 6mm;
  flex: 0 0 6mm;

  justify-content: flex-start;

  margin-top: 1.5mm;
}

.rta-footer-item {
  display: inline-flex;
  align-items: center;

  gap: 1.8mm;

  font-size: 7pt;
  line-height: 1.1;

  font-weight: 500;

  color: #ffffff;

  white-space: nowrap;
}

.rta-footer-icon {
  flex: 0 0 auto;
  color: #ffffff;
}
       
      `}
    </style>
  );
}

function CommonHeader({ company, printAssets }) {
  const arabicCompanyName = getArabicCompanyName(company);

  const englishCompanyName = getEnglishCompanyName(company);

  return (
    <>
      {printAssets?.logo ? (
        <img src={printAssets.logo} alt="" className="rta-logo" />
      ) : null}

      <div className="rta-header-arabic">{arabicCompanyName}</div>

      <div className="rta-header-english">{englishCompanyName}</div>

      <div className="rta-header-rule" />
    </>
  );
}

function PurchaseTemplate({ record, company, template, printAssets }) {
  const content = getTemplateContent(record, template, company);

  const date = formatDate(record?.rta_date, "PURCHASE");

  const chassis = display(record?.vehicle_chassis_number, "-");

  const vehicle = getVehicleName(record);

  const year = display(record?.vehicle_year, "-");

  const colour = display(record?.vehicle_colour, "-");

  const companyArabic = getArabicCompanyName(company);

  const tradeLicense = getTradeLicense(company);

  return (
    <div className="rta-print-page">
      <SharedStyles />

      <CommonHeader company={company} printAssets={printAssets} />

      {/* DATE */}
      <PrintLine top={40} right={24} fontSize="10pt" fontWeight={500}>
        التاريخ:
      </PrintLine>

      <PrintLine
        top={45}
        right={24}
        fontSize="10.5pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {date}
      </PrintLine>
      {/* AUTHORITY */}
      <PrintLine top={56} right={24} fontSize="10.6pt" fontWeight={500}>
        {content.authority_line_1}
      </PrintLine>

      <PrintLine top={62.5} right={24} fontSize="10.6pt" fontWeight={500}>
        {content.authority_line_2}
      </PrintLine>

      <PrintLine top={69} right={24} fontSize="10.6pt" fontWeight={500}>
        {content.greeting}
      </PrintLine>

      {/* SUBJECT */}

      <PrintLine
        top={82}
        right={24}
        left={24}
        width={162}
        fontSize="11pt"
        fontWeight={600}
        lineHeight={1.5}
      >
        {content.subject}
      </PrintLine>

      <PrintLine
        top={98}
        right={24}
        left={24}
        width={162}
        fontSize="10.6pt"
        fontWeight={500}
        lineHeight={1.6}
      >
        {content.paragraph_1}
      </PrintLine>

      <PrintLine
        top={114}
        right={24}
        left={24}
        width={162}
        fontSize="10.6pt"
        fontWeight={500}
        lineHeight={1.6}
      >
        {content.paragraph_2}
      </PrintLine>

      <PrintLine
        top={130}
        right={24}
        left={24}
        width={162}
        fontSize="10.6pt"
        fontWeight={500}
        lineHeight={1.6}
      >
        {content.paragraph_3}
      </PrintLine>

      <PrintLine
        top={146}
        right={24}
        left={24}
        width={162}
        fontSize="10.6pt"
        fontWeight={500}
        lineHeight={1.5}
      >
        {content.closing}
      </PrintLine>

      {/* COMPANY */}
      <PrintLine top={160} right={24} fontSize="10.5pt" fontWeight={500}>
        {content.company_label}
      </PrintLine>

      <PrintLine top={166} right={24} fontSize="10.6pt" fontWeight={500}>
        {companyArabic}
      </PrintLine>

      <PrintLine top={172} right={24} fontSize="9.8pt" fontWeight={500}>
        {content.trade_license_label}
      </PrintLine>

      {/* VEHICLE */}
      <PrintLine top={184} right={24} fontSize="10.4pt" fontWeight={500}>
        {content.chassis_label}
      </PrintLine>

      <PrintLine
        top={190}
        right={24}
        fontSize="11pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {chassis}
      </PrintLine>

      <PrintLine top={199} right={24} fontSize="10.4pt" fontWeight={500}>
        {content.vehicle_label}
      </PrintLine>

      <PrintLine
        top={205}
        right={24}
        fontSize="11pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {vehicle}
      </PrintLine>

      <PrintLine top={214} right={24} fontSize="10.4pt" fontWeight={500}>
        {content.year_label}
      </PrintLine>

      <PrintLine
        top={220}
        right={24}
        fontSize="11pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {year}
      </PrintLine>

      <PrintLine top={229} right={24} fontSize="10.4pt" fontWeight={500}>
        {content.colour_label}
      </PrintLine>

      <PrintLine
        top={235}
        right={24}
        fontSize="11pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {colour}
      </PrintLine>

      {/* SIGNATURE */}
      <div
        className="rta-signature"
        style={{
          top: "244mm",
        }}
      >
        {content.signature_label} ……………………
      </div>

      <div
        className="rta-signature"
        style={{
          top: "250mm",
        }}
      >
        {content.stamp_label} ……………………
      </div>

      <Footer company={company} />
    </div>
  );
}

function SaleTemplate({ record, company, template, printAssets }) {
  const content = getTemplateContent(record, template, company);

  const date = formatDate(record?.rta_date, "SALE");

  const buyerName = display(record?.second_party_name, "-");

  const chassis = display(record?.vehicle_chassis_number, "-");

  const vehicle = getVehicleName(record);

  const year = display(record?.vehicle_year, "-");

  const colour = display(record?.vehicle_colour, "-");

  return (
    <div className="rta-print-page">
      <SharedStyles />

      <CommonHeader company={company} printAssets={printAssets} />

      {/* DATE */}
      <PrintLine top={40} right={24} fontSize="10pt" fontWeight={500}>
        التاريخ:
      </PrintLine>

      <PrintLine
        top={45}
        right={24}
        fontSize="10.5pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {date}
      </PrintLine>

      {/* AUTHORITY */}
      <PrintLine top={56} right={24} fontSize="10.6pt" fontWeight={500}>
        {content.authority_line_1}
      </PrintLine>

      <PrintLine top={62.5} right={24} fontSize="10.6pt" fontWeight={500}>
        {content.authority_line_2}
      </PrintLine>

      <PrintLine top={69} right={24} fontSize="10.6pt" fontWeight={500}>
        {content.authority_line_3}
      </PrintLine>

      {/* SUBJECT */}
      <PrintLine
        top={82}
        right={24}
        left={24}
        width={162}
        fontSize="11pt"
        fontWeight={600}
        lineHeight={1.5}
      >
        {content.subject}
      </PrintLine>

      {/* PARTIES */}
      <PrintLine
        top={98}
        right={24}
        left={24}
        width={162}
        fontSize="10.6pt"
        fontWeight={500}
        lineHeight={1.6}
      >
        {content.first_party_label}
      </PrintLine>

      <PrintLine top={113} right={24} fontSize="10.6pt" fontWeight={500}>
        {content.second_party_label}
      </PrintLine>

      <PrintLine
        top={120}
        right={24}
        fontSize="10.8pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {buyerName}
      </PrintLine>

      {/* PARAGRAPHS */}
      <PrintLine
        top={134}
        right={24}
        left={24}
        width={162}
        fontSize="10.6pt"
        fontWeight={500}
        lineHeight={1.65}
      >
        {content.paragraph_1}
      </PrintLine>

      <PrintLine
        top={151}
        right={24}
        left={24}
        width={162}
        fontSize="10.6pt"
        fontWeight={500}
        lineHeight={1.65}
      >
        {content.paragraph_2}
      </PrintLine>

      <PrintLine
        top={168}
        right={24}
        left={24}
        width={162}
        fontSize="10.6pt"
        fontWeight={500}
        lineHeight={1.5}
      >
        {content.closing}
      </PrintLine>

      {/* VEHICLE */}
      <PrintLine top={184} right={24} fontSize="10.4pt" fontWeight={500}>
        {content.chassis_label}
      </PrintLine>

      <PrintLine
        top={190}
        right={24}
        fontSize="11pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {chassis}
      </PrintLine>

      <PrintLine top={199} right={24} fontSize="10.4pt" fontWeight={500}>
        {content.vehicle_label}
      </PrintLine>

      <PrintLine
        top={205}
        right={24}
        fontSize="11pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {vehicle}
      </PrintLine>

      <PrintLine top={214} right={24} fontSize="10.4pt" fontWeight={500}>
        {content.year_label}
      </PrintLine>

      <PrintLine
        top={220}
        right={24}
        fontSize="11pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {year}
      </PrintLine>

      <PrintLine top={229} right={24} fontSize="10.4pt" fontWeight={500}>
        {content.colour_label}
      </PrintLine>

      <PrintLine
        top={235}
        right={24}
        fontSize="11pt"
        fontWeight={700}
        color={ACCENT}
        direction="ltr"
      >
        {colour}
      </PrintLine>

      {/* SIGNATURE */}
      <div
        className="rta-signature"
        style={{
          top: "244mm",
        }}
      >
        {content.signature_label} ……………………
      </div>

      <div
        className="rta-signature"
        style={{
          top: "250mm",
        }}
      >
        {content.stamp_label} ……………………
      </div>

      <Footer company={company} />
    </div>
  );
}

export default function RtaPrintTemplate({
  record,
  company,
  template,
  printAssets = {},
}) {
  if (!record) {
    return null;
  }

  if (record.record_type === "SALE") {
    return (
      <SaleTemplate
        record={record}
        company={company}
        template={template}
        printAssets={printAssets}
      />
    );
  }

  return (
    <PurchaseTemplate
      record={record}
      company={company}
      template={template}
      printAssets={printAssets}
    />
  );
}
