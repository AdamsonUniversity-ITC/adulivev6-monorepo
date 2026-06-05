import { DRS_STUDENT_APPLY_PERMISSION } from '@/lib/drsPermissions.ts';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Textarea } from '@repo/ui/components/textarea';
import { toast } from '@repo/ui/exports';
import { checkPermission } from '@repo/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react';
import * as React from 'react';
import { LoadingIndicator } from './-loading-indicator.tsx';

import { ApplicationMessagesPanel } from './-application-messages-panel.tsx';
import {
  itemVisibleForRules,
  PLACEHOLDER_STUDENT_CONTEXT,
} from './apply/-lib/evaluateDocumentRules.ts';
import { fetchDocumentCatalog } from './apply/-lib/fetchDocumentCatalog.ts';
import { fetchApplication } from './-lib/api/fetchApplication.ts';
import { patchApplication } from './-lib/api/patchApplication.ts';
import {
  type DRSApplicationDetail,
  displayApplicationRef,
} from './-lib/types/applications.ts';
import type { CatalogGroup } from './apply/-lib/types.ts';

const MAX_LINE_QTY = 50;

type DraftLine = {
  requestable_type: 'document' | 'package';
  requestable_id: number;
  quantity: number;
  label: string;
};

type CatalogPickRow = {
  kind: 'document' | 'package';
  id: number;
  name: string;
  groupName: string;
  allow_multiple_per_request: boolean;
};

type AddCatalogLinesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (pick: {
    requestable_type: 'document' | 'package';
    requestable_id: number;
    label: string;
    allow_multiple_per_request: boolean;
  }) => void;
};

