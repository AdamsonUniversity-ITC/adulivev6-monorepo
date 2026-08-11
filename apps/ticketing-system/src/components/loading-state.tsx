import { Spinner } from "@repo/ui/components/spinner";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({
  label = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "text-muted-foreground flex flex-col items-center justify-center gap-3 py-16",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Spinner className="size-6" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
