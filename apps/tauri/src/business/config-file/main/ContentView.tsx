import { use } from 'react';
import { ConfigFileWorkbenchContext } from '../ConfigFileWorkbenchProvider';
import { getLanguageFromPath } from '../configFileWorkbenchUtils';
import { ContentPlaceholderView } from './ContentPlaceholderView';
import { EditorView } from './EditorView';
import { PreviewActionsView } from './PreviewActionsView';

export const ContentView = () => {
  const context = use(ConfigFileWorkbenchContext);

  if (!context) {
    throw new Error(
      'ContentView must be used within ConfigFileWorkbenchProvider',
    );
  }

  if (!context.selectedConfigFile) {
    return (
      <ContentPlaceholderView
        title='No selection'
        description='Pick a file or folder from the sidebar'
        showIcon
      />
    );
  }

  if (context.selectedBrowserItem?.isDirectory) {
    return (
      <ContentPlaceholderView
        title='Folder selected'
        description='Choose a file inside this folder to start editing.'
      />
    );
  }

  if (context.isLoadingContent) {
    return (
      <ContentPlaceholderView title='Loading' description='Loading file...' />
    );
  }

  return (
    <div className='flex h-full min-h-0'>
      <div className='min-w-0 flex-1'>
        <EditorView
          language={
            context.selectedBrowserItem?.path
              ? getLanguageFromPath(context.selectedBrowserItem.path)
              : 'json'
          }
          value={context.editorValue}
          isReadOnly
          onChange={context.setEditorValue}
        />
      </div>
      <PreviewActionsView
        isDarkMode={context.isDarkMode}
        onOpenInFinder={() => {
          void context.openInFinder();
        }}
        onOpenInOpencode={() => {
          void context.openInOpencode();
        }}
        onOpenInZed={() => {
          void context.openInZed();
        }}
      />
    </div>
  );
};
