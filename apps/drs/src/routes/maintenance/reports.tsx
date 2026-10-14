import { DrsLoadingState, DrsPageShell } from '@/components/drs-ui.tsx';
import { assertReportPageAccess } from '@/routes/-lib/assertStaffPortalAccess.ts';
import { createFileRoute } from '@tanstack/react-router';
import { ReportsPage } from './-reports/-reports-page.tsx';

export const Route = createFileRoute('/maintenance/reports')({
  beforeLoad: () => assertReportPageAccess(),
  component: ReportsPage,
  pendingComponent: () => (
    <DrsPageShell maxWidth="xl">
      <DrsLoadingState label="Loading reports..." />
    </DrsPageShell>
  ),
});
