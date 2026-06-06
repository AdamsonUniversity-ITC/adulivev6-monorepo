import { useMyLeaveApplications } from "@/hooks/use-my-leave-applications"

export function useLeaveApplication(leaveId: string) {
  const query = useMyLeaveApplications()

  const application = query.data?.data.find(
    (record) => String(record.id) === leaveId,
  )

  return {
    ...query,
    application,
    isNotFound: query.isSuccess && !application,
  }
}
