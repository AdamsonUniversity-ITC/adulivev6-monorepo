import { Badge } from '@repo/ui/components/badge';
import { JSX } from 'react';

import { resolveFlagIcon } from '../-lib/flag-icons.ts';
import type { DRSFlagDetail } from '../-lib/types/flag-definitions.ts';

type Props = {
  flagDetails?: DRSFlagDetail[];
  className?: string;
};

export function ApplicationFlagBadges({
  flagDetails = [],
  className,
}: Props): JSX.Element | null {
  if (flagDetails.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1">
        {flagDetails.map((flag) => {
          const Icon = resolveFlagIcon(flag.icon);
          return (
            <Badge
              key={flag.key}
              variant="secondary"
              title={flag.label}
              aria-label={flag.label}
              className="size-5 justify-center p-0"
            >
              {Icon ? (
                <Icon className="size-3 shrink-0" aria-hidden="true" />
              ) : (
                <span className="text-[10px] font-medium" aria-hidden="true">
                  {flag.label.slice(0, 1).toUpperCase()}
                </span>
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
