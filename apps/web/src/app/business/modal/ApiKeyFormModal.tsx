import { zodResolver } from '@hookform/resolvers/zod';
import { sample } from 'es-toolkit';
import { useSetAtom } from 'jotai';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { v4 } from 'uuid';
import z from 'zod';
import { Button } from '@allin/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@allin/ui';
import { Dialog, DialogContent, DialogTitle } from '@allin/ui';
import { Label } from '@allin/ui';
import { PasswordInput } from '@allin/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@allin/ui';
import {
  type LLMProviderName,
  LLMProviderNameSchema,
  MODEL_IDS_PER_PROVIDER,
} from '@/core/provider/all-models';
import { validateApiKey } from '@/core/provider/validate-apikey';
import { dbAtoms } from '@/idb/db-store';
import { DB } from '../../../idb/db';
import { getLogoByProvider } from '../helper/get-logo-by-provider';

const FormValuesSchema = z.object({
  apiKey: z.string(),
  providerName: LLMProviderNameSchema,
});

type FormValuesType = z.infer<typeof FormValuesSchema>;

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
  const { register, handleSubmit, control, setError, formState } = useForm({
    resolver: zodResolver(FormValuesSchema),
    defaultValues: {
      providerName: 'openai',
    },
  });

  const setConfig = useSetAtom(dbAtoms.configAtom);
  const createChannel = useSetAtom(dbAtoms.createChannelAtom);

  const onSubmit = async (values: FormValuesType) => {
    const { apiKey, providerName } = values;

    const isValid = await validateApiKey({ apiKey, providerName });
    if (!isValid) {
      setError('apiKey', {
        message: 'Invalid API key. Please check your key and try again.',
      });
      return;
    }

    const channelId = await createChannel({
      id: v4(),
      model: sample(MODEL_IDS_PER_PROVIDER[providerName]),
      providerName: providerName,
      createdAt: Date.now(),
      isEmpty: true,
      updatedAt: Date.now(),
      reasoningEffort: 'low',
      reasoningSummary: false,
    });

    await setConfig({
      lastSelectedChannelId: channelId,
      apiKeys: {
        [providerName]: apiKey,
      },
    });

    toast.success('Enjoy your AI journey! 🎉🎉🎉', {
      position: 'top-center',
      duration: 3000,
    });

    onOpenChange(false);
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
              {"Just set your API key and you're good to go!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='providerName'>Service Provider</Label>
                <Controller
                  name='providerName'
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={value =>
                        field.onChange(value as LLMProviderName)
                      }
                    >
                      <SelectTrigger id='providerName'>
                        <SelectValue placeholder='Select a provider' />
                      </SelectTrigger>
                      <SelectContent>
                        {LLMProviderNameSchema.options.map(providerName => (
                          <SelectItem key={providerName} value={providerName}>
                            {getLogoByProvider(providerName, 'size-4')}
                            {` ${providerName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='apiKey'>API Key</Label>
                <PasswordInput
                  {...register('apiKey')}
                  id='apiKey'
                  placeholder=''
                />
                {formState.errors.apiKey && (
                  <span className='text-red-400 text-xs'>
                    {formState.errors.apiKey.message}
                  </span>
                )}
                <CardDescription className='text-xs mt-1'>
                  {`Your API key is stored in your browser's local storage.`}
                </CardDescription>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={formState.isSubmitting}
              className='w-full'
              onClick={handleSubmit(onSubmit)}
            >
              {formState.isSubmitting ? 'Validating...' : 'Save API Key'}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
