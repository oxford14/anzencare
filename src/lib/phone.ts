/**
 * Normalize a Philippine phone number to digits in 63XXXXXXXXXX form.
 * Mirrors the SQL function public.normalize_ph_phone so the client and DB agree.
 */
export function normalizePhPhone(input: string): string {
  const d = (input ?? "").replace(/[^0-9]/g, "");
  if (d.length === 11 && d.startsWith("0")) {
    return `63${d.slice(1)}`;
  }
  if (d.length === 10 && d.startsWith("9")) {
    return `63${d}`;
  }
  if (d.startsWith("63")) {
    return d;
  }
  return d;
}

/** Domain used to anchor phone-first accounts to a deterministic auth email. */
export const PHONE_EMAIL_DOMAIN = "phone.anzencare.app";

/** Build the deterministic auth email for a normalized phone number. */
export function phoneToAuthEmail(normalizedPhone: string): string {
  return `${normalizedPhone}@${PHONE_EMAIL_DOMAIN}`;
}

/** Loose check for whether an identifier looks like an email address. */
export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

/** Basic validity check for a PH mobile number after normalization. */
export function isValidPhPhone(normalized: string): boolean {
  return /^63\d{10}$/.test(normalized);
}
