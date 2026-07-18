import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';

export type ReportFilterOption = { value: string; label: string; badge?: string };

type Props = {
  id: string;
  options: ReportFilterOption[];
  value: string;
  disabled?: boolean;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  invalid?: boolean;
  errorId?: string;
  groupLabel: string;
  clearLabel?: string;
  onChange: (value: string) => void;
};

export function ReportFilterCombobox({ id, options, value, disabled = false, placeholder, searchPlaceholder, emptyText, invalid = false, errorId, groupLabel, clearLabel, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button type="button" variant="outline" id={id} role="combobox" aria-expanded={open} aria-label={groupLabel} aria-invalid={invalid} aria-describedby={invalid ? errorId : undefined} disabled={disabled} className="h-10 w-full justify-between border-[var(--abms-border)] bg-[var(--abms-surface)] px-3 font-normal text-[var(--abms-text)] shadow-sm transition-colors hover:bg-[var(--abms-hover)]">
        <span className={`min-w-0 flex-1 truncate text-left ${selected ? 'font-medium' : 'text-muted-foreground'}`}>{selected?.label ?? placeholder}</span>
        {selected?.badge && <Badge variant="secondary" className="ml-2 shrink-0">{selected.badge}</Badge>}
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
      <Command>
        <CommandInput placeholder={searchPlaceholder} />
        <CommandList className="max-h-[280px]">
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup heading={groupLabel}>
            {clearLabel && <CommandItem value={clearLabel} className="items-center gap-2 py-2.5" onSelect={() => { onChange(''); setOpen(false); }}>
              <Check className={`size-4 shrink-0 ${value === '' ? 'opacity-100' : 'opacity-0'}`} />
              <span className="min-w-0 flex-1 truncate">{clearLabel}</span>
            </CommandItem>}
            {options.map(option => <CommandItem key={option.value} value={`${option.label} ${option.badge ?? ''}`} className="group items-center gap-2 py-2.5" onSelect={() => { onChange(option.value); setOpen(false); }}>
              <Check className={`size-4 shrink-0 ${value === option.value ? 'opacity-100' : 'opacity-0'}`} />
              <span className="min-w-0 flex-1 truncate group-hover:whitespace-normal">{option.label}</span>
              {option.badge && <Badge variant="secondary" className="shrink-0">{option.badge}</Badge>}
            </CommandItem>)}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}
