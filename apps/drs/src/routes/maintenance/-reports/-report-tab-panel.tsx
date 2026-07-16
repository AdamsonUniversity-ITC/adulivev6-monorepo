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
        title="Unable to load report"
        description="Try adjusting filters or retry the request."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={onRetry}
          >
            Retry
          </Button>
        }
      />
    );
  }

  return children;
}
