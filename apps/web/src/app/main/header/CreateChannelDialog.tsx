import { useSetAtom } from 'jotai';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
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
import { DB } from '@/idb/db';
import { channelListRefreshAtom } from '../store/channelListStore';
import { currentChannelIdAtom } from '../store/currentChannelStore';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateChannelDialog = ({
  open,
  onOpenChange,
}: CreateChannelDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const setCurrentChannelId = useSetAtom(currentChannelIdAtom);
  const setChannelListRefresh = useSetAtom(channelListRefreshAtom);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('채널 이름을 입력해주세요.', {
        position: 'top-center',
      });
      return;
    }

    try {
      const newChannelId = uuidv4();
      await DB.createChannel({
        id: newChannelId,
        name: name.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim() || undefined,
        createdAt: Date.now(),
      });

      toast.success('채널이 성공적으로 생성되었습니다.', {
        position: 'top-center',
      });

      // Switch to the newly created channel
      setCurrentChannelId(newChannelId);

      // Trigger channel list refresh
      setChannelListRefresh(prev => prev + 1);

      // Reset form
      setName('');
      setDescription('');
      setPrompt('');
      onOpenChange(false);
    } catch (error) {
      toast.error('채널 생성에 실패했습니다.', {
        position: 'top-center',
      });
      console.error('Failed to create channel:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='p-6'>
        <DialogHeader>
          <DialogTitle>새 채널 만들기</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <span className='text-gray-800'>
            채널 정보를 입력하여 새로운 채널을 만들 수 있습니다.
          </span>
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
          <Button onClick={handleCreate}>만들기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
