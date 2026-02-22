import { StateSubject } from '@allin/utils';
import type { Observable } from 'rxjs';
import { v4 } from 'uuid';
import { channelGateway } from '@/lib/gateway/channel/channelGateway';
import type { StorageChannel } from '@/lib/gateway/channel/types';

export class ChannelManager {
  private static instance: ChannelManager;

  private _channels$ = new StateSubject<StorageChannel[]>([]);
  private _selectedChannelId$ = new StateSubject<string | null>(null);

  private constructor() {}

  public static getInstance() {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }
  public get channels(): StorageChannel[] {
    return this._channels$.getValue();
  }
  public get channels$(): Observable<StorageChannel[]> {
    return this._channels$.asObservable();
  }
  public get selectedChannelId(): string | null {
    return this._selectedChannelId$.getValue();
  }
  public get selectedChannelId$(): Observable<string | null> {
    return this._selectedChannelId$.asObservable();
  }
  public get selectedChannel(): StorageChannel | null {
    const id = this._selectedChannelId$.getValue();
    if (!id) return null;
    return this._channels$.getValue().find(c => c.id === id) ?? null;
  }

  public async fetchChannels() {
    const channels = await channelGateway.getAll();
    this._channels$.next(channels);
  }

  public async selectChannel(channelId: string) {
    this._selectedChannelId$.next(channelId);
  }

  public clearSelectedChannel() {
    this._selectedChannelId$.next(null);
  }

  public async createNewChannel(): Promise<StorageChannel> {
    const now = Date.now();
    const id = v4();

    const newChannel: StorageChannel = {
      id,
      agentId: 'default',
      title: null,
      description: null,
      pin: null,
      createdAt: now,
      updatedAt: now,
    };

    await channelGateway.create(newChannel);
    return newChannel;
  }

  public async deleteChannel(channelId: string) {
    await channelGateway.delete(channelId);
  }

  public async updateChannelTitle(channelId: string, title: string) {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) return;

    await channelGateway.update({
      ...channel,
      title,
    });
  }
}
