declare module '*.mdx' {
  export const metadata: import('nextra').EvaluateResult['metadata'];
  export const toc: import('nextra').EvaluateResult['toc'];
  export const sourceCode: import('nextra').EvaluateResult['sourceCode'];
  const Content: import('react').ComponentType;
  export default Content;
}
