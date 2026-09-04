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
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { DocumentGroup } from '../-lib/api/fetchDocumentGroups.ts';
import { updateDocumentGroup } from '../-lib/api/updateDocumentGroup.ts';

const formSchema = z.object({
  group_name: z
    .string()
    .min(1, { message: 'Group name is required.' })
    .max(255),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  group: DocumentGroup | null;
  disabled?: boolean;
};

export const EditGroupDialog = ({ group, disabled = false }: Props) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { group_name: '' },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      group_name: group?.group_name ?? '',
    });
  }, [form, group, open]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!group) {
        throw new Error('No document group selected.');
      }

      return updateDocumentGroup(group.id, values);
    },
    onSuccess: () => {
      toast.success('Group updated.');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['document_groups'] });
    },
    onError: () => {
      toast.error('Failed to update group.');
    },
  });

  const handleSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          form.reset({ group_name: group?.group_name ?? '' });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || !group}
          aria-label="Edit selected group"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit group</DialogTitle>
          <DialogDescription>
            Update the group name used for organising documents and packages.
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
            <Button type="submit" disabled={mutation.isPending || !group}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
