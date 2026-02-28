import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type CodexAuthStatus, codexAuthGateway } from './codexAuthGateway';

const codexAuthKeys = {
  status: ['codexAuth', 'status'] as const,
};

export const useCodexAuth = () => {
  const queryClient = useQueryClient();

  const { data: authStatus } = useQuery({
    queryKey: codexAuthKeys.status,
    queryFn: () => codexAuthGateway.getStatus(),
  });

  const startOAuth = useMutation({
    mutationFn: () => codexAuthGateway.startOAuth(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: codexAuthKeys.status }),
  });

  const revoke = useMutation({
    mutationFn: () => codexAuthGateway.revoke(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: codexAuthKeys.status }),
  });

  const isConnected = authStatus?.status === 'connected';

  return {
    authStatus,
    isConnected,
    startOAuth,
    revoke,
  };
};
