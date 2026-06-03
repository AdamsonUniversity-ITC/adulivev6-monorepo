import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ShoppingCart, Plus, Pencil, Trash2,
  ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight,
  MoreHorizontal, Eye,
} from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { officeSuppliesRoute } from '../../router';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OfficeSupply {
  id: number;
  item_code: string;
  item_name: string;
  unit_cost: string;
  unit_measurement: string;
}

interface CursorPage {
  data: OfficeSupply[];
  next_cursor: string | null;
  prev_cursor: string | null;
  per_page: number;
}

type SortDir = 'asc' | 'desc';

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────

const officeSupplySchema = z.object({
  item_name: z
    .string()
    .min(1, 'Item name is required'),
  unit_measurement: z
    .string()
    .min(1, 'Unit measurement is required'),
  unit_cost: z
    .string()
    .min(1, 'Unit cost is required')
    .refine(
      val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
      { message: 'Unit cost must be a valid non-negative number' }
    ),
});

type OfficeSupplyFormData = z.infer<typeof officeSupplySchema>;

const EMPTY_DEFAULTS: OfficeSupplyFormData = {
  item_name: '',
  unit_measurement: '',
  unit_cost: '',
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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function OfficeSupplies() {
  const loaderData = officeSuppliesRoute.useLoaderData();

  const [page, setPage] = useState<CursorPage | null>(loaderData.data as CursorPage);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [cursorIdx, setCursorIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OfficeSupply | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfficeSupply | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<OfficeSupply | null>(null);

  // ── react-hook-form ────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OfficeSupplyFormData>({
    resolver: zodResolver(officeSupplySchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPage = useCallback(async (cursor: string | null) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort: sortDir };
      if (search) params.search = search;
      if (cursor) params.cursor = cursor;

      const res = await financeSvc.get('/abms/office-supplies', { params });
      setPage(res.data);
    } catch {
      toast.error('Failed to load office supplies', {
        description: 'Please refresh the page or contact support.',
      });
    } finally {
      setLoading(false);
    }
  }, [search, sortDir]);

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCursors([null]);
    setCursorIdx(0);
  }, [search, sortDir]);

  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    fetchPage(cursors[cursorIdx]);
  }, [cursors, cursorIdx, fetchPage]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const goNext = () => {
    if (!page?.next_cursor) return;
    const next = [...cursors];
    next[cursorIdx + 1] = page.next_cursor;
    setCursors(next);
    setCursorIdx(i => i + 1);
  };

  const goPrev = () => {
    if (cursorIdx === 0) return;
    setCursorIdx(i => i - 1);
  };

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    reset(EMPTY_DEFAULTS);
    setDialogOpen(true);
  };

  const openEdit = (supply: OfficeSupply) => {
    setEditTarget(supply);
    reset({
      item_name: supply.item_name,
      unit_measurement: supply.unit_measurement,
      unit_cost: supply.unit_cost,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: OfficeSupplyFormData) => {
    try {
      if (editTarget) {
        await financeSvc.put(`/abms/office-supplies/${editTarget.id}`, formData);
        toast.success('Item updated', {
          description: 'Changes have been saved successfully.',
        });
      } else {
        await financeSvc.post('/abms/office-supplies', formData);
        toast.success('Item added', {
          description: `"${formData.item_name}" has been added to the supply list.`,
        });
      }
      setDialogOpen(false);
      fetchPage(cursors[cursorIdx]);
    } catch (err: any) {
      toast.error(editTarget ? 'Failed to update item' : 'Failed to add item', {
        description:
          err?.response?.data?.message ?? 'Please try again or contact support.',
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset(EMPTY_DEFAULTS);
      setEditTarget(null);
    }
    setDialogOpen(open);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await financeSvc.delete(`/abms/office-supplies/${deleteTarget.id}`);
      toast.success('Item deleted', {
        description: `"${deleteTarget.item_name}" has been removed from the supply list.`,
      });
      setDeleteTarget(null);
      fetchPage(cursors[cursorIdx]);
    } catch {
      toast.error('Failed to delete item', {
        description: 'Please try again or contact support.',
      });
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

        const SortIcon = sortDir === 'asc' ? ArrowUp : ArrowDown;

        return (
          <>
            <Toaster position="bottom-right" richColors closeButton />

            <div className="max-w-6xl mx-auto space-y-6">

              {/* ── Page header ─────────────────────────────────── */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: t.titleColor }}>
                    Office Supplies
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: t.subColor }}>
                    Manage office supply items and pricing.
                  </p>
                </div>
                <Button
                  onClick={openCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              </div>

              {/* ── Card ────────────────────────────────────────── */}
              <Card
                className="overflow-hidden backdrop-blur-sm"
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.cardBorder}`,
                  boxShadow: t.cardShadow,
                }}
              >
                {/* Card header — search + sort */}
                <CardHeader
                  className="px-6 py-4 flex flex-row items-center gap-3"
                  style={{ borderBottom: `1px solid ${t.cardHeaderBorder}` }}
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" style={{ color: t.tableHeadText }} />
                  <CardTitle className="text-sm font-semibold tracking-wide" style={{ color: t.cardTitleColor }}>
                    Supply List
                  </CardTitle>

                  <div className="ml-auto flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                        style={{ color: t.mutedText }}
                      />
                      <input
                        type="text"
                        placeholder="Search code, name, unit…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="text-xs h-8 pl-8 pr-3 rounded-md outline-none w-56"
                        style={inputStyle}
                      />
                    </div>

                    {/* Sort toggle */}
                    <button
                      onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                      className="flex items-center gap-1.5 text-xs h-8 px-3 rounded-md border transition-colors"
                      style={{
                        background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.06)',
                        borderColor: t.cardBorder,
                        color: t.tableHeadText,
                      }}
                    >
                      <SortIcon className="w-3 h-3" />
                      Price {sortDir === 'asc' ? 'Low→High' : 'High→Low'}
                    </button>

                    {/* Record count */}
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
                        color: t.tableHeadText,
                        border: `1px solid ${t.cardBorder}`,
                      }}
                    >
                      {page?.data.length ?? 0} records
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: t.tableHeadBg, borderBottom: `1px solid ${t.tableHeadBorder}` }}>
                        {['Item Code', 'Item Name', 'Unit Measurement', 'Unit Cost'].map(col => (
                          <TableHead
                            key={col}
                            className="text-xs font-bold uppercase tracking-widest h-10 px-6"
                            style={{ color: t.tableHeadText }}
                          >
                            {col}
                          </TableHead>
                        ))}
                        <TableHead
                          className="text-xs font-bold uppercase tracking-widest h-10 px-6 text-right"
                          style={{ color: t.tableHeadText }}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: t.mutedText }}>
                            Loading…
                          </TableCell>
                        </TableRow>
                      ) : page?.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-sm" style={{ color: t.mutedText }}>
                            No records found.
                          </TableCell>
                        </TableRow>
                      ) : page?.data.map(supply => (
                        <TableRow
                          key={supply.id}
                          className="transition-colors duration-150"
                          style={{ borderBottom: `1px solid ${t.rowBorder}` }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                        >
                          <TableCell className="px-6 py-3.5 text-sm font-medium" style={{ color: t.cellText }}>
                            {supply.item_code}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm font-medium" style={{ color: t.cellText }}>
                            {supply.item_name}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm font-medium" style={{ color: t.cellText }}>
                            {supply.unit_measurement}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm font-semibold" style={{ color: t.tableHeadText }}>
                            ₱{parseFloat(supply.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-right">
                            <div className="relative flex items-center justify-end">
                              <button
                                onClick={e => {
                                  if (openMenuId === supply.id) {
                                    setOpenMenuId(null);
                                    setMenuPos(null);
                                  } else {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    setMenuPos({ top: rect.bottom + 4, left: rect.right - 140 });
                                    setOpenMenuId(supply.id);
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
                  <div
                    className="flex items-center justify-end gap-2 px-6 py-3"
                    style={{ borderTop: `1px solid ${t.cardHeaderBorder}` }}
                  >
                    <button
                      onClick={goPrev}
                      disabled={cursorIdx === 0}
                      className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                      style={{ color: t.tableHeadText }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs" style={{ color: t.mutedText }}>
                      Page {cursorIdx + 1}
                    </span>
                    <button
                      onClick={goNext}
                      disabled={!page?.next_cursor}
                      className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                      style={{ color: t.tableHeadText }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Three-dot dropdown portal ────────────────────── */}
            {openMenuId !== null && menuPos && (() => {
              const supply = page?.data.find(s => s.id === openMenuId)!;
              return (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => { setOpenMenuId(null); setMenuPos(null); }}
                  />
                  <div
                    className="fixed z-50 min-w-[140px] rounded-lg shadow-xl border py-1"
                    style={{ top: menuPos.top, left: menuPos.left, background: t.dialogBg, borderColor: t.dialogBorder }}
                  >
                    <button
                      onClick={() => { setViewTarget(supply); setOpenMenuId(null); setMenuPos(null); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                      style={{ color: t.cellText }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.07)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => { openEdit(supply); setOpenMenuId(null); setMenuPos(null); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                      style={{ color: t.tableHeadText }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.07)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <div style={{ height: '1px', background: t.dialogBorder, margin: '2px 0' }} />
                    <button
                      onClick={() => { setDeleteTarget(supply); setOpenMenuId(null); setMenuPos(null); }}
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
                  <DialogTitle style={{ color: t.titleColor }}>Item Details</DialogTitle>
                </DialogHeader>
                {viewTarget && (
                  <div className="space-y-4 py-2">
                    {([
                      { label: 'Item Code', value: viewTarget.item_code },
                      { label: 'Item Name', value: viewTarget.item_name },
                      { label: 'Unit Measurement', value: viewTarget.unit_measurement },
                      { label: 'Unit Cost', value: `₱${parseFloat(viewTarget.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
                    ] as { label: string; value: string }[]).map(({ label, value }) => (
                      <div key={label} className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>{label}</p>
                        <p className="text-sm" style={{ color: t.cellText }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setViewTarget(null)} style={{ color: t.mutedText }}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── Create / Edit Dialog ─────────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogContent
                style={{
                  background: t.dialogBg,
                  border: `1px solid ${t.dialogBorder}`,
                  color: t.cellText,
                }}
              >
                <DialogHeader>
                  <DialogTitle style={{ color: t.titleColor }}>
                    {editTarget ? 'Edit Item' : 'Add Item'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="space-y-4 py-2">

                    {/* Read-only item code shown when editing */}
                    {editTarget && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-widest" style={{ color: t.mutedText }}>
                          Item Code
                        </Label>
                        <p className="text-sm font-mono font-semibold" style={{ color: t.tableHeadText }}>
                          {editTarget.item_code}
                        </p>
                      </div>
                    )}

                    {/* Item Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="item_name" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>
                        Item Name
                      </Label>
                      <Input
                        id="item_name"
                        placeholder="e.g. Bond Paper"
                        {...register('item_name')}
                        style={inputStyle}
                      />
                      {errors.item_name && (
                        <p className="text-xs text-red-500 mt-1">{errors.item_name.message}</p>
                      )}
                    </div>

                    {/* Unit Measurement */}
                    <div className="space-y-1.5">
                      <Label htmlFor="unit_measurement" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>
                        Unit Measurement
                      </Label>
                      <Input
                        id="unit_measurement"
                        placeholder="e.g. Ream, Box, Piece"
                        {...register('unit_measurement')}
                        style={inputStyle}
                      />
                      {errors.unit_measurement && (
                        <p className="text-xs text-red-500 mt-1">{errors.unit_measurement.message}</p>
                      )}
                    </div>

                    {/* Unit Cost */}
                    <div className="space-y-1.5">
                      <Label htmlFor="unit_cost" className="text-xs font-bold uppercase tracking-widest" style={{ color: t.labelColor }}>
                        Unit Cost (₱)
                      </Label>
                      <Input
                        id="unit_cost"
                        placeholder="e.g. 250.00"
                        {...register('unit_cost')}
                        style={inputStyle}
                      />
                      {errors.unit_cost && (
                        <p className="text-xs text-red-500 mt-1">{errors.unit_cost.message}</p>
                      )}
                    </div>

                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleDialogClose(false)}
                      style={{ color: t.mutedText }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Item'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
              <AlertDialogContent
                style={{
                  background: t.dialogBg,
                  border: `1px solid ${t.dialogBorder}`,
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle style={{ color: t.titleColor }}>Delete Item?</AlertDialogTitle>
                  <AlertDialogDescription style={{ color: t.mutedText }}>
                    This will soft-delete{' '}
                    <span className="font-semibold" style={{ color: t.cellText }}>
                      {deleteTarget?.item_name}
                    </span>
                    . This action can be undone from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel style={{ color: t.mutedText }}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
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