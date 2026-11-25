export type DialCodeOption = {
  code: string;
  label: string;
  dial: string;
};

/** Curated dial codes for the contact selector (longest dials first when parsing). */
export const CONTACT_DIAL_CODES: DialCodeOption[] = [
  { code: 'PH', label: 'Philippines', dial: '+63' },
  { code: 'US', label: 'United States', dial: '+1' },
  { code: 'CA', label: 'Canada', dial: '+1' },
  { code: 'GB', label: 'United Kingdom', dial: '+44' },
  { code: 'AU', label: 'Australia', dial: '+61' },
  { code: 'SG', label: 'Singapore', dial: '+65' },
  { code: 'AE', label: 'United Arab Emirates', dial: '+971' },
  { code: 'JP', label: 'Japan', dial: '+81' },
  { code: 'KR', label: 'South Korea', dial: '+82' },
  { code: 'CN', label: 'China', dial: '+86' },
  { code: 'HK', label: 'Hong Kong', dial: '+852' },
  { code: 'MY', label: 'Malaysia', dial: '+60' },
  { code: 'ID', label: 'Indonesia', dial: '+62' },
  { code: 'TH', label: 'Thailand', dial: '+66' },
  { code: 'VN', label: 'Vietnam', dial: '+84' },
  { code: 'IN', label: 'India', dial: '+91' },
  { code: 'SA', label: 'Saudi Arabia', dial: '+966' },
  { code: 'QA', label: 'Qatar', dial: '+974' },
  { code: 'DE', label: 'Germany', dial: '+49' },
  { code: 'FR', label: 'France', dial: '+33' },
];

export const DEFAULT_DIAL_CODE = '+63';
export const DEFAULT_COUNTRY_CODE = 'PH';

const DIAL_DIGITS_LONGEST_FIRST = [
  ...new Set(
    CONTACT_DIAL_CODES.map((option) => option.dial.replace(/^\+/, '')).sort(
      (a, b) => b.length - a.length,
    ),
  ),
];

/** ISO 3166-1 alpha-2 → Unicode regional-indicator flag emoji (e.g. PH → 🇵🇭). */
export function flagEmojiFromCountryCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return '';
  const base = 0x1f1e6; // Regional Indicator Symbol Letter A
  const a = 'A'.charCodeAt(0);
  return String.fromCodePoint(
    base + (normalized.charCodeAt(0) - a),
    base + (normalized.charCodeAt(1) - a),
  );
}

export function dialForCountryCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  const match = CONTACT_DIAL_CODES.find((option) => option.code === normalized);
  return match?.dial ?? DEFAULT_DIAL_CODE;
}

/** First curated match for a dial (shared dials like +1 → US). */
export function countryCodeForDial(dial: string): string {
  const normalized = dial.startsWith('+') ? dial : `+${dial}`;
  const match = CONTACT_DIAL_CODES.find((option) => option.dial === normalized);
  return match?.code ?? DEFAULT_COUNTRY_CODE;
}

export function optionForCountryCode(code: string): DialCodeOption | undefined {
  const normalized = code.trim().toUpperCase();
  return CONTACT_DIAL_CODES.find((option) => option.code === normalized);
}

export function dialCodeLabel(option: DialCodeOption): string {
  const flag = flagEmojiFromCountryCode(option.code);
  return flag ? `${flag} ${option.dial}` : `${option.dial} ${option.code}`;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '');
}

export function composeContactNumber(
  dialCode: string,
  nationalNumber: string,
): string {
  const dial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  let national = digitsOnly(nationalNumber);
  if (dial === '+63') {
    national = national.replace(/^0+/, '');
  }
  return `${dial}${national}`;
}

export function parseContactNumber(value: string | null | undefined): {
  dialCode: string;
  countryCode: string;
  nationalNumber: string;
} {
  const raw = String(value ?? '')
    .trim()
    .replace(/\s+/g, '');
  if (!raw) {
    return {
      dialCode: DEFAULT_DIAL_CODE,
      countryCode: DEFAULT_COUNTRY_CODE,
      nationalNumber: '',
    };
  }

  if (!raw.startsWith('+')) {
    return {
      dialCode: DEFAULT_DIAL_CODE,
      countryCode: DEFAULT_COUNTRY_CODE,
      nationalNumber: digitsOnly(raw),
    };
  }

  const digits = raw.slice(1);
  for (const dial of DIAL_DIGITS_LONGEST_FIRST) {
    if (digits.startsWith(dial)) {
      let national = digits.slice(dial.length);
      const dialCode = `+${dial}`;
      if (dialCode === '+63') {
        national = national.replace(/^0+/, '');
      }
      return {
        dialCode,
        countryCode: countryCodeForDial(dialCode),
        nationalNumber: national,
      };
    }
  }

  const match = digits.match(/^(\d{1,3})(\d*)$/);
  if (!match) {
    return {
      dialCode: DEFAULT_DIAL_CODE,
      countryCode: DEFAULT_COUNTRY_CODE,
      nationalNumber: digitsOnly(digits),
    };
  }

  const dialCode = `+${match[1]}`;
  return {
    dialCode,
    countryCode: countryCodeForDial(dialCode),
    nationalNumber: match[2] ?? '',
  };
}

export function validateNationalNumber(
  dialCode: string,
  nationalNumber: string,
): string | null {
  let national = digitsOnly(nationalNumber);
  if (dialCode === '+63') {
    national = national.replace(/^0+/, '');
    if (national.length !== 10) {
      return 'Philippine numbers must be exactly 10 digits';
    }
    return null;
  }
  if (national.length < 7 || national.length > 15) {
    return 'Enter between 7 and 15 digits';
  }
  return null;
}
