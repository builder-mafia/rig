import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnthropicModelIdSchema } from '../anthropic/anthropic-models';
import { GoogleAiModelIdSchema } from '../google/google-models';
import { OpenAiModelIdSchema } from '../openai/openai-models';
import { VercelModelIdSchema } from '../vercel/vercel-models';
import {
  fetchModelsApi,
  generateModelSpec,
  type ProviderModelSpecConfig,
} from './generate-model-spec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const providerBaseDir = path.join(__dirname, '..');

const configs: ProviderModelSpecConfig[] = [
  {
    providerKey: 'google',
    modelIdSchema: GoogleAiModelIdSchema,
    providerDir: path.join(providerBaseDir, 'google'),
    outputFilename: 'google-model-spec.ts',
    variableName: 'googleModelSpec',
    modelIdTypeName: 'GoogleAiModelId',
    modelIdModule: 'google-models',
  },
  {
    providerKey: 'openai',
    modelIdSchema: OpenAiModelIdSchema,
    providerDir: path.join(providerBaseDir, 'openai'),
    outputFilename: 'openai-model-spec.ts',
    variableName: 'openaiModelSpec',
    modelIdTypeName: 'OpenAiModelId',
    modelIdModule: 'openai-models',
  },
  {
    providerKey: 'anthropic',
    modelIdSchema: AnthropicModelIdSchema,
    providerDir: path.join(providerBaseDir, 'anthropic'),
    outputFilename: 'anthropic-model-spec.ts',
    variableName: 'anthropicModelSpec',
    modelIdTypeName: 'AnthropicModelId',
    modelIdModule: 'anthropic-models',
  },
  {
    providerKey: 'vercel',
    modelIdSchema: VercelModelIdSchema,
    providerDir: path.join(providerBaseDir, 'vercel'),
    outputFilename: 'vercel-model-spec.ts',
    variableName: 'vercelModelSpec',
    modelIdTypeName: 'VercelModelId',
    modelIdModule: 'vercel-models',
  },
];

const main = async () => {
  const apiData = await fetchModelsApi();
  await Promise.all(configs.map(config => generateModelSpec(apiData, config)));
  console.log('All model specs generated successfully.');
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
