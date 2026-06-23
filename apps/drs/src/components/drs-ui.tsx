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
          flush ? '' : 'px-4 py-5 sm:px-6 sm:py-8 lg:px-8',
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
        'drs-panel relative overflow-hidden rounded-4xl border p-5 shadow-sm sm:p-7',
        className,
      )}
    >
      <div className="from-primary/10 pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          {backTo || breadcrumbs?.length ? (
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
              {backTo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 gap-1 rounded-full px-2"
                  asChild
                >
                  <Link to={backTo as never}>
                    <ArrowLeft className="size-4" />
                    {backLabel}
                  </Link>
                </Button>
              ) : null}
              {breadcrumbs?.length ? (
                <nav aria-label="Breadcrumb" className="flex min-w-0">
                  <ol className="flex flex-wrap items-center gap-1.5">
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
          {eyebrow ? (
            <p className="text-primary text-xs font-semibold tracking-[0.24em] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="text-muted-foreground max-w-3xl text-sm leading-6 text-pretty sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:justify-end">
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
    <Card className={cx('drs-card overflow-hidden', className)} {...props}>
      {hasHeader ? (
        <CardHeader className="gap-3 pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              {Icon ? (
                <div className="bg-primary/10 text-primary ring-primary/10 mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              ) : null}
              <div className="min-w-0 space-y-1">
                {title ? (
                  <CardTitle className="text-lg tracking-tight">
                    {title}
                  </CardTitle>
                ) : null}
                {description ? (
                  <CardDescription className="leading-6 text-pretty">
                    {description}
                  </CardDescription>
                ) : null}
              </div>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={cx(contentClassName)}>{children}</CardContent>
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
  amber: 'from-amber-500/15 text-amber-700 ring-amber-500/20',
  emerald: 'from-emerald-500/15 text-emerald-700 ring-emerald-500/20',
  slate: 'from-slate-500/10 text-slate-700 ring-slate-500/15',
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
    <Card className={cx('drs-card overflow-hidden p-0', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              {label}
            </p>
            <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
              {value}
            </div>
            {description ? (
              <p className="text-muted-foreground mt-2 text-sm leading-5">
                {description}
              </p>
            ) : null}
          </div>
          {Icon ? (
            <div
              className={cx(
                'flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br to-transparent ring-1',
                statToneClass[tone],
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
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
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  purple: 'border-violet-200 bg-violet-50 text-violet-700',
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
        'rounded-full px-2.5 py-1 text-xs font-medium shadow-xs',
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
        'drs-card text-muted-foreground flex min-h-44 items-center justify-center gap-3 rounded-3xl border p-8 text-sm',
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
        className={cx(
          'bg-background/80 h-11 rounded-2xl pl-10',
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}

export { cx };
