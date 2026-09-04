import { useEffect, useState } from "react";
import { Highlighter } from "lucide-react";
import { useEditorContext } from "./editor-context";
import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff0000",
  "#fce4ec", "#fff9c4", "#c8e6c9", "#b3e5fc", "#e1bee7",
  "#ffe0b2", "#f0f4c3", "#b2dfdb", "#bbdefb", "#d1c4e9",
];

export function HighlightButton() {
  const { editor } = useEditorContext();
  const [hex, setHex] = useState("#ffff00");

  useEffect(() => {
    const update = () => {
      const color = editor.getAttributes("highlight")?.color || "#ffff00";
      setHex(color);
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-none" aria-label="Highlight color">
              <div className="flex flex-col items-center gap-0.5">
                <Highlighter className="size-3.5" />
                <div className="h-0.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: hex }} />
              </div>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Highlight</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-fit p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="size-6 rounded-sm border border-border transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
              style={{ backgroundColor: color }}
              onClick={() => {
                setHex(color);
                editor.chain().focus().toggleHighlight({ color }).run();
              }}
              aria-label={`Highlight ${color}`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border-0 p-0"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().toggleHighlight({ color: hex }).run()}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
