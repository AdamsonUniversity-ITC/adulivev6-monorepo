import React from 'react';
import AdamsonBudgetLayout from '../../layouts/Screenlayout.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Badge } from '@repo/ui/components/badge';
import { Layers } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — mirrors the pattern in BudgetSettings.tsx / Screenlayout.tsx
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  dark: {
    // Page header
    titleColor: '#f1f5f9',
    subColor: '#94a3b8',
    // Card
    cardBg: 'rgba(11, 20, 38, 0.70)',
    cardBorder: 'rgba(59, 130, 246, 0.18)',
    cardShadow: '0 4px 32px rgba(37, 99, 235, 0.10)',
    cardHeaderBorder: 'rgba(59, 130, 246, 0.12)',
    cardTitleColor: '#e2e8f0',
    // Table
    tableHeadBg: 'rgba(8, 14, 26, 0.60)',
    tableHeadText: '#60a5fa',
    tableHeadBorder: 'rgba(59, 130, 246, 0.15)',
    rowBorder: 'rgba(59, 130, 246, 0.08)',
    rowHoverBg: 'rgba(59, 130, 246, 0.06)',
    cellText: '#cbd5e1',
    cellMuted: '#64748b',
    // Badge — budget enabled
    badgeEnabledBg: 'rgba(34, 197, 94, 0.12)',
    badgeEnabledText: '#4ade80',
    badgeEnabledBorder: 'rgba(34, 197, 94, 0.3)',
    // Badge — budget disabled
    badgeDisabledBg: 'rgba(100, 116, 139, 0.12)',
    badgeDisabledText: '#64748b',
    badgeDisabledBorder: 'rgba(100, 116, 139, 0.25)',
  },
  light: {
    // Page header
    titleColor: '#0f172a',
    subColor: '#64748b',
    // Card
    cardBg: 'rgba(255, 255, 255, 0.60)',
    cardBorder: 'rgba(59, 130, 246, 0.12)',
    cardShadow: '0 4px 24px rgba(0, 48, 135, 0.06)',
    cardHeaderBorder: 'rgba(59, 130, 246, 0.10)',
    cardTitleColor: '#0f172a',
    // Table
    tableHeadBg: 'rgba(239, 246, 255, 0.80)',
    tableHeadText: '#2563eb',
    tableHeadBorder: 'rgba(59, 130, 246, 0.12)',
    rowBorder: 'rgba(59, 130, 246, 0.06)',
    rowHoverBg: 'rgba(239, 246, 255, 0.60)',
    cellText: '#1e293b',
    cellMuted: '#94a3b8',
    // Badge — budget enabled
    badgeEnabledBg: 'rgba(22, 163, 74, 0.08)',
    badgeEnabledText: '#16a34a',
    badgeEnabledBorder: 'rgba(22, 163, 74, 0.25)',
    // Badge — budget disabled
    badgeDisabledBg: 'rgba(148, 163, 184, 0.10)',
    badgeDisabledText: '#94a3b8',
    badgeDisabledBorder: 'rgba(148, 163, 184, 0.25)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const STATIC_SECTIONS = [
  { code: 'CS-1A', name: 'Section 1A', department: 'Computer Science', isbudget: true },
  { code: 'CS-1B', name: 'Section 1B', department: 'Computer Science', isbudget: false },
  { code: 'IT-2A', name: 'Section 2A', department: 'Information Technology', isbudget: true },
  { code: 'IT-2B', name: 'Section 2B', department: 'Information Technology', isbudget: false },
  { code: 'CE-3A', name: 'Section 3A', department: 'Civil Engineering', isbudget: true },
  { code: 'ME-3B', name: 'Section 3B', department: 'Mechanical Engineering', isbudget: true },
  { code: 'EE-4A', name: 'Section 4A', department: 'Electrical Engineering', isbudget: false },
  { code: 'BA-1A', name: 'Section 1A', department: 'Business Administration', isbudget: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Sections() {
  return (
    <AdamsonBudgetLayout>
      {(isDark: boolean) => {
        const t = isDark ? T.dark : T.light;

        return (
          <div className="max-w-6xl mx-auto space-y-6">

            {/* ── Page header ───────────────────────────────────── */}
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: t.titleColor }}
              >
                Sections
              </h1>
              <p className="text-sm mt-0.5" style={{ color: t.subColor }}>
                Manage and view all registered sections.
              </p>
            </div>

            {/* ── Card ──────────────────────────────────────────── */}
            <Card
              className="overflow-hidden backdrop-blur-sm"
              style={{
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.cardShadow,
              }}
            >
              <CardHeader
                className="px-6 py-4 flex flex-row items-center gap-2"
                style={{ borderBottom: `1px solid ${t.cardHeaderBorder}` }}
              >
                <Layers className="w-4 h-4" style={{ color: t.tableHeadText }} />
                <CardTitle
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: t.cardTitleColor }}
                >
                  Section List
                </CardTitle>
                <span
                  className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
                    color: t.tableHeadText,
                    border: `1px solid ${t.cardBorder}`,
                  }}
                >
                  {STATIC_SECTIONS.length} records
                </span>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow
                      style={{
                        background: t.tableHeadBg,
                        borderBottom: `1px solid ${t.tableHeadBorder}`,
                      }}
                    >
                      {['Section Code', 'Section Name', 'Department', 'Budget Eligible'].map(col => (
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
                    {STATIC_SECTIONS.map((section, i) => (
                      <TableRow
                        key={i}
                        className="transition-colors duration-150"
                        style={{ borderBottom: `1px solid ${t.rowBorder}` }}
                        onMouseEnter={e =>
                          ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)
                        }
                        onMouseLeave={e =>
                          ((e.currentTarget as HTMLElement).style.background = 'transparent')
                        }
                      >
                        {/* Section Code */}
                        <TableCell
                          className="px-6 py-3.5 text-sm font-medium"
                          style={{ color: t.cellText }}
                        >
                          {section.code}
                        </TableCell>

                        {/* Section Name */}
                        <TableCell
                          className="px-6 py-3.5 text-sm font-medium"
                          style={{ color: t.cellText }}
                        >
                          {section.name}
                        </TableCell>

                        {/* Department */}
                        <TableCell
                          className="px-6 py-3.5 text-sm font-medium"
                          style={{ color: t.cellText }}
                        >
                          {section.department}
                        </TableCell>

                        {/* Budget Eligible (isbudget) */}
                        <TableCell className="px-6 py-3.5">
                          {section.isbudget
                            ? <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Eligible</Badge>
                            : <Badge className="bg-slate-500   hover:bg-slate-500   text-white font-semibold text-xs px-2.5 py-1 border-0 shadow-sm">Not Eligible</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>
        );
      }}
    </AdamsonBudgetLayout>
  );
}