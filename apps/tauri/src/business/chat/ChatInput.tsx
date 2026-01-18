'use client';

import { type ChangeEvent, useCallback, useRef, useState } from 'react';

interface ChatInputProps {
  /** 메시지 전송 핸들러 */
  onSendMessage: (text: string) => Promise<void>;
  /** 로딩/스트리밍 상태 */
  isLoading: boolean;
  /** 스트리밍 중지 핸들러 (선택적) */
  onStop?: () => void;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export const ChatInput = ({
  onSendMessage,
  isLoading,
  onStop,
  placeholder = 'Type your message...',
  disabled = false,
}: ChatInputProps) => {
  const [input, setInput] = useState('');
  // IME (한글, 일본어, 중국어 등) 처리를 위한 플래그
  const ignoreNextChangeRef = useRef(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (ignoreNextChangeRef.current) {
      ignoreNextChangeRef.current = false;
      return;
    }
    setInput(e.target.value);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!input.trim() || isLoading || disabled) return;

      const text = input.trim();
      setInput('');
      await onSendMessage(text);
    },
    [input, isLoading, disabled, onSendMessage],
  );

  const handleStop = useCallback(() => {
    if (isLoading && onStop) {
      onStop();
    }
  }, [isLoading, onStop]);

  return (
    <form
      onSubmit={handleSubmit}
      className='border-t border-zinc-200 p-4 dark:border-zinc-700'
    >
      <div className='mx-auto flex max-w-3xl gap-2'>
        <input
          type='text'
          value={input}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          className='flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500'
        />
        {isLoading && onStop ? (
          <button
            type='button'
            onClick={handleStop}
            className='rounded-lg bg-red-500 px-6 py-2 font-medium text-white transition-colors hover:bg-red-600'
          >
            Stop
          </button>
        ) : (
          <button
            type='submit'
            disabled={isLoading || !input.trim() || disabled}
            className='rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Send
          </button>
        )}
      </div>
    </form>
  );
};
