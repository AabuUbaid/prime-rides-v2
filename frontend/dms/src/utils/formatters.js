export function formatAED(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `AED ${Number(value).toLocaleString("en-AE", {
    maximumFractionDigits: 0,
  })}`;
}