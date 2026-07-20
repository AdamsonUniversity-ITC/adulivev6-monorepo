import {
  DrsEmptyState,
  DrsPageHeader,
  DrsPageShell,
  DrsStatusBadge,
} from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet';
import { Link } from '@tanstack/react-router';
import {
  Banknote,
  BarChart3,
  Bug,
  ClipboardCheck,
  FileStack,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
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

type Step = {
  label: string;
  description: string;
  accessCode: string;
  component?: JSX.Element;
  icon: LucideIcon;
  href?: string;
};

const steps: Step[] = [
  {
    label: 'Application',
    description: 'Manage documents and packages students can request.',
    accessCode: 'application',
    component: <ApplicationSheet />,
    icon: FileStack,
  },
  {
    label: 'Clearance',
    description: 'Manage clearance departments and assigned sign-off users.',
    accessCode: 'clearance',
    component: <ClearanceSheet />,
    icon: ClipboardCheck,
  },
  {
    label: 'Assessment',
    description: 'Configure assessment behavior and allowed assessors.',
    accessCode: 'assessment',
    component: <AssessmentSheet />,
    icon: SlidersHorizontal,
  },
  {
    label: 'Workflow',
    description: 'Manage workflow stages, tasks, and task access.',
    accessCode: 'workflow',
    component: <WorkflowSheet />,
    icon: Network,
  },
  {
    label: 'User management',
    description:
      'Manage DRS users, roles, permissions, and workflow ownership.',
    accessCode: 'user-management',
    component: <UserManagementSheet />,
    icon: UserCog,
  },
  ...TASK_KIND_SLIDE_KINDS.map((kind) => ({
    label: TASK_KIND_SLIDE_META[kind].label,
    description: TASK_KIND_SLIDE_META[kind].description,
    accessCode: 'task-kind-access',
    component: <TaskKindAccessSheet kind={kind} />,
    icon: ShieldCheck,
  })),
  {
    label: 'Payment collection',
    description: 'Manage payment methods and extra collection fees.',
    accessCode: 'payment-collection',
    component: <PaymentCollectionSheet />,
    icon: WalletCards,
  },
  {
    label: 'Payment verification',
    description: 'Assign cashiers who may verify student payments.',
    accessCode: 'payment-verification',
    component: <PaymentVerificationSheet />,
    icon: Banknote,
  },
  {
    label: 'Reports',
    description:
      'View and export statistical reports on DRS applications, revenue, and workflow performance.',
    accessCode: 'reports',
    icon: BarChart3,
    href: '/maintenance/reports',
  },
  {
    label: 'Access debugger',
    description:
      'Explain why a staff member cannot see an application in queue or detail view.',
    accessCode: 'access-debug',
    icon: Bug,
    href: '/maintenance/access-debug',
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

  return (
    <MaintenanceLoaderDataProvider access={access}>
      <MaintenanceNavigationProvider value={{ openUserManagement }}>
        <DrsPageShell maxWidth="xl" contentClassName="space-y-3">
          <DrsPageHeader
            eyebrow="DRS administration"
            title="Maintenance command center"
            description="Configure catalog, workflow, assessment, clearances, payment, and access controls from focused side panels."
            actions={
              <Button
                variant="outline"
                size="lg"
                asChild
                className="rounded-full"
              >
                <Link to="/staff/queue">Open staff queue</Link>
              </Button>
            }
            badges={
              <>
                <DrsStatusBadge tone="info">
                  {visibleSteps.length} panels
                </DrsStatusBadge>
                <DrsStatusBadge tone="success">
                  Side-panel editing
                </DrsStatusBadge>
                <DrsStatusBadge tone="warning">
                  Permission scoped
                </DrsStatusBadge>
              </>
            }
          />

          <section aria-label="Maintenance panels">
            {visibleSteps.length === 0 ? (
              <DrsEmptyState
                title="No maintenance panels"
                description="No maintenance panels are available for your account."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleSteps.map((step) => {
                  const Icon = step.icon;

                  if (step.href) {
                    return (
                      <Card
                        key={step.label}
                        className="drs-card drs-card-hover drs-focus-ring group rounded-[1.75rem]"
                      >
                        <Link to={step.href} className="block h-full">
                          <CardContent className="p-5 sm:p-6">
                            <div className="min-w-0 space-y-4">
                              <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                                <Icon className="size-5" aria-hidden="true" />
                              </div>
                              <div>
                                <div className="group-hover:text-primary text-base font-semibold tracking-tight transition-colors">
                                  {step.label}
                                </div>
                                <p className="text-muted-foreground mt-1 text-sm">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Link>
                      </Card>
                    );
                  }

                  return (
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
                      className="drs-card drs-card-hover drs-focus-ring group cursor-pointer rounded-[1.75rem]"
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="min-w-0 space-y-4">
                          <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                            <Icon className="size-5" aria-hidden="true" />
                          </div>
                          <div>
                            <div className="group-hover:text-primary text-base font-semibold tracking-tight transition-colors">
                              {step.label}
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
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
