import { zodResolver } from '@hookform/resolvers/zod';
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
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { toast } from '@repo/ui/exports';
import { FormInput } from '@repo/ui/form-components/form-input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { createDocumentGroup } from '../-lib/api/createDocumentGroup.ts';
import { fetchDocumentGroups } from '../-lib/api/fetchDocumentGroups.ts';
import { DocumentManagementContext } from '../-providers/-document-management-context.tsx';
import { Route } from '../index.tsx';

const form_schema = z.object({
  group_name: z.string().min(1, { message: 'This field is required' }),
});

const DisplayGroupDialog = () => {
  const { access } = Route.useLoaderData();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(form_schema),
    defaultValues: {
      group_name: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (e) => createDocumentGroup(e, access),
  });

  const onSubmit = (formValues) => {
    mutation.mutate(formValues, {
      onSuccess: () => {
        toast('Group name added successfully.');
        form.reset();
        queryClient.invalidateQueries(['document_groups']);
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Add a new group to organize your documents and packages
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormInput form={form} label="Group name" name="group_name" />
            <div className="flex justify-end gap-2">
              <Button disabled={mutation.isPending} type="submit">
                Create Group
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const DisplayGroup = () => {
  const { access } = Route.useLoaderData();
  const { data, isLoading } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['document_groups'],
    queryFn: () => fetchDocumentGroups(access),
  });
  const { setSelectedGroup } = useContext(DocumentManagementContext);

  return (
    <Card className="border-border border">
      <CardHeader>
        <CardTitle>Display Groups</CardTitle>
        <CardDescription>
          Organize documents and packages into groups for better management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="group-select">Select Group</Label>
          <div className="flex gap-2">
            <Select disabled={isLoading} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-full" id="group-select">
                <SelectValue placeholder="Select document group" />
              </SelectTrigger>
              <SelectContent>
                {!isLoading &&
                  data.data.map((item) => (
                    <SelectItem value={String(item.id)}>
                      {item.group_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <DisplayGroupDialog />
          </div>
        </div>

        <Button variant="destructive" size="sm" className="w-full">
          Delete
        </Button>
      </CardContent>
    </Card>
  );
};
