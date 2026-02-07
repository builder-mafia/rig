import type { ProviderId } from '@allin/ai';
import { Anthropic, Google, OpenAI } from '@lobehub/icons';
import { match } from 'ts-pattern';

export const getProviderIcon = (
  providerName: ProviderId,
  className: string,
) => {
  return match(providerName)
    .with('openai', () => <OpenAI className={className} />)
    .with('google', () => <Google className={className} />)
    .with('anthropic', () => <Anthropic className={className} />)
    .exhaustive();
};
