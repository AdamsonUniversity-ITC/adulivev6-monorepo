import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/field';
import { Input } from '@/components/input';
import { JSX } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';

export type FormInputProps = {
  form: UseFormReturn;
  label?: string;
  name: string;
  styles?: {
    group?: string;
    input?: string;
    label?: string;
  };
  desc?: string;
} & React.ComponentProps<'input'>;

export const FormInput = ({
  form,
  label,
  name,
  styles,
  placeholder,
  type,
  desc,
}: FormInputProps): JSX.Element => {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input {...field} id={name} type={type} placeholder={placeholder} />
          {desc && <FieldDescription>{desc}</FieldDescription>}
          {fieldState.invalid && (
            <FieldError className="text-xs" errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  );
};
