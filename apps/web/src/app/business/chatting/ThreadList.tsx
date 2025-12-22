import type { ChatStatus } from 'ai';
import { Thread } from '@/app/business/chatting/Thread';
import type { Thread as ThreadType } from './thread-util';

type ThreadListProps = {
  threads: ThreadType[];
  status: ChatStatus;
  regenerate: (messageId: string) => void;
};

export const ThreadList = ({
  threads,
  status,
  regenerate,
}: ThreadListProps) => {
  return (
    <div className='w-full h-full flex flex-col max-w-2xl lg:max-w-4xl'>
      <div className='p-4 gap-4 flex flex-col'>
        {threads.map((thread, index) => (
          <Thread
            key={`${thread.userMessage.id}`}
            thread={thread}
            isLast={threads.length - 1 === index}
            status={status}
            regenerate={regenerate}
          />
        ))}
      </div>
    </div>
  );
};
