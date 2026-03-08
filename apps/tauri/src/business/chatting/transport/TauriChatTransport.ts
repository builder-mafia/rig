import type { ProviderId } from '@allin/ai';
import { Channel, invoke } from '@tauri-apps/api/core';
import type {
  ChatTransport,
  ProviderMetadata,
  UIMessage,
  UIMessageChunk,
} from 'ai';
import { v4 } from 'uuid';

// Rust aisdk crate serializes with kebab-case type tags + snake_case fields.
// AI SDK v6 expects camelCase fields and tool-input-* instead of tool-call-*.
type RustProviderMetadata = Record<string, Record<string, unknown>>;

type RustVercelUIStream =
  | {
      type: 'text-start';
      id: string;
      provider_metadata?: RustProviderMetadata;
    }
  | {
      type: 'text-delta';
      id: string;
      delta: string;
      provider_metadata?: RustProviderMetadata;
    }
  | {
      type: 'text-end';
      id: string;
      provider_metadata?: RustProviderMetadata;
    }
  | {
      type: 'reasoning-start';
      id: string;
      provider_metadata?: RustProviderMetadata;
    }
  | {
      type: 'reasoning-delta';
      id: string;
      delta: string;
      provider_metadata?: RustProviderMetadata;
    }
  | {
      type: 'reasoning-end';
      id: string;
      provider_metadata?: RustProviderMetadata;
    }
  | {
      type: 'tool-call-start';
      id: string;
      tool_call_id: string;
      tool_name: string;
      provider_metadata?: RustProviderMetadata;
    }
  | {
      type: 'tool-call-delta';
      id: string;
      tool_call_id: string;
      delta: string;
      provider_metadata?: RustProviderMetadata;
    }
  | {
      type: 'tool-call-end';
      id: string;
      tool_call_id: string;
      result: unknown;
      provider_metadata?: RustProviderMetadata;
    }
  | { type: 'error'; error_text: string }
  | { type: 'not-supported'; error_text: string };

/**
 * Converts Rust aisdk VercelUIStream events to Vercel AI SDK v6 UIMessageChunk.
 *
 * Schema mismatch between Rust and TypeScript:
 * | Rust aisdk (JSON)       | AI SDK v6 (expected)   |
 * |-------------------------|------------------------|
 * | tool-call-start         | tool-input-start       |
 * | tool-call-delta         | tool-input-delta       |
 * | tool-call-end           | tool-input-available   |
 * | tool_call_id            | toolCallId             |
 * | tool_name               | toolName               |
 * | delta (for tool)        | inputTextDelta         |
 * | error_text              | errorText              |
 * | provider_metadata       | providerMetadata       |
 *
 * Without this conversion, the AI SDK Chat class cannot track tool call state
 * and message.parts array won't be built correctly.
 */
function toUIMessageChunk(event: RustVercelUIStream): UIMessageChunk | null {
  const metadata = (
    'provider_metadata' in event ? event.provider_metadata : undefined
  ) as ProviderMetadata | undefined;

  switch (event.type) {
    case 'text-start':
      return { type: 'text-start', id: event.id, providerMetadata: metadata };
    case 'text-delta':
      return {
        type: 'text-delta',
        id: event.id,
        delta: event.delta,
        providerMetadata: metadata,
      };
    case 'text-end':
      return { type: 'text-end', id: event.id, providerMetadata: metadata };
    case 'reasoning-start':
      return {
        type: 'reasoning-start',
        id: event.id,
        providerMetadata: metadata,
      };
    case 'reasoning-delta':
      return {
        type: 'reasoning-delta',
        id: event.id,
        delta: event.delta,
        providerMetadata: metadata,
      };
    case 'reasoning-end':
      return {
        type: 'reasoning-end',
        id: event.id,
        providerMetadata: metadata,
      };
    case 'tool-call-start':
      return {
        type: 'tool-input-start',
        toolCallId: event.tool_call_id,
        toolName: event.tool_name,
      };
    case 'tool-call-delta':
      return {
        type: 'tool-input-delta',
        toolCallId: event.tool_call_id,
        inputTextDelta: event.delta,
      };
    case 'tool-call-end': {
      const input =
        typeof event.result === 'string'
          ? safeParseJson(event.result)
          : event.result;
      return {
        type: 'tool-input-available',
        toolCallId: event.tool_call_id,
        toolName: '',
        input,
      };
    }
    case 'error':
      return { type: 'error', errorText: event.error_text };
    case 'not-supported':
      return null;
  }
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

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
  private providerName: ProviderId;
  private modelId: string;

  constructor({
    providerName,
    modelId,
  }: {
    providerName: ProviderId;
    modelId: string;
  }) {
    this.providerName = providerName;
    this.modelId = modelId;
  }

  public getModelId() {
    return this.modelId;
  }

  public getProviderName() {
    return this.providerName;
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

    const onEvent = new Channel<RustVercelUIStream>();

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

          const chunk = toUIMessageChunk(event);
          if (chunk) {
            if (chunk.type === 'error') {
              console.log(chunk);
              controller.error(new Error(chunk.errorText));
              return;
            }
            controller.enqueue(chunk);
          }
        };

        invoke('stream_text', {
          messages: messagesForRust,
          providerName: this.providerName,
          modelId: this.modelId,
          requestId,
          onEvent,
        })
          .then(() => controller.close())
          .catch(error => {
            controller.error(error);
          });
      },
    });

    return readableStream;
  };
  reconnectToStream: ChatTransport<UIMessage>['reconnectToStream'] = async () =>
    null;
}
