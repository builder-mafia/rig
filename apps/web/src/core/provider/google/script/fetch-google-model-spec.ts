import fs from 'node:fs/promises';
import path from 'node:path';
import { type ModelSpec, ModelSpecSchema } from '../../model-spec';
import { type GoogleAiModelId, GoogleAiModelIdSchema } from '../google-models';

const MODELS_API_URL = 'https://models.dev/api.json';
const OUTPUT_FILENAME = 'google-model-spec.ts';

type ModelsApiResponse = {
  google: {
    models: Record<string, ModelSpec>;
  };
};

async function generateGoogleModelSpec(): Promise<void> {
  // 1. fetch models JSON from https://models.dev/api.json
  const response = await fetch(MODELS_API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch models JSON: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as ModelsApiResponse;
  // 2. get openai models from models JSON
  const googleModels = data.google;

  if (googleModels === undefined) {
    throw new Error('No "openai" key found in models API response.');
  }

  // 3. filter models by GoogleAiModelIdSchema
  const targetModels = Object.values(googleModels.models).filter(model => {
    return GoogleAiModelIdSchema.safeParse(model.id).success;
  });

  // check if targetModels fit to schema
  targetModels.forEach(model => ModelSpecSchema.parse(model));

  const generatedDir = path.join(__dirname, '../generated');
  await fs.mkdir(generatedDir, { recursive: true });
  const outputPath = path.join(generatedDir, OUTPUT_FILENAME);

  // 4. convert model spec array to record with OpenAiModelId as key
  const modelSpec = targetModels.reduce(
    (acc, curr) => {
      acc[curr.id as GoogleAiModelId] = curr;
      return acc;
    },
    {} as Record<GoogleAiModelId, ModelSpec>,
  );

  const ts = `
  import type { ModelSpec } from '../../model-spec';
  import type { GoogleAiModelId } from '../google-models';

  export const googleModelSpec = ${JSON.stringify(modelSpec, null, 2)} as const satisfies Record<GoogleAiModelId, ModelSpec>;`;

  // 5. write model spec to ts file
  await fs.writeFile(outputPath, ts, 'utf-8');
}

generateGoogleModelSpec()
  .then(() => {
    console.log('Google models JSON generated successfully');
  })
  .catch(error => {
    console.error('Error generating Google models JSON:', error);
  });
