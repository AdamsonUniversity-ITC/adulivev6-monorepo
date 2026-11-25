import { formatStatusLabel } from '@/components/drs-ui.tsx';

import type { DRSApplicationDetail } from './types/applications.ts';

/** Print timestamp format: MMM dd, YYYY H:i A (e.g. Nov 25, 2026 2:30 PM). */
export function formatPrintDateTime(
  value: Date | string | null | undefined,
): string {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = String(date.getDate());
  const year = String(date.getFullYear());
  const time = date
    .toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/\u202f/g, ' ');

  return `${month} ${day}, ${year} ${time}`;
}

export function formatPrintMoney(
  amount: number,
  currency: string | null | undefined = 'PHP',
): string {
  const code =
    String(currency ?? 'PHP').toUpperCase() === 'USD' ? 'USD' : 'PHP';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPrintReceiveMode(
  mode: DRSApplicationDetail['receive_mode'],
): string {
  const labels: Record<DRSApplicationDetail['receive_mode'], string> = {
    delivery: 'Delivery',
    pickup: 'Pickup',
  };

  return labels[mode] ?? formatStatusLabel(mode);
}

export function valueOrDash(
  value: string | number | null | undefined,
): string {
  if (value == null || value === '') return '-';

  return String(value);
}
