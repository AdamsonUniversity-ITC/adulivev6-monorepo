import { DrsEmptyState, DrsSearchField } from '@/components/drs-ui.tsx';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission } from '@repo/hooks';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Switch } from '@repo/ui/components/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { type JSX, useMemo, useState } from 'react';
import {
  DRS_CANCEL_APPLICATIONS_PERMISSION,
  DRS_USER_MANAGEMENT_MANAGE_PERMISSION,
  formatRolePermissionName,
} from './-lib/api/access/permissionLabels.ts';
import { fetchAssessmentSettings } from './-lib/api/fetchAssessmentSettings.ts';
import { fetchClearanceDepartments } from './-lib/api/fetchClearanceDepartments.ts';
import { assignWorkflowUser } from './-lib/api/user-management/assignWorkflowUser.ts';
import { detachWorkflowUser } from './-lib/api/user-management/detachWorkflowUser.ts';
import { fetchUserAssignmentHistory } from './-lib/api/user-management/fetchUserHistory.ts';
import { fetchUserManagementProfile } from './-lib/api/user-management/fetchUserProfile.ts';
import { fetchUserManagementUsers } from './-lib/api/user-management/fetchUsers.ts';
import { patchUserManagementPermissions } from './-lib/api/user-management/patchUserManagementPermissions.ts';
import type {
  AssignmentPayload,
  UserManagementProfile,
  UserManagementRow,
  WorkflowResponsibility,
} from './-lib/api/user-management/types.ts';
import { fetchWorkflowStages } from './-lib/api/workflow/fetchStages.ts';
import { fetchWorkflowTaskKinds } from './-lib/api/workflow/fetchTaskKinds.ts';
import type { WorkflowStage, WorkflowTask } from './-lib/api/workflow/types.ts';
import { useDebouncedValue } from './-lib/hooks/useDebouncedValue.ts';

const userListKey = (q: string, page: number) =>
  ['drs', 'user-management', 'users', q, page] as const;

const profileKey = (empNo: string) =>
  ['drs', 'user-management', 'profile', empNo] as const;

const historyKey = (empNo: string) =>
  ['drs', 'user-management', 'history', empNo] as const;

const labelForUser = (user: UserManagementRow): string =>
  user.name || user.email || `Employee ${user.emp_no}`;

