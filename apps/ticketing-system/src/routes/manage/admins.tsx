import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { PeopleSearchPicker } from "@/components/people-search-picker";
import { PersonIdentity } from "@/components/person-identity";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import {
  addBoardAdmin,
  fetchBoardAdmins,
  removeBoardAdmin,
  type PersonSearchResult,
} from "@/lib/aduts-api";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";

export const Route = createFileRoute("/manage/admins")({
  beforeLoad: async ({ context }) => {
    await requireBoardAdminCapability(context.queryClient);
  },
  component: ManageAdminsPage,
});

function ManageAdminsPage() {
  const queryClient = useQueryClient();
  const [selectedPerson, setSelectedPerson] =
    useState<PersonSearchResult | null>(null);
  const [pickerKey, setPickerKey] = useState(0);

  const adminsQuery = useQuery({
    queryKey: ["aduts", "board", "admins"],
    queryFn: fetchBoardAdmins,
  });

  const addMutation = useMutation({
    mutationFn: () => addBoardAdmin(Number(selectedPerson?.user_id)),
    onSuccess: () => {
      setSelectedPerson(null);
      setPickerKey((key) => key + 1);
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "board", "admins"],
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeBoardAdmin(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "board", "admins"],
      });
    },
  });

  function onAdd(event: FormEvent) {
    event.preventDefault();
    if (!selectedPerson?.user_id) return;
    addMutation.mutate();
  }

  return (
    <PageShell
      title="Board Admins"
      description="Manage who has administrative access to this board."
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Co-admins</CardTitle>
          <CardDescription>
            Sets the board flag only. Users also need{" "}
            <code className="bg-muted rounded-md px-1.5 py-0.5 font-mono text-xs">
              ticketing-system-board-admin-access
            </code>{" "}
            in AdU Live.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-2xl space-y-6">
          <div className="overflow-hidden rounded-xl border shadow-xs">
            <ul className="divide-y text-sm">
              {(adminsQuery.data ?? []).map((a) => (
                <li
                  key={a.id}
                  className="bg-card flex items-center justify-between gap-3 p-3 px-4"
                >
                  <PersonIdentity
                    person={{
                      name: a.name,
                      emp_no: a.emp_no,
                      student_no: a.student_no,
                      agency_no: a.agency_no,
                      person_type: a.person_type,
                      email: a.email,
                    }}
                    size="sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMutation.mutate(a.user_id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 shrink-0"
                  >
                    Remove
                  </Button>
                </li>
              ))}
              {(adminsQuery.data?.length ?? 0) === 0 && (
                <li className="text-muted-foreground p-4 text-center">
                  No board admins yet.
                </li>
              )}
            </ul>
          </div>
          <form onSubmit={onAdd} className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Add admin</Label>
            <PeopleSearchPicker
              key={pickerKey}
              selected={selectedPerson}
              onSelect={setSelectedPerson}
              onClear={() => setSelectedPerson(null)}
            />
            <Button
              type="submit"
              variant="secondary"
              className="shadow-xs"
              disabled={addMutation.isPending || !selectedPerson?.user_id}
            >
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
