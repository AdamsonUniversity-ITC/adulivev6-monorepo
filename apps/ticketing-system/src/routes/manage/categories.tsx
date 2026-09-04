import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { AccessDeniedState } from "@/components/access-denied-state";
import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { requireSectionHeadOrBoardAdmin } from "@/lib/admin-guards";
import {
  createBoardCategory,
  deleteBoardCategory,
  fetchCurrentBoard,
  updateBoardCategory,
  type BoardCategory,
} from "@/lib/aduts-api";
import { getAxiosStatus } from "@/lib/axios-status";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
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

export const Route = createFileRoute("/manage/categories")({
  beforeLoad: async ({ context }) => {
    await requireSectionHeadOrBoardAdmin(context.queryClient);
  },
  component: ManageCategoriesPage,
});

function ManageCategoriesPage() {
  const queryClient = useQueryClient();
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });
  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [editing, setEditing] = useState<BoardCategory | null>(null);

  const isBoardAdmin = boardQuery.data?.access?.is_board_admin === true;
  const headedSectionIds = boardQuery.data?.access?.headed_section_ids ?? [];
  const sections = useMemo(() => {
    const allSections = boardQuery.data?.sections ?? [];
    if (isBoardAdmin) return allSections;
    const allowed = new Set(headedSectionIds);
    return allSections.filter((section) => allowed.has(section.id));
  }, [boardQuery.data?.sections, headedSectionIds, isBoardAdmin]);

  useEffect(() => {
    if (!sectionId && sections.length === 1) {
      setSectionId(String(sections[0]!.id));
    }
  }, [sectionId, sections]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["aduts", "board"] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createBoardCategory({
        name: name.trim(),
        section_id: Number(sectionId),
      }),
    onSuccess: () => {
      setName("");
      invalidate();
      toast.success("Category created.");
    },
    onError: () => toast.error("Could not create category."),
  });

  const updateMutation = useMutation({
    mutationFn: (category: BoardCategory) =>
      updateBoardCategory(category.id, {
        name: category.name.trim(),
        section_id: Number(category.section_id),
      }),
    onSuccess: () => {
      setEditing(null);
      invalidate();
      toast.success("Category updated.");
    },
    onError: () => toast.error("Could not update category."),
  });

  const toggleMutation = useMutation({
    mutationFn: (category: BoardCategory) =>
      updateBoardCategory(category.id, {
        is_active: category.is_active === false,
      }),
    onSuccess: invalidate,
    onError: () => toast.error("Could not update category status."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBoardCategory,
    onSuccess: () => {
      invalidate();
      toast.success("Category deleted.");
    },
    onError: () => toast.error("Could not delete category."),
  });

  if (boardQuery.isLoading) {
    return <LoadingState label="Loading categories…" />;
  }

  if (boardQuery.isError) {
    if (getAxiosStatus(boardQuery.error) === 403) {
      return (
        <AccessDeniedState description="You do not have access to manage categories." />
      );
    }
    return <AccessDeniedState description="Could not load categories." />;
  }

  const allowedSectionIds = new Set(sections.map((section) => section.id));
  const categories = (boardQuery.data?.categories ?? []).filter(
    (category) =>
      isBoardAdmin ||
      (category.section_id != null &&
        allowedSectionIds.has(category.section_id)),
  );
  const sectionNames = new Map(
    (boardQuery.data?.sections ?? []).map((section) => [
      section.id,
      section.section_name,
    ]),
  );

  function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !sectionId) return;
    createMutation.mutate();
  }

  return (
    <PageShell
      title="Categories"
      bordered={false}
      description="Organize tickets within each support section."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>New category</CardTitle>
            <CardDescription>
              Categories are available only for their assigned section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-3">
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={sectionId || undefined} onValueChange={setSectionId}>
                  <SelectTrigger className="shadow-xs">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={String(section.id)}>
                        {section.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="shadow-xs"
                />
              </div>
              <Button
                type="submit"
                disabled={createMutation.isPending || !sectionId || !name.trim()}
              >
                {createMutation.isPending ? "Saving…" : "Add category"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              {categories.length} categor{categories.length === 1 ? "y" : "ies"} in
              your scope
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No categories have been created for these sections.
              </p>
            ) : (
              categories.map((category) =>
                editing?.id === category.id ? (
                  <div
                    key={category.id}
                    className="bg-muted/20 space-y-3 rounded-lg border p-3"
                  >
                    <Input
                      value={editing.name}
                      onChange={(event) =>
                        setEditing({ ...editing, name: event.target.value })
                      }
                      autoFocus
                    />
                    <Select
                      value={
                        editing.section_id != null
                          ? String(editing.section_id)
                          : undefined
                      }
                      onValueChange={(value) =>
                        setEditing({ ...editing, section_id: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem
                            key={section.id}
                            value={String(section.id)}
                          >
                            {section.section_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={
                          updateMutation.isPending ||
                          !editing.name.trim() ||
                          editing.section_id == null
                        }
                        onClick={() => updateMutation.mutate(editing)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={category.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{category.name}</p>
                        <Badge
                          variant={
                            category.is_active === false ? "outline" : "secondary"
                          }
                        >
                          {category.is_active === false ? "Inactive" : "Active"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {category.section_id != null
                          ? (sectionNames.get(category.section_id) ??
                            "Unknown section")
                          : "Unassigned"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(category)}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(category)}
                      >
                        {category.is_active === false ? "Activate" : "Deactivate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            window.confirm(`Delete category “${category.name}”?`)
                          ) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ),
              )
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
