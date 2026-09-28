export type StudentBalanceDisplayKind =
  | 'previous'
  | 'prelim'
  | 'midterm'
  | 'finals';

export type StudentBalanceMeta = {
  amount: string;
  amount_raw: number;
  enrolled: boolean;
  period: 'prelim' | 'midterm' | 'finals' | null;
  display_kind: StudentBalanceDisplayKind;
  remark: string;
};

export function studentBalanceKindLabel(
  kind: StudentBalanceDisplayKind | undefined,
): string {
  switch (kind) {
    case 'prelim':
      return 'Prelim payment due';
    case 'midterm':
      return 'Midterm payment due';
    case 'finals':
      return 'Finals payment due';
    case 'previous':
    default:
      return 'Previous balance';
  }
}

export function formatStudentBalanceAmount(
  balance: StudentBalanceMeta | null | undefined,
): string | null {
  if (!balance) return null;
  const amount = balance.amount?.trim();
  if (!amount) return null;
  return `PHP ${amount}`;
}
