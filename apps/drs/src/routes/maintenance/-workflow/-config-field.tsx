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
import type { WorkflowKind } from '../-lib/api/workflow/types.ts';

type Props = {
  fieldKey: string;
  schema: WorkflowKind['config_schema'][string];
  value: unknown;
  onChange: (value: unknown) => void;
};

/**
 * Renders one form control for a task kind's config_schema entry,
 * driven by `schema.type` (boolean | integer | otherwise text).
 */
export const ConfigField = ({ fieldKey, schema, value, onChange }: Props) => {
  const id = `config-${fieldKey}`;
  const label = fieldKey.replace(/_/g, ' ');

  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center gap-3">
        <Checkbox
          id={id}
          checked={Boolean(value ?? schema.default)}
          onCheckedChange={(next) => onChange(next === true)}
        />
        <Label htmlFor={id} className="cursor-pointer font-normal capitalize">
          {label}
        </Label>
      </div>
    );
  }

  if (schema.type === 'integer') {
    return (
      <div>
        <Label htmlFor={id} className="capitalize">
          {label}
        </Label>
        <Input
          id={id}
          type="number"
          min={schema.min ?? 0}
          className="mt-1"
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === '' ? '' : Number(raw));
          }}
        />
      </div>
    );
  }

  if (schema.type === 'enum' && Array.isArray(schema.options)) {
    return (
      <div>
        <Label htmlFor={id} className="capitalize">
          {label}
        </Label>
        <Select
          value={String(value ?? schema.default ?? '')}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger id={id} className="mt-1">
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {schema.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={id} className="capitalize">
        {label}
      </Label>
      <Input
        id={id}
        className="mt-1"
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};
