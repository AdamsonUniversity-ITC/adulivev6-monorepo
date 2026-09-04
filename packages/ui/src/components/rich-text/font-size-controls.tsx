import { useEffect, useMemo, useState } from "react";
import { AArrowDown, AArrowUp } from "lucide-react";
import { useEditorContext } from "./editor-context";
import { BaseButton } from "./base-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 32, 48, 64, 96];

export function FontSizeControls() {
  const { editor } = useEditorContext();
  const [sizeIndex, setSizeIndex] = useState(2);

  useEffect(() => {
    const updateFontSize = () => {
      const raw = editor.getAttributes("textStyle")?.fontSize ?? "16px";
      const size = Number(String(raw).replace("px", ""));
      const idx = FONT_SIZES.indexOf(size);
      setSizeIndex(idx >= 0 ? idx : 2);
    };

    editor.on("selectionUpdate", updateFontSize);
    editor.on("transaction", updateFontSize);
    return () => {
      editor.off("selectionUpdate", updateFontSize);
      editor.off("transaction", updateFontSize);
    };
  }, [editor]);

  const { canIncrease, canDecrease } = useMemo(
    () => ({
      canIncrease: sizeIndex < FONT_SIZES.length - 1,
      canDecrease: sizeIndex > 0,
    }),
    [sizeIndex],
  );

  return (
    <>
      <BaseButton
        disabled={!canDecrease}
        tooltip="Decrease font size"
        onClick={() => {
          if (sizeIndex <= 0) return;
          editor.chain().focus().setFontSize(`${FONT_SIZES[sizeIndex - 1]}px`).run();
        }}
      >
        <AArrowDown className="size-4" />
      </BaseButton>

      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Select
              value={String(FONT_SIZES[sizeIndex])}
              onValueChange={(v) => {
                editor.chain().focus().setFontSize(`${v}px`).run();
              }}
            >
              <SelectTrigger className="h-8 w-[60px] rounded-none border-x border-y-0 shadow-none text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent>Font size</TooltipContent>
      </Tooltip>

      <BaseButton
        disabled={!canIncrease}
        tooltip="Increase font size"
        onClick={() => {
          if (sizeIndex >= FONT_SIZES.length - 1) return;
          editor.chain().focus().setFontSize(`${FONT_SIZES[sizeIndex + 1]}px`).run();
        }}
      >
        <AArrowUp className="size-4" />
      </BaseButton>
    </>
  );
}
