import { FileJson2, Folder } from 'lucide-react';

type Props = {
  isDirectory: boolean;
  iconUrl?: string | null;
  imageClassName?: string;
};

export const ConfigFileEntryIconView = ({
  isDirectory,
  iconUrl,
  imageClassName = 'size-5 rounded-sm object-cover border',
}: Props) => {
  if (iconUrl) {
    return <img src={iconUrl} alt='icon' className={imageClassName} />;
  }

  if (isDirectory) {
    return <Folder className='size-4 text-amber-500' />;
  }

  return <FileJson2 className='size-4 text-muted-foreground' />;
};
