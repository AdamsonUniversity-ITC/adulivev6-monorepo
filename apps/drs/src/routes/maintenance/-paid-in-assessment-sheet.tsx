import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Label } from '@repo/ui/components/label';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JSX, useEffect, useMemo, useState } from 'react';
import {
  fetchPaidInAssessmentSettings,
  updatePaidInAssessmentSettings,
} from './-lib/api/fetchPaidInAssessmentSettings.ts';
import { fetchWorkflowStages } from './-lib/api/workflow/fetchStages.ts';
import { STAGES_QUERY_KEY, sortedStages } from './-workflow/-utils.ts';

const SETTINGS_QUERY_KEY = ['paid_in_assessment_settings'] as const;

const sameIds = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
};

export const PaidInAssessmentSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const settingsQuery = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchPaidInAssessmentSettings,
    refetchOnWindowFocus: false,
  });

  const stagesQuery = useQuery({
    queryKey: STAGES_QUERY_KEY,
    queryFn: fetchWorkflowStages,
    refetchOnWindowFocus: false,
  });

  const stages = useMemo(
    () => sortedStages(stagesQuery.data),
    [stagesQuery.data],
  );

  useEffect(() => {
    if (!settingsQuery.data) return;
    setSelectedIds(settingsQuery.data.paid_in_assessment_skip_stage_ids);
  }, [settingsQuery.data]);

  const savedIds =
    settingsQuery.data?.paid_in_assessment_skip_stage_ids ?? [];
  const dirty = !sameIds(selectedIds, savedIds);

  const saveMutation = useMutation({
    mutationFn: () => updatePaidInAssessmentSettings(selectedIds),
    onSuccess: (data) => {
      toast.success('Paid in assessment settings saved.');
      setSelectedIds(data.paid_in_assessment_skip_stage_ids);
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
    },
    onError: () => {
      toast.error('Failed to save paid in assessment settings.');
    },
  });

  const toggleStage = (stageId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(stageId) ? current : [...current, stageId];
      }
      return current.filter((id) => id !== stageId);
    });
  };

  const loading = settingsQuery.isLoading || stagesQuery.isLoading;
  const error = settingsQuery.isError || stagesQuery.isError;

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-semibold">
            Paid in assessment
          </h2>
          <p className="text-muted-foreground text-sm">
            Stages skipped when a request is tagged Paid in Assessment. The
            request opens on the next stage that is not selected.
          </p>
        </div>

        {loading ? (
          <DrsInlineLoading size="sm" label="Loading stages…" />
        ) : error ? (
          <p className="text-destructive text-sm">
            Failed to load paid in assessment settings.
          </p>
        ) : stages.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No workflow stages yet. Add stages under Stages and tasks.
          </p>
        ) : (
          <div className="space-y-4">
            <ul className="divide-border divide-y rounded-md border">
              {stages.map((stage) => {
                const inputId = `paid-in-assessment-stage-${stage.id}`;
                return (
                  <li
                    key={stage.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <Checkbox
                      id={inputId}
                      checked={selectedIds.includes(String(stage.id))}
                      disabled={saveMutation.isPending}
                      onCheckedChange={(value) =>
                        toggleStage(String(stage.id), value === true)
                      }
                    />
                    <Label
                      htmlFor={inputId}
                      className="cursor-pointer font-normal"
                    >
                      {stage.name}
                    </Label>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={saveMutation.isPending || !dirty}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save stages'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
