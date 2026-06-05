import { createFileRoute } from "@tanstack/react-router"

import { MyLeaveDataTable } from "./-leave-datatable"

export const Route = createFileRoute("/my-leave/")({
  component: MyLeavePage,
})

function MyLeavePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Leave</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your leave requests.
        </p>
      </div>

      <MyLeaveDataTable />
    </div>
  )
}
