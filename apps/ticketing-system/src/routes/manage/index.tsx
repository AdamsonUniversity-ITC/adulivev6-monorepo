import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { AccessDeniedState } from "@/components/access-denied-state";
import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { ThemeGallery } from "@/components/theme-gallery";
import { requireBoardAdminCapability } from "@/lib/admin-guards";
import {
  fetchCurrentBoard,
  removeBoardLogo,
  updateCurrentBoard,
  uploadBoardLogo,
} from "@/lib/aduts-api";
import { getAxiosStatus } from "@/lib/axios-status";
import {
  DEFAULT_THEME_PRESET,
  normalizeThemePreset,
  type AppearanceThemeId,
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

const ADU_LOGO = "/assets/images/adulogo.png";

export const Route = createFileRoute("/manage/")({
  beforeLoad: async ({ context }) => {
    await requireBoardAdminCapability(context.queryClient);
  },
  component: ManageBoardPage,
});

function ManageBoardPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kbUrl, setKbUrl] = useState("");
  const [themePreset, setThemePreset] =
    useState<BoardThemePresetId>(DEFAULT_THEME_PRESET);

  useEffect(() => {
    if (!boardQuery.data) return;
    setName(boardQuery.data.board_name);
    setDescription(boardQuery.data.description ?? "");
    setKbUrl(boardQuery.data.kb_url ?? "");
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
    mutationFn: (theme: AppearanceThemeId) =>
      updateCurrentBoard({ theme_preset: theme }),
    onSuccess: () => {
      invalidateBoard();
      toast.success("Appearance updated.");
    },
    onError: () => toast.error("Could not update appearance."),
  });

  const logoUploadMutation = useMutation({
    mutationFn: (file: File) => uploadBoardLogo(file),
    onSuccess: () => {
      invalidateBoard();
      toast.success("Board logo updated.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: () => toast.error("Could not upload board logo."),
  });

  const logoRemoveMutation = useMutation({
    mutationFn: () => removeBoardLogo(),
    onSuccess: () => {
      invalidateBoard();
      toast.success("Board logo removed.");
    },
    onError: () => toast.error("Could not remove board logo."),
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

  function onSelectPreset(preset: AppearanceThemeId) {
    setThemePreset(preset);
    appearanceMutation.mutate(preset);
  }

  function onLogoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    logoUploadMutation.mutate(file);
  }

  const logoUrl = boardQuery.data?.logo_url ?? null;
  const logoBusy =
    logoUploadMutation.isPending || logoRemoveMutation.isPending;

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
              <div className="space-y-2">
                <Label className="text-sm font-medium">Board logo</Label>
                <p className="text-muted-foreground text-xs">
                  Shown in the sidebar. JPEG, PNG, or WebP up to 2 MB.
                </p>
                <div className="flex items-center gap-4">
                  <div className="ring-primary/10 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1">
                    <img
                      src={logoUrl ?? ADU_LOGO}
                      alt={logoUrl ? "Board logo" : "Default AdU logo"}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={onLogoSelected}
                      disabled={logoBusy}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={logoBusy}
                      className="shadow-xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoUploadMutation.isPending
                        ? "Uploading…"
                        : "Upload logo"}
                    </Button>
                    {logoUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={logoBusy}
                        onClick={() => logoRemoveMutation.mutate()}
                      >
                        {logoRemoveMutation.isPending
                          ? "Removing…"
                          : "Remove"}
                      </Button>
                    ) : null}
                  </div>
                </div>
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
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Choose the look of this office. Each theme has its own light and
              dark colors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeGallery
              value={themePreset}
              disabled={appearanceMutation.isPending}
              onSelect={onSelectPreset}
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
