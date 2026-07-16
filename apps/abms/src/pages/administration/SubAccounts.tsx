import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@repo/ui/components/table';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from '@repo/ui/components/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@repo/ui/components/alert-dialog';
import { toast, Toaster } from 'sonner';
import {
    Layers, Plus, Pencil, Trash2, Search,
    ChevronLeft, ChevronRight, MoreHorizontal, Eye, ArrowLeft,
} from 'lucide-react';
import { subAccountsRoute } from '../../router';
import { useNavigate } from '@tanstack/react-router';
import { financeSvc } from '@repo/axios-config/finance-service';
import { Badge } from '@repo/ui/components/badge';
import { PageHeader } from '../../components/ui/Page';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SubAccount {
    id: number;
    parent_id: number;
    account_code: string;
    account_name: string;
    account_group: string;
    is_qty_check: boolean;
    parent?: { account_name: string; account_code: string };
}

interface CursorPage {
    data: SubAccount[];
    next_cursor: string | null;
    prev_cursor: string | null;
}

const ACCOUNT_GROUPS = ['assets', 'liability', 'capital', 'expenses'] as const;
type AccountGroup = typeof ACCOUNT_GROUPS[number];

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────

const subAccountSchema = z.object({
    account_code: z.string().min(1, 'Account code is required'),
    account_name: z.string().min(1, 'Account name is required'),
    account_group: z.enum(ACCOUNT_GROUPS, { errorMap: () => ({ message: 'Account group is required' }) }),
    is_qty_check: z.boolean(),
});

type SubAccountFormData = z.infer<typeof subAccountSchema>;

