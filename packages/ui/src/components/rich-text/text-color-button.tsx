import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { useEditorContext } from "./editor-context";
import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

const PRESET_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
];

export function TextColorButton() {
  const { editor } = useEditorContext();
  const [hex, setHex] = useState("#000000");

  useEffect(() => {
    const update = () => {
      const color = editor.getAttributes("textStyle")?.color || "#000000";
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
            <Button variant="ghost" size="icon-sm" className="rounded-none" aria-label="Text color">
              <div className="flex flex-col items-center gap-0.5">
                <Palette className="size-3.5" />
                <div className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: hex }} />
              </div>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Text color</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-fit p-3">
        <div className="grid grid-cols-10 gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="size-5 rounded-sm border border-border transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-ring"
              style={{ backgroundColor: color }}
              onClick={() => {
                setHex(color);
                editor.chain().focus().setColor(color).run();
              }}
              aria-label={color}
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
          <input
            type="text"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="h-7 flex-1 rounded border border-border px-2 text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => editor.chain().focus().setColor(hex).run()}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
