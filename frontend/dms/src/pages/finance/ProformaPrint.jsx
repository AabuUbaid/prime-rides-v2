import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getProforma } from "../../api/proforma";
import { getQuote } from "../../api/quotes";
import {
  downloadCompanyDocument,
  getCompanies,
  getCompanyDocuments,
} from "../../api/company";
import ProformaPrintTemplate from "../../components/printing/templates/ProformaPrintTemplate";
import { printDocument } from "../../utils/print";

export default function ProformaPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const includeSealStamp = searchParams.get("seal_stamp") === "1";

  const [proforma, setProforma] = useState(null);
  const [company, setCompany] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [printAssets, setPrintAssets] = useState({
    logo: null,
    sealStamp: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printingReady, setPrintingReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPrintData() {
      try {
        setLoading(true);
        setError("");

        const [proformaResponse, companyResponse, documentsResponse] =
          await Promise.all([
            getProforma(id),
            getCompanies(),
            getCompanyDocuments(),
          ]);

        const proformaData = proformaResponse?.data ?? proformaResponse;
        const companyData = companyResponse?.data ?? companyResponse;
        const documents = Array.isArray(documentsResponse?.data)
          ? documentsResponse.data
          : Array.isArray(documentsResponse)
            ? documentsResponse
            : [];

        if (!proformaData) {
          throw new Error("Proforma not found.");
        }

        let resolvedCustomerId = null;

        if (proformaData.quote) {
          const quoteResponse = await getQuote(proformaData.quote);
          const quoteData = quoteResponse?.data ?? quoteResponse;
          resolvedCustomerId = quoteData?.customer_id ?? null;
        }

        const logoDocument = documents.find(
          (document) => document?.name === "Logo",
        );
        const sealStampDocument = documents.find(
          (document) => document?.name === "Seal & Stamp",
        );

        if (!logoDocument?.id) {
          throw new Error(
            "Company Logo is not configured. Please upload a Logo in Company Documents.",
          );
        }

        if (includeSealStamp && !sealStampDocument?.id) {
          throw new Error(
            "Company Seal & Stamp is not configured. Please upload a Seal & Stamp document in Company Documents.",
          );
        }

        const logoBlob = await downloadCompanyDocument(logoDocument.id);

        if (!(logoBlob instanceof Blob)) {
          throw new Error("Unable to load the Company Logo document.");
        }

        let sealStampUrl = null;

        if (includeSealStamp) {
          const sealStampBlob = await downloadCompanyDocument(
            sealStampDocument.id,
          );

          if (!(sealStampBlob instanceof Blob)) {
            throw new Error(
              "Unable to load the Company Seal & Stamp document.",
            );
          }

          sealStampUrl = URL.createObjectURL(sealStampBlob);
        }

        const assets = {
          logo: URL.createObjectURL(logoBlob),
          sealStamp: sealStampUrl,
        };

        if (cancelled) {
          URL.revokeObjectURL(assets.logo);
          URL.revokeObjectURL(assets.sealStamp);
          return;
        }

        setProforma(proformaData);
        setCustomerId(resolvedCustomerId);
        setCompany(
          companyData && typeof companyData === "object" ? companyData : null,
        );
        setPrintAssets(assets);
        setPrintingReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load Proforma for printing.");
          setPrintingReady(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!id) {
      setError("Proforma ID is missing.");
      setLoading(false);
      setPrintingReady(false);
      return undefined;
    }

    loadPrintData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (printAssets.logo) {
        URL.revokeObjectURL(printAssets.logo);
      }

      if (printAssets.sealStamp) {
        URL.revokeObjectURL(printAssets.sealStamp);
      }
    };
  }, [printAssets.logo, printAssets.sealStamp]);

  useEffect(() => {
    if (!printingReady || !proforma) {
      return undefined;
    }

    const redirectAfterPrint = () => {
      window.removeEventListener("afterprint", redirectAfterPrint);
      navigate(`/finance/proformas/${proforma.id}`, { replace: true });
    };

    window.addEventListener("afterprint", redirectAfterPrint);

    const timer = window.setTimeout(() => {
      printDocument({
        customerName: proformfa.customer_name,
        documentNumber: proforma.proforma_number,
      });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", redirectAfterPrint);
    };
  }, [printingReady, proforma, navigate]);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Loading Proforma for printing...
      </div>
    );
  }

  if (error || !proforma || !company) {
    return (
      <div className="p-6 text-center text-sm text-red-700">
        {error || "Unable to load Proforma for printing."}
      </div>
    );
  }

  return (
    <ProformaPrintTemplate
      proforma={proforma}
      company={company}
      customerId={customerId}
      printAssets={printAssets}
      includeSealStamp={includeSealStamp}
    />
  );
}
