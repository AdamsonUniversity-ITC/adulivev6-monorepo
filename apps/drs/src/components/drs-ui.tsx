import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui/components/empty';
import { Input } from '@repo/ui/components/input';
import { Spinner } from '@repo/ui/components/spinner';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowLeft,
  FileQuestion,
  FileSearch,
  LucideIcon,
  Search,
} from 'lucide-react';
import * as React from 'react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const maxWidthClass = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
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
        'drs-surface text-foreground min-h-[calc(100dvh-3.5rem)]',
        className,
      )}
    >
      <a
        href="#drs-main"
        className="bg-background text-foreground focus-visible:ring-ring fixed top-3 left-3 z-50 -translate-y-20 rounded-full border px-4 py-2 text-sm shadow-lg transition focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <main
        id="drs-main"
        className={cx(
          'mx-auto w-full',
          maxWidthClass[maxWidth],
          flush ? '' : 'px-4 py-3 sm:px-6 sm:py-4 lg:px-8',
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
    <header
      className={cx(
        'border-border/80 bg-background/70 relative rounded-xl border px-3 py-2.5 shadow-xs sm:px-4',
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-2 sm:items-center">
          {backTo ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground -ml-1 h-8 shrink-0 gap-1 px-2"
              asChild
            >
              <Link to={backTo as never}>
                <ArrowLeft className="size-4" />
                <span className="sr-only sm:not-sr-only">{backLabel}</span>
              </Link>
            </Button>
          ) : null}
          <div className="min-w-0 space-y-0.5">
            {breadcrumbs?.length ? (
              <nav aria-label="Breadcrumb" className="flex min-w-0">
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
            {eyebrow ? (
              <p className="text-primary text-[10px] font-semibold tracking-[0.16em] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-balance">
                {title}
              </h1>
              {badges ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {badges}
                </div>
              ) : null}
            </div>
            {description ? (
              <p className="text-muted-foreground max-w-3xl text-xs leading-5 text-pretty sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

type DrsSectionCardProps = React.ComponentProps<typeof Card> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
  contentClassName?: string;
};

export function DrsSectionCard({
  title,
  description,
  action,
  icon: Icon,
  children,
  className,
  contentClassName,
  ...props
}: DrsSectionCardProps) {
  const hasHeader = title || description || action || Icon;

  return (
    <Card
      className={cx('drs-card gap-3 overflow-hidden py-3', className)}
      {...props}
    >
      {hasHeader ? (
        <CardHeader className="gap-2 px-4 pb-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-2.5">
              {Icon ? (
                <div className="bg-primary/10 text-primary ring-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
              ) : null}
              <div className="min-w-0 space-y-0.5">
                {title ? (
                  <CardTitle className="text-base tracking-tight">
                    {title}
                  </CardTitle>
                ) : null}
                {description ? (
                  <CardDescription className="text-xs leading-5 text-pretty sm:text-sm">
                    {description}
                  </CardDescription>
                ) : null}
              </div>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={cx('px-4', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

type DrsStatCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'blue' | 'amber' | 'emerald' | 'slate';
  className?: string;
};

const statToneClass: Record<NonNullable<DrsStatCardProps['tone']>, string> = {
  blue: 'from-primary/15 text-primary ring-primary/15',
  amber:
    'from-amber-500/15 text-amber-700 ring-amber-500/20 dark:text-amber-300',
  emerald:
    'from-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
  slate: 'from-muted text-muted-foreground ring-border/60 dark:from-muted/40',
};

export function DrsStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'blue',
  className,
}: DrsStatCardProps) {
  return (
    <Card className={cx('drs-card gap-0 overflow-hidden py-0', className)}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
              {label}
            </p>
            <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
              {value}
            </div>
            {description ? (
              <p className="text-muted-foreground mt-1 text-xs leading-4">
                {description}
              </p>
            ) : null}
          </div>
          {Icon ? (
            <div
              className={cx(
                'flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br to-transparent ring-1',
                statToneClass[tone],
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

type DrsMetricsStripItem = {
  label: React.ReactNode;
  value: React.ReactNode;
};

type DrsMetricsStripProps = {
  items: DrsMetricsStripItem[];
  className?: string;
  'aria-label'?: string;
};

/** Slim horizontal metrics bar for list pages (replaces tall stat card grids). */
export function DrsMetricsStrip({
  items,
  className,
  'aria-label': ariaLabel = 'Summary',
}: DrsMetricsStripProps) {
  if (items.length === 0) return null;

  return (
    <div
      aria-label={ariaLabel}
      className={cx(
        'border-border/80 bg-background/70 text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border px-3 py-2 text-xs shadow-xs',
        className,
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={`${String(item.label)}-${index}`}>
          {index > 0 ? (
            <span className="bg-border hidden h-3 w-px sm:block" aria-hidden />
          ) : null}
          <span className="inline-flex items-baseline gap-1.5">
            <span className="font-medium tracking-wide uppercase">
              {item.label}
            </span>
            <span className="text-foreground font-semibold tabular-nums">
              {item.value}
            </span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

type DrsStatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple';

const statusToneClass: Record<DrsStatusTone, string> = {
  neutral: 'border-border bg-muted/70 text-muted-foreground',
  info: 'border-primary/25 bg-primary/10 text-primary',
  success: 'border-chart-2/40 bg-chart-2/15 text-chart-2',
  warning: 'border-chart-4/40 bg-chart-4/15 text-chart-4',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  purple: 'border-chart-3/40 bg-chart-3/15 text-chart-3',
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
        'rounded-full px-2 py-0.5 text-[11px] font-medium shadow-xs',
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
    value.includes('pending') ||
    value.includes('payment') ||
    value.includes('review') ||
    value.includes('process') ||
    value.includes('queue')
  ) {
    return 'warning';
  }
  if (
    value.includes('reject') ||
    value.includes('fail') ||
    value.includes('cancel') ||
    value.includes('error')
  ) {
    return 'danger';
  }
  if (value.includes('delivery') || value.includes('dispatch')) {
    return 'info';
  }
  if (value.includes('foreign') || value.includes('admin')) {
    return 'purple';
  }
  return 'neutral';
}

export function formatStatusLabel(value?: string | null): string {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (!normalized) return '-';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function DrsEmptyState({
  title = 'No records found',
  description,
  action,
  icon: Icon = FileSearch,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Empty className={cx('bg-muted/20 border border-dashed', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-5" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export function DrsLoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        'drs-card text-muted-foreground flex min-h-28 items-center justify-center gap-3 rounded-xl border p-5 text-sm',
        className,
      )}
    >
      <Spinner className="size-5" />
      <span>{label}</span>
    </div>
  );
}

export function DrsErrorState({
  title = 'Could not load this view',
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
    <DrsEmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={action}
      className={cx('border-destructive/30 bg-destructive/5', className)}
    />
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
      icon={FileQuestion}
      title={title}
      description={description}
      action={action}
      className={cx('border-muted bg-muted/10', className)}
    />
  );
}

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
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        id={inputId}
        className={cx('bg-background/80 h-9 rounded-xl pl-9', inputClassName)}
        {...props}
      />
    </div>
  );
}

export { cx };
