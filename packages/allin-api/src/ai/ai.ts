import type { z } from 'zod/v3';

export interface AI {
  ask<T = any>(
    prompt: string,
    options?: AIAskOptions<T>,
  ): Promise<AIResponse<T>>;
}

export interface AIAskOptions<T> {
  systemPrompt?: string;
  schema?: z.ZodSchema<T>;
}

export interface AIResponse<T> {
  content: string;
  error?: Error;
  object?: T;
}
