import type { Element } from 'hast';
import { marked } from 'marked';
import React, { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './shiki/CodeBlock';
import { normalizeShikiLanguage } from './shiki/shikiLanguageSchema';

const toTokens = (text: string): Array<string> =>
  marked.lexer(text).map(token => token.raw);

type MarkdownBlockProps = {
  /**
   * token is md text.
   * @example
   * # Hello World
   */
  token: string;
};

/**
 * Function to determine if code is inline based on the presence of line breaks
 *
 * @example
 * const isInline = node && isInlineCode(node: Element)
 */
export const isInlineCode = (node: Element): boolean => {
  const textContent = (node.children || [])
    .filter(child => child.type === 'text')
    .map(child => child.value)
    .join('');

  return !textContent.includes('\n');
};

export const MarkdownBlock = React.memo(
  ({ token }: MarkdownBlockProps) => {
    // optimize: use useMemo to prevent re-mount of the components.
    const components = useMemo<Components>(
      () => ({
        pre: ({ children }) => (
          <div className='not-prose [&+.not-prose]:mt-2'>{children}</div>
        ),
        code: ({ node, className, children, ...props }) => {
          const inline = node && isInlineCode(node);
          const code = String(children).trim();

          const language = normalizeShikiLanguage(
            className?.match(/language-([^\s]+)/)?.[1] ?? 'plaintext',
          );

          // inline code should render as <code> inside text (often inside <p>).
          // this is `test` format in markdown.
          if (inline) {
            return (
              <span className='not-prose bg-muted rounded px-[0.25rem] py-[0.1rem] text-xs font-mono'>
                <code className={className} {...props}>
                  {children}
                </code>
              </span>
            );
          }

          return <CodeBlock code={code} language={language} />;
        },
      }),
      [],
    );

    return (
      <ReactMarkdown
        remarkPlugins={[
          [
            remarkGfm,
            {
              singleTilde: false,
            },
          ],
        ]}
        rehypePlugins={[
          // sanitize the markdown to prevent XSS attacks.
          rehypeSanitize,
          [
            // open external links in new tab.
            // add noopener and noreferrer to avoid security issues.
            rehypeExternalLinks,
            {
              target: '_blank',
              rel: ['noopener', 'noreferrer'],
            },
          ],
        ]}
        components={components}
      >
        {token}
      </ReactMarkdown>
    );
  },
  (prev, next) => prev.token === next.token,
);

MarkdownBlock.displayName = 'MarkdownBlock';
type MarkdownProps = {
  text: string;
  messageId: string;
};

export const Markdown = ({ messageId, text }: MarkdownProps) => {
  const blocks = useMemo(() => toTokens(text), [text]);

  return (
    <>
      {blocks.map((token, index) => (
        <MarkdownBlock key={`${messageId}-${index}`} token={token} />
      ))}
    </>
  );
};
