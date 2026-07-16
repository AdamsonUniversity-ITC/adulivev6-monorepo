import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, type UseFormReturn, useFieldArray } from 'react-hook-form';

export type SupportingRequirementFormValue = {
  id?: number | string | null;
  name: string;
  instructions?: string | null;
  is_required: boolean;
  is_active: boolean;
  sort_order?: number | null;
  allowed_mime_types?: string[];
  max_file_size_kb?: number | null;
  max_files?: number | null;
};

type Props = {
  form: UseFormReturn;
  name?: string;
  disabled?: boolean;
};

export function SupportingRequirementsFields({
  form,
  name = 'supporting_document_requirements',
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
          <p className="text-sm font-medium">
            Supporting document requirements
          </p>
          <p className="text-muted-foreground text-xs">
            Add named files that students must or may upload when requesting
            this document.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            append({
              name: '',
              instructions: '',
              is_required: true,
              is_active: true,
              sort_order: fields.length,
              allowed_mime_types: [],
              max_file_size_kb: null,
              max_files: 1,
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add requirement
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
          No supporting uploads are configured for this document.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-md border p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="text-sm font-medium">Requirement {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name={`${name}.${index}.name`}
                  render={({ field: input, fieldState }) => (
                    <div className="space-y-1">
                      <Label>Requirement name</Label>
                      <Input
                        {...input}
                        disabled={disabled}
                        placeholder="e.g. Valid ID"
                      />
                      {fieldState.error ? (
                        <p className="text-destructive text-xs">
                          {fieldState.error.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name={`${name}.${index}.max_files`}
                  render={({ field: input }) => (
                    <div className="space-y-1">
                      <Label>Max files</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        disabled={disabled}
                        value={input.value ?? 1}
                        onChange={(event) =>
                          input.onChange(Number(event.target.value))
                        }
                      />
                    </div>
                  )}
                />
              </div>

              <Controller
                control={form.control}
                name={`${name}.${index}.instructions`}
                render={({ field: input }) => (
                  <div className="mt-3 space-y-1">
                    <Label>Instructions</Label>
                    <Textarea
                      {...input}
                      value={input.value ?? ''}
                      disabled={disabled}
                      placeholder="Optional guidance shown beside the upload field."
                    />
                  </div>
                )}
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name={`${name}.${index}.max_file_size_kb`}
                  render={({ field: input }) => (
                    <div className="space-y-1">
                      <Label>Max size (KB)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={51200}
                        disabled={disabled}
                        value={input.value ?? ''}
                        placeholder="Default 20480"
                        onChange={(event) =>
                          input.onChange(
                            event.target.value === ''
                              ? null
                              : Number(event.target.value),
                          )
                        }
                      />
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name={`${name}.${index}.allowed_mime_types`}
                  render={({ field: input }) => (
                    <div className="space-y-1">
                      <Label>Allowed MIME types</Label>
                      <Input
                        disabled={disabled}
                        value={(input.value ?? []).join(', ')}
                        placeholder="e.g. application/pdf, image/jpeg"
                        onChange={(event) =>
                          input.onChange(
                            event.target.value
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </div>
                  )}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-4">
                <Controller
                  control={form.control}
                  name={`${name}.${index}.is_required`}
                  render={({ field: input }) => (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={Boolean(input.value)}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          input.onChange(Boolean(checked))
                        }
                      />
                      Required
                    </label>
                  )}
                />
                <Controller
                  control={form.control}
                  name={`${name}.${index}.is_active`}
                  render={({ field: input }) => (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={Boolean(input.value)}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          input.onChange(Boolean(checked))
                        }
                      />
                      Active
                    </label>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
