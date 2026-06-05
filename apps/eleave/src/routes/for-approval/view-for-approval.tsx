import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/for-approval/view-for-approval")({
  component: ViewForApprovalPage,
});

function ViewForApprovalPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">View For Approval</h1>
      <p className="text-muted-foreground mt-2">
        Review leave request details for approval.
      </p>
    </>
  );
}
