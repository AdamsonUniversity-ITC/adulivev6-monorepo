import { JSX } from 'react';

import {
  FLAG_ICON_ALLOWLIST,
  FLAG_ICON_COMPONENTS,
  type FlagIconName,
} from '../-lib/flag-icons.ts';

type Props = {
  value: FlagIconName;
  onChange: (icon: FlagIconName) => void;
  disabled?: boolean;
  className?: string;
};

export function FlagIconPicker({
  value,
  onChange,
  disabled = false,
  className,
}: Props): JSX.Element {
  return (
    <div
      className={['grid grid-cols-5 gap-1 sm:grid-cols-10', className]
        .filter(Boolean)
        .join(' ')}
      role="radiogroup"
      aria-label="Flag icon"
    >
      {FLAG_ICON_ALLOWLIST.map((iconName) => {
        const Icon = FLAG_ICON_COMPONENTS[iconName];
        const selected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={iconName}
            disabled={disabled}
            className={
              selected
                ? 'border-primary bg-primary/10 text-primary hover:bg-muted flex size-8 items-center justify-center rounded border transition-colors'
                : 'border-border/70 text-muted-foreground hover:bg-muted flex size-8 items-center justify-center rounded border transition-colors'
            }
            onClick={() => onChange(iconName)}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
