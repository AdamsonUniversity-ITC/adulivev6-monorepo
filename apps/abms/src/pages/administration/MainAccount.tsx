import React, { useState, type JSX } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@repo/ui/components/table';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Badge } from '@repo/ui/components/badge';
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
    BookOpen, Plus, Pencil, Trash2, Search,
    ChevronLeft, ChevronRight, MoreHorizontal, Eye,
    ChevronDown, ChevronRight as ChevronRightIcon, Layers,
} from 'lucide-react';
import { mainAccountRoute } from '../../router';
import { financeSvc } from '@repo/axios-config/finance-service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MainAccount {
    id: number;
    account_code: string;
    account_name: string;
    SAP_account_no_acad: string | null;
    SAP_account_no_non_acad: string | null;
    is_consolidated_acct: boolean;
}

interface SubAccount {
    id: number;
    parent_id: number;
    account_code: string;
    account_name: string;
    account_group: string;
    is_qty_check: boolean;
}

interface CursorPage {
    data: MainAccount[];
    next_cursor: string | null;
    prev_cursor: string | null;
}

interface SubPage {
    data: SubAccount[];
    next_cursor: string | null;
}

type ViewTarget =
    | { type: 'main'; account: MainAccount }
    | { type: 'sub'; account: SubAccount };

const ACCOUNT_GROUPS = ['assets', 'liability', 'capital', 'expenses'] as const;
type AccountGroup = typeof ACCOUNT_GROUPS[number];

// ─────────────────────────────────────────────────────────────────────────────
// Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

const mainAccountSchema = z.object({
    account_code: z.string().min(1, 'Account code is required'),
    account_name: z.string().min(1, 'Account name is required'),
    SAP_account_no_acad: z.string().optional(),
    SAP_account_no_non_acad: z.string().optional(),
    is_consolidated_acct: z.boolean(),
});
type MainAccountFormData = z.infer<typeof mainAccountSchema>;

const subAccountSchema = z.object({
    account_code: z.string().min(1, 'Account code is required'),
    account_name: z.string().min(1, 'Account name is required'),
    account_group: z.enum(ACCOUNT_GROUPS, { errorMap: () => ({ message: 'Account group is required' }) }),
    is_qty_check: z.boolean(),
});
type SubAccountFormData = z.infer<typeof subAccountSchema>;

const MAIN_DEFAULTS: MainAccountFormData = {
    account_code: '', account_name: '',
    SAP_account_no_acad: '', SAP_account_no_non_acad: '',
    is_consolidated_acct: false,
};

const SUB_DEFAULTS: SubAccountFormData = {
    account_code: '', account_name: '',
    account_group: 'assets', is_qty_check: false,
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
        subRowBg: 'rgba(30, 58, 138, 0.06)',
        subRowHoverBg: 'rgba(59, 130, 246, 0.10)',
        subRowBorder: 'rgba(59, 130, 246, 0.12)',
        treeLine: 'rgba(59, 130, 246, 0.30)',
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
        titleColor: '#00082E',
        subColor: '#2C4A72',
        cardBg: 'rgba(240, 247, 255, 0.96)',
        cardBorder: 'rgba(59, 130, 246, 0.26)',
        cardShadow: '0 4px 32px rgba(0, 48, 135, 0.16)',
        cardHeaderBorder: 'rgba(59, 130, 246, 0.22)',
        cardTitleColor: '#00082E',
        tableHeadBg: 'rgba(196, 220, 255, 0.98)',
        tableHeadText: '#1740C0',
        tableHeadBorder: 'rgba(59, 130, 246, 0.28)',
        rowBorder: 'rgba(59, 130, 246, 0.13)',
        rowHoverBg: 'rgba(196, 220, 255, 0.50)',
        subRowBg: 'rgba(210, 228, 255, 0.35)',
        subRowHoverBg: 'rgba(186, 212, 255, 0.70)',
        subRowBorder: 'rgba(59, 130, 246, 0.18)',
        treeLine: 'rgba(23, 64, 192, 0.50)',
        cellText: '#00082E',
        inputBg: '#ffffff',
        inputBorder: 'rgba(59, 130, 246, 0.32)',
        inputText: '#00082E',
        labelColor: '#1740C0',
        dialogBg: '#EEF5FF',
        dialogBorder: 'rgba(59, 130, 246, 0.26)',
        mutedText: '#2C4A72',
    },
};

