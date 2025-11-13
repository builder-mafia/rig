import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type ChannelSchema, DB } from '@/idb/db';
import { channelListRefreshAtom } from '../store/channelListStore';

interface EditChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: z.infer<typeof ChannelSchema> | null;
}

export const EditChannelDialog = ({
  open,
  onOpenChange,
  channel,
}: EditChannelDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const setChannelListRefresh = useSetAtom(channelListRefreshAtom);

  useEffect(() => {
    if (channel) {
      setName(channel.name!);
      setDescription(channel.description || '');
      setPrompt(channel.prompt || '');
    }
  }, [channel]);

  const handleUpdate = async () => {
    if (!channel) return;

    if (!name.trim()) {
      toast.error('채널 이름을 입력해주세요.', {
        position: 'top-center',
      });
      return;
    }

    try {
      await DB.updateChannel(channel.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim() || undefined,
      });

      toast.success('채널이 성공적으로 수정되었습니다.', {
        position: 'top-center',
      });

      setChannelListRefresh(prev => prev + 1);
      onOpenChange(false);
    } catch (error) {
      toast.error('채널 수정에 실패했습니다.', {
        position: 'top-center',
      });
      console.error('Failed to update channel:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='p-6'>
        <DialogHeader>
          <DialogTitle>채널 정보 수정</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <span className='text-gray-800'>채널 정보를 수정할 수 있습니다.</span>
        </DialogDescription>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='channel-name'>채널 이름 *</Label>
            <Input
              id='channel-name'
              placeholder='채널 이름을 입력하세요'
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='channel-description'>설명</Label>
            <Input
              id='channel-description'
              placeholder='채널 설명을 입력하세요 (선택)'
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='channel-prompt'>기본 프롬프트</Label>
            <Textarea
              id='channel-prompt'
              placeholder='AI가 사용할 기본 프롬프트를 입력하세요 (선택)'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              maxLength={500}
              className='min-h-[120px] max-h-[300px]'
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>취소</Button>
          </DialogClose>
          <Button onClick={handleUpdate}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
