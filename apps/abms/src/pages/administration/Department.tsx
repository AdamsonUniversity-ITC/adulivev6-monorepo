import React, { useMemo, useState } from 'react';
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
import {
  Layers,
  ChevronRight,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
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
    searchBg: 'rgba(8, 14, 26, 0.65)',
    searchBorder: 'rgba(59, 130, 246, 0.22)',
    searchText: '#e2e8f0',
    searchPlaceholder: '#64748b',
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
    searchBg: 'rgba(239, 246, 255, 0.75)',
    searchBorder: 'rgba(59, 130, 246, 0.20)',
    searchText: '#0f172a',
    searchPlaceholder: '#94a3b8',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Department {
  id: number;
  name: string;
  isbudget: number;
  division_id: number;
}

interface Section {
  id: number;
  name: string;
  isbudget: number;
  department_id: number;
}
interface Division {
  id: number;
  name: string;
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

  const divisions: Division[] =
    response.data?.divisions ?? [];

  const departments: Department[] =
    response.data?.departments ?? [];

  const sections: Section[] =
    response.data?.sections ?? [];

  const [searchQuery, setSearchQuery] = useState('');

  const [expandedDivisions, setExpandedDivisions] =
    useState<Set<number>>(new Set());

  const [expandedDepartments, setExpandedDepartments] =
    useState<Set<number>>(new Set());

  const toggleDivision = (id: number) => {
    setExpandedDivisions(prev => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleDepartment = (id: number) => {
    setExpandedDepartments(prev => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const departmentsOf = (divisionId: number) =>
    departments.filter(
      department =>
        Number(department.division_id) === Number(divisionId)
    );

  const sectionsOf = (departmentId: number) =>
    sections.filter(
      section =>
        Number(section.department_id) === Number(departmentId)
    );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const matchesSearch = (value: string | null | undefined) =>
    (value ?? '').toLowerCase().includes(normalizedSearch);
  const filteredHierarchy = useMemo(() => {
    /*
     * No search:
     * Return the complete hierarchy.
     */
    if (!normalizedSearch) {
      return divisions.map(division => ({
        division,
        departments: departmentsOf(division.id).map(department => ({
          department,
          sections: sectionsOf(department.id),
        })),
      }));
    }

    /*
     * Search behavior:
     *
     * Division match:
     *   Show every department and section under the division.
     *
     * Department match:
     *   Show the department and all its sections.
     *
     * Section match:
     *   Show only the matching sections under their parent department.
     */
    return divisions
      .map(division => {
        const divisionMatches = matchesSearch(division.name);

        const matchingDepartments = departmentsOf(division.id)
          .map(department => {
            const departmentMatches =
              matchesSearch(department.name);

            const departmentSections =
              sectionsOf(department.id);

            const matchingSections =
              divisionMatches || departmentMatches
                ? departmentSections
                : departmentSections.filter(section =>
                  matchesSearch(section.name)
                );

            if (
              !divisionMatches
              && !departmentMatches
              && matchingSections.length === 0
            ) {
              return null;
            }

            return {
              department,
              sections: matchingSections,
            };
          })
          .filter(
            (
              value
            ): value is {
              department: Department;
              sections: Section[];
            } => value !== null
          );

        if (!divisionMatches && matchingDepartments.length === 0) {
          return null;
        }

        return {
          division,
          departments: matchingDepartments,
        };
      })
      .filter(
        (
          value
        ): value is {
          division: Division;
          departments: {
            department: Department;
            sections: Section[];
          }[];
        } => value !== null
      );
  }, [
    divisions,
    departments,
    sections,
    normalizedSearch,
  ]);

  const isDivisionExpanded = (divisionId: number) =>
    normalizedSearch.length > 0
    || expandedDivisions.has(divisionId);

  const isDepartmentExpanded = (departmentId: number) =>
    normalizedSearch.length > 0
    || expandedDepartments.has(departmentId);

  return (
    <AdamsonBudgetLayout>
      {(isDark: boolean) => {
        const t = isDark ? T.dark : T.light;

        return (
          <div className="max-w-7xl mx-auto space-y-6">

            <PageHeader
              title="Divisions, Departments & Sections"
              description="Click a division to view its departments, then click a department to view its sections."
            />

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
                className="px-6 py-4 flex flex-row items-center gap-3"
                style={{
                  borderBottom: `1px solid ${t.cardHeaderBorder}`,
                }}
              >
                <Layers
                  className="w-4 h-4 shrink-0"
                  style={{ color: t.tableHeadText }}
                />

                <CardTitle
                  className="text-sm font-semibold tracking-wide shrink-0"
                  style={{ color: t.cardTitleColor }}
                >
                  Organizational Structure
                </CardTitle>

                {/* Search */}
                <div
                  className="relative ml-auto"
                  style={{
                    width: '100%',
                    maxWidth: 340,
                  }}
                >
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{
                      color: t.searchPlaceholder,
                    }}
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={event =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Search division, department, or section..."
                    style={{
                      width: '100%',
                      height: 36,
                      paddingLeft: 36,
                      paddingRight: searchQuery ? 36 : 12,
                      borderRadius: 9,
                      border: `1px solid ${t.searchBorder}`,
                      background: t.searchBg,
                      color: t.searchText,
                      fontSize: 12,
                      fontWeight: 500,
                      outline: 'none',
                    }}
                    onFocus={event => {
                      event.currentTarget.style.borderColor =
                        t.tableHeadText;
                    }}
                    onBlur={event => {
                      event.currentTarget.style.borderColor =
                        t.searchBorder;
                    }}
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
                      style={{
                        width: 24,
                        height: 24,
                        border: 'none',
                        borderRadius: 6,
                        background: 'transparent',
                        color: t.cellMuted,
                        cursor: 'pointer',
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: isDark
                      ? 'rgba(59,130,246,0.12)'
                      : 'rgba(37,99,235,0.08)',
                    color: t.tableHeadText,
                    border: `1px solid ${t.cardBorder}`,
                  }}
                >
                  {normalizedSearch
                    ? `${filteredHierarchy.length} result groups`
                    : `${divisions.length} divisions`}
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
                    {filteredHierarchy.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="py-12 text-center"
                        >
                          <div
                            className="flex flex-col items-center gap-2"
                            style={{ color: t.cellMuted }}
                          >
                            <Search className="w-6 h-6 opacity-50" />

                            <span className="text-sm font-semibold">
                              No organizational records found
                            </span>

                            {normalizedSearch && (
                              <span className="text-xs">
                                No division, department, or section matches
                                “{searchQuery}”.
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHierarchy.map(group => {
                        const division = group.division;
                        const divisionDepartments = group.departments;
                        const divisionOpen =
                          isDivisionExpanded(division.id);

                        return (
                          <React.Fragment key={`division-${division.id}`}>
                            {/* Division row */}
                            <TableRow
                              className="transition-colors duration-150 cursor-pointer select-none"
                              style={{
                                background: isDark
                                  ? 'rgba(37,99,235,0.12)'
                                  : 'rgba(219,234,254,0.65)',
                                borderBottom: `1px solid ${t.rowBorder}`,
                              }}
                              onClick={() => toggleDivision(division.id)}
                              onMouseEnter={event => {
                                event.currentTarget.style.background =
                                  t.rowHoverBg;
                              }}
                              onMouseLeave={event => {
                                event.currentTarget.style.background =
                                  isDark
                                    ? 'rgba(37,99,235,0.12)'
                                    : 'rgba(219,234,254,0.65)';
                              }}
                            >
                              <TableCell
                                className="px-6 py-4 text-sm font-bold"
                                style={{ color: t.titleColor }}
                              >
                                <div className="flex items-center gap-2">
                                  {divisionOpen ? (
                                    <ChevronDown
                                      className="w-4 h-4 shrink-0"
                                      style={{ color: t.chevronColor }}
                                    />
                                  ) : (
                                    <ChevronRight
                                      className="w-4 h-4 shrink-0"
                                      style={{ color: t.chevronColor }}
                                    />
                                  )}

                                  <Layers
                                    className="w-4 h-4 shrink-0"
                                    style={{ color: t.chevronColor }}
                                  />

                                  <span>{division.name}</span>

                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full ml-1"
                                    style={{
                                      background: isDark
                                        ? 'rgba(96,165,250,0.15)'
                                        : 'rgba(37,99,235,0.10)',
                                      color: t.chevronColor,
                                    }}
                                  >
                                    {divisionDepartments.length}{' '}
                                    {divisionDepartments.length === 1
                                      ? 'department'
                                      : 'departments'}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell
                                className="px-6 py-4 text-xs font-semibold"
                                style={{ color: t.cellMuted }}
                              >
                                Division
                              </TableCell>
                            </TableRow>

                            {/* Departments under the division */}
                            {divisionOpen && (
                              divisionDepartments.length === 0 ? (
                                <TableRow
                                  style={{
                                    borderBottom: `1px solid ${t.rowBorder}`,
                                  }}
                                >
                                  <TableCell
                                    colSpan={2}
                                    className="py-4 text-xs text-center"
                                    style={{
                                      color: t.cellMuted,
                                      paddingLeft: '3.5rem',
                                    }}
                                  >
                                    No departments found under this division.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                divisionDepartments.map(groupedDepartment => {
                                  const department =
                                    groupedDepartment.department;

                                  const departmentSections =
                                    groupedDepartment.sections;

                                  const departmentOpen =
                                    isDepartmentExpanded(department.id);

                                  return (
                                    <React.Fragment
                                      key={`department-${department.id}`}
                                    >
                                      {/* Department row */}
                                      <TableRow
                                        className="transition-colors duration-150 cursor-pointer select-none"
                                        style={{
                                          background: t.deptRowBg,
                                          borderBottom:
                                            `1px solid ${t.rowBorder}`,
                                        }}
                                        onClick={() =>
                                          toggleDepartment(department.id)
                                        }
                                        onMouseEnter={event => {
                                          event.currentTarget.style.background =
                                            t.rowHoverBg;
                                        }}
                                        onMouseLeave={event => {
                                          event.currentTarget.style.background =
                                            t.deptRowBg;
                                        }}
                                      >
                                        <TableCell
                                          className="py-3.5 text-sm font-semibold"
                                          style={{
                                            color: t.cellText,
                                            paddingLeft: '3rem',
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            {departmentOpen ? (
                                              <ChevronDown
                                                className="w-3.5 h-3.5 shrink-0"
                                                style={{
                                                  color: t.chevronColor,
                                                }}
                                              />
                                            ) : (
                                              <ChevronRight
                                                className="w-3.5 h-3.5 shrink-0"
                                                style={{
                                                  color: t.chevronColor,
                                                }}
                                              />
                                            )}

                                            <div
                                              className="pl-3"
                                              style={{
                                                borderLeft:
                                                  `2px solid ${t.sectionIndentBorder}`,
                                              }}
                                            >
                                              {department.name}
                                            </div>

                                            {departmentSections.length > 0 && (
                                              <span
                                                className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                                                style={{
                                                  background: isDark
                                                    ? 'rgba(59,130,246,0.12)'
                                                    : 'rgba(37,99,235,0.08)',
                                                  color: t.chevronColor,
                                                }}
                                              >
                                                {departmentSections.length}
                                              </span>
                                            )}
                                          </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-3.5">
                                          <BudgetBadge
                                            isbudget={department.isbudget}
                                            t={t}
                                          />
                                        </TableCell>
                                      </TableRow>

                                      {/* Sections under the department */}
                                      {departmentOpen && (
                                        departmentSections.length === 0 ? (
                                          <TableRow
                                            style={{
                                              borderBottom:
                                                `1px solid ${t.rowBorder}`,
                                            }}
                                          >
                                            <TableCell
                                              colSpan={2}
                                              className="py-3 text-xs text-center"
                                              style={{
                                                color: t.cellMuted,
                                                paddingLeft: '6rem',
                                              }}
                                            >
                                              No sections found.
                                            </TableCell>
                                          </TableRow>
                                        ) : (
                                          departmentSections.map(
                                            (section: Section) => (
                                              <TableRow
                                                key={`section-${section.id}`}
                                                className="transition-colors duration-150"
                                                style={{
                                                  borderBottom:
                                                    `1px solid ${t.rowBorder}`,
                                                }}
                                                onMouseEnter={event => {
                                                  event.currentTarget.style.background =
                                                    t.rowHoverBg;
                                                }}
                                                onMouseLeave={event => {
                                                  event.currentTarget.style.background =
                                                    'transparent';
                                                }}
                                              >
                                                <TableCell
                                                  className="py-3 text-sm"
                                                  style={{
                                                    color: t.cellText,
                                                    paddingLeft: '6rem',
                                                  }}
                                                >
                                                  <div
                                                    className="pl-3"
                                                    style={{
                                                      borderLeft:
                                                        `2px solid ${t.sectionIndentBorder}`,
                                                    }}
                                                  >
                                                    {section.name}
                                                  </div>
                                                </TableCell>

                                                <TableCell className="px-6 py-3">
                                                  <BudgetBadge
                                                    isbudget={section.isbudget}
                                                    t={t}
                                                  />
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )
                                        )
                                      )}
                                    </React.Fragment>
                                  );
                                }
                                )
                              )
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
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
