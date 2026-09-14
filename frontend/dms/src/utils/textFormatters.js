export function formatHumanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b([a-z])/g, (char) => char.toUpperCase());
}

export function formatDisplayText(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value).trim().replace(/\s+/g, " ");
}
