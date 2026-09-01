import { FileText } from 'lucide-react';
import { CardHeader, CardTitle } from '@repo/ui/components/card';
import type { ThemeTokens } from '../types';
import { PageHeader as SharedPageHeader } from '../../../../components/ui/Page';

interface PageHeaderProps {
    sy: string;
    selectedDeptKind: 'Department' | 'Section' | '';
    t: ThemeTokens;
}

export function PageTitle({ sy, t }: { sy: string; t: ThemeTokens }) {
    void t;
    return (
        <SharedPageHeader
            className="budget-proposal-page-header"
            title="Budget Proposal Entry"
            description="Prepare and maintain proposed budget line items by organizational unit and account."
            actions={<span className="inline-flex min-h-11 items-center rounded-xl border border-[var(--abms-border)] bg-[var(--abms-surface)] px-4 text-sm font-bold text-[var(--abms-primary)]">School Year {sy}</span>}
        />
    );
}

export function PageCardHeader({ sy, selectedDeptKind, t }: PageHeaderProps) {
    const kindBadge = selectedDeptKind === 'Department'
        ? { bg: t.kindBadgeDeptBg, text: t.kindBadgeDeptText, border: t.kindBadgeDeptBorder }
        : { bg: t.kindBadgeSecBg, text: t.kindBadgeSecText, border: t.kindBadgeSecBorder };

    return (
        <CardHeader className="budget-proposal-records-header flex flex-row flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${t.cardHeaderBorder}` }}>
            <FileText className="h-5 w-5" style={{ color: t.tableHeadText }} />
            <CardTitle className="text-lg font-bold tracking-tight" style={{ color: t.cardTitleColor }}>
                Budget Proposal Entry
            </CardTitle>
            {selectedDeptKind && (
                <span className="rounded-lg border px-2.5 py-1 text-[13px] font-semibold" style={{ background: kindBadge.bg, color: kindBadge.text, borderColor: kindBadge.border }}>
                    {selectedDeptKind}
                </span>
            )}
            <span className="ml-auto rounded-lg px-3 py-1.5 text-[13px] font-semibold" style={{ background: t.sectionBadgeBg, color: t.sectionBadgeText, border: `1px solid ${t.sectionBadgeBorder}` }}>
                SY {sy}
            </span>
        </CardHeader>
    );
}
