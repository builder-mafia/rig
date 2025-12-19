import type { LLMProviderName } from '@allin/chat';
import { Google, OpenAI } from '@lobehub/icons';
import { match } from 'ts-pattern';

export const getLogoByProvider = (
  providerName: LLMProviderName,
  className: string,
) => {
  return match(providerName)
    .with('openai', () => <OpenAI className={className} />)
    .with('google', () => <Google className={className} />)
    .exhaustive();
};
