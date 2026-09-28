import { cx } from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover';
import { CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

export type DatePickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledDate?: (date: Date) => boolean;
  className?: string;
};

export function parseDateValue(value?: string): Date | undefined {
  if (!value) return undefined;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  disabledDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseDateValue(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cx(
            'w-full justify-start px-3 text-left font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? formatDisplayDate(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? formatDateValue(date) : '');
            setOpen(false);
          }}
          disabled={disabledDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
