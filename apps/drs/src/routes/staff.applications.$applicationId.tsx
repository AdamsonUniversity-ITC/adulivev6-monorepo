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
import { hasDrAdminAccessForHost } from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
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

import { handlePrivateFileDownloadClick } from '@/lib/downloadPrivateFile.ts';
import { formatFileSize } from '@/lib/tempUploads.ts';
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
  type DRSApplicationSupportingFile,
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

function formatStageTat(
  startedAt: string | null | undefined,
  completedAt: string | null | undefined,
): string {
  if (!startedAt) return '—';
  const startMs = new Date(startedAt).getTime();
  const endMs = completedAt ? new Date(completedAt).getTime() : Date.now();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return '—';
  }

  const totalSeconds = Math.floor((endMs - startMs) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function PaymentReceiptLinks({
  receipts,
}: {
  receipts: DRSApplicationSupportingFile[];
}) {
  if (receipts.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">No receipt uploaded yet.</p>
    );
  }

  return (
    <ul className="space-y-1">
      {receipts.map((file) => (
        <li key={file.id} className="flex flex-wrap items-baseline gap-2">
          <a
            href={file.url}
            className="text-primary inline-flex max-w-full min-w-0 items-center gap-2 underline-offset-2 hover:underline"
            onClick={(event) =>
              handlePrivateFileDownloadClick(
                event,
                file.url,
                file.file_name,
                file.expires_at,
                () => {
                  toast.error(
                    'Failed to download receipt. Please refresh and try again.',
                  );
                },
              )
            }
          >
            <span className="min-w-0 wrap-anywhere">{file.file_name}</span>
          </a>
          <span className="text-muted-foreground text-xs">
            {formatFileSize(file.size)}
            {file.created_at
              ? ` · ${new Date(file.created_at).toLocaleString()}`
              : ''}
          </span>
        </li>
      ))}
    </ul>
  );
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
  saveRemarksMutation,
  completeMutation,
}: {
  task: DRSActiveStageTask;
  app: DRSApplicationDetail;
  remarkByTask: Record<string, string>;
  setRemarkByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
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
  const submission = app.payment_submission;
  const verification = app.payment_verification;
  const total =
    typeof app.payment_total === 'number' ? app.payment_total : null;
  const receipts = submission?.receipts ?? [];

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 space-y-2 rounded-md border p-3 text-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Student payment proof
        </p>
        {submission ? (
          <div className="space-y-2">
            {submission.submitted_at ? (
              <p className="text-muted-foreground text-xs">
                Uploaded {new Date(submission.submitted_at).toLocaleString()}
              </p>
            ) : null}
            <PaymentReceiptLinks receipts={receipts} />
            {app.payment_method ? (
              <p>
                <span className="text-muted-foreground">Mode of payment: </span>
                {app.payment_method.name}
                {app.payment_method.description
                  ? ` — ${app.payment_method.description}`
                  : ''}
              </p>
            ) : null}
            {submission.reference_number ? (
              <p>
                <span className="text-muted-foreground">
                  Legacy reference:{' '}
                </span>
                {submission.reference_number}
              </p>
            ) : null}
            {submission.remarks ? (
              <div>
                <p className="text-muted-foreground text-xs">Student remarks</p>
                <p className="mt-0.5 whitespace-pre-wrap">
                  {submission.remarks}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground">No payment proof on file yet.</p>
        )}
        {total !== null ? (
          <p className="border-t pt-2 font-medium">
            Amount due: {formatMoney(total)}
          </p>
        ) : null}
        {verification?.verified_at ? (
          <p className="border-t pt-2 text-xs">
            Previously verified{' '}
            {new Date(verification.verified_at).toLocaleString()}
          </p>
        ) : null}
      </div>

      {app.lines?.some(
        (l) => l.assessed_unit_price != null || l.is_cancelled,
      ) ? (
        <ul className="text-muted-foreground space-y-1 text-xs">
          {app.lines.map((line) =>
            line.assessed_unit_price != null || line.is_cancelled ? (
              <li
                key={line.id}
                className={`flex justify-between gap-2 ${
                  line.is_cancelled ? 'opacity-60' : ''
                }`}
              >
                <span
                  className={`min-w-0 truncate ${
                    line.is_cancelled ? 'line-through' : ''
                  }`}
                >
                  {line.request_name}
                </span>
                <span
                  className={`shrink-0 ${line.is_cancelled ? 'line-through' : ''}`}
                >
                  {line.is_cancelled
                    ? 'Cancelled'
                    : formatMoney(
                        (line.assessed_unit_price ?? 0) * line.quantity,
                      )}
                </span>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}

      <p className="text-muted-foreground text-xs">
        Review the student receipt above, then verify. Do not upload a receipt
        here.
      </p>

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
            completeMutation.mutate({
              taskId: task.id,
              payload: {
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
  lineQuantityByTask,
  setLineQuantityByTask,
  lineCancelledByTask,
  setLineCancelledByTask,
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
  lineQuantityByTask: Record<string, Record<string, string>>;
  setLineQuantityByTask: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, string>>>
  >;
  lineCancelledByTask: Record<string, Record<string, boolean>>;
  setLineCancelledByTask: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, boolean>>>
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
  const lineQuantities = lineQuantityByTask[task.id] ?? {};
  const lineCancelled = lineCancelledByTask[task.id] ?? {};
  const otherFees = otherFeesByTask[task.id] ?? [];

  const lineTotal =
    app.lines?.reduce((sum, line) => {
      if (lineCancelled[line.id]) return sum;
      const amount = parseMoneyInput(linePrices[line.id] ?? '');
      return sum + (amount ?? 0);
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
    const line_updates =
      app.lines?.map((line) => {
        const cancelled = Boolean(lineCancelled[line.id]);
        const quantityRaw = Number.parseInt(
          lineQuantities[line.id] ?? String(line.quantity),
          10,
        );
        const quantity = Number.isFinite(quantityRaw)
          ? Math.max(1, quantityRaw)
          : line.quantity;
        const amount = parseMoneyInput(linePrices[line.id] ?? '');
        if (!cancelled && amount === null) {
          throw new Error(`Enter a valid total for ${line.request_name}.`);
        }

        return {
          application_document_id: line.id,
          quantity,
          amount: amount ?? 0,
          is_cancelled: cancelled,
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
        line_updates,
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
              const cancelled = Boolean(lineCancelled[line.id]);
              const amount = parseMoneyInput(linePrices[line.id] ?? '');
              return (
                <div
                  key={line.id}
                  className={`grid gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_auto] ${
                    cancelled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-medium ${
                        cancelled ? 'text-muted-foreground line-through' : ''
                      }`}
                    >
                      {line.request_name}
                    </p>
                    {cancelled ? (
                      <p className="text-muted-foreground text-xs">Cancelled</p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`line-qty-${task.id}-${line.id}`}>
                      Qty
                    </Label>
                    <Input
                      id={`line-qty-${task.id}-${line.id}`}
                      type="number"
                      min="1"
                      step="1"
                      disabled={cancelled}
                      value={lineQuantities[line.id] ?? String(line.quantity)}
                      onChange={(event) =>
                        setLineQuantityByTask((prev) => ({
                          ...prev,
                          [task.id]: {
                            ...(prev[task.id] ?? {}),
                            [line.id]: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`line-price-${task.id}-${line.id}`}>
                      Line total
                    </Label>
                    <Input
                      id={`line-price-${task.id}-${line.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={cancelled}
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
                  <div className="flex items-end gap-2">
                    <span
                      className={`text-muted-foreground hidden text-sm sm:inline ${
                        cancelled ? 'line-through' : ''
                      }`}
                    >
                      {formatMoney(amount ?? 0)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLineCancelledByTask((prev) => ({
                          ...prev,
                          [task.id]: {
                            ...(prev[task.id] ?? {}),
                            [line.id]: !cancelled,
                          },
                        }))
                      }
                    >
                      {cancelled ? 'Restore' : 'Cancel'}
                    </Button>
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
  loader: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);

    return {
      canRestore:
        typeof window !== 'undefined' &&
        hasDrAdminAccessForHost(permissions, window.location.hostname),
    };
  },
  component: StaffApplicationWorkPage,
});

function StaffApplicationWorkPage() {
  const { applicationId } = Route.useParams();
  const { canRestore } = Route.useLoaderData();
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
  const [pickupDateByTask, setPickupDateByTask] = React.useState<
    Record<string, string>
  >({});
  const [linePriceByTask, setLinePriceByTask] = React.useState<
    Record<string, Record<string, string>>
  >({});
  const [lineQuantityByTask, setLineQuantityByTask] = React.useState<
    Record<string, Record<string, string>>
  >({});
  const [lineCancelledByTask, setLineCancelledByTask] = React.useState<
    Record<string, Record<string, boolean>>
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
    setPickupDateByTask((prev) => {
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
              ? String(
                  Math.round(line.assessed_unit_price * line.quantity * 100) /
                    100,
                )
              : '',
          ]),
        );
      }
      return next;
    });
    setLineQuantityByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (t.kind !== 'assessment' || next[t.id] !== undefined) continue;
        next[t.id] = Object.fromEntries(
          (query.data.lines ?? []).map((line) => [
            line.id,
            String(line.quantity),
          ]),
        );
      }
      return next;
    });
    setLineCancelledByTask((prev) => {
      const next = { ...prev };
      for (const t of query.data.active_stage_tasks ?? []) {
        if (t.kind !== 'assessment' || next[t.id] !== undefined) continue;
        next[t.id] = Object.fromEntries(
          (query.data.lines ?? []).map((line) => [
            line.id,
            Boolean(line.is_cancelled),
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
      const pickupDate = pickupDateByTask[vars.taskId]?.trim() ?? '';
      if (selectedTransition?.outcome_key === 'pickup_handoff' && !pickupDate) {
        throw new Error('Enter a pickup date before releasing for pickup.');
      }

      return postCompleteApplicationTask(applicationId, vars.taskId, {
        ...vars.payload,
        transition_id: selectedTransitionId ?? vars.payload.transition_id,
        tracking_number:
          selectedTransition?.outcome_key === 'delivery_dispatch'
            ? trackingNumber
            : vars.payload.tracking_number,
        pickup_date:
          selectedTransition?.outcome_key === 'pickup_handoff'
            ? pickupDate
            : vars.payload.pickup_date,
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
    <DrsPageShell maxWidth="lg" contentClassName="space-y-3">
      <DrsPageHeader
        backTo="/staff/queue"
        backLabel="Staff queue"
        eyebrow="Staff workbench"
        title={`#${displayApplicationRef(app)}`}
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
            {canRestore ? (
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
                  <History className="h-4 w-4" aria-hidden="true" />
                  Rollback
                </Link>
              </Button>
            ) : null}
            {app.may_cancel_as_staff && !app.is_cancelled ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancel
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-3">
          <Card className="drs-card">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    Requested documents
                  </CardTitle>
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
                      <span
                        className={`min-w-0 flex-1 truncate ${
                          l.is_cancelled
                            ? 'text-muted-foreground line-through'
                            : ''
                        }`}
                      >
                        {l.request_name}
                      </span>
                      <span
                        className={`text-muted-foreground shrink-0 ${
                          l.is_cancelled ? 'line-through' : ''
                        }`}
                      >
                        {l.is_cancelled ? 'Cancelled' : `x ${l.quantity}`}
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
                <CardTitle className="text-base">Payment proof</CardTitle>
                <CardDescription>
                  Student receipt and verification details for this request.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {app.payment_submission ? (
                  <div className="bg-muted/20 space-y-2 rounded-2xl border p-3">
                    <p className="text-muted-foreground text-xs font-medium">
                      Student payment proof
                    </p>
                    {app.payment_submission.submitted_at ? (
                      <p className="text-muted-foreground text-xs">
                        Uploaded{' '}
                        {new Date(
                          app.payment_submission.submitted_at,
                        ).toLocaleString()}
                      </p>
                    ) : null}
                    <PaymentReceiptLinks
                      receipts={app.payment_submission.receipts ?? []}
                    />
                    {app.payment_method ? (
                      <p className="text-xs">
                        Mode of payment:{' '}
                        <span className="font-medium">
                          {app.payment_method.name}
                        </span>
                        {app.payment_method.description
                          ? ` — ${app.payment_method.description}`
                          : ''}
                      </p>
                    ) : null}
                    {app.payment_submission.reference_number ? (
                      <p className="text-xs">
                        Legacy reference:{' '}
                        <span className="font-medium">
                          {app.payment_submission.reference_number}
                        </span>
                      </p>
                    ) : null}
                    {app.payment_submission.remarks ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {app.payment_submission.remarks}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {app.payment_verification ? (
                  <div className="bg-muted/20 rounded-2xl border p-3">
                    <p className="text-muted-foreground text-xs font-medium">
                      Verification
                    </p>
                    {app.payment_verification.verified_at ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Verified{' '}
                        {new Date(
                          app.payment_verification.verified_at,
                        ).toLocaleString()}
                      </p>
                    ) : null}
                    {app.payment_verification.reference_number ? (
                      <p className="mt-1 text-xs">
                        Notes ref:{' '}
                        <span className="font-medium">
                          {app.payment_verification.reference_number}
                        </span>
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

          {(app.stage_runs?.length ?? 0) > 0 ? (
            <Card className="drs-card">
              <CardHeader>
                <CardTitle className="text-base">Stage timeline</CardTitle>
                <CardDescription>
                  Turnaround time for each stage this request passed through.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {[...(app.stage_runs ?? [])]
                    .sort((a, b) => {
                      const aMs = a.started_at
                        ? new Date(a.started_at).getTime()
                        : 0;
                      const bMs = b.started_at
                        ? new Date(b.started_at).getTime()
                        : 0;
                      return aMs - bMs;
                    })
                    .map((run) => (
                      <li
                        key={run.id}
                        className="bg-muted/20 space-y-1 rounded-2xl border p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-medium">
                            {run.stage_name ?? run.stage_slug ?? 'Stage'}
                          </p>
                          <p className="text-muted-foreground shrink-0 text-xs font-medium">
                            TAT{' '}
                            {formatStageTat(run.started_at, run.completed_at)}
                            {!run.completed_at ? ' (ongoing)' : ''}
                          </p>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Started{' '}
                          {run.started_at
                            ? new Date(run.started_at).toLocaleString()
                            : '—'}
                          {run.completed_at
                            ? ` · Completed ${new Date(run.completed_at).toLocaleString()}`
                            : ''}
                        </p>
                      </li>
                    ))}
                </ul>
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
                    {task.branch_options?.find(
                      (option) => option.id === transitionByTask[task.id],
                    )?.outcome_key === 'pickup_handoff' ? (
                      <div className="bg-background/80 space-y-2 rounded-2xl border p-3">
                        <Label htmlFor={`pickup-date-${task.id}`}>
                          Pickup date
                        </Label>
                        <Input
                          id={`pickup-date-${task.id}`}
                          type="date"
                          value={pickupDateByTask[task.id] ?? ''}
                          onChange={(event) =>
                            setPickupDateByTask((prev) => ({
                              ...prev,
                              [task.id]: event.target.value,
                            }))
                          }
                        />
                        <p className="text-muted-foreground text-xs">
                          Required when releasing the application for pickup.
                          The student will see this date.
                        </p>
                      </div>
                    ) : null}
                    {task.kind === 'payment_verification' ? (
                      <PaymentVerificationTaskPanel
                        task={task}
                        app={app}
                        remarkByTask={remarkByTask}
                        setRemarkByTask={setRemarkByTask}
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
                        lineQuantityByTask={lineQuantityByTask}
                        setLineQuantityByTask={setLineQuantityByTask}
                        lineCancelledByTask={lineCancelledByTask}
                        setLineCancelledByTask={setLineCancelledByTask}
                        otherFeesByTask={otherFeesByTask}
                        setOtherFeesByTask={setOtherFeesByTask}
                        saveRemarksMutation={saveRemarksMutation}
                        completeMutation={completeMutation}
                      />
                    ) : task.kind === 'clearance_signoff' ? (
                      <div className="space-y-3">
                        {Array.isArray(task.modules) &&
                        task.modules.length > 0 ? (
                          <div className="border-border space-y-2 rounded-lg border p-3">
                            <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                              Clearance modules
                            </p>
                            <ul className="space-y-2">
                              {task.modules.map((mod) => (
                                <li key={mod.key} className="space-y-1 text-sm">
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <span className="text-muted-foreground">
                                      {mod.label}
                                    </span>
                                    <span className="font-medium tabular-nums">
                                      {mod.value}
                                      {typeof mod.count === 'number' &&
                                      mod.count > 0
                                        ? ` (${mod.count})`
                                        : ''}
                                    </span>
                                  </div>
                                  {Array.isArray(mod.items) &&
                                  mod.items.length > 0 ? (
                                    <ul className="text-muted-foreground list-inside list-disc pl-1 text-xs">
                                      {mod.items.map((item, idx) => (
                                        <li key={`${mod.key}-${idx}`}>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
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

        <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
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
