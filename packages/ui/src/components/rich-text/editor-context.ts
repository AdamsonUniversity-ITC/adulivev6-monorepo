import type { Editor } from '@tiptap/react';
import { createContext, useContext } from 'react';

export interface EditorContextValue {
  editor: Editor;
  onUploadImage?: (file: File) => Promise<string>;
  insertUploadedImage: (file: File) => Promise<void>;
  showImageButton: boolean;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditorContext must be inside EditorContext.Provider');
  }
  return ctx;
}
