import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  downloadCompanyDocument,
  getCompanies,
  getCompanyDocuments,
} from "../../api/company";

import { getRtaRecord, getRtaTemplates } from "../../api/rta";

import { printDocument } from "../../utils/print";

import RtaPrintTemplate from "../../components/printing/templates/RtaPrintTemplate";

function getResponseData(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) {
    return response.data;
  }

  return response;
}

function getCompanyData(response) {
  const data = getResponseData(response);

  if (data && !Array.isArray(data) && typeof data === "object") {
    if (Array.isArray(data.results)) {
      return data.results[0] || null;
    }

    return data;
  }

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return null;
}

function getDocumentsData(response) {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getTemplatesData(response) {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error("Company Logo could not be loaded."));

    image.src = url;
  });
}

export default function RtaPrint() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [company, setCompany] = useState(null);
  const [template, setTemplate] = useState(null);

  const [printAssets, setPrintAssets] = useState({
    logo: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * When the browser print dialog closes:
   * Cancel -> back to RTA detail
   * Print/Save -> back to RTA detail
   *
   * Browser native print() does not expose whether
   * Cancel or Print was clicked, only that the dialog closed.
   */
  useEffect(() => {
    const handleAfterPrint = () => {
      navigate(`/rta/${id}`, {
        replace: true,
      });
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [id, navigate]);

  useEffect(() => {
    let cancelled = false;
    let logoUrl = null;

    async function loadPrintData() {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error("RTA record ID is missing.");
        }

        const [rtaResponse, companyResponse, documentsResponse] =
          await Promise.all([
            getRtaRecord(id),
            getCompanies(),
            getCompanyDocuments(),
          ]);

        const nextRecord = getResponseData(rtaResponse);

        const nextCompany = getCompanyData(companyResponse);

        const documents = getDocumentsData(documentsResponse);

        if (!nextRecord || typeof nextRecord !== "object") {
          throw new Error("RTA record was not returned by the server.");
        }

        if (!nextCompany || typeof nextCompany !== "object") {
          throw new Error("Company information could not be loaded.");
        }

        const logoDocument = documents.find(
          (document) =>
            String(document?.name || "")
              .trim()
              .toLowerCase() === "logo",
        );

        if (!logoDocument?.id) {
          throw new Error(
            "Company Logo is not configured. Please upload a Logo in Company Documents.",
          );
        }

        const logoBlob = await downloadCompanyDocument(logoDocument.id);

        if (!(logoBlob instanceof Blob)) {
          throw new Error("Company Logo could not be downloaded.");
        }

        logoUrl = URL.createObjectURL(logoBlob);

        await preloadImage(logoUrl);

        /*
         * Template is company + record type specific.
         */
        let nextTemplate = null;

        try {
          const templatesResponse = await getRtaTemplates({
            company_id: nextCompany.id,
            record_type: nextRecord.record_type,
          });

          const templates = getTemplatesData(templatesResponse);

          nextTemplate =
            templates.find(
              (item) =>
                String(item?.company) === String(nextCompany.id) &&
                item?.record_type === nextRecord.record_type &&
                item?.is_active !== false,
            ) || null;
        } catch (templateError) {
          /*
           * Do not prevent printing if the template
           * endpoint is temporarily unavailable.
           * RtaPrintTemplate has safe defaults.
           */
          console.warn("Unable to load RTA template:", templateError);

          nextTemplate = null;
        }

        if (cancelled) {
          if (logoUrl) {
            URL.revokeObjectURL(logoUrl);
          }

          logoUrl = null;
          return;
        }

        setRecord(nextRecord);
        setCompany(nextCompany);
        setTemplate(nextTemplate);

        setPrintAssets({
          logo: logoUrl,
        });
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to prepare RTA for printing:", requestError);

          setRecord(null);
          setCompany(null);
          setTemplate(null);

          setPrintAssets({
            logo: null,
          });

          setError(
            requestError?.message || "Unable to prepare the RTA for printing.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPrintData();

    return () => {
      cancelled = true;

      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!record || !company || !printAssets.logo) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      printDocument({
        customerName:
          record.second_party_name || record.first_party_name || "RTA",

        documentNumber: `RTA-${record.id}`,

        documentTitle:
          record.record_type === "SALE"
            ? `Sale RTA - RTA-${record.id}`
            : `Purchase RTA - RTA-${record.id}`,
      });
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [record, company, printAssets.logo]);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Preparing RTA for printing...
      </div>
    );
  }

  if (error || !record || !company || !printAssets.logo) {
    return (
      <div className="p-6 text-center text-sm text-red-700">
        {error || "Unable to prepare the RTA for printing."}
      </div>
    );
  }

  return (
    <RtaPrintTemplate
      record={record}
      company={company}
      template={template}
      printAssets={printAssets}
    />
  );
}
