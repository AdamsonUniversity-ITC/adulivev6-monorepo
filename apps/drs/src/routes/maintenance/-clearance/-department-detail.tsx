import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Label } from '@repo/ui/components/label';
import { toast } from '@repo/ui/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { updateClearanceDepartment } from '../-lib/api/updateClearanceDepartment.ts';
import { useMaintenanceNavigation } from '../-maintenance-navigation-context.tsx';
import {
  type Department,
  formatCreatedAt,
  getDepartmentName,
  getDepartmentUsers,
} from './-utils.ts';

type Props = {
  department: Department;
};

export const DepartmentDetail = ({ department }: Props) => {
  const { openUserManagement } = useMaintenanceNavigation();
  const queryClient = useQueryClient();

  const users = getDepartmentUsers(department);
  const isCourseScoped = Boolean(
    department.restrict_assigned_users_to_course_programs,
  );
  const departmentName = getDepartmentName(department);
  const updateScopeMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateClearanceDepartment(department.id, {
        name: departmentName,
        restrict_assigned_users_to_course_programs: enabled,
      }),
    onSuccess: () => {
      toast.success('Department scope updated.');
      queryClient.invalidateQueries({ queryKey: ['clearance_departments'] });
    },
    onError: () => {
      toast.error('Failed to update department scope.');
    },
  });

  return (
    <div className="space-y-4">
      <Card className="border-border border">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {departmentName}
            {isCourseScoped ? (
              <span className="border-status-warning/25 bg-status-warning-surface text-status-warning inline-flex items-center gap-1 rounded-sm border px-1.5 text-[11px] font-medium">
                course scoped
              </span>
            ) : null}
          </CardTitle>
          <CardDescription>
            {department.description || 'No description provided.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium">Created</p>
            <p className="text-sm">{formatCreatedAt(department.created_at)}</p>
          </div>
          <div className="border-border bg-muted/30 flex gap-3 rounded-md border p-3">
            <Checkbox
              id={`clearance-${department.id}-course-program-scope`}
              checked={isCourseScoped}
              disabled={updateScopeMutation.isPending}
              onCheckedChange={(value) =>
                updateScopeMutation.mutate(value === true)
              }
            />
            <div className="space-y-1">
              <Label
                htmlFor={`clearance-${department.id}-course-program-scope`}
                className="cursor-pointer font-normal"
              >
                Restrict assigned staff to their course programs
              </Label>
              <p className="text-muted-foreground text-xs">
                When enabled, this clearance department can only sign off
                applications under the assigned staff member&apos;s Fenroll
                course programs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border border">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Department users
            </CardTitle>
            <CardDescription>
              {users.length} {users.length === 1 ? 'user' : 'users'} assigned
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openUserManagement}
          >
            Manage in User Management
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground py-4 text-sm">
              No employees assigned to this department yet.
            </p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="bg-accent border-border flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.teacher?.full_name ||
                        user.employee?.name ||
                        user.user?.name ||
                        'Unnamed user'}{' '}
                      <span className="text-muted-foreground text-xs font-normal">
                        ({user.teacher?.emp_no})
                      </span>
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[
                        user.teacher?.position || user.employee?.position,
                        user.user?.email ||
                          user.teacher?.email ||
                          user.employee?.email,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'No contact info'}
                    </p>
                    {user.role ? (
                      <span className="bg-muted text-muted-foreground mt-1 inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium">
                        {user.role}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
