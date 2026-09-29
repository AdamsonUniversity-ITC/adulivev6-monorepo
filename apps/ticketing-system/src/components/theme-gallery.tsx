import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  APPEARANCE_THEMES,
  BOARD_THEME_PRESETS,
  type AppearanceThemeId,
  type BoardThemePresetId,
} from "@/lib/board-theme";

type ThemeGalleryProps = {
  value: BoardThemePresetId;
  disabled?: boolean;
  onSelect: (theme: AppearanceThemeId) => void;
};

export function ThemeGallery({ value, disabled, onSelect }: ThemeGalleryProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mode = mounted && resolvedTheme === "light" ? "light" : "dark";
  const saved = BOARD_THEME_PRESETS.find((preset) => preset.id === value);
  const inGallery = APPEARANCE_THEMES.some((theme) => theme.id === value);

  return (
    <div className="space-y-3">
      {!inGallery && saved ? (
        <p className="text-muted-foreground text-sm">
          This office is using {saved.label}. Choose a theme below to change it
          for everyone here.
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          The theme is shared by everyone in this office. Light, dark, and
          system stay on each browser.
        </p>
      )}
      <div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        role="radiogroup"
        aria-label="Office theme"
      >
        {APPEARANCE_THEMES.map((theme) => {
          const selected = value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onSelect(theme.id)}
              className={[
                "bg-card focus-visible:ring-ring overflow-hidden rounded-lg border text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60",
                selected
                  ? "border-primary ring-primary/30 shadow-sm ring-2"
                  : "border-border hover:border-foreground/25",
              ].join(" ")}
            >
              <ThemeMiniature id={theme.id} mode={mode} />
              <div className="flex items-start justify-between gap-2 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {theme.label}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
                    {theme.description}
                  </span>
                </span>
                {selected ? (
                  <span className="bg-primary text-primary-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3" aria-hidden />
                    <span className="sr-only">Selected</span>
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThemeMiniature({
  id,
  mode,
}: {
  id: AppearanceThemeId;
  mode: "light" | "dark";
}) {
  return (
    <div
      data-board-theme={id}
      className={
        mode === "dark"
          ? "theme-scope dark relative h-28 overflow-hidden"
          : "theme-scope relative h-28 overflow-hidden"
      }
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--aduts-theme-bg-color)",
          backgroundImage:
            "var(--aduts-theme-bg-pattern), var(--aduts-theme-bg)",
          backgroundSize:
            "var(--aduts-theme-bg-pattern-size), var(--aduts-theme-bg-size)",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor:
            "color-mix(in oklab, var(--background) 74%, transparent)",
        }}
      />
      <div className="relative flex h-full">
        <div className="bg-sidebar border-sidebar-border w-8 border-r" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5">
          <div className="bg-foreground/80 h-1.5 w-12 rounded-full" />
          <div className="flex gap-1.5">
            <div className="bg-card border-border h-9 flex-1 rounded-sm border" />
            <div className="bg-card border-border h-9 flex-1 rounded-sm border" />
          </div>
          <div className="bg-primary mt-auto h-1.5 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
