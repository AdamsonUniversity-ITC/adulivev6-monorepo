import { Calendar } from "@repo/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover"
import { format, isValid, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormControl } from "@repo/ui/components/form"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabledDate?: (date: Date) => boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabledDate,
  className,
}: DatePickerProps) {
  const parsed = value ? parseISO(value) : undefined
  const selected = parsed && isValid(parsed) ? parsed : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-11 w-full cursor-pointer justify-between gap-2 border-slate-300 bg-white pl-3 pr-3 text-left font-normal shadow-sm transition-colors",
              "hover:border-primary/60 hover:bg-primary/5",
              "focus-visible:ring-2 focus-visible:ring-primary/25",
              !selected && "text-muted-foreground",
              className,
            )}
          >
            <span className="truncate">
              {selected ? format(selected, "PPP") : placeholder}
            </span>
            <CalendarIcon className="text-primary size-4 shrink-0 opacity-80" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
          disabled={disabledDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
