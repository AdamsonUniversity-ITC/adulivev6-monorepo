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
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteClearanceDepartment } from '../-lib/api/deleteClearanceDepartment.ts';
import { ConfirmActionDialog } from './-confirm-action-dialog.tsx';
import {
  type Department,
  formatCreatedAt,
  getDepartmentName,
  getDepartmentUsers,
} from './-utils.ts';

type Props = {
  departments: Department[];
  isLoading: boolean;
  isError: boolean;
  selectedDepartmentId: number | string | null;
  onSelect: (id: number | string) => void;
};

export const DepartmentsList = ({
  departments,
  isLoading,
  isError,
  selectedDepartmentId,
  onSelect,
}: Props) => {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteClearanceDepartment,
    onSuccess: () => {
      toast.success('Department deleted.');
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey: ['clearance_departments'] });
    },
    onError: () => {
      toast.error('Failed to delete department.');
    },
  });

  return (
    <>
      <Card className="border-border border">
        <CardHeader>
          <CardTitle className="text-base">Departments</CardTitle>
          <CardDescription>{departments.length} department(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-muted-foreground py-4 text-sm">
              Loading departments…
            </p>
          ) : isError ? (
            <p className="text-destructive py-4 text-sm">
              Failed to load departments.
            </p>
          ) : departments.length === 0 ? (
            <p className="text-muted-foreground py-4 text-sm">
              No departments yet. Create one to get started.
            </p>
          ) : (
            departments.map((department) => {
              const isSelected =
                String(selectedDepartmentId) === String(department.id);
              const userCount = getDepartmentUsers(department).length;
              return (
                <div
                  key={department.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(department.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(department.id);
                    }
                  }}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {getDepartmentName(department)}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {userCount} {userCount === 1 ? 'user' : 'users'}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Created {formatCreatedAt(department.created_at)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      aria-label="Delete department"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingDelete(department);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete department?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium">
                {getDepartmentName(pendingDelete)}
              </span>{' '}
              and its user assignments will be removed. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete department"
        pending={deleteMutation.isPending}
        onConfirm={() =>
          pendingDelete && deleteMutation.mutate(pendingDelete.id)
        }
      />
    </>
  );
};
