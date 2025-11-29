import { Google, OpenAI } from '@lobehub/icons';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { toast } from 'sonner';
import { v4 } from 'uuid';
import type z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LLMProviderName } from '@/core/provider/all-models';
import { validateApiKey } from '@/core/provider/validate-apikey';
import { dbAtoms } from '@/idb/dbStore';
import { DB } from '../../../idb/db';

/**
 * This modal should be shown when the user does not have any API key.
 */
export const ApiKeyFormModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [apiKey, setApiKey] = useState('');
  const [providerName, setProviderName] = useState<LLMProviderName>('openai');
  const [isLoading, setIsLoading] = useState(false);
  const setConfig = useSetAtom(dbAtoms.configAtom);

  const handleValidateAndSave = async () => {
    setIsLoading(true);

    const isValid = await validateApiKey({ apiKey, providerName });

    if (!isValid) {
      toast.error('Invalid API key. Please check your key and try again.', {
        position: 'top-center',
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    const channelId = v4();
    const createdAt = Date.now();
    const defaultModel =
      providerName === 'openai' ? 'gpt-5.1' : 'gemini-2.5-flash';

    await DB.createChannel({
      id: channelId,
      model: defaultModel,
      providerName: providerName,
      createdAt: createdAt,
      isEmpty: true,
    });

    await setConfig({
      lastSelectedChannelId: channelId,
      [providerName === 'openai' ? 'openaiApiKey' : 'googleApiKey']: apiKey,
    });

    toast.success('Enjoy your AI journey! 🎉🎉🎉', {
      position: 'top-center',
      duration: 3000,
    });

    onOpenChange(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='dark m-0 border-none outline-0 md:max-w-2xl p-0'
        showCloseButton={false}
      >
        <DialogTitle className='sr-only'>AI API Key Form</DialogTitle>
        <Card className='w-full'>
          <CardHeader>
            <CardTitle className='flex flex-row gap-2 items-center'>
              Enter your API key
              <em className='font-bold text-blue-400 text-xs'>100% Safe</em>
            </CardTitle>
            <CardDescription className='text-sm mt-1'>
              Before you can use the service, you need to enter your API key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='provider'>Service Provider</Label>
                <Select
                  value={providerName}
                  onValueChange={value =>
                    setProviderName(value as LLMProviderName)
                  }
                >
                  <SelectTrigger id='provider'>
                    <SelectValue placeholder='Select a provider' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='openai'>
                      <OpenAI className='size-4' /> OpenAI
                    </SelectItem>
                    <SelectItem value='google'>
                      <Google className='size-4' /> Google
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='api-key'>API Key</Label>
                <PasswordInput
                  id='api-key'
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder=''
                />
                <CardDescription className='text-xs mt-1'>
                  {`Your API key is stored in your browser's local storage.`}
                </CardDescription>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={!apiKey || isLoading}
              className='w-full'
              onClick={handleValidateAndSave}
            >
              {isLoading ? 'Validating...' : 'Save API Key'}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
