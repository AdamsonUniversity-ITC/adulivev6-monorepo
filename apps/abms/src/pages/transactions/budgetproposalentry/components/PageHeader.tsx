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
    return <SharedPageHeader title="Budget Proposal Entry" description={`For School Year: ${sy}`} />;
}

export function PageCardHeader({ sy, selectedDeptKind, t }: PageHeaderProps) {
    const kindBadge = selectedDeptKind === 'Department'
        ? { bg: t.kindBadgeDeptBg, text: t.kindBadgeDeptText, border: t.kindBadgeDeptBorder }
        : { bg: t.kindBadgeSecBg, text: t.kindBadgeSecText, border: t.kindBadgeSecBorder };

    return (
        <CardHeader className="flex flex-row items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${t.cardHeaderBorder}` }}>
            <FileText className="w-4 h-4" style={{ color: t.tableHeadText }} />
            <CardTitle className="text-sm font-semibold tracking-wide" style={{ color: t.cardTitleColor }}>
                Budget Proposal Entry
            </CardTitle>
            {selectedDeptKind && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ background: kindBadge.bg, color: kindBadge.text, borderColor: kindBadge.border }}>
                    {selectedDeptKind}
                </span>
            )}
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: t.sectionBadgeBg, color: t.sectionBadgeText, border: `1px solid ${t.sectionBadgeBorder}` }}>
                SY {sy}
            </span>
        </CardHeader>
    );
}
