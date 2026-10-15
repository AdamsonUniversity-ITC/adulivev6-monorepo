import { DrsErrorState, DrsPageShell } from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Link, type ErrorComponentProps } from '@tanstack/react-router';

export function DrsErrorPage({ reset }: ErrorComponentProps) {
  return (
    <DrsPageShell
      maxWidth="sm"
      contentClassName="flex min-h-[70dvh] items-center"
    >
      <DrsErrorState
        title="Something went wrong"
        description="This page could not be shown. Try again, or go back to DRS home."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => reset()}>
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to DRS home</Link>
            </Button>
          </div>
        }
      />
    </DrsPageShell>
  );
}
