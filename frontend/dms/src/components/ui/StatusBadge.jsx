const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
};

function getVariant(status = "") {
  const value = String(status).toLowerCase();

  if (
    [
      "approved",
      "available",
      "paid",
      "completed",
      "sold",
      "ready_for_delivery",
      "ready for delivery",
      "used",
    ].includes(value)
  ) {
    return "success";
  }

  if (
    [
      "pending",
      "draft",
      "requested",
      "partially_paid",
      "partially paid",
      "processing",
      "reserved",
    ].includes(value)
  ) {
    return "warning";
  }

  if (
    [
      "rejected",
      "declined",
      "cancelled",
      "canceled",
      "failed",
      "blocked",
      "expired",
    ].includes(value)
  ) {
    return "danger";
  }

  if (["active", "in_progress", "in progress"].includes(value)) {
    return "cyan";
  }

  return "neutral";
}

function StatusBadge({ status, variant, children }) {
  const resolvedVariant = variant || getVariant(status);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5",
        "rounded-full border",
        "px-2.5 py-1",
        "text-[10px] font-bold",
        "uppercase tracking-wide",
        "whitespace-nowrap",
        styles[resolvedVariant] || styles.neutral,
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          resolvedVariant === "success" ? "bg-emerald-500" : "",
          resolvedVariant === "warning" ? "bg-amber-500" : "",
          resolvedVariant === "danger" ? "bg-rose-500" : "",
          resolvedVariant === "info" ? "bg-blue-500" : "",
          resolvedVariant === "cyan" ? "bg-cyan-500" : "",
          resolvedVariant === "neutral" ? "bg-slate-400" : "",
        ].join(" ")}
      />

      {children || status}
    </span>
  );
}

export default StatusBadge;
