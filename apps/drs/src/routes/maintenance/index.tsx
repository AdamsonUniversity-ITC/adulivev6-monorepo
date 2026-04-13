import { getAccess } from '@/api/getAccess.ts';
import { Card, CardContent } from '@repo/ui/components/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet';
import { Spinner } from '@repo/ui/components/spinner';
import { useAuth } from '@repo/ui/hooks/use-auth';
import { createFileRoute } from '@tanstack/react-router';
import { JSX, useState } from 'react';
import { ApplicationSheet } from './-application-sheet.tsx';
import { ClearanceSheet } from './-clearance-sheet.tsx';

export const Route = createFileRoute('/maintenance/')({
  loader: async () => {
    const { check } = useAuth();
    const { data } = await check();
    const result = await getAccess({ user_id: data.id });
    const access = result.data?.access ?? [];

    return { access: [] };
    return {
      access: access,
    };
  },
  component: Index,
  pendingComponent: () => <Spinner />,
});

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
  // { label: 'Assessment', component: AssessmentSheet },
  // { label: 'Payment', component: PaymentSheet },
  // { label: 'Verification', component: VerificationSheet },
  // { label: 'Processing', component: ProcessingSheet },
  // { label: 'Delivery', component: DeliverySheet },
  // { label: 'Delivered', component: DeliveredSheet },
];

function Index() {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [sheetStep, setSheetStep] = useState<Step | null>(null);

  return (
    <main id="root" className="p-2">
      <div className="flex max-h-[80dvh] flex-wrap items-center justify-center gap-6 overflow-y-auto p-8">
        <div className="flex flex-col items-center p-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <Card
                onClick={() => {
                  setIsSheetOpen(true);
                  setSheetStep(step);
                }}
                className="w-64 cursor-pointer rounded-2xl shadow-md transition-all hover:bg-gray-50"
              >
                <CardContent className="py-4 text-center font-medium">
                  {step.label}
                </CardContent>
              </Card>

              {index < steps.length - 1 && (
                <div className="bg-muted-foreground/40 h-8 w-0.5" />
              )}
            </div>
          ))}
        </div>
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
  );
}
