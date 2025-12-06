import { zodResolver } from '@hookform/resolvers/zod';
import { useSetAtom } from 'jotai';
import { Loader2, Plus } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  type LLMProviderName,
  LLMProviderNameSchema,
} from '@/core/provider/all-models';
import { validateApiKey } from '@/core/provider/validate-apikey';
import { DB } from '@/idb/db';
import { dbAtoms } from '@/idb/db-store';
import { getLogoByProvider } from '../helper/get-logo-by-provider';

const FormValuesSchema = z.object(
  Object.fromEntries(
    LLMProviderNameSchema.options.map(provider => [
      provider,
      z.string().optional(),
    ]),
  ) as Record<LLMProviderName, z.ZodOptional<z.ZodString>>,
);

type FormValuesType = z.infer<typeof FormValuesSchema>;

type StatusMap = Record<
  LLMProviderName,
  {
    isLoading: boolean;
    isValid: boolean;
  }
>;

const createInitialStatusMap = (): StatusMap =>
  Object.fromEntries(
    LLMProviderNameSchema.options.map(provider => [
      provider,
      { isLoading: false, isValid: false },
    ]),
  ) as StatusMap;

export const ApiKeyConfigModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { register, handleSubmit, setError, formState, setValue, reset } =
    useForm<FormValuesType>({
      resolver: zodResolver(FormValuesSchema),
      defaultValues: {},
    });

  const [statusMap, setStatusMap] = useState<StatusMap>(() =>
    createInitialStatusMap(),
  );

  const setConfig = useSetAtom(dbAtoms.configAtom);

  useLayoutEffect(() => {
    if (open) {
      // this modal is not unmounted. so we need to clear previous status.
      reset();

      const setInitialValue = async () => {
        const { apiKeys } = await DB.getConfig();

        LLMProviderNameSchema.options.forEach(providerName => {
          const apiKey = apiKeys[providerName];
          if (!apiKey) {
            setValue(providerName, '');
            return;
          }
          setValue(providerName, apiKey);
        });
      };

      void setInitialValue();
    }
  }, [open, setValue]);

  const handleValidateAndSave =
    (providerName: LLMProviderName) => async (values: FormValuesType) => {
      let isSuccessful = false;

      setStatusMap(prev => ({
        ...prev,
        [providerName]: {
          isLoading: true,
          isValid: false,
        },
      }));

      try {
        const apiKey = values[providerName];
        const error = new Error('invalid-api-key');

        if (!apiKey) {
          throw error;
        }

        const isValid = await validateApiKey({
          apiKey,
          providerName,
        });

        if (!isValid) {
          throw error;
        }

        isSuccessful = true;

        await setConfig({
          apiKeys: {
            [providerName]: apiKey,
          },
        });

        toast.success(`${providerName} API Key has been saved.`, {
          position: 'top-center',
          duration: 3000,
        });
      } catch (err) {
        setError(providerName, {
          message: 'Invalid API key. Please check your key and try again.',
        });
        return;
      } finally {
        setStatusMap(prev => ({
          ...prev,
          [providerName]: {
            isLoading: false,
            isValid: isSuccessful,
          },
        }));
      }
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
                {LLMProviderNameSchema.options.map(providerName => {
                  const { isLoading, isValid } = statusMap[providerName];
                  const error = formState.errors[providerName];

                  return (
                    <div key={providerName} className='flex flex-col gap-2'>
                      <div className='flex flex-row gap-2'>
                        <Label htmlFor={`${providerName}-api-key`}>
                          {getLogoByProvider(
                            providerName as LLMProviderName,
                            'size-4',
                          )}
                          {` ${providerName}`}
                        </Label>
                        {isLoading && (
                          <span className='text-yellow-500 text-xs'>
                            {`Validating ${providerName} API Key...`}
                          </span>
                        )}
                        {!isLoading && isValid && (
                          <span className='text-green-500 text-xs'>
                            {`${providerName} API Key is valid.`}
                          </span>
                        )}
                      </div>
                      <div className='flex flex-col gap-1'>
                        <div className='flex gap-1'>
                          <PasswordInput
                            {...register(providerName)}
                            showPassword={false}
                            id={`${providerName}-api-key`}
                            placeholder=''
                            autoFocus={false}
                          />
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleSubmit(
                              handleValidateAndSave(
                                providerName as LLMProviderName,
                              ),
                            )}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className='animate-spin' />
                            ) : (
                              <Plus />
                            )}
                          </Button>
                        </div>
                        {error?.message && (
                          <span className='text-red-500 text-xs'>
                            {error.message}
                          </span>
                        )}
                        <CardDescription className='text-xs mt-1'>
                          {`Your API key is stored in your browser's local storage.`}
                        </CardDescription>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
