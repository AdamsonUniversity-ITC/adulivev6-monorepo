import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import {
  addBoardMember,
  createBoardSection,
  fetchBoardSections,
  removeBoardMember,
} from "@/lib/aduts-api";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";

export const Route = createFileRoute("/manage/staff")({
  beforeLoad: async ({ context }) => {
    await requireBoardAdminCapability(context.queryClient);
  },
  component: ManageStaffPage,
});

function ManageStaffPage() {
  const queryClient = useQueryClient();
  const sectionsQuery = useQuery({
    queryKey: ["aduts", "board", "sections"],
    queryFn: fetchBoardSections,
  });

  const [sectionName, setSectionName] = useState("");
  const [memberSectionId, setMemberSectionId] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [isHead, setIsHead] = useState(false);
  const [canAssign, setCanAssign] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["aduts", "board", "sections"],
    });
  };

  const createSectionMutation = useMutation({
    mutationFn: () => createBoardSection({ section_name: sectionName }),
    onSuccess: () => {
      setSectionName("");
      invalidate();
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      addBoardMember({
        section_id: Number(memberSectionId),
        user_id: Number(memberUserId),
        is_section_head: isHead,
        has_assign_access: canAssign,
      }),
    onSuccess: () => {
      setMemberUserId("");
      invalidate();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => removeBoardMember(memberId),
    onSuccess: invalidate,
  });

  function onCreateSection(event: FormEvent) {
    event.preventDefault();
    if (!sectionName.trim()) return;
    createSectionMutation.mutate();
  }

  function onAddMember(event: FormEvent) {
    event.preventDefault();
    if (!memberSectionId || !memberUserId) return;
    addMemberMutation.mutate();
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Staff</h2>

      <Card>
        <CardHeader>
          <CardTitle>Sections & members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(sectionsQuery.data ?? []).map((section) => (
            <div
              key={section.id}
              className="space-y-2 border-b pb-4 last:border-0"
            >
              <p className="font-medium">
                {section.section_name}{" "}
                <span className="text-muted-foreground text-xs">
                  #{section.id}
                </span>
              </p>
              <ul className="space-y-1 text-sm">
                {(section.members ?? []).map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>
                      User {m.user_id}
                      {m.is_section_head ? " · head" : ""}
                      {m.has_assign_access ? " · assign" : ""}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMemberMutation.mutate(m.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
                {(section.members?.length ?? 0) === 0 && (
                  <li className="text-muted-foreground">No members</li>
                )}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add section</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreateSection} className="flex flex-wrap gap-2">
            <Input
              placeholder="Section name"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAddMember} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                type="number"
                placeholder="Section ID"
                className="w-36"
                value={memberSectionId}
                onChange={(e) => setMemberSectionId(e.target.value)}
              />
              <Input
                type="number"
                placeholder="User ID"
                className="w-36"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={isHead}
                  onCheckedChange={(v) => setIsHead(v === true)}
                />
                Section head
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={canAssign}
                  onCheckedChange={(v) => setCanAssign(v === true)}
                />
                Assign access
              </label>
            </div>
            <Button type="submit">Add member</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
