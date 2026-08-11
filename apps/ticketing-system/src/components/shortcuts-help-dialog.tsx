import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";

type ShortcutsHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SHORTCUTS = [
  { keys: "⌘/Ctrl + K", action: "Open search palette" },
  { keys: "?", action: "Show this help" },
  { keys: "/", action: "Focus tickets search" },
  { keys: "j / k", action: "Move highlight on tickets list" },
  { keys: "Enter", action: "Open highlighted ticket" },
  { keys: "r", action: "Ticket detail — public conversation" },
  { keys: "i", action: "Ticket detail — internal chat (staff)" },
] as const;

export function ShortcutsHelpDialog({
  open,
  onOpenChange,
}: ShortcutsHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Shortcuts are disabled while typing in inputs or composers.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {SHORTCUTS.map((item) => (
            <li
              key={item.keys}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">{item.action}</span>
              <kbd className="bg-muted rounded px-2 py-1 font-mono text-xs">
                {item.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
