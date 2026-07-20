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

const CONFIG_FIELD_LABELS: Record<string, string> = {
  sla_hours: 'SLA hours',
  allow_remarks: 'Allow remarks',
  auto_clear_enabled: 'Auto clear',
  auto_clear_operator: 'Auto clear operator',
  auto_clear_conditions: 'Auto clear conditions',
  modules: 'Clearance modules',
  auto_complete_when_priced: 'Auto complete when priced',
  allow_partial: 'Allow partial',
  require_reference_number: 'Require reference number',
  allowed_modes: 'Allowed modes',
  capture_tracking_number: 'Capture tracking number',
  require_signature: 'Require signature',
  auto_dispose_enabled: 'Auto dispose enabled',
  trigger_kind: 'Trigger kind',
  wait_working_days: 'Wait working days',
  instructions: 'Instructions',
};

const OPTION_LABELS: Record<string, string> = {
  and: 'AND (all selected)',
  or: 'OR (any selected)',
  second_application: '2nd application',
  without_osl_violation: 'Without OSL violation',
  without_unreturned_books: 'Without unreturned books',
  probationary_status: 'Probationary Status',
  library: 'Library',
  osl: 'OSL',
  student_accounts: 'Student Accounts',
  email: 'Email',
  delivery: 'Delivery',
  pickup: 'Pickup',
};

const fieldLabel = (fieldKey: string): string =>
  CONFIG_FIELD_LABELS[fieldKey] ?? fieldKey.replace(/_/g, ' ');

const optionLabel = (option: string): string =>
  OPTION_LABELS[option] ?? option.replace(/_/g, ' ');

/**
 * Renders one form control for a task kind's config_schema entry,
 * driven by `schema.type` (boolean | integer | enum | enum_set | text).
 */
export const ConfigField = ({ fieldKey, schema, value, onChange }: Props) => {
  const id = `config-${fieldKey}`;
  const label = fieldLabel(fieldKey);

  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center gap-3">
        <Checkbox
          id={id}
          checked={Boolean(value ?? schema.default)}
          onCheckedChange={(next) => onChange(next === true)}
        />
        <Label htmlFor={id} className="cursor-pointer font-normal">
          {label}
        </Label>
      </div>
    );
  }

  if (schema.type === 'integer') {
    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
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
        <Label htmlFor={id}>{label}</Label>
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
                {optionLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (schema.type === 'enum_set' && Array.isArray(schema.options)) {
    const selected = Array.isArray(value)
      ? value.map(String)
      : Array.isArray(schema.default)
        ? schema.default.map(String)
        : [];

    const toggleOption = (option: string, checked: boolean) => {
      const next = checked
        ? Array.from(new Set([...selected, option]))
        : selected.filter((item) => item !== option);
      onChange(next);
    };

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="space-y-2">
          {schema.options.map((option) => {
            const optionId = `${id}-${option}`;
            return (
              <div key={option} className="flex items-center gap-3">
                <Checkbox
                  id={optionId}
                  checked={selected.includes(option)}
                  onCheckedChange={(next) =>
                    toggleOption(option, next === true)
                  }
                />
                <Label
                  htmlFor={optionId}
                  className="cursor-pointer font-normal"
                >
                  {optionLabel(option)}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="mt-1"
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};
