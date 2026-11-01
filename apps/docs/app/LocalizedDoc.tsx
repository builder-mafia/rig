import { useMDXComponents } from '../mdx-components';
import { getRequestLocale } from './locale-server';

const documents = {
  introduction: {
    en: () => import('../translations/en/introduction.mdx'),
    ko: () => import('../translations/ko/introduction.mdx'),
  },
  'skill-roots': {
    en: () => import('../translations/en/skill-roots.mdx'),
    ko: () => import('../translations/ko/skill-roots.mdx'),
  },
};

export async function LocalizedDoc({ name }: { name: keyof typeof documents }) {
  const locale = await getRequestLocale();
  const {
    default: Content,
    toc,
    metadata,
    sourceCode,
  } = await documents[name][locale]();
  const { wrapper: Wrapper } = useMDXComponents();
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <Content />
    </Wrapper>
  );
}
