import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getDeliveryNote } from "../../api/deliveryNotes";
import {
  downloadCompanyDocument,
  getCompanies,
  getCompanyDocuments,
} from "../../api/company";
import DeliveryNotePrintTemplate from "../../components/printing/templates/DeliveryNotePrintTemplate";
import { printDocument } from "../../utils/print";

function getResponseData(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) {
    return response.data;
  }

  return response;
}

export default function DeliveryNotePrint() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deliveryNote, setDeliveryNote] = useState(null);
  const [company, setCompany] = useState(null);
  const [printAssets, setPrintAssets] = useState({
    logo: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let logoUrl = null;

    async function loadPrintData() {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error("Delivery Note ID is missing.");
        }

        const [deliveryNoteResponse, companyResponse, documentsResponse] =
          await Promise.all([
            getDeliveryNote(id),
            getCompanies(),
            getCompanyDocuments(),
          ]);

        const nextDeliveryNote = getResponseData(deliveryNoteResponse);
        const nextCompany = getResponseData(companyResponse);
        const documents = Array.isArray(documentsResponse?.data)
          ? documentsResponse.data
          : Array.isArray(documentsResponse)
            ? documentsResponse
            : [];

        if (!nextDeliveryNote || typeof nextDeliveryNote !== "object") {
          throw new Error(
            "Delivery Note record was not returned by the server.",
          );
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

        if (cancelled) {
          URL.revokeObjectURL(logoUrl);
          logoUrl = null;
          return;
        }

        setDeliveryNote(nextDeliveryNote);
        setCompany(nextCompany);
        setPrintAssets({
          logo: logoUrl,
        });
      } catch (requestError) {
        if (!cancelled) {
          console.error(
            "Failed to prepare Delivery Note for printing:",
            requestError,
          );
          setDeliveryNote(null);
          setCompany(null);
          setPrintAssets({ logo: null });
          setError(
            requestError?.message ||
              "Unable to prepare the Delivery Note for printing.",
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
    if (!deliveryNote || !company || !printAssets.logo) {
      return undefined;
    }

    let redirected = false;

    const handleAfterPrint = () => {
      if (redirected) {
        return;
      }

      redirected = true;
      navigate(`/finance/delivery-notes/${deliveryNote.id}`, { replace: true });
    };

    window.addEventListener("afterprint", handleAfterPrint);

    const timer = window.setTimeout(() => {
      printDocument({
        customerName: deliveryNote.customer_name,
        documentNumber: deliveryNote.delivery_note_number,
        documentTitle: `${
          company?.legal_entity_name || "Company"
        } - Delivery Note - ${
          deliveryNote.delivery_note_number || id
        } - ${deliveryNote.customer_name || "Customer"}`,
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [deliveryNote, company, printAssets.logo, id, navigate]);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Preparing Delivery Note for printing...
      </div>
    );
  }

  if (error || !deliveryNote || !company || !printAssets.logo) {
    return (
      <div className="p-6 text-center text-sm text-red-700">
        {error || "Unable to prepare the Delivery Note for printing."}
      </div>
    );
  }

  return (
    <DeliveryNotePrintTemplate
      deliveryNote={deliveryNote}
      company={company}
      printAssets={printAssets}
    />
  );
}
