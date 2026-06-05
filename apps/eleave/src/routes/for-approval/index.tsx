import { createFileRoute } from "@tanstack/react-router";
import { ForApprovalPageContent } from "./for-approval-page-content.js";

export const Route = createFileRoute("/for-approval/")({
  component: ForApprovalPage,
});

function ForApprovalPage() {
  return <ForApprovalPageContent />;
}
