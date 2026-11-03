export function readPort(value, fallback, name) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }

  return parsed;
}

export function readHttpUrl(value, fallback, name) {
  const candidate = value?.trim() || fallback;

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${name} must be a valid HTTP(S) URL`);
  }

  return parsed.toString().replace(/\/$/, "");
}

export function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
