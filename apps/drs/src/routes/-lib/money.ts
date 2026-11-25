export type DrsCurrencyCode = 'PHP' | 'USD';

export function normalizeDrsCurrency(
  value: string | null | undefined,
  fallback: DrsCurrencyCode = 'PHP',
): DrsCurrencyCode {
  const code = String(value ?? '')
    .trim()
    .toUpperCase();
  return code === 'USD' || code === 'PHP' ? code : fallback;
}

export function preferUsdFirst(
  currencies: Array<string | null | undefined>,
): DrsCurrencyCode {
  for (const currency of currencies) {
    if (normalizeDrsCurrency(currency) === 'USD') return 'USD';
  }
  return 'PHP';
}

export function allSameCurrency(
  currencies: Array<string | null | undefined>,
): DrsCurrencyCode | null {
  const unique = new Set(
    currencies.map((currency) => normalizeDrsCurrency(currency)),
  );
  if (unique.size === 0) return 'PHP';
  if (unique.size === 1) return [...unique][0]!;
  return null;
}

export function formatDrsMoney(
  amount: number,
  currency: string | null | undefined = 'PHP',
): string {
  const code = normalizeDrsCurrency(currency);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDrsMoneyLabel(
  amount: number | string,
  currency: string | null | undefined = 'PHP',
): string {
  const code = normalizeDrsCurrency(currency);
  const numeric =
    typeof amount === 'number' ? amount : Number.parseFloat(String(amount));
  if (!Number.isFinite(numeric)) {
    return `${code} ${amount}`;
  }
  // Stable catalog/apply label (not locale currency symbols).
  const formatted = numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${code} ${formatted}`;
}
