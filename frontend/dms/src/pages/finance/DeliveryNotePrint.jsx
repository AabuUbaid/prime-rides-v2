import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getDeliveryNote } from "../../api/deliveryNotes";
import DeliveryNotePrintTemplate from "../../components/printing/templates/DeliveryNotePrintTemplate";
import { printDocument } from "../../utils/print";

export default function DeliveryNotePrint() {
  const { id } = useParams();

  const [deliveryNote, setDeliveryNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDeliveryNote() {
      try {
        setLoading(true);
        setError("");

        const response = await getDeliveryNote(id);
        const data = response?.data ?? response;

        if (!cancelled) {
          setDeliveryNote(data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load Delivery Note.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDeliveryNote();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!deliveryNote) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      printDocument({
        customerName: deliveryNote.customer_name,
        documentNumber: deliveryNote.delivery_note_number,
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [deliveryNote]);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Loading Delivery Note...
      </div>
    );
  }

  if (error || !deliveryNote) {
    return (
      <div className="p-6 text-center text-sm text-red-700">
        {error || "Delivery Note not found."}
      </div>
    );
  }

  return <DeliveryNotePrintTemplate deliveryNote={deliveryNote} />;
}
