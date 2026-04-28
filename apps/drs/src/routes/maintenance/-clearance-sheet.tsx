import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
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
import { Plus, Trash2, UserMinus, Users } from 'lucide-react';
import { FormEvent, JSX, useEffect, useState } from 'react';
import { attachClearanceDepartmentUser } from './-lib/api/attachClearanceDepartmentUser.ts';
import { createClearanceDepartment } from './-lib/api/createClearanceDepartment.ts';
import { deleteClearanceDepartment } from './-lib/api/deleteClearanceDepartment.ts';
import { detachClearanceDepartmentUser } from './-lib/api/detachClearanceDepartmentUser.ts';
import { fetchClearanceDepartments } from './-lib/api/fetchClearanceDepartments.ts';
import { searchClearanceDepartmentUsers } from './-lib/api/searchClearanceDepartmentUsers.ts';

type DepartmentUser = {
  id: number | string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

type Department = {
  id: number | string;
  created_at?: Date | string | null;
  department_name?: string | null;
  description?: string | null;
  name?: string | null;
  users?: DepartmentUser[] | null;
};

const getDepartments = (response: unknown): Department[] => {
  if (Array.isArray(response)) {
    return response as Department[];
  }

  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray(response.data)
  ) {
    return response.data as Department[];
  }

  return [];
};

const getDepartmentName = (department: Department): string => {
  return department.name ?? department.department_name ?? 'Unnamed Department';
};

const getDepartmentUsers = (department: Department): DepartmentUser[] => {
  return Array.isArray(department.users) ? department.users : [];
};

