import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  leaveFormDefaults,
  leaveFormSchema,
  type LeaveFormValues,
} from "./-leave-form-schema"
import { LEAVE_TYPE_OPTIONS } from "./-leave-types"

type LeaveFormProps = {
  mode: "create" | "edit"
  leaveId?: string
}

export function LeaveForm({ mode, leaveId }: LeaveFormProps) {
  const isEdit = mode === "edit"

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: leaveFormDefaults,
  })

  const onSubmit = (values: LeaveFormValues) => {
    // Wire to API when leave create/update endpoints are available.
    console.log(isEdit ? "update leave" : "create leave", {
      leaveId,
      ...values,
      leave_type_id: Number(values.leave_type_id),
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
        <Link to="/my-leave">
          <ChevronLeft className="size-4" />
          Back to My Leave
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Leave" : "Apply for Leave"}</CardTitle>
          <CardDescription>
            {isEdit
              ? `Update leave request${leaveId ? ` #${leaveId}` : ""}.`
              : "Fill in the details below to submit a new leave request."}
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="leave_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAVE_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date From</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date To</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="State the reason for your leave"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Address while on leave"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="justify-end gap-2 border-t pt-6">
              <Button type="button" variant="outline" asChild>
                <Link to="/my-leave">Cancel</Link>
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? "Update Leave" : "Submit Leave"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
