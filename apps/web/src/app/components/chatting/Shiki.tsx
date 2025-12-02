import DOMPurify from 'dompurify';
import { Clipboard, ClipboardCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createOnigurumaEngine } from 'shiki';
import {
  type BundledLanguage,
  bundledLanguagesInfo,
  createHighlighter,
  type Highlighter,
} from 'shiki/bundle/full';
import { toast } from 'sonner';
import { assert } from '@/utils/assert';
import { cn } from '@/utils/cn';
import styles from './shiki.module.css';

let highlighter: Highlighter | null = null;

const isValidLanguage = (language: string): boolean => {
  return bundledLanguagesInfo.some(lang => lang.id === language);
};

const getHighlighter = async (language: string) => {
  try {
    if (!highlighter) {
      const targetLanguage = isValidLanguage(language) ? language : 'plaintext';

      highlighter = await createHighlighter({
        langs: [targetLanguage],
        themes: ['github-dark'],
        engine: createOnigurumaEngine(import('shiki/wasm')),
      });
    } else {
      const targetLanguage = isValidLanguage(language) ? language : 'plaintext';

      if (!highlighter.getLoadedLanguages().includes(targetLanguage)) {
        await highlighter.loadLanguage(targetLanguage as BundledLanguage);
      }
    }
  } catch (err) {
    console.error('Failed to create highlighter');
    console.error(err);
    throw err;
  }

  assert(highlighter, 'Shiki: highlighter is not found');

  return highlighter;
};

type ShikiProps = {
  code: string;
  language: string;
  ref?: React.RefObject<HTMLElement>;
  as?: React.ElementType;
};

export const Shiki = ({
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

  const onCopy = () => {
    try {
      navigator.clipboard.writeText(code);
    } catch {
      toast.error(
        'Failed to copy code. Please check your clipboard permissions.',
      );
    }
  };

  return (
    <Element ref={ref} className={styles.shikiContainer}>
      <span className={cn(styles.languageLabel)}>{language}</span>
      <CopyButton onCopy={onCopy} />
      {highlightedCode && (
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized html
        <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
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
