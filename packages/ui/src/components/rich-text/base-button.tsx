import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export type BaseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  className?: string;
  tooltip?: React.ReactNode;
  active?: boolean;
};

export function BaseButton({
  children,
  tooltip,
  className,
  active,
  ...rest
}: BaseButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          {...rest}
          size="icon-sm"
          type="button"
          className={cn(
            "rounded-none transition-all",
            active && "bg-accent text-accent-foreground",
            className,
          )}
          variant="ghost"
          aria-label={typeof tooltip === "string" ? tooltip : undefined}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
