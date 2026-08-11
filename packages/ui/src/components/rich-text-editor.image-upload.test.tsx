import { render, waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RichTextEditor } from './rich-text-editor';

vi.mock('./rich-text/bubble-menu', () => ({
  BubbleMenuBar: () => null,
}));

vi.mock('./rich-text/toolbar', () => ({
  Toolbar: () => null,
}));

const UPLOAD_URL = 'https://cdn.test/img.png';

function pngFile(name = 'photo.png') {
  return new File([new Uint8Array([137, 80, 78, 71])], name, {
    type: 'image/png',
  });
}

function textFile(name = 'notes.txt') {
  return new File(['hello'], name, { type: 'text/plain' });
}

type HarnessProps = {
  onUploadImage: (file: File) => Promise<string>;
  onEditorReady?: (editor: Editor) => void;
};

function TestHarness({ onUploadImage, onEditorReady }: HarnessProps) {
  const [value, setValue] = useState('<p></p>');
  return (
    <RichTextEditor
      value={value}
      onChange={setValue}
      onUploadImage={onUploadImage}
      onEditorReady={onEditorReady}
      showImageButton={false}
    />
  );
}

function getEditorProps(editor: Editor) {
  return editor.options.editorProps ?? {};
}

describe('RichTextEditor image upload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads and inserts image on paste', async () => {
    const onUploadImage = vi.fn(async () => UPLOAD_URL);
    let editor!: Editor;

    render(
      <TestHarness
        onUploadImage={onUploadImage}
        onEditorReady={(instance) => {
          editor = instance;
        }}
      />,
    );

    await waitFor(() => expect(editor).toBeDefined());

    const file = pngFile();
    const handlePaste = getEditorProps(editor).handlePaste;
    expect(handlePaste).toBeTypeOf('function');

    const handled = handlePaste!(editor.view, {
      clipboardData: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
      },
    } as unknown as ClipboardEvent);

    expect(handled).toBe(true);

    await waitFor(() => {
      expect(onUploadImage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'image/png', name: 'photo.png' }),
      );
    });

    await waitFor(() => {
      expect(editor.getHTML()).toContain(UPLOAD_URL);
    });
  });

  it('uploads and inserts image on drop', async () => {
    const onUploadImage = vi.fn(async () => UPLOAD_URL);
    let editor!: Editor;

    render(
      <TestHarness
        onUploadImage={onUploadImage}
        onEditorReady={(instance) => {
          editor = instance;
        }}
      />,
    );

    await waitFor(() => expect(editor).toBeDefined());

    const file = pngFile('drop.png');
    const preventDefault = vi.fn();
    const handleDrop = getEditorProps(editor).handleDrop;
    expect(handleDrop).toBeTypeOf('function');

    const handled = handleDrop!(editor.view, {
      preventDefault,
      clientX: 8,
      clientY: 8,
      dataTransfer: {
        files: [file],
      },
    } as unknown as DragEvent);

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();

    await waitFor(() => {
      expect(onUploadImage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'image/png', name: 'drop.png' }),
      );
    });

    await waitFor(() => {
      expect(editor.getHTML()).toContain(UPLOAD_URL);
    });
  });

  it('ignores non-image file drops', async () => {
    const onUploadImage = vi.fn(async () => UPLOAD_URL);
    let editor!: Editor;

    render(
      <TestHarness
        onUploadImage={onUploadImage}
        onEditorReady={(instance) => {
          editor = instance;
        }}
      />,
    );

    await waitFor(() => expect(editor).toBeDefined());

    const handleDrop = getEditorProps(editor).handleDrop;
    const handled = handleDrop!(editor.view, {
      preventDefault: vi.fn(),
      clientX: 8,
      clientY: 8,
      dataTransfer: {
        files: [textFile()],
      },
    } as unknown as DragEvent);

    expect(handled).toBe(false);
    expect(onUploadImage).not.toHaveBeenCalled();
  });

  it('keeps inserted image when parent re-renders before message state updates', async () => {
    const onUploadImage = vi.fn(async () => UPLOAD_URL);
    let editor!: Editor;
    let rerender!: ReturnType<typeof render>['rerender'];
    let value = '<p></p>';
    let extra = 0;

    function ControlledHarness() {
      return (
        <RichTextEditor
          value={value}
          onChange={(html) => {
            value = html;
          }}
          onUploadImage={onUploadImage}
          onEditorReady={(instance) => {
            editor = instance;
          }}
          showImageButton={false}
        />
      );
    }

    const view = render(
      <>
        <span data-testid="extra">{extra}</span>
        <ControlledHarness />
      </>,
    );
    rerender = view.rerender;

    await waitFor(() => expect(editor).toBeDefined());

    const handlePaste = getEditorProps(editor).handlePaste;
    handlePaste!(editor.view, {
      clipboardData: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => pngFile(),
          },
        ],
      },
    } as unknown as ClipboardEvent);

    await waitFor(() => expect(onUploadImage).toHaveBeenCalled());
    await waitFor(() => expect(editor.getHTML()).toContain(UPLOAD_URL));

    // Simulate a parent re-render with stale `value` before onChange is applied.
    extra = 1;
    rerender(
      <>
        <span data-testid="extra">{extra}</span>
        <ControlledHarness />
      </>,
    );

    await waitFor(() => {
      expect(editor.getHTML()).toContain(UPLOAD_URL);
    });
  });
});
