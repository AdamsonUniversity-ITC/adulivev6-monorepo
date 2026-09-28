import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { useQuery } from '@tanstack/react-query';
import { JSX, useMemo } from 'react';
import { fetchWorkflowStages } from './-lib/api/workflow/fetchStages.ts';
import { fetchWorkflowTaskKinds } from './-lib/api/workflow/fetchTaskKinds.ts';
import { EmailNotificationsPanel } from './-workflow/-email-notifications-panel.tsx';
import {
  KINDS_QUERY_KEY,
  STAGES_QUERY_KEY,
  sortedStages,
} from './-workflow/-utils.ts';

export const EmailNotificationsSheet = (): JSX.Element => {
  const stagesQuery = useQuery({
    queryKey: STAGES_QUERY_KEY,
    queryFn: fetchWorkflowStages,
    refetchOnWindowFocus: false,
  });

  const kindsQuery = useQuery({
    queryKey: KINDS_QUERY_KEY,
    queryFn: fetchWorkflowTaskKinds,
    refetchOnWindowFocus: false,
  });

  const stages = useMemo(
    () => sortedStages(stagesQuery.data),
    [stagesQuery.data],
  );
  const kinds = kindsQuery.data ?? [];

  const loading = stagesQuery.isLoading || kindsQuery.isLoading;
  const error = stagesQuery.isError || kindsQuery.isError;

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {loading ? (
          <DrsInlineLoading size="sm" label="Loading email notifications…" />
        ) : error ? (
          <p className="text-destructive text-sm">
            Failed to load workflow stages or task kinds.
          </p>
        ) : (
          <EmailNotificationsPanel stages={stages} kinds={kinds} />
        )}
      </div>
    </div>
  );
};
