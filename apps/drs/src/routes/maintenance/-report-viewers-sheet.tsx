import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { JSX, useState } from 'react';
import { searchEmployees } from './-lib/api/employees/searchEmployees.ts';
import {
  addReportViewer,
  fetchReportViewers,
  removeReportViewer,
  type ReportViewer,
} from './-lib/api/report-viewers.ts';
import { useDebouncedValue } from './-lib/hooks/useDebouncedValue.ts';

const QUERY_KEY = ['drs', 'report-viewers'] as const;
const MIN_QUERY_LENGTH = 2;

const labelFor = (viewer: ReportViewer): string =>
  viewer.name?.trim() || viewer.email?.trim() || `Employee ${viewer.emp_no}`;

export const ReportViewersSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const trimmed = search.trim();
  const debounced = useDebouncedValue(trimmed, 300);

  const viewersQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchReportViewers,
  });

  const viewers = viewersQuery.data ?? [];
  const empNos = new Set(viewers.map((viewer) => viewer.emp_no));

  const searchQuery = useQuery({
    queryKey: ['drs', 'report-viewers', 'employee-search', debounced],
    queryFn: () => searchEmployees(debounced),
    enabled: debounced.length >= MIN_QUERY_LENGTH,
    refetchOnWindowFocus: false,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ['drs-report-access'] });
  };

  const addMutation = useMutation({
    mutationFn: (empNo: string) => addReportViewer(empNo),
    onSuccess: () => {
      toast.success('Employee added.');
      setSearch('');
      refresh();
    },
    onError: () => toast.error('Failed to add employee.'),
  });

  const removeMutation = useMutation({
    mutationFn: (empNo: string) => removeReportViewer(empNo),
    onSuccess: () => {
      toast.success('Employee removed.');
      refresh();
    },
    onError: () => toast.error('Failed to remove employee.'),
  });

  return (
    <div className="max-w-xl space-y-6">
      <p className="text-muted-foreground text-sm">
        Host administrators can always open reports. Add the other employees
        who should see the reports page on this site.
      </p>

      <div className="space-y-2">
        <label
          htmlFor="report-viewer-employee-search"
          className="text-foreground text-xs font-medium"
        >
          Add employee
        </label>
        <Input
          id="report-viewer-employee-search"
          placeholder="Search by name, emp no, or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoComplete="off"
        />
        {trimmed.length >= MIN_QUERY_LENGTH ? (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-1">
            {searchQuery.isFetching ? (
              <p className="text-muted-foreground p-2 text-xs">Searching…</p>
            ) : (searchQuery.data ?? []).length === 0 ? (
              <p className="text-muted-foreground p-2 text-xs">
                No employee matches that name or number.
              </p>
            ) : (
              (searchQuery.data ?? []).map((hit) => {
                const alreadyListed = empNos.has(hit.emp_no);
                return (
                  <button
                    key={hit.emp_no}
                    type="button"
                    className="hover:bg-accent flex w-full flex-col rounded-md px-2 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => addMutation.mutate(hit.emp_no)}
                    disabled={alreadyListed || addMutation.isPending}
                  >
                    <span className="font-medium">
                      {hit.name || 'Unnamed'}{' '}
                      <span className="text-muted-foreground font-normal">
                        ({hit.emp_no})
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {[hit.position, hit.email].filter(Boolean).join(' · ') ||
                        '—'}
                      {alreadyListed ? ' · already added' : ''}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-muted-foreground text-xs">
          Viewers ({viewers.length})
        </p>
        {viewersQuery.isLoading ? (
          <p className="text-muted-foreground mt-2 text-xs">Loading viewers…</p>
        ) : viewers.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-xs">
            No extra employees can open reports yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {viewers.map((viewer) => (
              <li
                key={viewer.id}
                className="flex items-center justify-between gap-3 rounded-md border px-2 py-1.5 text-xs"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">
                    {labelFor(viewer)}
                  </span>
                  <span className="text-muted-foreground truncate">
                    {viewer.emp_no}
                    {viewer.email ? ` · ${viewer.email}` : ''}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove ${labelFor(viewer)}`}
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(viewer.emp_no)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
