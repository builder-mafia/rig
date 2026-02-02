import { BehaviorSubject, type Observable } from 'rxjs';
import {
  createChannel,
  deleteChannel as deleteChannelApi,
  getChannels,
} from './storage/tauriStorageClient';
import type { StorageChannel } from './storage/types';

const DEFAULT_CHANNEL_ID = 'default';

export class ChannelState {
  private static instance: ChannelState;

  private channels$ = new BehaviorSubject<StorageChannel[]>([]);
  private selectedChannelId$ = new BehaviorSubject<string | null>(null);
  private initialized = false;

  private constructor() {}

  public static getInstance() {
    if (!ChannelState.instance) {
      ChannelState.instance = new ChannelState();
    }
    return ChannelState.instance;
  }

  public async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    const channels = await getChannels();

    if (channels.length === 0) {
      const now = Date.now();
      const newChannel: StorageChannel = {
        id: DEFAULT_CHANNEL_ID,
        agentId: 'default',
        title: null,
        description: null,
        pin: null,
        createdAt: now,
        updatedAt: now,
      };
      await createChannel(newChannel);
      this.channels$.next([newChannel]);
      this.selectedChannelId$.next(DEFAULT_CHANNEL_ID);
      return;
    }

    this.channels$.next(channels);
    this.selectedChannelId$.next(channels[0].id);
  }

  public getChannels(): StorageChannel[] {
    return this.channels$.getValue();
  }

  public getChannels$(): Observable<StorageChannel[]> {
    return this.channels$.asObservable();
  }

  public getSelectedChannelId(): string | null {
    return this.selectedChannelId$.getValue();
  }

  public getSelectedChannelId$(): Observable<string | null> {
    return this.selectedChannelId$.asObservable();
  }

  public getSelectedChannel(): StorageChannel | null {
    const id = this.selectedChannelId$.getValue();
    if (!id) return null;
    return this.channels$.getValue().find(c => c.id === id) ?? null;
  }

  public getSortedChannels(): {
    pinned: StorageChannel[];
    unpinned: StorageChannel[];
  } {
    const channels = this.channels$.getValue();
    const pinned = channels.filter(c => Boolean(c.pin));
    const unpinned = channels
      .filter(c => !c.pin)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return { pinned, unpinned };
  }

  public async selectChannel(channelId: string) {
    const prev = this.getSelectedChannel();
    const isGhost = prev && !prev.title;

    this.selectedChannelId$.next(channelId);

    if (isGhost && prev.id !== channelId) {
      await this.deleteChannel(prev.id);
    }
  }

  public async createNewChannel(): Promise<StorageChannel> {
    const now = Date.now();
    const id = crypto.randomUUID();
    const newChannel: StorageChannel = {
      id,
      agentId: 'default',
      title: null,
      description: null,
      pin: null,
      createdAt: now,
      updatedAt: now,
    };

    await createChannel(newChannel);
    this.channels$.next([...this.channels$.getValue(), newChannel]);
    this.selectedChannelId$.next(id);
    return newChannel;
  }

  public async deleteChannel(channelId: string) {
    await deleteChannelApi(channelId);
    const remaining = this.channels$.getValue().filter(c => c.id !== channelId);
    this.channels$.next(remaining);

    if (this.selectedChannelId$.getValue() === channelId) {
      this.selectedChannelId$.next(remaining[0]?.id ?? null);
    }
  }

  public async refresh() {
    const channels = await getChannels();
    this.channels$.next(channels);
  }
}
