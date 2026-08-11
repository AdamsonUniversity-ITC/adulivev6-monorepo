import { useEffect, useState } from "react";
import { useEditorContext } from "./editor-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

const FONTS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Arial Black", value: '"Arial Black", sans-serif' },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Cambria", value: "Cambria, serif" },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Trebuchet MS", value: '"Trebuchet MS", sans-serif' },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

export function FontFamilyDropdown() {
  const { editor } = useEditorContext();
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");

  useEffect(() => {
    const update = () => {
      const font =
        editor.getAttributes("textStyle")?.fontFamily ?? "Arial, sans-serif";
      setFontFamily(font);
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <Select
            value={fontFamily}
            onValueChange={(v) => {
              setFontFamily(v);
              editor.chain().focus().setFontFamily(v).run();
            }}
          >
            <SelectTrigger className="h-8 w-[120px] rounded-none border-x border-y-0 text-xs shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-sm">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TooltipTrigger>
      <TooltipContent>Font family</TooltipContent>
    </Tooltip>
  );
}
