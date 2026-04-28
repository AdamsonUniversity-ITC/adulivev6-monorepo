import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from '@/components/field';
import { Switch } from '@/components/switch';
import { JSX } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';

export type FormSwitchProps = {
  form: UseFormReturn;
  label?: string;
  name: string;
  styles?: {
    group?: string;
    input?: string;
    label?: string;
  };
  desc?: string;
} & React.ComponentProps<'switch'>;

export const FormSwitch = ({
  form,
  label,
  name,
  styles,
  desc,
}: FormSwitchProps): JSX.Element => {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <>
          <FieldLabel htmlFor={name}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{label}</FieldTitle>
                {desc && <FieldDescription>{desc}</FieldDescription>}
              </FieldContent>
              <Switch {...field} id={name} />
            </Field>
          </FieldLabel>
          {fieldState.invalid && (
            <FieldError className="text-xs" errors={[fieldState.error]} />
          )}
        </>
      )}
    />
  );
};
