import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { FormInput } from "@repo/ui/form-components/form-input"
import { toast } from "@repo/ui/exports"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import * as React from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import {
  createBeginningBalance,
  getValidationErrorMessage,
  getValidationFieldErrors,
  updateBeginningBalance,
  type BeginningBalanceRecord,
} from "@/lib/beginning-balances-api"
import type { EmployeeSearchRecord } from "@/lib/employees-api"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"

import { EmployeeSearchPicker } from "./-employee-search-picker"

const balanceRowSchema = z.object({
  leave_type_id: z.coerce.number().min(1, "Leave type is required."),
  beginning_balance: z.coerce
    .number()
    .min(0, "Balance must be zero or greater."),
})

const formSchema = z
  .object({
    leave_year: z.coerce
      .number()
      .int()
      .min(2000, "Year must be 2000 or later.")
      .max(2100, "Year must be 2100 or earlier."),
    balances: z
      .array(balanceRowSchema)
      .min(1, "Add at least one leave type balance."),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<number>()

    data.balances.forEach((row, index) => {
      if (seen.has(row.leave_type_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate leave type.",
          path: ["balances", index, "leave_type_id"],
        })
      }

      seen.add(row.leave_type_id)
    })
  })

type FormValues = z.infer<typeof formSchema>

type BeginningBalanceFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leaveTypes: LeaveTypeRecord[]
  record?: BeginningBalanceRecord | null
}

function createDefaultBalances(record: BeginningBalanceRecord | null) {
  if (record) {
    return [
      {
        leave_type_id: record.leave_type_id,
        beginning_balance: Number(record.beginning_balance),
      },
    ]
  }

  return [{ leave_type_id: undefined as unknown as number, beginning_balance: 0 }]
}

