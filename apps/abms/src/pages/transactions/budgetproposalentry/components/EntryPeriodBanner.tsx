import { CalendarClock, Lock } from 'lucide-react';
import { fmtDate } from '../utils';

interface EntryPeriodBannerProps {
    entryFrom: string;
    entryTo: string;
    isDark: boolean;
}

export function EntryPeriodBanner({ entryFrom, entryTo, isDark }: EntryPeriodBannerProps) {
    return (
        <div
            className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
            style={{
                background: 'rgba(234,88,12,0.08)',
                border: '1px solid rgba(234,88,12,0.28)',
                color: isDark ? '#fb923c' : '#ea580c',
            }}
        >
            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
                <p className="font-semibold">Budget entry is currently closed.</p>
                <p className="opacity-80 text-xs">
                    Entry window: <span className="font-medium">{fmtDate(entryFrom)}</span> to <span className="font-medium">{fmtDate(entryTo)}</span>
                </p>
            </div>
            <CalendarClock className="w-4 h-4 mt-0.5 ml-auto shrink-0 opacity-60" />
        </div>
    );
}
