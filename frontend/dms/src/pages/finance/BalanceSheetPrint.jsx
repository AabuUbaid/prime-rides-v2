
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBalanceSheet } from "../../api/balanceSheets";
import BalanceSheetPrintTemplate from "../../components/printing/templates/BalanceSheetPrintTemplate";

export default function BalanceSheetPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBalanceSheet() {
      try {
        setLoading(true);
        const response = await getBalanceSheet(id);

        if (!response?.success || !response?.data) {
          throw new Error("Unable to load the Balance Sheet.");
        }

        if (!cancelled) {
          setBalanceSheet(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load the Balance Sheet.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBalanceSheet();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (loading || !balanceSheet || error || printStarted.current) {
      return;
    }

    printStarted.current = true;

    // Wait until the printable document has rendered.
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        // In browsers where print() blocks until the dialog closes,
        // this runs after the user prints or cancels.
        navigate("/finance/balance-sheets", { replace: true });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [loading, balanceSheet, error, navigate]);

  if (loading) return <div>Preparing Balance Sheet...</div>;
  if (error) return <div role="alert">{error}</div>;

  return <BalanceSheetPrintTemplate balanceSheet={balanceSheet} />;
}
