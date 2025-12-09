import fs from 'node:fs/promises';
import path from 'node:path';
import { type ModelSpec, ModelSpecSchema } from '../../model-spec';
import { type OpenAiModelId, OpenAiModelIdSchema } from '../openai-models';

const MODELS_API_URL = 'https://models.dev/api.json';
const OUTPUT_FILENAME = 'openai-model-spec.json';

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

  const json = JSON.stringify(modelSpec, null, 2);

  // 5. write model spec to json file
  await fs.writeFile(outputPath, json, 'utf-8');
}

generateOpenAiModelSpec()
  .then(() => {
    console.log('OpenAI models JSON generated successfully');
  })
  .catch(error => {
    console.error('Error generating OpenAI model spec:', error);
  });
