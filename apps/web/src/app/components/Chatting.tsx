import type { ChatStatus } from 'ai';
import type { Thread as ThreadType } from '@/core/helper';
import { Thread } from '../main/chat/Thread';

type ChattingProps = {
  threads: ThreadType[];
  status: ChatStatus;
};

export const Chatting = ({ threads, status }: ChattingProps) => {
  return (
    <div className='w-full h-full flex flex-col max-w-2xl lg:max-w-4xl'>
      <div className='p-4 gap-4 flex flex-col'>
        {threads.map((thread, index) => (
          <Thread
            key={`thread-${index}`}
            thread={thread}
            isLast={threads.length - 1 === index}
            status={status}
          ></Thread>
        ))}
      </div>
    </div>
  );
};
