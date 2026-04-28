import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
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
import { attachAssessmentUser } from './-lib/api/attachAssessmentUser.ts';
import { detachAssessmentUser } from './-lib/api/detachAssessmentUser.ts';
import {
  type AssessmentAllowedUser,
  fetchAssessmentSettings,
} from './-lib/api/fetchAssessmentSettings.ts';
import { searchAssessmentUsers } from './-lib/api/searchAssessmentUsers.ts';
import { updateAssessmentSettings } from './-lib/api/updateAssessmentSettings.ts';

export const AssessmentSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleForNewUser, setRoleForNewUser] = useState('');

  const { data, isError, isLoading } = useQuery({
    queryKey: ['assessment_settings'],
    queryFn: fetchAssessmentSettings,
    refetchOnWindowFocus: false,
  });

  const userSearchQueryTrimmed = userSearchQuery.trim();

  const { data: userSearchHits = [], isFetching: isUserSearchLoading } =
    useQuery({
      queryKey: ['assessment_user_search', userSearchQueryTrimmed],
      queryFn: () => searchAssessmentUsers(userSearchQueryTrimmed),
      enabled: isAddUserOpen && userSearchQueryTrimmed.length >= 2,
      refetchOnWindowFocus: false,
    });

  const updateSettingsMutation = useMutation({
    mutationFn: updateAssessmentSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment_settings'] });
    },
    onError: () => {
      toast.error('Failed to update assessment settings.');
    },
  });

  const attachUserMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: number | string;
      role?: string;
    }) =>
      attachAssessmentUser({
        user_id: userId,
        role: role?.trim() ? role.trim() : undefined,
      }),
  });

  const detachUserMutation = useMutation({
    mutationFn: (userId: number | string) => detachAssessmentUser(userId),
  });

  const allowedUsers: AssessmentAllowedUser[] = Array.isArray(data?.users)
    ? data.users
    : [];

  const handleAutoCompletePriceChange = (checked: boolean) => {
    updateSettingsMutation.mutate({ auto_complete_price: checked });
  };

  const handleAttachUser = (userId: number | string) => {
    attachUserMutation.mutate(
      { userId, role: roleForNewUser },
      {
        onSuccess: () => {
          toast.success('User added.');
          setIsAddUserOpen(false);
          setUserSearchQuery('');
          setRoleForNewUser('');
          queryClient.invalidateQueries({ queryKey: ['assessment_settings'] });
        },
        onError: () => {
          toast.error('Failed to add user.');
        },
      },
    );
  };

  const handleDetachUser = (userId: number | string) => {
    if (!window.confirm('Remove this user from assessment?')) {
      return;
    }

    detachUserMutation.mutate(userId, {
      onSuccess: () => {
        toast.success('User removed.');
        queryClient.invalidateQueries({ queryKey: ['assessment_settings'] });
      },
      onError: () => {
        toast.error('Failed to remove user.');
      },
    });
  };

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-foreground text-2xl font-bold">Assessment</h1>
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
                <CardTitle className="text-lg">Pricing</CardTitle>
                <CardDescription>
                  When enabled, document prices can be completed automatically where the
                  system supports it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="auto-complete-price"
                    checked={data.auto_complete_price}
                    disabled={updateSettingsMutation.isPending}
                    onCheckedChange={(value) =>
                      handleAutoCompletePriceChange(value === true)
                    }
                  />
                  <Label htmlFor="auto-complete-price" className="cursor-pointer font-normal">
                    Auto complete price
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border border">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Allowed users
                  </CardTitle>
                  <CardDescription>
                    Only these users may act on requests in the assessment step.
                  </CardDescription>
                </div>
                <Dialog
                  open={isAddUserOpen}
                  onOpenChange={(open) => {
                    setIsAddUserOpen(open);
                    if (!open) {
                      setUserSearchQuery('');
                      setRoleForNewUser('');
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="shrink-0 gap-2" variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                      Add user
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add allowed user</DialogTitle>
                      <DialogDescription>
                        Search by name or email (at least 2 characters).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="assessment-user-search">Search</Label>
                        <Input
                          id="assessment-user-search"
                          className="mt-1"
                          placeholder="Name or email"
                          value={userSearchQuery}
                          onChange={(event) => setUserSearchQuery(event.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <Label htmlFor="assessment-user-role">Role (optional)</Label>
                        <Input
                          id="assessment-user-role"
                          className="mt-1"
                          placeholder="e.g. Assessor"
                          value={roleForNewUser}
                          onChange={(event) => setRoleForNewUser(event.target.value)}
                        />
                      </div>
                      <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border p-1">
                        {userSearchQueryTrimmed.length < 2 ? (
                          <p className="text-muted-foreground p-2 text-sm">
                            Type at least 2 characters to search.
                          </p>
                        ) : isUserSearchLoading ? (
                          <p className="text-muted-foreground p-2 text-sm">Searching…</p>
                        ) : userSearchHits.length === 0 ? (
                          <p className="text-muted-foreground p-2 text-sm">No users found.</p>
                        ) : (
                          userSearchHits.map((hit) => (
                            <button
                              key={hit.id}
                              type="button"
                              className="hover:bg-accent flex w-full flex-col rounded-md px-2 py-2 text-left text-sm"
                              onClick={() => handleAttachUser(hit.id)}
                              disabled={attachUserMutation.isPending}
                            >
                              <span className="font-medium">{hit.name || 'Unnamed'}</span>
                              <span className="text-muted-foreground text-xs">
                                {hit.email || '—'}
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
                    No users yet. If the list is empty, consider who should handle
                    assessment before go-live.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allowedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="bg-accent border-border flex items-center justify-between gap-2 rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{user.name || 'Unnamed user'}</p>
                          <p className="text-muted-foreground text-xs">
                            {user.email || 'No email'}
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
                          onClick={() => handleDetachUser(user.id)}
                          disabled={detachUserMutation.isPending}
                          aria-label="Remove user"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
