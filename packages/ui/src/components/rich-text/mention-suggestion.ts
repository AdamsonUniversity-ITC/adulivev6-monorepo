import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import type { MutableRefObject } from 'react';
import {
  MentionList,
  type MentionCandidate,
  type MentionListRef,
} from './mention-list';

export function createMentionSuggestion(
  mentionsRef: MutableRefObject<MentionCandidate[] | undefined>,
): Omit<SuggestionOptions<MentionCandidate>, 'editor'> {
  return {
    char: '@',
    allowSpaces: false,
    items: ({ query }) => {
      const list = mentionsRef.current ?? [];
      const needle = query.trim().toLowerCase();
      return list
        .filter((item) => {
          if (!needle) {
            return true;
          }
          return (
            item.label.toLowerCase().includes(needle) ||
            String(item.id).includes(needle)
          );
        })
        .slice(0, 8);
    },
    render: () => {
      let component: ReactRenderer<MentionListRef> | null = null;
      let unmount: (() => void) | null = null;

      const mountPopup = (props: SuggestionProps<MentionCandidate>) => {
        if (!component) {
          return;
        }
        component.element.style.zIndex = '1000';
        unmount?.();
        unmount = props.mount(component.element);
      };

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          mountPopup(props);
        },
        onUpdate: (props) => {
          component?.updateProps(props);
          if (!unmount) {
            mountPopup(props);
          }
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            unmount?.();
            unmount = null;
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          unmount?.();
          unmount = null;
          component?.destroy();
          component = null;
        },
      };
    },
  };
}
