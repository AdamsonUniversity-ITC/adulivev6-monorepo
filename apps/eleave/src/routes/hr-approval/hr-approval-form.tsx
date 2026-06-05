import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hr-approval/hr-approval-form")({
  component: HrApprovalFormPage,
});

function HrApprovalFormPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">HR Approval Form</h1>
      <p className="text-muted-foreground mt-2">
        Complete HR review and approval for a leave request.
      </p>
    </>
  );
}
