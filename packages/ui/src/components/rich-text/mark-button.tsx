import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Highlighter,
} from "lucide-react";
import { useEditorContext } from "./editor-context";
import { BaseButton } from "./base-button";

export type MarkType = "bold" | "italic" | "strike" | "highlight" | "underline";

const MARK_ICONS: Record<MarkType, React.ComponentType<{ className?: string }>> = {
  bold: Bold,
  italic: Italic,
  strike: Strikethrough,
  highlight: Highlighter,
  underline: UnderlineIcon,
};

function toggleMark(editor: ReturnType<typeof useEditorContext>["editor"], mark: MarkType) {
  switch (mark) {
    case "bold":
      editor.chain().focus().toggleBold().run();
      return;
    case "italic":
      editor.chain().focus().toggleItalic().run();
      return;
    case "strike":
      editor.chain().focus().toggleStrike().run();
      return;
    case "highlight":
      editor.chain().focus().toggleHighlight().run();
      return;
    case "underline":
      editor.chain().focus().toggleUnderline().run();
      return;
  }
}

export function MarkButton({
  mark,
  tooltip,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  mark: MarkType;
  tooltip: string;
  className?: string;
}) {
  const { editor } = useEditorContext();
  const [isActive, setIsActive] = useState(false);
  const Icon = MARK_ICONS[mark];

  useEffect(() => {
    const update = () => setIsActive(editor.isActive(mark));
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor, mark]);

  return (
    <BaseButton
      {...rest}
      className={cn(className)}
      tooltip={tooltip}
      active={isActive}
      onClick={() => toggleMark(editor, mark)}
    >
      <Icon className="size-4" />
    </BaseButton>
  );
}
