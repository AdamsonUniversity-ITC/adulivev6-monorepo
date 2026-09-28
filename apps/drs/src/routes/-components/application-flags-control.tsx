import { Button } from '@repo/ui/components/button';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { JSX, useState } from 'react';

import { fetchFlagDefinitions } from '../-lib/api/fetchFlagDefinitions.ts';
import { putApplicationFlags } from '../-lib/api/putApplicationFlags.ts';
import { resolveFlagIcon } from '../-lib/flag-icons.ts';
import type { DRSFlagDetail } from '../-lib/types/flag-definitions.ts';
import type { DRSApplicationRow } from '../-lib/types/applications.ts';
import { ManageFlagDefinitionsDialog } from './manage-flag-definitions-dialog.tsx';

export function normalizeFlagLabel(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function hasFlag(flags: string[] | undefined, flag: string): boolean {
  const target = normalizeFlagLabel(flag);
  return (flags ?? []).some((value) => normalizeFlagLabel(value) === target);
}

type Props = {
  applicationId: string;
  flags?: string[];
  flagDetails?: DRSFlagDetail[];
  className?: string;
};

export function ApplicationFlagsControl({
  applicationId,
  flags = [],
  flagDetails = [],
  className,
}: Props): JSX.Element {
  const queryClient = useQueryClient();
  const [manageOpen, setManageOpen] = useState(false);

  const definitionsQuery = useQuery({
    queryKey: ['drs-flag-definitions'],
    queryFn: fetchFlagDefinitions,
  });

  const definitions = definitionsQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: (nextFlags: string[]) =>
      putApplicationFlags(applicationId, nextFlags),
    onSuccess: (updated) => {
      const nextFlags = updated.flags ?? [];
      const nextDetails = updated.flag_details ?? [];
      queryClient.setQueryData(
        ['drs-employee-application', applicationId],
        (prev: unknown) => {
          if (!prev || typeof prev !== 'object') return prev;
          return {
            ...prev,
            flags: nextFlags,
            flag_details: nextDetails,
          };
        },
      );
      queryClient.setQueriesData(
        { queryKey: ['drs-employee-queue'] },
        (prev: unknown) => {
          if (!prev || typeof prev !== 'object') return prev;
          const record = prev as {
            rows?: DRSApplicationRow[];
            meta?: unknown;
          };
          if (!Array.isArray(record.rows)) return prev;
          return {
            ...record,
            rows: record.rows.map((row) =>
              row.id === applicationId
                ? {
                    ...row,
                    flags: nextFlags,
                    flag_details: nextDetails,
                  }
                : row,
            ),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ['drs-employee-queue'] });
    },
    onError: () => toast.error('Could not update flags.'),
  });

  const sync = (next: string[]) => {
    const unique = Array.from(
      new Set(next.map(normalizeFlagLabel).filter(Boolean)),
    ).slice(0, 10);
    mutation.mutate(unique);
  };

  const toggleFlag = (key: string) => {
    if (hasFlag(flags, key)) {
      sync(flags.filter((flag) => normalizeFlagLabel(flag) !== normalizeFlagLabel(key)));
    } else {
      sync([...flags, key]);
    }
  };

  const detailByKey = new Map(
    flagDetails.map((detail) => [normalizeFlagLabel(detail.key), detail]),
  );

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {definitions.map((def) => {
          const active = hasFlag(flags, def.key);
          const Icon = resolveFlagIcon(def.icon);
          return (
            <Button
              key={def.id}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              className="h-8 gap-1.5 px-2.5"
              disabled={mutation.isPending}
              aria-pressed={active}
              onClick={() => toggleFlag(def.key)}
            >
              {Icon ? (
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              ) : null}
              {def.label}
            </Button>
          );
        })}

        {flags
          .filter(
            (flag) =>
              !definitions.some(
                (def) => normalizeFlagLabel(def.key) === normalizeFlagLabel(flag),
              ),
          )
          .map((flag) => {
            const detail = detailByKey.get(normalizeFlagLabel(flag));
            const Icon = resolveFlagIcon(detail?.icon ?? null);
            return (
              <Button
                key={flag}
                type="button"
                size="sm"
                variant="default"
                className="h-8 gap-1.5 px-2.5"
                disabled={mutation.isPending}
                aria-pressed
                onClick={() => toggleFlag(flag)}
              >
                {Icon ? (
                  <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                ) : null}
                {detail?.label ?? flag}
              </Button>
            );
          })}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 px-2"
          disabled={mutation.isPending}
          onClick={() => setManageOpen(true)}
        >
          <Settings2 className="size-3.5" aria-hidden="true" />
          Manage flags
        </Button>
      </div>

      <ManageFlagDefinitionsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        definitions={definitions}
      />
    </div>
  );
}

export { ApplicationFlagBadges } from './application-flag-badges.tsx';
