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
  return <div className={`mx-auto w-full space-y-6 ${widths[width]} ${className}`} {...props} />;
}

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions, className = '', ...props }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`} {...props}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--abms-primary)]">{eyebrow}</p>}
        <h1 className="font-[var(--abms-font-display)] text-2xl font-bold tracking-tight text-[var(--abms-text)] sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--abms-text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageSurface({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-[var(--abms-radius-lg)] border border-[var(--abms-border)] bg-[var(--abms-surface-overlay)] shadow-[var(--abms-shadow-md)] backdrop-blur-sm ${className}`} {...props} />;
}

export function FieldError({ children, className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return <p role="alert" className={`mt-1 text-xs font-medium text-[var(--abms-danger)] ${className}`} {...props}>{children}</p>;
}
