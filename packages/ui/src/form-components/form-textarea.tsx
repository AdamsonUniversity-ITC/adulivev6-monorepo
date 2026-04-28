import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/field';
import { Textarea } from '@/components/textarea';
import { JSX } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';

export type FormTextareaProps = {
  form: UseFormReturn;
  label?: string;
  name: string;
  styles?: {
    group?: string;
    input?: string;
    label?: string;
  };
  desc?: string;
  rest?: React.ComponentProps<'textarea'>;
} & React.ComponentProps<'textarea'>;

export const FormTextarea = ({
  form,
  label,
  name,
  styles,
  placeholder,
  desc,
  rest,
}: FormTextareaProps): JSX.Element => {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Textarea {...field} id={name} placeholder={placeholder} {...rest} />
          {desc && <FieldDescription>{desc}</FieldDescription>}
          {fieldState.invalid && (
            <FieldError className="text-xs" errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  );
};