const GROUP_BADGE: Record<AccountGroup, JSX.Element> = {
    assets: <Badge className="bg-blue-600   hover:bg-blue-600   text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Assets</Badge>,
    liability: <Badge className="bg-amber-500  hover:bg-amber-500  text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Liability</Badge>,
    capital: <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Capital</Badge>,
    expenses: <Badge className="bg-rose-600   hover:bg-rose-600   text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Expenses</Badge>,
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MainAccount() {
    const loaderData = mainAccountRoute.useLoaderData();

    // ── Main account list ──────────────────────────────────────────────────────
    const [page, setPage] = useState<CursorPage>({ data: loaderData.data.data, next_cursor: loaderData.data.next_cursor, prev_cursor: null });
    const [search, setSearch] = useState('');
    const [cursors, setCursors] = useState<(string | null)[]>([null]);
    const [cursorIdx, setCursorIdx] = useState(0);
    const [loading, setLoading] = useState(false);

    // ── Tree ───────────────────────────────────────────────────────────────────
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [subMap, setSubMap] = useState<Record<number, SubPage>>({});
    const [subLoadingIds, setSubLoadingIds] = useState<Set<number>>(new Set());

    // ── Dialog / action state ──────────────────────────────────────────────────
    const [mainDialogOpen, setMainDialogOpen] = useState(false);
    const [mainEditTarget, setMainEditTarget] = useState<MainAccount | null>(null);
    const [mainDeleteTarget, setMainDeleteTarget] = useState<MainAccount | null>(null);
    const [mainDeleting, setMainDeleting] = useState(false);

    const [subDialogOpen, setSubDialogOpen] = useState(false);
    const [subCreateParent, setSubCreateParent] = useState<MainAccount | null>(null);
    const [subEditTarget, setSubEditTarget] = useState<SubAccount | null>(null);
    const [subDeleteTarget, setSubDeleteTarget] = useState<SubAccount | null>(null);
    const [subDeleting, setSubDeleting] = useState(false);

    const [viewTarget, setViewTarget] = useState<ViewTarget | null>(null);
    const [openMenuId, setOpenMenuId] = useState<{ id: number; type: 'main' | 'sub' } | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

    // ── Forms ──────────────────────────────────────────────────────────────────

    const mainForm = useForm<MainAccountFormData>({ resolver: zodResolver(mainAccountSchema), defaultValues: MAIN_DEFAULTS });
    const subForm = useForm<SubAccountFormData>({ resolver: zodResolver(subAccountSchema), defaultValues: SUB_DEFAULTS });
    const subEditTargetRef = React.useRef<SubAccount | null>(null);

    // ── Fetch main accounts ────────────────────────────────────────────────────

    const fetchPage = async (cursor: string | null, q: string) => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (q) params.search = q;
            if (cursor) params.cursor = cursor;
            const res = await financeSvc.get('/abms/main-accounts', { params });
            setPage(res.data);
        } catch {
            toast.error('Failed to load accounts', { description: 'Please refresh or contact support.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value); setCursors([null]); setCursorIdx(0); fetchPage(null, value);
    };
    const goNext = () => {
        if (!page.next_cursor) return;
        const next = [...cursors]; next[cursorIdx + 1] = page.next_cursor;
        setCursors(next); setCursorIdx(cursorIdx + 1); fetchPage(page.next_cursor, search);
    };
    const goPrev = () => {
        if (cursorIdx === 0) return;
        const idx = cursorIdx - 1; setCursorIdx(idx); fetchPage(cursors[idx], search);
    };

    // ── Fetch sub-accounts ─────────────────────────────────────────────────────

    const fetchSubs = async (parentId: number, cursor?: string | null) => {
        setSubLoadingIds(prev => new Set(prev).add(parentId));
        try {
            const params: Record<string, string> = { parent_id: String(parentId) };
            if (cursor) params.cursor = cursor;
            const res = await financeSvc.get('/abms/sub-accounts', { params });
            setSubMap(prev => ({
                ...prev,
                [parentId]: cursor
                    ? { data: [...(prev[parentId]?.data ?? []), ...res.data.data], next_cursor: res.data.next_cursor }
                    : res.data,
            }));
        } catch {
            toast.error('Failed to load sub-accounts');
        } finally {
            setSubLoadingIds(prev => { const s = new Set(prev); s.delete(parentId); return s; });
        }
    };

    const toggleExpand = (account: MainAccount) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(account.id)) { next.delete(account.id); return next; }
            next.add(account.id);
            if (!subMap[account.id]) fetchSubs(account.id);
            return next;
        });
    };

    // ── Main account CRUD ──────────────────────────────────────────────────────

    const openMainCreate = () => {
        setMainEditTarget(null); mainForm.reset(MAIN_DEFAULTS); setMainDialogOpen(true);
    };
    const openMainEdit = (a: MainAccount) => {
        setMainEditTarget(a);
        mainForm.reset({ account_code: a.account_code, account_name: a.account_name, SAP_account_no_acad: a.SAP_account_no_acad ?? '', SAP_account_no_non_acad: a.SAP_account_no_non_acad ?? '', is_consolidated_acct: a.is_consolidated_acct });
        setMainDialogOpen(true);
    };
    const onMainSubmit = async (formData: MainAccountFormData) => {
        try {
            if (mainEditTarget) {
                await financeSvc.put(`/abms/main-accounts/${mainEditTarget.id}`, formData);
                toast.success('Account updated', { description: 'Changes saved successfully.' });
            } else {
                await financeSvc.post('/abms/main-accounts', formData);
                toast.success('Account created', { description: `"${formData.account_name}" has been added.` });
            }
            setMainDialogOpen(false); fetchPage(cursors[cursorIdx], search);
        } catch (err: any) {
            toast.error(mainEditTarget ? 'Failed to update' : 'Failed to create', { description: err?.response?.data?.message ?? 'Please try again.' });
        }
    };
    const handleMainDelete = async () => {
        if (!mainDeleteTarget) return;
        setMainDeleting(true);
        try {
            await financeSvc.delete(`/abms/main-accounts/${mainDeleteTarget.id}`);
            toast.success('Account deleted', { description: `"${mainDeleteTarget.account_name}" and its sub-accounts have been removed.` });
            setMainDeleteTarget(null); fetchPage(cursors[cursorIdx], search);
        } catch { toast.error('Failed to delete', { description: 'Please try again.' }); }
        finally { setMainDeleting(false); }
    };

    // ── Sub-account CRUD ───────────────────────────────────────────────────────

    const openSubCreate = (parent: MainAccount) => {
        subEditTargetRef.current = null;
        setSubCreateParent(parent); setSubEditTarget(null); subForm.reset(SUB_DEFAULTS); setSubDialogOpen(true);
    };
    const openSubEdit = (a: SubAccount) => {
        subEditTargetRef.current = a;
        setSubEditTarget(a); setSubCreateParent(null);
        subForm.reset({ account_code: a.account_code, account_name: a.account_name, account_group: a.account_group as AccountGroup, is_qty_check: a.is_qty_check });
        setSubDialogOpen(true);
    };
    const onSubSubmit = async (formData: SubAccountFormData) => {
        const editTarget = subEditTargetRef.current;
        try {
            const parentId = editTarget?.parent_id ?? subCreateParent!.id;
            const payload = { ...formData, parent_id: parentId };
            if (editTarget) {
                await financeSvc.put(`/abms/sub-accounts/${editTarget.id}`, payload);
                toast.success('Sub-account updated', { description: 'Changes saved successfully.' });
            } else {
                await financeSvc.post('/abms/sub-accounts', payload);
                toast.success('Sub-account created', { description: `"${formData.account_name}" has been added.` });
            }
            setSubDialogOpen(false); fetchSubs(parentId);
        } catch (err: any) {
            toast.error(editTarget ? 'Failed to update' : 'Failed to create', { description: err?.response?.data?.message ?? 'Please try again.' });
        }
    };
    const handleSubDelete = async () => {
        if (!subDeleteTarget) return;
        setSubDeleting(true);
        try {
            await financeSvc.delete(`/abms/sub-accounts/${subDeleteTarget.id}`);
            toast.success('Sub-account deleted', { description: `"${subDeleteTarget.account_name}" has been removed.` });
            const parentId = subDeleteTarget.parent_id; setSubDeleteTarget(null); fetchSubs(parentId);
        } catch { toast.error('Failed to delete', { description: 'Please try again.' }); }
        finally { setSubDeleting(false); }
    };

    // ── Menu helpers ───────────────────────────────────────────────────────────

    const openMenu = (e: React.MouseEvent, id: number, type: 'main' | 'sub') => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 164 });
        setOpenMenuId({ id, type });
    };
    const closeMenu = () => { setOpenMenuId(null); setMenuPos(null); };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;

                const inputStyle = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.inputText };

                const ConsolidatedBadge = ({ value }: { value: boolean }) => (
                    value
                        ? <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Yes</Badge>
                        : <Badge className="bg-slate-500   hover:bg-slate-500   text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">No</Badge>
                );

                return (
                    <>
                        <Toaster position="bottom-right" richColors closeButton />

                        <div className="max-w-6xl mx-auto space-y-6">

                            {/* ── Page header ───────────────────────────────── */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: t.titleColor }}>
                                        Chart of Accounts
                                    </h1>
                                    <p className="text-sm mt-0.5" style={{ color: t.subColor }}>
                                        Manage main accounts and their sub-accounts in a tree view.
                                    </p>
                                </div>
                                <Button onClick={openMainCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20">
                                    <Plus className="w-4 h-4" /> Add Main Account
                                </Button>
                            </div>

                            {/* ── Card ──────────────────────────────────────── */}
                            <Card className="overflow-hidden backdrop-blur-sm" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
                                <CardHeader className="px-6 py-4 flex flex-row items-center gap-3" style={{ borderBottom: `1px solid ${t.cardHeaderBorder}` }}>
                                    <BookOpen className="w-4 h-4 shrink-0" style={{ color: t.tableHeadText }} />
                                    <CardTitle className="text-sm font-semibold tracking-wide" style={{ color: t.cardTitleColor }}>Account Tree</CardTitle>
                                    <div className="ml-auto flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: t.mutedText }} />
                                            <input type="text" placeholder="Search code or name…" value={search} onChange={e => handleSearch(e.target.value)} className="text-xs h-8 pl-8 pr-3 rounded-md outline-none w-52" style={inputStyle} />
                                        </div>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)', color: t.tableHeadText, border: `1px solid ${t.cardBorder}` }}>
                                            {page.data.length} records
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow style={{ background: t.tableHeadBg, borderBottom: `1px solid ${t.tableHeadBorder}` }}>
                                                {[
                                                    { label: 'Account Code' },
                                                    { label: 'Account Name' },
                                                    { label: 'SAP Acad / Group' },
                                                    { label: 'SAP Non-Acad / Qty' },
                                                    { label: 'Consolidated' },
                                                    { label: 'Actions' },
                                                ].map(col => (
                                                    <TableHead key={col.label} className="text-xs font-bold uppercase tracking-widest h-10 px-6" style={{ color: t.tableHeadText }}>
                                                        {col.label}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={6} className="text-center py-12 text-sm" style={{ color: t.mutedText }}>Loading…</TableCell></TableRow>
                                            ) : page.data.length === 0 ? (
                                                <TableRow><TableCell colSpan={6} className="text-center py-12 text-sm" style={{ color: t.mutedText }}>No accounts found.</TableCell></TableRow>
                                            ) : page.data.map(account => {
                                                const isExpanded = expandedIds.has(account.id);
                                                const subs = subMap[account.id];
                                                const subLoading = subLoadingIds.has(account.id);

                                                return (
                                                    <React.Fragment key={account.id}>

                                                        {/* ── Main account row ──────────────────── */}
                                                        <TableRow
                                                            className="transition-colors duration-150"
                                                            style={{ borderBottom: isExpanded ? 'none' : `1px solid ${t.rowBorder}` }}
                                                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)}
                                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                                        >
                                                            {/* Code + expand toggle */}
                                                            <TableCell className="px-4 py-3.5">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => toggleExpand(account)}
                                                                        className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all duration-150"
                                                                        style={{ color: t.tableHeadText, background: isExpanded ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.10)') : 'transparent', border: `1px solid ${isExpanded ? t.cardBorder : 'transparent'}` }}
                                                                        title={isExpanded ? 'Collapse sub-accounts' : 'Expand sub-accounts'}
                                                                    >
                                                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                                                                    </button>
                                                                    <span className="text-sm font-medium" style={{ color: t.cellText }}>
                                                                        {account.account_code}
                                                                    </span>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="px-6 py-3.5 text-sm font-medium" style={{ color: t.cellText }}>
                                                                {account.account_name}
                                                            </TableCell>

                                                            <TableCell className="px-6 py-3.5">
                                                                {account.SAP_account_no_acad
                                                                    ? <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">{account.SAP_account_no_acad}</Badge>
                                                                    : <span className="text-xs italic" style={{ color: t.mutedText }}>—</span>
                                                                }
                                                            </TableCell>

                                                            <TableCell className="px-6 py-3.5">
                                                                {account.SAP_account_no_non_acad
                                                                    ? <Badge className="bg-violet-600 hover:bg-violet-600 text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">{account.SAP_account_no_non_acad}</Badge>
                                                                    : <span className="text-xs italic" style={{ color: t.mutedText }}>—</span>
                                                                }
                                                            </TableCell>

                                                            <TableCell className="px-6 py-3.5">
                                                                <ConsolidatedBadge value={account.is_consolidated_acct} />
                                                            </TableCell>

                                                            <TableCell className="px-4 py-3.5">
                                                                <div className="flex items-center justify-center">
                                                                    <button
                                                                        onClick={e => openMenu(e, account.id, 'main')}
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

                                                        {/* ── Sub-account section ────────────────── */}
                                                        {isExpanded && (
                                                            <>
                                                                {/* Sub-account header strip */}
                                                                <TableRow style={{ background: isDark ? 'rgba(15,28,60,0.55)' : 'rgba(219,234,254,0.45)', borderBottom: `1px solid ${t.subRowBorder}`, borderTop: `1px solid ${t.subRowBorder}` }}>
                                                                    <TableCell colSpan={6} className="px-0 py-0">
                                                                        <div className="flex items-center gap-2 px-12 py-1.5">
                                                                            <Layers className="w-3 h-3 shrink-0" style={{ color: t.tableHeadText }} />
                                                                            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: t.tableHeadText }}>
                                                                                Sub-accounts — {account.account_code} · {account.account_name}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => openSubCreate(account)}
                                                                                className="ml-auto flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                                                                                style={{ color: '#ffffff', background: '#059669', border: 'none' }}
                                                                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#047857')}
                                                                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#059669')}
                                                                            >
                                                                                <Plus className="w-3 h-3" /> Add Sub Account
                                                                            </button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>

                                                                {subLoading ? (
                                                                    <TableRow style={{ background: t.subRowBg }}>
                                                                        <TableCell colSpan={6} className="py-5 text-center text-xs" style={{ color: t.mutedText }}>Loading sub-accounts…</TableCell>
                                                                    </TableRow>
                                                                ) : !subs || subs.data.length === 0 ? (
                                                                    <TableRow style={{ background: t.subRowBg, borderBottom: `1px solid ${t.rowBorder}` }}>
                                                                        <TableCell colSpan={6} className="py-5 text-center text-xs" style={{ color: t.mutedText }}>
                                                                            No sub-accounts yet — use "Add Sub Account" above.
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ) : (
                                                                    <>
                                                                        {subs.data.map(sub => (
                                                                            <TableRow
                                                                                key={sub.id}
                                                                                className="transition-colors duration-150"
                                                                                style={{ background: t.subRowBg, borderBottom: `1px solid ${t.subRowBorder}` }}
                                                                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = t.subRowHoverBg)}
                                                                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = t.subRowBg)}
                                                                            >
                                                                                {/* Code — indented with tree connector */}
                                                                                <TableCell className="px-4 py-3">
                                                                                    <div className="flex items-center">
                                                                                        <div className="w-5 shrink-0" />
                                                                                        {/* Tree line connector */}
                                                                                        <div
                                                                                            className="shrink-0 mr-2"
                                                                                            style={{ width: 14, height: 18, borderLeft: `1.5px solid ${t.treeLine}`, borderBottom: `1.5px solid ${t.treeLine}`, borderBottomLeftRadius: 4, marginBottom: -4 }}
                                                                                        />
                                                                                        <span className="text-sm font-medium" style={{ color: t.cellText }}>
                                                                                            {sub.account_code}
                                                                                        </span>
                                                                                    </div>
                                                                                </TableCell>

                                                                                {/* Name */}
                                                                                <TableCell className="px-6 py-3 text-sm font-medium" style={{ color: t.cellText }}>
                                                                                    {sub.account_name}
                                                                                </TableCell>

                                                                                {/* Group — reuses "SAP Acad" column */}
                                                                                <TableCell className="px-6 py-3">
                                                                                    {GROUP_BADGE[sub.account_group as AccountGroup] ?? <Badge variant="outline">{sub.account_group}</Badge>}
                                                                                </TableCell>

                                                                                {/* Qty Check — reuses "SAP Non-Acad" column */}
                                                                                <TableCell className="px-6 py-3">
                                                                                    {sub.is_qty_check
                                                                                        ? <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Yes</Badge>
                                                                                        : <Badge className="bg-slate-500   hover:bg-slate-500   text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">No</Badge>
                                                                                    }
                                                                                </TableCell>

                                                                                {/* Consolidated — empty for sub */}
                                                                                <TableCell className="px-6 py-3">
                                                                                    <span className="text-xs italic" style={{ color: t.mutedText }}>—</span>
                                                                                </TableCell>

                                                                                {/* Actions */}
                                                                                <TableCell className="px-4 py-3">
                                                                                    <div className="flex items-center justify-center">
                                                                                        <button
                                                                                            onClick={e => openMenu(e, sub.id, 'sub')}
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

                                                                        {/* Load more */}
                                                                        {subs.next_cursor && (
                                                                            <TableRow style={{ background: t.subRowBg, borderBottom: `1px solid ${t.rowBorder}` }}>
                                                                                <TableCell colSpan={6} className="py-2 text-center">
                                                                                    <button
                                                                                        onClick={() => fetchSubs(account.id, subs.next_cursor)}
                                                                                        className="text-xs font-semibold px-3 py-1 rounded transition-colors"
                                                                                        style={{ color: t.tableHeadText }}
                                                                                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.06)')}
                                                                                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                                                                                    >
                                                                                        Load more sub-accounts…
                                                                                    </button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {/* Bottom separator after expanded block */}
                                                                <TableRow style={{ borderBottom: `2px solid ${t.rowBorder}`, height: 0 }}>
                                                                    <TableCell colSpan={6} className="p-0" />
                                                                </TableRow>
                                                            </>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>

                                    {/* ── Pagination ────────────────────────────── */}
                                    <div className="flex items-center justify-end gap-2 px-6 py-3" style={{ borderTop: `1px solid ${t.cardHeaderBorder}` }}>
                                        <button onClick={goPrev} disabled={cursorIdx === 0} className="p-1.5 rounded-md transition-colors disabled:opacity-30" style={{ color: t.tableHeadText }}><ChevronLeft className="w-4 h-4" /></button>
                                        <span className="text-xs" style={{ color: t.mutedText }}>Page {cursorIdx + 1}</span>
                                        <button onClick={goNext} disabled={!page.next_cursor} className="p-1.5 rounded-md transition-colors disabled:opacity-30" style={{ color: t.tableHeadText }}><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── Context menu portal ──────────────────────────────── */}
                        {openMenuId !== null && menuPos && (() => {
                            if (openMenuId.type === 'main') {
                                const account = page.data.find(a => a.id === openMenuId.id);
                                if (!account) return null;
                                return (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={closeMenu} />
                                        <div className="fixed z-50 min-w-[164px] rounded-lg shadow-xl border py-1" style={{ top: menuPos.top, left: menuPos.left, background: t.dialogBg, borderColor: t.dialogBorder }}>
                                            <button onClick={() => { openSubCreate(account); closeMenu(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors" style={{ color: '#34d399' }}
                                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(52,211,153,0.10)' : 'rgba(22,163,74,0.07)')}
                                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                                                <Plus className="w-3.5 h-3.5" /> Add Sub Account
                                            </button>
                                            <div style={{ height: '1px', background: t.dialogBorder, margin: '2px 0' }} />
                                            <button onClick={() => { setViewTarget({ type: 'main', account }); closeMenu(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors" style={{ color: t.cellText }}
                                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.07)')}
                                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                            <button onClick={() => { openMainEdit(account); closeMenu(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors" style={{ color: t.tableHeadText }}
                                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.07)')}
                                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <div style={{ height: '1px', background: t.dialogBorder, margin: '2px 0' }} />
                                            <button onClick={() => { setMainDeleteTarget(account); closeMenu(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors" style={{ color: '#f87171' }}
                                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)')}
                                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        </div>
                                    </>
                                );
                            }

                            const sub = Object.values(subMap).flatMap(p => p.data).find(s => s.id === openMenuId.id);
                            if (!sub) return null;
                            return (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={closeMenu} />
                                    <div className="fixed z-50 min-w-[164px] rounded-lg shadow-xl border py-1" style={{ top: menuPos.top, left: menuPos.left, background: t.dialogBg, borderColor: t.dialogBorder }}>
                                        <button onClick={() => { setViewTarget({ type: 'sub', account: sub }); closeMenu(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors" style={{ color: t.cellText }}
                                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.07)')}
                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </button>
                                        <button onClick={() => { openSubEdit(sub); closeMenu(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors" style={{ color: t.tableHeadText }}
                                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.07)')}
                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <div style={{ height: '1px', background: t.dialogBorder, margin: '2px 0' }} />
                                        <button onClick={() => { setSubDeleteTarget(sub); closeMenu(); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors" style={{ color: '#f87171' }}
                                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)')}
                                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                </>
                            );
                        })()}

                        {/* ── View dialog ──────────────────────────────────────── */}
                        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
                            <DialogContent style={{ background: t.dialogBg, border: `1px solid ${t.dialogBorder}`, color: t.cellText }}>
                                <DialogHeader>
                                    <DialogTitle style={{ color: t.titleColor }}>
                                        {viewTarget?.type === 'main' ? 'Account Details' : 'Sub-Account Details'}
                                    </DialogTitle>
                                </DialogHeader>

                                {viewTarget?.type === 'main' && (
                                    <div className="space-y-4 py-2">
                                        {([
                                            { label: 'Account Code', value: viewTarget.account.account_code },
                                            { label: 'Account Name', value: viewTarget.account.account_name },
                                            { label: 'SAP Acad No.', value: viewTarget.account.SAP_account_no_acad ?? '—' },
                                            { label: 'SAP Non-Acad No.', value: viewTarget.account.SAP_account_no_non_acad ?? '—' },
                                        ] as { label: string; value: string }[]).map(({ label, value }) => (
                                            <div key={label} className="space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>{label}</p>
                                                <p className="text-sm" style={{ color: t.cellText }}>{value}</p>
                                            </div>
                                        ))}
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Consolidated</p>
                                            <ConsolidatedBadge value={viewTarget.account.is_consolidated_acct} />
                                        </div>
                                    </div>
                                )}

                                {viewTarget?.type === 'sub' && (
                                    <div className="space-y-4 py-2">
                                        {([
                                            { label: 'Account Code', value: viewTarget.account.account_code },
                                            { label: 'Account Name', value: viewTarget.account.account_name },
                                        ] as { label: string; value: string }[]).map(({ label, value }) => (
                                            <div key={label} className="space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>{label}</p>
                                                <p className="text-sm" style={{ color: t.cellText }}>{value}</p>
                                            </div>
                                        ))}
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Account Group</p>
                                            {GROUP_BADGE[viewTarget.account.account_group as AccountGroup] ?? <Badge variant="outline">{viewTarget.account.account_group}</Badge>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Qty Check</p>
                                            {viewTarget.account.is_qty_check
                                                ? <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Yes</Badge>
                                                : <Badge className="bg-slate-500   hover:bg-slate-500   text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">No</Badge>
                                            }
                                        </div>
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setViewTarget(null)} style={{ color: t.mutedText }}>Close</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* ── Main account dialog ───────────────────────────────── */}
                        <Dialog open={mainDialogOpen} onOpenChange={open => { if (!open) { mainForm.reset(MAIN_DEFAULTS); setMainEditTarget(null); } setMainDialogOpen(open); }}>
                            <DialogContent style={{ background: t.dialogBg, border: `1px solid ${t.dialogBorder}`, color: t.cellText }}>
                                <DialogHeader>
                                    <DialogTitle style={{ color: t.titleColor }}>{mainEditTarget ? 'Edit Main Account' : 'Add Main Account'}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={mainForm.handleSubmit(onMainSubmit, () => toast.error('Please fix the errors before submitting.'))} noValidate>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="m_code" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Account Code</Label>
                                            <Input id="m_code" placeholder="e.g. 1000" {...mainForm.register('account_code')} style={inputStyle} />
                                            {mainForm.formState.errors.account_code && <p className="text-xs text-red-500">{mainForm.formState.errors.account_code.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="m_name" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Account Name</Label>
                                            <Input id="m_name" placeholder="e.g. Cash and Cash Equivalents" {...mainForm.register('account_name')} style={inputStyle} />
                                            {mainForm.formState.errors.account_name && <p className="text-xs text-red-500">{mainForm.formState.errors.account_name.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="m_sap_acad" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>SAP Acad No.</Label>
                                            <Input id="m_sap_acad" placeholder="Optional" {...mainForm.register('SAP_account_no_acad')} style={inputStyle} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="m_sap_nonacad" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>SAP Non-Acad No.</Label>
                                            <Input id="m_sap_nonacad" placeholder="Optional" {...mainForm.register('SAP_account_no_non_acad')} style={inputStyle} />
                                        </div>
                                        <div className="flex items-center gap-3 pt-1">
                                            <input type="checkbox" id="m_consolidated" {...mainForm.register('is_consolidated_acct')} className="w-4 h-4 rounded accent-blue-600" />
                                            <Label htmlFor="m_consolidated" className="text-xs font-bold uppercase tracking-widest cursor-pointer" style={{ color: t.labelColor }}>Consolidated Account</Label>
                                        </div>
                                    </div>
                                    <DialogFooter className="pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setMainDialogOpen(false)} style={{ color: t.mutedText }}>Cancel</Button>
                                        <Button type="submit" disabled={mainForm.formState.isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            {mainForm.formState.isSubmitting ? 'Saving…' : mainEditTarget ? 'Save Changes' : 'Add Account'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* ── Sub-account dialog ────────────────────────────────── */}
                        <Dialog open={subDialogOpen} onOpenChange={open => { if (!open) { subEditTargetRef.current = null; subForm.reset(SUB_DEFAULTS); setSubEditTarget(null); setSubCreateParent(null); } setSubDialogOpen(open); }}>
                            <DialogContent style={{ background: t.dialogBg, border: `1px solid ${t.dialogBorder}`, color: t.cellText }}>
                                <DialogHeader>
                                    <DialogTitle style={{ color: t.titleColor }}>{subEditTarget ? 'Edit Sub Account' : 'Add Sub Account'}</DialogTitle>
                                    {(subCreateParent || subEditTarget) && (
                                        <p className="text-xs mt-1" style={{ color: t.mutedText }}>
                                            Under <span className="font-semibold" style={{ color: t.tableHeadText }}>
                                                {subCreateParent?.account_name ?? page.data.find(a => a.id === subEditTarget?.parent_id)?.account_name}
                                            </span>
                                        </p>
                                    )}
                                </DialogHeader>
                                <form onSubmit={subForm.handleSubmit(onSubSubmit, () => toast.error('Please fix the errors before submitting.'))} noValidate>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="s_code" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Account Code</Label>
                                            <Input id="s_code" placeholder="e.g. 1001" {...subForm.register('account_code')} style={inputStyle} />
                                            {subForm.formState.errors.account_code && <p className="text-xs text-red-500">{subForm.formState.errors.account_code.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="s_name" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Account Name</Label>
                                            <Input id="s_name" placeholder="e.g. Petty Cash" {...subForm.register('account_name')} style={inputStyle} />
                                            {subForm.formState.errors.account_name && <p className="text-xs text-red-500">{subForm.formState.errors.account_name.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="s_group" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>Account Group</Label>
                                            <select id="s_group" {...subForm.register('account_group')} className="w-full h-9 rounded-md px-3 text-sm outline-none capitalize" style={inputStyle}>
                                                {ACCOUNT_GROUPS.map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
                                            </select>
                                            {subForm.formState.errors.account_group && <p className="text-xs text-red-500">{subForm.formState.errors.account_group.message}</p>}
                                        </div>
                                        <div className="flex items-center gap-3 pt-1">
                                            <input type="checkbox" id="s_qty" {...subForm.register('is_qty_check')} className="w-4 h-4 rounded accent-blue-600" />
                                            <Label htmlFor="s_qty" className="text-xs font-bold uppercase tracking-widest cursor-pointer" style={{ color: t.labelColor }}>Quantity Check</Label>
                                        </div>
                                    </div>
                                    <DialogFooter className="pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setSubDialogOpen(false)} style={{ color: t.mutedText }}>Cancel</Button>
                                        <Button type="submit" disabled={subForm.formState.isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            {subForm.formState.isSubmitting ? 'Saving…' : subEditTarget ? 'Save Changes' : 'Add Sub Account'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* ── Main delete confirmation ──────────────────────────── */}
                        <AlertDialog open={!!mainDeleteTarget} onOpenChange={open => !open && setMainDeleteTarget(null)}>
                            <AlertDialogContent style={{ background: t.dialogBg, border: `1px solid ${t.dialogBorder}` }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle style={{ color: t.titleColor }}>Delete Main Account?</AlertDialogTitle>
                                    <AlertDialogDescription style={{ color: t.mutedText }}>
                                        This will soft-delete <span className="font-semibold" style={{ color: t.cellText }}>{mainDeleteTarget?.account_name}</span> and all its sub-accounts.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel style={{ color: t.mutedText }}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMainDelete} disabled={mainDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                                        {mainDeleting ? 'Deleting…' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* ── Sub delete confirmation ───────────────────────────── */}
                        <AlertDialog open={!!subDeleteTarget} onOpenChange={open => !open && setSubDeleteTarget(null)}>
                            <AlertDialogContent style={{ background: t.dialogBg, border: `1px solid ${t.dialogBorder}` }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle style={{ color: t.titleColor }}>Delete Sub-Account?</AlertDialogTitle>
                                    <AlertDialogDescription style={{ color: t.mutedText }}>
                                        This will soft-delete <span className="font-semibold" style={{ color: t.cellText }}>{subDeleteTarget?.account_name}</span>. This action can be undone from the database.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel style={{ color: t.mutedText }}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSubDelete} disabled={subDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                                        {subDeleting ? 'Deleting…' : 'Delete'}
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