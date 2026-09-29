import { Button } from "@repo/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active =
    mounted && (theme === "light" || theme === "dark" || theme === "system")
      ? theme
      : "dark";
  const resolvedDark = !mounted || resolvedTheme !== "light";
  const TriggerIcon = resolvedDark ? Moon : Sun;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-8"
          aria-label="Appearance"
        >
          <TriggerIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-sm font-medium">Appearance</p>
        <p className="text-muted-foreground mt-0.5 mb-3 text-xs leading-snug">
          Light, dark, or match this computer. The office theme stays the same.
        </p>
        <div
          className="grid grid-cols-3 gap-1.5"
          role="radiogroup"
          aria-label="Appearance"
        >
          {MODES.map((mode) => {
            const selected = active === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(mode.id)}
                className={[
                  "focus-visible:ring-ring flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs focus-visible:ring-2 focus-visible:outline-none",
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="size-4" aria-hidden />
                {mode.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
