import { useQuery } from '@tanstack/react-query';
import { appSettingGateway } from './appSettingGateway';

const systemFontKeys = {
  all: ['systemFonts'] as const,
};

export const useSystemFonts = () => {
  const { data: fonts = [], isLoading } = useQuery({
    queryKey: systemFontKeys.all,
    queryFn: () => appSettingGateway.getSystemFonts(),
    staleTime: Number.POSITIVE_INFINITY,
  });

  return { fonts, isLoading };
};
