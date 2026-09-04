import { Separator } from "../separator";
import { UndoRedoButtons } from "./undo-redo-buttons";
import { FontSizeControls } from "./font-size-controls";
import { FontFamilyDropdown } from "./font-family-dropdown";
import { TextAlignButton } from "./text-align-button";
import { MarkButton } from "./mark-button";
import { TextColorButton } from "./text-color-button";
import { HighlightButton } from "./highlight-button";
import { TableDropdown } from "./table-dropdown";
import { ImageButton } from "./image-button";

export function Toolbar() {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-1 py-1">
      {/* History */}
      <UndoRedoButtons />
      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Typography */}
      <FontSizeControls />
      <FontFamilyDropdown />
      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Alignment */}
      <TextAlignButton />
      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Marks */}
      <MarkButton mark="bold" tooltip="Bold" />
      <MarkButton mark="italic" tooltip="Italic" />
      <MarkButton mark="underline" tooltip="Underline" />
      <MarkButton mark="strike" tooltip="Strikethrough" />
      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Color */}
      <TextColorButton />
      <HighlightButton />
      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Insert */}
      <TableDropdown />
      <ImageButton />
    </div>
  );
}
