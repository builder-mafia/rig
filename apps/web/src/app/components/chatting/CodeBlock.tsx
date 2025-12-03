import DOMPurify from 'dompurify';
import { Clipboard, ClipboardCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createOnigurumaEngine } from 'shiki';
import { getSingletonHighlighter } from 'shiki/bundle/full';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import styles from './codeblock.module.css';

const getHighlighter = async (language: string) => {
  try {
    return await getSingletonHighlighter({
      langs: [language],
      themes: ['github-dark'],
      engine: createOnigurumaEngine(import('shiki/wasm')),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Language')) {
      return await getSingletonHighlighter({
        langs: ['plaintext'],
        themes: ['github-dark'],
        engine: createOnigurumaEngine(import('shiki/wasm')),
      });
    }
    throw error;
  }
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
    getHighlighter(language).then(highlighter => {
      const html = highlighter.codeToHtml(code, {
        lang: language,
        theme: 'github-dark',
      });

      const sanitizedHtml = DOMPurify.sanitize(html);

      setHighlightedCode(sanitizedHtml);
    });
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
      <span className={cn(styles.languageLabel)}>{language}</span>
      {highlightedCode ? (
        <>
          <CopyButton onCopy={onCopy} />
          {/** biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized */}
          <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </>
      ) : (
        // Shiki works asynchronously. so we need to show a loading skeleton until it's loaded.
        <span className={styles.skeleton} />
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
