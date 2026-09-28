import {
  DatePicker,
  parseDateValue,
  type DatePickerProps,
} from '@/components/date-picker.tsx';

export function parseReportDate(value?: string): Date | undefined {
  return parseDateValue(value);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export { startOfDay as startOfReportDay };

type ReportDatePickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabledDate?: (date: Date) => boolean;
};

export function ReportDatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  disabledDate,
}: ReportDatePickerProps) {
  return (
    <DatePicker
      id={id}
      value={value}
      onChange={(next) => onChange(next || undefined)}
      placeholder={placeholder}
      disabledDate={disabledDate}
    />
  );
}

export type { DatePickerProps };
