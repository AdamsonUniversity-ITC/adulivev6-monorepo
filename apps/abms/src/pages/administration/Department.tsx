import React, { useState } from 'react';
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
import { Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { departmentRoute } from '../../router.tsx';
import { PageHeader } from '../../components/ui/Page';

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
    deptRowBg: 'rgba(59, 130, 246, 0.04)',
    cellText: '#cbd5e1',
    cellMuted: '#64748b',
    chevronColor: '#60a5fa',
    sectionIndentBorder: 'rgba(59, 130, 246, 0.25)',
    sectionRowBg: 'transparent',
    badgeEnabledBg: 'rgba(34, 197, 94, 0.12)',
    badgeEnabledText: '#4ade80',
    badgeEnabledBorder: 'rgba(34, 197, 94, 0.3)',
    badgeDisabledBg: 'rgba(100, 116, 139, 0.12)',
    badgeDisabledText: '#64748b',
    badgeDisabledBorder: 'rgba(100, 116, 139, 0.25)',
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
    deptRowBg: 'rgba(239, 246, 255, 0.30)',
    cellText: '#1e293b',
    cellMuted: '#94a3b8',
    chevronColor: '#2563eb',
    sectionIndentBorder: 'rgba(37, 99, 235, 0.25)',
    sectionRowBg: 'transparent',
    badgeEnabledBg: 'rgba(22, 163, 74, 0.08)',
    badgeEnabledText: '#16a34a',
    badgeEnabledBorder: 'rgba(22, 163, 74, 0.25)',
    badgeDisabledBg: 'rgba(148, 163, 184, 0.10)',
    badgeDisabledText: '#94a3b8',
    badgeDisabledBorder: 'rgba(148, 163, 184, 0.25)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Department {
  id: number;
  name: string;
  isbudget: number;
}

interface Section {
  id: number;
  name: string;
  isbudget: number;
  department_id: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Budget Badge
// ─────────────────────────────────────────────────────────────────────────────
function BudgetBadge({ isbudget, t }: { isbudget: number; t: typeof T.dark }) {
  return isbudget ? (
    <Badge
      className="text-xs font-semibold px-2.5 py-1 border"
      style={{
        background: t.badgeEnabledBg,
        color: t.badgeEnabledText,
        borderColor: t.badgeEnabledBorder,
      }}
    >
      Eligible
    </Badge>
  ) : (
    <Badge
      className="text-xs font-semibold px-2.5 py-1 border"
      style={{
        background: t.badgeDisabledBg,
        color: t.badgeDisabledText,
        borderColor: t.badgeDisabledBorder,
      }}
    >
      Not Eligible
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Department() {
  const response = departmentRoute.useLoaderData();

  const departments: Department[] = response.data?.departments ?? [];
  const sections: Section[]       = response.data?.sections ?? [];

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Filter sections per department on the frontend.
  // Cast both sides to Number to guard against string/number type mismatch
  // that can occur when values come from a JSON API response.
  const sectionsOf = (deptId: number) =>
    sections.filter(s => Number(s.department_id) === Number(deptId));

  return (
    <AdamsonBudgetLayout>
      {(isDark: boolean) => {
        const t = isDark ? T.dark : T.light;

        return (
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ── Page header ─────────────────────────────────── */}
            <PageHeader title="Departments & Sections" description="Click a department to view its sections." />

            {/* ── Card ────────────────────────────────────────── */}
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
                  Department List
                </CardTitle>
                <span
                  className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
                    color: t.tableHeadText,
                    border: `1px solid ${t.cardBorder}`,
                  }}
                >
                  {departments.length} records
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
                      {['Name', 'Budget Eligible'].map(col => (
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
                    {departments.map((dept: Department) => {
                      const isOpen      = expanded.has(dept.id);
                      const deptSections = sectionsOf(dept.id);

                      return (
                        <React.Fragment key={`dept-${dept.id}`}>

                          {/* ── Department Row ── */}
                          <TableRow
                            className="transition-colors duration-150 cursor-pointer select-none"
                            style={{
                              background: t.deptRowBg,
                              borderBottom: `1px solid ${t.rowBorder}`,
                            }}
                            onClick={() => toggle(dept.id)}
                            onMouseEnter={e =>
                              ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)
                            }
                            onMouseLeave={e =>
                              ((e.currentTarget as HTMLElement).style.background = t.deptRowBg)
                            }
                          >
                            {/* Name + chevron */}
                            <TableCell
                              className="px-6 py-3.5 text-sm font-semibold"
                              style={{ color: t.cellText }}
                            >
                              <div className="flex items-center gap-2">
                                {isOpen
                                  ? <ChevronDown  className="w-3.5 h-3.5 shrink-0" style={{ color: t.chevronColor }} />
                                  : <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: t.chevronColor }} />
                                }
                                {dept.name}
                                {deptSections.length > 0 && (
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                                    style={{
                                      background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
                                      color: t.chevronColor,
                                    }}
                                  >
                                    {deptSections.length}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Budget Eligible */}
                            <TableCell className="px-6 py-3.5">
                              <BudgetBadge isbudget={dept.isbudget} t={t} />
                            </TableCell>
                          </TableRow>

                          {/* ── Section Rows ── */}
                          {isOpen && (
                            deptSections.length === 0 ? (
                              <TableRow style={{ borderBottom: `1px solid ${t.rowBorder}` }}>
                                <TableCell
                                  colSpan={2}
                                  className="py-3 text-xs text-center"
                                  style={{ color: t.cellMuted, paddingLeft: '3.5rem' }}
                                >
                                  No sections found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              deptSections.map((sec: Section) => (
                                <TableRow
                                  key={`sec-${sec.id}`}
                                  className="transition-colors duration-150"
                                  style={{ borderBottom: `1px solid ${t.rowBorder}` }}
                                  onMouseEnter={e =>
                                    ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)
                                  }
                                  onMouseLeave={e =>
                                    ((e.currentTarget as HTMLElement).style.background = 'transparent')
                                  }
                                >
                                  {/* Indented section name */}
                                  <TableCell
                                    className="py-3 text-sm"
                                    style={{ color: t.cellText, paddingLeft: '3.5rem' }}
                                  >
                                    <div
                                      className="pl-3"
                                      style={{ borderLeft: `2px solid ${t.sectionIndentBorder}` }}
                                    >
                                      {sec.name}
                                    </div>
                                  </TableCell>

                                  {/* Budget Eligible */}
                                  <TableCell className="px-6 py-3">
                                    <BudgetBadge isbudget={sec.isbudget} t={t} />
                                  </TableCell>
                                </TableRow>
                              ))
                            )
                          )}

                        </React.Fragment>
                      );
                    })}
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
