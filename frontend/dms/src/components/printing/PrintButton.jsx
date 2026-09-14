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
      className="inline-flex items-center gap-2"
    >
      <Printer size={16} />
      {label}
    </button>
  );
}
