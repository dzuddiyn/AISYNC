const ASC_FRAGMENT_KEY = "asc";
const ENVELOPE_VERSION = "0.1";

function utf8ToBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToUtf8(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("ASC fragment payload is not valid Base64URL.");
  }

  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function createEnvelope(contract, options = {}) {
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    throw new Error("contract must be a JSON object.");
  }

  const requestId = String(options.requestId ?? "").trim();
  const expiresAt = String(options.expiresAt ?? "").trim();

  if (!requestId) throw new Error("requestId is required.");
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) {
    throw new Error("expiresAt must be a valid date-time string.");
  }

  return {
    envelope_version: ENVELOPE_VERSION,
    request_id: requestId,
    expires_at: expiresAt,
    integrity: {
      algorithm: "SHA-256",
      digest: options.integrityDigest ?? null
    },
    contract
  };
}

export function encodeEnvelope(envelope) {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    throw new Error("envelope must be a JSON object.");
  }
  return utf8ToBase64Url(JSON.stringify(envelope));
}

export function decodeEnvelope(encodedPayload) {
  const json = base64UrlToUtf8(encodedPayload);
  const envelope = JSON.parse(json);

  if (envelope?.envelope_version !== ENVELOPE_VERSION) {
    throw new Error("Unsupported ASC envelope version.");
  }

  return envelope;
}

export function buildAscLink(baseUrl, envelope) {
  const url = new URL(baseUrl);
  url.hash = "";
  url.searchParams.delete(ASC_FRAGMENT_KEY);

  const encoded = encodeEnvelope(envelope);
  url.hash = `${ASC_FRAGMENT_KEY}=${encoded}`;
  return url.toString();
}

export function decodeAscLink(link) {
  const url = new URL(link);

  if (url.searchParams.has(ASC_FRAGMENT_KEY)) {
    throw new Error("ASC payload must not be carried in ordinary query parameters.");
  }

  const fragment = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const prefix = `${ASC_FRAGMENT_KEY}=`;

  if (!fragment.startsWith(prefix)) {
    throw new Error("ASC fragment payload is missing.");
  }

  const encoded = fragment.slice(prefix.length);
  if (!encoded) throw new Error("ASC fragment payload is empty.");

  return decodeEnvelope(encoded);
}

export const ASC_LINK_CONSTANTS = Object.freeze({
  fragmentKey: ASC_FRAGMENT_KEY,
  envelopeVersion: ENVELOPE_VERSION
});
