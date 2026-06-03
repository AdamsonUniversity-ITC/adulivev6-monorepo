import { isStudentOnlyDrsPortalUser } from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import * as React from 'react';

import { ApplicationMessagesPanel } from './-application-messages-panel.tsx';
import { LoadingIndicator } from './-loading-indicator.tsx';
import { fetchEmployeeApplication } from './-lib/api/fetchEmployeeApplication.ts';
import {
  type CompleteApplicationTaskPayload,
  postCompleteApplicationTask,
} from './-lib/api/postCompleteApplicationTask.ts';
import {
  type DRSActiveStageTask,
  displayApplicationRef,
} from './-lib/types/applications.ts';

export const Route = createFileRoute('/staff/applications/$applicationId')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    if (
      typeof window !== 'undefined' &&
      isStudentOnlyDrsPortalUser(permissions, window.location.hostname)
    ) {
      throw redirect({ to: '/' });
    }
  },
  component: StaffApplicationWorkPage,
});

function StaffApplicationWorkPage() {
  const { applicationId } = Route.useParams();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['drs-employee-application', applicationId],
    queryFn: () => fetchEmployeeApplication(applicationId),
  });

  const [remarkByTask, setRemarkByTask] = React.useState<
    Record<string, string>
  >({});

  React.useEffect(() => {
    if (!query.data?.active_stage_tasks) return;
    setRemarkByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (next[t.id] === undefined) next[t.id] = '';
      }
      return next;
    });
  }, [query.data]);

  const completeMutation = useMutation({
    mutationFn: async (vars: {
      taskId: string;
      payload: CompleteApplicationTaskPayload;
    }) => postCompleteApplicationTask(applicationId, vars.taskId, vars.payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['drs-employee-application', applicationId],
        updated,
      );
      void queryClient.invalidateQueries({ queryKey: ['drs-employee-queue'] });
      toast.success('Task completed.');
    },
    onError: () => {
      toast.error('Could not complete task.');
    },
  });

  const app = query.data;

  const pendingActionable: DRSActiveStageTask[] =
    app?.active_stage_tasks?.filter(
      (t) =>
        Boolean(t.may_complete) &&
        (t.status === 'pending' || t.status === 'in_progress'),
    ) ?? [];

  const clearanceOnlyMode =
    pendingActionable.length > 0 &&
    pendingActionable.every((t) => t.kind === 'clearance_signoff');

  if (query.isLoading) {
    return (
      <div className="bg-background min-h-screen p-4">
        <LoadingIndicator label="Loading request…" variant="block" size="md" />
      </div>
    );
  }

  if (query.isError || !app) {
    return (
      <div className="bg-background min-h-screen space-y-3 p-4">
        <p className="text-destructive text-sm">
          Could not load this application or you don’t have access.
        </p>
        <Button variant="outline" asChild size="sm">
          <Link to="/staff/queue">Back to queue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit gap-1 px-2"
          asChild
        >
          <Link to="/staff/queue">
            <ArrowLeft className="h-4 w-4" />
            Staff queue
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Request #{displayApplicationRef(app)}</CardTitle>
                <CardDescription>
                  {app.student_no
                    ? `Student no. ${app.student_no}`
                    : 'Staff view'}{' '}
                  · {app.student_name?.trim() ? app.student_name : null}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="font-normal">
                  {app.current_stage?.name ?? app.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground text-xs font-medium">
              Requested documents
            </p>
            <ul className="space-y-1 rounded-md border p-3">
              {app.lines?.length ? (
                app.lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate">
                      {l.request_name}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      × {l.quantity}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">No line items</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {clearanceOnlyMode ? 'Clearance' : 'Stage tasks'}
            </CardTitle>
            <CardDescription>
              {clearanceOnlyMode
                ? 'Confirm each clearance your department is responsible for.'
                : 'Complete the tasks available to you for this stage.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingActionable.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No pending actions for you on this request.
              </p>
            ) : (
              pendingActionable.map((task) => (
                <div key={task.id} className="space-y-3 rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{task.name ?? 'Task'}</p>
                   
                  </div>
                  {task.kind === 'clearance_signoff' ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`remarks-${task.id}`}>Remarks</Label>
                        <Textarea
                          id={`remarks-${task.id}`}
                          value={remarkByTask[task.id] ?? ''}
                          onChange={(e) =>
                            setRemarkByTask((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          placeholder="Optional remarks visible to the student"
                          className="min-h-[72px]"
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={completeMutation.isPending}
                        onClick={() =>
                          completeMutation.mutate({
                            taskId: task.id,
                            payload: {
                              remarks:
                                remarkByTask[task.id]?.trim() || null,
                            },
                          })
                        }
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`remarks-${task.id}`}>Remarks</Label>
                        <Textarea
                          id={`remarks-${task.id}`}
                          value={remarkByTask[task.id] ?? ''}
                          onChange={(e) =>
                            setRemarkByTask((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          placeholder="Optional remarks"
                          className="min-h-[72px]"
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={completeMutation.isPending}
                        onClick={() =>
                          completeMutation.mutate({
                            taskId: task.id,
                            payload: {
                              remarks: remarkByTask[task.id]?.trim() || null,
                            },
                          })
                        }
                      >
                        Complete
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Messages</CardTitle>
            <CardDescription>
              Chat with the student and other staff working on this request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationMessagesPanel
              applicationId={applicationId}
              viewerRole="staff"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
