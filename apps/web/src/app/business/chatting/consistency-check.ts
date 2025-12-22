import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { UIMessage } from 'ai';

export const isMessagesConsistent = (
  messages: UIMessage<UIMessageMetadata>[],
) => {
  let valid = true;
  let prevRole: 'user' | 'assistant' | undefined;

  for (const message of messages) {
    if (message.role === 'assistant' || message.role === 'user') {
      if (prevRole === message.role) {
        valid = false;
        break;
      }
      prevRole = message.role;
    }
  }

  return valid;
};
