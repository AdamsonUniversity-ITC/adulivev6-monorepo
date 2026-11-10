import { registrarSvc } from '@repo/axios-config/registrar-service';

export type OnboardingStatus = {
  completed: boolean;
  completed_at: string | null;
};

export async function fetchOnboarding() {
  const { data } = await registrarSvc.get<{ data: OnboardingStatus }>(
    'v1/drs/onboarding',
  );
  return data.data;
}

export async function completeOnboarding() {
  const { data } = await registrarSvc.post<{ data: OnboardingStatus }>(
    'v1/drs/onboarding/complete',
  );
  return data.data;
}
