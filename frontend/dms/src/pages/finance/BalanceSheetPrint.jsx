import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { getBalanceSheet } from "../../api/balanceSheets";
import BalanceSheetPrintTemplate from "../../components/printing/templates/BalanceSheetPrintTemplate";

export default function BalanceSheetPrint() {
  const { id } = useParams();

  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBalanceSheet() {
      if (!id) {
        setError("Balance Sheet ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getBalanceSheet(id);

        if (!response?.success || !response?.data) {
          throw new Error("Balance Sheet print data could not be loaded.");
        }

        if (!cancelled) {
          setBalanceSheet(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err?.message || "Unable to load Balance Sheet for printing.";

          setError(message);
          toast.error(message);
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
    if (!balanceSheet || loading) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      window.print();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [balanceSheet, loading]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Preparing Balance Sheet for printing...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Link
            to="/finance/balance-sheets"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Balance Sheets
          </Link>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-800">
            Unable to load Balance Sheet
          </h1>

          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!balanceSheet) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Balance Sheet not found
          </h1>

          <Link
            to="/finance/balance-sheets"
            className="mt-4 inline-block text-sm font-medium text-gray-600 underline"
          >
            Back to Balance Sheets
          </Link>
        </div>
      </div>
    );
  }

  return <BalanceSheetPrintTemplate balanceSheet={balanceSheet} />;
}
