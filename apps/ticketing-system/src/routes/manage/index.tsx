import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { AccessDeniedState } from "@/components/access-denied-state";
import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import { fetchCurrentBoard, updateCurrentBoard } from "@/lib/aduts-api";
import { getAxiosStatus } from "@/lib/axios-status";
import {
  BOARD_THEME_PRESETS,
  DEFAULT_THEME_PRESET,
  normalizeAccentColor,
  normalizeThemePreset,
  type BoardThemePresetId,
} from "@/lib/board-theme";
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
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/exports";

export const Route = createFileRoute("/manage/")({
  beforeLoad: async ({ context }) => {
    await requireBoardAdminCapability(context.queryClient);
  },
  component: ManageBoardPage,
});

function ManageBoardPage() {
  const queryClient = useQueryClient();
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kbUrl, setKbUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#38bdf8");
  const [themePreset, setThemePreset] =
    useState<BoardThemePresetId>(DEFAULT_THEME_PRESET);

  useEffect(() => {
    if (!boardQuery.data) return;
    setName(boardQuery.data.board_name);
    setDescription(boardQuery.data.description ?? "");
    setKbUrl(boardQuery.data.kb_url ?? "");
    setAccentColor(
      normalizeAccentColor(boardQuery.data.accent_color) ?? "#38bdf8",
    );
    setThemePreset(normalizeThemePreset(boardQuery.data.theme_preset));
  }, [boardQuery.data]);

  const invalidateBoard = () => {
    void queryClient.invalidateQueries({ queryKey: ["aduts", "board"] });
  };

  const mutation = useMutation({
    mutationFn: () =>
      updateCurrentBoard({
        board_name: name,
        description: description || null,
        kb_url: kbUrl || null,
      }),
    onSuccess: () => {
      invalidateBoard();
      toast.success("Board settings saved.");
    },
    onError: () => toast.error("Could not save board settings."),
  });

  const appearanceMutation = useMutation({
    mutationFn: (payload: {
      accent_color?: string | null;
      theme_preset?: BoardThemePresetId;
    }) => updateCurrentBoard(payload),
    onSuccess: () => {
      invalidateBoard();
      toast.success("Appearance updated.");
    },
    onError: () => toast.error("Could not update appearance."),
  });

  if (boardQuery.isLoading) {
    return <LoadingState label="Loading board…" />;
  }

  if (boardQuery.isError) {
    if (getAxiosStatus(boardQuery.error) === 403) {
      return (
        <AccessDeniedState description="You need board-admin access for this tenant." />
      );
    }
    return (
      <p className="text-destructive">
        Could not load board. You need board-admin Spatie plus a board-admin
        flag for this tenant.
      </p>
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  function onSaveAccent() {
    const normalized = normalizeAccentColor(accentColor);
    if (!normalized) {
      toast.error("Enter a valid hex color like #38bdf8.");
      return;
    }
    appearanceMutation.mutate({ accent_color: normalized });
  }

  function onSelectPreset(preset: BoardThemePresetId) {
    setThemePreset(preset);
    appearanceMutation.mutate({ theme_preset: preset });
  }

  return (
    <PageShell
      title="Board Settings"
      description="Manage preferences for this board."
    >
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="max-w-xl space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shadow-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="shadow-xs resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Knowledge Base URL
                </Label>
                <Input
                  type="url"
                  value={kbUrl}
                  onChange={(e) => setKbUrl(e.target.value)}
                  placeholder="https://"
                  className="shadow-xs"
                />
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="shadow-xs"
                >
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Accent color and abstract background themes apply across this
              board.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="max-w-xl space-y-3">
              <Label className="text-sm font-medium">Accent color</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="color"
                  value={normalizeAccentColor(accentColor) ?? "#38bdf8"}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer p-1 shadow-xs"
                  aria-label="Accent color picker"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#38bdf8"
                  className="max-w-[10rem] font-mono text-sm shadow-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={appearanceMutation.isPending}
                  onClick={onSaveAccent}
                  className="shadow-xs"
                >
                  Save accent
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Background theme</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {BOARD_THEME_PRESETS.map((preset) => {
                  const selected = themePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={appearanceMutation.isPending}
                      onClick={() => onSelectPreset(preset.id)}
                      className={[
                        "overflow-hidden rounded-xl border text-left transition-colors",
                        selected
                          ? "border-primary ring-primary/40 ring-2"
                          : "border-border hover:border-primary/40",
                      ].join(" ")}
                    >
                      <div
                        className={`aduts-theme-swatch aduts-theme-swatch--${preset.id} h-20 w-full`}
                        aria-hidden="true"
                      />
                      <div className="space-y-0.5 p-3">
                        <p className="text-sm font-medium">{preset.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
