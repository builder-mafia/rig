import { BehaviorSubject, type Observable } from 'rxjs';
import { channelGateway } from '@/lib/gateway/channel/channelGateway';
import { messageGateway } from '@/lib/gateway/message/messageGateway';
import type { StorageChannel } from './storage/types';

export class ChannelManager {
  private static instance: ChannelManager;

  private _channels$ = new BehaviorSubject<StorageChannel[]>([]);
  private _selectedChannelId$ = new BehaviorSubject<string | null>(null);
  // Temporarily holds a message when a channel is created with an initial message.
  // ChatFacade is initialized asynchronously after channel creation, so the message
  // is stored here and consumed by useChat once ChatFacade becomes ready.
  private _pendingMessage$ = new BehaviorSubject<string | null>(null);
  private initialized = false;

  private constructor() {}

  public static getInstance() {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }

  public async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    const channels = await channelGateway.getAll();
    this._channels$.next(channels);
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

  public get sortedChannels(): {
    pinned: StorageChannel[];
    unpinned: StorageChannel[];
  } {
    const channels = this._channels$.getValue();
    const pinned = channels.filter(c => Boolean(c.pin));
    const unpinned = channels
      .filter(c => !c.pin)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return { pinned, unpinned };
  }

  public get pendingMessage(): string | null {
    return this._pendingMessage$.getValue();
  }

  public get pendingMessage$(): Observable<string | null> {
    return this._pendingMessage$.asObservable();
  }

  public setPendingMessage(message: string | null) {
    this._pendingMessage$.next(message);
  }

  public async selectChannel(channelId: string) {
    const prev = this.selectedChannel;
    this._selectedChannelId$.next(channelId);

    if (prev && prev.id !== channelId) {
      const messages = await messageGateway.getAll(prev.id);
      if (messages.length === 0) {
        await this.deleteChannel(prev.id);
      }
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

    await channelGateway.create(newChannel);
    this._channels$.next([...this._channels$.getValue(), newChannel]);
    this._selectedChannelId$.next(id);
    return newChannel;
  }

  public async deleteChannel(channelId: string) {
    await channelGateway.delete(channelId);
    const remaining = this._channels$.getValue().filter(c => c.id !== channelId);
    this._channels$.next(remaining);

    if (this._selectedChannelId$.getValue() === channelId) {
      this._selectedChannelId$.next(remaining[0]?.id ?? null);
    }
  }

  public async refresh() {
    const channels = await channelGateway.getAll();
    this._channels$.next(channels);
  }

  public clearSelection() {
    this._selectedChannelId$.next(null);
  }

  public async createChannelWithMessage(
    message: string,
  ): Promise<StorageChannel> {
    this._pendingMessage$.next(message);
    return this.createNewChannel();
  }
}
