import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

export const SkillMarkdown = ({ content }: { content: string }) => (
  <article className='prose prose-neutral max-w-[76ch] dark:prose-invert prose-headings:tracking-[-0.02em] prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-pre:overflow-x-auto'>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeSanitize,
        [rehypeExternalLinks, { target: '_blank', rel: ['noreferrer'] }],
      ]}
    >
      {content}
    </ReactMarkdown>
  </article>
);
