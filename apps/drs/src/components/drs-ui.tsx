import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Spinner } from '@repo/ui/components/spinner';
import { Link } from '@tanstack/react-router';
import { AlertCircle, ArrowLeft, Search } from 'lucide-react';
import * as React from 'react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/* -------------------------------------------------------------------------- */
/* Page frame                                                                 */
/* -------------------------------------------------------------------------- */

const maxWidthClass = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-[90rem]',
  full: 'max-w-none',
} as const;

type DrsPageShellProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: keyof typeof maxWidthClass;
  flush?: boolean;
};

export function DrsPageShell({
  children,
  className,
  contentClassName,
  maxWidth = 'lg',
  flush = false,
}: DrsPageShellProps) {
  return (
    <div
      className={cx(
        'drs-surface text-foreground min-h-[calc(100dvh-6.25rem)]',
        className,
      )}
    >
      <a
        href="#drs-main"
        className="bg-background focus-visible:ring-ring fixed top-3 left-3 z-50 -translate-y-20 rounded-md border px-3 py-2 text-sm shadow-md transition focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <main
        id="drs-main"
        className={cx(
          'mx-auto w-full',
          maxWidthClass[maxWidth],
          flush ? '' : 'px-4 py-5 sm:px-6 lg:px-8',
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

type Crumb = {
  label: string;
  to?: string;
};

type DrsPageHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  breadcrumbs?: Crumb[];
  backTo?: string;
  backLabel?: string;
  className?: string;
};

/**
 * Page title block. Separated from content by a hairline rather than a card,
 * so the page reads as one document instead of a stack of panels.
 */
export function DrsPageHeader({
  eyebrow,
  title,
  description,
  actions,
  badges,
  breadcrumbs,
  backTo,
  backLabel = 'Back',
  className,
}: DrsPageHeaderProps) {
  return (
    <header className={cx('border-border/70 border-b pb-4', className)}>
      {breadcrumbs?.length || backTo ? (
        <div className="mb-2 flex min-w-0 items-center gap-2">
          {backTo ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground -ml-2 h-7 gap-1.5 px-2 text-xs"
              asChild
            >
              <Link to={backTo as never}>
                <ArrowLeft className="size-3.5" />
                {backLabel}
              </Link>
            </Button>
          ) : null}
          {breadcrumbs?.length ? (
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <li key={`${crumb.label}-${index}`} className="flex">
                      {index > 0 ? (
                        <span className="text-border mx-1">/</span>
                      ) : null}
                      {crumb.to && !isLast ? (
                        <Link
                          to={crumb.to as never}
                          className="hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span
                          aria-current={isLast ? 'page' : undefined}
                          className={isLast ? 'text-foreground' : ''}
                        >
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          {eyebrow ? (
            <DrsOverline className="mb-1">{eyebrow}</DrsOverline>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {title}
            </h1>
            {badges ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {badges}
              </div>
            ) : null}
          </div>
          {description ? (
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Grouping                                                                   */
/* -------------------------------------------------------------------------- */

export function DrsOverline({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        'text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase',
        className,
      )}
    >
      {children}
    </p>
  );
}

type DrsSectionProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  /** Renders a hairline under the heading. Use when sections stack on one page. */
  divided?: boolean;
};

/**
 * Default content container. Groups with a heading and whitespace instead of a
 * card, so pages don't become a stack of boxes.
 */
export function DrsSection({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
  divided = false,
}: DrsSectionProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section className={cx('min-w-0', className)}>
      {hasHeader ? (
        <div
          className={cx(
            'flex flex-wrap items-end justify-between gap-x-4 gap-y-1',
            divided && 'border-border/70 border-b pb-2',
            headerClassName,
          )}
        >
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-muted-foreground mt-0.5 text-sm text-pretty">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cx(hasHeader && 'mt-3', contentClassName)}>
        {children}
      </div>
    </section>
  );
}

type DrsPanelProps = React.ComponentProps<'div'> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
};

/**
 * Bordered container. Only for content that genuinely needs to be set apart
 * from the page — an action rail, a summary, an editable sub-record.
 */
export function DrsPanel({
  title,
  description,
  action,
  footer,
  children,
  className,
  contentClassName,
  ...props
}: DrsPanelProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <div className={cx('bg-card rounded-lg border', className)} {...props}>
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-muted-foreground mt-0.5 text-sm text-pretty">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cx('px-4 py-3', contentClassName)}>{children}</div>
      {footer ? (
        <div className="bg-muted/30 rounded-b-lg border-t px-4 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Filter/search row above a table. Keeps controls on one baseline instead of
 * inside a card header.
 */
export function DrsToolbar({
  children,
  className,
  trailing,
}: {
  children?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center gap-2 sm:flex-nowrap',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {children}
      </div>
      {trailing ? (
        <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs tabular-nums">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Record display                                                             */
/* -------------------------------------------------------------------------- */

const dataListColumns = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const;

/** Label/value record display. Replaces ad-hoc grids of divs on detail pages. */
export function DrsDataList({
  children,
  columns = 2,
  className,
  ...props
}: React.ComponentProps<'dl'> & {
  columns?: keyof typeof dataListColumns;
}) {
  return (
    <dl
      {...props}
      className={cx(
        'grid grid-cols-1 gap-x-6 gap-y-3',
        dataListColumns[columns],
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function DrsDataItem({
  label,
  children,
  hint,
  className,
  wide = false,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className={cx('min-w-0', wide && 'sm:col-span-full', className)}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">
        {children === null || children === undefined || children === '' ? (
          <span className="text-muted-foreground font-normal">—</span>
        ) : (
          children
        )}
      </dd>
      {hint ? (
        <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

/** A single labelled number. Deliberately not a card. */
export function DrsFigure({
  label,
  value,
  description,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('min-w-0', className)}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {description ? (
        <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
      ) : null}
    </div>
  );
}

type DrsMetricsStripItem = {
  label: React.ReactNode;
  value: React.ReactNode;
};

/** Slim inline counters. Used as a caption under a table, not as a stat row. */
export function DrsMetricsStrip({
  items,
  className,
  'aria-label': ariaLabel = 'Summary',
}: {
  items: DrsMetricsStripItem[];
  className?: string;
  'aria-label'?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      aria-label={ariaLabel}
      className={cx(
        'text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs',
        className,
      )}
    >
      {items.map((item, index) => (
        <span
          key={`${String(item.label)}-${index}`}
          className="inline-flex items-baseline gap-1.5"
        >
          <span>{item.label}</span>
          <span className="text-foreground font-medium tabular-nums">
            {item.value}
          </span>
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

type DrsStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const statusToneClass: Record<DrsStatusTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  info: 'border-status-info/25 bg-status-info-surface text-status-info',
  success:
    'border-status-success/25 bg-status-success-surface text-status-success',
  warning:
    'border-status-warning/25 bg-status-warning-surface text-status-warning',
  danger: 'border-status-danger/25 bg-status-danger-surface text-status-danger',
};

export function DrsStatusBadge({
  tone = 'neutral',
  className,
  ...props
}: React.ComponentProps<typeof Badge> & { tone?: DrsStatusTone }) {
  return (
    <Badge
      variant="outline"
      className={cx(
        'rounded-sm px-1.5 py-0 text-[11px] font-medium',
        statusToneClass[tone],
        className,
      )}
      {...props}
    />
  );
}

export function toneForStatus(status?: string | null): DrsStatusTone {
  const value = String(status ?? '').toLowerCase();
  if (
    value.includes('paid') ||
    value.includes('complete') ||
    value.includes('clear') ||
    value.includes('approved') ||
    value.includes('verified') ||
    value.includes('released')
  ) {
    return 'success';
  }
  if (
    value.includes('reject') ||
    value.includes('fail') ||
    value.includes('cancel') ||
    value.includes('error')
  ) {
    return 'danger';
  }
  if (
    value.includes('pending') ||
    value.includes('payment') ||
    value.includes('review') ||
    value.includes('process') ||
    value.includes('queue')
  ) {
    return 'warning';
  }
  if (value.includes('delivery') || value.includes('dispatch')) {
    return 'info';
  }
  return 'neutral';
}

export function formatStatusLabel(value?: string | null): string {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (!normalized) return '—';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/* -------------------------------------------------------------------------- */
/* States                                                                     */
/* -------------------------------------------------------------------------- */

export function DrsEmptyState({
  title = 'Nothing here yet',
  description,
  action,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-md text-sm text-pretty">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function DrsErrorState({
  title = 'Could not load this view',
  description = 'The request failed. Check your connection and try again.',
  action,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cx(
        'border-status-danger/30 bg-status-danger-surface/40 flex flex-col items-center justify-center gap-2 rounded-lg border px-6 py-10 text-center',
        className,
      )}
    >
      <AlertCircle className="text-status-danger size-5" aria-hidden="true" />
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-md text-sm text-pretty">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function DrsNotFoundState({
  title = 'Page not found',
  description = 'The page or resource you are looking for does not exist or may have been moved.',
  action,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <DrsEmptyState
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

/** Inline spinner + label. The only spinner in the app. */
export function DrsInlineLoading({
  label = 'Loading…',
  size = 'sm',
  className,
}: {
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const spinner = { xs: 'size-3', sm: 'size-4', md: 'size-5' }[size];
  const text = size === 'xs' ? 'text-xs' : 'text-sm';

  return (
    <span
      role="status"
      aria-live="polite"
      className={cx(
        'text-muted-foreground inline-flex items-center gap-2',
        text,
        className,
      )}
    >
      <Spinner className={spinner} />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

/** Centred loading block for a whole section or route. */
export function DrsLoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center justify-center py-12', className)}>
      <DrsInlineLoading label={label} />
    </div>
  );
}

/** Table placeholder that keeps the page from collapsing while data loads. */
export function DrsTableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading records"
      className={cx('overflow-hidden rounded-lg border', className)}
    >
      <div className="bg-muted/40 flex items-center gap-4 border-b px-4 py-2.5">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a label/value record block. */
export function DrsDataListSkeleton({
  items = 6,
  columns = 2,
  className,
}: {
  items?: number;
  columns?: keyof typeof dataListColumns;
  className?: string;
}) {
  return (
    <DrsDataList
      columns={columns}
      className={cx('animate-pulse', className)}
      aria-label="Loading details"
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
      ))}
    </DrsDataList>
  );
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

export function DrsSearchField({
  label,
  className,
  inputClassName,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  inputClassName?: string;
}) {
  const id = React.useId();
  const inputId = props.id ?? id;

  return (
    <div className={cx('relative', className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        id={inputId}
        className={cx('h-9 pl-8', inputClassName)}
        {...props}
      />
    </div>
  );
}

export { cx };
