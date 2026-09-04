import { DrsNotFoundState, DrsPageShell } from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

type DrsNotFoundPageProps = {
  title?: ReactNode;
  description?: ReactNode;
  backTo?: '/' | '/staff/queue';
  backLabel?: string;
};

export function DrsNotFoundPage({
  title,
  description,
  backTo = '/',
  backLabel = 'Back to DRS home',
}: DrsNotFoundPageProps = {}) {
  return (
    <DrsPageShell
      maxWidth="sm"
      contentClassName="flex min-h-[70dvh] items-center"
    >
      <DrsNotFoundState
        title={title}
        description={description}
        action={
          <Button variant="outline" asChild>
            <Link to={backTo}>{backLabel}</Link>
          </Button>
        }
      />
    </DrsPageShell>
  );
}
