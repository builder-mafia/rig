import type { LLMProviderName } from '@allin/ai';
import { Channel, invoke } from '@tauri-apps/api/core';
import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';
import { v4 } from 'uuid';

/**
 * VercelUIStream from Rust backend (aisdk crate)
 * Matches the Rust VercelUIStream enum
 */
type VercelUIStream =
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; delta: string }
  | { type: 'text-end'; id: string }
  | { type: 'reasoning-start'; id: string }
  | { type: 'reasoning-delta'; id: string; delta: string }
  | { type: 'reasoning-end'; id: string }
  | {
      type: 'tool-call-start';
      id: string;
      tool_call_id: string;
      tool_name: string;
    }
  | { type: 'tool-call-delta'; id: string; tool_call_id: string; delta: string }
  | { type: 'tool-call-end'; id: string; tool_call_id: string; result: unknown }
  | { type: 'error'; error_text: string }
  | { type: 'not-supported'; error_text: string };

/**
 * Custom ChatTransport that uses Tauri IPC instead of HTTP fetch
 *
 * This transport allows useChat to communicate with the Rust backend
 * through Tauri's invoke/Channel system while maintaining compatibility
 * with the Vercel AI SDK's UIMessageChunk format.
 *
 * The Rust backend sends VercelUIStream events directly, and this transport
 * converts them to UIMessageChunk format for useChat consumption.
 */
export class TauriChatTransport implements ChatTransport<UIMessage> {
  private providerName: LLMProviderName;
  private modelId: string;

  constructor({
    providerName,
    modelId,
  }: {
    providerName: LLMProviderName;
    modelId: string;
  }) {
    this.providerName = providerName;
    this.modelId = modelId;
  }

  /**
   * Sends messages to the Tauri backend and returns a ReadableStream
   * that emits UIMessageChunk events compatible with useChat.
   */
  sendMessages: ChatTransport<UIMessage>['sendMessages'] = async options => {
    const { messages, abortSignal } = options;

    const requestId = v4();

    // Rust VercelUIMessage schema may not accept extra fields (eg. metadata).
    // Send only the minimal UIMessage shape.
    const messagesForRust = messages.map(m => ({
      id: m.id,
      role: m.role,
      parts: m.parts,
    }));

    const onEvent = new Channel<VercelUIStream>();

    const abortRustStream = () =>
      invoke('abort_stream', {
        requestId,
      }).catch(() => {
        // ignore
      });

    const readableStream = new ReadableStream<UIMessageChunk>({
      start: controller => {
        if (abortSignal) {
          abortSignal.addEventListener(
            'abort',
            () => {
              abortRustStream();
              controller.enqueue({ type: 'finish', finishReason: 'stop' });
              controller.close();
            },
            { once: true },
          );
        }

        onEvent.onmessage = event => {
          if (abortSignal?.aborted) {
            return;
          }

          if (event.type === 'not-supported') {
            console.warn('Feature not supported:', event.error_text);
            return;
          }

          if (event.type === 'error') {
            controller.error(new Error(event.error_text));
            controller.enqueue({ type: 'error', errorText: event.error_text });
            controller.error(new Error(event.error_text));
            return;
          }

          controller.enqueue(event as UIMessageChunk);
        };

        invoke('stream_text', {
          messages: messagesForRust,
          providerName: this.providerName,
          modelId: this.modelId,
          requestId,
          onEvent,
        })
          .then(() => controller.close())
          .catch(error => controller.error(error));
      },
    });

    return readableStream;
  };
  reconnectToStream: ChatTransport<UIMessage>['reconnectToStream'] = async () =>
    null;
}
