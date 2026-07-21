import { ClipboardList, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/ui/components/table';
import type { LineItem, ThemeTokens } from '../types';

interface LineItemsTableProps {
    rows: LineItem[];
    isLoaded: boolean;
    isSaving: boolean;
    isWithinEntryPeriod: boolean;
    onRemoveRow: (id: number) => void;
    onUpdateRow: (id: number, field: keyof LineItem, value: string) => void;
    t: ThemeTokens;
}

export function LineItemsTable({ rows, isLoaded, isSaving, isWithinEntryPeriod, onRemoveRow, onUpdateRow, t }: LineItemsTableProps) {
    return (
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${t.gridLineHd}` }}>
            <Table>
                <TableHeader>
                    <TableRow style={{ background: t.tableHeadBg, borderBottom: `2px solid ${t.gridLineHd}` }}>
                        <TableHead className="text-xs font-bold uppercase tracking-widest h-10 w-12 text-center" style={{ color: t.tableHeadText, borderRight: `1px solid ${t.gridLineHd}` }}>#</TableHead>
                        {['Item / Description', 'PHP Unit Cost', 'Quantity', 'Units of Measurement', 'Total Amount'].map(col => (
                            <TableHead key={col} className="text-xs font-bold uppercase tracking-widest h-10 px-4" style={{ color: t.tableHeadText, borderRight: `1px solid ${t.gridLineHd}` }}>{col}</TableHead>
                        ))}
                        <TableHead className="text-xs font-bold uppercase tracking-widest h-10 w-12 text-center" style={{ color: t.tableHeadText }} />
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="py-16 text-center" style={{ background: t.emptyStateBg }}>
                                <div className="flex flex-col items-center gap-3">
                                    <ClipboardList className="w-9 h-9" style={{ color: 'var(--abms-border-strong)' }} />
                                    <p className="text-sm font-medium max-w-lg mx-auto" style={{ color: 'var(--abms-text-muted)' }}>
                                        {!isLoaded
                                            ? 'Select a department / section, main account, and sub account, then click Requery to load data.'
                                            : 'No items yet. Click "Add Row" below to start adding proposal items.'}
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row, idx) => (
                            <TableRow
                                key={row.id}
                                className="transition-colors duration-150"
                                style={{ background: idx % 2 === 0 ? t.cellBg : t.cellBgAlt, borderBottom: `1px solid ${t.gridLine}` }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? t.cellBg : t.cellBgAlt)}
                            >
                                <TableCell className="text-center text-xs font-mono w-12 py-2" style={{ color: t.rowNumText, background: t.rowNumBg, borderRight: `1px solid ${t.gridLineHd}` }}>{idx + 1}</TableCell>
                                <TableCell className="px-4 py-1.5" style={{ minWidth: '220px', borderRight: `1px solid ${t.gridLine}` }}>
                                    <input type="text" value={row.description} onChange={e => onUpdateRow(row.id, 'description', e.target.value)} placeholder="Enter item description..." readOnly={!isWithinEntryPeriod} className="w-full bg-transparent outline-none text-sm" style={{ color: t.cellText, cursor: !isWithinEntryPeriod ? 'default' : 'text' }} />
                                </TableCell>
                                <TableCell className="px-4 py-1.5" style={{ minWidth: '130px', borderRight: `1px solid ${t.gridLine}` }}>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium shrink-0" style={{ color: t.cellMuted }}>PHP</span>
                                        <input type="number" value={row.unitCost} onChange={e => onUpdateRow(row.id, 'unitCost', e.target.value)} placeholder="0.00" min="0" readOnly={!isWithinEntryPeriod} className="w-full bg-transparent outline-none text-sm text-left" style={{ color: t.cellText, cursor: !isWithinEntryPeriod ? 'default' : 'text' }} />
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-1.5" style={{ minWidth: '90px', borderRight: `1px solid ${t.gridLine}` }}>
                                    <input type="number" value={row.quantity} onChange={e => onUpdateRow(row.id, 'quantity', e.target.value)} placeholder="0" min="0" readOnly={!isWithinEntryPeriod} className="w-full bg-transparent outline-none text-sm text-left" style={{ color: t.cellText, cursor: !isWithinEntryPeriod ? 'default' : 'text' }} />
                                </TableCell>
                                <TableCell className="px-4 py-1.5" style={{ minWidth: '140px', borderRight: `1px solid ${t.gridLine}` }}>
                                    <input type="text" value={row.uom} onChange={e => onUpdateRow(row.id, 'uom', e.target.value)} placeholder="e.g. pcs, reams..." readOnly={!isWithinEntryPeriod} className="w-full bg-transparent outline-none text-sm text-center" style={{ color: t.cellText, cursor: !isWithinEntryPeriod ? 'default' : 'text' }} />
                                </TableCell>
                                <TableCell className="px-4 py-1.5" style={{ minWidth: '130px' }}>
                                    <span className="block w-full text-sm text-center font-medium font-mono" style={{ color: t.tableHeadText }}>
                                        {row.totalAmount ? `PHP ${parseFloat(row.totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '-'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center py-1.5 w-12">
                                    <button
                                        type="button"
                                        onClick={() => onRemoveRow(row.id)}
                                        disabled={!isWithinEntryPeriod || isSaving}
                                        title="Remove this item"
                                        className="inline-flex items-center justify-center rounded-md p-1.5 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ background: t.btnRemove.bg, border: `1px solid ${t.btnRemove.border}`, color: t.btnRemove.text }}
                                        onMouseEnter={e => {
                                            if (!isWithinEntryPeriod || isSaving) return;
                                            (e.currentTarget as HTMLElement).style.background = t.btnRemove.hover;
                                        }}
                                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = t.btnRemove.bg)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
