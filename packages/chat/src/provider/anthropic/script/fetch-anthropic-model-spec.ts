import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ModelSpec, ModelSpecSchema } from '../../model-spec';
import {
  type AnthropicModelId,
  AnthropicModelIdSchema,
} from '../anthropic-models';

const MODELS_API_URL = 'https://models.dev/api.json';
const OUTPUT_FILENAME = 'anthropic-model-spec.ts';

type ModelsApiResponse = {
  anthropic: {
    models: Record<string, ModelSpec>;
  };
};

// ESM doesn't provide __dirname/__filename; derive them from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateAnthropicModelSpec(): Promise<void> {
  // 1. fetch models JSON from https://models.dev/api.json
  const response = await fetch(MODELS_API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch models JSON: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as ModelsApiResponse;
  // 2. get anthropic models from models JSON
  const anthropicModels = data.anthropic;

  if (anthropicModels === undefined) {
    throw new Error('No "anthropic" key found in models API response.');
  }

  // 3. filter models by AnthropicModelIdSchema
  const targetModels = Object.values(anthropicModels.models).filter(model => {
    return AnthropicModelIdSchema.safeParse(model.id).success;
  });

  // check if targetModels fit to schema
  targetModels.forEach(model => ModelSpecSchema.parse(model));

  const generatedDir = path.join(__dirname, '../generated');
  await fs.mkdir(generatedDir, { recursive: true }, err => {
    if (err) {
      throw new Error(`Failed to create directory: ${err.message}`);
    }
  });
  const outputPath = path.join(generatedDir, OUTPUT_FILENAME);

  // 4. convert model spec array to record with AnthropicModelId as key
  const modelSpec = targetModels.reduce(
    (acc, curr) => {
      acc[curr.id as AnthropicModelId] = curr;
      return acc;
    },
    {} as Record<AnthropicModelId, ModelSpec>,
  );

  const ts = `
import type { ModelSpec } from '../../model-spec';
import type { AnthropicModelId } from '../anthropic-models';

export const anthropicModelSpec = ${JSON.stringify(modelSpec, null, 2)} as const satisfies Record<AnthropicModelId, ModelSpec>;`;

  // 5. write model spec to ts file
  await fs.writeFile(outputPath, ts, 'utf-8', err => {
    if (err) {
      throw new Error(`Failed to write file: ${err.message}`);
    }
  });
}

generateAnthropicModelSpec()
  .then(() => {
    console.log('Anthropic models JSON generated successfully');
  })
  .catch(error => {
    console.error('Error generating Anthropic models JSON:', error);
  });
