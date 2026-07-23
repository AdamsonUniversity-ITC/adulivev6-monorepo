import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, type UseFormReturn, useFieldArray } from 'react-hook-form';

export type PackageIncludedItemFormValue = {
  id?: number | string | null;
  label: string;
  sort_order?: number | null;
};

type Props = {
  form: UseFormReturn;
  name?: string;
  disabled?: boolean;
};

export function PackageIncludedItemsFields({
  form,
  name = 'included_items',
  disabled = false,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Included items</p>
          <p className="text-muted-foreground text-xs">
            List what this package includes. Shown as bullet points to students.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            append({
              label: '',
              sort_order: fields.length,
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
          No included items are configured for this package.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <Controller
                control={form.control}
                name={`${name}.${index}.label`}
                render={({ field: input, fieldState }) => (
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label className="sr-only">Item {index + 1}</Label>
                    <Input
                      {...input}
                      disabled={disabled}
                      placeholder={`Included item ${index + 1}`}
                    />
                    {fieldState.error ? (
                      <p className="text-destructive text-xs">
                        {fieldState.error.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => remove(index)}
                aria-label={`Remove item ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
