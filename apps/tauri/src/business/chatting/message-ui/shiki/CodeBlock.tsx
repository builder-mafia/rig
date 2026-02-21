import { cn, toast } from '@allin/ui';
import DOMPurify from 'dompurify';
import { Clipboard, ClipboardCheck } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Subject, throttleTime } from 'rxjs';
import styles from './codeblock.module.css';
import { HighLighter } from './HighLighter';

type CodeBlockProps = {
  code: string;
  language: string;
  ref?: React.RefObject<HTMLElement>;
  as?: React.ElementType;
};

let highlighter: HighLighter | null = null;
const getHighlighterInstance = () => {
  if (!highlighter) {
    highlighter = new HighLighter({ useWorker: typeof Worker !== 'undefined' });
  }
  return highlighter;
};

// Layout Shifting Prevention:
//
// fontsize: 0.875rem
// line height: 1.75
// padding-top: 1.8rem
// padding-bottom: 0.875rem
// 0.1 is a magic.
const calcEstimatedHeight = (code: string) => {
  return code.split('\n').length * 0.875 * 1.75 + 1.8 + 0.875 + 0.1;
};

export const CodeBlock = ({
  code,
  language,
  ref,
  as: Element = 'pre',
}: CodeBlockProps) => {
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const streamForOptimization = useMemo(
    () => new Subject<{ code: string; language: string }>(),
    [],
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    const subscription = streamForOptimization
      // first optimization: throttle the highlight requests to prevent worker overload.
      .pipe(throttleTime(150, undefined, { leading: true, trailing: true }))
      .subscribe(({ code, language }) => {
        // second optimization: use useTransition to prevent ui interaction blocking.
        startTransition(async () => {
          const html = await getHighlighterInstance().highlight(code, language);

          if (!html) {
            return;
          }
          const sanitizedHtml = DOMPurify.sanitize(html);
          setHighlightedCode(sanitizedHtml);
        });
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [streamForOptimization]);

  useEffect(() => {
    streamForOptimization.next({ code, language });
  }, [code, language, streamForOptimization]);

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
    <Element
      ref={ref}
      style={
        {
          '--estimated-height': `${calcEstimatedHeight(code)}rem`,
        } as React.CSSProperties
      }
      data-loading={!highlightedCode}
      className={cn(
        styles.codeBlockContainer,
        'not-prose',
        !highlightedCode &&
          'w-full h-[var(--estimated-height)] bg-sidebar rounded-lg border border-border',
      )}
    >
      {highlightedCode && (
        <>
          <span className={cn(styles.languageLabel)}>{language}</span>
          <CopyButton onCopy={onCopy} />
          {/** biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized */}
          <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </>
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
      className={cn(styles.copyButton, isCopied && 'border-green-400')}
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
