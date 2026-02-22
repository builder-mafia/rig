import { createMockTransport, type ProviderId } from '@allin/ai';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { ChatTransport, UIMessage } from 'ai';
import { TauriChatTransport } from './TauriChatTransport';

export const createMockTauriChatTransport = ({
  providerName,
  modelId,
  textDeltaChunks,
  chunkDelay,
}: {
  providerName: ProviderId;
  modelId: string;
  textDeltaChunks: (string | Error)[];
  chunkDelay?: number;
}) => {
  const transport = createMockTransport({
    textDeltaChunks,
    modelId,
    providerName,
    chunkDelay,
  });
  return new MockTauriChatTransport(providerName, modelId, transport);
};

export class MockTauriChatTransport extends TauriChatTransport {
  private transport: ChatTransport<UIMessage<UIMessageMetadata>>;
  constructor(
    providerName: ProviderId,
    modelId: string,
    transport: ChatTransport<UIMessage<UIMessageMetadata>>,
  ) {
    super({
      providerName,
      modelId,
    });
    this.transport = transport;
  }

  // @ts-expect-error - Override method
  public override sendMessages = async options => {
    return await this.transport.sendMessages(options);
  };
}
