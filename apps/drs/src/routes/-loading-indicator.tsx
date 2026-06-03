import { Spinner } from '@repo/ui/components/spinner';

export type LoadingIndicatorProps = {
  /** Text shown next to the spinner. Empty string renders the spinner alone. */
  label?: string;
  /**
   * Layout variant.
   *  - `inline`: spinner + label on one line (for small areas like list rows or cards).
   *  - `block`:  centered, padded — for full-section loading states.
   */
  variant?: 'inline' | 'block';
  /** Size applied to both spinner icon and label text. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
};

const SPINNER_SIZE: Record<NonNullable<LoadingIndicatorProps['size']>, string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

const TEXT_SIZE: Record<NonNullable<LoadingIndicatorProps['size']>, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

export function LoadingIndicator({
  label = 'Loading…',
  variant = 'inline',
  size = 'sm',
  className,
}: LoadingIndicatorProps) {
  const content = (
    <span
      role="status"
      aria-live="polite"
      className={`text-muted-foreground inline-flex items-center gap-2 ${TEXT_SIZE[size]}`}
    >
      <Spinner className={SPINNER_SIZE[size]} />
      {label ? <span>{label}</span> : null}
    </span>
  );

  if (variant === 'block') {
    return (
      <div
        className={`flex items-center justify-center py-6${
          className ? ` ${className}` : ''
        }`}
      >
        {content}
      </div>
    );
  }

  return className ? <span className={className}>{content}</span> : content;
}
