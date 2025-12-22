import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { UIMessage } from 'ai';

export const handleExceptionOnOpenAi = (
  message: UIMessage<UIMessageMetadata>,
) => {
  // remove reasoning part if openai request is aborted
  // issue: https://github.com/vercel/ai/issues/8811
  // "Item with id ... not found" error happens when the reasoning part is not removed.
  for (const part of message.parts) {
    if (
      (part.type === 'reasoning' || part.type === 'text') &&
      part.providerMetadata?.openai
    ) {
      part.providerMetadata = undefined;
    }
  }

  return message;
};
