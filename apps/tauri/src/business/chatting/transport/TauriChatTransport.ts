import type { ProviderId } from '@allin/ai';
import { Channel, invoke } from '@tauri-apps/api/core';
import type {
  ChatTransport,
  ProviderMetadata,
  UIMessage,
  UIMessageChunk,
} from 'ai';
import { v4 } from 'uuid';

// Older Rust aisdk serializes snake_case fields. The local fork emits AI SDK v6
// camelCase chunks. Keep both shapes accepted while the fork is in use.
type RustProviderMetadata = Record<string, Record<string, unknown>>;
type RustMaybeProviderMetadata = {
  provider_metadata?: RustProviderMetadata;
  providerMetadata?: RustProviderMetadata;
};

type RustVercelUIStream =
  | ({
      type: 'text-start';
      id: string;
    } & RustMaybeProviderMetadata)
  | ({
      type: 'text-delta';
      id: string;
      delta: string;
    } & RustMaybeProviderMetadata)
  | ({
      type: 'text-end';
      id: string;
    } & RustMaybeProviderMetadata)
  | ({
      type: 'reasoning-start';
      id: string;
    } & RustMaybeProviderMetadata)
  | ({
      type: 'reasoning-delta';
      id: string;
      delta: string;
    } & RustMaybeProviderMetadata)
  | ({
      type: 'reasoning-end';
      id: string;
    } & RustMaybeProviderMetadata)
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
  | ({
      type: 'tool-input-start';
      toolCallId: string;
      toolName: string;
      providerExecuted?: boolean;
      dynamic?: boolean;
      title?: string;
    } & RustMaybeProviderMetadata)
  | {
      type: 'tool-input-delta';
      toolCallId: string;
      inputTextDelta: string;
    }
  | ({
      type: 'tool-input-available';
      toolCallId: string;
      toolName: string;
      input: unknown;
      providerExecuted?: boolean;
      dynamic?: boolean;
      title?: string;
    } & RustMaybeProviderMetadata)
  | ({
      type: 'tool-input-error';
      toolCallId: string;
      toolName: string;
      input: unknown;
      providerExecuted?: boolean;
      dynamic?: boolean;
      errorText: string;
      title?: string;
    } & RustMaybeProviderMetadata)
  | {
      type: 'tool-output-available';
      toolCallId: string;
      output: unknown;
      providerExecuted?: boolean;
      dynamic?: boolean;
      preliminary?: boolean;
    }
  | {
      type: 'tool-output-error';
      toolCallId: string;
      errorText: string;
      providerExecuted?: boolean;
      dynamic?: boolean;
    }
  | { type: 'error'; error_text?: string; errorText?: string }
  | { type: 'not-supported'; error_text?: string; errorText?: string };

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
  const metadata = getProviderMetadata(event);

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
    case 'tool-input-start':
      return {
        type: 'tool-input-start',
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        providerExecuted: event.providerExecuted,
        dynamic: event.dynamic,
        title: event.title,
      };
    case 'tool-input-delta':
      return {
        type: 'tool-input-delta',
        toolCallId: event.toolCallId,
        inputTextDelta: event.inputTextDelta,
      };
    case 'tool-input-available':
      return {
        type: 'tool-input-available',
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        input: event.input,
        providerExecuted: event.providerExecuted,
        providerMetadata: metadata,
        dynamic: event.dynamic,
        title: event.title,
      };
    case 'tool-input-error':
      return {
        type: 'tool-input-error',
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        input: event.input,
        providerExecuted: event.providerExecuted,
        providerMetadata: metadata,
        dynamic: event.dynamic,
        errorText: event.errorText,
        title: event.title,
      };
    case 'tool-output-available':
      return {
        type: 'tool-output-available',
        toolCallId: event.toolCallId,
        output: event.output,
        providerExecuted: event.providerExecuted,
        dynamic: event.dynamic,
        preliminary: event.preliminary,
      };
    case 'tool-output-error':
      return {
        type: 'tool-output-error',
        toolCallId: event.toolCallId,
        errorText: event.errorText,
        providerExecuted: event.providerExecuted,
        dynamic: event.dynamic,
      };
    case 'error':
      return {
        type: 'error',
        errorText: event.errorText ?? event.error_text ?? 'Unknown error',
      };
    case 'not-supported':
      return null;
  }
}

function getProviderMetadata(event: RustVercelUIStream): ProviderMetadata | undefined {
  if ('providerMetadata' in event && event.providerMetadata) {
    return event.providerMetadata as ProviderMetadata;
  }

  if ('provider_metadata' in event && event.provider_metadata) {
    return event.provider_metadata as ProviderMetadata;
  }

  return undefined;
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
