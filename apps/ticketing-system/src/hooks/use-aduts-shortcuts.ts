import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(target.closest("[role='textbox'], [contenteditable='true']"));
}

function ticketRows(): HTMLTableRowElement[] {
  return Array.from(
    document.querySelectorAll<HTMLTableRowElement>(
      "[data-slot='table-body'] tr[data-ticket-number]",
    ),
  );
}

export function useAdutsShortcuts(options: {
  onOpenPalette: () => void;
  onOpenHelp: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    setHighlightIndex(-1);
  }, [pathname]);

  useEffect(() => {
    const rows = ticketRows();
    rows.forEach((row, index) => {
      row.classList.toggle("bg-muted/50", index === highlightIndex);
      row.classList.toggle("ring-1", index === highlightIndex);
      row.classList.toggle("ring-primary/40", index === highlightIndex);
    });
  }, [highlightIndex, pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        optionsRef.current.onOpenPalette();
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (event.key === "?") {
        event.preventDefault();
        optionsRef.current.onOpenHelp();
        return;
      }

      if (event.key === "/" && pathname.startsWith("/tickets")) {
        event.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search ticket"]',
        );
        input?.focus();
        return;
      }

      const onList = pathname === "/tickets" || pathname === "/tickets/";
      const onDetail = pathname.startsWith("/tickets/") && !onList;

      if (onList) {
        const rows = ticketRows();
        if (event.key === "j") {
          event.preventDefault();
          setHighlightIndex((current) => {
            if (rows.length === 0) return -1;
            return Math.min(rows.length - 1, Math.max(0, current + 1));
          });
          return;
        }
        if (event.key === "k") {
          event.preventDefault();
          setHighlightIndex((current) => {
            if (rows.length === 0) return -1;
            return Math.max(0, current <= 0 ? 0 : current - 1);
          });
          return;
        }
        if (event.key === "Enter" && highlightIndex >= 0) {
          const row = rows[highlightIndex];
          if (row?.dataset.ticketNumber) {
            event.preventDefault();
            row.click();
          }
          return;
        }
      }

      if (onDetail) {
        if (event.key.toLowerCase() === "r") {
          event.preventDefault();
          window.dispatchEvent(
            new CustomEvent("aduts:set-chat-channel", {
              detail: "conversation",
            }),
          );
          return;
        }
        if (event.key.toLowerCase() === "i") {
          event.preventDefault();
          window.dispatchEvent(
            new CustomEvent("aduts:set-chat-channel", {
              detail: "internal",
            }),
          );
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, highlightIndex]);
}
