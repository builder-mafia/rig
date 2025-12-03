import { marked } from 'marked';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

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

export const MarkdownBlock = ({ token }: MarkdownBlockProps) => {
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
      components={{
        pre: ({ children }) => <div className='not-prose'>{children}</div>,
        code: props => {
          const code = String(props.children).trim();
          const language =
            props.className?.match(/language-(\w+)/)?.[1] ?? 'plaintext';
          return <CodeBlock code={code} language={language} />;
        },
      }}
    >
      {token}
    </ReactMarkdown>
  );
};

type MarkdownProps = {
  text: string;
};

export const Markdown = ({ text }: MarkdownProps) => {
  const blocks = useMemo(() => toTokens(text), [text]);

  return (
    <>
      {blocks.map((token, index) => (
        <MarkdownBlock key={`block-${index}`} token={token} />
      ))}
    </>
  );
};
