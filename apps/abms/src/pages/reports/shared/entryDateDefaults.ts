const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const dateValue = (value: unknown) => typeof value === 'string' && DATE_PATTERN.test(value) ? value : '';

export const getEntryDateDefaults = (
  firstDates: Record<string, unknown> | undefined,
  currentDate: unknown,
  schoolYear: string,
) => {
  if (!schoolYear) return { from: '', to: '' };

  return {
    from: dateValue(firstDates?.[schoolYear]),
    to: dateValue(currentDate),
  };
};
