import './rich-text/styles.css';

import Bold from '@tiptap/extension-bold';
import Highlight from '@tiptap/extension-highlight';
import Italic from '@tiptap/extension-italic';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import {
  Color,
  FontFamily,
  FontSize,
  TextStyle,
} from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Dropcursor } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { BubbleMenuBar } from './rich-text/bubble-menu';
import { ResizableDraggableInlineImage } from './rich-text/draggable-image-extension';
import { EditorContext } from './rich-text/editor-context';
import { Toolbar } from './rich-text/toolbar';

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onUploadImage?: (file: File) => Promise<string>;
  onUploadingChange?: (uploading: boolean) => void;
  showImageButton?: boolean;
  minHeight?: string;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
};

const ALLOWED_IMAGE_TYPES = [
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
  'image/webp',
  'image/x-icon',
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  onUploadImage,
  onUploadingChange,
  showImageButton = true,
  minHeight = '200px',
  onEditorReady,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onUploadImageRef = useRef(onUploadImage);
  onUploadImageRef.current = onUploadImage;

  const onUploadingChangeRef = useRef(onUploadingChange);
  onUploadingChangeRef.current = onUploadingChange;

  const lastEmittedHtml = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: { class: 'rich-content' },
        },
      }),
      FontSize,
      Dropcursor,
      TextStyle,
      Italic,
      Underline,
      Bold,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableDraggableInlineImage.configure({ inline: true }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      lastEmittedHtml.current = html;
      onChangeRef.current(html);
    },
  });

  const editorReadyFired = useRef(false);
  useEffect(() => {
    if (editor && !editorReadyFired.current) {
      editorReadyFired.current = true;
      onEditorReady?.(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && editor.isEditable === disabled) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedHtml.current) return;

    const isEmptyValue =
      !value ||
      value
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim().length === 0;

    if (isEmptyValue) {
      if (!editor.isEmpty) {
        editor.commands.setContent('', { emitUpdate: false });
      }
      lastEmittedHtml.current = value;
      return;
    }

    const currentHtml = editor.getHTML();
    if (value === currentHtml) {
      lastEmittedHtml.current = value;
      return;
    }

    editor.commands.setContent(value, { emitUpdate: false });
    lastEmittedHtml.current = value;
  }, [value, editor]);

  const insertUploadedImage = useCallback(
    async (file: File, pos?: number) => {
      if (!onUploadImageRef.current || !editor) return;
      onUploadingChangeRef.current?.(true);
      try {
        const url = await onUploadImageRef.current(file);
        const chain = editor.chain().focus();
        if (typeof pos === 'number') {
          chain.setTextSelection(pos);
        }
        chain.setImage({ src: url }).run();
      } finally {
        onUploadingChangeRef.current?.(false);
      }
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          ...(placeholder ? { 'data-placeholder': placeholder } : {}),
        },
        handlePaste: (_view, event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;
          for (const item of items) {
            if (ALLOWED_IMAGE_TYPES.includes(item.type)) {
              const file = item.getAsFile();
              if (file) {
                void insertUploadedImage(file);
                return true;
              }
            }
          }
          return false;
        },
        handleDrop: (view, event) => {
          if (!onUploadImageRef.current) return false;
          const files = event.dataTransfer?.files;
          if (!files?.length) return false;

          const imageFiles = Array.from(files).filter((file) =>
            ALLOWED_IMAGE_TYPES.includes(file.type),
          );
          if (imageFiles.length === 0) return false;

          event.preventDefault();
          const coords = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          const pos = coords?.pos;

          for (const file of imageFiles) {
            void insertUploadedImage(file, pos);
          }
          return true;
        },
      },
    });
  }, [editor, insertUploadedImage, placeholder]);

  if (!editor) return null;

  return (
    <EditorContext.Provider
      value={{
        editor,
        onUploadImage,
        insertUploadedImage,
        showImageButton: showImageButton && !!onUploadImage,
      }}
    >
      <div
        className={cn(
          'border-input bg-background focus-within:ring-ring/50 overflow-hidden rounded-md border focus-within:ring-2',
          disabled && 'pointer-events-none opacity-60',
          className,
        )}
      >
        <Toolbar />
        <BubbleMenuBar />
        <div
          className="rich-text-editor-content overflow-auto"
          style={{ minHeight }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </EditorContext.Provider>
  );
}

export { sanitizeRichTextHtml } from './rich-text/sanitize';
