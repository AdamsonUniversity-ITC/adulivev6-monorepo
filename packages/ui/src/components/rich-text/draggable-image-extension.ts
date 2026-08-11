import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";

export const ResizableDraggableInlineImage = Image.extend({
  name: "image",

  inline() {
    return true;
  },

  group() {
    return "inline";
  },

  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("width"),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      style: {
        default: "display:inline;",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("style") || "display:inline;",
        renderHTML: (attributes: Record<string, unknown>) => ({
          style: (attributes.style as string) || "display:inline;",
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrapper = document.createElement("span");
      wrapper.style.display = "inline-block";
      wrapper.style.position = "relative";
      wrapper.style.verticalAlign = "middle";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      img.title = node.attrs.title || "";
      img.style.cursor = "grab";
      img.draggable = true;
      img.style.display = "inline";
      if (node.attrs.width) {
        img.style.width = node.attrs.width + "px";
      }

      const handle = document.createElement("span");
      handle.style.position = "absolute";
      handle.style.right = "0";
      handle.style.bottom = "0";
      handle.style.width = "8px";
      handle.style.height = "8px";
      handle.style.background = "rgba(0,0,0,0.5)";
      handle.style.cursor = "nwse-resize";
      handle.style.borderRadius = "2px";
      handle.style.display = "none";

      wrapper.appendChild(img);
      wrapper.appendChild(handle);

      wrapper.addEventListener(
        "mouseenter",
        () => (handle.style.display = "block"),
      );
      wrapper.addEventListener(
        "mouseleave",
        () => (handle.style.display = "none"),
      );

      img.addEventListener("dragstart", (event) => {
        const pos = typeof getPos === "function" ? getPos() : getPos;
        event.dataTransfer?.setData("text/plain", String(pos));
        event.dataTransfer?.setDragImage(img, img.width / 2, img.height / 2);
      });

      const onDragOver = (event: DragEvent) => event.preventDefault();

      const onDrop = (event: DragEvent) => {
        const fromPosStr = event.dataTransfer?.getData("text/plain");
        if (!fromPosStr) return;
        const fromPos = parseInt(fromPosStr, 10);
        if (Number.isNaN(fromPos)) return;

        const coords = { left: event.clientX, top: event.clientY };
        const posAtCoords = editor.view.posAtCoords(coords);
        if (!posAtCoords) return;

        let toPos = posAtCoords.pos;
        event.preventDefault();

        const nodeAtFrom = editor.state.doc.nodeAt(fromPos);
        if (!nodeAtFrom) return;
        const nodeSize = nodeAtFrom.nodeSize;
        if (fromPos < toPos) toPos -= nodeSize;

        editor
          .chain()
          .focus()
          .command(({ tr, state }) => {
            tr.delete(fromPos, fromPos + nodeSize);

            const resolved = tr.doc.resolve(toPos);
            if (!resolved.parent.isTextblock) {
              toPos = state.selection.from;
            }

            const attrs = {
              ...nodeAtFrom.attrs,
              style: "display:inline;",
            };

            tr.insert(toPos, state.schema.nodes.image.create(attrs));

            tr.doc.descendants((child, pos) => {
              if (child.type.name === "paragraph" && child.content.size === 0) {
                tr.delete(pos, pos + child.nodeSize);
              }
            });

            editor.view.dispatch(tr);
            editor.view.focus();
            return true;
          })
          .run();
      };

      let startX = 0;
      let startWidth = 0;

      handle.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();

        startX = event.clientX;
        startWidth = img.offsetWidth;

        const onMouseMove = (moveEvent: MouseEvent) => {
          const diff = moveEvent.clientX - startX;
          const newWidth = Math.max(20, startWidth + diff);
          img.style.width = newWidth + "px";
        };

        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);

          const pos = typeof getPos === "function" ? getPos() : getPos;
          if (typeof pos !== "number") return;

          const nodeAtPos = editor.state.doc.nodeAt(pos);
          if (!nodeAtPos || nodeAtPos.type.name !== "image") return;

          const newWidth = parseInt(img.style.width);
          try {
            const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
              ...nodeAtPos.attrs,
              width: newWidth,
              style: `display:inline;width:${newWidth}px;`,
            });
            editor.view.dispatch(tr);
          } catch (err) {
            console.warn("Resize update skipped due to invalid position:", err);
          }

          editor.view.focus();
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      return {
        dom: wrapper,
        destroy() {
          const attachDragListeners = () => {
            if (!editor?.view?.dom) return;
            editor.view.dom.removeEventListener("dragover", onDragOver);
            editor.view.dom.removeEventListener("drop", onDrop);
            editor.view.dom.addEventListener("dragover", onDragOver);
            editor.view.dom.addEventListener("drop", onDrop);
          };

          if (typeof window !== "undefined") {
            requestAnimationFrame(attachDragListeners);
          }
        },
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false;
          if (updatedNode.attrs.src !== img.src)
            img.src = updatedNode.attrs.src;
          if (updatedNode.attrs.width) {
            img.style.width = updatedNode.attrs.width + "px";
          }
          img.style.display = "inline";
          return true;
        },
      };
    };
  },
});
