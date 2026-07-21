import {
  DrsEmptyState,
  DrsErrorState,
  DrsLoadingState,
  DrsPageHeader,
  DrsPageShell,
  DrsSearchField,
  DrsSectionCard,
  DrsStatusBadge,
} from '@/components/drs-ui.tsx';
import { Badge } from '@repo/ui/components/badge';
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
import { CheckCircle2, CircleAlert, Search, XCircle } from 'lucide-react';
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
        className="size-4 shrink-0 text-emerald-600"
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
    <DrsPageShell maxWidth="xl" contentClassName="space-y-3">
      <DrsPageHeader
        eyebrow="DRS administration"
        title="Access debugger"
        description="Explain why a staff member cannot see an application in their queue or detail view."
        backTo="/maintenance/"
        backLabel="Back to maintenance"
      />

      <DrsSectionCard
        title="Lookup"
        description="Select a staff employee and optionally provide an application reference."
        icon={Search}
      >
        <div className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="employee-search">
              Staff employee
            </label>
            {selectedEmployee ? (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-4">
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
                  className="rounded-full"
                  onClick={() => {
                    setSelectedEmployee(null);
                    setEmployeeSearch('');
                  }}
                >
                  Change employee
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
                  <DrsLoadingState label="Searching employees..." />
                ) : null}
                {debouncedEmployeeSearch.length >= 2 &&
                !userSearchQuery.isLoading ? (
                  <div className="divide-y rounded-2xl border">
                    {(userSearchQuery.data?.data ?? []).length === 0 ? (
                      <div className="text-muted-foreground p-4 text-sm">
                        No employees matched that search.
                      </div>
                    ) : (
                      (userSearchQuery.data?.data ?? []).map((user) => (
                        <button
                          key={user.emp_no}
                          type="button"
                          className="hover:bg-muted/50 flex w-full items-start justify-between gap-3 p-4 text-left transition"
                          onClick={() => {
                            setSelectedEmployee(user);
                            setEmployeeSearch('');
                          }}
                        >
                          <div>
                            <div className="font-medium">
                              {user.name || user.email || user.emp_no}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {user.emp_no}
                              {user.email ? ` · ${user.email}` : ''}
                            </div>
                          </div>
                          <Badge variant="secondary">Select</Badge>
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
              Application reference (optional)
            </label>
            <Input
              id="application-ref"
              value={applicationRef}
              onChange={(event) => setApplicationRef(event.target.value)}
              placeholder="DRS number, application id, or student name"
              className="rounded-2xl"
            />
            <p className="text-muted-foreground text-sm">
              Leave blank to explain overall queue access. Provide a reference
              to diagnose a specific application.
            </p>
          </div>

          <Button
            type="button"
            className="rounded-full"
            disabled={!selectedEmployee}
            onClick={handleRunExplain}
          >
            Run diagnosis
          </Button>
        </div>
      </DrsSectionCard>

      {!selectedEmployee ? (
        <DrsEmptyState
          title="Select an employee"
          description="Search for a staff member to inspect their DRS access profile."
        />
      ) : explainQuery.isLoading ? (
        <DrsLoadingState label="Running access diagnosis..." />
      ) : explainQuery.isError ? (
        <DrsErrorState
          title="Diagnosis failed"
          description="Could not load the access explanation. Try again."
          action={
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => explainQuery.refetch()}
            >
              Retry
            </Button>
          }
        />
      ) : explainQuery.data ? (
        <div className="space-y-6">
          <DrsSectionCard
            title="Summary"
            description={explainQuery.data.summary}
            icon={CircleAlert}
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
          </DrsSectionCard>

          {groupedChecks.map((section) => (
            <DrsSectionCard
              key={section.title}
              title={section.title}
              description={`${section.checks.filter((check) => check.passed).length} of ${section.checks.length} checks passed`}
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
                        <div className="font-medium">{check.code}</div>
                        <div className="text-muted-foreground mt-1 text-sm">
                          {check.message}
                        </div>
                        {Object.keys(check.details).length > 0 ? (
                          <pre className="bg-muted/60 mt-3 max-h-48 overflow-auto rounded-xl p-3 text-xs">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant={check.passed ? 'secondary' : 'destructive'}
                        >
                          {check.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DrsSectionCard>
          ))}
        </div>
      ) : null}
    </DrsPageShell>
  );
}
