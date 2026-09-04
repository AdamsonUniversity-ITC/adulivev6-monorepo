import { DrsInlineLoading, DrsLoadingState } from '@/components/drs-ui.tsx';

export type LoadingIndicatorProps = {
  /** Text shown next to the spinner. Empty string renders the spinner alone. */
  label?: string;
  /**
   * Layout variant.
   *  - `inline`: spinner + label on one line (for small areas like list rows).
   *  - `block`:  centered, padded — for full-section loading states.
   */
  variant?: 'inline' | 'block';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
};

/** Thin wrapper kept for call-site compatibility; the implementation lives in drs-ui. */
export function LoadingIndicator({
  label = 'Loading…',
  variant = 'inline',
  size = 'sm',
  className,
}: LoadingIndicatorProps) {
  if (variant === 'block') {
    return <DrsLoadingState label={label} className={className} />;
  }

  return <DrsInlineLoading label={label} size={size} className={className} />;
}
