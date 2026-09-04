import { render, waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RichTextEditor } from './rich-text-editor';

vi.mock('./rich-text/bubble-menu', () => ({
  BubbleMenuBar: () => null,
}));

vi.mock('./rich-text/toolbar', () => ({
  Toolbar: () => null,
}));

function TestHarness({
  mentions,
  onEditorReady,
}: {
  mentions?: Array<{ id: number; label: string }>;
  onEditorReady?: (editor: Editor) => void;
}) {
  const [value, setValue] = useState('<p></p>');
  return (
    <RichTextEditor
      value={value}
      onChange={setValue}
      mentions={mentions}
      onEditorReady={onEditorReady}
      showImageButton={false}
    />
  );
}

describe('RichTextEditor mentions', () => {
  it('does not load the mention extension without a mentions list', async () => {
    let editor!: Editor;
    render(
      <TestHarness
        onEditorReady={(instance) => {
          editor = instance;
        }}
      />,
    );

    await waitFor(() => {
      expect(editor).toBeTruthy();
    });

    expect(
      editor.extensionManager.extensions.some(
        (extension) => extension.name === 'mention',
      ),
    ).toBe(false);
  });

  it('inserts a mention span with data-id', async () => {
    let editor!: Editor;
    render(
      <TestHarness
        mentions={[{ id: 21, label: 'Ada Staff' }]}
        onEditorReady={(instance) => {
          editor = instance;
        }}
      />,
    );

    await waitFor(() => {
      expect(editor).toBeTruthy();
    });

    expect(
      editor.extensionManager.extensions.some(
        (extension) => extension.name === 'mention',
      ),
    ).toBe(true);

    editor.commands.insertContent({
      type: 'mention',
      attrs: { id: '21', label: 'Ada Staff' },
    });

    const html = editor.getHTML();
    expect(html).toContain('data-id="21"');
    expect(html).toContain('data-type="mention"');
    expect(html).toContain('@Ada Staff');
  });
});
