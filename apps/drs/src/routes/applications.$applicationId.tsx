import {
  DrsErrorState,
  DrsLoadingState,
  DrsNotFoundState,
  DrsPageHeader,
  DrsPageShell,
  DrsStatusBadge,
  formatStatusLabel,
  toneForStatus,
} from '@/components/drs-ui.tsx';
import {
  DRS_STUDENT_APPLY_PERMISSION,
  hasDrAdminAccessForHost,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { isNotFoundError } from '@/lib/isNotFoundError.ts';
import { checkPermission } from '@repo/hooks';
import { Button } from '@repo/ui/components/button';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { History, Printer, XCircle } from 'lucide-react';
import * as React from 'react';

import { ConfirmActionDialog } from './maintenance/-clearance/-confirm-action-dialog.tsx';

import {
  AddCatalogLinesDialog,
  ClearancesCard,
  type DraftLine,
  EditRequestCard,
  MAX_LINE_QTY,
  MessagesCard,
  PaymentBreakdownCard,
  PaymentReferencesCard,
  PaymentStepCard,
  RequestDetailsCard,
} from './-application-detail-sections.tsx';
import { ApplicationReceiptPrint } from './-application-receipt-print.tsx';
import { fetchApplication } from './-lib/api/fetchApplication.ts';
import { patchApplication } from './-lib/api/patchApplication.ts';
import { postCancelApplication } from './-lib/api/postCancelApplication.ts';
import { postStudentPaymentProof } from './-lib/api/postStudentPaymentProof.ts';
import {
  displayApplicationRef,
  type DRSApplicationDetail,
} from './-lib/types/applications.ts';

export const Route = createFileRoute('/applications/$applicationId')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    if (!checkPermission(permissions, DRS_STUDENT_APPLY_PERMISSION)) {
      throw redirect({ to: '/' });
    }
  },
  loader: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);

    return {
      canRestore:
        typeof window !== 'undefined' &&
        hasDrAdminAccessForHost(permissions, window.location.hostname),
    };
  },
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const { canRestore } = Route.useLoaderData();
  const queryClient = useQueryClient();

  const appQuery = useQuery({
    queryKey: ['drs-application', applicationId],
    queryFn: () => fetchApplication(applicationId),
  });

  const [email, setEmail] = React.useState('');
  const [contactNumber, setContactNumber] = React.useState('');
  const [receiveMode, setReceiveMode] = React.useState<
    'email' | 'delivery' | 'pickup'
  >('pickup');
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [lines, setLines] = React.useState<DraftLine[]>([]);
  const [addCatalogOpen, setAddCatalogOpen] = React.useState(false);
  const [paymentReferenceNumber, setPaymentReferenceNumber] =
    React.useState('');
  const [paymentRemarks, setPaymentRemarks] = React.useState('');
  const [isEditDraftDirty, setIsEditDraftDirty] = React.useState(false);
  const [isPaymentDraftDirty, setIsPaymentDraftDirty] = React.useState(false);
  const [receiptPrintedAt, setReceiptPrintedAt] = React.useState<Date | null>(
    null,
  );
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  const app = appQuery.data;

  const hydrateEditDraft = React.useCallback(
    (nextApp: DRSApplicationDetail) => {
      setEmail(nextApp.email);
      setContactNumber(nextApp.contact_no);
      setReceiveMode(nextApp.receive_mode);
      setDeliveryAddress(nextApp.delivery_address ?? '');
      setPurpose(nextApp.purpose ?? '');
      const next =
        nextApp.lines?.map((l) => {
          const t: DraftLine['requestable_type'] =
            l.request_type === 'package' ? 'package' : 'document';
          const id = Number.parseInt(String(l.requestable_id ?? ''), 10);
          return {
            requestable_type: t,
            requestable_id: Number.isFinite(id) ? id : 0,
            quantity: l.quantity,
            label: l.request_name,
          };
        }) ?? [];
      setLines(next);
    },
    [],
  );

  const hydratePaymentDraft = React.useCallback(
    (nextApp: DRSApplicationDetail) => {
      setPaymentReferenceNumber(
        nextApp.payment_submission?.reference_number ?? '',
      );
      setPaymentRemarks(nextApp.payment_submission?.remarks ?? '');
    },
    [],
  );

  const handleCatalogPick = React.useCallback(
    (pick: {
      requestable_type: 'document' | 'package';
      requestable_id: number;
      label: string;
      allow_multiple_per_request: boolean;
    }) => {
      setIsEditDraftDirty(true);
      setLines((prev) => {
        const ix = prev.findIndex(
          (l) =>
            l.requestable_type === pick.requestable_type &&
            l.requestable_id === pick.requestable_id,
        );
        if (ix === -1) {
          return [
            ...prev,
            {
              requestable_type: pick.requestable_type,
              requestable_id: pick.requestable_id,
              quantity: 1,
              label: pick.label,
            },
          ];
        }
        if (!pick.allow_multiple_per_request) {
          setTimeout(() => {
            toast.info('This item is already in your request.');
          }, 0);
          return prev;
        }
        return prev.map((row, i) =>
          i === ix
            ? {
                ...row,
                quantity: Math.min(MAX_LINE_QTY, row.quantity + 1),
              }
            : row,
        );
      });
      setAddCatalogOpen(false);
    },
    [],
  );

  React.useEffect(() => {
    setIsEditDraftDirty(false);
    setIsPaymentDraftDirty(false);
  }, [applicationId]);

  React.useEffect(() => {
    if (!app) return;

    if (!isEditDraftDirty) {
      hydrateEditDraft(app);
    }
    if (!isPaymentDraftDirty) {
      hydratePaymentDraft(app);
    }
  }, [
    app,
    hydrateEditDraft,
    hydratePaymentDraft,
    isEditDraftDirty,
    isPaymentDraftDirty,
  ]);

  const patchMutation = useMutation({
    mutationFn: () =>
      patchApplication(applicationId, {
        email: email.trim(),
        contact_number: contactNumber.trim(),
        receive_mode: receiveMode,
        delivery_address:
          receiveMode === 'delivery' ? deliveryAddress.trim() : null,
        purpose: purpose.trim() || null,
        lines: lines.map((l) => ({
          requestable_type: l.requestable_type,
          requestable_id: l.requestable_id,
          quantity: l.quantity,
        })),
      }),
    onSuccess: (updated: DRSApplicationDetail) => {
      queryClient.setQueryData(['drs-application', applicationId], updated);
      void queryClient.invalidateQueries({ queryKey: ['drs-applications'] });
      hydrateEditDraft(updated);
      setIsEditDraftDirty(false);
      toast.success('Request updated.');
    },
    onError: () => {
      toast.error('Failed to update request.');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      postStudentPaymentProof(applicationId, {
        reference_number: paymentReferenceNumber.trim(),
        remarks: paymentRemarks.trim() || null,
      }),
    onSuccess: (updated: DRSApplicationDetail) => {
      queryClient.setQueryData(['drs-application', applicationId], updated);
      void queryClient.invalidateQueries({ queryKey: ['drs-applications'] });
      hydratePaymentDraft(updated);
      setIsPaymentDraftDirty(false);
      toast.success('Payment reference submitted.');
    },
    onError: () => {
      toast.error('Failed to submit payment reference.');
    },
  });

  const handlePaymentSubmit = React.useCallback(() => {
    if (!paymentReferenceNumber.trim()) {
      toast.error('Enter a payment reference number.');
      return;
    }

    paymentMutation.mutate();
  }, [paymentMutation, paymentReferenceNumber]);

  const handlePrintReceipt = React.useCallback(() => {
    setReceiptPrintedAt(new Date());
    window.requestAnimationFrame(() => window.print());
  }, []);

  const cancelMutation = useMutation({
    mutationFn: () => postCancelApplication(applicationId),
    onSuccess: (updated: DRSApplicationDetail) => {
      queryClient.setQueryData(['drs-application', applicationId], updated);
      void queryClient.invalidateQueries({ queryKey: ['drs-applications'] });
      setCancelDialogOpen(false);
      toast.success('Application cancelled.');
    },
    onError: () => {
      toast.error('Failed to cancel application.');
    },
  });

  const editable = Boolean(app?.editable);
  const canSubmitEdit =
    editable &&
    !patchMutation.isPending &&
    lines.length > 0 &&
    lines.every((l) => l.requestable_id > 0 && l.quantity >= 1);

  if (appQuery.isLoading) {
    return (
      <DrsPageShell maxWidth="lg">
        <DrsLoadingState label="Loading request…" />
      </DrsPageShell>
    );
  }

  if (isNotFoundError(appQuery.error)) {
    return (
      <DrsPageShell maxWidth="md">
        <DrsNotFoundState
          title="Request not found"
          description="This application ID may be incorrect, or the request may have been removed."
          action={
            <Button className="rounded-full" variant="outline" asChild>
              <Link to="/">Back to applications</Link>
            </Button>
          }
        />
      </DrsPageShell>
    );
  }

  if (appQuery.isError || !app) {
    return (
      <DrsPageShell maxWidth="md">
        <DrsErrorState
          title="Could not load this request"
          description="The request may no longer exist, or your access may have changed."
          action={
            <Button className="rounded-full" variant="outline" asChild>
              <Link to="/">Back to applications</Link>
            </Button>
          }
        />
      </DrsPageShell>
    );
  }

  return (
    <DrsPageShell maxWidth="xl" contentClassName="space-y-5">
      <div className="drs-screen-content space-y-5">
        <DrsPageHeader
          backTo="/"
          backLabel="Applications"
          eyebrow="Application detail"
          title={`Request #${displayApplicationRef(app)}`}
          description={
            <>
              {app.student_no
                ? `Student no. ${app.student_no}`
                : 'Student view'}
              {app.student_name?.trim() ? ` · ${app.student_name}` : ''}
            </>
          }
          badges={
            <>
              <DrsStatusBadge tone={toneForStatus(app.status)}>
                {app.current_stage?.name ?? formatStatusLabel(app.status)}
              </DrsStatusBadge>
              <DrsStatusBadge tone={app.editable ? 'info' : 'neutral'}>
                {app.editable ? 'Editable' : 'Locked'}
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
              {app.may_cancel && !app.is_cancelled ? (
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
                onClick={handlePrintReceipt}
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print receipt
              </Button>
              {canRestore ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 rounded-full"
                  asChild
                >
                  <Link
                    to="/applications/$applicationId/history"
                    params={{ applicationId }}
                  >
                    <History className="h-4 w-4" aria-hidden="true" />
                    Rollback
                  </Link>
                </Button>
              ) : null}
            </>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-5">
            <RequestDetailsCard app={app} />
            <PaymentBreakdownCard app={app} />
            <PaymentStepCard
              app={app}
              referenceNumber={paymentReferenceNumber}
              remarks={paymentRemarks}
              isSubmitting={paymentMutation.isPending}
              hasSubmitError={paymentMutation.isError}
              onReferenceNumberChange={(value) => {
                if (paymentMutation.isError) {
                  paymentMutation.reset();
                }
                setIsPaymentDraftDirty(true);
                setPaymentReferenceNumber(value);
              }}
              onRemarksChange={(value) => {
                if (paymentMutation.isError) {
                  paymentMutation.reset();
                }
                setIsPaymentDraftDirty(true);
                setPaymentRemarks(value);
              }}
              onSubmit={handlePaymentSubmit}
            />
            <PaymentReferencesCard app={app} />
            <ClearancesCard clearances={app.clearances} />
            <EditRequestCard
              editable={editable}
              email={email}
              contactNumber={contactNumber}
              receiveMode={receiveMode}
              deliveryAddress={deliveryAddress}
              purpose={purpose}
              lines={lines}
              canSubmitEdit={canSubmitEdit}
              hasSaveError={patchMutation.isError}
              onEmailChange={(value) => {
                if (patchMutation.isError) {
                  patchMutation.reset();
                }
                setIsEditDraftDirty(true);
                setEmail(value);
              }}
              onContactNumberChange={(value) => {
                if (patchMutation.isError) {
                  patchMutation.reset();
                }
                setIsEditDraftDirty(true);
                setContactNumber(value);
              }}
              onReceiveModeChange={(value) => {
                if (patchMutation.isError) {
                  patchMutation.reset();
                }
                setIsEditDraftDirty(true);
                setReceiveMode(value);
              }}
              onDeliveryAddressChange={(value) => {
                if (patchMutation.isError) {
                  patchMutation.reset();
                }
                setIsEditDraftDirty(true);
                setDeliveryAddress(value);
              }}
              onPurposeChange={(value) => {
                if (patchMutation.isError) {
                  patchMutation.reset();
                }
                setIsEditDraftDirty(true);
                setPurpose(value);
              }}
              onLinesChange={(value) => {
                if (patchMutation.isError) {
                  patchMutation.reset();
                }
                setIsEditDraftDirty(true);
                setLines(value);
              }}
              onOpenCatalog={() => setAddCatalogOpen(true)}
              onSave={() => patchMutation.mutate()}
            />
            <AddCatalogLinesDialog
              open={addCatalogOpen}
              onOpenChange={setAddCatalogOpen}
              onPick={handleCatalogPick}
            />
          </div>
          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <MessagesCard applicationId={applicationId} />
          </aside>
        </div>
      </div>
      <ConfirmActionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel this application?"
        description="This will cancel your document request. You cannot undo this action."
        confirmLabel="Cancel application"
        pending={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />
      <ApplicationReceiptPrint app={app} printedAt={receiptPrintedAt} />
    </DrsPageShell>
  );
}
