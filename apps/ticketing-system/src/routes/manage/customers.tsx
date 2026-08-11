import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { PeopleSearchPicker } from "@/components/people-search-picker";
import { PersonIdentity } from "@/components/person-identity";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import {
  addBoardCustomer,
  fetchBoardCustomers,
  removeBoardCustomer,
  type PersonSearchResult,
} from "@/lib/aduts-api";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";

export const Route = createFileRoute("/manage/customers")({
  beforeLoad: async ({ context }) => {
    await requireBoardAdminCapability(context.queryClient);
  },
  component: ManageCustomersPage,
});

function ManageCustomersPage() {
  const queryClient = useQueryClient();
  const [selectedPerson, setSelectedPerson] =
    useState<PersonSearchResult | null>(null);
  const [pickerKey, setPickerKey] = useState(0);

  const customersQuery = useQuery({
    queryKey: ["aduts", "board", "customers"],
    queryFn: fetchBoardCustomers,
  });

  const addMutation = useMutation({
    mutationFn: () => addBoardCustomer(Number(selectedPerson?.user_id)),
    onSuccess: () => {
      setSelectedPerson(null);
      setPickerKey((key) => key + 1);
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "board", "customers"],
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeBoardCustomer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["aduts", "board", "customers"],
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
      title="Customers"
      description="Manage who can file tickets on this board."
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Board Customers</CardTitle>
        </CardHeader>
        <CardContent className="max-w-2xl space-y-6">
          <div className="overflow-hidden rounded-xl border shadow-xs">
            <ul className="divide-y text-sm">
              {(customersQuery.data ?? []).map((c) => (
                <li
                  key={c.id}
                  className="bg-card flex items-center justify-between gap-3 p-3 px-4"
                >
                  <PersonIdentity
                    person={{
                      name: c.name,
                      emp_no: c.emp_no,
                      student_no: c.student_no,
                      agency_no: c.agency_no,
                      person_type: c.person_type,
                      email: c.email,
                    }}
                    size="sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMutation.mutate(c.user_id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 shrink-0"
                  >
                    Remove
                  </Button>
                </li>
              ))}
              {(customersQuery.data?.length ?? 0) === 0 && (
                <li className="text-muted-foreground p-4 text-center">
                  No customers assigned.
                </li>
              )}
            </ul>
          </div>
          <form onSubmit={onAdd} className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Add customer</Label>
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
