import type { TanstackType } from "@/components/shared/datatable/types";
import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import React, { type NamedExoticComponent, type ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface DataTableSearchBarInterface {
  tanstack: TanstackType;
  /**
   * Controls when the search keyword is applied.
   * - "debounce": apply after typing (debounced)
   * - "enter": apply only when pressing Enter
   */
  mode?: "debounce" | "enter";
  /**
   * Debounce delay (ms) when `mode` is "debounce".
   */
  debounceMs?: number;
  styles?: {
    icon?: string;
    input?: string;
  };
  data?: {
    placeholder?: string;
  };
  icon?: ReactNode;
  children?: ReactNode;
}

const DataTableSearchBar: NamedExoticComponent<DataTableSearchBarInterface> =
  React.memo(
    ({
      tanstack,
      data,
      styles,
      icon,
      children,
      mode,
      debounceMs,
    }): ReactNode => {
      const { hook } = tanstack;
      const { setKeyword, setPage } = hook;
      const searchMode = mode ?? "debounce";
      const debounceDelay = debounceMs ?? 300;
      const initialKeyword =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("keyword") ?? ""
          : "";
      const [value, setValue] = useState<string>(hook.keyword || initialKeyword);
      const debounceRef = useRef<number | null>(null);

      const applyKeyword = useCallback(
        (nextKeyword: string) => {
          setKeyword(nextKeyword.trim());
          setPage(1); // keep search results consistent across pages
        },
        [setKeyword, setPage],
      );

      useEffect(() => {
        if (searchMode !== "debounce") return;
        if (debounceRef.current) {
          window.clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
          applyKeyword(value);
        }, debounceDelay);

        return () => {
          if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
          }
        };
      }, [applyKeyword, debounceDelay, searchMode, value]);

      return (
        <>
          <div className="relative flex items-center md:grow-0">
            {icon ? (
              <span
                className={cn(
                  "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground",
                  styles?.icon
                )}>
                {icon}
              </span>
            ) : (
              <Search
                className={cn(
                  "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground",
                  styles?.icon
                )}
              />
            )}
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (debounceRef.current) {
                    window.clearTimeout(debounceRef.current);
                  }
                  applyKeyword((e.target as HTMLInputElement).value);
                }
              }}
              autoFocus={true}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="search"
              placeholder={data?.placeholder ?? "Search by..."}
              className={cn(
                "rounded-lg bg-background pl-8 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500",
                styles?.input
              )}
            />
            {children}
          </div>
        </>
      );
    }
  );

DataTableSearchBar.displayName = "DataTableSearchBar";

export default DataTableSearchBar;
