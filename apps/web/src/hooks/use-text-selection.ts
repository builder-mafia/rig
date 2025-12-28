import { useEffect, useRef, useState } from 'react';
import { fromEvent } from 'rxjs';
import { delay, map, sample, tap, throttleTime } from 'rxjs/operators';

interface UseTextSelectionReturn {
  selectedText: string;
  isTextSelected: boolean;
  selectionBoundingRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useTextSelection(): UseTextSelectionReturn {
  const [selectedText, setSelectedText] = useState('');
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [selectionBoundingRect, setSelectionBoundingRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({ left: 0, top: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Create observables for selection and pointer events
    const selectionChange$ = fromEvent(document, 'selectionchange').pipe(
      throttleTime(100), // Throttle rapid selection changes
      map<
        Event,
        | {
            text: string;
            rect: { left: number; top: number; width: number; height: number };
            isValid: true;
          }
        | { text: ''; rect: null; isValid: false }
      >(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (container && selection && selection.rangeCount > 0 && text) {
          const range = selection.getRangeAt(0);

          // Check if the selection is within the container
          if (container.contains(range.commonAncestorContainer)) {
            const rect = range.getBoundingClientRect();
            return {
              text,
              rect: {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              },
              isValid: true,
            };
          }
        }

        return { text: '', rect: null, isValid: false };
      }),
    );

    // Pointer up event to confirm selection
    const pointerUp$ = fromEvent<PointerEvent>(document, 'pointerup');

    // merge selection change and pointer up event
    // delay is for waiting for the pointer up event to be triggered after the selection change event.
    const merged$ = selectionChange$.pipe(sample(pointerUp$.pipe(delay(50))));

    const mergedSubscription = merged$.subscribe(selection => {
      if (selection.isValid) {
        setSelectedText(selection.text);
        setSelectionBoundingRect(selection.rect);
        setIsTextSelected(true);
      } else {
        setIsTextSelected(false);
        setSelectedText('');
      }
    });

    return () => {
      mergedSubscription.unsubscribe();
    };
  }, []);

  return {
    selectedText,
    isTextSelected,
    selectionBoundingRect,
    containerRef,
  };
}
