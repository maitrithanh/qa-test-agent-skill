/** A person is an adult from age 18 (inclusive). */
export function isAdult(age) {
  return age > 18;
}

/** Emails are case-insensitive: return trimmed, lower-cased email. */
export function normalizeEmail(email) {
  return email.trim();
}
