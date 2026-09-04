import {
  DrsEmptyState,
  DrsPageHeader,
  DrsPageShell,
  DrsSection,
} from '@/components/drs-ui.tsx';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useState, type JSX } from 'react';
import { ApplicationSheet } from './-application-sheet.tsx';
import { AssessmentSheet } from './-assessment-sheet.tsx';
import { ClearanceSheet } from './-clearance-sheet.tsx';
import {
  MaintenanceLoaderDataProvider,
  type MaintenanceLoaderAccess,
} from './-maintenance-loader-data-context.tsx';
import { MaintenanceNavigationProvider } from './-maintenance-navigation-context.tsx';
import { PaymentCollectionSheet } from './-payment-collection-sheet.tsx';
import { PaymentVerificationSheet } from './-payment-verification-sheet.tsx';
import { TaskKindAccessSheet } from './-task-kind-access-sheet.tsx';
import {
  TASK_KIND_SLIDE_KINDS,
  TASK_KIND_SLIDE_META,
} from './-task-kind-slides.ts';
import { UserManagementSheet } from './-user-management-sheet.tsx';
import { WorkflowSheet } from './-workflow-sheet.tsx';

const GROUP_ORDER = [
  'Catalog',
  'Workflow',
  'Payments',
  'People and access',
  'Reporting',
] as const;

type StepGroup = (typeof GROUP_ORDER)[number];

type Step = {
  label: string;
  description: string;
  accessCode: string;
  group: StepGroup;
  component?: JSX.Element;
  href?: string;
};

const steps: Step[] = [
  {
    label: 'Documents and packages',
    description: 'What students can request, their prices, and their rules.',
    accessCode: 'application',
    group: 'Catalog',
    component: <ApplicationSheet />,
  },
  {
    label: 'Stages and tasks',
    description: 'The route a request takes, and who works each stage.',
    accessCode: 'workflow',
    group: 'Workflow',
    component: <WorkflowSheet />,
  },
  {
    label: 'Assessment',
    description: 'How amounts are assessed, and who may assess them.',
    accessCode: 'assessment',
    group: 'Workflow',
    component: <AssessmentSheet />,
  },
  {
    label: 'Clearance departments',
    description: 'Departments that sign off, and the users who sign for them.',
    accessCode: 'clearance',
    group: 'Workflow',
    component: <ClearanceSheet />,
  },
  ...TASK_KIND_SLIDE_KINDS.map((kind) => ({
    label: TASK_KIND_SLIDE_META[kind].label,
    description: TASK_KIND_SLIDE_META[kind].description,
    accessCode: 'task-kind-access',
    group: 'Workflow' as StepGroup,
    component: <TaskKindAccessSheet kind={kind} />,
  })),
  {
    label: 'Payment collection',
    description: 'Payment methods students can choose, and extra fees.',
    accessCode: 'payment-collection',
    group: 'Payments',
    component: <PaymentCollectionSheet />,
  },
  {
    label: 'Payment verification',
    description: 'Cashiers who may verify student payment proof.',
    accessCode: 'payment-verification',
    group: 'Payments',
    component: <PaymentVerificationSheet />,
  },
  {
    label: 'Users and roles',
    description: 'DRS users, their roles, permissions, and workflow ownership.',
    accessCode: 'user-management',
    group: 'People and access',
    component: <UserManagementSheet />,
  },
  {
    label: 'Access debugger',
    description:
      'Explain why a staff member cannot see a request in the queue or detail view.',
    accessCode: 'access-debug',
    group: 'People and access',
    href: '/maintenance/access-debug',
  },
  {
    label: 'Reports',
    description:
      'Volume, revenue, turnaround, and payment reports, with CSV and PDF export.',
    accessCode: 'reports',
    group: 'Reporting',
    href: '/maintenance/reports',
  },
];

export function MaintenanceHome({
  access,
}: {
  access: MaintenanceLoaderAccess;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [sheetStep, setSheetStep] = useState<Step | null>(null);
  const visibleSteps = steps.filter((step) => access.includes(step.accessCode));
  const openUserManagement = () => {
    const step = steps.find((item) => item.accessCode === 'user-management');
    if (!step || !access.includes(step.accessCode)) return;

    setSheetStep(step);
    setIsSheetOpen(true);
  };

  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: visibleSteps.filter((step) => step.group === group),
  })).filter(({ items }) => items.length > 0);

  return (
    <MaintenanceLoaderDataProvider access={access}>
      <MaintenanceNavigationProvider value={{ openUserManagement }}>
        <DrsPageShell maxWidth="lg" contentClassName="space-y-5">
          <DrsPageHeader
            title="Configuration"
            description="Settings for this DRS site. Each entry opens the panel where you make the change."
          />

          {visibleSteps.length === 0 ? (
            <DrsEmptyState
              title="No settings available to you"
              description="Your account does not have access to any configuration panel on this site. Ask a DRS administrator to grant the access you need."
            />
          ) : (
            <div className="max-w-3xl space-y-8">
              {groups.map(({ group, items }) => (
                <DrsSection key={group} title={group} divided>
                  <ul className="divide-border/70 divide-y">
                    {items.map((step) => {
                      const body = (
                        <>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">
                              {step.label}
                            </span>
                            <span className="text-muted-foreground block text-sm">
                              {step.description}
                            </span>
                          </span>
                          <ChevronRight
                            className="text-muted-foreground mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                          />
                        </>
                      );

                      const rowClass =
                        'hover:bg-muted/40 focus-visible:ring-ring flex w-full items-start gap-4 rounded-sm px-1 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none';

                      return (
                        <li key={step.label}>
                          {step.href ? (
                            <Link to={step.href} className={rowClass}>
                              {body}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className={rowClass}
                              onClick={() => {
                                setIsSheetOpen(true);
                                setSheetStep(step);
                              }}
                            >
                              {body}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </DrsSection>
              ))}
            </div>
          )}

          <Sheet
            onOpenChange={setIsSheetOpen}
            open={isSheetOpen && Boolean(sheetStep?.component)}
          >
            <SheetContent className="bg-background/95 overflow-y-auto border-l backdrop-blur sm:w-[95dvw] sm:max-w-none">
              {sheetStep?.component ? (
                <>
                  <SheetHeader className="border-b px-6 py-5">
                    <SheetTitle>{sheetStep.label}</SheetTitle>
                    <SheetDescription>{sheetStep.description}</SheetDescription>
                  </SheetHeader>
                  <div className="p-4 sm:p-6">{sheetStep.component}</div>
                </>
              ) : null}
            </SheetContent>
          </Sheet>
        </DrsPageShell>
      </MaintenanceNavigationProvider>
    </MaintenanceLoaderDataProvider>
  );
}
