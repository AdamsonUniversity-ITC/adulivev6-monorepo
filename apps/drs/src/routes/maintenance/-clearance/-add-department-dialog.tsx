import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Label } from '@repo/ui/components/label';
import { toast } from '@repo/ui/exports';
import { FormInput } from '@repo/ui/form-components/form-input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createClearanceDepartment } from '../-lib/api/createClearanceDepartment.ts';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Department name is required.' }).max(255),
  description: z.string().max(1000).optional().default(''),
  restrict_assigned_users_to_course_programs: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export const AddDepartmentDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      restrict_assigned_users_to_course_programs: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createClearanceDepartment({
        name: values.name.trim(),
        description: (values.description ?? '').trim(),
        restrict_assigned_users_to_course_programs:
          values.restrict_assigned_users_to_course_programs,
      }),
    onSuccess: () => {
      toast.success('Department created.');
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['clearance_departments'] });
    },
    onError: () => {
      toast.error('Failed to create department.');
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Add department
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New clearance department</DialogTitle>
          <DialogDescription>
            Departments group together users that sign off on specific
            clearances.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <FormInput
            form={form}
            name="name"
            label="Department name"
            placeholder="e.g. Academic Affairs"
          />
          <FormInput
            form={form}
            name="description"
            label="Description (optional)"
            placeholder="Short description of this department's role"
          />
          <div className="border-border bg-muted/30 flex gap-3 rounded-2xl border p-3">
            <Checkbox
              id="clearance-course-program-scope"
              checked={form.watch('restrict_assigned_users_to_course_programs')}
              onCheckedChange={(value) =>
                form.setValue(
                  'restrict_assigned_users_to_course_programs',
                  value === true,
                )
              }
            />
            <div className="space-y-1">
              <Label
                htmlFor="clearance-course-program-scope"
                className="cursor-pointer font-normal"
              >
                Restrict assigned staff to their course programs
              </Label>
              <p className="text-muted-foreground text-xs">
                Users assigned to this clearance department can only sign off
                applications under their assigned Fenroll course programs.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Create department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
