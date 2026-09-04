import { DrsErrorState, DrsLoadingState } from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import type { ReactNode } from 'react';

type ReportTabPanelProps = {
  isLoading: boolean;
  isError: boolean;
  loadingLabel: string;
  onRetry: () => void;
  children: ReactNode;
};

export function ReportTabPanel({
  isLoading,
  isError,
  loadingLabel,
  onRetry,
  children,
}: ReportTabPanelProps) {
  if (isLoading) {
    return <DrsLoadingState label={loadingLabel} />;
  }

  if (isError) {
    return (
      <DrsErrorState
        title="This report could not be loaded"
        description="The request failed. Narrow the date range or try again."
        action={
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  return children;
}
