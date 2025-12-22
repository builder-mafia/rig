import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@allin/ui';
import { RotateCcw, TriangleAlert } from 'lucide-react';

type AssistantMessageErrorUIProps = {
  errorMessage: string;
  showRetryButton: boolean;
  onRetry: () => void;
};

export const AssistantMessageErrorUI = ({
  errorMessage,
  showRetryButton,
  onRetry,
}: AssistantMessageErrorUIProps) => {
  return (
    <div className='not-prose mb-3'>
      <Item
        variant='outline'
        size='sm'
        className='border-destructive/30 bg-destructive/5'
      >
        <ItemMedia>
          <TriangleAlert className='text-destructive' />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className='text-destructive'>Error</ItemTitle>
          <ItemDescription className='line-clamp-none whitespace-pre-wrap break-words text-destructive/80'>
            {errorMessage ?? 'Something went wrong.'}
          </ItemDescription>
        </ItemContent>
        {showRetryButton && (
          <ItemActions>
            <Button size='icon' variant='outline' onClick={onRetry}>
              <RotateCcw className='text-foreground' />
            </Button>
          </ItemActions>
        )}
      </Item>
    </div>
  );
};
