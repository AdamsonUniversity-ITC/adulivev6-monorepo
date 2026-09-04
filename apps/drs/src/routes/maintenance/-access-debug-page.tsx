import {
  DrsEmptyState,
  DrsErrorState,
  DrsLoadingState,
  DrsPageHeader,
  DrsPageShell,
  DrsPanel,
  DrsSearchField,
  DrsSection,
  DrsStatusBadge,
} from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { type JSX, useMemo, useState } from 'react';
import { fetchAccessDebugExplain } from './-lib/api/access-debug/fetchAccessDebugExplain.ts';
import type { AccessDebugCheck } from './-lib/api/access-debug/types.ts';
import { fetchUserManagementUsers } from './-lib/api/user-management/fetchUsers.ts';
import type { UserManagementRow } from './-lib/api/user-management/types.ts';
import { useDebouncedValue } from './-lib/hooks/useDebouncedValue.ts';

const CHECK_SECTIONS: Record<string, string> = {
  tenant_context: 'Prerequisites',
  emp_no_resolved: 'Prerequisites',
  auth_roles_loaded: 'Prerequisites',
  auth_permissions_loaded: 'Prerequisites',
  workflow_stage_visibility: 'Stage visibility',
  assigned_course_programs: 'Stage visibility',
  queue_bypass: 'Stage visibility',
  application_found: 'Application rules',
  application_cancelled: 'Application rules',
  status_stage_match: 'Application rules',
  foreigner_scope: 'Application rules',
  course_program_match: 'Application rules',
  foreign_assessment_allowlist: 'Application rules',
  actionable_task_filter: 'Active tasks',
  can_view_detail: 'Outcome',
  can_see_in_queue: 'Outcome',
};

const explainKey = (empNo: string, application: string) =>
  ['drs', 'access-debug', 'explain', empNo, application] as const;

const userSearchKey = (query: string) =>
  ['drs', 'access-debug', 'user-search', query] as const;

function groupChecks(checks: AccessDebugCheck[]): Array<{
  title: string;
  checks: AccessDebugCheck[];
}> {
  const grouped = new Map<string, AccessDebugCheck[]>();

  for (const check of checks) {
    const title = CHECK_SECTIONS[check.code] ?? 'Other';
    const bucket = grouped.get(title) ?? [];
    bucket.push(check);
    grouped.set(title, bucket);
  }

  const order = [
    'Prerequisites',
    'Stage visibility',
    'Application rules',
    'Active tasks',
    'Outcome',
    'Other',
  ];

  return order
    .filter((title) => grouped.has(title))
    .map((title) => ({
      title,
      checks: grouped.get(title) ?? [],
    }));
}

