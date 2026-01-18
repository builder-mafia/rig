import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ModelSpec, ModelSpecSchema } from '../../model-spec';
import { type OpenAiModelId, OpenAiModelIdSchema } from '../openai-models';

const MODELS_API_URL = 'https://models.dev/api.json';
const OUTPUT_FILENAME = 'openai-model-spec.ts';

// ESM doesn't provide __dirname/__filename; derive them from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ModelsApiResponse = {
  openai: {
    models: Record<string, ModelSpec>;
  };
};

async function generateOpenAiModelSpec(): Promise<void> {
  // 1. fetch models JSON from https://models.dev/api.json
  const response = await fetch(MODELS_API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch models JSON: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as ModelsApiResponse;
  // 2. get openai models from models JSON
  const openaiModels = data.openai;

  if (openaiModels === undefined) {
    throw new Error('No "openai" key found in models API response.');
  }

  // 3. filter models by OpenAiModelIdSchema
  const targetModels = Object.values(openaiModels.models).filter(model => {
    return OpenAiModelIdSchema.safeParse(model.id).success;
  });

  // check if targetModels fit to schema
  targetModels.forEach(model => ModelSpecSchema.parse(model));

  const generatedDir = path.join(__dirname, '../generated');
  await fs.mkdir(generatedDir, { recursive: true });
  const outputPath = path.join(generatedDir, OUTPUT_FILENAME);

  // 4. convert model spec array to record with OpenAiModelId as key
  const modelSpec = targetModels.reduce(
    (acc, curr) => {
      acc[curr.id as OpenAiModelId] = curr;
      return acc;
    },
    {} as Record<OpenAiModelId, ModelSpec>,
  );

  const ts = `
  import type { ModelSpec } from '../../model-spec';
  import type { OpenAiModelId } from '../openai-models';

  export const openaiModelSpec = ${JSON.stringify(modelSpec, null, 2)} as const satisfies Record<OpenAiModelId, ModelSpec>;`;

  // 5. write model spec to ts file
  await fs.writeFile(outputPath, ts, 'utf-8');
}

generateOpenAiModelSpec()
  .then(() => {
    console.log('OpenAI models JSON generated successfully');
  })
  .catch(error => {
    console.error('Error generating OpenAI model spec:', error);
  });
