import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { toast } from '@repo/ui/exports';
import { FormInput } from '@repo/ui/form-components/form-input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createDocumentGroup } from '../-lib/api/createDocumentGroup.ts';

const formSchema = z.object({
  group_name: z.string().min(1, { message: 'Group name is required.' }).max(255),
});

type FormValues = z.infer<typeof formSchema>;

export const AddGroupDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { group_name: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createDocumentGroup(values),
    onSuccess: () => {
      toast.success('Group created.');
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['document_groups'] });
    },
    onError: () => {
      toast.error('Failed to create group.');
    },
  });

  const handleSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create new group</DialogTitle>
          <DialogDescription>
            Groups organise documents and packages for easier browsing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormInput
            form={form}
            label="Group name"
            name="group_name"
            placeholder="e.g. Transcripts"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
