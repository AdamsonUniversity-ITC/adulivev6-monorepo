import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PersonIdentity } from "@/components/person-identity";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  searchPeople,
  type PersonSearchResult,
  type PersonSearchType,
} from "@/lib/aduts-api";
import { Button } from "@repo/ui/components/button";
import { Label } from "@repo/ui/components/label";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

type PeopleSearchPickerProps = {
  onSelect: (person: PersonSearchResult) => void;
  selected?: PersonSearchResult | null;
  onClear?: () => void;
};

const TYPE_OPTIONS: Array<{ value: PersonSearchType; label: string }> = [
  { value: "employee", label: "Employee" },
  { value: "student", label: "Student" },
  { value: "bed", label: "BED" },
  { value: "agency", label: "Agency" },
];

export function PeopleSearchPicker({
  onSelect,
  selected,
  onClear,
}: PeopleSearchPickerProps) {
  const [type, setType] = useState<PersonSearchType>("employee");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);

  const searchQuery = useQuery({
    queryKey: ["aduts", "people-search", type, debounced],
    queryFn: () => searchPeople(debounced, type),
    enabled: debounced.trim().length >= 2,
  });

  if (selected) {
    return (
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <PersonIdentity
          person={{
            name: selected.name,
            emp_no: selected.emp_no,
            student_no: selected.student_no,
            agency_no: selected.agency_no,
            type: selected.type,
            email: selected.email,
          }}
        />
        {onClear ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Change
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as PersonSearchType)}
          >
            <SelectTrigger className="shadow-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Search</Label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, ID, or email (min 2 characters)"
            className="shadow-xs"
          />
        </div>
      </div>

      {debounced.trim().length >= 2 ? (
        <div className="max-h-48 overflow-auto rounded-lg border">
          {searchQuery.isLoading ? (
            <p className="text-muted-foreground p-3 text-sm">Searching…</p>
          ) : null}
          {searchQuery.isError ? (
            <p className="text-destructive p-3 text-sm">Search failed.</p>
          ) : null}
          {(searchQuery.data ?? []).map((person) => (
            <button
              key={`${person.type}-${person.user_id}-${person.emp_no}-${person.student_no}-${person.agency_no}`}
              type="button"
              className="hover:bg-muted/50 flex w-full items-center border-b px-3 py-2 text-left last:border-b-0 disabled:opacity-50"
              disabled={!person.user_id}
              onClick={() => {
                if (person.user_id) onSelect(person);
              }}
            >
              <PersonIdentity
                person={{
                  name: person.name,
                  emp_no: person.emp_no,
                  student_no: person.student_no,
                  agency_no: person.agency_no,
                  type: person.type,
                  email: person.email,
                }}
                className="w-full"
              />
            </button>
          ))}
          {(searchQuery.data?.length ?? 0) === 0 && !searchQuery.isLoading ? (
            <p className="text-muted-foreground p-3 text-sm">No matches.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
