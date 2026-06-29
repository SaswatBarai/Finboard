function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.startsWith("$") && !key.includes("."))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
  );
}

export function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }

  next();
}
