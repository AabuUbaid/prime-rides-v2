const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

const NETWORK_ERROR_PATTERN =
  /failed to fetch|networkerror|network request failed|load failed/i;

const DEBUG_ERROR_PATTERN =
  /<!doctype html|<html[\s>]|<head[\s>]|traceback \(most recent call last\)|exception type:|django debug/i;

const IGNORED_ERROR_KEYS = new Set([
  "status",
  "status_code",
  "code",
  "type",
  "timestamp",
  "path",
  "url",
]);

function isUsableMessage(value) {
  if (typeof value !== "string") {
    return false;
  }

  const message = value.trim();

  if (!message) {
    return false;
  }

  if (DEBUG_ERROR_PATTERN.test(message)) {
    return false;
  }

  return true;
}

function collectMessages(value, seen = new WeakSet(), key = null) {
  if (key && IGNORED_ERROR_KEYS.has(String(key).toLowerCase())) {
    return [];
  }

  if (typeof value === "string") {
    const message = value.trim();

    return isUsableMessage(message) ? [message] : [];
  }

  if (value instanceof Error) {
    return collectMessages(value.message, seen);
  }

  if (!value || typeof value !== "object" || seen.has(value)) {
    return [];
  }

  seen.add(value);

  const messages = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      messages.push(...collectMessages(item, seen));
    }
  } else {
    for (const [entryKey, entryValue] of Object.entries(value)) {
      messages.push(...collectMessages(entryValue, seen, entryKey));
    }
  }

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

function parseJsonMessage(message) {
  if (typeof message !== "string") {
    return null;
  }

  const trimmed = message.trim();

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function isNetworkError(error) {
  const message = typeof error?.message === "string" ? error.message : "";

  if (NETWORK_ERROR_PATTERN.test(message)) {
    return true;
  }

  return error instanceof TypeError && !error?.cause;
}

export function getApiErrorMessage(error, fallback = DEFAULT_FALLBACK) {
  if (isNetworkError(error)) {
    return "Network request failed.";
  }

  const cause = error?.cause;

  const directCauseMessage = getFirstMessage(
    cause?.errors,
    cause?.non_field_errors,
    cause?.detail,
    cause?.message,
  );

  if (directCauseMessage) {
    return directCauseMessage;
  }

  if (cause) {
    const causeMessage = getFirstMessage(cause);

    if (causeMessage) {
      return causeMessage;
    }
  }

  const parsedErrorMessage = parseJsonMessage(error?.message);

  if (parsedErrorMessage) {
    const parsedMessage = getFirstMessage(
      parsedErrorMessage?.errors,
      parsedErrorMessage?.non_field_errors,
      parsedErrorMessage?.detail,
      parsedErrorMessage?.message,
      parsedErrorMessage,
    );

    if (parsedMessage) {
      return parsedMessage;
    }
  }

  const errorMessage = getFirstMessage(error?.message);

  if (errorMessage) {
    return errorMessage;
  }

  return isUsableMessage(fallback) ? fallback.trim() : DEFAULT_FALLBACK;
}