export function UserManagementSheet(): JSX.Element {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmpNo, setSelectedEmpNo] = useState<string | null>(null);
  const debounced = useDebouncedValue(search.trim(), 300);
  const perPage = 15;

  const usersQuery = useQuery({
    queryKey: userListKey(debounced, page),
    queryFn: () => fetchUserManagementUsers({ q: debounced, page, perPage }),
    refetchOnWindowFocus: false,
  });

  const rows = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;
  const lastPage = meta?.last_page ?? 1;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
      <Card className="drs-card">
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Users</CardTitle>
          <DrsSearchField
            label="Search users"
            placeholder="Search by name, employee no, or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {usersQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading users...</p>
          ) : usersQuery.isError ? (
            <p className="text-destructive text-sm">Could not load users.</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Assignments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.emp_no}
                    className="cursor-pointer"
                    onClick={() => setSelectedEmpNo(row.emp_no)}
                  >
                    <TableCell>
                      <div className="font-medium">{labelForUser(row)}</div>
                      <div className="text-muted-foreground text-xs">
                        {row.emp_no} {row.email ? `· ${row.email}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>{row.department || '-'}</TableCell>
                    <TableCell className="text-right">
                      {row.responsibility_summary.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              Page {meta?.current_page ?? page} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((current) => Math.min(lastPage, current + 1))
                }
                disabled={page >= lastPage}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEmpNo ? (
        <UserProfilePanel empNo={selectedEmpNo} />
      ) : (
        <DrsEmptyState
          title="Select a user"
          description="Select a user to view roles, permissions, workflow responsibilities, and assignment history."
        />
      )}
    </div>
  );
}

function UserProfilePanel({ empNo }: { empNo: string }): JSX.Element {
  const queryClient = useQueryClient();
  const authQuery = useQuery({
    queryKey: ['drs', 'auth-user'],
    queryFn: async () => {
      const { data } = await fetchAuthUser();
      return normalizePermissions(data);
    },
    refetchOnWindowFocus: false,
  });
  const canManagePermissions = checkPermission(
    authQuery.data ?? [],
    DRS_USER_MANAGEMENT_MANAGE_PERMISSION,
  );
  const profileQuery = useQuery({
    queryKey: profileKey(empNo),
    queryFn: () => fetchUserManagementProfile(empNo),
    refetchOnWindowFocus: false,
  });
  const historyQuery = useQuery({
    queryKey: historyKey(empNo),
    queryFn: () => fetchUserAssignmentHistory(empNo),
    refetchOnWindowFocus: false,
  });

  const detachMutation = useMutation({
    mutationFn: detachWorkflowUser,
    onSuccess: () => {
      toast.success('Assignment removed.');
      queryClient.invalidateQueries({ queryKey: profileKey(empNo) });
      queryClient.invalidateQueries({ queryKey: historyKey(empNo) });
    },
    onError: () => toast.error('Failed to remove assignment.'),
  });

  const permissionMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      patchUserManagementPermissions(empNo, {
        permissions: {
          [DRS_CANCEL_APPLICATIONS_PERMISSION]: enabled,
        },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileKey(empNo), updated);
      toast.success('Permissions updated.');
    },
    onError: () => toast.error('Failed to update permissions.'),
  });

  if (profileQuery.isLoading) {
    return (
      <Card className="drs-card">
        <CardContent className="text-muted-foreground p-5 text-sm">
          Loading profile...
        </CardContent>
      </Card>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Card className="drs-card">
        <CardContent className="text-destructive p-5 text-sm">
          Could not load profile.
        </CardContent>
      </Card>
    );
  }

  const profile = profileQuery.data;
  const canCancelApplications = profile.permissions.includes(
    DRS_CANCEL_APPLICATIONS_PERMISSION,
  );
  const otherPermissions = profile.permissions.filter(
    (permission) => permission !== DRS_CANCEL_APPLICATIONS_PERMISSION,
  );

  return (
    <Card className="drs-card">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {profile.employee.name || profile.employee.emp_no}
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              {profile.employee.emp_no}{' '}
              {profile.employee.email ? `· ${profile.employee.email}` : ''}
            </p>
          </div>
          <AssignDialog profile={profile} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Roles</h3>
          <ChipList values={profile.roles} empty="No roles assigned." />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Permissions</h3>
          {canManagePermissions ? (
            <div className="bg-muted/20 flex items-center justify-between gap-3 rounded-2xl border p-3">
              <div>
                <p className="text-sm font-medium">
                  {formatRolePermissionName(DRS_CANCEL_APPLICATIONS_PERMISSION)}
                </p>
                <p className="text-muted-foreground text-xs">
                  Allow this user to cancel applications from the staff queue.
                </p>
              </div>
              <Switch
                checked={canCancelApplications}
                disabled={permissionMutation.isPending}
                onCheckedChange={(checked) =>
                  permissionMutation.mutate(checked === true)
                }
                aria-label="Can cancel applications"
              />
            </div>
          ) : null}
          <ChipList
            values={otherPermissions.map((permission) =>
              formatRolePermissionName(permission),
            )}
            empty={
              canManagePermissions
                ? 'No other permissions assigned.'
                : 'No permissions assigned.'
            }
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">
            Responsibilities ({profile.responsibility_summary.total})
          </h3>
          {profile.responsibilities.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No workflow assignments.
            </p>
          ) : (
            <div className="space-y-2">
              {profile.responsibilities.map((item) => (
                <ResponsibilityRow
                  key={item.id}
                  item={item}
                  onRemove={() => {
                    if (!item.assignment_id) return;
                    detachMutation.mutate({
                      assignmentId: item.assignment_id,
                      empNo,
                      assignmentRole: item.assignment_role,
                    });
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Assignment History</h3>
          {(historyQuery.data ?? []).length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No assignment history yet.
            </p>
          ) : (
            <div className="space-y-1">
              {(historyQuery.data ?? []).slice(0, 8).map((row) => (
                <div
                  key={row.id}
                  className="bg-muted/20 rounded-2xl border p-3 text-xs"
                >
                  <div className="font-medium">
                    {row.event || row.description || 'Assignment updated'}
                  </div>
                  <div className="text-muted-foreground">
                    {row.created_at || ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function ChipList({
  values,
  empty,
}: {
  values: string[];
  empty: string;
}): JSX.Element {
  if (values.length === 0) {
    return <p className="text-muted-foreground text-xs">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <Badge key={value} variant="secondary">
          {value}
        </Badge>
      ))}
    </div>
  );
}

function ResponsibilityRow({
  item,
  onRemove,
}: {
  item: WorkflowResponsibility;
  onRemove: () => void;
}): JSX.Element {
  const label = useMemo(() => {
    if (item.stage) return item.stage.name;
    if (item.task) return item.task.name;
    if (item.target_name) return item.target_name;
    if (item.kind) return item.kind.replace(/_/g, ' ');
    return item.target_type || 'Workflow assignment';
  }, [item]);

  return (
    <div className="bg-muted/20 flex items-center justify-between gap-3 rounded-2xl border p-3 text-xs">
      <div>
        <div className="font-medium capitalize">{label}</div>
        <div className="text-muted-foreground">
          {item.target_type} · {item.assignment_role}
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

type AssignmentTargetType =
  | 'task_kind'
  | 'payment_verification'
  | 'clearance_department'
  | 'assessment'
  | 'assessment_foreigner'
  | 'stage'
  | 'task';

type ClearanceDepartment = {
  id: string | number;
  clearance_name?: string | null;
  department_name?: string | null;
  name?: string | null;
};

const targetRequiresValue = (targetType: AssignmentTargetType): boolean =>
  ['task_kind', 'clearance_department', 'stage', 'task'].includes(targetType);

const clearanceLabel = (item: ClearanceDepartment): string =>
  item.department_name ||
  item.clearance_name ||
  item.name ||
  `Clearance #${item.id}`;

const unwrapClearanceDepartments = (
  payload: unknown,
): ClearanceDepartment[] => {
  if (Array.isArray(payload)) return payload as ClearanceDepartment[];
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: ClearanceDepartment[] }).data;
  }
  return [];
};

