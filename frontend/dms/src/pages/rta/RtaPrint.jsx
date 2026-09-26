import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRtaRecord } from "../../api/rta";
import { printDocument } from "../../utils/print";
import RtaPrintTemplate from "../../components/printing/templates/RtaPrintTemplate";

export default function RtaPrint() {
  const { id } = useParams();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRta() {
      try {
        setLoading(true);
        setError("");

        const response = await getRtaRecord(id);
        const data = response?.data ?? response;

        if (!cancelled) {
          setRecord(data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load RTA record.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRta();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!record) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      printDocument({
        customerName:
          record.second_party_name || record.first_party_name || "RTA",
        documentNumber: `RTA-${record.id}`,
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [record]);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Loading RTA for printing...
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-6 text-center text-sm text-red-700">
        {error || "RTA record not found."}
      </div>
    );
  }

  const showSupplier = user?.role === "MASTER" || user?.role === "ADMIN";

  return <RtaPrintTemplate record={record} showSupplier={showSupplier} />;
}
