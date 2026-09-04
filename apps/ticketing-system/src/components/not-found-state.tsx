import { FileQuestion } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Link } from "@tanstack/react-router";

type NotFoundStateProps = {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
};

export function NotFoundState({
  title = "Not found",
  description = "This ticket could not be found.",
  backTo = "/tickets",
  backLabel = "Back to tickets",
}: NotFoundStateProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-muted text-muted-foreground mb-6 flex size-16 items-center justify-center rounded-2xl">
        <FileQuestion className="size-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">{description}</p>
      <Button asChild className="mt-8 shadow-xs">
        <Link to={backTo}>{backLabel}</Link>
      </Button>
    </div>
  );
}
