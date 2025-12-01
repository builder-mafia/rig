import { Google, OpenAI } from '@lobehub/icons';
import { match } from 'ts-pattern';
import type { LLMProviderName } from '@/core/provider/all-models';

export const getLogoByProvider = (
  providerName: LLMProviderName,
  className: string,
) => {
  return match(providerName)
    .with('openai', () => <OpenAI className={className} />)
    .with('google', () => <Google className={className} />)
    .exhaustive();
};
