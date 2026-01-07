import type { LanguageModelV3 } from '@ai-sdk/provider';
import { generateText, type ModelMessage, Output } from 'ai';
import type { z } from 'zod/v3';

export namespace Agent {
  export async function generate<T>({
    system,
    description,
    model,
    schema,
  }: {
    system?: string[];
    description: string;
    model: LanguageModelV3;
    schema?: z.ZodSchema<T>;
  }) {
    const outputSchema = schema ? Output.object({ schema }) : undefined;

    const { output } = await generateText({
      temperature: 0.3,
      model: model,
      messages: [
        ...(system ?? []).map(
          (item): ModelMessage => ({
            role: 'system',
            content: item,
          }),
        ),
        {
          role: 'user',
          content: `${description}. ${outputSchema ? 'Return ONLY the JSON object, no other text, do not wrap in backticks' : ''}`,
        },
      ],
      output: outputSchema,
    });

    return output;
  }
}
