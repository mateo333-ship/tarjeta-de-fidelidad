/**
 * Shared input-cleaning helpers used by every route handler and form that
 * writes to Firestore. React already escapes everything it renders (no
 * dangerouslySetInnerHTML exists anywhere in this app) and firestore.rules
 * is the real, server-enforced access gate — but neither of those stops
 * someone from posting a value with control characters, a misleading
 * zero-width character, or plain garbage length straight to an API route.
 * These helpers make sure only clean, bounded text ever reaches the
 * database, regardless of what a caller sends.
 */

// Strips ASCII/Unicode control characters (including newlines, tabs, and
// the invisible C1 range) that have no business being in a name, reward
// description, or business name, then trims and caps the length.
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  const withoutControlChars = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  return withoutControlChars.trim().slice(0, maxLength);
}

// Firebase Auth uids (including the auto-generated 28-char ones this app
// uses as both the customer document id and the QR code payload) are
// always a short alphanumeric-ish token. Anything else arriving in a
// customerId/id field is either a mistake or an attempt to probe the
// backend with something unexpected, so it's rejected before it ever
// reaches a Firestore call.
const UID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function isValidUid(value: unknown): value is string {
  return typeof value === "string" && UID_PATTERN.test(value);
}
