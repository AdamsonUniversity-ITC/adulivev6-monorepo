import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Label } from '@repo/ui/components/label';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { JSX } from 'react';
import {
  type AssessmentAllowedUser,
  fetchAssessmentSettings,
} from './-lib/api/fetchAssessmentSettings.ts';
import { updateAssessmentSettings } from './-lib/api/updateAssessmentSettings.ts';
import { useMaintenanceNavigation } from './-maintenance-navigation-context.tsx';

const SETTINGS_QUERY_KEY = ['assessment_settings'];

export const AssessmentSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const { openUserManagement } = useMaintenanceNavigation();

  const { data, isError, isLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchAssessmentSettings,
    refetchOnWindowFocus: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateAssessmentSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
    onError: () => {
      toast.error('Failed to update assessment settings.');
    },
  });

  const allowedUsers: AssessmentAllowedUser[] = Array.isArray(data?.users)
    ? data.users
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-foreground text-lg font-semibold">Assessment</h2>
        <p className="text-muted-foreground text-sm">
          Configure how the assessment step behaves for this registrar tenant.
        </p>
      </div>

      {isLoading ? (
        <DrsInlineLoading size="sm" label="Loading settings…" />
      ) : isError || !data ? (
        <p className="text-destructive text-sm">
          Could not load assessment settings. Check tenant context and try
          again.
        </p>
      ) : (
        <>
          <Card className="border-border border">
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
              <CardDescription>
                When enabled, document prices can be completed automatically
                where the system supports it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="auto-complete-price"
                  checked={data.auto_complete_price}
                  disabled={updateSettingsMutation.isPending}
                  onCheckedChange={(value) =>
                    updateSettingsMutation.mutate({
                      auto_complete_price: value === true,
                    })
                  }
                />
                <Label
                  htmlFor="auto-complete-price"
                  className="cursor-pointer font-normal"
                >
                  Auto-complete price
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border border">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Allowed employees
                </CardTitle>
                <CardDescription>
                  Only these employees may act on requests in the assessment
                  step.
                </CardDescription>
              </div>
              <Button
                type="button"
                className="shrink-0"
                variant="outline"
                size="sm"
                onClick={openUserManagement}
              >
                Manage in User Management
              </Button>
            </CardHeader>
            <CardContent>
              {allowedUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No employees yet. Consider who should handle assessment before
                  go-live.
                </p>
              ) : (
                <div className="space-y-2">
                  {allowedUsers.map((user) => (
                    <div
                      key={user.emp_no}
                      className="bg-accent border-border flex items-center justify-between gap-2 rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.name || 'Unnamed employee'}{' '}
                          <span className="text-muted-foreground text-xs font-normal">
                            ({user.emp_no})
                          </span>
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {[user.position, user.email]
                            .filter(Boolean)
                            .join(' · ') || 'No contact info'}
                        </p>
                        {user.role ? (
                          <span className="bg-muted text-muted-foreground mt-1 inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium">
                            {user.role}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
