import { generateUIMessage } from '@allin/ai';
import { useEffect } from 'react';
import type { ChatFacade } from '../facade';

export const useSystemMessage = (chatFacade: ChatFacade) => {
  useEffect(() => {
    chatFacade.addSystemMessage(
      generateUIMessage('system', 'You are a helpful assistant.'),
    );
  }, [chatFacade]);
};
