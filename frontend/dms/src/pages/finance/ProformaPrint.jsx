import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getProforma } from "../../api/proforma";
import ProformaPrintTemplate from "../../components/printing/templates/ProformaPrintTemplate";
import { printDocument } from "../../utils/print";

export default function ProformaPrint() {
  const { id } = useParams();

  const [proforma, setProforma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProforma() {
      try {
        setLoading(true);
        setError("");

        const response = await getProforma(id);
        const data = response?.data ?? response;

        if (!cancelled) {
          setProforma(data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load Proforma.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProforma();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!proforma) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      printDocument({
        customerName: proforma.customer_name,
        documentNumber: proforma.proforma_number,
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [proforma]);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Loading Proforma...
      </div>
    );
  }

  if (error || !proforma) {
    return (
      <div className="p-6 text-center text-sm text-red-700">
        {error || "Proforma not found."}
      </div>
    );
  }

  return <ProformaPrintTemplate proforma={proforma} />;
}