function AddCatalogLinesDialog({
  open,
  onOpenChange,
  onPick,
}: AddCatalogLinesDialogProps) {
  const ctx = PLACEHOLDER_STUDENT_CONTEXT;
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const catalogQuery = useQuery({
    queryKey: ['drs-document-catalog'],
    queryFn: fetchDocumentCatalog,
    enabled: open,
    staleTime: 60_000,
  });

  const q = search.trim().toLowerCase();
  const pickRows = React.useMemo(() => {
    const groups: CatalogGroup[] = catalogQuery.data ?? [];
    const out: CatalogPickRow[] = [];
    for (const g of groups) {
      const docs = (g.documents ?? []).filter(
        (d) => d.is_active && itemVisibleForRules(d.rules, ctx),
      );
      const pkgs = (g.packages ?? []).filter(
        (p) => p.is_active && itemVisibleForRules(p.rules, ctx),
      );
      const groupLc = g.group_name.toLowerCase();
      for (const d of docs) {
        const nameLc = d.document_name.toLowerCase();
        if (q !== '' && !nameLc.includes(q) && !groupLc.includes(q)) {
          continue;
        }
        out.push({
          kind: 'document',
          id: d.id,
          name: d.document_name,
          groupName: g.group_name,
          allow_multiple_per_request: Boolean(d.allow_multiple_per_request),
        });
      }
      for (const p of pkgs) {
        const nameLc = p.package_name.toLowerCase();
        if (q !== '' && !nameLc.includes(q) && !groupLc.includes(q)) {
          continue;
        }
        out.push({
          kind: 'package',
          id: p.id,
          name: p.package_name,
          groupName: g.group_name,
          allow_multiple_per_request: Boolean(p.allow_multiple_per_request),
        });
      }
    }
    return out.sort(
      (a, b) =>
        a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name),
    );
  }, [catalogQuery.data, ctx, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add document or package</DialogTitle>
          <DialogDescription>
            Choose from the registrar catalog. If an item allows multiple copies,
            picking it again increases the quantity.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-2.5 left-2 h-4 w-4" />
          <Input
            className="pl-8"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {catalogQuery.isLoading ? (
          <LoadingIndicator label="Loading catalog…" />
        ) : catalogQuery.isError ? (
          <p className="text-destructive text-sm">Could not load catalog.</p>
        ) : pickRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No matching items.</p>
        ) : (
          <ScrollArea className="h-[min(320px,calc(85vh-220px))] rounded-md border p-2">
            <ul className="space-y-1 pr-2">
              {pickRows.map((row) => (
                <li key={`${row.kind}-${row.id}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 py-2 text-left"
                    onClick={() => {
                      onPick({
                        requestable_type: row.kind,
                        requestable_id: row.id,
                        label: row.name,
                        allow_multiple_per_request:
                          row.allow_multiple_per_request,
                      });
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {row.name}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {row.groupName} ·{' '}
                        {row.kind === 'package' ? 'Package' : 'Document'}
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute('/applications/$applicationId')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    if (!checkPermission(permissions, DRS_STUDENT_APPLY_PERMISSION)) {
      throw redirect({ to: '/' });
    }
  },
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
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

  const app = appQuery.data;

  const handleCatalogPick = React.useCallback(
    (pick: {
      requestable_type: 'document' | 'package';
      requestable_id: number;
      label: string;
      allow_multiple_per_request: boolean;
    }) => {
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
    if (!app) return;
    setEmail(app.email);
    setContactNumber(app.contact_no);
    setReceiveMode(app.receive_mode);
    setDeliveryAddress(app.delivery_address ?? '');
    setPurpose(app.purpose ?? '');
    const next =
      app.lines?.map((l) => {
        const t = l.request_type === 'package' ? 'package' : 'document';
        const id = Number.parseInt(String(l.requestable_id ?? ''), 10);
        return {
          requestable_type: t,
          requestable_id: Number.isFinite(id) ? id : 0,
          quantity: l.quantity,
          label: l.request_name,
        };
      }) ?? [];
    setLines(next);
  }, [app]);

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
      toast.success('Request updated.');
    },
    onError: () => {
      toast.error('Failed to update request.');
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
      <div className="bg-background min-h-screen p-4">
        <LoadingIndicator label="Loading request…" variant="block" size="md" />
      </div>
    );
  }

  if (appQuery.isError || !app) {
    return (
      <div className="bg-background min-h-screen p-4">
        <p className="text-destructive text-sm">Could not load this request.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 px-2"
            onClick={() => void navigate({ to: '/' })}
          >
            <ArrowLeft className="h-4 w-4" />
            Applications
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Request details</CardTitle>
                <CardDescription>
                  Reference #{displayApplicationRef(app)} · Submitted{' '}
                  {app.created_at
                    ? new Date(app.created_at).toLocaleString()
                    : '—'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="font-normal capitalize">
                  {app.status}
                </Badge>
                {app.current_stage?.name ? (
                  <Badge variant="outline" className="font-normal">
                    {app.current_stage.name}
                  </Badge>
                ) : null}
                {app.is_paid ? (
                  <Badge className="font-normal">Paid</Badge>
                ) : (
                  <Badge variant="outline" className="font-normal">
                    Unpaid
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Student no.
                </p>
                <p className="font-medium">{app.student_no || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  School year / Sem
                </p>
                <p className="font-medium">
                  {app.school_year || '—'} · {app.semester || '—'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Lines</p>
              <ul className="mt-1 space-y-1 rounded-md border p-3">
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
            </div>
          </CardContent>
        </Card>

        {app.clearances && app.clearances.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clearances</CardTitle>
              <CardDescription>
                Status of each clearance department for this request.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {app.clearances.map((c) => (
                <div key={c.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{c.clearance_name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={c.status === 'cleared' ? 'default' : 'outline'}
                        className="font-normal capitalize"
                      >
                        {c.status}
                      </Badge>
                      {c.cleared_at ? (
                        <span className="text-muted-foreground text-xs">
                          {new Date(c.cleared_at).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {c.remarks ? (
                    <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm">
                      {c.remarks}
                    </p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Messages</CardTitle>
            <CardDescription>
              Chat with the registrar and any staff handling your request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationMessagesPanel
              applicationId={applicationId}
              viewerRole="student"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit request</CardTitle>
            <CardDescription>
              {editable
                ? 'While this request is still in its initial stage, you can change contact details and adjust requested items (add, remove, or change quantities).'
                : 'This request can no longer be edited.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editable}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact number</Label>
                <Input
                  id="contact"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  disabled={!editable}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Receive mode</Label>
              <Select
                value={receiveMode}
                onValueChange={(v) =>
                  setReceiveMode(v as 'email' | 'delivery' | 'pickup')
                }
                disabled={!editable}
              >
                <SelectTrigger className="w-full sm:max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {receiveMode === 'delivery' ? (
              <div className="space-y-2">
                <Label htmlFor="addr">Delivery address</Label>
                <Textarea
                  id="addr"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  disabled={!editable}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={!editable}
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Requested items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={!editable}
                  onClick={() => setAddCatalogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add document or package
                </Button>
              </div>
              <div className="space-y-2 rounded-md border p-3">
                {lines.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No items yet. Add at least one document or package to save.
                  </p>
                ) : null}
                {lines.map((line, idx) => (
                  <div
                    key={`${line.requestable_type}-${line.requestable_id}-${idx}`}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {line.label}
                    </p>
                    <div className="flex items-center gap-2 sm:w-auto">
                      <div className="flex items-center gap-2 sm:w-40">
                        <Label className="text-muted-foreground text-xs">
                          Qty
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={MAX_LINE_QTY}
                          value={line.quantity}
                          disabled={!editable}
                          onChange={(e) => {
                            const n = Number.parseInt(e.target.value, 10);
                            setLines((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? {
                                      ...row,
                                      quantity: Number.isFinite(n)
                                        ? Math.min(
                                            MAX_LINE_QTY,
                                            Math.max(1, n),
                                          )
                                        : 1,
                                    }
                                  : row,
                              ),
                            );
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive shrink-0"
                        disabled={!editable}
                        aria-label={`Remove ${line.label}`}
                        onClick={() =>
                          setLines((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              disabled={!canSubmitEdit}
              onClick={() => patchMutation.mutate()}
            >
              Save changes
            </Button>
          </CardContent>
        </Card>

        <AddCatalogLinesDialog
          open={addCatalogOpen}
          onOpenChange={setAddCatalogOpen}
          onPick={handleCatalogPick}
        />
      </div>
    </div>
  );
}
