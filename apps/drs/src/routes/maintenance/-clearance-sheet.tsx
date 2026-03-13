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
import { Plus, Trash2, Users } from 'lucide-react';
import { JSX, useState } from 'react';

const departments = [
  {
    id: 1,
    name: 'Registrar',
    users: [],
    description: '',
    created_at: new Date(),
  },
  {
    id: 2,
    name: 'Guidance',
    users: [],
    description: '',
    created_at: new Date(),
  },
];

export const ClearanceSheet = (): JSX.Element => {
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-foreground text-3xl font-bold">
            Clearance Management
          </h1>
          <p className="text-muted-foreground">
            Management document request clearance departments
          </p>
        </div>
        <Card>
          <CardContent>
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="ms-auto gap-2" variant="outline">
                      <Plus className="h-4 w-4" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Clearance Department</DialogTitle>
                      <DialogDescription>
                        Create a new department to manage specific clearance
                        processes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="dept-name">Department Name</Label>
                        <Input
                          id="dept-name"
                          placeholder="e.g., Academic Affairs"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dept-desc">Description</Label>
                        <Input
                          id="dept-desc"
                          placeholder="Describe the department's purpose"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline">Cancel</Button>
                        <Button>Create Department</Button>
                      </div>
                    </div>
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
                      {departments.length === 0 ? (
                        <p className="text-muted-foreground py-4 text-sm">
                          No departments yet. Create one to get started.
                        </p>
                      ) : (
                        departments.map((dept) => (
                          <div
                            key={dept.id}
                            className={`cursor-pointer rounded-lg border p-3 transition-all ${
                              selectedDepartment?.id === dept.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent'
                            }`}
                            onClick={() => setSelectedDepartment(dept)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {dept.name}
                                </p>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                  {dept.users.length}{' '}
                                  {dept.users.length === 1 ? 'user' : 'users'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  //   handleDeleteDepartment(dept.id);
                                }}
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
                          {selectedDepartment.name}
                        </CardTitle>
                        <CardDescription>
                          {selectedDepartment.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-muted-foreground text-xs font-medium">
                              Created
                            </p>
                            <p className="text-sm">
                              {selectedDepartment.created_at.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border border">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            Department Users
                          </CardTitle>
                          <CardDescription>
                            {selectedDepartment.users.length}{' '}
                            {selectedDepartment.users.length === 1
                              ? 'user'
                              : 'users'}{' '}
                            assigned
                          </CardDescription>
                        </div>
                        <Dialog>
                          {/* <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                              <Plus className="h-4 w-4" />
                              Assign User
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Assign User to Department
                              </DialogTitle>
                              <DialogDescription>
                                Add a user to {selectedDepartment.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="user-select">Select User</Label>
                                <Select
                                  value={selectedUser}
                                  onValueChange={setSelectedUser}
                                >
                                  <SelectTrigger
                                    id="user-select"
                                    className="mt-1"
                                  >
                                    <SelectValue placeholder="Choose a user..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableUsers.map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="role-select">Role</Label>
                                <Select
                                  value={selectedRole}
                                  onValueChange={setSelectedRole}
                                >
                                  <SelectTrigger
                                    id="role-select"
                                    className="mt-1"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ROLES.map((role) => (
                                      <SelectItem
                                        key={role.value}
                                        value={role.value}
                                      >
                                        {role.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setShowAssignUser(false)}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleAssignUser}>
                                  Assign User
                                </Button>
                              </div>
                            </div>
                          </DialogContent> */}
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        {selectedDepartment.users.length === 0 ? (
                          <p className="text-muted-foreground py-4 text-sm">
                            No users assigned to this department yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {selectedDepartment.users.map((user) => (
                              <div
                                key={user.id}
                                className="bg-accent border-border flex items-center justify-between rounded-lg border p-3"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {user.name}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {user.email}
                                  </p>
                                  <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
                                    {
                                      ROLES.find((r) => r.value === user.role)
                                        ?.label
                                    }
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleRemoveUserFromDepartment(
                                      selectedDepartment.id,
                                      user.id,
                                    )
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
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
