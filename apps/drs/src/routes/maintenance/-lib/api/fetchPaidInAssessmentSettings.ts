import { registrarSvc } from '@repo/axios-config/registrar-service';

export type PaidInAssessmentSettings = {
  paid_in_assessment_skip_stage_ids: string[];
};

const stageIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id)).filter((id) => id.length > 0);
};

const unwrap = (response: unknown): PaidInAssessmentSettings => {
  const source =
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: unknown }).data &&
    typeof (response as { data: unknown }).data === 'object'
      ? (response as { data: Record<string, unknown> }).data
      : response && typeof response === 'object'
        ? (response as Record<string, unknown>)
        : {};

  return {
    paid_in_assessment_skip_stage_ids: stageIds(
      source.paid_in_assessment_skip_stage_ids,
    ),
  };
};

export const fetchPaidInAssessmentSettings =
  async (): Promise<PaidInAssessmentSettings> => {
    const { data } = await registrarSvc.get(
      'v1/drs/paid-in-assessment-settings',
    );
    return unwrap(data);
  };

export const updatePaidInAssessmentSettings = async (
  skipStageIds: string[],
): Promise<PaidInAssessmentSettings> => {
  const { data } = await registrarSvc.put('v1/drs/paid-in-assessment-settings', {
    paid_in_assessment_skip_stage_ids: skipStageIds,
  });
  return unwrap(data);
};
