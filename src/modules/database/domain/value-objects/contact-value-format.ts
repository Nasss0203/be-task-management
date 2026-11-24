const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const TOP_LEVEL_DOMAIN_PATTERN = /\.[a-z]{2,}$/i;
const PHONE_CHARACTERS_PATTERN = /^\+?[\d\s().-]+$/;
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function isValidUrl(value: string): boolean {
  if (/\s/.test(value)) return false;

  const candidate = SCHEME_PATTERN.test(value) ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return false;
  }

  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    TOP_LEVEL_DOMAIN_PATTERN.test(url.hostname)
  );
}

export function isValidPhone(value: string): boolean {
  if (!PHONE_CHARACTERS_PATTERN.test(value)) return false;

  const digits = value.replace(/\D/g, '').length;

  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
}
