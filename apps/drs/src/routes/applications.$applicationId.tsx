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
import { History, Printer, XCircle } from 'lucide-react';
import * as React from 'react';

import { ConfirmActionDialog } from './maintenance/-clearance/-confirm-action-dialog.tsx';
import { fetchPaymentCollectionSettings } from './maintenance/-lib/api/paymentCollectionSettings.ts';

import type { TempUpload } from '@/lib/tempUploads.ts';
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
import { fetchDocumentCatalog } from './apply/-lib/fetchDocumentCatalog.ts';
import type { CatalogDocument } from './apply/-lib/types.ts';

function useMinWidth(minWidthPx: number): boolean {
  const [matches, setMatches] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(`(min-width: ${minWidthPx}px)`).matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidthPx}px)`);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [minWidthPx]);

  return matches;
}

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
  const isXl = useMinWidth(1280);
  const canSubmitEdit =
    editable &&
    !patchMutation.isPending &&
    Boolean(paymentMethodId) &&
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
    <DrsPageShell maxWidth="xl" contentClassName="space-y-3">
      <div className="drs-screen-content space-y-3">
        <DrsPageHeader
          backTo="/"
          backLabel="Applications"
          eyebrow="Application"
          title={`#${displayApplicationRef(app)}`}
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
              {app.may_cancel && !app.is_cancelled ? (
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

        {isXl ? (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="space-y-3">
              <RequestDetailsCard app={app} />
              <PaymentBreakdownCard app={app} />
              <PaymentStepCard
                app={app}
                uploads={paymentUploads}
                remarks={paymentRemarks}
                isSubmitting={paymentMutation.isPending}
                hasSubmitError={paymentMutation.isError}
                onUploadsChange={(nextUploads) => {
                  if (paymentMutation.isError) {
                    paymentMutation.reset();
                  }
                  setIsPaymentDraftDirty(true);
                  setPaymentUploads(nextUploads);
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
                paymentMethodId={paymentMethodId}
                paymentMethods={paymentMethods}
                secureEmail={secureEmail}
                deliveryAddress={deliveryAddress}
                purpose={purpose}
                lines={lines}
                lockedCompanionIds={lockedCompanionIds}
                lockedCompanionLabels={lockedCompanionLabels}
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
                onPaymentMethodChange={(value) => {
                  if (patchMutation.isError) {
                    patchMutation.reset();
                  }
                  setIsEditDraftDirty(true);
                  setPaymentMethodId(value);
                }}
                onSecureEmailChange={(value) => {
                  if (patchMutation.isError) {
                    patchMutation.reset();
                  }
                  setIsEditDraftDirty(true);
                  setSecureEmail(value);
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
            </div>
            <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
              <MessagesCard applicationId={applicationId} />
            </aside>
          </div>
        ) : (
          <Tabs defaultValue="request" className="gap-3">
            <TabsList className="grid h-auto w-full grid-cols-3 p-1">
              <TabsTrigger value="request" className="min-h-10 px-2">
                Request
              </TabsTrigger>
              <TabsTrigger value="payment" className="min-h-10 px-2">
                Payment
              </TabsTrigger>
              <TabsTrigger value="messages" className="min-h-10 px-2">
                Messages
              </TabsTrigger>
            </TabsList>
            <TabsContent value="request" className="space-y-3">
              <RequestDetailsCard app={app} />
              <ClearancesCard clearances={app.clearances} />
              <EditRequestCard
                editable={editable}
                email={email}
                contactNumber={contactNumber}
                receiveMode={receiveMode}
                paymentMethodId={paymentMethodId}
                paymentMethods={paymentMethods}
                secureEmail={secureEmail}
                deliveryAddress={deliveryAddress}
                purpose={purpose}
                lines={lines}
                lockedCompanionIds={lockedCompanionIds}
                lockedCompanionLabels={lockedCompanionLabels}
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
                onPaymentMethodChange={(value) => {
                  if (patchMutation.isError) {
                    patchMutation.reset();
                  }
                  setIsEditDraftDirty(true);
                  setPaymentMethodId(value);
                }}
                onSecureEmailChange={(value) => {
                  if (patchMutation.isError) {
                    patchMutation.reset();
                  }
                  setIsEditDraftDirty(true);
                  setSecureEmail(value);
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
            </TabsContent>
            <TabsContent value="payment" className="space-y-3">
              <PaymentBreakdownCard app={app} />
              <PaymentStepCard
                app={app}
                uploads={paymentUploads}
                remarks={paymentRemarks}
                isSubmitting={paymentMutation.isPending}
                hasSubmitError={paymentMutation.isError}
                onUploadsChange={(nextUploads) => {
                  if (paymentMutation.isError) {
                    paymentMutation.reset();
                  }
                  setIsPaymentDraftDirty(true);
                  setPaymentUploads(nextUploads);
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
            </TabsContent>
            <TabsContent value="messages">
              <MessagesCard applicationId={applicationId} />
            </TabsContent>
          </Tabs>
        )}

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
