import type { AI } from '@allin/context';

export const AIImpl: AI = {
  ask: async (prompt, options) => {
    return {
      content: '',
      model: '',
      usage: undefined,
    };
  },
};