const EMPTY_DEFAULTS: SubAccountFormData = {
    account_code: '',
    account_name: '',
    account_group: 'assets',
    is_qty_check: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const T = {
    dark: {
        titleColor: '#f1f5f9',
        subColor: '#94a3b8',
        cardBg: 'rgba(11, 20, 38, 0.70)',
        cardBorder: 'rgba(59, 130, 246, 0.18)',
        cardShadow: '0 4px 32px rgba(37, 99, 235, 0.10)',
        cardHeaderBorder: 'rgba(59, 130, 246, 0.12)',
        cardTitleColor: '#e2e8f0',
        tableHeadBg: 'rgba(8, 14, 26, 0.60)',
        tableHeadText: '#60a5fa',
        tableHeadBorder: 'rgba(59, 130, 246, 0.15)',
        rowBorder: 'rgba(59, 130, 246, 0.08)',
        rowHoverBg: 'rgba(59, 130, 246, 0.06)',
        cellText: '#cbd5e1',
        inputBg: 'rgba(15, 23, 42, 0.90)',
        inputBorder: 'rgba(59, 130, 246, 0.22)',
        inputText: '#e2e8f0',
        labelColor: '#22d3ee',
        dialogBg: '#0b1426',
        dialogBorder: 'rgba(59, 130, 246, 0.2)',
        mutedText: '#64748b',
    },
    light: {
        titleColor: '#0f172a',
        subColor: '#64748b',
        cardBg: 'rgba(255, 255, 255, 0.60)',
        cardBorder: 'rgba(59, 130, 246, 0.12)',
        cardShadow: '0 4px 24px rgba(0, 48, 135, 0.06)',
        cardHeaderBorder: 'rgba(59, 130, 246, 0.10)',
        cardTitleColor: '#0f172a',
        tableHeadBg: 'rgba(239, 246, 255, 0.80)',
        tableHeadText: '#2563eb',
        tableHeadBorder: 'rgba(59, 130, 246, 0.12)',
        rowBorder: 'rgba(59, 130, 246, 0.06)',
        rowHoverBg: 'rgba(239, 246, 255, 0.60)',
        cellText: '#1e293b',
        inputBg: '#ffffff',
        inputBorder: 'rgba(59, 130, 246, 0.20)',
        inputText: '#0f172a',
        labelColor: '#2563eb',
        dialogBg: '#ffffff',
        dialogBorder: 'rgba(59, 130, 246, 0.15)',
        mutedText: '#94a3b8',
    },
};


// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SubAccounts() {
    const loaderData = subAccountsRoute.useLoaderData();
    const { parentId } = subAccountsRoute.useParams();
    const navigate = useNavigate();

    const [page, setPage] = useState<CursorPage>({ data: loaderData.data.data, next_cursor: loaderData.data.next_cursor, prev_cursor: null });
    const [parent] = useState(loaderData.parent);
    const [search, setSearch] = useState('');
    const [cursors, setCursors] = useState<(string | null)[]>([null]);
    const [cursorIdx, setCursorIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<SubAccount | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubAccount | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const [viewTarget, setViewTarget] = useState<SubAccount | null>(null);

    // ── Form ───────────────────────────────────────────────────────────────────

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SubAccountFormData>({
        resolver: zodResolver(subAccountSchema),
        defaultValues: EMPTY_DEFAULTS,
    });

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchPage = async (cursor: string | null, q: string) => {
        setLoading(true);
        try {
            const params: Record<string, string> = { parent_id: parentId };
            if (q) params.search = q;
            if (cursor) params.cursor = cursor;

            const res = await financeSvc.get('/abms/sub-accounts', { params });
            setPage(res.data);
        } catch {
            toast.error('Failed to load sub-accounts', { description: 'Please refresh or contact support.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setCursors([null]);
        setCursorIdx(0);
        fetchPage(null, value);
    };

    const goNext = () => {
        if (!page.next_cursor) return;
        const next = [...cursors];
        next[cursorIdx + 1] = page.next_cursor;
        setCursors(next);
        const newIdx = cursorIdx + 1;
        setCursorIdx(newIdx);
        fetchPage(page.next_cursor, search);
    };

    const goPrev = () => {
        if (cursorIdx === 0) return;
        const newIdx = cursorIdx - 1;
        setCursorIdx(newIdx);
        fetchPage(cursors[newIdx], search);
    };

    // ── Dialog ─────────────────────────────────────────────────────────────────

    const openCreate = () => {
        setEditTarget(null);
        reset(EMPTY_DEFAULTS);
        setDialogOpen(true);
    };

    const openEdit = (account: SubAccount) => {
        setEditTarget(account);
        reset({
            account_code: account.account_code,
            account_name: account.account_name,
            account_group: account.account_group as AccountGroup,
            is_qty_check: account.is_qty_check,
        });
        setDialogOpen(true);
    };

    const handleDialogClose = (open: boolean) => {
        if (!open) { reset(EMPTY_DEFAULTS); setEditTarget(null); }
        setDialogOpen(open);
    };

    const onSubmit = async (formData: SubAccountFormData) => {
        try {
            const payload = { ...formData, parent_id: Number(parentId) };
            if (editTarget) {
                await financeSvc.put(`/abms/sub-accounts/${editTarget.id}`, payload);
                toast.success('Sub-account updated', { description: 'Changes saved successfully.' });
            } else {
                await financeSvc.post('/abms/sub-accounts', payload);
                toast.success('Sub-account created', { description: `"${formData.account_name}" has been added.` });
            }
            setDialogOpen(false);
            fetchPage(cursors[cursorIdx], search);
        } catch (err: any) {
            toast.error(editTarget ? 'Failed to update' : 'Failed to create', {
                description: err?.response?.data?.message ?? 'Please try again or contact support.',
            });
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await financeSvc.delete(`/abms/sub-accounts/${deleteTarget.id}`);
            toast.success('Sub-account deleted', { description: `"${deleteTarget.account_name}" has been removed.` });
            setDeleteTarget(null);
            fetchPage(cursors[cursorIdx], search);
        } catch {
            toast.error('Failed to delete', { description: 'Please try again or contact support.' });
        } finally {
            setDeleting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;

                const inputStyle = {
                    background: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.inputText,
                };


                return (
                    <>
                        <Toaster position="bottom-right" richColors closeButton />

                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* ── Page header ─────────────────────────────────── */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate({ to: '/admin/main-account' })}
                                        className="p-1.5 rounded-md transition-colors"
                                        style={{ color: t.mutedText }}
                                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.07)')}
                                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <PageHeader
                                        title="Sub Accounts"
                                        description={<>
                                            Under{' '}
                                            <span className="font-semibold" style={{ color: t.tableHeadText }}>
                                                {parent?.account_code} — {parent?.account_name}
                                            </span>
                                        </>}
                                    />
                                </div>
                                <Button
                                    onClick={openCreate}
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    <Plus className="w-4 h-4" /> Add Sub Account
                                </Button>
                            </div>

                            {/* ── Card ────────────────────────────────────────── */}
                            <Card
                                className="overflow-hidden backdrop-blur-sm"
                                style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}
                            >
                                <CardHeader
                                    className="px-6 py-4 flex flex-row items-center gap-3"
                                    style={{ borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                                >
                                    <Layers className="w-4 h-4 shrink-0" style={{ color: t.tableHeadText }} />
                                    <CardTitle className="text-sm font-semibold tracking-wide" style={{ color: t.cardTitleColor }}>
                                        Sub Account List
                                    </CardTitle>

                                    <div className="ml-auto flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: t.mutedText }} />
                                            <input
                                                type="text"
                                                placeholder="Search code or name…"
                                                value={search}
                                                onChange={e => handleSearch(e.target.value)}
                                                className="text-xs h-8 pl-8 pr-3 rounded-md outline-none w-52"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <span
                                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                                            style={{ background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)', color: t.tableHeadText, border: `1px solid ${t.cardBorder}` }}
                                        >
                                            {page.data.length} records
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow style={{ background: t.tableHeadBg, borderBottom: `1px solid ${t.tableHeadBorder}` }}>
                                                {['Account Code', 'Account Name', 'Group', 'Qty Check', 'Actions'].map(col => (
                                                    <TableHead
                                                        key={col}
                                                        className="text-xs font-bold uppercase tracking-widest h-10 px-6"
                                                        style={{ color: t.tableHeadText }}
                                                    >
                                                        {col}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: t.mutedText }}>Loading…</TableCell>
                                                </TableRow>
                                            ) : page.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: t.mutedText }}>No sub-accounts found.</TableCell>
                                                </TableRow>
                                            ) : page.data.map(account => (
                                                <TableRow
                                                    key={account.id}
                                                    className="transition-colors duration-150"
                                                    style={{ borderBottom: `1px solid ${t.rowBorder}` }}
                                                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)}
                                                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                                >
                                                    <TableCell className="px-6 py-3.5 text-xs font-mono font-semibold tracking-wider" style={{ color: t.tableHeadText }}>
                                                        {account.account_code}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3.5 text-sm font-medium" style={{ color: t.cellText }}>
                                                        {account.account_name}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3.5">
                                                        {{
                                                            assets: <Badge variant="outline" className="capitalize border-blue-400/40 bg-blue-400/10 text-blue-400">assets</Badge>,
                                                            liability: <Badge variant="outline" className="capitalize border-yellow-400/40 bg-yellow-400/10 text-yellow-400">liability</Badge>,
                                                            capital: <Badge variant="outline" className="capitalize border-emerald-400/40 bg-emerald-400/10 text-emerald-400">capital</Badge>,
                                                            expenses: <Badge variant="outline" className="capitalize border-red-400/40 bg-red-400/10 text-red-400">expenses</Badge>,
                                                        }[account.account_group as AccountGroup] ?? <Badge variant="outline">{account.account_group}</Badge>}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3.5">
                                                        {account.is_qty_check
                                                            ? <Badge variant="outline" className="border-emerald-400/40 bg-emerald-400/10 text-emerald-400">Yes</Badge>
                                                            : <Badge variant="outline" className="border-slate-400/30 bg-slate-400/08 text-slate-400">No</Badge>
                                                        }
                                                    </TableCell>
                                                    <TableCell className="px-6 py-3.5">
                                                        <div className="flex items-center justify-end">
                                                            <button
                                                                onClick={e => {
                                                                    if (openMenuId === account.id) { setOpenMenuId(null); setMenuPos(null); }
                                                                    else {
                                                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                        setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
                                                                        setOpenMenuId(account.id);
                                                                    }
                                                                }}
                                                                className="p-1.5 rounded-md transition-colors"
                                                                style={{ color: t.mutedText }}
                                                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.07)')}
                                                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                                            >
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    <div className="flex items-center justify-end gap-2 px-6 py-3" style={{ borderTop: `1px solid ${t.cardHeaderBorder}` }}>
                                        <button onClick={goPrev} disabled={cursorIdx === 0} className="p-1.5 rounded-md transition-colors disabled:opacity-30" style={{ color: t.tableHeadText }}>
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs" style={{ color: t.mutedText }}>Page {cursorIdx + 1}</span>
                                        <button onClick={goNext} disabled={!page.next_cursor} className="p-1.5 rounded-md transition-colors disabled:opacity-30" style={{ color: t.tableHeadText }}>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── Three-dot dropdown portal ────────────────────── */}
                        {openMenuId !== null && menuPos && (() => {
                            const account = page.data.find(a => a.id === openMenuId)!;
                            return (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => { setOpenMenuId(null); setMenuPos(null); }} />
                                    <div
                                        className="fixed z-50 min-w-[160px] rounded-lg shadow-xl border py-1"
                                        style={{ top: menuPos.top, left: menuPos.left, background: t.dialogBg, borderColor: t.dialogBorder }}
                                    >
                                        <button
                                            onClick={() => { setViewTarget(account); setOpenMenuId(null); setMenuPos(null); }}
                                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                                            style={{ color: t.cellText }}
                                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.07)')}
                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                        >
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </button>
                                        <button
                                            onClick={() => { openEdit(account); setOpenMenuId(null); setMenuPos(null); }}
                                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                                            style={{ color: t.tableHeadText }}
                                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.07)')}
                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <div style={{ height: '1px', background: t.dialogBorder, margin: '2px 0' }} />
                                        <button
                                            onClick={() => { setDeleteTarget(account); setOpenMenuId(null); setMenuPos(null); }}
                                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                                            style={{ color: '#f87171' }}
                                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)')}
                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                </>
                            );
                        })()}

                        {/* ── View Dialog ──────────────────────────────────── */}
                        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
                            <DialogContent style={{ background: t.dialogBg, border: `1px solid ${t.dialogBorder}`, color: t.cellText }}>
                                <DialogHeader>
                                    <DialogTitle style={{ color: t.titleColor }}>Sub Account Details</DialogTitle>
                                </DialogHeader>
                                {viewTarget && (
                                    <div className="space-y-4 py-2">
                                        {([
                                            { label: 'Account Code', value: viewTarget.account_code },
                                            { label: 'Account Name', value: viewTarget.account_name },
                                            { label: 'Account Group', value: viewTarget.account_group },
                                        ] as { label: string; value: string }[]).map(({ label, value }) => (
                                            <div key={label} className="space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>{label}</p>
                                                <p className="text-sm capitalize" style={{ color: t.cellText }}>{value}</p>
                                            </div>
                                        ))}
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Qty Check</p>
                                            <div>
                                                {viewTarget.is_qty_check
                                                    ? <Badge variant="outline" className="border-emerald-400/40 bg-emerald-400/10 text-emerald-400">Yes</Badge>
                                                    : <Badge variant="outline" className="border-slate-400/30 bg-slate-400/10 text-slate-400">No</Badge>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setViewTarget(null)} style={{ color: t.mutedText }}>Close</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* ── Create / Edit Dialog ─────────────────────────── */}
                        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                            <DialogContent style={{ background: t.dialogBg, border: `1px solid ${t.dialogBorder}`, color: t.cellText }}>
                                <DialogHeader>
                                    <DialogTitle style={{ color: t.titleColor }}>
                                        {editTarget ? 'Edit Sub Account' : 'Add Sub Account'}
                                    </DialogTitle>
                                </DialogHeader>

                                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                                    <div className="space-y-4 py-2">

                                        {/* Account Code */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="account_code" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>
                                                Account Code
                                            </Label>
                                            <Input id="account_code" placeholder="e.g. 1001" {...register('account_code')} style={inputStyle} />
                                            {errors.account_code && <p className="text-xs text-red-500 mt-1">{errors.account_code.message}</p>}
                                        </div>

                                        {/* Account Name */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="account_name" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>
                                                Account Name
                                            </Label>
                                            <Input id="account_name" placeholder="e.g. Petty Cash" {...register('account_name')} style={inputStyle} />
                                            {errors.account_name && <p className="text-xs text-red-500 mt-1">{errors.account_name.message}</p>}
                                        </div>

                                        {/* Account Group */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="account_group" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>
                                                Account Group
                                            </Label>
                                            <select
                                                id="account_group"
                                                {...register('account_group')}
                                                className="w-full h-9 rounded-md px-3 text-sm outline-none capitalize"
                                                style={inputStyle}
                                            >
                                                {ACCOUNT_GROUPS.map(g => (
                                                    <option key={g} value={g} className="capitalize">{g}</option>
                                                ))}
                                            </select>
                                            {errors.account_group && <p className="text-xs text-red-500 mt-1">{errors.account_group.message}</p>}
                                        </div>

                                        {/* Qty Check */}
                                        <div className="flex items-center gap-3 pt-1">
                                            <input type="checkbox" id="is_qty_check" {...register('is_qty_check')} className="w-4 h-4 rounded accent-blue-600" />
                                            <Label htmlFor="is_qty_check" className="text-xs font-bold uppercase tracking-widest cursor-pointer" style={{ color: t.labelColor }}>
                                                Quantity Check
                                            </Label>
                                        </div>

                                    </div>

                                    <DialogFooter className="pt-2">
                                        <Button type="button" variant="ghost" onClick={() => handleDialogClose(false)} style={{ color: t.mutedText }}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            {isSubmitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Sub Account'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* ── Delete Confirmation ──────────────────────────── */}
                        <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                            <AlertDialogContent style={{ background: t.dialogBg, border: `1px solid ${t.dialogBorder}` }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle style={{ color: t.titleColor }}>Delete Sub Account?</AlertDialogTitle>
                                    <AlertDialogDescription style={{ color: t.mutedText }}>
                                        This will soft-delete{' '}
                                        <span className="font-semibold" style={{ color: t.cellText }}>{deleteTarget?.account_name}</span>.
                                        This action can be undone from the database.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel style={{ color: t.mutedText }}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                                        {deleting ? 'Deleting…' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                );
            }}
        </AdamsonBudgetLayout>
    );
}
