import { useMemo } from "react";
import { Table2 } from "lucide-react";
import { useEditorContext } from "./editor-context";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export function TableDropdown() {
  const { editor } = useEditorContext();

  const actions = useMemo(
    () => [
      { label: "Insert table", action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: "Add column before", action: () => editor.chain().focus().addColumnBefore().run() },
      { label: "Add column after", action: () => editor.chain().focus().addColumnAfter().run() },
      { label: "Delete column", action: () => editor.chain().focus().deleteColumn().run() },
      { label: "Add row before", action: () => editor.chain().focus().addRowBefore().run() },
      { label: "Add row after", action: () => editor.chain().focus().addRowAfter().run() },
      { label: "Delete row", action: () => editor.chain().focus().deleteRow().run() },
      { label: "Delete table", action: () => editor.chain().focus().deleteTable().run() },
      { label: "Merge cells", action: () => editor.chain().focus().mergeCells().run() },
      { label: "Split cell", action: () => editor.chain().focus().splitCell().run() },
      { label: "Toggle header row", action: () => editor.chain().focus().toggleHeaderRow().run() },
      { label: "Toggle header column", action: () => editor.chain().focus().toggleHeaderColumn().run() },
      { label: "Merge or split", action: () => editor.chain().focus().mergeOrSplit().run() },
    ],
    [editor],
  );

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-none" aria-label="Table controls">
              <Table2 className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Table</TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        {actions.map(({ label, action }) => (
          <DropdownMenuItem key={label} onClick={action}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
