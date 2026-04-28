import { Checkbox } from '@/components/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/field';
import { JSX } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';

type FormCheckboxProps = {
  form: UseFormReturn;
  label?: string;
  name: string;
  styles?: {
    group?: string;
    checkbox?: string;
    label?: string;
  };
};

export const FormCheckbox = ({
  form,
  label,
  name,
  styles,
}: FormCheckboxProps): JSX.Element => {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal">
          <Checkbox
            checked={!!field.value}
            onCheckedChange={(val) => field.onChange(!!val)}
            className={styles?.checkbox}
            id={name}
          />
          <FieldLabel className={styles?.label} htmlFor={name}>
            {label}
          </FieldLabel>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};
