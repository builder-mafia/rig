import { useSetAtom } from 'jotai';
import { useLayoutEffect } from 'react';
import { DB, DEFAULT_CHANNEL_ID } from '@/idb/db';
import { isDataBaseInitializedAtom } from '@/idb/idbStore';
import { currentChannelIdAtom } from '../store/currentChannelStore';

const getLastSelectedChannelId = async () => {
  const config = await DB.getConfig();
  return config?.lastSelectedChannelId;
};

const createDefaultChannel = async () => {
  return await DB.createChannel({
    id: DEFAULT_CHANNEL_ID,
    name: '기본 채널',
    createdAt: Date.now(),
  });
};

const getFirstChannel = async () => {
  const channels = await DB.getChannels();
  return channels.length === 0 ? null : channels[0];
};

const doInit = async () => {
  const lastSelectedChannelId = await getLastSelectedChannelId();
  const firstChannel = await getFirstChannel();
  if (!lastSelectedChannelId && !firstChannel) {
    const defaultChannelId = await createDefaultChannel();
    return defaultChannelId;
  }

  return lastSelectedChannelId ?? firstChannel!.id;
};

let isInit = false;

export const DataBaseInitializer = () => {
  const setDbInitialized = useSetAtom(isDataBaseInitializedAtom);
  const setCurrentChannelId = useSetAtom(currentChannelIdAtom);

  useLayoutEffect(() => {
    if (isInit) {
      return;
    }

    isInit = true;
    doInit().then(channelId => {
      setDbInitialized(true);
      setCurrentChannelId(channelId);
    });
  }, [setCurrentChannelId, setDbInitialized]);

  return null;
};
