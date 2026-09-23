/**
 * Normalizes a phone number to a consistent E.164-ish form so the same phone typed in
 * different formats (with/without country code, spaces, dashes) matches the same account
 * at register, login and password reset (BUG-15 — "Phone login requires exact stored
 * string").
 *
 * Assumption: this storefront serves Indian customers, so a 10-digit number with no
 * country code is assumed to be Indian and gets a "+91" prefix. Numbers that already
 * include a country code (start with "+") are left as-is apart from stripping formatting
 * characters.
 */
export function normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/[^\d]/g, '');
  
    if (hasPlus) {
      return `+${digits}`;
    }
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    // Already includes some country code but no "+" (e.g. "919876543210") — leave the
    // digits as given, just add the "+".
    return `+${digits}`;
  }