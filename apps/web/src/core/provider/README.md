# Adding a New LLM Provider

## Steps

### 1. Create Provider Class
Create `{Provider}LLMProvider.ts` implementing `LLMProvider` interface

### 2. Update `all-models.ts`
- Add provider name to `LLMProviderNameSchema`
- Add model schema to `AllModelIdsSchema` spread
- Add entry to `MODEL_IDS_PER_PROVIDER`

### 3. Update `validate-apikey.ts`
Add new provider to `validateApiKey` function

### 4. Update `db.ts` 

Add new api key field to ConfigSchema.

### 5. Update `registerProvider.ts`

### 6. Update `ApiKeyConfigModal.tsx` and `ApiKeyFormModal.tsx`
