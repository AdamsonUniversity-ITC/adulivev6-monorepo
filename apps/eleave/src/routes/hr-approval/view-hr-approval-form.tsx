import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hr-approval/view-hr-approval-form")({
  component: RouteComponent,
});

function RouteComponent() {
  return <>Hello "/hr-approval/view-hr-approval-form"!</>;
}
