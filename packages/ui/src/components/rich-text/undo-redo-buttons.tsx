import { useEditorState } from "@tiptap/react";
import { Redo, Undo } from "lucide-react";
import { useEditorContext } from "./editor-context";
import { BaseButton } from "./base-button";

export function UndoRedoButtons() {
  const { editor } = useEditorContext();

  const { canUndo, canRedo } = useEditorState({
    editor,
    selector: (ctx) => ({
      canUndo: ctx.editor.can().chain().focus().undo().run(),
      canRedo: ctx.editor.can().chain().focus().redo().run(),
    }),
  });

  return (
    <>
      <BaseButton
        disabled={!canUndo}
        tooltip="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="size-4" />
      </BaseButton>
      <BaseButton
        disabled={!canRedo}
        tooltip="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="size-4" />
      </BaseButton>
    </>
  );
}
