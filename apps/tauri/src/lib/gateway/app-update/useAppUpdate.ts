import { useMutation } from '@tanstack/react-query';
import { appUpdateGateway } from './appUpdateGateway';

export const useAppUpdate = () => {
  const checkForUpdate = useMutation({
    mutationFn: () => appUpdateGateway.fetch(),
  });

  const installUpdate = useMutation({
    mutationFn: () => appUpdateGateway.install(),
  });

  return {
    checkForUpdate,
    installUpdate,
  };
};
