import { Card, CardContent } from '@repo/ui/components/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet';
import { JSX, useState } from 'react';
import { ApplicationSheet } from './-application-sheet.tsx';
import { AssessmentSheet } from './-assessment-sheet.tsx';
import { ClearanceSheet } from './-clearance-sheet.tsx';
import {
  MaintenanceLoaderDataProvider,
  type MaintenanceLoaderAccess,
} from './-maintenance-loader-data-context.tsx';

type Step = {
  label: string;
  component: JSX.Element;
};

const steps: Step[] = [
  {
    label: 'Application',
    component: <ApplicationSheet />,
  },
  { label: 'Clearance', component: <ClearanceSheet /> },
  { label: 'Assessment', component: <AssessmentSheet /> },
];

export function MaintenanceHome({ access }: { access: MaintenanceLoaderAccess }) {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [sheetStep, setSheetStep] = useState<Step | null>(null);

  return (
    <MaintenanceLoaderDataProvider access={access}>
      <main className="min-h-[calc(100dvh-2rem)] bg-gradient-to-b from-muted/40 via-background to-background p-3 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">
          <header className="mb-6 flex flex-col gap-2 rounded-3xl border bg-background/70 p-5 shadow-sm backdrop-blur sm:mb-10 sm:p-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Maintenance
              </h1>
              <p className="text-pretty text-sm text-muted-foreground sm:text-base">
                Pick a step below to open the workflow. You can come back here anytime to
                continue where you left off.
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border bg-background px-3 py-1">
                {steps.length} steps
              </span>
              <span className="rounded-full border bg-background px-3 py-1">
                Opens in a side panel
              </span>
            </div>
          </header>

          <section aria-label="Maintenance steps">
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card
                  key={step.label}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setIsSheetOpen(true);
                    setSheetStep(step);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsSheetOpen(true);
                      setSheetStep(step);
                    }
                  }}
                  className="group cursor-pointer rounded-3xl border bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-background hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="mt-3">
                          <div className="text-base font-semibold tracking-tight">
                            {step.label}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Open the {step.label.toLowerCase()} form in the side panel.
                          </div>
                        </div>
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                        <span aria-hidden>→</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
        <Sheet
          onOpenChange={setIsSheetOpen}
          open={isSheetOpen && Boolean(sheetStep)}
        >
          <SheetContent className="overflow-y-auto sm:w-[95dvw] sm:max-w-none">
            {sheetStep && (
              <>
                <SheetHeader>
                  <SheetTitle>{sheetStep.label}</SheetTitle>
                </SheetHeader>
                <div className="p-4">{sheetStep.component}</div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </main>
    </MaintenanceLoaderDataProvider>
  );
}
