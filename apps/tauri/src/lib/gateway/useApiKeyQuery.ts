import { PROVIDER_IDS, type ProviderId } from '@allin/ai';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeyGateway } from './apiKeyGateway';

const apiKeyKeys = {
  all: ['apiKey'] as const,
  has: (id: ProviderId) => ['apiKey', 'has', id] as const,
};

export const useHasApiKeys = () =>
  useQuery({
    queryKey: apiKeyKeys.all,
    queryFn: async () => {
      const entries = await Promise.all(
        PROVIDER_IDS.map(
          async id => [id, await apiKeyGateway.has(id)] as const,
        ),
      );
      return Object.fromEntries(entries) as Record<ProviderId, boolean>;
    },
  });

export const useSaveApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      providerName,
      apiKey,
    }: {
      providerName: ProviderId;
      apiKey: string;
    }) => apiKeyGateway.save(providerName, apiKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeyKeys.all }),
  });
};

export const useDeleteApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerName: ProviderId) =>
      apiKeyGateway.delete(providerName),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeyKeys.all }),
  });
};
