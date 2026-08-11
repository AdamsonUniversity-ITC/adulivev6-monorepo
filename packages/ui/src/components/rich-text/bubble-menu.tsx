import { findParentNode, posToDOMRect } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useEditorContext } from "./editor-context";
import { BaseButton } from "./base-button";
import { MarkButton } from "./mark-button";
import { TextColorButton } from "./text-color-button";
import { HighlightButton } from "./highlight-button";

export function BubbleMenuBar() {
  const { editor } = useEditorContext();

  return (
    <>
      <BubbleMenu
        editor={editor}
        options={{ placement: "bottom", offset: 8, flip: true }}
      >
        <div className="z-50 flex gap-0.5 rounded-md border border-border bg-popover p-1 shadow-md">
          <MarkButton className="rounded-md" mark="bold" tooltip="Bold" />
          <MarkButton className="rounded-md" mark="italic" tooltip="Italic" />
          <MarkButton className="rounded-md" mark="strike" tooltip="Strikethrough" />
          <MarkButton className="rounded-md" mark="underline" tooltip="Underline" />
          <TextColorButton />
          <HighlightButton />
        </div>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        shouldShow={() =>
          editor.isActive("bulletList") || editor.isActive("orderedList")
        }
        getReferencedVirtualElement={() => {
          const parentNode = findParentNode(
            (node) =>
              node.type.name === "bulletList" ||
              node.type.name === "orderedList",
          )(editor.state.selection);
          if (parentNode) {
            const domRect = posToDOMRect(
              editor.view,
              parentNode.start,
              parentNode.start + parentNode.node.nodeSize,
            );
            return {
              getBoundingClientRect: () => domRect,
              getClientRects: () => [domRect],
            };
          }
          return null;
        }}
        options={{ placement: "top-start", offset: 8 }}
      >
        <div className="z-50 rounded-md border border-border bg-popover p-1 shadow-md">
          <BaseButton
            onClick={() => {
              const chain = editor.chain().focus();
              if (editor.isActive("bulletList")) {
                chain.toggleOrderedList();
              } else {
                chain.toggleBulletList();
              }
              chain.run();
            }}
            tooltip="Toggle list type"
          >
            Toggle list type
          </BaseButton>
        </div>
      </BubbleMenu>
    </>
  );
}
