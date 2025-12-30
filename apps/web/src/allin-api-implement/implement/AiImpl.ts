import type { AI } from '@allin/api';

export const AIImpl: AI = {
  ask: async (prompt, options) => {
    return {
      content: '',
      model: '',
      usage: undefined,
    };
  },
};
