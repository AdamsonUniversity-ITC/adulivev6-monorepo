import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { Label } from '@repo/ui/components/label';
import { Switch } from '@repo/ui/components/switch';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JSX, useEffect, useState } from 'react';
import {
  fetchRequestRestrictions,
  updateRequestRestrictions,
} from './-lib/api/fetchRequestRestrictions.ts';

const REQUEST_RESTRICTIONS_QUERY_KEY = ['request_restrictions'] as const;

export const RequestRestrictionsSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [blockWhileUnpaid, setBlockWhileUnpaid] = useState(false);

  const query = useQuery({
    queryKey: REQUEST_RESTRICTIONS_QUERY_KEY,
    queryFn: fetchRequestRestrictions,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      setBlockWhileUnpaid(query.data.block_while_unpaid);
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: (next: boolean) => updateRequestRestrictions(next),
    onSuccess: (data) => {
      toast.success('Request restrictions saved.');
      setBlockWhileUnpaid(data.block_while_unpaid);
      queryClient.setQueryData(REQUEST_RESTRICTIONS_QUERY_KEY, data);
    },
    onError: () => {
      toast.error('Failed to save request restrictions.');
      setBlockWhileUnpaid(query.data?.block_while_unpaid ?? false);
    },
  });

  const handleToggle = (checked: boolean) => {
    setBlockWhileUnpaid(checked);
    saveMutation.mutate(checked);
  };

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-semibold">
            Request restrictions
          </h2>
          <p className="text-muted-foreground text-sm">
            Tenant-wide rules that limit when students can request the same
            document or package again.
          </p>
        </div>

        {query.isLoading ? (
          <DrsInlineLoading size="sm" label="Loading restrictions…" />
        ) : query.isError ? (
          <p className="text-destructive text-sm">
            Failed to load request restrictions.
          </p>
        ) : (
          <div className="flex items-start justify-between gap-4 rounded-md border px-4 py-3">
            <div className="space-y-1">
              <Label htmlFor="block_while_unpaid">
                Block re-request while unpaid
              </Label>
              <p className="text-muted-foreground text-xs leading-snug">
                Students cannot request the same item again until their existing
                request for it is paid, cancelled, or disposed.
              </p>
            </div>
            <Switch
              id="block_while_unpaid"
              checked={blockWhileUnpaid}
              disabled={saveMutation.isPending}
              onCheckedChange={handleToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
};
