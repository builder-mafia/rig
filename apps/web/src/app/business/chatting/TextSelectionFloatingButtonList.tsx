import type { TextSelectionFloatingButtonComponent } from '@allin/api';
import { Button, ButtonGroup, Popover, PopoverContent } from '@allin/ui';
import { atom, useAtomValue } from 'jotai';

export const textSelectionFloatingButtonListAtom = atom<
  Map<string, TextSelectionFloatingButtonComponent>
>(new Map());

type TextSelectionFloatingButtonListProps = {
  isOpen: boolean;
  selectedText: string;
  selectionBoundingRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export const TextSelectionFloatingButtonList = ({
  isOpen,
  selectedText,
  selectionBoundingRect,
}: TextSelectionFloatingButtonListProps) => {
  const textSelectionFloatingButtonList = useAtomValue(
    textSelectionFloatingButtonListAtom,
  );

  if (textSelectionFloatingButtonList.size === 0) {
    return null;
  }

  return (
    <Popover open={isOpen}>
      <PopoverContent
        side='top'
        align='center'
        className='w-auto p-0'
        style={{
          position: 'fixed',
          left: selectionBoundingRect.left,
          top: selectionBoundingRect.top,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <ButtonGroup>
          {Array.from(textSelectionFloatingButtonList.entries()).map(
            ([id, Component]) => (
              <Button key={id} variant='outline' size='sm'>
                <Component close={() => {}} selectedText={selectedText} />
              </Button>
            ),
          )}
        </ButtonGroup>
      </PopoverContent>
    </Popover>
  );
};
