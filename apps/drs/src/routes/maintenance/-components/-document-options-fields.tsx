import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, type UseFormReturn, useFieldArray, useWatch } from 'react-hook-form';

export type DocumentOptionFormValue = {
  id?: number | string | null;
  label: string;
  field_type: 'select' | 'textbox';
  choices?: string[];
  is_required: boolean;
  is_active: boolean;
  sort_order?: number | null;
};

type Props = {
  form: UseFormReturn;
  name?: string;
  disabled?: boolean;
};

function ChoicesEditor({
  form,
  name,
  index,
  disabled,
}: {
  form: UseFormReturn;
  name: string;
  index: number;
  disabled?: boolean;
}) {
  const choicesName = `${name}.${index}.choices` as const;
  const choices = (useWatch({ control: form.control, name: choicesName }) ??
    []) as string[];

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Choices</Label>
      <div className="space-y-2">
        {choices.map((choice, choiceIndex) => (
          <div key={choiceIndex} className="flex gap-2">
            <Input
              value={choice}
              disabled={disabled}
              placeholder={`Choice ${choiceIndex + 1}`}
              onChange={(event) => {
                const next = [...choices];
                next[choiceIndex] = event.target.value;
                form.setValue(choicesName, next, { shouldDirty: true });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || choices.length <= 1}
              onClick={() => {
                form.setValue(
                  choicesName,
                  choices.filter((_, i) => i !== choiceIndex),
                  { shouldDirty: true },
                );
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() =>
          form.setValue(choicesName, [...choices, ''], { shouldDirty: true })
        }
      >
        <Plus className="h-4 w-4" />
        Add choice
      </Button>
    </div>
  );
}

export function DocumentOptionsFields({
  form,
  name = 'options',
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
          <p className="text-sm font-medium">Document options</p>
          <p className="text-muted-foreground text-xs">
            Ask students for a select choice or short text when they request this
            document.
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
              field_type: 'textbox',
              choices: [],
              is_required: false,
              is_active: true,
              sort_order: fields.length,
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add option
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
          No options are configured for this document.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <OptionRow
              key={field.id}
              form={form}
              name={name}
              index={index}
              disabled={disabled}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionRow({
  form,
  name,
  index,
  disabled,
  onRemove,
}: {
  form: UseFormReturn;
  name: string;
  index: number;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const fieldType = useWatch({
    control: form.control,
    name: `${name}.${index}.field_type`,
  }) as 'select' | 'textbox' | undefined;

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium">Option {index + 1}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${name}-${index}-label`}>Label</Label>
          <Input
            id={`${name}-${index}-label`}
            disabled={disabled}
            {...form.register(`${name}.${index}.label`)}
          />
        </div>

        <Controller
          control={form.control}
          name={`${name}.${index}.field_type`}
          render={({ field }) => (
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === 'select') {
                    const current = form.getValues(
                      `${name}.${index}.choices`,
                    ) as string[] | undefined;
                    if (!current || current.length === 0) {
                      form.setValue(`${name}.${index}.choices`, [''], {
                        shouldDirty: true,
                      });
                    }
                  }
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="textbox">Textbox</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {fieldType === 'select' ? (
          <ChoicesEditor
            form={form}
            name={name}
            index={index}
            disabled={disabled}
          />
        ) : null}

        <Controller
          control={form.control}
          name={`${name}.${index}.is_required`}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={field.value === true}
                disabled={disabled}
                onCheckedChange={(value) => field.onChange(value === true)}
              />
              Required
            </label>
          )}
        />

        <Controller
          control={form.control}
          name={`${name}.${index}.is_active`}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={field.value !== false}
                disabled={disabled}
                onCheckedChange={(value) => field.onChange(value === true)}
              />
              Active
            </label>
          )}
        />
      </div>
    </div>
  );
}
