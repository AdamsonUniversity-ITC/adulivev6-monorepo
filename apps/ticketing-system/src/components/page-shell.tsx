import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  width?: "default" | "narrow" | "wide";
  bordered?: boolean;
  children: ReactNode;
};

const widthClasses = {
  default: "max-w-6xl",
  narrow: "max-w-xl",
  wide: "max-w-7xl",
} as const;

export function PageShell({
  title,
  description,
  action,
  width = "default",
  bordered = true,
  children,
}: PageShellProps) {
  const headerClassName = bordered
    ? "flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between"
    : "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between";

  return (
    <section
      className={`mx-auto w-full space-y-6 md:space-y-8 ${widthClasses[width]}`}
    >
      <div className={headerClassName}>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h2>
          {description ? (
            <div className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              {description}
            </div>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
