import type { ChatStatus } from 'ai';
import { Thread } from '@/app/main/chat/Thread';
import type { Thread as ThreadType } from '@/core/helper';

type ChattingProps = {
  threads: ThreadType[];
  status: ChatStatus;
};

export const ChatList = ({ threads, status }: ChattingProps) => {
  return (
    <div className='w-full h-full flex flex-col max-w-2xl lg:max-w-4xl'>
      <div className='p-4 gap-4 flex flex-col'>
        {threads.map((thread, index) => (
          <Thread
            key={`thread-${index}`}
            thread={thread}
            isLast={threads.length - 1 === index}
            status={status}
          />
        ))}
      </div>
    </div>
  );
};
