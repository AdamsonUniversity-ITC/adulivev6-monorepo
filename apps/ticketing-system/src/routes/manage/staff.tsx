import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { PeopleSearchPicker } from "@/components/people-search-picker";
import { PersonIdentity } from "@/components/person-identity";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import {
  addBoardMember,
  createBoardSection,
  fetchBoardSections,
  removeBoardMember,
  syncBoardSectionMembers,
  updateBoardMember,
  updateBoardSection,
  type PersonSearchResult,
  type SectionRow,
} from "@/lib/aduts-api";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/exports";

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
  const [createHrSectionId, setCreateHrSectionId] = useState("");
  const [memberSectionId, setMemberSectionId] = useState("");
  const [selectedPerson, setSelectedPerson] =
    useState<PersonSearchResult | null>(null);
  const [personPickerKey, setPersonPickerKey] = useState(0);
  const [isHead, setIsHead] = useState(false);
  const [canAssign, setCanAssign] = useState(false);
  const [hrDrafts, setHrDrafts] = useState<Record<number, string>>({});

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["aduts", "board", "sections"],
    });
    void queryClient.invalidateQueries({ queryKey: ["aduts", "board"] });
  };

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const section of sectionsQuery.data ?? []) {
      next[section.id] =
        section.hr_section_id != null ? String(section.hr_section_id) : "";
    }
    setHrDrafts(next);
  }, [sectionsQuery.data]);

  const createSectionMutation = useMutation({
    mutationFn: () =>
      createBoardSection({
        section_name: sectionName.trim(),
        hr_section_id: createHrSectionId.trim()
          ? Number(createHrSectionId)
          : null,
      }),
    onSuccess: () => {
      setSectionName("");
      setCreateHrSectionId("");
      invalidate();
      toast.success("Section created.");
    },
    onError: () => toast.error("Failed to create section."),
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({
      sectionId,
      payload,
    }: {
      sectionId: number;
      payload: { section_name?: string; hr_section_id?: number | null };
    }) => updateBoardSection(sectionId, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Section updated.");
    },
    onError: () => toast.error("Failed to update section."),
  });

  const syncMutation = useMutation({
    mutationFn: (sectionId: number) => syncBoardSectionMembers(sectionId),
    onSuccess: (summary) => {
      invalidate();
      toast.success(
        `Synced ${summary.added} new · ${summary.skipped_existing} existing · ${summary.skipped_no_user} no user · ${summary.total_hr_employees} HR total`,
      );
    },
    onError: (error: unknown) => {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
          ? (error as { response: { data: { message: string } } }).response.data
              .message
          : "Failed to sync members.";
      toast.error(message);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      addBoardMember({
        section_id: Number(memberSectionId),
        user_id: Number(selectedPerson?.user_id),
        is_section_head: isHead,
        has_assign_access: canAssign || isHead,
      }),
    onSuccess: () => {
      setSelectedPerson(null);
      setIsHead(false);
      setCanAssign(false);
      setPersonPickerKey((key) => key + 1);
      invalidate();
      toast.success("Member added.");
    },
    onError: () => toast.error("Failed to add member."),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: number;
      payload: { is_section_head?: boolean; has_assign_access?: boolean };
    }) => updateBoardMember(memberId, payload),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to update member."),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => removeBoardMember(memberId),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to remove member."),
  });

  function onCreateSection(event: FormEvent) {
    event.preventDefault();
    if (!sectionName.trim()) return;
    createSectionMutation.mutate();
  }

  function onAddMember(event: FormEvent) {
    event.preventDefault();
    if (!memberSectionId || !selectedPerson?.user_id) return;
    addMemberMutation.mutate();
  }

  function parseHrId(raw: string): number | null | "invalid" {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const next = Number(trimmed);
    if (!Number.isFinite(next) || next < 1) return "invalid";
    return Math.floor(next);
  }

  async function persistHrSectionId(section: SectionRow): Promise<boolean> {
    const parsed = parseHrId(hrDrafts[section.id] ?? "");
    if (parsed === "invalid") {
      toast.error("HR Section ID must be a positive number.");
      return false;
    }
    if (parsed === (section.hr_section_id ?? null)) return true;
    try {
      await updateSectionMutation.mutateAsync({
        sectionId: section.id,
        payload: { hr_section_id: parsed },
      });
      return true;
    } catch {
      return false;
    }
  }

  return (
    <PageShell title="Staff" description="Manage sections and support staff.">
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Setup</CardTitle>
            <CardDescription>
              Create sections with an optional HR Section ID for member sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              onSubmit={onCreateSection}
              className="flex flex-wrap items-end gap-2"
            >
              <div className="min-w-[10rem] flex-1 space-y-1">
                <Label htmlFor="section-name" className="text-xs">
                  Section name
                </Label>
                <Input
                  id="section-name"
                  placeholder="e.g. Helpdesk"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="h-9 shadow-xs"
                />
              </div>
              <div className="w-[8.5rem] space-y-1">
                <Label htmlFor="create-hr-id" className="text-xs">
                  HR Section ID
                </Label>
                <Input
                  id="create-hr-id"
                  inputMode="numeric"
                  placeholder="Optional"
                  value={createHrSectionId}
                  onChange={(e) => setCreateHrSectionId(e.target.value)}
                  className="h-9 shadow-xs"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-9"
                disabled={
                  createSectionMutation.isPending || !sectionName.trim()
                }
              >
                Add
              </Button>
            </form>

            <form
              onSubmit={onAddMember}
              className="flex flex-wrap items-end gap-2 border-t pt-4"
            >
              <div className="min-w-[9rem] space-y-1">
                <Label className="text-xs">Section</Label>
                <Select
                  value={memberSectionId || undefined}
                  onValueChange={setMemberSectionId}
                >
                  <SelectTrigger className="h-9 shadow-xs">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(sectionsQuery.data ?? []).map((section) => (
                      <SelectItem key={section.id} value={String(section.id)}>
                        {section.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[14rem] flex-1 space-y-1">
                <Label className="text-xs">Person</Label>
                <PeopleSearchPicker
                  key={personPickerKey}
                  selected={selectedPerson}
                  onSelect={setSelectedPerson}
                  onClear={() => setSelectedPerson(null)}
                />
              </div>
              <label className="mb-1.5 flex items-center gap-2 text-sm">
                <Checkbox
                  checked={isHead}
                  onCheckedChange={(v) => {
                    const next = v === true;
                    setIsHead(next);
                    if (next) setCanAssign(true);
                  }}
                />
                Head
              </label>
              <label className="mb-1.5 flex items-center gap-2 text-sm">
                <Checkbox
                  checked={canAssign}
                  onCheckedChange={(v) => setCanAssign(v === true)}
                  disabled={isHead}
                />
                Assign
              </label>
              <Button
                type="submit"
                size="sm"
                className="h-9"
                disabled={
                  addMemberMutation.isPending ||
                  !memberSectionId ||
                  !selectedPerson?.user_id
                }
              >
                Add member
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Roster</CardTitle>
            <CardDescription>
              Edit HR Section ID and sync active teachers into the roster.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(sectionsQuery.data ?? []).map((section) => (
                <div
                  key={section.id}
                  className="flex flex-col gap-4 p-4 md:flex-row md:items-start"
                >
                  <div className="shrink-0 space-y-2 md:w-[15rem]">
                    <p className="font-semibold">{section.section_name}</p>
                    {section.hr_section_name ? (
                      <p className="text-muted-foreground text-xs">
                        HR: {section.hr_section_name}
                      </p>
                    ) : null}
                    <div className="flex items-end gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <Label htmlFor={`hr-${section.id}`} className="text-xs">
                          HR Section ID
                        </Label>
                        <Input
                          id={`hr-${section.id}`}
                          inputMode="numeric"
                          value={hrDrafts[section.id] ?? ""}
                          onChange={(e) =>
                            setHrDrafts((prev) => ({
                              ...prev,
                              [section.id]: e.target.value,
                            }))
                          }
                          onBlur={() => void persistHrSectionId(section)}
                          className="h-8 shadow-xs"
                          placeholder="cid"
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        title="Sync members from HR"
                        disabled={
                          syncMutation.isPending ||
                          updateSectionMutation.isPending ||
                          !(hrDrafts[section.id] ?? "").trim()
                        }
                        onClick={() => {
                          void (async () => {
                            const ok = await persistHrSectionId(section);
                            if (!ok) return;
                            syncMutation.mutate(section.id);
                          })();
                        }}
                      >
                        <RefreshCw
                          className={`size-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-card/80 overflow-hidden rounded-lg border md:flex-1">
                    <ul className="divide-y text-sm">
                      {(section.members ?? []).map((m) => (
                        <li
                          key={m.id}
                          className="hover:bg-muted/30 flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <PersonIdentity
                              person={{
                                name: m.name,
                                emp_no: m.emp_no,
                                student_no: m.student_no,
                                agency_no: m.agency_no,
                                person_type: m.person_type,
                                email: m.email,
                              }}
                              size="sm"
                            />
                            {m.is_section_head ? (
                              <Badge className="border-amber-200 bg-amber-100 text-amber-900">
                                Head
                              </Badge>
                            ) : null}
                            {m.has_assign_access ? (
                              <Badge className="border-emerald-200 bg-emerald-100 text-emerald-900">
                                Assign
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {!m.is_section_head ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  disabled={updateMemberMutation.isPending}
                                  onClick={() =>
                                    updateMemberMutation.mutate({
                                      memberId: m.id,
                                      payload: {
                                        is_section_head: true,
                                        has_assign_access: true,
                                      },
                                    })
                                  }
                                >
                                  Make Head
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  disabled={updateMemberMutation.isPending}
                                  onClick={() =>
                                    updateMemberMutation.mutate({
                                      memberId: m.id,
                                      payload: {
                                        has_assign_access: !m.has_assign_access,
                                      },
                                    })
                                  }
                                >
                                  {m.has_assign_access
                                    ? "Remove assign"
                                    : "Give assign"}
                                </Button>
                              </>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMemberMutation.mutate(m.id)}
                              disabled={removeMemberMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                            >
                              Remove
                            </Button>
                          </div>
                        </li>
                      ))}
                      {(section.members?.length ?? 0) === 0 ? (
                        <li className="text-muted-foreground p-4 text-center text-sm">
                          No members assigned
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              ))}
              {(sectionsQuery.data?.length ?? 0) === 0 ? (
                <div className="text-muted-foreground p-6 text-center text-sm">
                  No sections created yet.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
