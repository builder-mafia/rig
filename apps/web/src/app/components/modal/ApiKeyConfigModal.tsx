import { Google, OpenAI } from '@lobehub/icons';
import { Loader2, Plus } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { validateApiKey } from '@/core/ai/validate-apikey';
import { DB } from '@/idb/db';

export const ApiKeyConfigModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isOpenaiApiKeyValid, setIsOpenaiApiKeyValid] = useState(false);
  const [isOpenaiApiKeyLoading, setIsOpenaiApiKeyLoading] = useState(true);
  const [isOpenaiApiKeyFailed, setIsOpenaiApiKeyFailed] = useState(false);

  const [googleApiKey, setGoogleApiKey] = useState('');
  const [isGoogleApiKeyValid, setIsGoogleApiKeyValid] = useState(false);
  const [isGoogleApiKeyLoading, setIsGoogleApiKeyLoading] = useState(true);
  const [isGoogleApiKeyFailed, setIsGoogleApiKeyFailed] = useState(false);

  const resetState = () => {
    setIsOpenaiApiKeyValid(false);
    setIsOpenaiApiKeyFailed(false);
    setIsOpenaiApiKeyLoading(true);
    setIsGoogleApiKeyValid(false);
    setIsGoogleApiKeyFailed(false);
    setIsGoogleApiKeyLoading(true);
  };

  useLayoutEffect(() => {
    if (open) {
      resetState();

      const getApiKeys = async () => {
        const { googleApiKey, openaiApiKey } = await DB.getConfig();
        setGoogleApiKey(googleApiKey ?? '');
        setOpenaiApiKey(openaiApiKey ?? '');

        if (googleApiKey) {
          const isValid = await validateApiKey({
            apiKey: googleApiKey,
            provider: 'google',
          });
          setIsGoogleApiKeyValid(isValid);
        }

        if (openaiApiKey) {
          const isValid = await validateApiKey({
            apiKey: openaiApiKey,
            provider: 'openai',
          });
          setIsOpenaiApiKeyValid(isValid);
        }

        setIsOpenaiApiKeyLoading(false);
        setIsGoogleApiKeyLoading(false);
      };

      getApiKeys();
    }
  }, [open]);

  const handleValidateAndSaveOpenAI = async () => {
    setIsOpenaiApiKeyLoading(true);
    setIsOpenaiApiKeyValid(false);

    const isValid = await validateApiKey({
      apiKey: openaiApiKey,
      provider: 'openai',
    });
    if (isValid) {
      await DB.updateApiKey('openai', openaiApiKey);
      setIsOpenaiApiKeyValid(true);
      toast.success('OpenAI API Key has been saved.', {
        position: 'top-center',
        duration: 2000,
      });
    } else {
      setIsOpenaiApiKeyFailed(true);
    }

    setIsOpenaiApiKeyLoading(false);
  };

  const handleValidateAndSaveGoogle = async () => {
    setIsGoogleApiKeyLoading(true);
    setIsGoogleApiKeyValid(false);

    const isValid = await validateApiKey({
      apiKey: googleApiKey,
      provider: 'google',
    });
    if (isValid) {
      await DB.updateApiKey('google', googleApiKey);
      setIsGoogleApiKeyValid(true);
      toast.success('Google API Key has been saved.', {
        position: 'top-center',
        duration: 2000,
      });
    } else {
      setIsGoogleApiKeyFailed(true);
    }

    setIsGoogleApiKeyLoading(false);
  };

  const onChangeOpenaiApiKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpenaiApiKeyValid(false);
    setIsOpenaiApiKeyFailed(false);

    setOpenaiApiKey(e.target.value);
  };

  const onChangeGoogleApiKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsGoogleApiKeyValid(false);
    setIsGoogleApiKeyFailed(false);

    setGoogleApiKey(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='dark p-0 m-0 border-none outline-0'
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <DialogDescription className='sr-only'>
          LLM Api Key Configuration
        </DialogDescription>
        <DialogTitle className='sr-only'>LLM Api Key Configuration</DialogTitle>
        <Card className='w-full'>
          <CardHeader>
            <CardTitle>My API Key</CardTitle>
            <CardDescription className='text-xs mt-1'>
              <em className='font-bold text-blue-400'>100% Safe.</em> API keys
              are saved in local storage.
            </CardDescription>
          </CardHeader>
          <CardContent className='mt-2'>
            <div className='grid gap-6'>
              <div className='flex flex-col gap-2'>
                <div className='flex flex-row gap-2'>
                  <Label htmlFor='openai-api-key'>
                    <OpenAI />
                    OpenAI
                  </Label>
                  {isOpenaiApiKeyLoading && (
                    <span className='text-yellow-500 text-xs'>
                      Validating OpenAI API Key...
                    </span>
                  )}
                  {!isOpenaiApiKeyLoading && isOpenaiApiKeyValid && (
                    <span className='text-green-500 text-xs'>
                      OpenAI API Key is valid.
                    </span>
                  )}
                  {!isOpenaiApiKeyLoading && isOpenaiApiKeyFailed && (
                    <span className='text-red-500 text-xs'>
                      OpenAI API Key is invalid.
                    </span>
                  )}
                </div>
                <div className='flex gap-1'>
                  <PasswordInput
                    id='openai-api-key'
                    placeholder=''
                    value={openaiApiKey}
                    onChange={onChangeOpenaiApiKey}
                    showPassword={false}
                    autoFocus={false}
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={handleValidateAndSaveOpenAI}
                    disabled={isOpenaiApiKeyLoading}
                  >
                    {isOpenaiApiKeyLoading ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <Plus />
                    )}
                  </Button>
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <div className='flex flex-row gap-2'>
                  <Label htmlFor='google-api-key'>
                    <Google />
                    Google
                  </Label>
                  {isGoogleApiKeyLoading && (
                    <span className='text-yellow-500 text-xs'>
                      Validating Google API Key...
                    </span>
                  )}
                  {!isGoogleApiKeyLoading && isGoogleApiKeyValid && (
                    <span className='text-green-500 text-xs'>
                      Google API Key is valid.
                    </span>
                  )}
                  {!isGoogleApiKeyLoading && isGoogleApiKeyFailed && (
                    <span className='text-red-500 text-xs'>
                      Google API Key is invalid.
                    </span>
                  )}
                </div>
                <div className='flex gap-1'>
                  <PasswordInput
                    id='google-api-key'
                    placeholder=''
                    value={googleApiKey}
                    onChange={onChangeGoogleApiKey}
                    showPassword={false}
                    autoFocus={false}
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={handleValidateAndSaveGoogle}
                    disabled={isGoogleApiKeyLoading}
                  >
                    {isGoogleApiKeyLoading ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <Plus />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>{/* <Button></Button> */}</CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