function CheckIcon({ passed }: { passed: boolean }) {
  if (passed) {
    return (
      <CheckCircle2
        className="text-status-success size-4 shrink-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <XCircle className="text-destructive size-4 shrink-0" aria-hidden="true" />
  );
}

export function AccessDebugPage(): JSX.Element {
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] =
    useState<UserManagementRow | null>(null);
  const [applicationRef, setApplicationRef] = useState('');
  const [submittedApplication, setSubmittedApplication] = useState('');
  const debouncedEmployeeSearch = useDebouncedValue(employeeSearch.trim(), 300);

  const userSearchQuery = useQuery({
    queryKey: userSearchKey(debouncedEmployeeSearch),
    queryFn: () =>
      fetchUserManagementUsers({
        q: debouncedEmployeeSearch,
        page: 1,
        perPage: 8,
      }),
    enabled: debouncedEmployeeSearch.length >= 2 && selectedEmployee === null,
  });

  const explainQuery = useQuery({
    queryKey: explainKey(selectedEmployee?.emp_no ?? '', submittedApplication),
    queryFn: () =>
      fetchAccessDebugExplain({
        empNo: selectedEmployee!.emp_no,
        application: submittedApplication || undefined,
      }),
    enabled: Boolean(selectedEmployee?.emp_no),
  });

  const groupedChecks = useMemo(
    () => groupChecks(explainQuery.data?.checks ?? []),
    [explainQuery.data?.checks],
  );

  const handleRunExplain = () => {
    setSubmittedApplication(applicationRef.trim());
  };

  return (
    <DrsPageShell maxWidth="lg" contentClassName="space-y-5">
      <DrsPageHeader
        title="Access debugger"
        description="Explain why a staff member cannot see a request in their queue or detail view."
        backTo="/maintenance/"
        backLabel="Configuration"
      />

      <DrsPanel
        title="Who, and which request"
        description="Pick the staff member. Add a request reference to diagnose one specific request."
      >
        <div className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="employee-search">
              Staff employee
            </label>
            {selectedEmployee ? (
              <div className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {selectedEmployee.name || selectedEmployee.email}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {selectedEmployee.emp_no}
                    {selectedEmployee.email
                      ? ` · ${selectedEmployee.email}`
                      : ''}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(null);
                    setEmployeeSearch('');
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <DrsSearchField
                  label="Staff employee"
                  value={employeeSearch}
                  onChange={(event) => setEmployeeSearch(event.target.value)}
                  placeholder="Search by name, email, or employee number"
                />
                {userSearchQuery.isLoading ? (
                  <DrsLoadingState label="Searching employees…" />
                ) : null}
                {debouncedEmployeeSearch.length >= 2 &&
                !userSearchQuery.isLoading ? (
                  <div className="divide-border/70 divide-y rounded-md border">
                    {(userSearchQuery.data?.data ?? []).length === 0 ? (
                      <div className="text-muted-foreground px-3 py-4 text-sm">
                        No employee matches that name, email, or number.
                      </div>
                    ) : (
                      (userSearchQuery.data?.data ?? []).map((user) => (
                        <button
                          key={user.emp_no}
                          type="button"
                          className="hover:bg-muted/40 focus-visible:ring-ring flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          onClick={() => {
                            setSelectedEmployee(user);
                            setEmployeeSearch('');
                          }}
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {user.name || user.email || user.emp_no}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {user.emp_no}
                              {user.email ? ` · ${user.email}` : ''}
                            </div>
                          </div>
                          <span className="text-muted-foreground shrink-0 text-xs">
                            Select
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="application-ref">
              Request reference (optional)
            </label>
            <Input
              id="application-ref"
              value={applicationRef}
              onChange={(event) => setApplicationRef(event.target.value)}
              placeholder="DRS number, request id, or student name"
              className="max-w-md"
            />
            <p className="text-muted-foreground text-sm">
              Leave this blank to explain overall queue access.
            </p>
          </div>

          <Button
            type="button"
            disabled={!selectedEmployee}
            onClick={handleRunExplain}
          >
            Run diagnosis
          </Button>
        </div>
      </DrsPanel>

      {!selectedEmployee ? (
        <DrsEmptyState
          title="Select an employee to start"
          description="Search for a staff member above to inspect what they can and cannot see in DRS."
        />
      ) : explainQuery.isLoading ? (
        <DrsLoadingState label="Running access diagnosis…" />
      ) : explainQuery.isError ? (
        <DrsErrorState
          title="The diagnosis could not be run"
          description="The access explanation failed to load. Try again in a moment."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => explainQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      ) : explainQuery.data ? (
        <div className="space-y-6">
          <DrsSection
            title="Outcome"
            description={explainQuery.data.summary}
            divided
          >
            <div className="flex flex-wrap gap-2">
              {explainQuery.data.can_see_in_queue !== null ? (
                <DrsStatusBadge
                  tone={
                    explainQuery.data.can_see_in_queue ? 'success' : 'danger'
                  }
                >
                  Queue:{' '}
                  {explainQuery.data.can_see_in_queue ? 'visible' : 'hidden'}
                </DrsStatusBadge>
              ) : null}
              {explainQuery.data.can_view_application !== null ? (
                <DrsStatusBadge
                  tone={
                    explainQuery.data.can_view_application
                      ? 'success'
                      : 'danger'
                  }
                >
                  Detail:{' '}
                  {explainQuery.data.can_view_application
                    ? 'allowed'
                    : 'blocked'}
                </DrsStatusBadge>
              ) : null}
              {explainQuery.data.application ? (
                <DrsStatusBadge tone="info">
                  {explainQuery.data.application.drs_no ??
                    explainQuery.data.application.id}
                </DrsStatusBadge>
              ) : null}
            </div>
          </DrsSection>

          {groupedChecks.map((section) => (
            <DrsSection
              key={section.title}
              title={section.title}
              description={`${section.checks.filter((check) => check.passed).length} of ${section.checks.length} checks passed`}
              divided
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Check</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.checks.map((check) => (
                    <TableRow key={check.code}>
                      <TableCell>
                        <CheckIcon passed={check.passed} />
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        <div className="font-mono text-xs font-medium">
                          {check.code}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm">
                          {check.message}
                        </div>
                        {Object.keys(check.details).length > 0 ? (
                          <pre className="bg-muted/60 mt-2 max-h-48 overflow-auto rounded-md p-3 font-mono text-xs">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <DrsStatusBadge
                          tone={check.passed ? 'success' : 'danger'}
                        >
                          {check.passed ? 'Passed' : 'Failed'}
                        </DrsStatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DrsSection>
          ))}
        </div>
      ) : null}
    </DrsPageShell>
  );
}
