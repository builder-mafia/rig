import DOMPurify from 'dompurify';
import { Clipboard, ClipboardCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import styles from './codeblock.module.css';

type WorkerRequest = {
  id: number;
  code: string;
  language: string;
};

type WorkerResponse =
  | {
      id: number;
      html: string;
      error?: undefined;
    }
  | {
      id: number;
      html?: undefined;
      error: string;
    };

let shikiWorker: Worker | null = null;
let requestIdCounter = 0;
const pendingRequests = new Map<number, (response: WorkerResponse) => void>();

const getShikiWorker = () => {
  if (typeof window === 'undefined') return null;

  if (!shikiWorker) {
    shikiWorker = new Worker(new URL('./shikiWorker.ts', import.meta.url), {
      name: 'shiki-highlighter',
      type: 'module',
    });

    shikiWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const resolve = pendingRequests.get(response.id);

      if (!resolve) return;

      pendingRequests.delete(response.id);
      resolve(response);
    };
  }

  return shikiWorker;
};

const highlightWithWorker = (code: string, language: string) => {
  if (typeof window === 'undefined') {
    return Promise.resolve<string | null>(null);
  }

  const worker = getShikiWorker();

  if (!worker) {
    return Promise.resolve<string | null>(null);
  }

  const requestId = requestIdCounter++;
  const payload: WorkerRequest = {
    id: requestId,
    code,
    language,
  };

  return new Promise<string | null>((resolve, reject) => {
    pendingRequests.set(requestId, response => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response.html);
    });

    worker.postMessage(payload);
  });
};

type ShikiProps = {
  code: string;
  language: string;
  ref?: React.RefObject<HTMLElement>;
  as?: React.ElementType;
};

export const CodeBlock = ({
  code,
  language,
  ref,
  as: Element = 'pre',
}: ShikiProps) => {
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    highlightWithWorker(code, language)
      .then(html => {
        if (isCancelled || html === null) return;

        const sanitizedHtml = DOMPurify.sanitize(html);

        setHighlightedCode(sanitizedHtml);
      })
      .catch(() => {
        if (isCancelled) return;
        setHighlightedCode(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [code, language]);

  const onCopy = useCallback(() => {
    try {
      navigator.clipboard.writeText(code);
    } catch {
      toast.error(
        'Failed to copy code. Please check your clipboard permissions.',
      );
    }
  }, [code]);

  return (
    <Element ref={ref} className={cn(styles.codeBlockContainer, 'not-prose')}>
      {highlightedCode ? (
        <>
          <span className={cn(styles.languageLabel)}>{language}</span>
          <CopyButton onCopy={onCopy} />
          {/** biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized */}
          <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </>
      ) : (
        // Shiki works asynchronously. so we need to show a loading skeleton until it's loaded.
        <span className={cn(styles.skeleton, 'inline-block')} />
      )}
    </Element>
  );
};

const CopyButton = ({ onCopy }: { onCopy: () => void }) => {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    if (isCopied) return;

    onCopy();

    setIsCopied(true);
    timerRef.current = setTimeout(() => setIsCopied(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <button
      type='button'
      data-copied={isCopied}
      className={styles.copyButton}
      onClick={handleCopy}
    >
      {isCopied ? (
        <ClipboardCheck className='w-4 h-4 text-green-400' />
      ) : (
        <Clipboard className='w-4 h-4 text-gray-300' />
      )}
    </button>
  );
};
