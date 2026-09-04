import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { cn } from '../../lib/utils';

export type MentionCandidate = {
  id: number;
  label: string;
};

export type MentionListProps = {
  items: MentionCandidate[];
  command: (item: MentionCandidate) => void;
};

export type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedIndexRef = useRef(0);
    selectedIndexRef.current = selectedIndex;

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (items.length === 0) {
          return false;
        }

        if (event.key === 'ArrowUp') {
          setSelectedIndex(
            (index) => (index + items.length - 1) % items.length,
          );
          return true;
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((index) => (index + 1) % items.length);
          return true;
        }

        if (event.key === 'Enter') {
          const item = items[selectedIndexRef.current];
          if (item) {
            command(item);
          }
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-popover text-muted-foreground rounded-md border px-3 py-2 text-sm shadow-md">
          No staff found
        </div>
      );
    }

    return (
      <div
        role="listbox"
        className="bg-popover text-popover-foreground pointer-events-auto max-h-56 min-w-48 overflow-auto rounded-md border p-1 shadow-md"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            className={cn(
              'flex w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm',
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/60',
            )}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              command(item);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  },
);
