import { Checkbox } from '@/components/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/field';
import { JSX } from 'react';

type FormCheckboxProps = {
  label?: string;
  name: string;
  styles?: {
    group?: string;
    checkbox?: string;
    label?: string;
  };
};

export const FormCheckbox = ({
  label,
  name,
  styles,
}: FormCheckboxProps): JSX.Element => {
  return (
    <FieldGroup className={styles?.group}>
      <Field orientation="horizontal">
        <Checkbox className={styles?.checkbox} id={name} name={name} />
        <FieldLabel className={styles?.label} htmlFor={name}>
          {label}
        </FieldLabel>
      </Field>
    </FieldGroup>
  );
};
