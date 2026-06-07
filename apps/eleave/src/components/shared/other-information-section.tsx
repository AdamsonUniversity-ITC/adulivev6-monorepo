import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion"

import { EmployeeHrDatesTable } from "@/components/shared/employee-hr-dates-table"
import {
  LeaveBalancePanel,
  type LeaveBalanceRow,
} from "@/components/shared/leave-balance-table"
import { useEmployeeHrProfile } from "@/hooks/use-employee-hr-profile"
import { cn } from "@/lib/utils"

type OtherInformationSectionProps = {
  className?: string
  employeeNo?: string | null
  leaveBalanceRows: LeaveBalanceRow[]
  isLeaveBalancesLoading?: boolean
  isLeaveBalancesError?: boolean
}

export function OtherInformationSection({
  className,
  employeeNo,
  leaveBalanceRows,
  isLeaveBalancesLoading = false,
  isLeaveBalancesError = false,
}: OtherInformationSectionProps) {
  const {
    data: hrProfile,
    isLoading: isHrProfileLoading,
    isError: isHrProfileError,
  } = useEmployeeHrProfile(employeeNo)

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="other-information"
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <AccordionItem value="other-information" className="border-0">
        <AccordionTrigger className="px-5 py-4 text-sm font-semibold hover:no-underline">
          Other Information
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <LeaveBalancePanel
              rows={leaveBalanceRows}
              isLoading={isLeaveBalancesLoading}
              isError={isLeaveBalancesError}
            />
            <EmployeeHrDatesTable
              birthdate={hrProfile?.birthdate}
              dateHired={hrProfile?.date_hired}
              permanencyDate={hrProfile?.permanency_date}
              isLoading={isHrProfileLoading}
              isError={isHrProfileError}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
