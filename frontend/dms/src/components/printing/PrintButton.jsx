import { Printer } from "lucide-react";
import { printDocument } from "../../utils/print";

export default function PrintButton({
  customerName,
  documentNumber,
  label = "Print",
  disabled = false,
  onClick,
}) {
  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }

    printDocument({
      customerName,
      documentNumber,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="no-print inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Printer size={16} />
      {label}
    </button>
  );
}
