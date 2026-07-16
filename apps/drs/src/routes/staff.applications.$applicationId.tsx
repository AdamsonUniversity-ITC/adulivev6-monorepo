import {
  DrsEmptyState,
  DrsErrorState,
  DrsLoadingState,
  DrsNotFoundState,
  DrsPageHeader,
  DrsPageShell,
  DrsStatusBadge,
  toneForStatus,
} from '@/components/drs-ui.tsx';
import { isNotFoundError } from '@/lib/isNotFoundError.ts';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Textarea } from '@repo/ui/components/textarea';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { ClipboardCheck, History, Plus, Trash2, XCircle } from 'lucide-react';
import * as React from 'react';

import { ApplicationMessagesPanel } from './-application-messages-panel.tsx';
import { fetchEmployeeApplication } from './-lib/api/fetchEmployeeApplication.ts';
import {
  type CompleteApplicationTaskPayload,
  postCompleteApplicationTask,
} from './-lib/api/postCompleteApplicationTask.ts';
import { postEmployeeCancelApplication } from './-lib/api/postEmployeeCancelApplication.ts';
import { putSaveApplicationTaskRemarks } from './-lib/api/putSaveApplicationTaskRemarks.ts';
import { assertStaffPortalAccess } from './-lib/assertStaffPortalAccess.ts';
import {
  type DRSActiveStageTask,
  type DRSApplicationDetail,
  displayApplicationRef,
} from './-lib/types/applications.ts';
import { ConfirmActionDialog } from './maintenance/-clearance/-confirm-action-dialog.tsx';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

type OtherFeeDraft = {
  id: string;
  fee_name: string;
  amount: string;
};

function parseMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function createOtherFeeDraft(): OtherFeeDraft {
  return {
    id: `fee-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fee_name: '',
    amount: '',
  };
}

function BranchTransitionSelect({
  task,
  value,
  onChange,
}: {
  task: DRSActiveStageTask;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = task.branch_options ?? [];
  if (options.length === 0) return null;

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label>Next step</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select where this application goes next" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label} - {option.target_stage?.name ?? 'Target stage'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">
        This stage has branching enabled. Choose the next workflow step before
        completing the task.
      </p>
    </div>
  );
}

function PaymentVerificationTaskPanel({
  task,
  app,
  remarkByTask,
  setRemarkByTask,
  referenceByTask,
  setReferenceByTask,
  saveRemarksMutation,
  completeMutation,
}: {
  task: DRSActiveStageTask;
  app: DRSApplicationDetail;
  remarkByTask: Record<string, string>;
  setRemarkByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  referenceByTask: Record<string, string>;
  setReferenceByTask: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  saveRemarksMutation: {
    isPending: boolean;
    mutate: (vars: {
      taskId: string;
      remarks: string | null;
      kind?: string | null;
    }) => void;
  };
  completeMutation: {
    isPending: boolean;
    mutate: (vars: {
      taskId: string;
      payload: CompleteApplicationTaskPayload;
    }) => void;
  };
}) {
  const requireReference = task.config?.require_reference_number !== false;
  const submission = app.payment_submission;
  const verification = app.payment_verification;
  const total =
    typeof app.payment_total === 'number' ? app.payment_total : null;

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 space-y-2 rounded-md border p-3 text-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Student payment
        </p>
        {submission ? (
          <dl className="grid gap-1">
            {submission.reference_number ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">
                  Payment collection reference no.
                </dt>
                <dd className="font-medium">{submission.reference_number}</dd>
              </div>
            ) : null}
            {submission.bank_name ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="text-right">
                  {submission.bank_name}
                  {submission.account_number
                    ? ` · ${submission.account_number}`
                    : ''}
                </dd>
              </div>
            ) : null}
            {submission.remarks ? (
              <div>
                <dt className="text-muted-foreground">Student remarks</dt>
                <dd className="mt-0.5">{submission.remarks}</dd>
              </div>
            ) : null}
            {!submission.reference_number &&
            !submission.bank_name &&
            !submission.remarks ? (
              <p className="text-muted-foreground">
                No payment details recorded.
              </p>
            ) : null}
          </dl>
        ) : (
          <p className="text-muted-foreground">No payment proof on file yet.</p>
        )}
        {total !== null ? (
          <p className="border-t pt-2 font-medium">
            Amount due: {formatMoney(total)}
          </p>
        ) : null}
        {verification?.reference_number ? (
          <p className="border-t pt-2 text-xs">
            Previous verifier reference no.:{' '}
            <span className="font-medium">{verification.reference_number}</span>
          </p>
        ) : null}
      </div>

      {app.lines?.some((l) => l.assessed_unit_price != null) ? (
        <ul className="text-muted-foreground space-y-1 text-xs">
          {app.lines.map((line) =>
            line.assessed_unit_price != null ? (
              <li key={line.id} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">{line.request_name}</span>
                <span className="shrink-0">
                  {formatMoney(line.assessed_unit_price * line.quantity)}
                </span>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}

      {requireReference ? (
        <div className="space-y-2">
          <Label htmlFor={`reference-${task.id}`}>
            Verifier reference number
          </Label>
          <Input
            id={`reference-${task.id}`}
            value={referenceByTask[task.id] ?? ''}
            onChange={(e) =>
              setReferenceByTask((prev) => ({
                ...prev,
                [task.id]: e.target.value,
              }))
            }
            placeholder="Receipt or OR number"
            autoComplete="off"
          />
        </div>
      ) : null}

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
          placeholder="Optional internal remarks"
          className="min-h-[72px]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={saveRemarksMutation.isPending}
          onClick={() =>
            saveRemarksMutation.mutate({
              taskId: task.id,
              kind: task.kind,
              remarks: remarkByTask[task.id]?.trim() || null,
            })
          }
        >
          Save remarks
        </Button>
        <Button
          type="button"
          disabled={completeMutation.isPending}
          onClick={() => {
            const reference = referenceByTask[task.id]?.trim() ?? '';
            if (requireReference && !reference) {
              toast.error('Enter a verifier reference number.');
              return;
            }
            completeMutation.mutate({
              taskId: task.id,
              payload: {
                reference_number: reference || null,
                remarks: remarkByTask[task.id]?.trim() || null,
              },
            });
          }}
        >
          Verify payment
        </Button>
      </div>
    </div>
  );
}

function PaymentCollectionTaskPanel({
  task,
  app,
  remarkByTask,
  setRemarkByTask,
  referenceByTask,
  setReferenceByTask,
  saveRemarksMutation,
  completeMutation,
}: {
  task: DRSActiveStageTask;
  app: DRSApplicationDetail;
  remarkByTask: Record<string, string>;
  setRemarkByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  referenceByTask: Record<string, string>;
  setReferenceByTask: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  saveRemarksMutation: {
    isPending: boolean;
    mutate: (vars: {
      taskId: string;
      remarks: string | null;
      kind?: string | null;
    }) => void;
  };
  completeMutation: {
    isPending: boolean;
    mutate: (vars: {
      taskId: string;
      payload: CompleteApplicationTaskPayload;
    }) => void;
  };
}) {
  const total =
    typeof app.payment_total === 'number' ? app.payment_total : null;
  const verification = app.payment_verification;

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 space-y-2 rounded-md border p-3 text-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Payment
        </p>
        {total !== null ? (
          <p className="font-medium">Amount due: {formatMoney(total)}</p>
        ) : (
          <p className="text-muted-foreground">No assessed amount available.</p>
        )}
        {verification?.reference_number ? (
          <p className="border-t pt-2 text-xs">
            Verifier reference no.:{' '}
            <span className="font-medium">{verification.reference_number}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`reference-${task.id}`}>Reference number</Label>
        <Input
          id={`reference-${task.id}`}
          value={referenceByTask[task.id] ?? ''}
          onChange={(event) =>
            setReferenceByTask((prev) => ({
              ...prev,
              [task.id]: event.target.value,
            }))
          }
          placeholder="Payment reference number"
          autoComplete="off"
        />
      </div>

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
          placeholder="Optional payment remarks"
          className="min-h-[72px]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={saveRemarksMutation.isPending}
          onClick={() =>
            saveRemarksMutation.mutate({
              taskId: task.id,
              kind: task.kind,
              remarks: remarkByTask[task.id]?.trim() || null,
            })
          }
        >
          Save remarks
        </Button>
        <Button
          type="button"
          disabled={completeMutation.isPending}
          onClick={() => {
            const reference = referenceByTask[task.id]?.trim() ?? '';
            if (!reference) {
              toast.error('Enter a payment reference number.');
              return;
            }

            completeMutation.mutate({
              taskId: task.id,
              payload: {
                reference_number: reference,
                remarks: remarkByTask[task.id]?.trim() || null,
              },
            });
          }}
        >
          Complete payment
        </Button>
      </div>
    </div>
  );
}

function AssessmentTaskPanel({
  task,
  app,
  remarkByTask,
  setRemarkByTask,
  linePriceByTask,
  setLinePriceByTask,
  otherFeesByTask,
  setOtherFeesByTask,
  saveRemarksMutation,
  completeMutation,
}: {
  task: DRSActiveStageTask;
  app: DRSApplicationDetail;
  remarkByTask: Record<string, string>;
  setRemarkByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  linePriceByTask: Record<string, Record<string, string>>;
  setLinePriceByTask: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, string>>>
  >;
  otherFeesByTask: Record<string, OtherFeeDraft[]>;
  setOtherFeesByTask: React.Dispatch<
    React.SetStateAction<Record<string, OtherFeeDraft[]>>
  >;
  saveRemarksMutation: {
    isPending: boolean;
    mutate: (vars: {
      taskId: string;
      remarks: string | null;
      kind?: string | null;
    }) => void;
  };
  completeMutation: {
    isPending: boolean;
    mutate: (vars: {
      taskId: string;
      payload: CompleteApplicationTaskPayload;
    }) => void;
  };
}) {
  const linePrices = linePriceByTask[task.id] ?? {};
  const otherFees = otherFeesByTask[task.id] ?? [];

  const lineTotal =
    app.lines?.reduce((sum, line) => {
      const amount = parseMoneyInput(linePrices[line.id] ?? '');
      return sum + (amount ?? 0) * line.quantity;
    }, 0) ?? 0;
  const otherFeesTotal = otherFees.reduce(
    (sum, fee) => sum + (parseMoneyInput(fee.amount) ?? 0),
    0,
  );

  const updateOtherFee = (
    feeId: string,
    patch: Partial<Pick<OtherFeeDraft, 'fee_name' | 'amount'>>,
  ) => {
    setOtherFeesByTask((prev) => ({
      ...prev,
      [task.id]: (prev[task.id] ?? []).map((fee) =>
        fee.id === feeId ? { ...fee, ...patch } : fee,
      ),
    }));
  };

  const completeAssessment = () => {
    const line_prices =
      app.lines?.map((line) => {
        const amount = parseMoneyInput(linePrices[line.id] ?? '');
        if (amount === null) {
          throw new Error(`Enter a valid amount for ${line.request_name}.`);
        }

        return {
          application_document_id: line.id,
          amount,
        };
      }) ?? [];

    const other_fees = otherFees
      .map((fee) => ({
        fee_name: fee.fee_name.trim(),
        amount: parseMoneyInput(fee.amount),
      }))
      .filter((fee) => fee.fee_name !== '' || fee.amount !== null);

    const invalidFee = other_fees.find(
      (fee) => fee.fee_name === '' || fee.amount === null,
    );
    if (invalidFee) {
      throw new Error(
        'Enter a fee name and valid amount for each other payment.',
      );
    }
    const normalizedOtherFees = other_fees.map((fee) => ({
      fee_name: fee.fee_name,
      amount: fee.amount ?? 0,
    }));

    completeMutation.mutate({
      taskId: task.id,
      payload: {
        remarks: remarkByTask[task.id]?.trim() || null,
        line_prices,
        extra: {
          other_fees: normalizedOtherFees,
        },
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Requested documents
        </p>
        <div className="space-y-2 rounded-md border p-3">
          {app.lines?.length ? (
            app.lines.map((line) => {
              const amount = parseMoneyInput(linePrices[line.id] ?? '');
              return (
                <div
                  key={line.id}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {line.request_name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Quantity: {line.quantity}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`line-price-${task.id}-${line.id}`}>
                      Unit price
                    </Label>
                    <Input
                      id={`line-price-${task.id}-${line.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={linePrices[line.id] ?? ''}
                      onChange={(event) =>
                        setLinePriceByTask((prev) => ({
                          ...prev,
                          [task.id]: {
                            ...(prev[task.id] ?? {}),
                            [line.id]: event.target.value,
                          },
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="text-muted-foreground flex items-end text-sm">
                    {formatMoney((amount ?? 0) * line.quantity)}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-sm">
              No requested documents.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Other payments
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() =>
              setOtherFeesByTask((prev) => ({
                ...prev,
                [task.id]: [...(prev[task.id] ?? []), createOtherFeeDraft()],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            Add other payment
          </Button>
        </div>
        {otherFees.length > 0 ? (
          <div className="space-y-2 rounded-md border p-3">
            {otherFees.map((fee) => (
              <div
                key={fee.id}
                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto]"
              >
                <Input
                  value={fee.fee_name}
                  onChange={(event) =>
                    updateOtherFee(fee.id, { fee_name: event.target.value })
                  }
                  placeholder="Fee name"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fee.amount}
                  onChange={(event) =>
                    updateOtherFee(fee.id, { amount: event.target.value })
                  }
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setOtherFeesByTask((prev) => ({
                      ...prev,
                      [task.id]: (prev[task.id] ?? []).filter(
                        (row) => row.id !== fee.id,
                      ),
                    }))
                  }
                  aria-label="Remove other payment"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No other payments added.
          </p>
        )}
      </div>

      <div className="bg-muted/40 rounded-md border p-3 text-sm">
        <div className="flex justify-between gap-2">
          <span>Documents total</span>
          <span>{formatMoney(lineTotal)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Other payments</span>
          <span>{formatMoney(otherFeesTotal)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-2 border-t pt-2 font-medium">
          <span>Assessment total</span>
          <span>{formatMoney(lineTotal + otherFeesTotal)}</span>
        </div>
      </div>

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
          placeholder="Optional assessment remarks"
          className="min-h-[72px]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={saveRemarksMutation.isPending}
          onClick={() =>
            saveRemarksMutation.mutate({
              taskId: task.id,
              kind: task.kind,
              remarks: remarkByTask[task.id]?.trim() || null,
            })
          }
        >
          Save remarks
        </Button>
        <Button
          type="button"
          disabled={completeMutation.isPending}
          onClick={() => {
            try {
              completeAssessment();
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Could not complete assessment.',
              );
            }
          }}
        >
          Complete assessment
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/staff/applications/$applicationId')({
  beforeLoad: assertStaffPortalAccess,
  component: StaffApplicationWorkPage,
});

function StaffApplicationWorkPage() {
  const { applicationId } = Route.useParams();
  const queryClient = useQueryClient();
  const isHistoryRoute = useRouterState({
    select: (state) =>
      state.location.pathname.endsWith(
        `/staff/applications/${applicationId}/history`,
      ),
  });

  const query = useQuery({
    queryKey: ['drs-employee-application', applicationId],
    queryFn: () => fetchEmployeeApplication(applicationId),
  });

  const [remarkByTask, setRemarkByTask] = React.useState<
    Record<string, string>
  >({});
  const [referenceByTask, setReferenceByTask] = React.useState<
    Record<string, string>
  >({});
  const [trackingNumberByTask, setTrackingNumberByTask] = React.useState<
    Record<string, string>
  >({});
  const [linePriceByTask, setLinePriceByTask] = React.useState<
    Record<string, Record<string, string>>
  >({});
  const [otherFeesByTask, setOtherFeesByTask] = React.useState<
    Record<string, OtherFeeDraft[]>
  >({});
  const [transitionByTask, setTransitionByTask] = React.useState<
    Record<string, string>
  >({});
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!query.data?.active_stage_tasks) return;
    setRemarkByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (next[t.id] === undefined) next[t.id] = t.remarks ?? '';
      }
      return next;
    });
    setReferenceByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (next[t.id] === undefined) next[t.id] = '';
      }
      return next;
    });
    setTrackingNumberByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (next[t.id] === undefined) next[t.id] = '';
      }
      return next;
    });
    setLinePriceByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (t.kind !== 'assessment' || next[t.id] !== undefined) continue;
        next[t.id] = Object.fromEntries(
          (query.data.lines ?? []).map((line) => [
            line.id,
            line.assessed_unit_price != null
              ? String(line.assessed_unit_price)
              : '',
          ]),
        );
      }
      return next;
    });
    setOtherFeesByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (t.kind !== 'assessment' || next[t.id] !== undefined) continue;
        next[t.id] = (query.data.assessment_other_fees ?? []).map((fee) => ({
          id: createOtherFeeDraft().id,
          fee_name: fee.fee_name,
          amount: String(fee.amount),
        }));
      }
      return next;
    });
    setTransitionByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (next[t.id] !== undefined) continue;
        const defaultOption =
          t.branch_options?.find((option) => option.is_default) ??
          (t.branch_options?.length === 1 ? t.branch_options[0] : undefined);
        if (defaultOption) next[t.id] = defaultOption.id;
      }
      return next;
    });
  }, [query.data]);

  const completeMutation = useMutation({
    mutationFn: async (vars: {
      taskId: string;
      payload: CompleteApplicationTaskPayload;
    }) => {
      const task = query.data?.active_stage_tasks?.find(
        (item) => item.id === vars.taskId,
      );
      const branchOptions = task?.branch_options ?? [];
      const selectedTransitionId = transitionByTask[vars.taskId];
      if (branchOptions.length > 0 && !selectedTransitionId) {
        throw new Error('Select the next workflow step.');
      }
      const selectedTransition = branchOptions.find(
        (option) => option.id === selectedTransitionId,
      );
      const trackingNumber = trackingNumberByTask[vars.taskId]?.trim() ?? '';
      if (
        selectedTransition?.outcome_key === 'delivery_dispatch' &&
        !trackingNumber
      ) {
        throw new Error('Enter a delivery number before dispatching.');
      }

      return postCompleteApplicationTask(applicationId, vars.taskId, {
        ...vars.payload,
        transition_id: selectedTransitionId ?? vars.payload.transition_id,
        tracking_number:
          selectedTransition?.outcome_key === 'delivery_dispatch'
            ? trackingNumber
            : vars.payload.tracking_number,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['drs-employee-application', applicationId],
        updated,
      );
      void queryClient.invalidateQueries({ queryKey: ['drs-employee-queue'] });
      toast.success('Task completed.');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Could not complete task.',
      );
    },
  });

  const saveRemarksMutation = useMutation({
    mutationFn: async (vars: {
      taskId: string;
      remarks: string | null;
      kind?: string | null;
    }) =>
      putSaveApplicationTaskRemarks(
        applicationId,
        vars.taskId,
        vars.remarks,
        vars.kind,
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['drs-employee-application', applicationId],
        updated,
      );
      void queryClient.invalidateQueries({ queryKey: ['drs-employee-queue'] });
      toast.success('Remarks saved.');
    },
    onError: () => {
      toast.error('Could not save remarks.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => postEmployeeCancelApplication(applicationId),
    onSuccess: (updated: DRSApplicationDetail) => {
      queryClient.setQueryData(
        ['drs-employee-application', applicationId],
        updated,
      );
      void queryClient.invalidateQueries({ queryKey: ['drs-employee-queue'] });
      setCancelDialogOpen(false);
      toast.success('Application cancelled.');
    },
    onError: () => {
      toast.error('Failed to cancel application.');
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

  if (isHistoryRoute) {
    return <Outlet />;
  }

  if (query.isLoading) {
    return (
      <DrsPageShell maxWidth="lg">
        <DrsLoadingState label="Loading request…" />
      </DrsPageShell>
    );
  }

  if (isNotFoundError(query.error)) {
    return (
      <DrsPageShell maxWidth="md">
        <DrsNotFoundState
          title="Request not found"
          description="This application ID may be incorrect, or the request may have been removed."
          action={
            <Button
              variant="outline"
              asChild
              size="sm"
              className="rounded-full"
            >
              <Link to="/staff/queue">Back to queue</Link>
            </Button>
          }
        />
      </DrsPageShell>
    );
  }

  if (query.isError || !app) {
    return (
      <DrsPageShell maxWidth="md">
        <DrsErrorState
          title="Could not load this application"
          description="The application may be unavailable, or you may no longer have access to this workflow task."
          action={
            <Button
              variant="outline"
              asChild
              size="sm"
              className="rounded-full"
            >
              <Link to="/staff/queue">Back to queue</Link>
            </Button>
          }
        />
      </DrsPageShell>
    );
  }

  return (
    <DrsPageShell maxWidth="lg" contentClassName="space-y-5">
      <DrsPageHeader
        backTo="/staff/queue"
        backLabel="Staff queue"
        eyebrow="Staff workbench"
        title={`Request #${displayApplicationRef(app)}`}
        description={
          <>
            {app.student_no ? `Student no. ${app.student_no}` : 'Staff view'}
            {app.student_name?.trim() ? ` · ${app.student_name}` : ''}
          </>
        }
        badges={
          <>
            <DrsStatusBadge tone={toneForStatus(app.status)}>
              {app.current_stage?.name ?? app.status}
            </DrsStatusBadge>
            <DrsStatusBadge
              tone={pendingActionable.length > 0 ? 'warning' : 'success'}
            >
              {pendingActionable.length > 0
                ? `${pendingActionable.length} action${pendingActionable.length === 1 ? '' : 's'} pending`
                : 'No pending actions'}
            </DrsStatusBadge>
            {app.is_foreigner_student ? (
              <DrsStatusBadge tone="purple">Foreigner student</DrsStatusBadge>
            ) : null}
            {app.is_cancelled ? (
              <DrsStatusBadge tone="danger">Cancelled</DrsStatusBadge>
            ) : null}
          </>
        }
        actions={
          <>
            {app.may_cancel_as_staff && !app.is_cancelled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive gap-1 rounded-full"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancel application
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 rounded-full"
              asChild
            >
              <Link
                to="/staff/applications/$applicationId/history"
                params={{ applicationId }}
              >
                <History className="h-4 w-4" />
                Rollback
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-5">
          <Card className="drs-card">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Requested documents</CardTitle>
                  <CardDescription>
                    Request #{displayApplicationRef(app)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-1">
                  <DrsStatusBadge tone={toneForStatus(app.status)}>
                    {app.current_stage?.name ?? app.status}
                  </DrsStatusBadge>
                  {app.is_foreigner_student ? (
                    <DrsStatusBadge tone="purple">
                      Foreigner student
                    </DrsStatusBadge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="bg-muted/20 space-y-2 rounded-2xl border p-3">
                {app.lines?.length ? (
                  app.lines.map((l) => (
                    <li
                      key={l.id}
                      className="bg-background/80 flex justify-between gap-3 rounded-xl px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {l.request_name}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        x {l.quantity}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No line items</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {app.payment_submission || app.payment_verification ? (
            <Card className="drs-card">
              <CardHeader>
                <CardTitle className="text-base">Payment references</CardTitle>
                <CardDescription>
                  Payment collection and verification details recorded for this
                  request.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {app.payment_submission ? (
                  <div className="bg-muted/20 rounded-2xl border p-3">
                    <p className="text-muted-foreground text-xs font-medium">
                      Payment collection reference no.
                    </p>
                    <p className="mt-1 font-medium">
                      {app.payment_submission.reference_number ?? '—'}
                    </p>
                    {app.payment_submission.remarks ? (
                      <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                        {app.payment_submission.remarks}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {app.payment_verification ? (
                  <div className="bg-muted/20 rounded-2xl border p-3">
                    <p className="text-muted-foreground text-xs font-medium">
                      Payment verification reference no.
                    </p>
                    <p className="mt-1 font-medium">
                      {app.payment_verification.reference_number ?? '—'}
                    </p>
                    {app.payment_verification.verified_at ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Verified{' '}
                        {new Date(
                          app.payment_verification.verified_at,
                        ).toLocaleString()}
                      </p>
                    ) : null}
                    {app.payment_verification.remarks ? (
                      <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                        {app.payment_verification.remarks}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="drs-card">
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
                <DrsEmptyState
                  icon={ClipboardCheck}
                  title="No pending actions"
                  description="There are no tasks available for your account on this request right now."
                  className="py-8"
                />
              ) : (
                pendingActionable.map((task) => (
                  <div
                    key={task.id}
                    className="bg-muted/20 space-y-3 rounded-2xl border p-4"
                  >
                    <div>
                      <p className="font-medium">{task.name ?? 'Task'}</p>
                    </div>
                    <BranchTransitionSelect
                      task={task}
                      value={transitionByTask[task.id] ?? ''}
                      onChange={(value) =>
                        setTransitionByTask((prev) => ({
                          ...prev,
                          [task.id]: value,
                        }))
                      }
                    />
                    {task.branch_options?.find(
                      (option) => option.id === transitionByTask[task.id],
                    )?.outcome_key === 'delivery_dispatch' ? (
                      <div className="bg-background/80 space-y-2 rounded-2xl border p-3">
                        <Label htmlFor={`tracking-${task.id}`}>
                          Delivery number
                        </Label>
                        <Input
                          id={`tracking-${task.id}`}
                          value={trackingNumberByTask[task.id] ?? ''}
                          onChange={(event) =>
                            setTrackingNumberByTask((prev) => ({
                              ...prev,
                              [task.id]: event.target.value,
                            }))
                          }
                          placeholder="Courier or delivery tracking number"
                          autoComplete="off"
                        />
                        <p className="text-muted-foreground text-xs">
                          Required when dispatching the application for
                          delivery.
                        </p>
                      </div>
                    ) : null}
                    {task.kind === 'payment_verification' ? (
                      <PaymentVerificationTaskPanel
                        task={task}
                        app={app}
                        remarkByTask={remarkByTask}
                        setRemarkByTask={setRemarkByTask}
                        referenceByTask={referenceByTask}
                        setReferenceByTask={setReferenceByTask}
                        saveRemarksMutation={saveRemarksMutation}
                        completeMutation={completeMutation}
                      />
                    ) : task.kind === 'payment_collection' ? (
                      <PaymentCollectionTaskPanel
                        task={task}
                        app={app}
                        remarkByTask={remarkByTask}
                        setRemarkByTask={setRemarkByTask}
                        referenceByTask={referenceByTask}
                        setReferenceByTask={setReferenceByTask}
                        saveRemarksMutation={saveRemarksMutation}
                        completeMutation={completeMutation}
                      />
                    ) : task.kind === 'assessment' ? (
                      <AssessmentTaskPanel
                        task={task}
                        app={app}
                        remarkByTask={remarkByTask}
                        setRemarkByTask={setRemarkByTask}
                        linePriceByTask={linePriceByTask}
                        setLinePriceByTask={setLinePriceByTask}
                        otherFeesByTask={otherFeesByTask}
                        setOtherFeesByTask={setOtherFeesByTask}
                        saveRemarksMutation={saveRemarksMutation}
                        completeMutation={completeMutation}
                      />
                    ) : task.kind === 'clearance_signoff' ? (
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
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={saveRemarksMutation.isPending}
                            onClick={() =>
                              saveRemarksMutation.mutate({
                                taskId: task.id,
                                kind: task.kind,
                                remarks: remarkByTask[task.id]?.trim() || null,
                              })
                            }
                          >
                            Save remarks
                          </Button>
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
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={saveRemarksMutation.isPending}
                            onClick={() =>
                              saveRemarksMutation.mutate({
                                taskId: task.id,
                                kind: task.kind,
                                remarks: remarkByTask[task.id]?.trim() || null,
                              })
                            }
                          >
                            Save remarks
                          </Button>
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
                            Complete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card className="drs-card">
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
        </aside>
      </div>
      <ConfirmActionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel this application?"
        description="This will cancel the student's document request and close any open workflow tasks."
        confirmLabel="Cancel application"
        pending={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />
    </DrsPageShell>
  );
}
