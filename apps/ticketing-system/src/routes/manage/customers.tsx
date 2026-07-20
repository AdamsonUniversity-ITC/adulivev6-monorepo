import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import {
  addBoardCustomer,
  fetchBoardCustomers,
  removeBoardCustomer,
} from "@/lib/aduts-api";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";

export const Route = createFileRoute("/manage/customers")({
  beforeLoad: async ({ context }) => {
    await requireBoardAdminCapability(context.queryClient);
  },
  component: ManageCustomersPage,
});

function ManageCustomersPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");

  const customersQuery = useQuery({
    queryKey: ["aduts", "board", "customers"],
    queryFn: fetchBoardCustomers,
  });

  const addMutation = useMutation({
    mutationFn: () => addBoardCustomer(Number(userId)),
    onSuccess: () => {
      setUserId("");
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
    if (!userId) return;
    addMutation.mutate();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Customers</h2>
      <Card>
        <CardHeader>
          <CardTitle>Board customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {(customersQuery.data ?? []).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2"
              >
                <span>User {c.user_id}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMutation.mutate(c.user_id)}
                >
                  Remove
                </Button>
              </li>
            ))}
            {(customersQuery.data?.length ?? 0) === 0 && (
              <li className="text-muted-foreground">No customers yet.</li>
            )}
          </ul>
          <form onSubmit={onAdd} className="flex flex-wrap gap-2">
            <Input
              type="number"
              min={1}
              placeholder="User ID"
              className="w-40"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Button type="submit">Add customer</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
