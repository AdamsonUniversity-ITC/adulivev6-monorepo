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
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabledDate,
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
              "w-full pl-3 text-left font-normal",
              !selected && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4" />
            {selected ? format(selected, "PPP") : placeholder}
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
