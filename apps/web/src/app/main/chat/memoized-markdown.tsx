import { marked } from 'marked';
import {
  type ClassAttributes,
  type HTMLAttributes,
  memo,
  useDeferredValue,
  useMemo,
} from 'react';
import type { ExtraProps } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { isInlineCode, ShikiHighlighter } from 'react-shiki';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils/cn';
import './shiki.css';

type CodeProps = ClassAttributes<HTMLElement> &
  HTMLAttributes<HTMLElement> &
  ExtraProps;

const CodeHighlight = ({
  className,
  children,
  node,
  isLastBlock,
  ...props
}: CodeProps & { isLastBlock?: boolean }) => {
  const code = String(children).trim();
  const match = className?.match(/language-(\w+)/);
  const language = match ? match[1] : undefined;
  const isInline = isLastBlock || (node && isInlineCode(node));

  return isInline ? (
    <code className={cn(className, 'whitespace-pre-wrap text-sm')} {...props}>
      {code}
    </code>
  ) : (
    <ShikiHighlighter
      className='shiki-display-animation text-sm border border-gray-200 rounded-md [&>pre]:p-4!'
      addDefaultStyles={true}
      language={language}
      theme='github-dark'
      {...props}
    >
      {code}
    </ShikiHighlighter>
  );
};

function parseMarkdownIntoBlocks(
  markdown: string,
): Array<{ content: string; type: string }> {
  const tokens = marked.lexer(markdown);

  return tokens.map(token => ({
    content: token.raw,
    type: token.type,
  }));
}

const MemoizedMarkdownBlock = memo(
  ({ content, isLastBlock }: { content: string; isLastBlock: boolean }) => {
    const deferredContent = useDeferredValue(content, '');

    return (
      <ReactMarkdown
        remarkPlugins={[
          [
            remarkGfm,
            {
              // 20~23도부터 40~41도 입니다 에서 ~ 로 인해 취소선이 되는 버그 수정
              singleTilde: false,
            },
          ],
        ]}
        components={{
          code: props => (
            <CodeHighlight {...props} isLastBlock={isLastBlock}></CodeHighlight>
          ),
          pre: ({ children }) => <div className='not-prose'>{children}</div>,
          a: ({ ...props }) => (
            <a {...props} target='_blank' rel='noopener noreferrer' />
          ),
        }}
      >
        {deferredContent}
      </ReactMarkdown>
    );
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map(({ content }, index) => (
      <MemoizedMarkdownBlock
        content={content}
        key={`${id}-block-${index}`}
        isLastBlock={index === blocks.length - 1}
      />
    ));
  },
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';
