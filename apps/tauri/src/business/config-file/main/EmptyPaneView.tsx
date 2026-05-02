import { FileJson2 } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  showIcon?: boolean;
};

export const EmptyPaneView = ({
  title,
  description,
  showIcon = false,
}: Props) => {
  return (
    <div className='h-full flex items-center justify-center text-muted-foreground'>
      {showIcon ? (
        <div className='flex items-center gap-2'>
          <FileJson2 className='size-5' />
          <span>{description}</span>
        </div>
      ) : (
        <div className='text-center'>
          <p className='text-sm font-medium text-foreground'>{title}</p>
          <p className='mt-1 text-sm'>{description}</p>
        </div>
      )}
    </div>
  );
};
