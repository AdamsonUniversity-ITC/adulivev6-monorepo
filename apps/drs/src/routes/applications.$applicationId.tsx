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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { History, Printer } from 'lucide-react';
import * as React from 'react';

import { ConfirmActionDialog } from './maintenance/-clearance/-confirm-action-dialog.tsx';
import { fetchPaymentCollectionSettings } from './maintenance/-lib/api/paymentCollectionSettings.ts';

import type { TempUpload } from '@/lib/tempUploads.ts';
import {
  AddCatalogLinesDialog,
  ClearancesSection,
  type DraftLine,
  EditRequestSection,
  isPaymentCollectionOpen,
  MAX_LINE_QTY,
  MessagesPanel,
  PaymentBreakdownSection,
  PaymentReferencesSection,
  PaymentStepPanel,
  RequestDetailsSection,
  RequestSummaryPanel,
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
import { fetchDocumentCatalog } from './apply/-lib/fetchDocumentCatalog.ts';
import type { CatalogDocument } from './apply/-lib/types.ts';

function companionMetaFromCatalog(
  groups: Array<{ documents?: CatalogDocument[] | null }>,
) {
  const companionIdsByDocId = new Map<number, number[]>();
  const documentMetaById = new Map<
    number,
    { label: string; allow_multiple_per_request: boolean }
  >();

  for (const group of groups) {
    for (const doc of group.documents ?? []) {
      documentMetaById.set(doc.id, {
        label: doc.document_name,
        allow_multiple_per_request: doc.allow_multiple_per_request !== false,
      });
      const ids = (doc.required_companion_ids ?? [])
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0 && id !== doc.id);
      if (ids.length > 0) companionIdsByDocId.set(doc.id, ids);
    }
  }

  return { companionIdsByDocId, documentMetaById };
}

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

  const catalogQuery = useQuery({
    queryKey: ['drs_apply_document_catalog'],
    queryFn: fetchDocumentCatalog,
    refetchOnWindowFocus: false,
  });

  const paymentSettingsQuery = useQuery({
    queryKey: ['payment_collection_settings'],
    queryFn: fetchPaymentCollectionSettings,
    refetchOnWindowFocus: false,
  });

  const paymentMethods = paymentSettingsQuery.data?.payment_methods ?? [];

  const companionMeta = React.useMemo(
    () => companionMetaFromCatalog(catalogQuery.data?.groups ?? []),
    [catalogQuery.data],
  );

  const [email, setEmail] = React.useState('');
  const [contactNumber, setContactNumber] = React.useState('');
  const [receiveMode, setReceiveMode] = React.useState<'delivery' | 'pickup'>(
    'pickup',
  );
  const [paymentMethodId, setPaymentMethodId] = React.useState('');
  const [secureEmail, setSecureEmail] = React.useState(false);
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [lines, setLines] = React.useState<DraftLine[]>([]);
  const [addCatalogOpen, setAddCatalogOpen] = React.useState(false);
  const [paymentUploads, setPaymentUploads] = React.useState<TempUpload[]>([]);
  const [paymentRemarks, setPaymentRemarks] = React.useState('');
  const [isEditDraftDirty, setIsEditDraftDirty] = React.useState(false);
  const [isPaymentDraftDirty, setIsPaymentDraftDirty] = React.useState(false);
  const [receiptPrintedAt, setReceiptPrintedAt] = React.useState<Date | null>(
    null,
  );
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  const lockedCompanionIds = React.useMemo(() => {
    const locked = new Set<number>();
    for (const line of lines) {
      if (line.requestable_type !== 'document' || line.quantity <= 0) continue;
      for (const companionId of companionMeta.companionIdsByDocId.get(
        line.requestable_id,
      ) ?? []) {
        locked.add(companionId);
      }
    }
    return Array.from(locked);
  }, [lines, companionMeta]);

  const lockedCompanionLabels = React.useMemo(() => {
    const labels: Record<number, string> = {};
    for (const line of lines) {
      if (line.requestable_type !== 'document' || line.quantity <= 0) continue;
      for (const companionId of companionMeta.companionIdsByDocId.get(
        line.requestable_id,
      ) ?? []) {
        labels[companionId] = line.label;
      }
    }
    return labels;
  }, [lines, companionMeta]);

  const app = appQuery.data;

  const hydrateEditDraft = React.useCallback(
    (nextApp: DRSApplicationDetail) => {
      setEmail(nextApp.email);
      setContactNumber(nextApp.contact_no);
      setReceiveMode(nextApp.receive_mode);
      setPaymentMethodId(
        nextApp.payment_method_id ?? nextApp.payment_method?.id ?? '',
      );
      setSecureEmail(nextApp.secure_email_requested);
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
      setPaymentRemarks(nextApp.payment_submission?.remarks ?? '');
      if (nextApp.payment_submission) {
        setPaymentUploads([]);
      }
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
        let next = [...prev];
        const upsert = (
          item: DraftLine,
          allowMultiple: boolean,
        ): DraftLine[] => {
          const ix = next.findIndex(
            (l) =>
              l.requestable_type === item.requestable_type &&
              l.requestable_id === item.requestable_id,
          );
          if (ix === -1) {
            next = [...next, item];
            return next;
          }
          if (!allowMultiple) {
            return next;
          }
          next = next.map((row, i) =>
            i === ix
              ? {
                  ...row,
                  quantity: Math.min(MAX_LINE_QTY, row.quantity + 1),
                }
              : row,
          );
          return next;
        };

        const already = next.some(
          (l) =>
            l.requestable_type === pick.requestable_type &&
            l.requestable_id === pick.requestable_id,
        );
        if (already && !pick.allow_multiple_per_request) {
          setTimeout(() => {
            toast.info('This item is already in your request.');
          }, 0);
          return prev;
        }

        upsert(
          {
            requestable_type: pick.requestable_type,
            requestable_id: pick.requestable_id,
            quantity: 1,
            label: pick.label,
          },
          pick.allow_multiple_per_request,
        );

        if (pick.requestable_type === 'document') {
          const queue = [
            ...(companionMeta.companionIdsByDocId.get(pick.requestable_id) ??
              []),
          ];
          const seen = new Set<number>();
          while (queue.length > 0) {
            const companionId = queue.shift();
            if (companionId == null || seen.has(companionId)) continue;
            seen.add(companionId);
            const meta = companionMeta.documentMetaById.get(companionId);
            if (!meta) continue;
            const exists = next.some(
              (l) =>
                l.requestable_type === 'document' &&
                l.requestable_id === companionId,
            );
            if (!exists) {
              next = [
                ...next,
                {
                  requestable_type: 'document',
                  requestable_id: companionId,
                  quantity: 1,
                  label: meta.label,
                },
              ];
            }
            for (const nested of companionMeta.companionIdsByDocId.get(
              companionId,
            ) ?? []) {
              queue.push(nested);
            }
          }
        }

        return next;
      });
      setAddCatalogOpen(false);
    },
    [companionMeta],
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
        payment_method_id: Number(paymentMethodId),
        secure_email_requested: secureEmail,
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
        temp_upload_ids: paymentUploads.map((upload) => Number(upload.id)),
        remarks: paymentRemarks.trim() || null,
      }),
    onSuccess: (updated: DRSApplicationDetail) => {
      queryClient.setQueryData(['drs-application', applicationId], updated);
      void queryClient.invalidateQueries({ queryKey: ['drs-applications'] });
      hydratePaymentDraft(updated);
      setPaymentUploads([]);
      setIsPaymentDraftDirty(false);
      toast.success('Payment proof submitted.');
    },
    onError: () => {
      toast.error('Failed to submit payment proof.');
    },
  });

  const handlePaymentSubmit = React.useCallback(() => {
    if (paymentUploads.length === 0) {
      toast.error('Upload at least one payment receipt.');
      return;
    }

    paymentMutation.mutate();
  }, [paymentMutation, paymentUploads.length]);

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
    Boolean(paymentMethodId) &&
    lines.length > 0 &&
    lines.every((l) => l.requestable_id > 0 && l.quantity >= 1);

  const [tab, setTab] = React.useState('request');

  /** Clearing a stale save error the moment the user edits keeps errors honest. */
  const editField = React.useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        if (patchMutation.isError) {
          patchMutation.reset();
        }
        setIsEditDraftDirty(true);
        setter(value);
      },
    [patchMutation],
  );

  const paymentField = React.useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        if (paymentMutation.isError) {
          paymentMutation.reset();
        }
        setIsPaymentDraftDirty(true);
        setter(value);
      },
    [paymentMutation],
  );

  const editRequestProps = {
    editable,
    email,
    contactNumber,
    receiveMode,
    paymentMethodId,
    paymentMethods,
    secureEmail,
    deliveryAddress,
    purpose,
    lines,
    lockedCompanionIds,
    lockedCompanionLabels,
    canSubmitEdit,
    hasSaveError: patchMutation.isError,
    onEmailChange: editField(setEmail),
    onContactNumberChange: editField(setContactNumber),
    onReceiveModeChange: editField(setReceiveMode),
    onPaymentMethodChange: editField(setPaymentMethodId),
    onSecureEmailChange: editField(setSecureEmail),
    onDeliveryAddressChange: editField(setDeliveryAddress),
    onPurposeChange: editField(setPurpose),
    onLinesChange: editField(
      setLines as React.Dispatch<React.SetStateAction<DraftLine[]>>,
    ) as React.Dispatch<React.SetStateAction<DraftLine[]>>,
    onOpenCatalog: () => setAddCatalogOpen(true),
    onSave: () => patchMutation.mutate(),
  };

  const paymentStepProps = app
    ? {
        app,
        uploads: paymentUploads,
        remarks: paymentRemarks,
        isSubmitting: paymentMutation.isPending,
        hasSubmitError: paymentMutation.isError,
        onUploadsChange: paymentField(setPaymentUploads),
        onRemarksChange: paymentField(setPaymentRemarks),
        onSubmit: handlePaymentSubmit,
      }
    : null;

  const paymentDue = app ? isPaymentCollectionOpen(app) : false;

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
          description="This reference may be mistyped, or the request may have been removed."
          action={
            <Button variant="outline" asChild>
              <Link to="/">Back to my requests</Link>
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
          description="The request may no longer exist, or your access may have changed. Try again, or go back to your list of requests."
          action={
            <Button variant="outline" asChild>
              <Link to="/">Back to my requests</Link>
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
          backLabel="My requests"
          title={`Request #${displayApplicationRef(app)}`}
          description={
            app.student_no
              ? `${app.student_name?.trim() || 'Student'} · ${app.student_no}`
              : app.student_name?.trim() || undefined
          }
          badges={
            <>
              <DrsStatusBadge tone={toneForStatus(app.status)}>
                {app.current_stage?.name ?? formatStatusLabel(app.status)}
              </DrsStatusBadge>
              {app.editable ? (
                <DrsStatusBadge tone="info">Editable</DrsStatusBadge>
              ) : null}
              {app.is_foreigner_student ? (
                <DrsStatusBadge tone="neutral">
                  Foreigner student
                </DrsStatusBadge>
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
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel request
                </Button>
              ) : null}
              {canRestore ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link
                    to="/applications/$applicationId/history"
                    params={{ applicationId }}
                  >
                    <History className="size-4" aria-hidden="true" />
                    History
                  </Link>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrintReceipt}
              >
                <Printer className="size-4" aria-hidden="true" />
                Print receipt
              </Button>
            </>
          }
        />

        <div className="grid gap-x-10 gap-y-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <Tabs value={tab} onValueChange={setTab} className="gap-6">
              <TabsList>
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-8">
                <RequestDetailsSection app={app} />
                <ClearancesSection clearances={app.clearances} />
                <EditRequestSection {...editRequestProps} />
              </TabsContent>

              <TabsContent value="payment" className="space-y-8">
                <PaymentBreakdownSection app={app} />
                {paymentStepProps ? (
                  <PaymentStepPanel {...paymentStepProps} />
                ) : null}
                <PaymentReferencesSection app={app} />
              </TabsContent>

              <TabsContent value="messages">
                <MessagesPanel applicationId={applicationId} />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="xl:sticky xl:top-28 xl:self-start">
            <RequestSummaryPanel
              app={app}
              action={
                paymentDue ? (
                  <Button type="button" onClick={() => setTab('payment')}>
                    Submit payment proof
                  </Button>
                ) : null
              }
              footnote={
                paymentDue
                  ? 'Upload your receipt so the cashier can verify your payment.'
                  : app.editable
                    ? 'You can still change contact details and items while this request is in its first stage.'
                    : 'Nothing is needed from you right now. The registrar will update this request as it moves along.'
              }
            />
          </aside>
        </div>

        <AddCatalogLinesDialog
          open={addCatalogOpen}
          onOpenChange={setAddCatalogOpen}
          onPick={handleCatalogPick}
        />
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
