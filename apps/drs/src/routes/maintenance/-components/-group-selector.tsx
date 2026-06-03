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
import { useQuery } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';
import { fetchDocumentGroups } from '../-lib/api/fetchDocumentGroups.ts';
import { DocumentManagementContext } from '../-providers/-document-management-context.tsx';
import { AddGroupDialog } from './-add-group-dialog.tsx';

export const GroupSelector = () => {
  const ctx = useContext(DocumentManagementContext);
  if (!ctx) {
    throw new Error(
      'GroupSelector must be used within DocumentMangementProvider',
    );
  }
  const { selectedGroup, setSelectedGroup } = ctx;

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

  return (
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
        </div>
      </CardContent>
    </Card>
  );
};
