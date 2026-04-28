import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { toast } from '@repo/ui/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserMinus, Users } from 'lucide-react';
import { useState } from 'react';
import { detachClearanceDepartmentUser } from '../-lib/api/detachClearanceDepartmentUser.ts';
import { AddUserDialog } from './-add-user-dialog.tsx';
import { ConfirmActionDialog } from './-confirm-action-dialog.tsx';
import {
  type Department,
  type DepartmentUser,
  formatCreatedAt,
  getDepartmentName,
  getDepartmentUsers,
} from './-utils.ts';

type Props = {
  department: Department;
};

export const DepartmentDetail = ({ department }: Props) => {
  const queryClient = useQueryClient();
  const [pendingDetach, setPendingDetach] = useState<DepartmentUser | null>(
    null,
  );

  const detachMutation = useMutation({
    mutationFn: (empNo: string) =>
      detachClearanceDepartmentUser(department.id, empNo),
    onSuccess: () => {
      toast.success('Employee removed from department.');
      setPendingDetach(null);
      queryClient.invalidateQueries({ queryKey: ['clearance_departments'] });
    },
    onError: () => {
      toast.error('Failed to remove employee.');
    },
  });

  const users = getDepartmentUsers(department);

  return (
    <div className="space-y-4">
      <Card className="border-border border">
        <CardHeader>
          <CardTitle className="text-base">
            {getDepartmentName(department)}
          </CardTitle>
          <CardDescription>
            {department.description || 'No description provided.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs font-medium">Created</p>
          <p className="text-sm">{formatCreatedAt(department.created_at)}</p>
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
          <AddUserDialog departmentId={department.id} />
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
                  key={user.emp_no}
                  className="bg-accent border-border flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.name || 'Unnamed employee'}{' '}
                      <span className="text-muted-foreground text-xs font-normal">
                        ({user.emp_no})
                      </span>
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[user.position, user.email].filter(Boolean).join(' · ') ||
                        'No contact info'}
                    </p>
                    {user.role ? (
                      <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
                        {user.role}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => setPendingDetach(user)}
                    disabled={detachMutation.isPending}
                    aria-label="Remove employee from department"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={pendingDetach !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDetach(null);
        }}
        title="Remove employee?"
        description={
          pendingDetach ? (
            <>
              Remove{' '}
              <span className="font-medium">
                {pendingDetach.name ||
                  pendingDetach.email ||
                  pendingDetach.emp_no}
              </span>{' '}
              from <span className="font-medium">{getDepartmentName(department)}</span>?
            </>
          ) : null
        }
        confirmLabel="Remove employee"
        pending={detachMutation.isPending}
        onConfirm={() =>
          pendingDetach && detachMutation.mutate(pendingDetach.emp_no)
        }
      />
    </div>
  );
};
