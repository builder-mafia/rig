import fs from 'node:fs/promises';
import path from 'node:path';
import type { z } from 'zod/v3';
import { type ModelSpec, ModelSpecSchema } from '../model-spec';

const MODELS_API_URL = 'https://models.dev/api.json';

type ModelsApiResponse = Record<string, { models: Record<string, ModelSpec> }>;

export type ProviderModelSpecConfig = {
  /** Key in models.dev API response (e.g. 'google', 'openai', 'anthropic') */
  providerKey: string;
  /** Zod schema defining valid model IDs */
  modelIdSchema: z.ZodEnum<[string, ...string[]]>;
  /** Absolute path to provider directory (e.g. .../provider/google) */
  providerDir: string;
  /** Output filename (e.g. 'google-model-spec.ts') */
  outputFilename: string;
  /** Variable name for the exported const (e.g. 'googleModelSpec') */
  variableName: string;
  /** TypeScript type name for model ID (e.g. 'GoogleAiModelId') */
  modelIdTypeName: string;
  /** Module name for model ID import, without extension (e.g. 'google-models') */
  modelIdModule: string;
};

export const fetchModelsApi = async (): Promise<ModelsApiResponse> => {
  const response = await fetch(MODELS_API_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch models API: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as ModelsApiResponse;
};

export const generateModelSpec = async (
  apiData: ModelsApiResponse,
  config: ProviderModelSpecConfig,
): Promise<void> => {
  const providerData = apiData[config.providerKey];
  if (!providerData) {
    throw new Error(
      `No "${config.providerKey}" key found in models API response.`,
    );
  }

  const expectedModelIds = config.modelIdSchema.options as string[];

  const targetModels = Object.values(providerData.models).filter(
    model => config.modelIdSchema.safeParse(model.id).success,
  );

  const parsedModels = targetModels.map(model => ModelSpecSchema.parse(model));

  const fetchedIds = new Set(parsedModels.map(m => m.id));
  const missingIds = expectedModelIds.filter(id => !fetchedIds.has(id));

  if (missingIds.length > 0) {
    throw new Error(
      `[${config.providerKey}] Failed to fetch model spec for: ${missingIds.join(', ')}\n` +
        `These models are defined in ${config.modelIdModule}.ts but not found in the API response.\n` +
        `Either add them to the API or remove them from the schema.`,
    );
  }

  const modelSpec = parsedModels.reduce(
    (acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    },
    {} as Record<string, ModelSpec>,
  );

  const outputDir = path.join(config.providerDir, 'generated');
  await fs.mkdir(outputDir, { recursive: true });

  const ts = `import type { ModelSpec } from '../../model-spec';
import type { ${config.modelIdTypeName} } from '../${config.modelIdModule}';

export const ${config.variableName} = ${JSON.stringify(modelSpec, null, 2)} as const satisfies Record<${config.modelIdTypeName}, ModelSpec>;
`;

  await fs.writeFile(path.join(outputDir, config.outputFilename), ts, 'utf-8');
  console.log(`[${config.providerKey}] Model spec generated successfully.`);
};