export function BeginningBalanceFormDialog({
  open,
  onOpenChange,
  leaveTypes,
  record = null,
}: BeginningBalanceFormDialogProps) {
  const queryClient = useQueryClient()
  const isEdit = record != null
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<EmployeeSearchRecord | null>(null)
  const [employeeError, setEmployeeError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leave_year: record?.leave_year ?? new Date().getFullYear(),
      balances: createDefaultBalances(record),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "balances",
  })

  React.useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      leave_year: record?.leave_year ?? new Date().getFullYear(),
      balances: createDefaultBalances(record),
    })

    if (record?.employee) {
      setSelectedEmployee({
        emp_no: record.employee.emp_no,
        user_id: null,
        name: [record.employee.first_name, record.employee.last_name]
          .filter(Boolean)
          .join(" "),
        email: record.employee.email,
        position: record.employee.designation,
        department: record.employee.section?.sec_name ?? null,
      })
    } else {
      setSelectedEmployee(null)
    }

    setEmployeeError(null)
  }, [open, record, form])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit && record) {
        const row = values.balances[0]
        return updateBeginningBalance(record.id, {
          leave_type_id: row.leave_type_id,
          leave_year: values.leave_year,
          beginning_balance: row.beginning_balance,
        })
      }

      if (!selectedEmployee?.emp_no) {
        throw new Error("Employee is required.")
      }

      const results = await Promise.allSettled(
        values.balances.map((row) =>
          createBeginningBalance({
            employee_no: selectedEmployee.emp_no!,
            leave_type_id: row.leave_type_id,
            leave_year: values.leave_year,
            beginning_balance: row.beginning_balance,
          }),
        ),
      )

      const failures = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      )

      if (failures.length > 0) {
        throw failures[0].reason
      }

      return results.length
    },
    onSuccess: (result) => {
      if (isEdit) {
        toast.success("Beginning balance updated.")
      } else {
        const count = typeof result === "number" ? result : 1
        toast.success(
          count === 1
            ? "Beginning balance created."
            : `${count} beginning balances created.`,
        )
      }

      queryClient.invalidateQueries({ queryKey: ["beginning-balances"] })
      onOpenChange(false)
    },
    onError: (error) => {
      const fieldErrors = getValidationFieldErrors(error)

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (field === "employee_no") {
            setEmployeeError(message)
            return
          }

          if (field.startsWith("balances.")) {
            const match = field.match(/^balances\.(\d+)\.(\w+)$/)
            if (match) {
              form.setError(`balances.${match[1]}.${match[2]}` as keyof FormValues, {
                message,
              })
            }
            return
          }

          form.setError(field as keyof FormValues, { message })
        })
      }

      toast.error(
        getValidationErrorMessage(error) ??
          (isEdit
            ? "Failed to update beginning balance."
            : "Failed to create beginning balance."),
      )
    },
  })

  const balances = form.watch("balances")

  const handleSubmit = form.handleSubmit((values) => {
    if (!isEdit && !selectedEmployee?.emp_no) {
      setEmployeeError("Employee is required.")
      return
    }

    mutation.mutate(values)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          form.reset()
          setSelectedEmployee(null)
          setEmployeeError(null)
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit beginning balance" : "Add beginning balances"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the leave type, year, or balance for this record."
              : "Set starting leave credits for an employee. Add one row per leave type."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit && selectedEmployee ? (
            <EmployeeSearchPicker
              value={selectedEmployee}
              onChange={() => undefined}
              disabled
            />
          ) : (
            <EmployeeSearchPicker
              value={selectedEmployee}
              onChange={(employee) => {
                setSelectedEmployee(employee)
                setEmployeeError(null)
              }}
              error={employeeError ?? undefined}
            />
          )}

          <FormInput
            form={form}
            name="leave_year"
            type="number"
            label="Leave year"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Leave type balances</label>
              {!isEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    append({
                      leave_type_id: undefined as unknown as number,
                      beginning_balance: 0,
                    })
                  }
                >
                  <Plus className="size-4" />
                  Add row
                </Button>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Leave type</th>
                    <th className="w-40 px-3 py-2 text-left font-medium">
                      Beginning balance
                    </th>
                    {!isEdit ? (
                      <th className="w-12 px-3 py-2" aria-label="Actions" />
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const rowLeaveTypeId = balances?.[index]?.leave_type_id
                    const selectedInOtherRows = new Set(
                      (balances ?? [])
                        .map((row, rowIndex) =>
                          rowIndex === index ? null : row.leave_type_id,
                        )
                        .filter((id): id is number => typeof id === "number" && id > 0),
                    )

                    return (
                      <tr key={field.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2 align-top">
                          <Select
                            value={
                              rowLeaveTypeId && rowLeaveTypeId > 0
                                ? String(rowLeaveTypeId)
                                : undefined
                            }
                            onValueChange={(value) =>
                              form.setValue(
                                `balances.${index}.leave_type_id`,
                                Number(value),
                                { shouldValidate: true },
                              )
                            }
                          >
                            <SelectTrigger
                              className="w-full"
                              aria-label={`Leave type row ${index + 1}`}
                            >
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaveTypes.map((type) => (
                                <SelectItem
                                  key={type.id}
                                  value={String(type.id)}
                                  disabled={selectedInOtherRows.has(type.id)}
                                >
                                  {type.leave_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.balances?.[index]?.leave_type_id ? (
                            <p className="text-destructive mt-1 text-xs">
                              {
                                form.formState.errors.balances[index]?.leave_type_id
                                  ?.message
                              }
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            aria-label={`Beginning balance row ${index + 1}`}
                            {...form.register(`balances.${index}.beginning_balance`, {
                              valueAsNumber: true,
                            })}
                          />
                          {form.formState.errors.balances?.[index]?.beginning_balance ? (
                            <p className="text-destructive mt-1 text-xs">
                              {
                                form.formState.errors.balances[index]?.beginning_balance
                                  ?.message
                              }
                            </p>
                          ) : null}
                        </td>
                        {!isEdit ? (
                          <td className="px-3 py-2 align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={fields.length === 1}
                              aria-label={`Remove row ${index + 1}`}
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {form.formState.errors.balances?.root ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.balances.root.message}
              </p>
            ) : null}
            {form.formState.errors.balances?.message ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.balances.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {isEdit ? "Save changes" : "Create balances"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
