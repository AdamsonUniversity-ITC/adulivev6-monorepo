import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserMinus, Users } from 'lucide-react';
import { JSX, useState } from 'react';
import { ConfirmActionDialog } from './-clearance/-confirm-action-dialog.tsx';
import { attachAssessmentUser } from './-lib/api/attachAssessmentUser.ts';
import { detachAssessmentUser } from './-lib/api/detachAssessmentUser.ts';
import { searchEmployees } from './-lib/api/employees/searchEmployees.ts';
import { useDebouncedValue } from './-lib/hooks/useDebouncedValue.ts';
import {
  type AssessmentAllowedUser,
  fetchAssessmentSettings,
} from './-lib/api/fetchAssessmentSettings.ts';
import { updateAssessmentSettings } from './-lib/api/updateAssessmentSettings.ts';

const MIN_QUERY_LENGTH = 2;
const SETTINGS_QUERY_KEY = ['assessment_settings'];

export const AssessmentSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [pendingDetach, setPendingDetach] =
    useState<AssessmentAllowedUser | null>(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchAssessmentSettings,
    refetchOnWindowFocus: false,
  });

  const trimmedSearch = search.trim();
  const debouncedSearch = useDebouncedValue(trimmedSearch, 300);

  const { data: hits = [], isFetching: isSearching } = useQuery({
    queryKey: ['employee_search', debouncedSearch],
    queryFn: () => searchEmployees(debouncedSearch),
    enabled: isAddUserOpen && debouncedSearch.length >= MIN_QUERY_LENGTH,
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

  const attachMutation = useMutation({
    mutationFn: (empNo: string) =>
      attachAssessmentUser({
        emp_no: empNo,
        role: role.trim() ? role.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success('Employee added.');
      setIsAddUserOpen(false);
      setSearch('');
      setRole('');
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
    onError: () => {
      toast.error('Failed to add employee.');
    },
  });

  const detachMutation = useMutation({
    mutationFn: (empNo: string) => detachAssessmentUser(empNo),
    onSuccess: () => {
      toast.success('Employee removed.');
      setPendingDetach(null);
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
    onError: () => {
      toast.error('Failed to remove employee.');
    },
  });

  const allowedUsers: AssessmentAllowedUser[] = Array.isArray(data?.users)
    ? data.users
    : [];

  const handleAddDialogChange = (open: boolean) => {
    setIsAddUserOpen(open);
    if (!open) {
      setSearch('');
      setRole('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-foreground text-lg font-semibold">Assessment</h2>
        <p className="text-muted-foreground text-sm">
          Configure how the assessment step behaves for this registrar tenant.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading settings…</p>
      ) : isError || !data ? (
        <p className="text-destructive text-sm">
          Could not load assessment settings. Check tenant context and try again.
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
              <Dialog open={isAddUserOpen} onOpenChange={handleAddDialogChange}>
                <DialogTrigger asChild>
                  <Button
                    className="shrink-0 gap-2"
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add allowed employee</DialogTitle>
                    <DialogDescription>
                      Search by name, employee number, or email (at least{' '}
                      {MIN_QUERY_LENGTH} characters).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="assessment-employee-search">
                        Search
                      </Label>
                      <Input
                        id="assessment-employee-search"
                        className="mt-1"
                        placeholder="Name, emp no, or email"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        autoComplete="off"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label htmlFor="assessment-employee-role">
                        Role label (optional)
                      </Label>
                      <Input
                        id="assessment-employee-role"
                        className="mt-1"
                        placeholder="e.g. Assessor"
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                      />
                    </div>
                    <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-1">
                      {trimmedSearch.length < MIN_QUERY_LENGTH ? (
                        <p className="text-muted-foreground p-3 text-sm">
                          Type at least {MIN_QUERY_LENGTH} characters to search.
                        </p>
                      ) : isSearching ? (
                        <p className="text-muted-foreground p-3 text-sm">
                          Searching…
                        </p>
                      ) : hits.length === 0 ? (
                        <p className="text-muted-foreground p-3 text-sm">
                          No employees found.
                        </p>
                      ) : (
                        hits.map((hit) => (
                          <button
                            key={hit.emp_no}
                            type="button"
                            className="hover:bg-accent flex w-full flex-col rounded-md px-2 py-2 text-left text-sm"
                            onClick={() => attachMutation.mutate(hit.emp_no)}
                            disabled={attachMutation.isPending}
                          >
                            <span className="font-medium">
                              {hit.name || 'Unnamed'}{' '}
                              <span className="text-muted-foreground text-xs font-normal">
                                ({hit.emp_no})
                              </span>
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {[hit.position, hit.email]
                                .filter(Boolean)
                                .join(' · ') || '—'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {allowedUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No employees yet. Consider who should handle assessment
                  before go-live.
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
                          <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
                            {user.role}
                          </span>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => setPendingDetach(user)}
                        disabled={detachMutation.isPending}
                        aria-label="Remove employee"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <ConfirmActionDialog
            open={pendingDetach !== null}
            onOpenChange={(open) => {
              if (!open) setPendingDetach(null);
            }}
            title="Remove employee from assessment?"
            description={
              pendingDetach ? (
                <>
                  <span className="font-medium">
                    {pendingDetach.name ||
                      pendingDetach.email ||
                      pendingDetach.emp_no}
                  </span>{' '}
                  will no longer be allowed to act on assessment tasks.
                </>
              ) : null
            }
            confirmLabel="Remove employee"
            pending={detachMutation.isPending}
            onConfirm={() =>
              pendingDetach && detachMutation.mutate(pendingDetach.emp_no)
            }
          />
        </>
      )}
    </div>
  );
};
