import { Button } from '@repo/ui/components/button';
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
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { attachClearanceDepartmentUser } from '../-lib/api/attachClearanceDepartmentUser.ts';
import { searchEmployees } from '../-lib/api/employees/searchEmployees.ts';
import { useDebouncedValue } from '../-lib/hooks/useDebouncedValue.ts';

type Props = {
  departmentId: number | string;
};

const MIN_QUERY_LENGTH = 2;

export const AddUserDialog = ({ departmentId }: Props) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const trimmedSearch = search.trim();
  const debouncedSearch = useDebouncedValue(trimmedSearch, 300);

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ['employee_search', debouncedSearch],
    queryFn: () => searchEmployees(debouncedSearch),
    enabled: open && debouncedSearch.length >= MIN_QUERY_LENGTH,
    refetchOnWindowFocus: false,
  });

  const attachMutation = useMutation({
    mutationFn: (userId: number) =>
      attachClearanceDepartmentUser(departmentId, {
        user_id: userId,
        role: role.trim() ? role.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success('Employee added to department.');
      setOpen(false);
      setSearch('');
      setRole('');
      queryClient.invalidateQueries({ queryKey: ['clearance_departments'] });
    },
    onError: () => {
      toast.error('Failed to add employee.');
    },
  });

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch('');
      setRole('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="shrink-0 gap-2" variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Add employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add employee to department</DialogTitle>
          <DialogDescription>
            Search by name, employee number, or email (minimum{' '}
            {MIN_QUERY_LENGTH} characters), then pick an employee.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="employee-search">Search employees</Label>
            <Input
              id="employee-search"
              className="mt-1"
              placeholder="Name, emp no, or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="employee-role">Role label (optional)</Label>
            <Input
              id="employee-role"
              className="mt-1"
              placeholder="e.g. Reviewer"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-1">
            {trimmedSearch.length < MIN_QUERY_LENGTH ? (
              <p className="text-muted-foreground p-3 text-sm">
                Type at least {MIN_QUERY_LENGTH} characters to search.
              </p>
            ) : isFetching ? (
              <p className="text-muted-foreground p-3 text-sm">Searching…</p>
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
                  onClick={() =>
                    hit.user_id ? attachMutation.mutate(Number(hit.user_id)) : null
                  }
                  disabled={attachMutation.isPending || !hit.user_id}
                >
                  <span className="font-medium">
                    {hit.name || 'Unnamed'}{' '}
                    <span className="text-muted-foreground text-xs font-normal">
                      ({hit.emp_no})
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {[hit.position, hit.email].filter(Boolean).join(' · ') ||
                      '—'}
                  </span>
                </button>
              ))
            )}
          </div>
          {!isFetching &&
          trimmedSearch.length >= MIN_QUERY_LENGTH &&
          hits.length > 0 &&
          hits.some((hit) => !hit.user_id) ? (
            <p className="text-muted-foreground text-xs">
              Some results cannot be assigned because they have no linked
              <span className="font-medium"> user_id</span>.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