const formatCreatedAt = (value?: Date | string | null): string => {
  if (!value) {
    return 'N/A';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString();
};

export const ClearanceSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | string | null
  >(null);
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleForNewUser, setRoleForNewUser] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');

  const { data, isError, isLoading } = useQuery({
    queryKey: ['clearance_departments'],
    queryFn: fetchClearanceDepartments,
    refetchOnWindowFocus: false,
  });

  const departments = getDepartments(data);

  const selectedDepartment =
    departments.find(
      (department) => String(department.id) === String(selectedDepartmentId),
    ) ?? null;

  const createDepartmentMutation = useMutation({
    mutationFn: createClearanceDepartment,
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: deleteClearanceDepartment,
  });

  const attachUserMutation = useMutation({
    mutationFn: ({
      departmentId,
      userId,
      role,
    }: {
      departmentId: number | string;
      userId: number | string;
      role?: string;
    }) =>
      attachClearanceDepartmentUser(departmentId, {
        user_id: userId,
        role: role?.trim() ? role.trim() : undefined,
      }),
  });

  const detachUserMutation = useMutation({
    mutationFn: ({
      departmentId,
      userId,
    }: {
      departmentId: number | string;
      userId: number | string;
    }) => detachClearanceDepartmentUser(departmentId, userId),
  });

  const userSearchQueryTrimmed = userSearchQuery.trim();

  const { data: userSearchHits = [], isFetching: isUserSearchLoading } =
    useQuery({
      queryKey: ['clearance_department_user_search', userSearchQueryTrimmed],
      queryFn: () => searchClearanceDepartmentUsers(userSearchQueryTrimmed),
      enabled: isAddUserOpen && userSearchQueryTrimmed.length >= 2,
      refetchOnWindowFocus: false,
    });

  useEffect(() => {
    const firstDepartment = departments[0];

    if (!firstDepartment) {
      if (selectedDepartmentId !== null) {
        setSelectedDepartmentId(null);
      }

      return;
    }

    if (selectedDepartmentId === null) {
      setSelectedDepartmentId(firstDepartment.id);
      return;
    }

    const departmentStillExists = departments.some(
      (department) => String(department.id) === String(selectedDepartmentId),
    );

    if (!departmentStillExists) {
      setSelectedDepartmentId(firstDepartment.id);
    }
  }, [departments, selectedDepartmentId]);

  const resetDepartmentForm = () => {
    setDepartmentName('');
    setDepartmentDescription('');
  };

  const handleCreateDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedDepartmentName = departmentName.trim();

    if (!trimmedDepartmentName) {
      toast.error('Department name is required.');
      return;
    }

    createDepartmentMutation.mutate(
      {
        name: trimmedDepartmentName,
        description: departmentDescription.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Department created successfully.');
          resetDepartmentForm();
          setIsAddDepartmentOpen(false);
          queryClient.invalidateQueries({
            queryKey: ['clearance_departments'],
          });
        },
        onError: () => {
          toast.error('Failed to create department.');
        },
      },
    );
  };

  const handleDeleteDepartment = (departmentId: number | string) => {
    const department = departments.find(
      (item) => String(item.id) === String(departmentId),
    );

    if (
      !window.confirm(
        `Delete ${getDepartmentName(department ?? { id: departmentId })}?`,
      )
    ) {
      return;
    }

    deleteDepartmentMutation.mutate(departmentId, {
      onSuccess: () => {
        toast.success('Department deleted successfully.');
        queryClient.invalidateQueries({
          queryKey: ['clearance_departments'],
        });
      },
      onError: () => {
        toast.error('Failed to delete department.');
      },
    });
  };

  const handleAttachUser = (userId: number | string) => {
    if (!selectedDepartment) {
      return;
    }

    attachUserMutation.mutate(
      {
        departmentId: selectedDepartment.id,
        userId,
        role: roleForNewUser,
      },
      {
        onSuccess: () => {
          toast.success('User added to department.');
          setIsAddUserOpen(false);
          setUserSearchQuery('');
          setRoleForNewUser('');
          queryClient.invalidateQueries({
            queryKey: ['clearance_departments'],
          });
        },
        onError: () => {
          toast.error('Failed to add user.');
        },
      },
    );
  };

  const handleDetachUser = (userId: number | string) => {
    if (!selectedDepartment) {
      return;
    }

    if (!window.confirm('Remove this user from the department?')) {
      return;
    }

    detachUserMutation.mutate(
      { departmentId: selectedDepartment.id, userId },
      {
        onSuccess: () => {
          toast.success('User removed from department.');
          queryClient.invalidateQueries({
            queryKey: ['clearance_departments'],
          });
        },
        onError: () => {
          toast.error('Failed to remove user.');
        },
      },
    );
  };

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-foreground text-3xl font-bold">
            Clearance Management
          </h1>
          <p className="text-muted-foreground">
            Manage document request clearance departments
          </p>
        </div>
        <Card>
          <CardContent>
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between">
                <Dialog
                  open={isAddDepartmentOpen}
                  onOpenChange={setIsAddDepartmentOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="ms-auto gap-2" variant="outline">
                      <Plus className="h-4 w-4" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Clearance Department</DialogTitle>
                      <DialogDescription>
                        Create a new department to manage specific clearance
                        processes
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      className="space-y-4"
                      onSubmit={handleCreateDepartment}
                    >
                      <div>
                        <Label htmlFor="dept-name">Department Name</Label>
                        <Input
                          id="dept-name"
                          placeholder="e.g., Academic Affairs"
                          className="mt-1"
                          value={departmentName}
                          onChange={(event) =>
                            setDepartmentName(event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="dept-desc">Description</Label>
                        <Input
                          id="dept-desc"
                          placeholder="Describe the department's purpose"
                          className="mt-1"
                          value={departmentDescription}
                          onChange={(event) =>
                            setDepartmentDescription(event.target.value)
                          }
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            resetDepartmentForm();
                            setIsAddDepartmentOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createDepartmentMutation.isPending}
                        >
                          Create Department
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <Card className="border-border border">
                    <CardHeader>
                      <CardTitle className="text-lg">Departments</CardTitle>
                      <CardDescription>
                        {departments.length} department(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {isLoading ? (
                        <p className="text-muted-foreground py-4 text-sm">
                          Loading departments...
                        </p>
                      ) : isError ? (
                        <p className="text-destructive py-4 text-sm">
                          Failed to load departments.
                        </p>
                      ) : departments.length === 0 ? (
                        <p className="text-muted-foreground py-4 text-sm">
                          No departments yet. Create one to get started.
                        </p>
                      ) : (
                        departments.map((dept) => (
                          <div
                            key={dept.id}
                            className={`cursor-pointer rounded-lg border p-3 transition-all ${
                              String(selectedDepartment?.id) === String(dept.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent'
                            }`}
                            onClick={() => setSelectedDepartmentId(dept.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {getDepartmentName(dept)}
                                </p>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                  {getDepartmentUsers(dept).length}{' '}
                                  {getDepartmentUsers(dept).length === 1
                                    ? 'user'
                                    : 'users'}
                                </p>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                  Created {formatCreatedAt(dept.created_at)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDepartment(dept.id);
                                }}
                                disabled={deleteDepartmentMutation.isPending}
                                className="h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {selectedDepartment ? (
                  <div className="space-y-6 lg:col-span-2">
                    <Card className="border-border border">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {getDepartmentName(selectedDepartment)}
                        </CardTitle>
                        <CardDescription>
                          {selectedDepartment.description ||
                            'No description provided.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-muted-foreground text-xs font-medium">
                              Created
                            </p>
                            <p className="text-sm">
                              {formatCreatedAt(selectedDepartment.created_at)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border border">
                      <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            Department Users
                          </CardTitle>
                          <CardDescription>
                            {getDepartmentUsers(selectedDepartment).length}{' '}
                            {getDepartmentUsers(selectedDepartment).length === 1
                              ? 'user'
                              : 'users'}{' '}
                            assigned
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
                              <DialogTitle>Add user to department</DialogTitle>
                              <DialogDescription>
                                Search by name or email (min. 2 characters), then pick a user.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="user-search">Search users</Label>
                                <Input
                                  id="user-search"
                                  className="mt-1"
                                  placeholder="Name or email"
                                  value={userSearchQuery}
                                  onChange={(event) =>
                                    setUserSearchQuery(event.target.value)
                                  }
                                  autoComplete="off"
                                />
                              </div>
                              <div>
                                <Label htmlFor="user-role">Role (optional)</Label>
                                <Input
                                  id="user-role"
                                  className="mt-1"
                                  placeholder="e.g. Reviewer"
                                  value={roleForNewUser}
                                  onChange={(event) =>
                                    setRoleForNewUser(event.target.value)
                                  }
                                />
                              </div>
                              <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border p-1">
                                {userSearchQueryTrimmed.length < 2 ? (
                                  <p className="text-muted-foreground p-2 text-sm">
                                    Type at least 2 characters to search.
                                  </p>
                                ) : isUserSearchLoading ? (
                                  <p className="text-muted-foreground p-2 text-sm">
                                    Searching…
                                  </p>
                                ) : userSearchHits.length === 0 ? (
                                  <p className="text-muted-foreground p-2 text-sm">
                                    No users found.
                                  </p>
                                ) : (
                                  userSearchHits.map((hit) => (
                                    <button
                                      key={hit.id}
                                      type="button"
                                      className="hover:bg-accent flex w-full flex-col rounded-md px-2 py-2 text-left text-sm"
                                      onClick={() => handleAttachUser(hit.id)}
                                      disabled={attachUserMutation.isPending}
                                    >
                                      <span className="font-medium">
                                        {hit.name || 'Unnamed'}
                                      </span>
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
                        {getDepartmentUsers(selectedDepartment).length === 0 ? (
                          <p className="text-muted-foreground py-4 text-sm">
                            No users assigned to this department yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {getDepartmentUsers(selectedDepartment).map(
                              (user) => (
                                <div
                                  key={user.id}
                                  className="bg-accent border-border flex items-center justify-between gap-2 rounded-lg border p-3"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">
                                      {user.name || 'Unnamed User'}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {user.email || 'No email provided'}
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
                                    aria-label="Remove user from department"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="border-border border lg:col-span-2">
                    <CardContent className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">
                        Select a department to view and manage its users
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
