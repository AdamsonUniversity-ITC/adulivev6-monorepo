import type { HTMLAttributes, ReactNode } from 'react';

type PageProps = HTMLAttributes<HTMLDivElement> & {
  width?: 'narrow' | 'default' | 'wide' | 'full';
};

const widths: Record<NonNullable<PageProps['width']>, string> = {
  narrow: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

export function Page({ width = 'default', className = '', ...props }: PageProps) {
  return <div className={`mx-auto w-full min-w-0 space-y-4 2xl:space-y-6 ${widths[width]} ${className}`} {...props} />;
}

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions, className = '', ...props }: PageHeaderProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${className}`} {...props}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--abms-primary)]">{eyebrow}</p>}
        <h1 className="break-words font-[var(--abms-font-display)] text-xl font-bold tracking-tight text-[var(--abms-text)] sm:text-2xl 2xl:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--abms-text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">{actions}</div>}
    </div>
  );
}

export function PageSurface({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`min-w-0 rounded-[var(--abms-radius-lg)] border border-[var(--abms-border)] bg-[var(--abms-surface-overlay)] shadow-[var(--abms-shadow-md)] backdrop-blur-sm ${className}`} {...props} />;
}

export function FieldError({ children, className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return <p role="alert" className={`mt-1 text-xs font-medium text-[var(--abms-danger)] ${className}`} {...props}>{children}</p>;
}
