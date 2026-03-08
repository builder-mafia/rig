import type { ProviderId } from '@allin/ai';
import { Anthropic, Gemini, OpenAI, Vercel } from '@lobehub/icons';
import { match } from 'ts-pattern';

export const getProviderIcon = (
  providerName: ProviderId,
  className: string,
) => {
  // text-current opts out of [&_svg:not([class*='text-'])]:text-muted-foreground
  const cn = `text-current ${className}`;
  return match(providerName)
    .with('openai', () => <OpenAI color={OpenAI.colorGpt3} className={cn} />)
    .with('codex', () => <OpenAI className={cn} />)
    .with('google', () => <Gemini.Color className={cn} />)
    .with('anthropic', () => <Anthropic className={cn} />)
    .with('vercel', () => <Vercel className={cn} />)
    .exhaustive();
};