const flattenTasks = (stages: WorkflowStage[]): WorkflowTask[] =>
  stages.flatMap((stage) => stage.tasks ?? []);

function AssignDialog({
  profile,
}: {
  profile: UserManagementProfile;
}): JSX.Element {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] =
    useState<AssignmentTargetType>('task_kind');
  const [targetValue, setTargetValue] = useState('');
  const [role, setRole] = useState<'primary' | 'fallback' | 'approver'>(
    'primary',
  );

  const taskKindsQuery = useQuery({
    queryKey: ['drs', 'workflow', 'task-kinds'],
    queryFn: fetchWorkflowTaskKinds,
    enabled: open,
  });

  const clearancesQuery = useQuery({
    queryKey: ['drs', 'clearance-departments'],
    queryFn: fetchClearanceDepartments,
    enabled: open,
  });

  const assessmentQuery = useQuery({
    queryKey: ['drs', 'assessment-settings'],
    queryFn: fetchAssessmentSettings,
    enabled: open,
  });

  const stagesQuery = useQuery({
    queryKey: ['drs', 'workflow', 'stages'],
    queryFn: fetchWorkflowStages,
    enabled: open,
  });

  const clearances = unwrapClearanceDepartments(clearancesQuery.data);
  const stages = stagesQuery.data ?? [];
  const tasks = flattenTasks(stages);

  const buildPayload = (): AssignmentPayload => {
    const base = {
      emp_no: profile.employee.emp_no,
      assignment_role: role,
      metadata: { role },
    };

    if (targetType === 'payment_verification') {
      return {
        ...base,
        target_type: 'task_kind' as const,
        kind: 'payment_verification',
      };
    }

    if (targetType === 'task_kind') {
      return { ...base, target_type: targetType, kind: targetValue };
    }

    if (targetType === 'clearance_department') {
      return {
        ...base,
        target_type: targetType,
        clearance_id: targetValue,
        target_key: targetValue,
      };
    }

    if (targetType === 'assessment' || targetType === 'assessment_foreigner') {
      return {
        ...base,
        target_type: targetType,
        assessment_setting_id: assessmentQuery.data?.id ?? null,
        target_key: assessmentQuery.data?.id ?? null,
      };
    }

    if (targetType === 'stage') {
      const stage = stages.find((item) => item.id === targetValue);
      return {
        ...base,
        target_type: targetType,
        stage_id: targetValue,
        name: stage?.name ?? null,
      };
    }

    const task = tasks.find((item) => item.id === targetValue);
    return {
      ...base,
      target_type: targetType,
      task_id: targetValue,
      name: task?.name ?? null,
    };
  };

  const assignMutation = useMutation({
    mutationFn: () => assignWorkflowUser(buildPayload()),
    onSuccess: () => {
      toast.success('Assignment saved.');
      setOpen(false);
      setTargetValue('');
      queryClient.invalidateQueries({
        queryKey: profileKey(profile.employee.emp_no),
      });
      queryClient.invalidateQueries({
        queryKey: historyKey(profile.employee.emp_no),
      });
    },
    onError: () => toast.error('Failed to save assignment.'),
  });

  const isSaveDisabled =
    assignMutation.isPending ||
    (targetRequiresValue(targetType) && !targetValue) ||
    ((targetType === 'assessment' || targetType === 'assessment_foreigner') &&
      !assessmentQuery.data?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign workflow responsibility</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select
            value={targetType}
            onValueChange={(value) => {
              setTargetType(value as AssignmentTargetType);
              setTargetValue('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assignment target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clearance_department">
                Clearance department
              </SelectItem>
              <SelectItem value="assessment">Assessment assessor</SelectItem>
              <SelectItem value="assessment_foreigner">
                Foreigner assessment assessor
              </SelectItem>
              <SelectItem value="payment_verification">
                Payment verification
              </SelectItem>
              <SelectItem value="task_kind">Task-kind operator</SelectItem>
              <SelectItem value="stage">Workflow stage</SelectItem>
              <SelectItem value="task">Workflow task</SelectItem>
            </SelectContent>
          </Select>

          {targetType === 'clearance_department' ? (
            <Select value={targetValue} onValueChange={setTargetValue}>
              <SelectTrigger>
                <SelectValue placeholder="Clearance department" />
              </SelectTrigger>
              <SelectContent>
                {clearances.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {clearanceLabel(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {targetType === 'task_kind' ? (
            <Select value={targetValue} onValueChange={setTargetValue}>
              <SelectTrigger>
                <SelectValue placeholder="Task kind" />
              </SelectTrigger>
              <SelectContent>
                {(taskKindsQuery.data ?? []).map((item) => (
                  <SelectItem key={item.kind} value={item.kind}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {targetType === 'stage' ? (
            <Select value={targetValue} onValueChange={setTargetValue}>
              <SelectTrigger>
                <SelectValue placeholder="Workflow stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {targetType === 'task' ? (
            <Select value={targetValue} onValueChange={setTargetValue}>
              <SelectTrigger>
                <SelectValue placeholder="Workflow task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select
            value={role}
            onValueChange={(value) => setRole(value as typeof role)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assignment role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="fallback">Fallback</SelectItem>
              <SelectItem value="approver">Approver</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaveDisabled}
            onClick={() => assignMutation.mutate()}
          >
            {assignMutation.isPending ? 'Saving...' : 'Save assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
