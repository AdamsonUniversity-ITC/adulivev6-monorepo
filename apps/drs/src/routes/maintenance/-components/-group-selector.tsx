import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { ConfirmActionDialog } from '../-clearance/-confirm-action-dialog.tsx';
import { deleteDocumentGroup } from '../-lib/api/deleteDocumentGroup.ts';
import { fetchDocumentGroups } from '../-lib/api/fetchDocumentGroups.ts';
import { DocumentManagementContext } from '../-providers/-document-management-context.tsx';
import { AddGroupDialog } from './-add-group-dialog.tsx';
import { EditGroupDialog } from './-edit-group-dialog.tsx';

export const GroupSelector = () => {
  const ctx = useContext(DocumentManagementContext);
  if (!ctx) {
    throw new Error(
      'GroupSelector must be used within DocumentMangementProvider',
    );
  }
  const { selectedGroup, setSelectedGroup } = ctx;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['document_groups'],
    queryFn: fetchDocumentGroups,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (groups.length === 0) return;
    if (selectedGroup === null) {
      setSelectedGroup(String(groups[0]!.id));
    }
  }, [groups, selectedGroup, setSelectedGroup]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteDocumentGroup(selectedGroup as string),
    onSuccess: () => {
      toast.success('Document group deleted.');
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['document_groups'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      const remaining = groups.filter(
        (group) => String(group.id) !== String(selectedGroup),
      );
      setSelectedGroup(remaining[0] ? String(remaining[0].id) : null);
    },
    onError: () => {
      toast.error('Could not delete this group.');
    },
  });

  const currentGroup =
    groups.find((group) => String(group.id) === String(selectedGroup)) ?? null;
  const selectedGroupName = currentGroup?.group_name ?? 'this group';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document group</CardTitle>
          <CardDescription>
            Pick the group whose documents and packages you want to edit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="group-select" className="sr-only">
            Group
          </Label>
          <div className="flex items-center gap-2">
            <Select
              disabled={isLoading || groups.length === 0}
              value={selectedGroup ?? undefined}
              onValueChange={setSelectedGroup}
            >
              <SelectTrigger id="group-select" className="flex-1">
                <SelectValue
                  placeholder={
                    isLoading
                      ? 'Loading…'
                      : groups.length === 0
                        ? 'No groups yet'
                        : 'Select a group'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    {group.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AddGroupDialog />
            <EditGroupDialog
              group={currentGroup}
              disabled={!selectedGroup || deleteMutation.isPending}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!selectedGroup || deleteMutation.isPending}
              aria-label="Delete selected group"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete document group?"
        description={
          <>
            This cannot be undone. <strong>{selectedGroupName}</strong> and
            every document and package in it will be removed from the catalog.
            Requests already in progress will continue.
          </>
        }
        confirmLabel="Delete group"
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
};
