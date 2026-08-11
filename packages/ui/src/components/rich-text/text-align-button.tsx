import { type SetStateAction, useEffect, useState } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { useEditorContext } from "./editor-context";
import { BaseButton } from "./base-button";
import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

type AlignType = "left" | "right" | "center" | "justify";

const ALIGN_ICONS = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
  justify: AlignJustify,
} as const;

function AlignOption({
  type,
  current,
  setCurrent,
}: {
  type: AlignType;
  current: AlignType;
  setCurrent: React.Dispatch<SetStateAction<AlignType>>;
}) {
  const { editor } = useEditorContext();
  const Icon = ALIGN_ICONS[type];
  return (
    <BaseButton
      onClick={() => {
        setCurrent(type);
        editor.chain().focus().setTextAlign(type).run();
      }}
      className={cn("rounded-md", type === current && "bg-accent")}
      tooltip={`Align ${type}`}
      active={type === current}
    >
      <Icon className="size-4" />
    </BaseButton>
  );
}

export function TextAlignButton() {
  const { editor } = useEditorContext();
  const [textAlign, setTextAlign] = useState<AlignType>("left");

  useEffect(() => {
    const update = () => {
      const nodeName = editor.state.selection.$from.parent.type.name;
      const alignment =
        (editor.getAttributes(nodeName).textAlign as AlignType) || "left";
      setTextAlign(alignment);
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const Icon = ALIGN_ICONS[textAlign];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-none" aria-label="Text align">
              <Icon className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Text align</TooltipContent>
      </Tooltip>
      <PopoverContent className="flex w-fit gap-0.5 p-1">
        <AlignOption type="left" current={textAlign} setCurrent={setTextAlign} />
        <AlignOption type="center" current={textAlign} setCurrent={setTextAlign} />
        <AlignOption type="right" current={textAlign} setCurrent={setTextAlign} />
        <AlignOption type="justify" current={textAlign} setCurrent={setTextAlign} />
      </PopoverContent>
    </Popover>
  );
}
