import { Google, OpenAI } from '@lobehub/icons';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { validateApiKey } from '@/core/ai/validate-apikey';
import type { LLMProvider } from '@/core/chat/ai-model';
import { DB } from '../../../idb/db';

/**
 * This modal should be shown when the user does not have any API key.
 *
 * If user enter site, and does not have any API key,
 * this modal should be shown to user to enter API key.
 */
export const ApiKeyFormModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [isLoading, setIsLoading] = useState(false);

  const handleValidateAndSave = async () => {
    setIsLoading(true);

    const isValid = await validateApiKey({ apiKey, provider });

    if (isValid) {
      await DB.updateApiKey(provider, apiKey);
      toast.success('API key has been saved.', {
        position: 'top-center',
        duration: 2500,
      });
      onOpenChange(false);
    } else {
      toast.error('Invalid API key. Please check your key and try again.', {
        position: 'top-center',
        duration: 5000,
      });
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='dark p-0 m-0 border-none outline-0'>
        <DialogTitle className='sr-only'>AI API Key Form</DialogTitle>
        <Card className='w-full'>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
            <CardDescription>
              Please enter your API key to use the service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='provider'>Service Provider</Label>
                <Select
                  value={provider}
                  onValueChange={value => setProvider(value as LLMProvider)}
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
