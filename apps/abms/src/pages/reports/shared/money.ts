const moneyFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0.00';

  const normalized = typeof value === 'string'
    ? value.replace(/[,₱]/g, '').replace(/^PHP\s*/i, '').trim()
    : value;
  const amount = Number(normalized);

  return Number.isFinite(amount) ? moneyFormatter.format(amount) : String(value);
}
