const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

function collectMessages(value, seen = new WeakSet()) {
  if (typeof value === "string") {
    const message = value.trim();
    return message ? [message] : [];
  }

  if (value instanceof Error) {
    return collectMessages(value.message, seen);
  }

  if (!value || typeof value !== "object" || seen.has(value)) {
    return [];
  }

  seen.add(value);

  const values = Array.isArray(value) ? value : Object.values(value);
  const messages = values.flatMap((item) => collectMessages(item, seen));

  return [...new Set(messages)];
}

function getFirstMessage(...values) {
  for (const value of values) {
    const messages = collectMessages(value);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return "";
}

// Supports wrapped or direct DRF field errors, non_field_errors, and nested arrays.
export function getApiErrorMessage(error, fallback = DEFAULT_FALLBACK) {
  const cause = error?.cause;
  const errorMessage = getFirstMessage(
    cause?.errors,
    cause?.non_field_errors,
    cause?.detail,
    cause?.message,
    cause,
    error?.message,
    fallback,
  );

  return errorMessage || DEFAULT_FALLBACK;
}
